<script setup lang="ts">
  import { ref, computed, onMounted, nextTick } from 'vue';
  import { useToast } from 'primevue';
  import { updatePostBundle, createPostBundle } from '@api/scheduledPostApi';
  import connectionsDataStore from '@/utils/connectionsDataStore';
  import DatePicker from 'primevue/datepicker';
  import { Image as ImageIcon, Video, Smile } from 'lucide-vue-next';
  import 'emoji-picker-element';
  import scheduledPostsStore from '@/utils/scheduledPostsStore';
  import PlatformButton from '@/components/common/buttons/PlatformButton.vue';
  import Select from 'primevue/select';
  import { uploadVideoToS3 } from '@/api/mediaApi';
  import BaseButton from '@/components/common/buttons/BaseButton.vue';
  import { getCreatorInfo } from '@api/tiktokApi';
  import TikTokPresets from '@/components/common/forms/PostFormBase/TikTokPresets.vue';
  import InstagramPresets from '@/components/common/forms/PostFormBase/InstagramPresets.vue';
  import PreviewComponent from '@/components/common/forms/PostFormBase/PreviewComponent.vue';
  import YouTubePresets from '@/components/common/forms/PostFormBase/YouTubePresets.vue';

  const props = defineProps<{
    mode: 'create' | 'edit';
    postId?: string;
    initialContent?: string;
    initialDateTime?: Date | null;
    initialPlatforms?: string[];
    initialMedia?: { url: string }[];
    initialStatus?: string;
    initialMediaType?: 'image' | 'video';
    initialPosts?: any[];
    initialVideoTimestamp?: number;
  }>();

  const emit = defineEmits<{
    (e: 'cancel'): void;
  }>();

  const content = ref<string>(props.initialContent || '');
  const scheduledTime = ref<Date>(
    props.initialDateTime instanceof Date ? props.initialDateTime : new Date()
  );
  const selectedPlatforms = ref<string[]>(props.initialPlatforms || []);
  const selectedMedia = ref<File[]>([]);
  const mediaPreviewUrls = ref<string[]>(
    props.initialMedia?.map((m) => m.url) || []
  );
  const initialMediaUrls = ref<string[]>(
    props.initialMedia?.map((m) => m.url) || []
  );
  const toast = useToast();
  const currentMediaType = ref<'image' | 'video' | null>(
    props.initialMediaType || null
  );
  const uploadProgress = ref<number>(0);
  const isUploading = ref<boolean>(false);
  const videoS3Key = ref<string | null>(null);
  const videoRef = ref<HTMLVideoElement | null>(null);
  const videoTimestamp = ref<number>(props.initialVideoTimestamp || 0);
  const handleVideoRefUpdate = (ref: HTMLVideoElement | null) => {
    videoRef.value = ref;
  };

  const handleTimestampUpdate = (timestamp: number) => {
    videoTimestamp.value = timestamp;
  };

  const tiktokSettings = ref({
    viewerSetting: {
      label: '',
      value: '',
    },
    allowComments: false,
    allowDuet: false,
    allowStitch: false,
    commercialContent: false,
    brandOrganic: false,
    brandedContent: false,
  });

  const instagramSettings = ref<{ videoType: 'REELS' | 'STORIES' }>({
    videoType: 'REELS',
  });

  const youtubeSettings = ref<{
    privacy: 'private' | 'public' | 'unlisted';
    title: string;
  }>({
    privacy: 'public',
    title: '',
  });

  // Populate settings from InitialPosts
  if (props.initialPosts) {
    // Populate TikTok settings from initialPosts if available
    const tiktokPost = props.initialPosts.find(
      (post) => post.platform === 'tiktok'
    );
    if (tiktokPost?.platformSettings?.tiktok) {
      tiktokSettings.value = {
        viewerSetting: {
          label: tiktokPost.platformSettings.tiktok.viewerSetting,
          value: tiktokPost.platformSettings.tiktok.viewerSetting,
        },
        allowComments: tiktokPost.platformSettings.tiktok.allowComments,
        allowDuet: tiktokPost.platformSettings.tiktok.allowDuet,
        allowStitch: tiktokPost.platformSettings.tiktok.allowStitch,
        commercialContent: tiktokPost.platformSettings.tiktok.commercialContent,
        brandOrganic: tiktokPost.platformSettings.tiktok.brandOrganic,
        brandedContent: tiktokPost.platformSettings.tiktok.brandedContent,
      };
    }

    // Populate Instagram settings from initialPosts if available
    const instagramPost = props.initialPosts.find(
      (post) => post.platform === 'instagram'
    );
    if (instagramPost?.platformSettings?.instagram) {
      instagramSettings.value = {
        videoType: instagramPost.platformSettings.instagram.videoType,
      };
    }

    const youtubePost = props.initialPosts.find(
      (post) => post.platform === 'youtube'
    );
    if (youtubePost?.platformSettings?.youtube) {
      youtubeSettings.value = {
        privacy: youtubePost.platformSettings.youtube.privacy,
        title: youtubePost.platformSettings.youtube.title,
      };
    }
  }

  const handleTikTokSettingsUpdate = (settings: any) => {
    tiktokSettings.value = settings;
  };

  const handleInstagramSettingsUpdate = (settings: any) => {
    instagramSettings.value = settings;
  };

  const handleYoutubeSettingsUpdate = (settings: any) => {
    youtubeSettings.value = settings;
  };

  const validationErrors = computed(() => {
    const errors = [];

    // Check if media is currently uploading
    if (isUploading.value) {
      errors.push('Please wait for media upload to complete');
    }

    // TikTok errors
    if (selectedPlatforms.value.some((p) => p.startsWith('tiktok'))) {
      // 1. Check if media is uploaded
      if (mediaPreviewUrls.value.length === 0) {
        errors.push('Please upload a video for your TikTok post');
      } else if (
        currentMediaType.value === 'video' &&
        !isVideoDurationValid.value
      ) {
        const maxDuration =
          connectionsDataStore.tiktokAccount.value?.creatorInfo
            .max_video_post_duration_sec;
        errors.push(
          `Video duration exceeds maximum allowed length of ${maxDuration} seconds`
        );
      } else if (currentMediaType.value === 'image') {
        errors.push('Images are not supported for TikTok posts');
      }

      // 2. Check if viewer setting is selected
      if (!tiktokSettings.value.viewerSetting) {
        errors.push('Please select who can view your post');
      }

      // 3. Check commercial content settings
      if (
        tiktokSettings.value.commercialContent &&
        !tiktokSettings.value.brandOrganic &&
        !tiktokSettings.value.brandedContent
      ) {
        errors.push(
          'You need to indicate if your content promotes yourself, a third party, or both.'
        );
      }
    }

    // Instagram errors
    if (selectedPlatforms.value.some((p) => p.startsWith('instagram'))) {
      // 1. Check if media is uploaded
      if (mediaPreviewUrls.value.length === 0) {
        errors.push('Please upload a video or image for your Instagram post');
      }

      // 2. Check video duration limits for Reels and Stories
      if (currentMediaType.value === 'video' && videoRef.value) {
        const duration = Math.floor(videoRef.value.duration);
        const maxDuration =
          instagramSettings.value.videoType === 'REELS' ? 900 : 60;
        const durationText =
          instagramSettings.value.videoType === 'REELS'
            ? '15 minutes'
            : '1 minute';

        if (duration > maxDuration) {
          errors.push(
            `Video duration exceeds maximum allowed length of ${durationText} for Instagram ${instagramSettings.value.videoType.toLowerCase()}`
          );
        }
      }
    }

    return errors;
  });

  const isVideoDurationValid = computed(() => {
    if (
      uploadProgress.value < 100 ||
      !videoRef.value ||
      currentMediaType.value !== 'video'
    ) {
      return true; // Assume valid while upload is in progress or metadata isn't loaded
    }
    const maxDuration =
      connectionsDataStore.tiktokAccount.value?.creatorInfo
        .max_video_post_duration_sec || Infinity;

    return Math.floor(videoRef.value.duration) <= maxDuration;
  });

  const PLATFORM_LIMITS = {
    twitter: 280,
    threads: 500,
    bluesky: 300,
  };
  const status = ref<string>(props.initialStatus || 'draft');
  const statusOptions = [
    { label: 'Scheduled', value: 'scheduled' },
    { label: 'Draft', value: 'draft' },
  ];
  const maxCharacterLimit = computed(() => {
    if (selectedPlatforms.value.length === 0) return Infinity;
    return Math.min(
      ...selectedPlatforms.value.map(
        (platform) =>
          PLATFORM_LIMITS[
            platform.toLowerCase() as keyof typeof PLATFORM_LIMITS
          ]
      )
    );
  });

  const isOverCharacterLimit = computed(() => {
    return content.value.length > maxCharacterLimit.value;
  });

  const canSavePost = computed(() => {
    if (currentMediaType.value === 'video') {
      // In edit mode with existing video (no new upload), allow saving
      if (
        props.mode === 'edit' &&
        props.initialMediaType === 'video' &&
        mediaPreviewUrls.value.length > 0 &&
        mediaPreviewUrls.value[0] === props.initialMedia?.[0]?.url
      ) {
        return validationErrors.value.length === 0;
      }
      // For new video uploads (both create and edit modes), require successful upload
      return (
        !!videoS3Key.value &&
        uploadProgress.value === 100 &&
        validationErrors.value.length === 0
      );
    }
    return validationErrors.value.length === 0;
  });

  const canPublishToTikTok = computed(() => {
    if (!selectedPlatforms.value.some((p) => p.startsWith('tiktok')))
      return true;
    if (
      tiktokSettings.value.commercialContent &&
      !tiktokSettings.value.brandOrganic &&
      !tiktokSettings.value.brandedContent
    )
      return false;
    return true;
  });

  async function handleMediaSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const files = Array.from(input.files);
      const isVideo = input.accept.includes('video');

      // If it's a video, only allow one video per post
      if (isVideo) {
        if (mediaPreviewUrls.value.length > 0) {
          toast.add({
            severity: 'warn',
            summary: 'Media limit exceeded',
            detail: 'You can only add one video per post',
            life: 3000,
          });
          return;
        }
        const videoFile = files[0];
        if (videoFile.size > 512 * 1024 * 1024) {
          // 512MB limit
          toast.add({
            severity: 'error',
            summary: 'File too large',
            detail: 'Video file size must be less than 512MB',
            life: 3000,
          });
          return;
        }

        const url = URL.createObjectURL(videoFile);
        mediaPreviewUrls.value = [url];
        selectedMedia.value = [videoFile];
        currentMediaType.value = 'video';

        try {
          // Start upload to S3
          uploadProgress.value = 0;
          isUploading.value = true;
          videoS3Key.value = await uploadVideoToS3(videoFile, (progress) => {
            uploadProgress.value = progress;
          });

          toast.add({
            severity: 'success',
            summary: 'Upload complete',
            detail: 'Video uploaded successfully',
            life: 3000,
          });
        } catch (error) {
          console.error('Failed to upload video:', error);
          toast.add({
            severity: 'error',
            summary: 'Upload failed',
            detail: 'Failed to upload video. Please try again.',
            life: 3000,
          });
          return;
        } finally {
          isUploading.value = false;
        }
        return;
      }

      // For images, keep existing logic with 4 images max
      const totalAllowedMedia = 4;
      const currentMediaCount = mediaPreviewUrls.value.length;
      const remainingSlots = totalAllowedMedia - currentMediaCount;

      if (remainingSlots <= 0) {
        toast.add({
          severity: 'warn',
          summary: 'Maximum media limit',
          detail: 'You can only add up to 4 media files per post',
          life: 3000,
        });
        return;
      }

      const newFiles = files.slice(0, remainingSlots);
      selectedMedia.value.push(...newFiles);
      currentMediaType.value = 'image';

      // Create preview URLs
      newFiles.forEach((file) => {
        const url = URL.createObjectURL(file);
        mediaPreviewUrls.value.push(url);
      });
    }
  }

  function removeMedia(index: number) {
    const urlToRemove = mediaPreviewUrls.value[index];
    const isInitialMedia = initialMediaUrls.value.includes(urlToRemove);

    // Remove URL from preview
    URL.revokeObjectURL(mediaPreviewUrls.value[index]);
    mediaPreviewUrls.value.splice(index, 1);

    // Only remove from selectedMedia if it's not an initial media
    if (!isInitialMedia) {
      selectedMedia.value.splice(index, 1);
    }

    // Reset currentMediaType if no media left
    if (mediaPreviewUrls.value.length === 0) {
      currentMediaType.value = null;
    }
  }

  const handlePhotoUpload = () => {
    if (currentMediaType.value === 'video') {
      toast.add({
        severity: 'warn',
        summary: 'Media type mismatch',
        detail:
          'Cannot add photos when a video is present. Remove the video first.',
        life: 3000,
      });
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = handleMediaSelect;
    input.click();
  };

  const handleVideoUpload = () => {
    if (currentMediaType.value === 'image') {
      toast.add({
        severity: 'warn',
        summary: 'Media type mismatch',
        detail:
          'Cannot add a video when photos are present. Remove the photos first.',
        life: 3000,
      });
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';
    input.multiple = false;
    input.onchange = handleMediaSelect;
    input.click();
  };

  const togglePlatform = async (account: any) => {
    const accountId = (() => {
      switch (account.platform) {
        case 'twitter':
          return `twitter-${account.id}`;
        case 'threads':
          return `threads-${account.id}`;
        case 'bluesky':
          return `bluesky-${account.id}`;
        case 'mastodon':
          return `mastodon-${account.id}`;
        case 'tiktok':
          return `tiktok-${account.id}`;
        case 'instagram':
          return `instagram-${account.id}`;
        case 'youtube':
          return `youtube-${account.id}`;
        default:
          return account.platform;
      }
    })();
    const index = selectedPlatforms.value.indexOf(accountId);
    if (index === -1) {
      selectedPlatforms.value.push(accountId);
    } else {
      selectedPlatforms.value.splice(index, 1);
    }
    if (account.platform === 'tiktok') {
      await getCreatorInfo(account.id);
    }
  };

  async function handlePost(action: 'update' | 'schedule' | 'draft') {
    if (isOverCharacterLimit.value) {
      toast.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Content exceeds character limit for selected platforms',
        life: 3000,
      });
      return;
    }

    try {
      // Validate content
      const hasContent = content.value.trim() !== '';
      const hasMedia = mediaPreviewUrls.value.length > 0;
      if (!hasContent && !hasMedia) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Please enter some content or add media for your post',
          life: 3000,
        });
        return;
      }

      // Validate platforms
      if (selectedPlatforms.value.length === 0) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Please select at least one platform',
          life: 3000,
        });
        return;
      }

      const formData = new FormData();

      // Add common post details
      formData.append('content', content.value);
      formData.append('scheduledTime', scheduledTime.value.toISOString());
      formData.append('platforms', JSON.stringify(selectedPlatforms.value));
      formData.append('sameContent', 'true');

      // Set status based on action
      const postStatus =
        action === 'schedule'
          ? 'scheduled'
          : action === 'draft'
            ? 'draft'
            : status.value;
      formData.append('status', postStatus);

      // Handle media
      if (action === 'update') {
        const keptMediaUrls = mediaPreviewUrls.value.filter((url) =>
          initialMediaUrls.value.includes(url)
        );
        formData.append('keptMediaUrls', JSON.stringify(keptMediaUrls));
      }

      if (currentMediaType.value === 'video' && videoS3Key.value) {
        formData.append('videoS3Key', videoS3Key.value);
      }

      if (currentMediaType.value === 'image') {
        selectedMedia.value.forEach((file) => {
          formData.append('media', file);
        });
      }

      // Add TikTok settings
      if (selectedPlatforms.value.some((p) => p.startsWith('tiktok'))) {
        formData.append(
          'tiktokSettings',
          JSON.stringify({
            viewerSetting: tiktokSettings.value.viewerSetting.value,
            allowComments: tiktokSettings.value.allowComments,
            allowDuet: tiktokSettings.value.allowDuet,
            allowStitch: tiktokSettings.value.allowStitch,
            commercialContent: tiktokSettings.value.commercialContent,
            brandOrganic: tiktokSettings.value.brandOrganic,
            brandedContent: tiktokSettings.value.brandedContent,
          })
        );
      }

      // Add Instagram settings
      if (selectedPlatforms.value.some((p) => p.startsWith('instagram'))) {
        formData.append(
          'instagramSettings',
          JSON.stringify({
            videoType: instagramSettings.value.videoType,
          })
        );
      }

      if (selectedPlatforms.value.some((p) => p.startsWith('youtube'))) {
        formData.append(
          'youtubeSettings',
          JSON.stringify({
            privacy: youtubeSettings.value.privacy,
            title: youtubeSettings.value.title,
          })
        );
      }

      formData.append('videoTimestamp', videoTimestamp.value.toString());

      // Send request based on action
      if (action === 'update') {
        await updatePostBundle(props.postId!, formData);
      } else {
        await createPostBundle(formData);
      }

      // Update store and close modal
      await scheduledPostsStore.updateScheduledPostDataStore();
      emit('cancel');

      // Show success message
      const successMessages = {
        update: 'Post updated successfully!',
        schedule: 'Post scheduled successfully!',
        draft: 'Post saved as draft!',
      };

      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: successMessages[action],
        life: 3000,
      });

      // Reset form
      content.value = '';
      selectedPlatforms.value = [];
      selectedMedia.value = [];
      mediaPreviewUrls.value.forEach((url) => URL.revokeObjectURL(url));
      mediaPreviewUrls.value = [];
    } catch (error: any) {
      const errorMessages = {
        update: 'Failed to update post',
        schedule: 'Failed to schedule post',
        draft: 'Failed to save draft',
      };

      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.response?.data?.message || errorMessages[action],
        life: 3000,
      });
    }
  }

  const showEmojiPicker = ref(false);
  const emojiPickerRef = ref<HTMLDivElement | null>(null);
  const emojiButtonRef = ref<HTMLButtonElement | null>(null);

  // ✅ Close picker when clicking outside
  const handleClickOutside = (event: MouseEvent) => {
    if (
      emojiPickerRef.value &&
      !emojiPickerRef.value.contains(event.target as Node) &&
      emojiButtonRef.value &&
      !emojiButtonRef.value.contains(event.target as Node)
    ) {
      showEmojiPicker.value = false;
    }
  };

  const toggleEmojiPicker = async () => {
    showEmojiPicker.value = !showEmojiPicker.value;

    if (showEmojiPicker.value) {
      await nextTick(); // Wait for Vue to update the DOM

      if (!emojiPickerRef.value) return;

      emojiPickerRef.value.innerHTML = ''; // Clear any previous pickers
      const picker = document.createElement('emoji-picker');

      picker.addEventListener('emoji-click', (event: any) => {
        handleEmojiSelect(event);
      });

      emojiPickerRef.value.appendChild(picker);
    }
  };

  const handleEmojiSelect = (event: any) => {
    const emoji = event.detail.unicode; // Correctly access the selected emoji
    if (!emoji) return;

    // Insert emoji into the text content at cursor position
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;

    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = content.value;

      content.value = text.substring(0, start) + emoji + text.substring(end);

      // Move cursor after the inserted emoji
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        textarea.focus();
      });
    }

    // ✅ Hide the picker after selecting an emoji
    // showEmojiPicker.value = false;
  };

  onMounted(async () => {
    document.addEventListener('click', handleClickOutside);

    if (props.initialPlatforms?.some((p) => p.startsWith('tiktok'))) {
      await getCreatorInfo(
        props.initialPlatforms?.[0].split('-').slice(1).join('-')
      );
    }
  });
