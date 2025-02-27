<script setup lang="ts">
  import { onMounted, ref, watch, computed } from 'vue';
  import DashboardNavigation from '@/components/layout/DashboardNavigation.vue';
  import postsStore from '@/utils/postsStore';
  import connectionsDataStore from '@/utils/connectionsDataStore';
  import PostFormBase from '@/components/common/forms/PostFormBase/PostFormBase.vue';
  import { useThemeStore } from '@/utils/themeStore';
  import editorDataStore from '@/utils/editorDataStore';
  import { Loader2, PanelRight, PanelRightClose } from 'lucide-vue-next';
  import ToggleSlider from '@/components/common/buttons/ToggleSlider.vue';
  import { useToast } from 'primevue';
  import { updatePostGroup } from '@/helpers/savePostGroup';
  import { getCreatorInfo } from '@api/tiktokApi';
  import DatePicker from 'primevue/datepicker';
  import PlatformButton from '@/components/common/buttons/PlatformButton.vue';
  import { FileEdit, SendHorizonal, Check } from 'lucide-vue-next';

  const toast = useToast();

  const themeStore = useThemeStore();

  const isLoading = ref(true);
  const showProgress = ref(false);

  // Schedule button state
  const scheduleButtonState = ref<
    'initial' | 'confirm' | 'processing' | 'scheduled'
  >('initial');

  let saveTimeout: NodeJS.Timeout | null = null;

  // Watch for progress completion
  watch(
    [
      () => editorDataStore.uploadProgress.value,
      () => editorDataStore.processingProgress.value,
    ],
    ([uploadProgress, processingProgress]) => {
      if (uploadProgress > 0 || processingProgress > 0) {
        showProgress.value = true;
      }

      if (uploadProgress === 100 && processingProgress === 100) {
        // Hide the progress after 1 second
        setTimeout(() => {
          showProgress.value = false;
          // Reset progress in store
          editorDataStore.uploadProgress.value = 0;
          editorDataStore.processingProgress.value = 0;
        }, 1000);
      }
    }
  );

  onMounted(async () => {
    // Set schedule button state based on post status
    if (editorDataStore.selectedPost.value?.status === 'scheduled') {
      scheduleButtonState.value = 'scheduled';
    }

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

  // Toggle panel visibility function
  const togglePanelVisibility = () => {
    editorDataStore.isPanelVisible.value =
      !editorDataStore.isPanelVisible.value;
  };

  // Get user's timezone
  const userTimezone = computed(() => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return timezone.replace(/_/g, ' ');
  });

  const getScheduledDate = computed({
    get: () => {
      return editorDataStore.selectedPost.value.scheduledTime
        ? new Date(editorDataStore.selectedPost.value.scheduledTime)
        : null;
    },
    set: (date: Date | null) => {
      editorDataStore.selectedPost.value.scheduledTime =
        date?.toISOString() || null;
    },
  });

  const togglePlatform = async (account: any) => {
    editorDataStore.isUserEdit.value = true;

    const accountId = (() => {
      switch (account.platform) {
        case 'twitter':
          return `twitter-${account.id}`;
        case 'threads':
          return `threads-${account.id}`;
        case 'bluesky':
          return `bluesky-${account.id}`;
        case 'mastodon':
          return `mastodon-${account.id}`;
        case 'tiktok':
          return `tiktok-${account.id}`;
        case 'instagram':
          return `instagram-${account.id}`;
        case 'youtube':
          return `youtube-${account.id}`;
        default:
          return account.platform;
      }
    })();

    const index =
      editorDataStore.selectedPost.value?.platforms.indexOf(accountId);
    if (index === -1) {
      editorDataStore.selectedPost.value?.platforms.push(accountId);
    } else {
      editorDataStore.selectedPost.value?.platforms.splice(index, 1);
    }

    debouncedSave();
    if (account.platform === 'tiktok') {
      await getCreatorInfo(account.id);
    }
  };

  // Debounced save function
  const debouncedSave = () => {
    // Clear any existing timeout
    editorDataStore.isUserEdit.value = true;
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    console.log('saving');

    // Show saving indicator immediately when typing starts
    editorDataStore.isSaving.value = true;

    // Set new timeout
    saveTimeout = setTimeout(async () => {
      try {
        await handleSave();
      } finally {
        editorDataStore.isSaving.value = false;
      }
    }, 700); // 0.3 second delay
  };

  async function handleSave() {
    try {
      editorDataStore.isSaving.value = true;
      await updatePostGroup(editorDataStore.selectedMedia.value);
      // toast.add({
      //   severity: 'success',
      //   summary: 'Success',
      //   detail: 'Post saved successfully',
      //   life: 3000,
      // });
    } catch (error: any) {
      console.error('Save error:', error);
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error?.response?.data?.message || 'Failed to save post',
        life: 3000,
      });
    } finally {
      editorDataStore.isSaving.value = false;
    }
  }

  const handleDateChange = () => {
    editorDataStore.isUserEdit.value = true;
    debouncedSave();
  };

  // Handle scheduling the post
  const handleSchedule = async () => {
    // First click - show confirmation
    if (scheduleButtonState.value === 'initial') {
      scheduleButtonState.value = 'confirm';
      return;
    }

    // Second click - process scheduling
    if (scheduleButtonState.value === 'confirm') {
      try {
        scheduleButtonState.value = 'processing';

        // Update status to scheduled
        editorDataStore.selectedPost.value.status = 'scheduled';

        // Save the post with the scheduled status
        await handleSave();

        scheduleButtonState.value = 'scheduled';

        toast.add({
          severity: 'success',
          summary: 'Scheduled',
          detail: 'Post has been scheduled successfully',
          life: 3000,
        });
      } catch (error: any) {
        console.error('Scheduling error:', error);
        scheduleButtonState.value = 'initial';

        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: error.message || 'Failed to schedule post',
          life: 3000,
        });
      }
    }
  };

  // Reset confirmation state when mouse leaves the button
  const handleScheduleButtonMouseLeave = () => {
    if (scheduleButtonState.value === 'confirm') {
      scheduleButtonState.value = 'initial';
    }
  };

  // Change post back to draft
  const handleChangeToDraft = async () => {
    try {
      scheduleButtonState.value = 'processing';

      // Update status to draft
      editorDataStore.selectedPost.value.status = 'draft';

      // Save the post with the draft status
      await handleSave();

      scheduleButtonState.value = 'initial';

      toast.add({
        severity: 'success',
        summary: 'Changed to Draft',
        detail: 'Post has been changed to draft',
        life: 3000,
      });
    } catch (error: any) {
      console.error('Change to draft error:', error);
      scheduleButtonState.value = 'scheduled';

      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Failed to change post to draft',
        life: 3000,
      });
    }
  };

  const postKey = computed(
    () => editorDataStore.selectedPost?.value._id || 'new'
  );
