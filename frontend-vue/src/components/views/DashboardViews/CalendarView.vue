<script setup lang="ts">
  import ScheduleGrid from './PublishView/ScheduleGrid.vue';
  import DashboardNavigation from '@/components/layout/DashboardNavigation.vue';
  import connectionsDataStore from '@/utils/connectionsDataStore';
  import postsStore from '@/utils/postsStore';

  import { onMounted, ref } from 'vue';

  const isLoading = ref(true);

  onMounted(async () => {
    isLoading.value = false;

    try {
      await Promise.all([
        connectionsDataStore.getAllAccounts(),
        postsStore.getAllPostGroups(),
      ]);
    } catch (error) {
      console.error('Error during initialization:', error);
    } finally {
    }
  });
</script>

<template>
  <DashboardNavigation />

  <transition name="fade" mode="out-in">
    <main
      v-if="!isLoading"
      class="ml-[270px] flex h-auto max-w-[1200px] items-center justify-start bg-[white] p-6 dark:bg-[#121212]"
    >
      <ScheduleGrid />
    </main>
  </transition>
</template>