</script>

<template>
  <div class="transition-container flex items-start justify-center gap-4">
    <!-- Left Component (Scheduling Form) -->
    <div
      class="scheduling-form flex h-fit min-h-[600px] w-[600px] rounded-[10px] border border-[#d8d8d8] bg-[white] dark:bg-[#121212]"
    >
      <div class="flex h-auto w-full flex-col gap-2 p-4">
        <h2 class="flex w-[200px] items-center text-xl">
          {{ mode === 'edit' ? 'Edit Post' : 'Create Post' }}
        </h2>
        <div v-if="props.mode === 'edit'" class="mb-4 flex items-center gap-2">
          <Select
            v-model="status"
            :options="statusOptions"
            optionLabel="label"
            optionValue="value"
            class="w-[150px]"
          ></Select>
        </div>

        <div class="">
          <div class="flex flex-wrap gap-2">
            <PlatformButton
              v-for="account in connectionsDataStore.connectedAccounts.value"
              :key="account.id"
              :account="account"
              :is-selected="
                selectedPlatforms.includes(
                  account.platform === 'twitter'
                    ? `twitter-${account.id}`
                    : account.platform === 'threads'
                      ? `threads-${account.id}`
                      : account.platform === 'bluesky'
                        ? `bluesky-${account.id}`
                        : account.platform === 'mastodon'
                          ? `mastodon-${account.id}`
                          : account.platform === 'tiktok'
                            ? `tiktok-${account.id}`
                            : account.platform === 'instagram'
                              ? `instagram-${account.id}`
                              : account.platform === 'youtube'
                                ? `youtube-${account.id}`
                                : account.platform
                )
              "
              :onClick="() => togglePlatform(account)"
            />
          </div>
          <!-- <div v-for="account in connectionsDataStore.connectedAccounts.value">
          {{ account }}
        </div> -->
        </div>

        <div class="flex h-full w-full gap-8">
          <!-- Form Panel -->
          <div class="flex h-auto w-full flex-1 flex-col">
            <div
              class="text-area-container-with-buttons relative flex h-fit w-full flex-col rounded-[8px] dark:border-[#313131] dark:bg-[#1a1a1a]"
            >
              <textarea
                ref="textareaRef"
                v-model="content"
                :maxlength="maxCharacterLimit"
                :class="{ 'border-red-500': isOverCharacterLimit }"
                class="h-[300px] w-full resize-none rounded-lg bg-white p-2 text-black dark:bg-[#1a1a1a]"
                placeholder="Write your post content..."
              ></textarea>
              <div class="flex items-center justify-between gap-2">
                <button
                  @click="handlePhotoUpload"
                  class="flex items-center gap-1 rounded-md px-2 py-1 text-sm text-gray-700 hover:bg-gray-50 dark:hover:bg-[#303030]"
                >
                  <ImageIcon class="h-4 w-4" />
                  Photo
                </button>
                <button
                  @click="handleVideoUpload"
                  class="flex items-center gap-1 rounded-md px-2 py-1 text-sm text-gray-700 hover:bg-gray-50 dark:hover:bg-[#303030]"
                >
                  <Video class="h-4 w-4"></Video>
                  Video
                </button>
                <button
                  ref="emojiButtonRef"
                  @click="toggleEmojiPicker"
                  class="relative flex items-center gap-1 rounded-md px-2 py-1 text-sm text-gray-700 hover:bg-gray-50 dark:hover:bg-[#303030]"
                  :class="{ 'bg-gray-200 dark:bg-[#404040]': showEmojiPicker }"
                >
                  <Smile class="h-4 w-4" />
                  Emoji
                </button>
                <!-- Emoji Picker -->
                <div
                  v-if="showEmojiPicker"
                  ref="emojiPickerRef"
                  class="absolute left-1/2 top-full z-50 -translate-x-1/2 rounded-lg border shadow-lg"
                >
                  <emoji-picker></emoji-picker>
                </div>
                <div
                  class="ml-auto text-sm"
                  :class="{ 'text-red-500': isOverCharacterLimit }"
                >
                  {{ content.length }}/{{
                    maxCharacterLimit === Infinity ? '∞' : maxCharacterLimit
                  }}
                </div>
              </div>
            </div>

            <!-- Upload progress -->
            <div
              v-if="uploadProgress > 0 && uploadProgress < 100"
              class="h-5 bg-[red]"
            >
              <div
                class="h-full bg-blue-500 transition-all duration-300"
                :style="{ width: uploadProgress + '%' }"
              >
                {{ uploadProgress }}%
              </div>
            </div>

            <div class="mb-4"></div>

            <!-- Settings Panel -->
            <div class="flex flex-col gap-1">
              <TikTokPresets
                v-if="
                  selectedPlatforms.some((platform) =>
                    platform.startsWith('tiktok')
                  )
                "
                :currentMediaType="currentMediaType"
                :initialSettings="tiktokSettings"
                @update:settings="handleTikTokSettingsUpdate"
              />
              <InstagramPresets
                v-if="
                  selectedPlatforms.some((platform) =>
                    platform.startsWith('instagram')
                  )
                "
                :currentMediaType="currentMediaType"
                :initialSettings="instagramSettings"
                @update:settings="handleInstagramSettingsUpdate"
              />
              <YouTubePresets
                v-if="
                  selectedPlatforms.some((platform) =>
                    platform.startsWith('youtube')
                  )
                "
                :currentMediaType="currentMediaType"
                :initialSettings="youtubeSettings"
                @update:settings="handleYoutubeSettingsUpdate"
              />
            </div>

            <div class="mb-4 mt-4 flex w-full gap-5">
              <BaseButton @click="$emit('cancel')"> Back </BaseButton>
              <DatePicker
                v-model="scheduledTime"
                showTime
                showIcon
                :showSeconds="false"
                hourFormat="12"
                class="w-[250px]"
              />

              <button
                v-if="props.mode === 'edit'"
                @click="() => handlePost('update')"
                :disabled="!canSavePost || !canPublishToTikTok"
                :class="[
                  'mr-auto rounded-lg px-4 py-2 font-medium text-white',
                  canSavePost && canPublishToTikTok
                    ? 'bg-green hover:bg-greenLight'
                    : 'cursor-not-allowed bg-blue-300',
                ]"
              >
                Update
              </button>

              <button
                v-if="props.mode === 'create'"
                @click="() => handlePost('schedule')"
                :disabled="validationErrors.length > 0"
                class="group relative"
                :class="[
                  'rounded-lg px-4 py-2 font-medium text-white',
                  validationErrors.length === 0
                    ? 'bg-green hover:bg-greenLight'
                    : 'cursor-not-allowed bg-blue-300',
                ]"
              >
                Schedule
                <!-- Validation Messages Tooltip -->
                <div
                  v-if="validationErrors.length > 0"
                  class="absolute bottom-full left-1/2 mb-2 hidden w-[400px] -translate-x-1/2 rounded-lg border border-gray-900 bg-[white] p-2 text-sm text-gray-900 group-hover:block"
                >
                  <div class="flex flex-col items-start justify-start gap-1">
                    <div
                      v-for="(error, index) in validationErrors"
                      :key="index"
                    >
                      • {{ error }}
                    </div>
                  </div>
                  <!-- Arrow -->
                  <div
                    class="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-900"
                  ></div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Right Component (Preview) -->
    <div
      :class="currentMediaType ? 'w-[400px]' : 'w-[0px] border-0'"
      class="preview-container overflow-hidden rounded-[10px] rounded-r-[10px] border border-[#d8d8d8] bg-[white] dark:bg-[#313131]"
    >
      <PreviewComponent
        :content="content"
        :selected-platforms="selectedPlatforms"
        :media-preview-urls="mediaPreviewUrls"
        :current-media-type="currentMediaType"
        :initial-video-timestamp="videoTimestamp"
        @update:videoRef="handleVideoRefUpdate"
        @update:timestamp="handleTimestampUpdate"
        @removeMedia="removeMedia"
      />
    </div>
  </div>
