<script setup lang="ts">
  import { ref, watch } from 'vue';
  import { ChevronDown, ChevronUp } from 'lucide-vue-next';

  const props = defineProps<{
    currentMediaType: 'image' | 'video' | null;
    initialSettings: {
      videoType: 'REELS' | 'STORIES';
    };
  }>();

  const emit = defineEmits<{
    (e: 'update:settings', settings: any): void;
  }>();

  const instagramOptionsExpanded = ref(false);
  const instagramVideoType = ref<'REELS' | 'STORIES'>(
    props.initialSettings.videoType
  );

  watch([instagramVideoType], () => {
    emit('update:settings', {
      videoType: instagramVideoType.value,
    });
  });
</script>

<template>
  <div
    class="rounded-[8px] border bg-gray-50 dark:border-[#313131] dark:bg-[#5a5a5a]"
  >
    <div
      class="cursor-pointer hover:bg-gray-200 dark:hover:bg-[#d9d9d9]/10"
      :class="instagramOptionsExpanded ? 'rounded-t-[8px]' : 'rounded-[8px]'"
      @click="instagramOptionsExpanded = !instagramOptionsExpanded"
    >
      <div class="flex items-center justify-between px-4">
        <div class="flex items-center gap-2">
          <label class="cursor-pointer text-sm font-medium text-gray-700">
            Instagram Presets
          </label>
        </div>
        <div
          class="flex h-8 w-8 items-center justify-center rounded-full transition-colors"
        >
          <component
            :is="instagramOptionsExpanded ? ChevronUp : ChevronDown"
            class="h-5 w-5 text-gray-600"
          />
        </div>
      </div>
    </div>

    <div
      v-if="instagramOptionsExpanded"
      :class="[
        'overflow-hidden px-4 transition-all',
        instagramOptionsExpanded ? 'py-3 opacity-100' : 'max-h-0 opacity-0',
      ]"
    >
      <div class="flex flex-col gap-2">
        <p class="text-sm font-bold">Instagram Video Type</p>
        <div class="flex gap-4">
          <button
            class="rounded-md px-4 py-2 text-[black] transition-colors dark:text-[black]"
            :class="[
              currentMediaType !== 'video'
                ? 'cursor-not-allowed bg-gray-100'
                : instagramVideoType === 'REELS'
                  ? 'bg-blue-500'
                  : 'bg-gray-200',
            ]"
            @click="
              currentMediaType === 'video' && (instagramVideoType = 'REELS')
            "
            :disabled="currentMediaType !== 'video'"
          >
            REEL
          </button>
          <button
            class="rounded-md px-4 py-2 text-[black] transition-colors dark:text-[black]"
            :class="[
              currentMediaType !== 'video'
                ? 'cursor-not-allowed bg-gray-100'
                : instagramVideoType === 'STORIES'
                  ? 'bg-blue-500'
                  : 'bg-gray-200',
            ]"
            @click="
              currentMediaType === 'video' && (instagramVideoType = 'STORIES')
            "
            :disabled="currentMediaType !== 'video'"
          >
            STORY
          </button>
        </div>
        <p
          v-if="currentMediaType === null"
          class="text-xs italic text-gray-500"
        >
          Please upload a video to select video type
        </p>
        <p
          v-else-if="currentMediaType === 'image'"
          class="text-xs italic text-gray-500"
        >
          Video type selection is only available for video uploads
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
