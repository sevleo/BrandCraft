<script setup lang="ts">
  import { onMounted, ref } from 'vue';
  import DashboardNavigation from '@/components/layout/DashboardNavigation.vue';
  import scheduledPostsStore from '@/utils/scheduledPostsStore';
  import connectionsDataStore from '@/utils/connectionsDataStore';
  import PostFormBase from '@/components/common/forms/PostFormBase/PostFormBase.vue';
  import { useThemeStore } from '@/utils/themeStore';
  import editorDataStore from '@/utils/editorDataStore';

  const themeStore = useThemeStore();

  onMounted(async () => {
    themeStore.initializeTheme();

    try {
      await Promise.all([
        connectionsDataStore.getAllAccounts(),
        scheduledPostsStore.updateScheduledPostDataStore(),
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

    <!-- Post edit view -->
    <div class="h-full max-h-[800px] w-full">
      <PostFormBase
        :selectedPost="editorDataStore.selectedPost.value"
        :initialDateTime="
          editorDataStore.selectedPost.value
            ? new Date(editorDataStore.selectedPost.value.scheduledTime)
            : editorDataStore.selectedDateTime.value
        "
      />
    </div>
  </main>
</template>