</script>

<template>
  <main
    class="transition-all duration-300"
    :class="{
      'ml-[260px] flex h-auto items-center justify-start bg-[white] dark:bg-[#121212]': true,
      'mr-[260px]': editorDataStore.isPanelVisible.value,
      'mr-0': !editorDataStore.isPanelVisible.value,
    }"
  >
    <DashboardNavigation />

    <transition name="fade" mode="out-in">
      <div class="flex w-full items-center justify-center" :key="postKey">
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
          class="relative flex min-h-[100vh] w-full flex-grow flex-col items-center justify-center"
        >
          <!-- View mode toggle -->
          <div class="flex w-full items-start justify-between p-2">
            <div class="flex w-full flex-col items-start justify-start gap-2">
              <!-- Platform buttons container with conditional flex-wrap -->
              <div class="flex w-full items-center gap-4">
                <ToggleSlider
                  v-model="editorDataStore.viewMode.value"
                  leftOption="Compact"
                  rightOption="Full"
                  leftValue="compact"
                  rightValue="full"
                />
                <div class="ml-auto text-sm text-gray-500 dark:text-gray-400">
                  Timezone: {{ userTimezone }}
                </div>
                <button
                  @click="togglePanelVisibility"
                  class="flex items-center gap-2 rounded-md border border-[#e9e9e9] px-1 py-1 text-sm font-medium text-gray-700 transition-all hover:bg-[#f9f9f9] dark:border-[#313131] dark:bg-[#1a1a1a] dark:text-gray-300 dark:hover:bg-[#252525]"
                >
                  <template v-if="editorDataStore.isPanelVisible.value">
                    <PanelRightClose class="h-4 w-4" />
                  </template>
                  <template v-else>
                    <PanelRight class="h-4 w-4" />
                  </template>
                </button>
              </div>
            </div>
          </div>
          <div class="mb-[30px] flex w-full items-start justify-between p-2">
            <div class="mr-[30px] flex items-center self-end">
              <!-- Platform buttons container with conditional flex-wrap -->
              <div class="flex flex-wrap gap-2">
                <PlatformButton
                  v-for="account in connectionsDataStore.connectedAccounts
                    .value"
                  :key="account.id"
                  :account="account"
                  :show-username="editorDataStore.viewMode.value === 'full'"
                  :is-selected="
                    editorDataStore.selectedPost.value?.platforms.includes(
                      account.platform === 'twitter'
                        ? `twitter-${account.id}`
                        : account.platform === 'threads'
                          ? `threads-${account.id}`
                          : account.platform === 'bluesky'
                            ? `bluesky-${account.id}`
                            : account.platform === 'mastodon'
                              ? `mastodon-${account.id}`
                              : account.platform === 'tiktok'
                                ? `tiktok-${account.id}`
                                : account.platform === 'instagram'
                                  ? `instagram-${account.id}`
                                  : account.platform === 'youtube'
                                    ? `youtube-${account.id}`
                                    : account.platform
                    )
                  "
                  :onClick="() => togglePlatform(account)"
                />
              </div>
            </div>
            <div class="ml-auto flex h-[38px] items-start justify-start">
              <DatePicker
                v-model="getScheduledDate"
                @hide="handleDateChange"
                showTime
                showIcon
                :showSeconds="false"
                hourFormat="12"
                class=""
              />
            </div>
            <button
              v-if="scheduleButtonState === 'scheduled'"
              @click="handleChangeToDraft"
              class="ml-2 flex h-[38px] items-center gap-2 rounded-md border border-[#e9e9e9] bg-[#f0f0f0] px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-[#e9e9e9] dark:border-[#313131] dark:bg-[#1a1a1a] dark:text-gray-300 dark:hover:bg-[#252525]"
            >
              Change to Draft
              <FileEdit class="h-4 w-4" />
            </button>
            <button
              v-else
              @click="handleSchedule"
              @mouseleave="handleScheduleButtonMouseLeave"
              :disabled="scheduleButtonState === 'processing'"
              :class="{
                'ml-2 flex h-[38px] items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-all': true,
                'border-[#e9e9e9] text-gray-700 hover:bg-[#f9f9f9] dark:border-[#313131]':
                  scheduleButtonState === 'initial',
                'bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30 border-green-200 dark:border-green-800':
                  scheduleButtonState === 'confirm',
                'border-[#e9e9e9] bg-[#f0f0f0] text-gray-400 dark:border-[#313131] dark:bg-[#1a1a1a] dark:text-gray-500':
                  scheduleButtonState === 'processing',
              }"
            >
              <template v-if="scheduleButtonState === 'initial'">
                Schedule
                <SendHorizonal class="h-4 w-4" />
              </template>
              <template v-else-if="scheduleButtonState === 'confirm'">
                Confirm
                <Check class="h-4 w-4" />
              </template>
              <template v-else-if="scheduleButtonState === 'processing'">
                Scheduling...
                <Loader2 class="h-4 w-4 animate-spin" />
              </template>
            </button>
          </div>
          <div
            v-if="!isLoading"
            class="relative flex min-h-[100%] w-full flex-grow items-start justify-center"
          >
            <div
              v-if="showProgress"
              class="absolute left-1/2 top-0 z-50 w-[400px] -translate-x-1/2 transform space-y-3 rounded-lg bg-white p-4 shadow-xl ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/5"
            >
              <!-- Upload Progress -->
              <div class="space-y-2">
                <div class="flex items-center justify-between text-sm">
                  <span class="font-medium text-gray-700 dark:text-gray-200"
                    >Uploading</span
                  >
                  <span class="text-gray-600 dark:text-gray-300"
                    >{{
                      Math.round(editorDataStore.uploadProgress.value)
                    }}%</span
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
      </div>
    </transition>
    <div
      :class="editorDataStore.isPanelVisible.value ? 'w-[260px]' : 'w-0'"
      class="fixed bottom-0 right-0 top-0 bg-[red] transition-all duration-300 ease-in-out"
    >
      test
    </div>
  </main>
</template>
