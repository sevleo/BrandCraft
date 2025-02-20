<script setup lang="ts">
  import { onMounted, ref } from 'vue';
  import DashboardNavigation from '@/components/layout/DashboardNavigation.vue';
  import postsStore from '@/utils/postsStore';
  import connectionsDataStore from '@/utils/connectionsDataStore';
  import PostFormBase from '@/components/common/forms/PostFormBase/PostFormBase.vue';
  import { useThemeStore } from '@/utils/themeStore';

  const themeStore = useThemeStore();

  const isLoading = ref(true);

  onMounted(async () => {
    isLoading.value = false;
    themeStore.initializeTheme();

    try {
      await Promise.all([
        connectionsDataStore.getAllAccounts(),
        postsStore.getAllPostGroups(),
      ]);
    } catch (error) {
      console.error('Error during initialization:', error);
    }
  });
</script>

<template>
  <main
    class="ml-[270px] flex h-auto items-center justify-start bg-[white] dark:bg-[#121212]"
  >
    <DashboardNavigation />

    <transition name="fade" mode="out-in">
      <!-- Post edit view -->
      <div
        v-if="!isLoading"
        class="flex w-full items-center justify-center pt-[30px]"
      >
        <PostFormBase />
      </div>
    </transition>
  </main>
</template>
