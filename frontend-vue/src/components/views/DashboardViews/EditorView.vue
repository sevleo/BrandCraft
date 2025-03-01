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
  import {
    formatDistanceToNow,
    format,
    isToday,
    isYesterday,
    isThisWeek,
    parseISO,
  } from 'date-fns';
  import { errors } from '@/utils/editorValidations';

  const toast = useToast();

  const themeStore = useThemeStore();

  const isLoading = ref(true);
  const showProgress = ref(false);

  // Schedule button state
  const scheduleButtonState = ref<'draft' | 'scheduled'>('draft');
  // Track if status change is in progress
  const isStatusChanging = ref(false);

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

  // Watch for selected post changes
  watch(
    () => editorDataStore.selectedPost.value,
    (newPost) => {
      // Only update button state if we're not in the middle of a status change
      if (!isStatusChanging.value) {
        if (newPost?.status === 'scheduled') {
          scheduleButtonState.value = 'scheduled';
        } else if (newPost?.status === 'draft') {
          scheduleButtonState.value = 'draft';
        }
      }
    },
    { deep: true }
  );

  onMounted(async () => {
    // Set schedule button state based on post status
    if (editorDataStore.selectedPost.value?.status === 'scheduled') {
      scheduleButtonState.value = 'scheduled';
    } else if (editorDataStore.selectedPost.value?.status === 'draft') {
      scheduleButtonState.value = 'draft';
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

  // Toggle post status between draft and scheduled
  const togglePostStatus = async (action: 'schedule' | 'draft') => {
    // If already in the process of changing status, don't allow another change
    if (isStatusChanging.value) {
      return;
    }

    try {
      // Set status changing flag to true
      isStatusChanging.value = true;

      if (action === 'schedule') {
        // Check for validation errors before scheduling
        if (hasValidationErrors.value) {
          toast.add({
            closable: false,
            severity: 'error',
            detail: 'Please fix validation errors before setting the post live',
            life: 3000,
          });
          isStatusChanging.value = false;
          return;
        }

        // Update status to scheduled
        editorDataStore.selectedPost.value.status = 'scheduled';

        // Save the post with the scheduled status and wait for confirmation
        await handleSave();

        // Only change button state after successful save
        scheduleButtonState.value = 'scheduled';

        toast.add({
          closable: false,
          severity: 'success',
          detail: 'Set Live',
          life: 2000,
        });
      } else if (action === 'draft') {
        // Update status to draft
        editorDataStore.selectedPost.value.status = 'draft';

        // Save the post with the draft status and wait for confirmation
        await handleSave();

        // Only change button state after successful save
        scheduleButtonState.value = 'draft';

        toast.add({
          closable: false,
          severity: 'success',
          detail: 'Unpublished',
          life: 2000,
        });
      }
    } catch (error: any) {
      console.error('Error changing post status:', error);

      // Revert the status change in the data store if there was an error
      if (action === 'schedule') {
        editorDataStore.selectedPost.value.status = 'draft';
      } else if (action === 'draft') {
        editorDataStore.selectedPost.value.status = 'scheduled';
      }

      toast.add({
        closable: false,
        severity: 'error',
        detail:
          error?.response?.data?.message || 'Failed to change post status',
        life: 3000,
      });
    } finally {
      // Set status changing flag back to false
      isStatusChanging.value = false;
    }
  };

  const postKey = computed(
    () => editorDataStore.selectedPost?.value._id || 'new'
  );

  const formatDate = (dateString: string) => {
    if (!dateString) return '';

    const date = parseISO(dateString);
    const now = new Date();
    const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60);

    if (diffInMinutes < 1) {
      return 'just now';
    } else if (isToday(date)) {
      return formatDistanceToNow(date, { addSuffix: true }); // e.g., "2 hours ago"
    } else if (isYesterday(date)) {
      return 'yesterday';
    } else if (isThisWeek(date)) {
      return format(date, 'EEEE'); // Day of week (Monday, Tuesday, etc.)
    } else {
      return format(date, 'MMM d, yyyy'); // Feb 28, 2025
    }
  };

  // Check if there are any validation errors
  const hasValidationErrors = computed(() => errors.value.length > 0);
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
      <div :key="postKey" class="flex w-full items-center justify-center">
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
            postsStore.postGroups.value.length > 0 &&
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
                  class="flex items-center gap-2 rounded-md border-[#e9e9e9] px-1 py-1 text-sm font-medium text-gray-700 transition-all hover:bg-[#f9f9f9] dark:border-[#313131] dark:bg-[#1a1a1a] dark:text-gray-300 dark:hover:bg-[#252525]"
                >
                  <template v-if="editorDataStore.isPanelVisible.value">
                    <PanelRightClose class="h-4 w-4 stroke-gray-700" />
                  </template>
                  <template v-else>
                    <PanelRight class="h-4 w-4 stroke-gray-700" />
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
              v-if="scheduleButtonState === 'draft'"
              @click="() => togglePostStatus('schedule')"
              :disabled="hasValidationErrors || isStatusChanging"
              :class="[
                'ml-2 flex h-[38px] w-[120px] items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-all',
                hasValidationErrors || isStatusChanging
                  ? 'cursor-not-allowed border-gray-300 bg-gray-100 text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500'
                  : 'text-green-700 dark:text-green-400 border-green-500 bg-[#f0f9f0] hover:bg-[#e6f7e6] dark:border-green-700 dark:bg-[#0a1f0a] dark:hover:bg-[#1a331a]',
              ]"
            >
              <span class="font-normal">Set Live</span>
              <span v-if="isStatusChanging">
                <Loader2
                  class="h-4 w-4 animate-spin text-gray-400 dark:text-gray-500"
                />
              </span>
              <SendHorizonal
                v-else
                :class="[
                  'h-4 w-4',
                  hasValidationErrors || isStatusChanging
                    ? 'text-gray-400 dark:text-gray-500'
                    : 'text-green-600 dark:text-green-400',
                ]"
              />
            </button>

            <button
              v-else-if="scheduleButtonState === 'scheduled'"
              @click="() => togglePostStatus('draft')"
              :disabled="isStatusChanging"
              :class="[
                'ml-2 flex h-[38px] w-[120px] items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-all',
                isStatusChanging
                  ? 'cursor-not-allowed border-gray-300 bg-gray-100 text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500'
                  : 'border-amber-500 bg-[#fff8e6] text-amber-700 hover:bg-[#ffefc7] dark:border-amber-700 dark:bg-[#332a14] dark:text-amber-400 dark:hover:bg-[#473b1d]',
              ]"
            >
              <span class="font-normal">Revoke</span>
              <span v-if="isStatusChanging">
                <Loader2
                  class="h-4 w-4 animate-spin text-gray-400 dark:text-gray-500"
                />
              </span>
              <FileEdit
                v-else
                :class="[
                  'h-4 w-4',
                  isStatusChanging
                    ? 'text-gray-400 dark:text-gray-500'
                    : 'text-amber-600 dark:text-amber-400',
                ]"
              />
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
            <div
              :class="
                editorDataStore.isPanelVisible.value ? 'w-[260px]' : 'w-0'
              "
              class="fixed bottom-0 right-0 top-0 border-l border-layoutSoft bg-[white] transition-all duration-200 ease-in-out dark:bg-[#121212]"
            >
              <div
                class="h-full transition-all duration-200"
                :class="{
                  'w-[260px] opacity-100': editorDataStore.isPanelVisible.value,
                  'w-0 opacity-0': !editorDataStore.isPanelVisible.value,
                }"
              >
                <!-- Section 1: Draft Title, Created, Last Edited -->
                <div class="mb-4 flex flex-col gap-3 px-3 pt-3">
                  <!-- <input
                    type="text"
                    placeholder="Draft title"
                    class="w-full rounded-md bg-white text-sm outline-none"
                  /> -->
                  <div class="text-xs text-gray-500 dark:text-gray-400">
                    <div class="flex justify-between">
                      <span>Created:</span>
                      <span>{{
                        formatDate(editorDataStore.selectedPost.value.createdAt)
                      }}</span>
                    </div>
                    <div class="mt-1 flex justify-between">
                      <span>Last edited:</span>
                      <span>{{
                        formatDate(editorDataStore.selectedPost.value.updatedAt)
                      }}</span>
                    </div>
                  </div>
                </div>

                <!-- Divider -->
                <div
                  class="mb-4 h-px w-full bg-layoutSoft dark:bg-gray-700"
                ></div>

                <!-- Section 2: Words, Characters -->
                <div class="mb-4 px-3">
                  <div class="text-xs text-gray-500 dark:text-gray-400">
                    <div class="flex justify-between">
                      <span>Words:</span>
                      <span>{{
                        editorDataStore.contentStats.value.wordCount
                      }}</span>
                    </div>
                    <div class="mt-1 flex justify-between">
                      <span>Characters:</span>
                      <span>{{
                        editorDataStore.contentStats.value.characterCount
                      }}</span>
                    </div>
                    <div class="mt-1 flex justify-between">
                      <span>Reading time:</span>
                      <span>{{
                        editorDataStore.contentStats.value.readingTime
                      }}</span>
                    </div>
                  </div>
                </div>

                <!-- Divider -->
                <div
                  class="mb-4 h-px w-full bg-layoutSoft dark:bg-gray-700"
                ></div>

                <!-- Section 4: Draft Notes -->
                <!-- <div class="font-mono">
                  <textarea
                    placeholder="Add notes..."
                    class="h-32 w-full resize-none rounded-md border border-gray-200 bg-[#f3fff3] px-3 py-2 font-mono text-sm outline-none"
                  ></textarea>
                </div> -->

                <!-- Section 5: Validation Errors -->
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
  </main>
</template>
