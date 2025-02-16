<script setup lang="ts">
  import { onMounted, ref } from 'vue';
  import DashboardNavigation from '@/components/layout/DashboardNavigation.vue';
  import ScheduleGrid from '@/components/views/DashboardViews/PublishView/ScheduleGrid.vue';
  import scheduledPostsStore from '@/utils/scheduledPostsStore';
  import ScheduleList from '@/components/views/DashboardViews/PublishView/ScheduleList.vue';
  import publishViewDataStore from '@/utils/publishViewDataStore';
  import { List, Calendar, FilePlus2 } from 'lucide-vue-next';
  import BaseButton from '@/components/common/buttons/BaseButton.vue';
  import connectionsDataStore from '@/utils/connectionsDataStore';
  import PostFormBase from '@/components/common/forms/PostFormBase/PostFormBase.vue';
  import { useThemeStore } from '@/utils/themeStore';

  const themeStore = useThemeStore();

  const creationModalOpen = ref(false);
  const editModalOpen = ref(false);
  const selectedDateTime = ref<Date | null>(null);
  const selectedPost = ref<any>(null);

  function openPostCreationModal(dateTime?: Date | null) {
    selectedDateTime.value = dateTime || null;
    creationModalOpen.value = true;
  }

  function closePostCreationModal() {
    creationModalOpen.value = false;
    selectedDateTime.value = null;
  }

  function openPostEditModal(post: any) {
    selectedPost.value = post;
    editModalOpen.value = true;
  }

  function closePostEditModal() {
    editModalOpen.value = false;
    selectedPost.value = null;
  }

  function handleSchedulePost() {}
  // content: string,
  // scheduledTime: Date,
  // selectedPlatforms: string[]

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
  <DashboardNavigation />
  <main
    class="mx-auto flex h-[calc(100vh-65px)] max-w-[1200px] flex-col items-center justify-start bg-[white] p-6 dark:bg-[#121212]"
  >
    <!-- Schedule View -->
    <div v-if="!creationModalOpen && !editModalOpen" class="w-full">
      <div class="flex justify-start gap-2">
        <h1
          class="flex items-center justify-center gap-2 text-[25px] font-semibold"
        >
          <span><FilePlus2 /></span>
          <span> Publisher </span>
        </h1>
        <div
          class="ml-auto flex items-center justify-center gap-2 rounded-md border border-gray-200 p-[4px] dark:border-[#313131]"
        >
          <BaseButton
            size="sm"
            :active="publishViewDataStore.currentView.value === 'list'"
            @click="publishViewDataStore.currentView.value = 'list'"
            noborder
          >
            <List
              class="h-4 w-4"
              :color="
                themeStore.currentTheme === 'light'
                  ? publishViewDataStore.currentView.value === 'list'
                    ? 'white'
                    : 'currentColor'
                  : themeStore.currentTheme === 'dark'
                    ? publishViewDataStore.currentView.value === 'list'
                      ? 'black'
                      : 'white'
                    : ''
              "
            />
            List
          </BaseButton>
          <BaseButton
            :active="publishViewDataStore.currentView.value === 'calendar'"
            @click="publishViewDataStore.currentView.value = 'calendar'"
            size="sm"
            noborder
          >
            <Calendar
              class="h-4 w-4"
              :color="
                themeStore.currentTheme === 'light'
                  ? publishViewDataStore.currentView.value === 'calendar'
                    ? 'white'
                    : 'currentColor'
                  : themeStore.currentTheme === 'dark'
                    ? publishViewDataStore.currentView.value === 'calendar'
                      ? 'black'
                      : 'white'
                    : ''
              "
            />
            Calendar
          </BaseButton>
        </div>
        <div class="flex items-center justify-center">
          <BaseButton @click="() => openPostCreationModal()">
            <span class="font-medium">+</span>
            Create Post
          </BaseButton>
        </div>
      </div>

      <ScheduleGrid
        v-if="publishViewDataStore.currentView.value === 'calendar'"
        @schedulePost="handleSchedulePost"
        @timeSlotClick="openPostCreationModal"
        @editPost="openPostEditModal"
      />
      <ScheduleList
        v-if="publishViewDataStore.currentView.value === 'list'"
        @edit="openPostEditModal"
      />
    </div>

    <!-- Post creation view -->
    <div
      v-else-if="creationModalOpen"
      class="flex h-full max-h-[800px] w-full justify-center"
    >
      <PostFormBase
        :mode="'create'"
        :initialDateTime="selectedDateTime"
        @cancel="closePostCreationModal"
      />
    </div>

    <!-- Post edit view -->
    <div v-else class="h-full max-h-[800px] w-full">
      <PostFormBase
        v-if="selectedPost"
        :mode="'edit'"
        :postId="selectedPost._id"
        :initialContent="selectedPost.content"
        :initialDateTime="new Date(selectedPost.scheduledTime)"
        :initialPlatforms="selectedPost.platforms"
        :initialMedia="selectedPost.mediaFiles"
        :initialStatus="selectedPost.status"
        :initialMediaType="selectedPost.mediaFiles[0]?.type"
        :initialPosts="selectedPost.posts"
        :initialVideoTimestamp="selectedPost.videoTimestamp"
        @cancel="closePostEditModal"
      />
    </div>
  </main>
</template>
