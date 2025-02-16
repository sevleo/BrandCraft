<script setup lang="ts">
  import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
  import { ChevronLeft, ChevronRight } from 'lucide-vue-next';

  const props = defineProps<{
    modelValue: boolean;
    mediaFiles: Array<{
      url: string;
      fileName: string;
      type: 'image' | 'video';
    }>;
    initialMediaIndex?: number;
  }>();

  const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void;
  }>();

  const isVisible = ref(false);
  const isBackgroundVisible = ref(false);
  const currentMediaIndex = ref(props.initialMediaIndex || 0);
  const selectedMedia = ref(
    props.mediaFiles?.[currentMediaIndex.value]?.url || undefined
  );

  const showNextMedia = () => {
    if (currentMediaIndex.value < props.mediaFiles.length - 1) {
      currentMediaIndex.value++;
      selectedMedia.value = props.mediaFiles[currentMediaIndex.value].url;
    }
  };

  const showPreviousMedia = () => {
    if (currentMediaIndex.value > 0) {
      currentMediaIndex.value--;
      selectedMedia.value = props.mediaFiles[currentMediaIndex.value].url;
    }
  };

  const handleKeyNavigation = (event: KeyboardEvent) => {
    if (!isVisible.value) return;

    if (event.key === 'ArrowLeft') {
      showPreviousMedia();
    } else if (event.key === 'ArrowRight') {
      showNextMedia();
    } else if (event.key === 'Escape') {
      closeDialog();
    }
  };

  const closeDialog = () => {
    isVisible.value = false;
    isBackgroundVisible.value = false;
    emit('update:modelValue', false);
  };

  watch(
    () => props.modelValue,
    (newValue) => {
      if (newValue) {
        isVisible.value = true;
        isBackgroundVisible.value = true;
        currentMediaIndex.value = props.initialMediaIndex || 0;
        selectedMedia.value =
          props.mediaFiles?.[currentMediaIndex.value]?.url || undefined;
      }
    },
    { immediate: true }
  );

  onMounted(() => {
    window.addEventListener('keydown', handleKeyNavigation);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleKeyNavigation);
  });
</script>

<template>
  <div v-if="modelValue" class="dialog fixed left-0 top-0 h-[100vh] w-[100vw]">
    <!-- Animated background overlay (no pointer events) -->
    <div
      class="pointer-events-none fixed inset-0 z-50"
      :class="{
        'animate-background-fade-in': isBackgroundVisible,
        'animate-background-fade-out': !isBackgroundVisible,
      }"
    ></div>

    <!-- Interactive content -->
    <div class="absolute inset-0 z-50">
      <!-- Backdrop for click handling only -->
      <div class="absolute inset-0" @click="closeDialog"></div>

      <button
        @click="closeDialog"
        class="absolute right-8 top-8 h-[50px] w-[50px] rounded-[10px] border border-[#b5b5b5] bg-[#181818] p-2 text-white transition-all hover:bg-opacity-90"
      >
        ✕
      </button>
      <!-- Dialog content -->
      <div
        class="absolute left-1/2 top-8 mt-2 translate-x-[-50%] text-center text-[20px] text-white"
      >
        {{ currentMediaIndex + 1 }}/{{ mediaFiles.length }}
      </div>
      <div
        class="absolute left-1/2 top-1/2 w-[800px] -translate-x-1/2 -translate-y-1/2 transform"
        :class="{
          'animate-dialog-open': isVisible,
          'animate-dialog-close': !isVisible,
        }"
      >
        <div class="flex flex-col gap-4 rounded-xl p-4">
          <!-- Main media container -->
          <div class="h-[500px]">
            <img
              v-if="mediaFiles[currentMediaIndex].type === 'image'"
              :src="selectedMedia"
              alt="Selected Media"
              class="w-full rounded-lg object-contain"
              style="max-height: 500px"
            />
            <video
              v-else-if="mediaFiles[currentMediaIndex].type === 'video'"
              :src="selectedMedia"
              controls
              autoplay
              class="w-full rounded-lg object-contain"
              style="max-height: 500px"
            ></video>
          </div>

          <!-- Thumbnail strip -->
          <div
            v-if="mediaFiles.length > 1"
            class="flex justify-center gap-2 overflow-x-auto p-2"
          >
            <button
              v-for="(item, index) in mediaFiles"
              :key="item.url"
              @click="
                () => {
                  currentMediaIndex = index;
                  selectedMedia = item.url;
                }
              "
              class="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-200"
              :class="[
                currentMediaIndex === index
                  ? 'border-white'
                  : 'border-transparent hover:border-gray-500',
              ]"
            >
              <img
                v-if="item.type === 'image'"
                :src="item.url"
                :alt="'Preview ' + (index + 1)"
                class="h-full w-full object-cover"
                :class="[
                  currentMediaIndex === index
                    ? 'opacity-100'
                    : 'opacity-50 hover:opacity-80',
                ]"
              />
              <video
                v-else-if="item.type === 'video'"
                :src="item.url"
                class="h-full w-full object-cover"
                :class="[
                  currentMediaIndex === index
                    ? 'opacity-100'
                    : 'opacity-50 hover:opacity-80',
                ]"
              ></video>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Buttons -->
    <div
      v-if="mediaFiles.length > 1"
      class="absolute inset-x-0 top-1/2 z-50 flex -translate-y-1/2 justify-between px-20"
    >
      <button
        @click="showPreviousMedia"
        class="rounded-[10px] border border-[#b5b5b5] bg-[#181818] p-6 text-white transition-all hover:bg-opacity-90 disabled:opacity-30"
        :disabled="currentMediaIndex === 0"
      >
        <ChevronLeft color="white" class="h-10 w-10" />
      </button>
      <button
        @click="showNextMedia"
        class="rounded-[10px] border border-[#b5b5b5] bg-[#181818] p-6 text-white transition-all hover:bg-opacity-90 disabled:opacity-30"
        :disabled="currentMediaIndex === mediaFiles.length - 1"
      >
        <ChevronRight color="white" class="h-10 w-10" />
      </button>
    </div>
  </div>
</template>

<style>
  @keyframes dialogOpen {
    from {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
  }

  @keyframes dialogClose {
    from {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
    to {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.95);
    }
  }

  @keyframes backgroundFadeIn {
    from {
      background-color: rgba(0, 0, 0, 0);
    }
    to {
      background-color: rgba(0, 0, 0, 0.8);
    }
  }

  @keyframes backgroundFadeOut {
    from {
      background-color: rgba(0, 0, 0, 0.8);
    }
    to {
      background-color: rgba(0, 0, 0, 0);
    }
  }

  .animate-dialog-open {
    animation: dialogOpen 0.2s ease-out forwards;
  }

  .animate-dialog-close {
    animation: dialogClose 0.2s ease-out forwards;
  }

  .animate-background-fade-in {
    animation: backgroundFadeIn 0.2s ease-out forwards;
  }

  .animate-background-fade-out {
    animation: backgroundFadeOut 0.2s ease-out forwards;
  }
</style>
