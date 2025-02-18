<script setup lang="ts">
  import { onMounted, computed, ref } from 'vue';
  import DashboardNavigation from '@/components/layout/DashboardNavigation.vue';
  import scheduledPostsStore from '@/utils/scheduledPostsStore';
  import connectionsDataStore from '@/utils/connectionsDataStore';
  import PostFormBase from '@/components/common/forms/PostFormBase/PostFormBase.vue';
  import { useThemeStore } from '@/utils/themeStore';
  import editorDataStore from '@/utils/editorDataStore';

  const themeStore = useThemeStore();

  const isLoading = ref(true);

  const selectedPost = computed(() => editorDataStore.selectedPost.value);
  const initialDateTime = computed(() =>
    editorDataStore.selectedPost.value
      ? new Date(editorDataStore.selectedPost.value.scheduledTime)
      : editorDataStore.selectedDateTime.value
  );

  onMounted(async () => {
    isLoading.value = false;
    themeStore.initializeTheme();

    try {
      await Promise.all([
        connectionsDataStore.getAllAccounts(),
        scheduledPostsStore.getAllPostGroups(),
      ]);
    } catch (error) {
      console.error('Error during initialization:', error);
    }
  });
</script>

<template>
  <main
    class="ml-[270px] flex h-auto max-w-[1200px] items-center justify-start bg-[white] p-6 dark:bg-[#121212]"
  >
    <DashboardNavigation />

    <transition name="fade" mode="out-in">
      <!-- Post edit view -->
      <div v-if="!isLoading" class="h-full max-h-[800px] w-full">
        <PostFormBase
          :selectedPost="selectedPost"
          :initialDateTime="initialDateTime"
        />
      </div>
    </transition>
  </main>
</template>
