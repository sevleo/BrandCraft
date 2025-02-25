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
        <PostFormBase />
      </div>
      <div v-else class="flex h-[500px] w-full items-center justify-center">
        <Loader2 class="h-8 w-8 animate-spin stroke-[green]" />
      </div>
    </transition>
  </main>
</template>
