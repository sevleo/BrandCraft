<script setup lang="ts">
  import {
    Play,
    Pause,
    Image as ImageIcon,
    ChevronLeft,
    ChevronRight,
    X,
  } from 'lucide-vue-next';
  import { ref, watch } from 'vue';

  const isHoveringVideo = ref(false);
  const isVideoPlaying = ref(false);
  const isVideoVertical = ref(true);
  const videoDuration = ref<string>('');
  const videoRef = ref<HTMLVideoElement | null>(null);
  const modalVideoRef = ref<HTMLVideoElement | null>(null);
  const showCoverModal = ref(false);
  const sliderValue = ref(0);
  const lastSelectedTime = ref<number>(0);
  const currentTimeFormatted = ref<string>('0:00');
  const isDragging = ref(false);
  const videoProgress = ref(0);
  const videoCurrentTime = ref(0);
  const currentImageIndex = ref(0);

  const isTransitioning = ref(false);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const props = defineProps<{
    mediaPreviewUrls: string[];
    currentMediaType: 'image' | 'video' | null;
    initialVideoTimestamp?: number;
  }>();

  const emit = defineEmits<{
    (e: 'update:videoRef', videoRef: HTMLVideoElement | null): void;
    (e: 'update:timestamp', timestamp: number): void;
    (e: 'removeMedia', index: number): void;
  }>();

  // Emit the videoRef when it changes
  watch(videoRef, (newVideoRef) => {
    emit('update:videoRef', newVideoRef);
  });

  // Set initial timestamp if provided
  watch(
    () => props.initialVideoTimestamp,
    (newValue) => {
      if (newValue !== undefined) {
        lastSelectedTime.value = newValue;
        currentTimeFormatted.value = formatTime(newValue);

        // Update video position if video is already loaded
        if (videoRef.value?.duration) {
          videoRef.value.currentTime = newValue;
          sliderValue.value = (newValue / videoRef.value.duration) * 100;
        }
        if (modalVideoRef.value?.duration) {
          modalVideoRef.value.currentTime = newValue;
          sliderValue.value = (newValue / modalVideoRef.value.duration) * 100;
        }
      }
    },
    { immediate: true }
  );

  // Watch for video load to set initial timestamp
  watch(
    () => videoRef.value?.duration,
    (newDuration) => {
      if (newDuration && props.initialVideoTimestamp !== undefined) {
        videoRef.value!.currentTime = props.initialVideoTimestamp;
        sliderValue.value = (props.initialVideoTimestamp / newDuration) * 100;
      }
    }
  );

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

  const toggleVideo = () => {
    if (!videoRef.value) return;

    if (videoRef.value.paused) {
      videoRef.value.play();
      isVideoPlaying.value = true;
    } else {
      videoRef.value.pause();
      isVideoPlaying.value = false;
    }
  };

  const handleVideoLoad = () => {
    if (!videoRef.value) return;

    // Set initial timestamp if provided
    if (props.initialVideoTimestamp !== undefined && videoRef.value.duration) {
      videoRef.value.currentTime = props.initialVideoTimestamp;
      sliderValue.value =
        (props.initialVideoTimestamp / videoRef.value.duration) * 100;
    }

    // Start progress tracking
    videoRef.value.addEventListener('timeupdate', updateVideoProgress);

    isVideoVertical.value =
      videoRef.value.videoHeight > videoRef.value.videoWidth;

    // Format duration
    const duration = videoRef.value.duration;
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    videoDuration.value = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const openCoverModal = () => {
    if (!videoRef.value) return;
    showCoverModal.value = true;
    videoRef.value.pause();
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

    lastSelectedTime.value = newTime;
  };

  const captureCoverImage = () => {
    if (!modalVideoRef.value) return;
    const video = modalVideoRef.value;
    const timestamp = video.currentTime;
    lastSelectedTime.value = timestamp;
    emit('update:timestamp', timestamp);
    showCoverModal.value = false;
  };

  const updateVideoProgress = () => {
    if (!videoRef.value) return;
    videoCurrentTime.value = videoRef.value.currentTime;
    videoProgress.value =
      (videoRef.value.currentTime / videoRef.value.duration) * 100;
  };

  const onVideoProgressChange = () => {
    if (!videoRef.value) return;
    const newTime = (videoProgress.value / 100) * videoRef.value.duration;
    videoRef.value.currentTime = newTime;
    videoCurrentTime.value = newTime;
    emit('update:timestamp', newTime);
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

  const removeMedia = (index: number) => {
    emit('removeMedia', index);
  };

  watch(sliderValue, updateVideoFrame);
  watch(
    () => props.mediaPreviewUrls,
    () => {
      currentImageIndex.value = 0;
    },
    { deep: true }
  );
</script>

<template>
  <div
    id="preview-panel"
    class="flex h-fit min-h-[150px] flex-1 flex-col justify-start rounded-[8px] bg-[white] dark:bg-[#121212]"
  >
    <div class="flex h-[800px] w-full flex-col items-center justify-start">
      <div
        id="empty-preview"
        v-if="!props.currentMediaType && !isTransitioning"
        class="h-[600px] min-h-[600px] w-full bg-[gray]"
      >
        Select a media type
      </div>
      <div
        class="preview-container flex flex-col"
        :class="props.currentMediaType ? 'w-[340px]' : 'w-[0px] border-0'"
        @transitionstart="isTransitioning = true"
        @transitionend="isTransitioning = false"
      >
        <div class="relative h-[600px] overflow-hidden rounded-lg bg-black">
          <!-- Video Preview -->
          <template v-if="props.currentMediaType === 'video'">
            <div
              class="relative h-full w-full"
              @mouseenter="isHoveringVideo = true"
              @mouseleave="isHoveringVideo = false"
            >
              <video
                ref="videoRef"
                :src="props.mediaPreviewUrls[0]"
                @timeupdate="updateVideoProgress"
                class="h-full w-full"
                :class="{
                  'object-cover': isVideoVertical,
                  'object-contain': !isVideoVertical,
                }"
                @click="toggleVideo"
                @loadedmetadata="handleVideoLoad"
              ></video>
              <div
                @click="toggleVideo"
                class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full bg-black/30 p-4 backdrop-blur-sm transition-opacity duration-200"
                :class="{
                  'opacity-100': !isVideoPlaying || isHoveringVideo,
                  'opacity-0': isVideoPlaying && !isHoveringVideo,
                }"
              >
                <Play v-if="!isVideoPlaying" :size="40" color="white" />
                <Pause v-else :size="40" color="white" />
              </div>
              <!-- Remove Button -->
              <button
                @click="removeMedia(0)"
                class="absolute right-2 top-2 z-10 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70"
              >
                <X :size="20" color="white" />
              </button>
            </div>
          </template>

          <!-- Image Preview -->
          <template v-else-if="props.currentMediaType === 'image'">
            <div class="relative h-full w-full">
              <!-- Remove Button -->
              <button
                @click="removeMedia(currentImageIndex)"
                class="absolute right-2 top-2 z-10 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70"
              >
                <X :size="20" color="white" />
              </button>
              <img
                :src="props.mediaPreviewUrls[currentImageIndex]"
                class="h-full w-full object-contain"
                alt="Preview"
              />
              <!-- Navigation Arrows -->
              <div
                v-if="props.mediaPreviewUrls.length > 1"
                class="absolute bottom-4 flex h-fit w-full flex-col items-center justify-center"
              >
                <div class="flex items-center justify-center">
                  <button
                    @click="previousImage"
                    class="mr-2 rounded-full bg-white/30 p-2 text-white backdrop-blur-sm transition-opacity hover:bg-white/50"
                    :disabled="currentImageIndex === 0"
                    :class="{
                      'cursor-not-allowed opacity-50': currentImageIndex === 0,
                    }"
                  >
                    <ChevronLeft :size="16" />
                  </button>
                  <!-- Thumbnail Strip -->
                  <div
                    v-if="props.mediaPreviewUrls.length > 1"
                    class="flex max-w-[300px] justify-center gap-2 overflow-x-auto rounded-lg bg-black/30 p-2 backdrop-blur-sm"
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
                    class="ml-2 rounded-full bg-white/30 p-2 text-white backdrop-blur-sm transition-opacity hover:bg-white/50"
                    :disabled="
                      currentImageIndex === props.mediaPreviewUrls.length - 1
                    "
                    :class="{
                      'cursor-not-allowed opacity-50':
                        currentImageIndex === props.mediaPreviewUrls.length - 1,
                    }"
                  >
                    <ChevronRight :size="16" />
                  </button>
                </div>
                <!-- Image Counter -->
                <div
                  v-if="props.mediaPreviewUrls.length > 1"
                  class="rounded-full bg-black/30 px-3 py-1 text-sm text-white backdrop-blur-sm"
                >
                  {{ currentImageIndex + 1 }} /
                  {{ props.mediaPreviewUrls.length }}
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- Controls -->
        <div v-if="props.currentMediaType === 'video'" class="mt-2 px-2">
          <div class="relative">
            <input
              type="range"
              v-model="videoProgress"
              min="0"
              max="100"
              step="0.1"
              @input="onVideoProgressChange"
              class="w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-gray-200 [&::-webkit-slider-runnable-track]:shadow-inner dark:[&::-webkit-slider-runnable-track]:bg-gray-700 [&::-webkit-slider-thumb]:-mt-[4px] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:shadow-md hover:[&::-webkit-slider-thumb]:bg-blue-600 dark:[&::-webkit-slider-thumb]:border-gray-800"
            />
            <div
              class="mt-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400"
            >
              {{ formatTime(videoCurrentTime) }} / {{ videoDuration }}
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between gap-4">
          <button
            v-if="props.currentMediaType === 'video'"
            @click="openCoverModal"
            class="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            <ImageIcon :size="16" />
            Set Cover Image
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Cover Image Modal -->
  <div
    v-if="showCoverModal"
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

<style scoped>
  /* Right component transition */
  .preview-container {
    overflow: hidden;
    transition: all 0.3s ease-in-out;
  }
</style>
