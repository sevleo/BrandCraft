<script setup lang="ts">
  import ScheduleGrid from './PublishView/ScheduleGrid.vue';
  import DashboardNavigation from '@/components/layout/DashboardNavigation.vue';
  import connectionsDataStore from '@/utils/connectionsDataStore';
  import scheduledPostsStore from '@/utils/scheduledPostsStore';

  import { onMounted } from 'vue';

  onMounted(async () => {
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
  <DashboardNavigation />

  <main
    class="ml-[270px] flex h-auto max-w-[1200px] items-center justify-start bg-[white] p-6 dark:bg-[#121212]"
  >
    <ScheduleGrid />
  </main>
</template>
