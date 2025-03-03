<script setup lang="ts">
  import { ref, computed, onMounted, nextTick, watch } from 'vue';
  import editorDataStore from '@/utils/editorDataStore';
  import PreviewComponent from '@/components/common/forms/PostFormBase/PreviewComponent.vue';

  import { Loader2 } from 'lucide-vue-next';

  const isLoading = ref(true);
  const replicatedValue = ref('');

  // Computed property to get platform display names
  computed(() => {
    const platforms = editorDataStore.selectedPost.value?.platforms || [];
    return platforms.map((platform: string) => {
      const [type, id] = platform.split('-');
      return {
        type,
        id,
        displayName: getPlatformDisplayName(type),
      };
    });
  });

  // Function to get platform display name
  function getPlatformDisplayName(platformType: string): string {
    switch (platformType) {
      case 'twitter':
        return 'Twitter';
      case 'threads':
        return 'Threads';
      case 'bluesky':
        return 'Bluesky';
      case 'mastodon':
        return 'Mastodon';
      case 'tiktok':
        return 'TikTok';
      case 'instagram':
        return 'Instagram';
      case 'youtube':
        return 'YouTube';
      default:
        return platformType.charAt(0).toUpperCase() + platformType.slice(1);
    }
  }

  // Get post status for display
  computed(() => {
    const status = editorDataStore.selectedPost.value?.status || '';
    if (status === 'published') {
      return 'Posted';
    } else if (status === 'partially_published') {
      return 'Partially Posted';
    }
    return 'Posted';
  });

  // Watch for changes in selectedPost and update replicatedValue
  watch(
    () => editorDataStore.selectedPost.value?.content,
    (newContent) => {
      replicatedValue.value = newContent || '';
    }
  );

  // Set initial values on mount
  onMounted(async () => {
    isLoading.value = false;

    // Initialize replicatedValue with current content
    replicatedValue.value = editorDataStore.selectedPost.value?.content || '';

    await nextTick(() => {
      isLoading.value = false;
    });
  });
</script>

<template>
  <transition name="fade" mode="out-in">
    <div
      v-if="!isLoading"
      class="transition-container flex w-full max-w-[1100px] flex-col items-start justify-start px-[30px]"
    >
      <!-- Loading Indicator -->
      <div
        :class="editorDataStore.isSaving.value ? 'opacity-100' : 'opacity-0'"
        class="saving-indicator absolute left-2 top-2 flex items-center gap-2 text-blue-500 transition-all duration-300"
      >
        <Loader2 class="h-4 w-4 animate-spin stroke-[gray]" />
      </div>

      <div class="flex w-full items-start justify-center gap-4">
        <!-- Middle Component -->
        <div
          class="scheduling-form border-greenBG mb-5 flex h-fit max-w-[600px] flex-grow rounded-[10px] bg-[white] dark:bg-[#121212]"
        >
          <div class="flex h-auto w-full flex-col gap-2 p-2">
            <div class="flex h-full w-full gap-8">
              <!-- Form Panel -->
              <div class="flex w-full flex-1 flex-col">
                <div
                  class="relative flex w-full flex-col rounded-[8px] dark:bg-[#1a1a1a]"
                >
                  <div
                    class="grow-wrap rounded-lg border border-[#ededed] bg-[white] p-2"
                    :data-replicated-value="replicatedValue"
                  >
                    <div
                      class="w-full rounded-lg bg-[white] p-2 text-black dark:bg-[#1a1a1a] dark:text-white"
                    >
                      {{ editorDataStore.selectedPost.value.content }}
                    </div>
                  </div>
                </div>

                <div class="mb-4"></div>

                <div
                  class="preview-container overflow-hidden rounded-[10px] bg-[white] dark:bg-[#313131]"
                >
                  <PreviewComponent
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
                    :debouncedSave="() => {}"
                    :handleSave="() => {}"
                    :readonly="true"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
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

  .grow-wrap > div {
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  .grow-wrap > div,
  .grow-wrap::after {
    font: inherit;
    grid-area: 1 / 1 / 2 / 2;
  }
</style>
