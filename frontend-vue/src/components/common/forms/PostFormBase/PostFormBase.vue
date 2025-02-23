<script setup lang="ts">
  import { ref, computed, onMounted, nextTick, watch } from 'vue';
  import { useToast } from 'primevue';
  import connectionsDataStore from '@/utils/connectionsDataStore';
  import DatePicker from 'primevue/datepicker';
  import { updatePostGroup } from '@/helpers/savePostGroup';
  import {
    Image as ImageIcon,
    Video,
    Smile,
    Loader2,
    MoreHorizontal,
  } from 'lucide-vue-next';
  import 'emoji-picker-element';
  import PlatformButton from '@/components/common/buttons/PlatformButton.vue';
  import { uploadVideoToS3 } from '@/api/mediaApi';
  import { getCreatorInfo } from '@api/tiktokApi';
  import TikTokPresets from '@/components/common/forms/PostFormBase/TikTokPresets.vue';
  import InstagramPresets from '@/components/common/forms/PostFormBase/InstagramPresets.vue';
  import PreviewComponent from '@/components/common/forms/PostFormBase/PreviewComponent.vue';
  import YouTubePresets from '@/components/common/forms/PostFormBase/YouTubePresets.vue';
  import editorDataStore from '@/utils/editorDataStore';

  const toast = useToast();

  const isLoading = ref(true);
  const isSaving = ref(false);
  const postKey = computed(
    () => editorDataStore.selectedPost?.value._id || 'new'
  );

  const replicatedValue = ref('');

  const selectedMedia = ref<File[]>([]);
  const uploadProgress = ref(0);
  const videoS3Key = ref<string | null>(null);
  const videoRef = ref<HTMLVideoElement | null>(null);

  const handleVideoRefUpdate = (ref: HTMLVideoElement | null) => {
    videoRef.value = ref;
  };

  const handleTimestampUpdate = (timestamp: number) => {
    editorDataStore.selectedPost.value.videoTimestamp = timestamp;
  };

  // Watch to get creatorInfo for TikTok
  watch(
    () => editorDataStore.selectedPost.value,
    async () => {
      const tiktokPlatform =
        editorDataStore.selectedPost.value?.platforms?.find((p: any) =>
          p.startsWith('tiktok')
        );
      if (tiktokPlatform) {
        await getCreatorInfo(tiktokPlatform.split('-').slice(1).join('-'));
      }
    }
  );

  const validationErrors = computed(() => {
    const errors = [];

    // Check if media is currently uploading
    if (editorDataStore.isUploading.value) {
      errors.push('Please wait for media upload to complete');
    }

    // TikTok errors
    if (
      editorDataStore.selectedPost.value?.platforms.some((p: any) =>
        p.startsWith('tiktok')
      )
    ) {
      // 1. Check if media is uploaded
      if (editorDataStore.selectedPost.value.mediaPreviewUrls.length === 0) {
        errors.push('Please upload a video for your TikTok post');
      } else if (
        editorDataStore.currentMediaType.value === 'video' &&
        !isVideoDurationValid.value
      ) {
        const maxDuration =
          connectionsDataStore.tiktokAccount.value?.creatorInfo
            .max_video_post_duration_sec;
        errors.push(
          `Video duration exceeds maximum allowed length of ${maxDuration} seconds`
        );
      } else if (editorDataStore.currentMediaType.value === 'image') {
        errors.push('Images are not supported for TikTok posts');
      }

      // 2. Check if viewer setting is selected
      // if (!editorDataStore.tiktokSettings.value.viewerSetting) {
      //   errors.push('Please select who can view your post');
      // }

      // 3. Check commercial content settings
      // if (
      //   editorDataStore.tiktokSettings.value.commercialContent &&
      //   !editorDataStore.tiktokSettings.value.brandOrganic &&
      //   !editorDataStore.tiktokSettings.value.brandedContent
      // ) {
      //   errors.push(
      //     'You need to indicate if your content promotes yourself, a third party, or both.'
      //   );
      // }
    }

    // Instagram errors
    if (
      editorDataStore.selectedPost.value?.platforms.some((p: any) =>
        p.startsWith('instagram')
      )
    ) {
      // 1. Check if media is uploaded
      if (editorDataStore.selectedPost.value.mediaPreviewUrls.length === 0) {
        errors.push('Please upload a video or image for your Instagram post');
      }

      // 2. Check video duration limits for Reels and Stories
      if (
        editorDataStore.currentMediaType.value === 'video' &&
        videoRef.value
      ) {
        const duration = Math.floor(videoRef.value.duration);
        const maxDuration =
          editorDataStore.selectedPost.value?.platformSettings.instagram!
            .videoType === 'REELS'
            ? 900
            : 60;
        const durationText =
          editorDataStore.selectedPost.value?.platformSettings.instagram!
            .videoType === 'REELS'
            ? '15 minutes'
            : '1 minute';

        if (duration > maxDuration) {
          errors.push(
            `Video duration exceeds maximum allowed length of ${durationText} for Instagram ${editorDataStore.selectedPost.value?.platformSettings.instagram!.videoType.toLowerCase()}`
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
      editorDataStore.currentMediaType.value !== 'video'
    ) {
      return true; // Assume valid while upload is in progress or metadata isn't loaded
    }
    const maxDuration =
      connectionsDataStore.tiktokAccount.value?.creatorInfo
        .max_video_post_duration_sec || Infinity;

    return Math.floor(videoRef.value.duration) <= maxDuration;
  });

  const status = ref<string>(
    editorDataStore.selectedPost.value?.status || 'draft'
  );

  async function handleMediaSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const files = Array.from(input.files);
      const isVideo = input.accept.includes('video');

      // If it's a video, only allow one video per post
      if (isVideo) {
        if (editorDataStore.selectedPost.value.mediaPreviewUrls.length > 0) {
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
        editorDataStore.selectedPost.value.mediaPreviewUrls = [url];
        selectedMedia.value = [videoFile];
        editorDataStore.currentMediaType.value = 'video';

        try {
          // Start upload to S3
          uploadProgress.value = 0;
          editorDataStore.isUploading.value = true;
          videoS3Key.value = await uploadVideoToS3(videoFile, (progress) => {
            uploadProgress.value = progress;
          });

          console.log('success: ', videoS3Key.value);

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
          editorDataStore.isUploading.value = false;
        }
        return;
      }

      // For images, keep existing logic with 4 images max
      const totalAllowedMedia = 4;
      const currentMediaCount =
        editorDataStore.selectedPost.value.mediaPreviewUrls.length;
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
      editorDataStore.currentMediaType.value = 'image';

      // Create preview URLs
      newFiles.forEach((file) => {
        const url = URL.createObjectURL(file);
        editorDataStore.selectedPost.value.mediaPreviewUrls.push(url);
      });
    }
  }

  function removeMedia(index: number) {
    const urlToRemove =
      editorDataStore.selectedPost.value.mediaPreviewUrls[index];
    const isInitialMedia =
      editorDataStore.selectedPost.value.initialMediaUrls.includes(urlToRemove);

    // Remove URL from preview
    URL.revokeObjectURL(
      editorDataStore.selectedPost.value.mediaPreviewUrls[index]
    );
    editorDataStore.selectedPost.value.mediaPreviewUrls.splice(index, 1);

    // Only remove from selectedMedia if it's not an initial media
    if (!isInitialMedia) {
      selectedMedia.value.splice(index, 1);
    }

    // Reset currentMediaType if no media left
    if (editorDataStore.selectedPost.value.mediaPreviewUrls.length === 0) {
      editorDataStore.currentMediaType.value = null;
    }
  }

  const handlePhotoUpload = () => {
    if (editorDataStore.currentMediaType.value === 'video') {
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
    if (editorDataStore.currentMediaType.value === 'image') {
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
    editorDataStore.isUserEdit.value = true;

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

    const index =
      editorDataStore.selectedPost.value?.platforms.indexOf(accountId);
    if (index === -1) {
      editorDataStore.selectedPost.value?.platforms.push(accountId);
    } else {
      editorDataStore.selectedPost.value?.platforms.splice(index, 1);
    }

    if (account.platform === 'tiktok') {
      await getCreatorInfo(account.id);
    }

    debouncedSave();
  };

  const showEmojiPicker = ref(false);
  const emojiPickerRef = ref<HTMLDivElement | null>(null);
  const emojiButtonRef = ref<HTMLButtonElement | null>(null);

  // Close picker when clicking outside
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
      editorDataStore.isUserEdit.value = true;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = editorDataStore.selectedPost.value?.content;

      const newContent =
        text?.substring(0, start) + emoji + text?.substring(end);
      editorDataStore.selectedPost.value!.content = newContent;

      debouncedSave();
      replicatedValue.value = newContent;

      // Move cursor after the inserted emoji
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        textarea.focus();
      });
    }

    // Hide the picker after selecting an emoji
    // showEmojiPicker.value = false;
  };

  let saveTimeout: NodeJS.Timeout | null = null;

  // Handle all input changes
  const handleInput = (e: Event) => {
    editorDataStore.isUserEdit.value = true;
    debouncedSave();
    // Update replicated value (for automatic text-area extension)
    replicatedValue.value = (e.target as HTMLTextAreaElement).value;
  };

  // Watch for changes in selectedPost and update editorDataStore
  watch(
    () => editorDataStore.selectedPost.value,
    (newPost) => {
      if (newPost) {
        // Only set selectedDateTime if we're not already on the editor page
        // or if the post explicitly has a scheduledTime

        editorDataStore.selectedPost.value = newPost;

        if (newPost.scheduledTime) {
          editorDataStore.selectedDateTime.value = new Date(
            newPost.scheduledTime
          );
        } else {
          // If no scheduledTime, reset the selectedDateTime
          editorDataStore.selectedDateTime.value = null;
        }

        status.value = newPost.status || 'draft';
      }
    },
    { immediate: true }
  );

  // Watch for content changes when post is switched
  watch(
    () => editorDataStore.selectedPost.value?.content,
    (newContent) => {
      replicatedValue.value = newContent || '';
    }
  );

  async function handleSave() {
    try {
      isSaving.value = true;

      await updatePostGroup(videoS3Key.value, selectedMedia.value);

      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Post group saved successfully',
        life: 3000,
      });
    } catch (error: any) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error,
        life: 3000,
      });
    } finally {
      isSaving.value = false;
    }
  }

  // Debounced save function
  const debouncedSave = () => {
    // Clear any existing timeout
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    console.log('saving');

    // Show saving indicator immediately when typing starts
    isSaving.value = true;

    // Set new timeout
    saveTimeout = setTimeout(async () => {
      try {
        await handleSave();
      } finally {
        isSaving.value = false;
      }
    }, 1000); // 0.5 second delay
  };

  onMounted(async () => {
    isLoading.value = false;
    document.addEventListener('click', handleClickOutside);

    // Initialize replicatedValue with current content
    replicatedValue.value = editorDataStore.selectedPost.value?.content || '';

    if (
      editorDataStore.selectedPost.value?.platforms?.some((p: any) =>
        p.startsWith('tiktok')
      )
    ) {
    }

    await nextTick(() => {
      isLoading.value = false;
    });

    // Clean up the timeout when component is unmounted
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  });
</script>

