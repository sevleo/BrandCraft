<script setup lang="ts">
  import scheduledPostsStore from '@/utils/scheduledPostsStore';
  import { deleteScheduledPost } from '@/api/scheduledPostApi';
  import { useToast } from 'primevue';
  import DatePicker from 'primevue/datepicker';
  import { ref, computed, onMounted, watch } from 'vue';
  import { Eye, Pencil, Trash2, FileText, Calendar } from 'lucide-vue-next';
  import connectionsDataStore from '@/utils/connectionsDataStore';
  import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
  import BaseButton from '@/components/common/buttons/BaseButton.vue';
  import MediaPreviewDialog from '@/components/miscellaneous/MediaPreviewDialog.vue';
  import publishViewDataStore from '@/utils/publishViewDataStore';
  import tabStateStore from '@/utils/tabStateStore';
  import { updatePostBundle } from '@/api/scheduledPostApi';
  import { format as formatDate, startOfDay, addDays } from 'date-fns';

  const toast = useToast();
  const emit = defineEmits<{
    (e: 'edit', post: any): void;
  }>();
  const showMediaModal = ref(false);
  const selectedPostMedia = ref<any[]>([]);
  const selectedMediaIndex = ref(0);

  const tabs = [
    { id: 'scheduled', label: 'Scheduled' },
    { id: 'published', label: 'Published' },
    { id: 'drafts', label: 'Drafts' },
    { id: 'failed', label: 'Failed' },
  ];

  interface GroupedPost {
    date: Date;
    posts: Array<any>;
  }

  const tabCounts: any = computed(() => {
    const posts = scheduledPostsStore.scheduledPosts.value;
    return {
      scheduled: posts.filter((post) => post.status === 'scheduled').length,
      drafts: posts.filter((post) => post.status === 'draft').length,
      failed: posts.filter((post) => post.status === 'failed').length,
      published: posts.filter(
        (post) =>
          post.status === 'published' ||
          post.status === 'partially_published' ||
          post.status === 'processing'
      ).length,
    };
  });

  const openMediaModal = (url: string, allMedia: any[]) => {
    selectedPostMedia.value = allMedia;
    selectedMediaIndex.value = allMedia.findIndex(
      (media: any) => media.url === url
    );
    showMediaModal.value = true;
  };

  const platformData = computed(() => {
    const data: Record<string, { icon: string[]; account: any }> = {};

    connectionsDataStore.connectedAccounts.value.forEach((account) => {
      const accountKey = `${account.platform}Account`;
      data[account.platform] = {
        icon: account.platformIcon || '',
        account: (connectionsDataStore as any)[accountKey]?.value || null,
      };
    });

    return data;
  });

  const getErrorMessage = (post: any, platform: any) => {
    const platformPost = post.posts?.find((p: any) => p.platform === platform);
    return platformPost?.errorMessage || post.errorMessage || '';
  };

  const filteredAndSortedPosts = computed(() => {
    let posts = [...scheduledPostsStore.filteredPosts.value];

    // Filter by tab/status
    posts = posts.filter((post: any) => {
      if (publishViewDataStore.selectedTab.value === 'scheduled')
        return post.status === 'scheduled';
      if (publishViewDataStore.selectedTab.value === 'drafts')
        return post.status === 'draft';
      if (publishViewDataStore.selectedTab.value === 'published')
        return (
          post.status === 'published' ||
          post.status === 'partially_published' ||
          post.status === 'processing'
        );
      if (publishViewDataStore.selectedTab.value === 'failed')
        return post.status === 'failed';
      return true;
    });

    // Sort based on tab
    posts.sort((a: any, b: any) => {
      const dateA = new Date(a.scheduledTime).getTime();
      const dateB = new Date(b.scheduledTime).getTime();

      // Scheduled and Drafts tabs: oldest to newest (next scheduled on top)
      if (
        publishViewDataStore.selectedTab.value === 'scheduled' ||
        publishViewDataStore.selectedTab.value === 'drafts'
      ) {
        return dateA - dateB;
      }
      // Published tab: newest to oldest
      return dateB - dateA;
    });

    return posts;
  });

  const dateGroupedPostBundles = computed<GroupedPost[]>(() => {
    const posts = filteredAndSortedPosts.value;
    const grouped: any = {};

    posts.forEach((post) => {
      const date = new Date(post.scheduledTime);
      const year = date.getFullYear();
      const month = date.getMonth();
      const day = date.getDate();

      const key = `${year}-${month}-${day}`;
      if (!grouped[key]) {
        grouped[key] = {
          date: new Date(year, month, day),
          posts: [],
        };
      }

      grouped[key].posts.push(post);
    });

    return Object.values(grouped);
  });

  const sortingOptions = computed(() => {
    if (publishViewDataStore.selectedTab.value === 'scheduled') {
      return [
        { label: 'This week', value: 'thisWeek' },
        { label: 'Next week', value: 'nextWeek' },
        { label: 'This month', value: 'thisMonth' },
      ];
    } else if (publishViewDataStore.selectedTab.value === 'published') {
      return [
        { label: 'Last week', value: 'lastWeek' },
        { label: 'Last 2 weeks', value: 'last2Weeks' },
        { label: 'Last month', value: 'lastMonth' },
      ];
    } else if (publishViewDataStore.selectedTab.value === 'drafts') {
      return [
        { label: 'This week', value: 'thisWeek' },
        { label: 'Next week', value: 'nextWeek' },
        { label: 'This month', value: 'thisMonth' },
      ];
    } else if (publishViewDataStore.selectedTab.value === 'failed') {
      return [
        { label: 'Last week', value: 'lastWeek' },
        { label: 'Last 2 weeks', value: 'last2Weeks' },
        { label: 'Last month', value: 'lastMonth' },
      ];
    }
    return [];
  });

  const selectedSortOption = computed({
    get: () => {
      const currentTab = publishViewDataStore.selectedTab
        .value as keyof typeof tabStateStore.tabSortOptions.value;

      return tabStateStore.tabSortOptions.value[currentTab];
    },
    set: (value) => {
      const currentTab = publishViewDataStore.selectedTab
        .value as keyof typeof tabStateStore.tabSortOptions.value;
      tabStateStore.setTabSortOption(currentTab, value);
    },
  });

  const selectedDateRange = computed({
    get: () => scheduledPostsStore.dates.value,
    set: (value) => {
      scheduledPostsStore.dates.value = value;
      if (value && value.length === 2) {
        scheduledPostsStore.setDateRange(value[0], value[1]);
      }
    },
  });

  const handleSortOptionChange = (option: any) => {
    selectedSortOption.value = option;
    const now = new Date();
    const startOfToday = startOfDay(now);
    let startDate, endDate;

    switch (option) {
      case 'thisWeek':
        // Always show today + next 6 days for "This week"
        startDate = startOfToday;
        endDate = addDays(startOfToday, 6); // Changed from 7 to 6 to show exactly 7 days including today
        break;
      case 'nextWeek':
        startDate = addDays(startOfToday, 6);
        endDate = addDays(startOfToday, 13);
        break;
      case 'thisMonth': {
        startDate = startOfToday;
        endDate = addDays(startOfToday, 30);
        break;
      }
      case 'lastWeek':
        startDate = addDays(startOfToday, -6);
        endDate = startOfToday;
        break;
      case 'last2Weeks':
        startDate = addDays(startOfToday, -13);
        endDate = startOfToday;
        break;
      case 'lastMonth':
        startDate = addDays(startOfToday, -30);
        endDate = startOfToday;
        break;
    }

    if (startDate && endDate) {
      selectedDateRange.value = [startDate, endDate];
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await deleteScheduledPost(postId);
      scheduledPostsStore.scheduledPosts.value =
        scheduledPostsStore.scheduledPosts.value.filter(
          (post: any) => post._id !== postId
        );

      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Post deleted successfully',
        life: 3000,
      });
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to delete post',
        life: 3000,
      });
    }
  };

  // const handlePublishNow = async () => {
  //   // TODO: Implement publish now functionality
  //   toast.add({
  //     severity: 'info',
  //     summary: 'Publishing',
  //     detail: 'This feature will be implemented soon',
  //     life: 3000,
  //   });
  // };

  const handleEdit = (post: any) => {
    emit('edit', post);
  };

  const handleView = async () => {
    // TODO: Implement publish now functionality
    toast.add({
      severity: 'info',
      summary: 'View post',
      detail: 'This feature will be implemented soon',
      life: 3000,
    });
  };

  async function handleStatusChange(post: any, newStatus: string) {
    try {
      const formData = new FormData();
      formData.append('content', post.content);
      formData.append(
        'scheduledTime',
        new Date(post.scheduledTime).toISOString()
      );
      formData.append('platforms', JSON.stringify(post.platforms));
      formData.append('sameContent', 'true');
      formData.append('status', newStatus);

      // Keep all existing media
      const keptMediaUrls = post.mediaFiles.map((m: any) => m.url);
      formData.append('keptMediaUrls', JSON.stringify(keptMediaUrls));

      await updatePostBundle(post._id, formData);
      await scheduledPostsStore.updateScheduledPostDataStore();

      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: `Post ${newStatus === 'draft' ? 'moved to drafts' : 'scheduled'}!`,
        life: 3000,
      });
    } catch (error: any) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.response?.data?.message || 'Failed to update post status',
        life: 3000,
      });
    }
  }

  const format = (date: Date | string | number, formatString: string) => {
    return formatDate(new Date(date), formatString);
  };

  onMounted(() => {
    const now = new Date();
    const startOfToday = startOfDay(now);
    let startDate, endDate;

    // Set different default ranges based on the current tab
    if (
      ['published', 'failed'].includes(publishViewDataStore.selectedTab.value)
    ) {
      // For Published and Failed tabs: show last 7 days (today - 6 days backwards)
      startDate = addDays(startOfToday, -6);
      endDate = startOfToday;
      selectedSortOption.value = 'lastWeek';
    } else {
      // For other tabs: show next 7 days (today + 6 days forward)
      startDate = startOfToday;
      endDate = addDays(startOfToday, 6);
      selectedSortOption.value = 'thisWeek';
    }

    // Update the store and local state
    scheduledPostsStore.setDateRange(startDate, endDate);
    selectedDateRange.value = [startDate, endDate];
  });

  // Watch for tab changes and update the date range accordingly
  watch(
    () => publishViewDataStore.selectedTab.value,
    (newTab) => {
      const now = new Date();
      const startOfToday = startOfDay(now);
      let startDate, endDate;

      if (['published', 'failed'].includes(newTab)) {
        // For Published and Failed tabs: show last 7 days (today - 6 days backwards)
        startDate = addDays(startOfToday, -6);
        endDate = startOfToday;
        selectedSortOption.value = 'lastWeek';
      } else {
        // For other tabs: show next 7 days (today + 6 days forward)
        startDate = startOfToday;
        endDate = addDays(startOfToday, 6);
        selectedSortOption.value = 'thisWeek';
      }

      scheduledPostsStore.setDateRange(startDate, endDate);
      selectedDateRange.value = [startDate, endDate];
    }
  );

  // Watch for changes to the date range and save them for the current tab
  watch(selectedDateRange, (newValue) => {
    if (newValue && newValue.length === 2) {
      const [start, end] = newValue;
      const currentTab = publishViewDataStore.selectedTab.value;
      tabStateStore.setTabDateRange(
        currentTab as keyof typeof tabStateStore.tabDateRanges.value,
        start,
        end
      );
    }
  });