</template>

<style scoped>
  /* Left component transition */
  .scheduling-form {
    transition: all 0.5s ease-in-out;
  }

  /* Right component transition */
  .preview-container {
    overflow: hidden;
    transition: all 0.5s ease-in-out;
  }
</style>

<style>
  .p-datepicker-input {
    background: white !important;
    box-shadow: none !important;
    border: 1px solid #e5e7eb !important;
    width: 220px !important;
  }

  .dark .p-datepicker-input {
    background: #121212 !important;
    box-shadow: none !important;
    border: 1px solid #313131 !important;
  }

  .p-datepicker-input:focus {
    border: 1px solid #a9a9a9 !important;
  }

  .dark .p-datepicker-input:focus {
    border: 1px solid #a9a9a9 !important;
  }

  .p-datepicker-input:active {
    border: 1px solid black !important;
  }

  .p-datepicker-dropdown {
    background: white !important;
    border-right: 1px solid #e5e7eb !important;
    border-bottom: 1px solid #e5e7eb !important;
    border-top: 1px solid #e5e7eb !important;
  }

  .dark .p-datepicker-dropdown {
    background: white !important;
    border-right: 1px solid #313131 !important;
    border-bottom: 1px solid #313131 !important;
    border-top: 1px solid #313131 !important;
  }

  .dark .p-datepicker-dropdown {
    background: #121212 !important;
  }

  .p-datepicker-dropdown:hover {
    background-color: rgb(170, 170, 170) !important;
  }

  .dark .p-datepicker-dropdown:hover {
    background-color: rgb(64, 64, 64) !important;
  }

  .p-datepicker-panel {
    background-color: white !important;
  }

  .dark .p-datepicker-panel {
    background-color: #121212 !important;
  }

  .p-datepicker-panel span {
    color: black !important;
  }

  .dark .p-datepicker-panel span {
    color: #d9d9d9 !important;
  }

  .p-datepicker-header {
    background-color: white !important;
  }

  .dark .p-datepicker-header {
    background-color: #121212 !important;
  }

  .p-datepicker-header button {
    color: black !important;
  }

  .dark .p-datepicker-header button {
    color: #d9d9d9 !important;
  }

  .p-inputtext {
    color: black !important;
  }

  .dark .p-inputtext {
    color: #d9d9d9 !important;
  }

  .dark .p-datepicker-day-selected {
    background-color: green !important;
  }

  .p-select {
    background-color: white !important;
    border: 1px solid black !important;
  }

  .dark .p-select {
    background-color: #121212 !important;
    border: 1px solid #d9d9d9 !important;
  }

  .p-select-label {
    color: black !important;
  }

  .dark .p-select-label {
    color: #d9d9d9 !important;
  }

  .p-select-overlay {
    background: white !important;
  }

  .dark .p-select-overlay {
    background: #121212 !important;
  }

  .p-select-option:hover {
    background: rgb(170, 170, 170) !important;
  }

  #tiktokMusicConsent {
    background-color: white !important;
    background: white !important;
    border: 1px solid black !important;
  }

  textarea {
    outline: none; /* Prevent default outline */
    border: none; /* Initial border */
    transition: border-color 0.3s ease; /* Smooth transition for any changes */
  }

  textarea:focus,
  textarea:active {
    outline: none; /* Prevent default outline */
    border: none; /* Ensure consistent border styling */
  }

  .text-area-container-with-buttons {
    outline: none; /* Prevent default outline */
    border: 1px solid #ececec; /* Initial border */
    transition: border-color 0.3s ease; /* Smooth transition for any changes */
  }
</style>
