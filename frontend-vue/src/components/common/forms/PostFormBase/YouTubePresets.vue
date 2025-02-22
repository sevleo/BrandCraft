<script setup lang="ts">
  import { ref, computed } from 'vue';
  import { ChevronDown, ChevronUp } from 'lucide-vue-next';
  import Select from 'primevue/select';
  import editorDataStore from '@/utils/editorDataStore';

  const youtubeOptionsExpanded = ref(false);

  const youtubeTitle = computed({
    get: () =>
      editorDataStore.selectedPost.value.platformSettings.youtube?.title ?? '',
    set: (value: string) => {
      editorDataStore.selectedPost.value.platformSettings.youtube!.title =
        value;
    },
  });

  const youtubePrivacy = computed({
    get: () =>
      editorDataStore.selectedPost.value.platformSettings.youtube?.privacy ??
      'public',
    set: (value: 'private' | 'public' | 'unlisted') => {
      editorDataStore.selectedPost.value.platformSettings.youtube!.privacy =
        value;
    },
  });

  const privacyOptions = ref([
    { label: 'Private', value: 'private' },
    { label: 'Public', value: 'public' },
    { label: 'Unlisted', value: 'unlisted' },
  ]);
</script>

<template>
  <div
    class="rounded-[8px] border bg-gray-50 dark:border-[#313131] dark:bg-[#5a5a5a]"
  >
    <div
      class="cursor-pointer hover:bg-gray-200 dark:hover:bg-[#d9d9d9]/10"
      :class="youtubeOptionsExpanded ? 'rounded-t-[8px]' : 'rounded-[8px]'"
      @click="youtubeOptionsExpanded = !youtubeOptionsExpanded"
    >
      <div class="flex items-center justify-between px-4">
        <div class="flex items-center gap-2">
          <label class="cursor-pointer text-sm font-medium text-gray-700">
            YouTube Presets
          </label>
        </div>
        <div
          class="flex h-8 w-8 items-center justify-center rounded-full transition-colors"
        >
          <component
            :is="youtubeOptionsExpanded ? ChevronUp : ChevronDown"
            class="h-5 w-5 text-gray-600"
          />
        </div>
      </div>
    </div>

    <div
      v-if="youtubeOptionsExpanded"
      :class="[
        'overflow-hidden px-4 transition-all',
        youtubeOptionsExpanded ? 'py-3 opacity-100' : 'max-h-0 opacity-0',
      ]"
    >
      <div class="flex flex-col gap-2">
        <!-- Title Input -->
        <div class="mb-4">
          <label class="mb-2 block text-sm font-medium text-gray-700"
            >Title</label
          >
          <input
            type="text"
            v-model="youtubeTitle"
            class="block w-full rounded-md border border-gray-300 bg-white p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Enter video title"
          />
        </div>

        <!-- Privacy Setting -->
        <div class="mb-4">
          <label class="mb-2 block text-sm font-medium text-gray-700"
            >Privacy</label
          >
          <Select
            v-model="youtubePrivacy"
            :options="privacyOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Private"
            class="w-full"
          >
          </Select>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
