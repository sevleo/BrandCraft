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
    Minimize2,
    Maximize2,
    Calendar,
    Send,
    SendHorizonal,
    Check,
    AlertCircle,
    FileEdit,
  } from 'lucide-vue-next';
  import 'emoji-picker-element';
  import PlatformButton from '@/components/common/buttons/PlatformButton.vue';
  import ToggleSlider from '@/components/common/buttons/ToggleSlider.vue';
  import { uploadVideoToS3 } from '@/api/mediaApi';
  import { getCreatorInfo } from '@api/tiktokApi';
  import TikTokPresets from '@/components/common/forms/PostFormBase/TikTokPresets.vue';
  import InstagramPresets from '@/components/common/forms/PostFormBase/InstagramPresets.vue';
  import PreviewComponent from '@/components/common/forms/PostFormBase/PreviewComponent.vue';
  import YouTubePresets from '@/components/common/forms/PostFormBase/YouTubePresets.vue';
  import editorDataStore from '@/utils/editorDataStore';

  const toast = useToast();
  // const videoRef = ref<HTMLVideoElement | null>(null);

  const isLoading = ref(true);
  const isSaving = ref(false);
  const postKey = computed(
    () => editorDataStore.selectedPost?.value._id || 'new'
  );

  const replicatedValue = ref('');

  // const validationErrors = computed(() => {
  //   const errors = [];

  //   // Check if media is currently uploading
  //   if (editorDataStore.isUploading.value) {
  //     errors.push('Please wait for media upload to complete');
  //   }

  //   // TikTok errors
  //   if (
  //     editorDataStore.selectedPost.value?.platforms.some((p: any) =>
  //       p.startsWith('tiktok')
  //     )
  //   ) {
  //     // 1. Check if media is uploaded
  //     if (editorDataStore.selectedPost.value.mediaPreviewUrls.length === 0) {
  //       errors.push('Please upload a video for your TikTok post');
  //     } else if (
  //       editorDataStore.currentMediaType.value === 'video' &&
  //       !isVideoDurationValid.value
  //     ) {
  //       const maxDuration =
  //         connectionsDataStore.tiktokAccount.value?.creatorInfo
  //           .max_video_post_duration_sec;
  //       errors.push(
  //         `Video duration exceeds maximum allowed length of ${maxDuration} seconds`
  //       );
  //     } else if (editorDataStore.currentMediaType.value === 'image') {
  //       errors.push('Images are not supported for TikTok posts');
  //     }

  //     // 2. Check if viewer setting is selected
  //     if (!editorDataStore.tiktokSettings.value.viewerSetting) {
  //       errors.push('Please select who can view your post');
  //     }

  //     // 3. Check commercial content settings
  //     if (
  //       editorDataStore.tiktokSettings.value.commercialContent &&
  //       !editorDataStore.tiktokSettings.value.brandOrganic &&
  //       !editorDataStore.tiktokSettings.value.brandedContent
  //     ) {
  //       errors.push(
  //         'You need to indicate if your content promotes yourself, a third party, or both.'
  //       );
  //     }
  //   }

  //   // Instagram errors
  //   if (
  //     editorDataStore.selectedPost.value?.platforms.some((p: any) =>
  //       p.startsWith('instagram')
  //     )
  //   ) {
  //     // 1. Check if media is uploaded
  //     if (editorDataStore.selectedPost.value.mediaPreviewUrls.length === 0) {
  //       errors.push('Please upload a video or image for your Instagram post');
  //     }

  //     // 2. Check video duration limits for Reels and Stories
  //     if (
  //       editorDataStore.currentMediaType.value === 'video' &&
  //       videoRef.value
  //     ) {
  //       const duration = Math.floor(videoRef.value.duration);
  //       const maxDuration =
  //         editorDataStore.selectedPost.value?.platformSettings.instagram!
  //           .videoType === 'REELS'
  //           ? 900
  //           : 60;
  //       const durationText =
  //         editorDataStore.selectedPost.value?.platformSettings.instagram!
  //           .videoType === 'REELS'
  //           ? '15 minutes'
  //           : '1 minute';

  //       if (duration > maxDuration) {
  //         errors.push(
  //           `Video duration exceeds maximum allowed length of ${durationText} for Instagram ${editorDataStore.selectedPost.value?.platformSettings.instagram!.videoType.toLowerCase()}`
  //         );
  //       }
  //     }
  //   }

  //   return errors;
  // });

  // const isVideoDurationValid = computed(() => {
  //   if (
  //     editorDataStore.uploadProgress.value < 100 ||
  //     !videoRef.value ||
  //     editorDataStore.currentMediaType.value !== 'video'
  //   ) {
  //     return true; // Assume valid while upload is in progress or metadata isn't loaded
  //   }
  //   const maxDuration =
  //     connectionsDataStore.tiktokAccount.value?.creatorInfo
  //       .max_video_post_duration_sec || Infinity;

  //   return Math.floor(videoRef.value.duration) <= maxDuration;
  // });

  // Get view mode from localStorage or default to 'compact'
  const viewMode = ref(localStorage.getItem('postFormViewMode') || 'compact');

  // Watch for changes to viewMode and save to localStorage
  watch(viewMode, (newValue) => {
    localStorage.setItem('postFormViewMode', newValue);
  });

  // Toggle between compact and full view for platform buttons

  const status = ref<string>(
    editorDataStore.selectedPost.value?.status || 'draft'
  );

  const getScheduledDate = computed({
    get: () => {
      return editorDataStore.selectedPost.value.scheduledTime
        ? new Date(editorDataStore.selectedPost.value.scheduledTime)
        : null;
    },
    set: (date: Date | null) => {
      editorDataStore.selectedPost.value.scheduledTime =
        date?.toISOString() || null;
    },
  });

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
        editorDataStore.selectedMedia.value = [videoFile];
        editorDataStore.currentMediaType.value = 'video';

        try {
          // Start upload to S3
          editorDataStore.uploadProgress.value = 0;
          editorDataStore.isUploading.value = true;
          await uploadVideoToS3(
            videoFile,
            (progress) => {
              editorDataStore.uploadProgress.value = progress;
            },
            isSaving
          );

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
      editorDataStore.selectedMedia.value.push(...newFiles);
      editorDataStore.currentMediaType.value = 'image';

      // Create preview URLs
      newFiles.forEach((file) => {
        const url = URL.createObjectURL(file);
        editorDataStore.selectedPost.value.mediaPreviewUrls.push(url);
      });

      debouncedSave();
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

    debouncedSave();
    if (account.platform === 'tiktok') {
      await getCreatorInfo(account.id);
    }
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

  const handleDateChange = () => {
    editorDataStore.isUserEdit.value = true;
    debouncedSave();
  };

  // Watch for changes in selectedPost and update editorDataStore
  watch(
    () => editorDataStore.selectedPost.value,
    (newPost) => {
      if (newPost) {
        editorDataStore.selectedPost.value = newPost;

        // No need to convert back and forth since we already have the ISO string
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
      await updatePostGroup(editorDataStore.selectedMedia.value);
      // toast.add({
      //   severity: 'success',
      //   summary: 'Success',
      //   detail: 'Post saved successfully',
      //   life: 3000,
      // });
    } catch (error: any) {
      console.error('Save error:', error);
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error?.response?.data?.message || 'Failed to save post',
        life: 3000,
      });
    } finally {
      isSaving.value = false;
    }
  }

  // Debounced save function
  const debouncedSave = () => {
    // Clear any existing timeout
    editorDataStore.isUserEdit.value = true;
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
    }, 700); // 0.3 second delay
  };

  // Schedule button state
  const scheduleButtonState = ref<
    'initial' | 'confirm' | 'processing' | 'scheduled'
  >('initial');

  // Handle scheduling the post
  const handleSchedule = async () => {
    // First click - show confirmation
    if (scheduleButtonState.value === 'initial') {
      scheduleButtonState.value = 'confirm';
      return;
    }

    // Second click - process scheduling
    if (scheduleButtonState.value === 'confirm') {
      try {
        scheduleButtonState.value = 'processing';

        // Update status to scheduled
        editorDataStore.selectedPost.value.status = 'scheduled';

        // Save the post with the scheduled status
        await handleSave();

        scheduleButtonState.value = 'scheduled';

        toast.add({
          severity: 'success',
          summary: 'Scheduled',
          detail: 'Post has been scheduled successfully',
          life: 3000,
        });
      } catch (error: any) {
        console.error('Scheduling error:', error);
        scheduleButtonState.value = 'initial';

        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: error.message || 'Failed to schedule post',
          life: 3000,
        });
      }
    }
  };

  // Reset confirmation state when mouse leaves the button
  const handleScheduleButtonMouseLeave = () => {
    if (scheduleButtonState.value === 'confirm') {
      scheduleButtonState.value = 'initial';
    }
  };

  // Change post back to draft
  const handleChangeToDraft = async () => {
    try {
      scheduleButtonState.value = 'processing';

      // Update status to draft
      editorDataStore.selectedPost.value.status = 'draft';

      // Save the post with the draft status
      await handleSave();

      scheduleButtonState.value = 'initial';

      toast.add({
        severity: 'success',
        summary: 'Changed to Draft',
        detail: 'Post has been changed to draft',
        life: 3000,
      });
    } catch (error: any) {
      console.error('Change to draft error:', error);
      scheduleButtonState.value = 'scheduled';

      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Failed to change post to draft',
        life: 3000,
      });
    }
  };

  // Set initial button state based on post status
  onMounted(async () => {
    isLoading.value = false;
    document.addEventListener('click', handleClickOutside);

    // Set schedule button state based on post status
    if (editorDataStore.selectedPost.value?.status === 'scheduled') {
      scheduleButtonState.value = 'scheduled';
    }

    // Initialize replicatedValue with current content
    replicatedValue.value = editorDataStore.selectedPost.value?.content || '';

    const tiktokPlatform = editorDataStore.selectedPost.value?.platforms?.find(
      (p: any) => p.startsWith('tiktok')
    );
    if (tiktokPlatform) {
      await getCreatorInfo(tiktokPlatform.split('-').slice(1).join('-'));
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
      class="transition-container flex w-full max-w-[1100px] flex-col items-start justify-start px-[30px]"
    >
      <!-- Loading Indicator -->
      <div
        v-if="isSaving"
        class="saving-indicator absolute left-4 top-4 flex items-center gap-2 text-blue-500"
      >
        <Loader2 class="h-4 w-4 animate-spin stroke-[gray]" />
        <!-- <LoopingRhombusesSpinner
          :animation-duration="1500"
          :rhombus-size="8"
          color="#ff1d5e"
        /> -->
      </div>
      <!-- View mode toggle -->
      <div class="flex w-full items-center justify-between p-2">
        <div class="flex items-center">
          <ToggleSlider
            v-model="viewMode"
            leftOption="Compact"
            rightOption="Full"
            leftValue="compact"
            rightValue="full"
          />
        </div>
      </div>
      <div class="mb-[30px] flex w-full items-start justify-between p-2">
        <div class="flex w-full flex-col items-start justify-start gap-2">
          <!-- Platform buttons container with conditional flex-wrap -->
          <div class="flex gap-2" :class="{ 'flex-wrap': viewMode === 'full' }">
            <PlatformButton
              v-for="account in connectionsDataStore.connectedAccounts.value"
              :key="account.id"
              :account="account"
              :show-username="viewMode === 'full'"
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
        </div>
        <div class="flex h-[38px] items-start justify-start">
          <DatePicker
            v-model="getScheduledDate"
            @hide="handleDateChange"
            showTime
            showIcon
            :showSeconds="false"
            hourFormat="12"
            class=""
          />
        </div>
        <button
          v-if="scheduleButtonState === 'scheduled'"
          @click="handleChangeToDraft"
          class="ml-2 flex h-[38px] items-center gap-2 rounded-md border border-[#e9e9e9] bg-[#f0f0f0] px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-[#e9e9e9] dark:border-[#313131] dark:bg-[#1a1a1a] dark:text-gray-300 dark:hover:bg-[#252525]"
        >
          Change to Draft
          <FileEdit class="h-4 w-4" />
        </button>
        <button
          v-else
          @click="handleSchedule"
          @mouseleave="handleScheduleButtonMouseLeave"
          :disabled="scheduleButtonState === 'processing'"
          :class="{
            'ml-2 flex h-[38px] items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-all': true,
            'border-[#e9e9e9] text-gray-700 hover:bg-[#f9f9f9] dark:border-[#313131] dark:bg-[#121212] dark:text-gray-300 dark:hover:bg-[#d9d9d9]/10':
              scheduleButtonState === 'initial',
            'bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30 border-green-200 dark:border-green-800':
              scheduleButtonState === 'confirm',
            'border-[#e9e9e9] bg-[#f0f0f0] text-gray-400 dark:border-[#313131] dark:bg-[#1a1a1a] dark:text-gray-500':
              scheduleButtonState === 'processing',
          }"
        >
          <template v-if="scheduleButtonState === 'initial'">
            Schedule
            <SendHorizonal class="h-4 w-4" />
          </template>
          <template v-else-if="scheduleButtonState === 'confirm'">
            Confirm
            <Check class="h-4 w-4" />
          </template>
          <template v-else-if="scheduleButtonState === 'processing'">
            Scheduling...
            <Loader2 class="h-4 w-4 animate-spin" />
          </template>
        </button>
      </div>
      <div class="flex w-full items-start justify-start gap-4">
        <!-- Middle Component -->
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
                    class="grow-wrap rounded-lg border border-[#ededed] bg-[#fafafa] p-2"
                    :data-replicated-value="replicatedValue"
                  >
                    <textarea
                      placeholder="Write your post here..."
                      ref="textareaRef"
                      v-model="editorDataStore.selectedPost.value.content"
                      class="w-full rounded-lg bg-[#fafafa] text-black dark:bg-[#1a1a1a]"
                      name="text"
                      id="text"
                      @input="handleInput"
                      @keydown.enter.shift.prevent
                    ></textarea>
                  </div>

                  <div class="mt-[10px] flex items-center justify-end gap-1">
                    <button
                      ref="emojiButtonRef"
                      @click="toggleEmojiPicker"
                      class="group relative flex items-center rounded-full px-1 py-1 text-sm text-gray-700"
                      :class="{
                        'bg-gray-200 dark:bg-[#404040]': showEmojiPicker,
                      }"
                    >
                      <Smile
                        class="h-5 w-5 stroke-gray-500 group-hover:stroke-black"
                      />
                    </button>
                    <button
                      @click="handlePhotoUpload"
                      class="group flex items-center rounded-full px-1 py-1 text-sm text-gray-700"
                    >
                      <ImageIcon
                        class="h-5 w-5 stroke-gray-500 group-hover:stroke-black"
                      />
                    </button>
                    <button
                      @click="handleVideoUpload"
                      class="group flex items-center rounded-full px-1 py-1 text-sm text-gray-700"
                    >
                      <Video
                        class="h-5 w-5 stroke-gray-500 group-hover:stroke-black"
                      ></Video>
                    </button>
                    <button
                      class="group flex items-center rounded-full px-1 py-1 text-sm text-gray-700"
                    >
                      <MoreHorizontal
                        class="h-5 w-5 stroke-gray-500 group-hover:stroke-black"
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
                  v-if="editorDataStore.uploadProgress.value > 0"
                  class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white"
                >
                  {{ editorDataStore.uploadProgress.value }}%
                </div>

                <div class="mb-4"></div>

                <!-- Settings Panel -->
                <div class="flex flex-col gap-1">
                  <TikTokPresets
                    v-if="
                      editorDataStore.selectedPost.value?.platforms.some(
                        (p: any) => p.startsWith('tiktok')
                      )
                    "
                    :debouncedSave="debouncedSave"
                  />
                  <InstagramPresets
                    v-if="
                      editorDataStore.selectedPost.value?.platforms.some(
                        (p: any) => p.startsWith('instagram')
                      )
                    "
                    :debouncedSave="debouncedSave"
                  />
                  <YouTubePresets
                    v-if="
                      editorDataStore.selectedPost.value?.platforms.some(
                        (p: any) => p.startsWith('youtube')
                      )
                    "
                    :debouncedSave="debouncedSave"
                  />
                </div>

                <div
                  class="preview-container overflow-hidden rounded-[10px] rounded-r-[10px] bg-[white] dark:bg-[#313131]"
                >
                  <PreviewComponent
                    :key="
                      editorDataStore.selectedPost.value.mediaPreviewUrls.join(
                        ''
                      )
                    "
                    v-if="
                      editorDataStore.selectedPost.value.mediaPreviewUrls
                        .length > 0
                    "
                    :media-preview-urls="
                      editorDataStore.selectedPost.value.mediaPreviewUrls
                    "
                    :current-media-type="editorDataStore.currentMediaType.value"
                    :initial-video-timestamp="
                      editorDataStore.selectedPost.value.videoTimestamp
                    "
                    :debouncedSave="debouncedSave"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="divider w-[0px] self-stretch bg-layoutSoft"></div>
        <!-- Right Component -->
        <div class="flex w-[350px] flex-shrink-0 flex-col gap-2 p-2">test</div>
      </div>
    </div>
  </transition>
</template>

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
