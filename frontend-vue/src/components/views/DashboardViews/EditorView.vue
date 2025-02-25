<script setup lang="ts">
  import { onMounted, ref } from 'vue';
  import DashboardNavigation from '@/components/layout/DashboardNavigation.vue';
  import postsStore from '@/utils/postsStore';
  import connectionsDataStore from '@/utils/connectionsDataStore';
  import PostFormBase from '@/components/common/forms/PostFormBase/PostFormBase.vue';
  import { useThemeStore } from '@/utils/themeStore';
  import editorDataStore from '@/utils/editorDataStore';
  import { Loader2 } from 'lucide-vue-next';

  const themeStore = useThemeStore();

  const isLoading = ref(true);

  onMounted(async () => {
    themeStore.initializeTheme();

    try {
      await Promise.all([
        connectionsDataStore.getAllAccounts(),
        postsStore.getAllPostGroups(),
      ]);
    } catch (error) {
      console.error('Error during initialization:', error);
    } finally {
      isLoading.value = false;
    }
  });
</script>

<template>
  <main
    class="ml-[270px] flex h-auto items-center justify-start bg-[white] dark:bg-[#121212]"
  >
    <DashboardNavigation />

    <transition name="fade" mode="out-in">
      <!-- Loading state -->

      <!-- No post selected state -->
      <div
        v-if="
          !isLoading &&
          postsStore.draftPosts.value.length === 0 &&
          editorDataStore.selectedPost.value._id === ''
        "
        class="flex h-[500px] w-full items-center justify-center"
      >
        <p>No draft post selected.</p>
      </div>

      <!-- Post edit view -->
      <div
        v-else-if="
          !isLoading &&
          postsStore.draftPosts.value.length > 0 &&
          editorDataStore.selectedPost.value._id !== ''
        "
        class="relative flex w-full flex-grow items-center justify-center pt-[30px]"
      >
        <div
          v-if="!isLoading"
          :class="'relative flex w-full flex-grow items-center justify-center pt-[30px]'"
        >
          <div
            v-if="
              editorDataStore.uploadProgress.value > 0 ||
              editorDataStore.processingProgress.value > 0
            "
            class="fixed left-1/2 top-4 z-50 w-[400px] -translate-x-1/2 transform space-y-3 rounded-lg bg-white p-4 shadow-lg dark:bg-gray-800"
          >
            <!-- Upload Progress -->
            <div class="space-y-2">
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

          <PostFormBase />
        </div>
      </div>
      <div v-else class="flex h-[500px] w-full items-center justify-center">
        <Loader2 class="h-8 w-8 animate-spin stroke-[green]" />
      </div>
    </transition>
  </main>
</template>
