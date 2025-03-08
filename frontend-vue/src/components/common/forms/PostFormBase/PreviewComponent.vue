<script setup lang="ts">
  import {
    Image as ImageIcon,
    ChevronLeft,
    ChevronRight,
    Trash2,
    Check,
    Loader2,
    Video,
    CircleAlert,
  } from 'lucide-vue-next';
  import { useToast } from 'primevue';

  import { ref, watch, onMounted, onUnmounted } from 'vue';
  import editorDataStore from '@/utils/editorDataStore';
  import { deleteMedia } from '@/api/postApi';
  import { uploadMedia } from '@/api/postApi';
  import { uploadVideoToS3 } from '@/api/mediaApi';

  const toast = useToast();

  const isHoveringVideo = ref(false);
  const isVideoPlaying = ref(false);
  const isVideoVertical = ref(true);
  const modalVideoRef = ref<HTMLVideoElement | null>(null);
  const showCoverModal = ref(false);
  const sliderValue = ref(0);
  const lastSelectedTime = ref<number>(0);
  const currentTimeFormatted = ref<string>('0:00');
  const isDragging = ref(false);
  const videoProgress = ref(0);
  const videoCurrentTime = ref(0);
  const currentImageIndex = ref(0);
  const deletingMediaIndex = ref<number | null>(null);
  const isDeletingMedia = ref<boolean>(false);

  const showUploadInfo = ref(false);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const props = defineProps<{
    mediaPreviewUrls: string[];
    currentMediaType: 'image' | 'video' | null;
    initialVideoTimestamp?: number;
    debouncedSave: () => void;
    handleSave: () => void;
    readonly?: boolean;
  }>();

  // function extractVideoMetadata(file: File) {
  //   return new Promise((resolve, reject) => {
  //     const video = document.createElement('video');

  //     video.preload = 'metadata';
  //     video.onloadedmetadata = () => {
  //       resolve({
  //         format: file.type, // Example: "video/mp4"
  //         duration: video.duration, // Video duration in seconds
  //         width: video.videoWidth,
  //         height: video.videoHeight,
  //         aspectRatio: video.videoWidth / video.videoHeight,
  //       });
  //       URL.revokeObjectURL(video.src);
  //     };

  //     video.onerror = () => {
  //       reject(new Error('Failed to load video metadata.'));
  //     };

  //     video.src = URL.createObjectURL(file);
  //   });
  // }

  const handlePhotoUpload = () => {
    if (editorDataStore.currentMediaType.value === 'video') {
      toast.add({
        severity: 'error',
        detail: 'Remove the video first.',
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
        severity: 'error',
        detail: 'Remove the images first.',
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

  async function handleMediaSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const files = Array.from(input.files);
      const isVideo = input.accept.includes('video');

      // Set uploading state immediately
      editorDataStore.isUploading.value = true;

      // If it's a video, only allow one video per post
      if (isVideo) {
        if (editorDataStore.selectedPost.value.mediaPreviewUrls.length > 0) {
          toast.add({
            severity: 'warn',
            summary: 'Media limit exceeded',
            detail: 'You can only add one video per post',
            life: 3000,
          });
          editorDataStore.isUploading.value = false;
          return;
        }
        const videoFile = files[0];
        if (videoFile.size > 100 * 1024 * 1024) {
          // 100MB limit
          toast.add({
            severity: 'error',
            summary: 'File too large',
            detail: 'Video file size must be less than 100MB',
            life: 3000,
          });
          editorDataStore.isUploading.value = false;
          return;
        }

        try {
          const url = URL.createObjectURL(videoFile);
          editorDataStore.selectedPost.value.mediaPreviewUrls = [url];
          editorDataStore.selectedMedia.value = [videoFile];
          editorDataStore.currentMediaType.value = 'video';

          // const metadata = await extractVideoMetadata(videoFile);
          // console.log('Video Metadata:', metadata);

          // Start upload to S3
          editorDataStore.uploadProgress.value = 0;
          editorDataStore.isSaving.value = true;

          await uploadVideoToS3(
            videoFile,
            (progress) => {
              editorDataStore.uploadProgress.value = progress;
            },
            editorDataStore.isSaving
          );

          // Refresh the current post data to ensure we have the latest media files
          await editorDataStore.refreshCurrentPost();

          // Clear the selected media array
          editorDataStore.selectedMedia.value = [];

          toast.add({
            severity: 'success',
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
        } finally {
          editorDataStore.isUploading.value = false;
          editorDataStore.isSaving.value = false;
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
        editorDataStore.isUploading.value = false;
        return;
      }

      const newFiles = files.slice(0, remainingSlots);
      editorDataStore.selectedMedia.value = newFiles;
      editorDataStore.currentMediaType.value = 'image';

      try {
        editorDataStore.isSaving.value = true;
        editorDataStore.isUploading.value = true;

        // Get the post ID
        const postId = editorDataStore.selectedPost.value._id;
        const selectedMedia = editorDataStore.selectedMedia.value;

        // Upload the media files
        await uploadMedia(postId, selectedMedia);

        // Don't update local state here - just refresh the post data
        await editorDataStore.refreshCurrentPost();

        // Clear the selected media array
        editorDataStore.selectedMedia.value = [];

        toast.add({
          severity: 'success',
          summary: 'Media uploaded',
          detail: 'Media files uploaded successfully',
          life: 3000,
        });
      } catch (error) {
        console.error('Error uploading media:', error);
        toast.add({
          severity: 'error',
          summary: 'Upload failed',
          detail: 'Failed to upload media files. Please try again.',
          life: 3000,
        });
      } finally {
        editorDataStore.isUploading.value = false;
        editorDataStore.isSaving.value = false;
      }
    }
  }

  // Handle video load
  const handleVideoLoad = () => {
    if (!editorDataStore.videoRef?.value) return;

    // Start progress tracking
    const video = editorDataStore.videoRef.value;
    isVideoVertical.value = video.videoHeight > video.videoWidth;

    // Set initial timestamp if provided
    if (props.initialVideoTimestamp) {
      video.currentTime = props.initialVideoTimestamp;
    }
  };

  // Set initial timestamp if provided
  watch(
    () => props.initialVideoTimestamp,
    (newValue) => {
      if (newValue !== undefined) {
        lastSelectedTime.value = newValue;
        currentTimeFormatted.value = formatTime(newValue);

        // Only update modal video position
        if (modalVideoRef.value?.duration) {
          modalVideoRef.value.currentTime = newValue;
          sliderValue.value = (newValue / modalVideoRef.value.duration) * 100;
        }
      }
    },
    { immediate: true }
  );

  // Remove watch for main video load
  // Watch for modal video load to set initial timestamp
  watch(
    () => modalVideoRef.value?.duration,
    (newDuration) => {
      if (newDuration && props.initialVideoTimestamp !== undefined) {
        modalVideoRef.value!.currentTime = props.initialVideoTimestamp;
        sliderValue.value = (props.initialVideoTimestamp / newDuration) * 100;
      }
    }
  );

  const openCoverModal = () => {
    if (!editorDataStore.videoRef?.value) return;
    showCoverModal.value = true;
    editorDataStore.videoRef.value.pause();
    isVideoPlaying.value = false;
  };

  const onModalVideoLoad = () => {
    if (!modalVideoRef.value) return;

    // Set initial timestamp if provided
    if (
      props.initialVideoTimestamp !== undefined &&
      modalVideoRef.value.duration
    ) {
      modalVideoRef.value.currentTime = props.initialVideoTimestamp;
      sliderValue.value =
        (props.initialVideoTimestamp / modalVideoRef.value.duration) * 100;
    }

    // Enable fast seeking for better performance
    if ('fastSeek' in modalVideoRef.value) {
      modalVideoRef.value.preload = 'auto';
    }
  };

  const updateVideoFrame = () => {
    const video = modalVideoRef.value as HTMLVideoElement;
    if (!video || !video.duration) return;

    const newTime = (sliderValue.value / 100) * video.duration;

    // Update the time display immediately for better responsiveness
    currentTimeFormatted.value = formatTime(newTime);

    // If the browser supports fastSeek, use it for better performance
    if (('fastSeek' in video) as any) {
      video.fastSeek(newTime);
    } else {
      video.currentTime = newTime;
    }
  };

  const captureCoverImage = () => {
    if (!modalVideoRef.value) return;
    const video = modalVideoRef.value;
    const timestamp = video.currentTime;
    editorDataStore.selectedPost.value.videoTimestamp = timestamp;
    props.debouncedSave();
    showCoverModal.value = false;
  };

  const updateVideoProgress = () => {
    if (!editorDataStore.videoRef?.value) return;
    videoCurrentTime.value = editorDataStore.videoRef.value.currentTime;
    videoProgress.value =
      (editorDataStore.videoRef.value.currentTime /
        editorDataStore.videoRef.value.duration) *
      100;
  };

  const nextImage = () => {
    if (currentImageIndex.value < props.mediaPreviewUrls.length - 1) {
      currentImageIndex.value++;
    }
  };

  const previousImage = () => {
    if (currentImageIndex.value > 0) {
      currentImageIndex.value--;
    }
  };

  interface MediaFileWithId {
    _id?: string;
    fileName?: string;
    mimeType?: string;
    type: 'image' | 'video';
    url: string;
  }

  async function removeMedia(index: number) {
    if (deletingMediaIndex.value === index) {
      const mediaToDelete: MediaFileWithId =
        editorDataStore.selectedPost.value.mediaFiles[index];

      // If this is a server-stored media file (has an _id)
      if (mediaToDelete && mediaToDelete._id) {
        try {
          // Set deleting state to true to show spinner
          isDeletingMedia.value = true;

          // Delete the media file via API
          await deleteMedia(mediaToDelete._id);

          // Don't update local state here - just refresh the post data
          await editorDataStore.refreshCurrentPost();

          deletingMediaIndex.value = null;

          // No need to call handleSave here as we've already refreshed the data
          return;
        } catch (error) {
          console.error('Error deleting media:', error);
          deletingMediaIndex.value = null;
          return;
        } finally {
          // Reset deleting state
          isDeletingMedia.value = false;
        }
      }

      // Only for locally added files that don't have an _id yet
      // Remove URL from preview
      URL.revokeObjectURL(
        editorDataStore.selectedPost.value.mediaPreviewUrls[index]
      );

      // Update local state
      editorDataStore.selectedPost.value.mediaPreviewUrls.splice(index, 1);
      editorDataStore.selectedPost.value.mediaFiles.splice(index, 1);

      // Reset currentMediaType if no media left
      if (editorDataStore.selectedPost.value.mediaPreviewUrls.length === 0) {
        editorDataStore.currentMediaType.value = null;
        editorDataStore.selectedPost.value.videoTimestamp = 0;
      }

      deletingMediaIndex.value = null;

      // Save changes to update the post without the deleted media
      props.handleSave();
    } else {
      // First click - show confirmation
      deletingMediaIndex.value = index;
    }
  }

  // Reset deletion state when mouse leaves
  const handleMouseLeave = () => {
    deletingMediaIndex.value = null;
  };

  watch(sliderValue, updateVideoFrame);
  watch(
    () => props.mediaPreviewUrls,
    () => {
      currentImageIndex.value = 0;
    },
    { deep: true }
  );

  const componentKey = ref(Date.now()); // Unique key for forcing re-render
  const retryInterval = ref<ReturnType<typeof setInterval> | null>(null);

  // Function to check if video is playable
  const checkVideoAvailability = () => {
    const videoElement = editorDataStore.videoRef.value;
    if (videoElement && videoElement.readyState >= 2) {
      clearInterval(retryInterval.value!); // Stop retrying
      retryInterval.value = null;
    } else {
      componentKey.value = Date.now(); // Force re-render
    }
  };

  onMounted(() => {
    // Start checking video availability
    retryInterval.value = setInterval(checkVideoAvailability, 1000);
  });

  // Watch for changes in media type to restart video checks
  watch(
    () => props.currentMediaType,
    (newType) => {
      if (newType === 'video') {
        // Clear any existing interval
        if (retryInterval.value) {
          clearInterval(retryInterval.value);
        }
        // Start new interval
        retryInterval.value = setInterval(checkVideoAvailability, 1000);
      }
    }
  );

  // Cleanup interval when unmounted
  onUnmounted(() => {
    if (retryInterval.value) {
      clearInterval(retryInterval.value);
    }
  });
</script>

<template>
  <div
    :key="componentKey"
    id="preview-panel"
    class="flex h-fit min-h-[150px] flex-1 flex-col justify-center rounded-[15px] border border-dashed border-gray-300 bg-[#ffffff] p-4 dark:bg-[#121212]"
  >
    <div
      class="preview-container relative flex h-full w-full flex-col items-center justify-center"
    >
      <!-- Video Preview -->
      <div
        v-if="
          !editorDataStore.isUploading.value &&
          props.currentMediaType === 'video'
        "
        class="aspect-[9/16] w-[350px] overflow-hidden rounded-lg bg-black"
      >
        <div
          class="h-full w-full"
          @mouseenter="isHoveringVideo = true"
          @mouseleave="isHoveringVideo = false"
        >
          <video
            :ref="
              (el) => {
                editorDataStore.videoRef.value = el as HTMLVideoElement | null;
              }
            "
            :src="props.mediaPreviewUrls[0]"
            @timeupdate="updateVideoProgress"
            class="h-full w-full"
            :class="{
              'object-cover': isVideoVertical,
              'object-contain': !isVideoVertical,
            }"
            controls
            @loadeddata="handleVideoLoad"
          ></video>
          <!-- Remove Button -->
          <button
            v-if="!editorDataStore.isSaving.value && !props.readonly"
            @click="removeMedia(0)"
            @mouseleave="handleMouseLeave"
            class="absolute right-1 top-1 z-10 rounded-full p-0.5 text-gray-400"
            :disabled="isDeletingMedia"
          >
            <Loader2
              v-if="isDeletingMedia"
              class="h-5 w-5 animate-spin text-blue-500"
            />
            <component
              v-else
              :is="deletingMediaIndex === 0 ? Check : Trash2"
              class="h-5 w-5 rounded-full p-0.5 transition-all duration-200"
              :class="[
                deletingMediaIndex === 0
                  ? 'bg-red-100 text-red-500'
                  : 'bg-[#c5c5c5] text-black hover:bg-gray-200 hover:text-black dark:hover:bg-gray-700 dark:hover:text-white',
              ]"
            />
          </button>
        </div>
      </div>
      <!-- Image Preview -->
      <template
        v-else-if="
          !editorDataStore.isUploading.value &&
          props.currentMediaType === 'image'
        "
      >
        <!-- Navigation Arrows -->
        <div
          v-if="props.mediaPreviewUrls.length > 1"
          class="mb-[20px] flex h-fit w-full flex-col items-center justify-center"
        >
          <div class="flex items-center justify-center">
            <button
              @click="previousImage"
              class="mr-2 rounded-full bg-black p-2 text-white transition-opacity hover:bg-gray-800"
              :disabled="currentImageIndex === 0"
              :class="{
                'cursor-not-allowed opacity-50': currentImageIndex === 0,
              }"
            >
              <ChevronLeft :size="16" class="stroke-white" />
            </button>
            <!-- Thumbnail Strip -->
            <div
              v-if="props.mediaPreviewUrls.length > 1"
              class="flex max-w-[300px] justify-center gap-2 overflow-x-auto rounded-lg p-2"
            >
              <button
                v-for="(url, index) in props.mediaPreviewUrls"
                :key="url"
                @click="currentImageIndex = index"
                class="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-200"
                :class="[
                  currentImageIndex === index
                    ? 'border-white'
                    : 'border-transparent hover:border-gray-500',
                ]"
              >
                <img
                  :src="url"
                  :alt="'Preview ' + (index + 1)"
                  class="h-full w-full object-cover"
                  :class="[
                    currentImageIndex === index
                      ? 'opacity-100'
                      : 'opacity-50 hover:opacity-80',
                  ]"
                />
              </button>
            </div>
            <button
              @click="nextImage"
              class="ml-2 rounded-full bg-black p-2 text-white transition-opacity hover:bg-gray-800"
              :disabled="
                currentImageIndex === props.mediaPreviewUrls.length - 1
              "
              :class="{
                'cursor-not-allowed opacity-50':
                  currentImageIndex === props.mediaPreviewUrls.length - 1,
              }"
            >
              <ChevronRight :size="16" class="stroke-white" />
            </button>
          </div>
        </div>
        <div class="h-full w-full">
          <!-- Remove Button -->
          <button
            v-if="!editorDataStore.isSaving.value && !props.readonly"
            @click="removeMedia(currentImageIndex)"
            @mouseleave="handleMouseLeave"
            class="absolute right-1 top-1 z-10 rounded-full p-0.5 text-gray-400"
            :disabled="isDeletingMedia"
          >
            <Loader2
              v-if="isDeletingMedia"
              class="h-5 w-5 animate-spin text-blue-500"
            />
            <component
              v-else
              :is="deletingMediaIndex === currentImageIndex ? Check : Trash2"
              class="h-5 w-5 rounded-full p-0.5 transition-all duration-200"
              :class="[
                deletingMediaIndex === currentImageIndex
                  ? 'bg-red-100 text-red-500'
                  : 'bg-[#c5c5c5] text-black hover:bg-gray-200 hover:text-black dark:hover:bg-gray-700 dark:hover:text-white',
              ]"
            />
          </button>
          <img
            :src="props.mediaPreviewUrls[currentImageIndex]"
            class="h-full w-full object-contain"
            alt="Preview"
          />
        </div>
        <div
          v-if="editorDataStore.selectedPost.value.mediaPreviewUrls.length < 4"
        >
          <div
            class="group flex cursor-pointer flex-col items-center rounded-[10px] bg-gray-100 p-[10px] hover:bg-gray-200"
            @click="handlePhotoUpload"
          >
            <p class="text-gray-600 group-hover:text-black">Add images</p>
            <button
              class="flex items-center rounded-full px-1 py-1 text-sm text-gray-700"
            >
              <ImageIcon
                class="h-10 w-10 stroke-gray-500 stroke-[1px] group-hover:stroke-black"
              />
            </button>
          </div>
        </div>
      </template>

      <div
        v-if="
          !editorDataStore.selectedPost.value.mediaPreviewUrls.length &&
          !editorDataStore.selectedMedia.value.length
        "
        class="flex flex-col items-center"
      >
        <div class="mb-[20px] flex items-center justify-center gap-[10px]">
          <div class="text-[16px] text-gray-600">Upload media</div>
          <CircleAlert
            @click="showUploadInfo = true"
            class="h-6 w-6 cursor-pointer stroke-gray-600 stroke-[1px] text-red-500 hover:stroke-black"
          />
          <div
            v-if="showUploadInfo"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px]"
          >
            <div class="w-[500px] rounded-lg bg-[#efefef] p-6 dark:bg-gray-800">
              <h3 class="mb-4 text-lg font-semibold">Upload Guidelines</h3>
              <div class="space-y-3 text-gray-700 dark:text-gray-300">
                <p><strong>We support images and videos for upload.</strong></p>

                <h3 class="font-semibold">📹 Video Requirements:</h3>
                <ul class="list-disc pl-5">
                  <li>
                    Supported ratios: <strong>9:16, 16:9, 1:1, 4:3</strong>
                  </li>
                  <li>Format: <strong>MP4, MOV</strong></li>
                </ul>

                <h3 class="font-semibold">🖼 Image Requirements:</h3>
                <ul class="list-disc pl-5">
                  <li>All aspect ratios accepted</li>
                  <li>Up to <strong>4 images</strong></li>
                  <li>Automatically optimized for platforms</li>
                  <li>Formats: <strong>JPG, PNG</strong></li>
                </ul>

                <h3 class="font-semibold">📏 File Size Limit:</h3>
                <ul class="list-disc pl-5">
                  <li>Maximum upload size: <strong>100MB</strong></li>
                  <li>
                    Need to compress? Try this tool:
                    <a
                      href="https://www.freeconvert.com/video-compressor"
                      target="_blank"
                      class="text-blue-600 hover:underline"
                      >Reduce file size</a
                    >
                  </li>
                </ul>
              </div>

              <div class="mt-6 flex justify-end">
                <button
                  @click="showUploadInfo = false"
                  class="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-[50px]">
          <div
            class="group flex cursor-pointer flex-col items-center rounded-[10px] bg-gray-100 p-[10px] hover:bg-gray-200"
            @click="handleVideoUpload"
          >
            <p class="text-gray-600 group-hover:text-black">
              Video: 100MB, MP4/MOV
            </p>
            <button
              class="group flex items-center rounded-full px-1 py-1 text-sm text-gray-700"
            >
              <Video
                class="h-10 w-10 stroke-gray-500 stroke-[1px] group-hover:stroke-black"
              ></Video>
            </button>
          </div>
          <div
            class="group flex cursor-pointer flex-col items-center rounded-[10px] bg-gray-100 p-[10px] hover:bg-gray-200"
            @click="handlePhotoUpload"
          >
            <p class="text-gray-600 group-hover:text-black">
              Image: up to 4 images
            </p>
            <button
              class="flex items-center rounded-full px-1 py-1 text-sm text-gray-700"
            >
              <ImageIcon
                class="h-10 w-10 stroke-gray-500 stroke-[1px] group-hover:stroke-black"
              />
            </button>
          </div>
        </div>
      </div>

      <div
        v-if="
          props.currentMediaType === 'video' &&
          editorDataStore.isUploading.value === false &&
          !props.readonly
        "
        class="mt-[20px] flex items-center justify-between gap-4"
      >
        <button
          @click="openCoverModal"
          class="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
        >
          <ImageIcon :size="16" />
          Set Cover Image
        </button>
      </div>

      <!-- Loading Spinner -->
      <div
        v-if="editorDataStore.isUploading.value"
        class="flex flex-col items-center justify-center py-8"
      >
        <Loader2 class="mb-2 h-10 w-10 animate-spin text-blue-500" />
        <p class="text-sm text-gray-500">Uploading media...</p>
        <div
          v-if="
            editorDataStore.uploadProgress.value > 0 &&
            editorDataStore.currentMediaType.value === 'video'
          "
          class="mt-4 w-[300px]"
        >
          <!-- Upload Progress -->
          <div class="mb-[20px] space-y-2">
            <div class="flex items-center justify-between text-sm">
              <span class="font-medium text-gray-700 dark:text-gray-200"
                >Uploading</span
              >
              <span class="text-gray-600 dark:text-gray-300"
                >{{ Math.round(editorDataStore.uploadProgress.value) }}%</span
              >
            </div>
            <div
              class="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
            >
              <div
                class="h-full rounded-full bg-blue-500 transition-all duration-300"
                :style="{
                  width: `${editorDataStore.uploadProgress.value}%`,
                }"
              ></div>
            </div>
          </div>

          <!-- Processing Progress -->
          <div class="space-y-2">
            <div class="flex items-center justify-between text-sm">
              <span class="font-medium text-gray-700 dark:text-gray-200"
                >Processing</span
              >
              <span class="text-gray-600 dark:text-gray-300"
                >{{
                  Math.round(editorDataStore.processingProgress.value)
                }}%</span
              >
            </div>
            <div
              class="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
            >
              <div
                class="h-full rounded-full bg-blue-500 transition-all duration-300"
                :style="{
                  width: `${editorDataStore.processingProgress.value}%`,
                }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Cover Image Modal -->
  <div
    v-if="showCoverModal && !props.readonly"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
  >
    <div class="w-[800px] rounded-lg bg-white p-8 dark:bg-gray-800">
      <h3 class="mb-6 text-xl font-semibold">Set Cover Image</h3>
      <div class="relative aspect-video w-full overflow-hidden rounded-lg">
        <video
          ref="modalVideoRef"
          :src="props.mediaPreviewUrls[0]"
          class="h-full w-full object-contain"
          @loadedmetadata="onModalVideoLoad"
        ></video>
      </div>
      <div class="mt-8">
        <p class="mb-3 text-sm text-gray-600 dark:text-gray-300">
          Use this bar to select your cover frame
        </p>
        <div class="relative">
          <input
            type="range"
            v-model="sliderValue"
            min="0"
            max="100"
            step="0.1"
            @mousedown="isDragging = true"
            @mouseup="isDragging = false"
            @touchstart="isDragging = true"
            @touchend="isDragging = false"
            class="w-full appearance-none bg-transparent [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-gray-200 dark:[&::-webkit-slider-runnable-track]:bg-gray-700 [&::-webkit-slider-thumb]:-mt-1 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:bg-blue-500 hover:[&::-webkit-slider-thumb]:bg-blue-600"
          />
          <div
            class="mt-2 text-center text-sm font-medium"
            :class="
              isDragging ? 'text-blue-500' : 'text-gray-600 dark:text-gray-300'
            "
          >
            {{ currentTimeFormatted }}
          </div>
        </div>
      </div>
      <div class="mt-8 flex justify-end gap-3">
        <button
          @click="showCoverModal = false"
          class="rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Cancel
        </button>
        <button
          @click="captureCoverImage"
          class="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          Save Cover Image
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .animate-slide-in {
    animation: slideIn 0.3s ease-out forwards;
  }

  .animate-slide-out {
    animation: slideOut 0.3s ease-in forwards;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes slideOut {
    from {
      opacity: 1;
      transform: translateX(0);
    }
    to {
      opacity: 0;
      transform: translateX(-20px);
    }
  }
</style>
