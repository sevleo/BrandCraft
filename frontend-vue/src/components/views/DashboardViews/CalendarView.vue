<script setup lang="ts">
  import ScheduleGrid from './PublishView/ScheduleGrid.vue';
  import { useToast } from 'primevue/usetoast';
  import scheduledPostsStore from '@/utils/scheduledPostsStore';
  import DashboardNavigation from '@/components/layout/DashboardNavigation.vue';

  const toast = useToast();

  const handleSchedulePost = async (
    content: string,
    scheduledTime: Date,
    selectedPlatforms: string[]
  ) => {
    try {
      await scheduledPostsStore.schedulePost(
        content,
        scheduledTime,
        selectedPlatforms
      );
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Post scheduled successfully',
        life: 3000,
      });
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to schedule post',
        life: 3000,
      });
    }
  };

  const handleEditPost = (post: any) => {
    // Handle edit post functionality
    console.log('Editing post:', post);
  };

  const handleTimeSlotClick = (dateTime: Date) => {
    // Handle time slot click
    console.log('Time slot clicked:', dateTime);
  };
</script>

<template>
  <DashboardNavigation />

  <main
    class="ml-[270px] flex h-auto max-w-[1200px] items-center justify-start bg-[white] p-6 dark:bg-[#121212]"
  >
    <ScheduleGrid
      @schedule-post="handleSchedulePost"
      @edit-post="handleEditPost"
      @time-slot-click="handleTimeSlotClick"
    />
  </main>
</template>