</script>

<template>
  <div class="scheduled-posts mt-8 rounded-lg bg-white dark:bg-[#121212]">
    <!-- Tabs navigation -->
    <div class="mb-8 border-b border-[gray-200] dark:border-[#313131]">
      <nav class="flex gap-8" aria-label="Tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="publishViewDataStore.selectedTab.value = tab.id"
          class="relative py-4 text-sm font-medium transition-colors"
          :class="[
            publishViewDataStore.selectedTab.value === tab.id
              ? 'text-blue-600'
              : 'text-gray-500 hover:text-gray-700',
          ]"
        >
          <span class="flex items-center gap-2">
            {{ tab.label }}
            <span
              class="rounded-full bg-gray-100 px-2 py-0.5 text-xs dark:bg-[white]/10"
              :class="{
                'bg-blue-50 text-blue-600':
                  publishViewDataStore.selectedTab.value === tab.id,
              }"
            >
              {{ tabCounts[tab.id] }}
            </span>
          </span>
          <span
            class="absolute inset-x-0 bottom-0 h-0.5"
            :class="{
              'bg-blue-600': publishViewDataStore.selectedTab.value === tab.id,
            }"
            aria-hidden="true"
          ></span>
        </button>
      </nav>
    </div>
    <!-- Content area -->
    <!-- Date Filter Section -->
    <div class="mb-8 py-4">
      <div class="flex h-[45px] flex-row items-center gap-4">
        <div class="flex items-center gap-2">
          <div
            class="ml-auto flex items-center justify-center gap-2 rounded-md border border-gray-200 p-[4px] dark:border-[#313131]"
          >
            <BaseButton
              v-for="option in sortingOptions"
              :key="option.value"
              :variant="
                selectedSortOption === option.value ? 'primary' : 'default'
              "
              @click="handleSortOptionChange(option.value)"
              size="sm"
              noborder
            >
              {{ option.label }}
            </BaseButton>
          </div>
        </div>
        <div class="flex items-center justify-center gap-2">
          <DatePicker
            v-model="selectedDateRange"
            :showIcon="true"
            placeholder="Select Date Range"
            class="publisher w-[200px]"
            selectionMode="range"
            :manual-input="false"
            :numberOfMonths="2"
            v-on:date-select="selectedSortOption = ''"
          />
        </div>
      </div>
    </div>

    <!-- Content Section -->
    <div class="px-[100px]">
      <div v-if="dateGroupedPostBundles.length === 0">
        <div
          class="flex flex-col items-center justify-center py-12 text-center"
        >
          <div class="mb-4 text-4xl">
            {{
              publishViewDataStore.selectedTab.value === 'scheduled'
                ? '📅'
                : publishViewDataStore.selectedTab.value === 'drafts'
                  ? '📝'
                  : publishViewDataStore.selectedTab.value === 'failed'
                    ? '🚫'
                    : '✉️'
            }}
          </div>
          <h3 class="mb-2 text-lg font-semibold text-gray-900">
            No {{ publishViewDataStore.selectedTab.value }} posts
          </h3>
          <p class="text-sm text-gray-500">
            {{
              publishViewDataStore.selectedTab.value === 'scheduled'
                ? 'Schedule your first post to get started!'
                : publishViewDataStore.selectedTab.value === 'drafts'
                  ? 'Save a post as draft to continue later.'
                  : publishViewDataStore.selectedTab.value === 'failed'
                    ? 'Your failed posts will appear here.'
                    : 'Your published posts will appear here.'
            }}
          </p>
        </div>
      </div>
      <div v-else class="space-y-8">
        <div
          v-for="dateGroupedPostBundle in dateGroupedPostBundles"
          :key="dateGroupedPostBundle.date.toISOString()"
          class="space-y-4"
        >
          <!-- Date Header -->
          <h3 class="text-[20px] font-semibold">
            <span class="text-[black]">
              {{ format(dateGroupedPostBundle.date, 'EEEE, ') }}
            </span>
            <span class="text-[#575757]">
              {{ format(dateGroupedPostBundle.date, 'MMMM d') }}
            </span>
          </h3>

          <!-- Posts for this date -->
          <div class="space-y-4">
            <div
              id="post-row"
              v-for="postGroup in dateGroupedPostBundle.posts"
              :key="postGroup._id"
              class="flex items-start gap-4"
            >
              <!-- Time -->
              <div class="flex w-[80px] flex-col gap-1">
                <div class="pt-4 text-sm font-semibold text-[black]">
                  {{ format(new Date(postGroup.scheduledTime), 'h:mm a') }}
                </div>
                <span
                  class="rounded-full px-2 py-1 text-center text-xs"
                  :class="{
                    'bg-green-100 dark:bg-green-700':
                      postGroup.status === 'published',
                    'bg-yellow-100 dark:bg-yellow-700':
                      postGroup.status === 'scheduled' ||
                      postGroup.status === 'processing',
                    'bg-red-100 dark:bg-red-700': postGroup.status === 'failed',
                    'bg-orange-100 dark:bg-orange-700':
                      postGroup.status === 'partially_published' ||
                      postGroup.status === 'processing',
                    'bg-gray-100 dark:bg-gray-700': ![
                      'published',
                      'scheduled',
                      'processing',
                      'failed',
                      'partially_published',
                    ].includes(postGroup.status),
                  }"
                >
                  {{
                    postGroup.status === 'partially_published' ||
                    postGroup.status === 'processing'
                      ? 'In progress'
                      : postGroup.status
                  }}
                </span>
              </div>

              <!-- Post Content Container -->
              <div
                id="post-container"
                class="post-item flex-1 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-[#313131] dark:bg-[#121212]"
              >
                <!-- Post Metadata Section -->
                <div id="contents" class="flex justify-between p-4">
                  <div id="left" class="flex flex-col gap-4">
                    <div class="">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                          <div class="flex gap-3">
                            <!-- {{ scheduledPostsStore.scheduledPosts }} -->

                            <div
                              v-for="platform in postGroup.posts"
                              :key="platform"
                              class="relative flex h-[50px] w-[50px] items-center justify-center"
                            >
                              <div
                                class="absolute -inset-[2px] flex h-full w-full items-center justify-center rounded-full border-2"
                                :class="{
                                  'border-green-500':
                                    platform.status === 'published',
                                  'border-yellow-500':
                                    platform.status === 'scheduled' ||
                                    platform.status === 'processing' ||
                                    platform.status === 'pending',
                                  'border-red-500':
                                    platform.status === 'failed',
                                  'border-gray-500':
                                    platform.status === 'draft',
                                }"
                                v-tooltip.bottom="
                                  getErrorMessage(postGroup, platform)
                                "
                              >
                                <div
                                  class="icon-container pointer-events-none flex items-center justify-center rounded-full bg-white dark:bg-[#212121]"
                                >
                                  <FontAwesomeIcon
                                    :class="'h-[27px]'"
                                    :icon="
                                      platformData[platform.platform]?.icon
                                    "
                                  />
                                </div>
                              </div>

                              <!-- <img
                                v-if="platformData[platform]?.account"
                                :src="
                                  platformData[platform]?.account
                                    ?.profileImageUrl
                                "
                                class="h-full w-full rounded-full p-[2px]"
                                :alt="platformData[platform]?.account?.username"
                              />

                              <div
                                class="icon-container pointer-events-none absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full border border-black bg-white p-[4px] dark:border-white dark:bg-[black]"
                              >
                                <FontAwesomeIcon
                                  :icon="platformData[platform]?.icon"
                                />
                              </div> -->
                            </div>
                          </div>
                        </div>
                      </div>

                      <div
                        v-if="postGroup.status === 'failed'"
                        class="mt-2 text-sm text-red-500"
                      >
                        Error: {{ postGroup.errorMessage }}
                      </div>
                    </div>
                    <!-- Post Content Section -->
                    <div class="flex gap-4 bg-white dark:bg-[#121212]">
                      <!-- Left side: Post content -->
                      <div class="flex-1">
                        <p class="whitespace-pre-wrap text-gray-700">
                          {{ postGroup.content }}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div id="right">
                    <!-- Right side: Media -->
                    <div
                      v-if="
                        postGroup.mediaFiles && postGroup.mediaFiles.length > 0
                      "
                      class="w-40"
                    >
                      <div
                        v-if="
                          postGroup.status === 'scheduled' ||
                          postGroup.status === 'draft' ||
                          postGroup.status === 'published'
                        "
                        class="grid aspect-square h-40 w-full gap-[2px]"
                        :class="{
                          'grid-cols-1 grid-rows-1':
                            postGroup.mediaFiles.length === 1,
                          'grid-cols-2 grid-rows-2':
                            postGroup.mediaFiles.length >= 2,
                        }"
                      >
                        <div
                          v-for="(media, _) in postGroup.mediaFiles.slice(0, 4)"
                          :key="media.url"
                          class="group relative cursor-pointer overflow-hidden border border-gray-300 shadow-lg transition-all duration-200"
                          :class="{
                            'col-span-2 row-span-2':
                              postGroup.mediaFiles.length === 1,
                            'col-span-1': postGroup.mediaFiles.length >= 2,
                          }"
                          @click="
                            openMediaModal(media.url, postGroup.mediaFiles)
                          "
                        >
                          <div
                            class="h-full w-full transition-all duration-200 group-hover:brightness-[0.35]"
                          >
                            <img
                              v-if="media.type === 'image'"
                              :src="media.url"
                              :alt="media.filename"
                              class="h-full w-full object-cover"
                            />
                            <video
                              v-if="media.type === 'video'"
                              class="h-full w-full rounded-lg object-cover"
                              :src="media.url"
                            ></video>
                          </div>
                          <div
                            class="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-500 group-hover:opacity-100"
                          >
                            <Eye color="white" />
                          </div>
                        </div>
                      </div>
                      <div v-else class="text-sm italic text-gray-500">
                        This post contains {{ postGroup.mediaFiles.length }}
                        {{
                          postGroup.mediaFiles.length === 1 ? 'image' : 'images'
                        }}
                        not available in our databases anymore
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Action Buttons Section -->
                <div
                  id="buttons"
                  class="flex justify-end gap-2 border-t border-gray-200 p-3 dark:border-[#313131]"
                >
                  <template
                    v-if="
                      publishViewDataStore.selectedTab.value === 'scheduled'
                    "
                  >
                    <!-- <BaseButton @click="handlePublishNow()">
                      <SendHorizontal class="h-4 w-4" />
                      Publish Now
                    </BaseButton> -->
                    <BaseButton @click="handleStatusChange(postGroup, 'draft')">
                      <FileText class="mr-1 h-4 w-4" />
                      Move to Draft
                    </BaseButton>

                    <BaseButton @click="handleEdit(postGroup)" icon>
                      <Pencil class="h-4 w-4" />
                    </BaseButton>
                    <BaseButton @click="handleDeletePost(postGroup._id)" icon>
                      <Trash2 class="h-4 w-4" />
                    </BaseButton>
                  </template>

                  <template
                    v-else-if="
                      publishViewDataStore.selectedTab.value === 'drafts'
                    "
                  >
                    <BaseButton
                      @click="handleStatusChange(postGroup, 'scheduled')"
                    >
                      <Calendar class="mr-1 h-4 w-4" />
                      Move to Scheduled
                    </BaseButton>
                    <BaseButton @click="handleEdit(postGroup)" icon>
                      <Pencil class="h-4 w-4" />
                    </BaseButton>
                    <BaseButton @click="handleDeletePost(postGroup._id)" icon>
                      <Trash2 class="h-4 w-4" />
                    </BaseButton>
                  </template>

                  <template
                    v-else-if="
                      publishViewDataStore.selectedTab.value === 'published'
                    "
                  >
                    <BaseButton @click="handleView()" icon>
                      <Eye class="h-4 w-4" />
                    </BaseButton>
                  </template>

                  <template
                    v-else-if="
                      publishViewDataStore.selectedTab.value === 'failed'
                    "
                  >
                    <BaseButton @click="handleEdit(postGroup)" icon>
                      <Pencil class="h-4 w-4" />
                    </BaseButton>
                    <BaseButton @click="handleDeletePost(postGroup._id)" icon>
                      <Trash2 class="h-4 w-4" />
                    </BaseButton>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <MediaPreviewDialog
    v-model="showMediaModal"
    :mediaFiles="selectedPostMedia"
    :initial-media-index="selectedMediaIndex"
  />
</template>

<style>
  .p-overlay-mask {
    background-color: rgba(0, 0, 0, 0.8) !important;
    transition: opacity 3s ease-in-out !important;
    opacity: 1;
  }

  .p-overlay-mask.p-component-overlay-hidden {
    opacity: 0; /* Fully hidden */
  }

  .publisher .p-datepicker-input {
    height: 45px;
  }

  .publisher.p-inputwrapper {
    width: max-content !important;
  }
</style>