<template>
  <transition name="fade" mode="out-in">
    <div
      v-if="!isLoading"
      :key="postKey"
      class="transition-container flex w-full max-w-[1000px] flex-col items-start justify-start gap-4"
    >
      <p>{{ editorDataStore.isUserEdit }}</p>
      <p>1 - {{ editorDataStore.selectedPost.value }}</p>

      <!-- Loading Indicator -->
      <div
        v-if="isSaving"
        class="saving-indicator absolute left-4 top-4 flex items-center gap-2 text-blue-500"
      >
        <Loader2 class="h-4 w-4 animate-spin stroke-[green]" />
        <!-- <LoopingRhombusesSpinner
          :animation-duration="1500"
          :rhombus-size="8"
          color="#ff1d5e"
        /> -->
      </div>

      <div class="flex w-full items-center justify-end p-2">
        <DatePicker
          v-model="editorDataStore.selectedDateTime.value"
          showTime
          showIcon
          :showSeconds="false"
          hourFormat="12"
          class="w-[250px]"
        />
        <button @click="() => handleSave()">Save</button>
      </div>
      <div class="flex w-full items-start justify-start gap-4">
        <div class="flex w-[250px] flex-shrink-0 flex-col gap-2 p-2">
          <PlatformButton
            v-for="account in connectionsDataStore.connectedAccounts.value"
            :key="account.id"
            :account="account"
            :is-selected="
              editorDataStore.selectedPost.value?.platforms.includes(
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

        <div class="divider bg-layoutSoft w-[1px] self-stretch"></div>
        <!-- Left Component (Scheduling Form) -->
        <div
          class="scheduling-form border-greenBG flex h-fit max-w-[800px] flex-grow rounded-[10px] bg-[white] dark:bg-[#121212]"
        >
          <div class="flex h-auto w-full flex-col gap-2 p-2">
            <!-- <div>{{ currentMediaType }}</div>
          <div>
            {{ editorDataStore.selectedPost.value.mediaFiles }}
          </div>
          <div>{{ editorDataStore.selectedPost.value.initialMediaUrls }}</div>
          <div>{{ editorDataStore.selectedPost.value.mediaPreviewUrls }}</div> -->

            <div class="flex h-full w-full gap-8">
              <!-- Form Panel -->
              <div class="flex w-full flex-1 flex-col">
                <div
                  class="relative flex w-full flex-col rounded-[8px] dark:bg-[#1a1a1a]"
                >
                  <div
                    class="grow-wrap"
                    :data-replicated-value="replicatedValue"
                  >
                    <textarea
                      placeholder="Write your post here..."
                      ref="textareaRef"
                      v-model="editorDataStore.selectedPost.value.content"
                      class="w-full rounded-lg bg-white text-black dark:bg-[#1a1a1a]"
                      name="text"
                      id="text"
                      @input="handleInput"
                    ></textarea>
                  </div>

                  <div class="flex items-center justify-end gap-1">
                    <button
                      ref="emojiButtonRef"
                      @click="toggleEmojiPicker"
                      class="group relative flex items-center rounded-full px-1 py-1 text-sm text-gray-700"
                      :class="{
                        'bg-gray-200 dark:bg-[#404040]': showEmojiPicker,
                      }"
                    >
                      <Smile
                        class="h-4 w-4 stroke-gray-500 group-hover:stroke-black"
                      />
                    </button>
                    <button
                      @click="handlePhotoUpload"
                      class="group flex items-center rounded-full px-1 py-1 text-sm text-gray-700"
                    >
                      <ImageIcon
                        class="h-4 w-4 stroke-gray-500 group-hover:stroke-black"
                      />
                    </button>
                    <button
                      @click="handleVideoUpload"
                      class="group flex items-center rounded-full px-1 py-1 text-sm text-gray-700"
                    >
                      <Video
                        class="h-4 w-4 stroke-gray-500 group-hover:stroke-black"
                      ></Video>
                    </button>
                    <button
                      class="group flex items-center rounded-full px-1 py-1 text-sm text-gray-700"
                    >
                      <MoreHorizontal
                        class="h-4 w-4 stroke-gray-500 group-hover:stroke-black"
                      />
                    </button>

                    <!-- Emoji Picker -->
                    <div
                      v-if="showEmojiPicker"
                      ref="emojiPickerRef"
                      class="absolute left-1/2 top-full z-50 -translate-x-1/2 rounded-lg border shadow-lg"
                    >
                      <emoji-picker></emoji-picker>
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
                      editorDataStore.selectedPost.value?.platforms.some(
                        (platform: any) => platform.startsWith('tiktok')
                      )
                    "
                  />
                  <InstagramPresets
                    v-if="
                      editorDataStore.selectedPost.value?.platforms.some(
                        (platform: any) => platform.startsWith('instagram')
                      )
                    "
                  />
                  <YouTubePresets
                    v-if="
                      editorDataStore.selectedPost.value?.platforms.some(
                        (platform: any) => platform.startsWith('youtube')
                      )
                    "
                  />
                </div>

                <div
                  class="preview-container overflow-hidden rounded-[10px] rounded-r-[10px] bg-[white] dark:bg-[#313131]"
                >
                  <PreviewComponent
                    v-show="editorDataStore.currentMediaType.value"
                    :media-preview-urls="
                      editorDataStore.selectedPost.value.mediaPreviewUrls
                    "
                    :current-media-type="editorDataStore.currentMediaType.value"
                    :initial-video-timestamp="
                      editorDataStore.selectedPost.value.videoTimestamp
                    "
                    @update:videoRef="handleVideoRefUpdate"
                    @update:timestamp="handleTimestampUpdate"
                    @removeMedia="removeMedia"
                  />
                </div>
              </div>
            </div>
            <p>
              {{ '_id: ' + editorDataStore.selectedPost.value._id }}
            </p>
            <p>
              {{
                'mediaFiles: ' + editorDataStore.selectedPost.value.mediaFiles
              }}
            </p>
            <p>
              {{
                'mediaPreviewUrls: ' +
                editorDataStore.selectedPost.value.mediaPreviewUrls
              }}
            </p>
            <p>
              {{
                'initialMediaUrls: ' +
                editorDataStore.selectedPost.value.initialMediaUrls
              }}
            </p>
          </div>
        </div>
        <div class="divider bg-layoutSoft w-[1px] self-stretch"></div>
        <div class="flex w-[250px] flex-shrink-0 flex-col gap-2 p-2">test</div>

        <!-- Right Component (Preview) -->
      </div>
    </div>
  </transition>
</template>

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
</style>

<style scoped>
  /* Left component transition */
  .scheduling-form {
    transition: all 0.5s ease-in-out;
  }

  /* Right component transition */
  .preview-container {
    overflow: hidden;
    transition: all 0.3s ease-in-out;
  }
</style>

<style scoped>
  .grow-wrap {
    display: grid;
  }

  .grow-wrap::after {
    content: attr(data-replicated-value) ' ';
    white-space: pre-wrap;
    visibility: hidden;
  }

  .grow-wrap > textarea {
    resize: none;
    overflow: hidden;
  }

  .grow-wrap > textarea,
  .grow-wrap::after {
    font: inherit;
    grid-area: 1 / 1 / 2 / 2;
  }
</style>
