<script setup>
  import { onMounted } from 'vue';
  import postsStore from '@/utils/postsStore';

  onMounted(async () => {
    await postsStore.updatePostStats();
  });
</script>

<template>
  <div class="w-full max-w-2xl">
    <h3 class="mb-6 text-[20px]">Summary</h3>
    <h2 class="mb-2 mt-7 text-2xl">Total Posts</h2>

    <div class="grid grid-cols-2 gap-6">
      <!-- Total Post Groups -->
      <div class="rounded-xl bg-gray-50 p-6 dark:bg-[#393939]">
        <h3 class="mb-2 text-base font-medium text-gray-600">Post Groups</h3>
        <p class="text-4xl font-bold">
          {{ postsStore.animatedTotalGroups }}
        </p>
      </div>

      <!-- Total Posts -->
      <div class="rounded-xl bg-gray-50 p-6 dark:bg-[#393939]">
        <h3 class="mb-2 text-base font-medium text-gray-600">
          Posts by Platform
        </h3>
        <p class="text-4xl font-bold">
          {{ postsStore.animatedTotalPosts }}
        </p>
      </div>
    </div>

    <h2 class="mb-2 mt-7 text-2xl">Posts by Status</h2>

    <div class="grid grid-cols-2 gap-6">
      <!-- Scheduled Posts -->
      <div class="rounded-xl bg-gray-50 p-6 dark:bg-[#393939]">
        <h3 class="mb-2 text-base font-medium text-gray-600">Scheduled</h3>
        <p class="text-4xl font-bold">
          {{ postsStore.animatedScheduledPosts }}
        </p>
      </div>

      <!-- Published Posts -->
      <div class="rounded-xl bg-gray-50 p-6 dark:bg-[#393939]">
        <h3 class="mb-2 text-base font-medium text-gray-600">Published</h3>
        <p class="text-4xl font-bold">
          {{ postsStore.animatedPublishedPosts }}
        </p>
      </div>

      <!-- Draft Posts -->
      <div class="rounded-xl bg-gray-50 p-6 dark:bg-[#393939]">
        <h3 class="mb-2 text-base font-medium text-gray-600">Draft</h3>
        <p class="text-4xl font-bold">
          {{ postsStore.animatedDraftPosts }}
        </p>
      </div>

      <!-- Failed Posts -->
      <div class="rounded-xl bg-gray-50 p-6 dark:bg-[#393939]">
        <h3 class="mb-2 text-base font-medium text-gray-600">Failed</h3>
        <p class="text-4xl font-bold">
          {{ postsStore.animatedFailedPosts }}
        </p>
      </div>
    </div>
  </div>
</template>
