<script setup lang="ts">
  import { onMounted, ref, computed } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { getUserDetails } from '@/api/adminApi';
  import type { UserDetails } from '@/api/adminApi';
  import LoadingSpinner from '@/components/miscellaneous/LoadingSpinner.vue';

  const route = useRoute();
  const router = useRouter();
  const loading = ref(true);
  const error = ref('');
  const userDetails = ref<UserDetails | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Calculate post statistics by platform and status
  const getPostStats = () => {
    if (!userDetails.value?.posts) return {};

    const stats: Record<string, Record<string, number>> = {};

    userDetails.value.posts.forEach((post) => {
      if (!stats[post.platform]) {
        stats[post.platform] = {
          scheduled: 0,
          published: 0,
          failed: 0,
          draft: 0,
        };
      }
      stats[post.platform][post.status]++;
    });

    return stats;
  };

  const getTotalStats = () => {
    const platformStats = getPostStats();
    const totals = {
      scheduled: 0,
      published: 0,
      failed: 0,
      draft: 0,
      total: 0,
    };

    Object.values(platformStats).forEach((stats) => {
      totals.scheduled += stats.scheduled;
      totals.published += stats.published;
      totals.failed += stats.failed;
      totals.draft += stats.draft;
    });

    totals.total =
      totals.scheduled + totals.published + totals.failed + totals.draft;
    return totals;
  };

  // Sorting state
  const sortBy = ref('scheduledDate');
  const sortOrder = ref('desc');

  const toggleSort = (field: string) => {
    if (sortBy.value === field) {
      sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
    } else {
      sortBy.value = field;
      sortOrder.value = 'desc';
    }
  };

  const getSortIcon = (field: string) => {
    if (sortBy.value !== field) return '⇅';
    return sortOrder.value === 'asc' ? '↑' : '↓';
  };

  // Sorted posts
  const sortedPosts = computed(() => {
    if (!userDetails.value?.posts) return [];
    return [...userDetails.value.posts].sort((a, b) => {
      const modifier = sortOrder.value === 'asc' ? 1 : -1;

      if (sortBy.value === 'scheduledDate') {
        const aDate = a.postGroupId?.scheduledTime
          ? new Date(a.postGroupId.scheduledTime).getTime()
          : 0;
        const bDate = b.postGroupId?.scheduledTime
          ? new Date(b.postGroupId.scheduledTime).getTime()
          : 0;
        return (aDate - bDate) * modifier;
      }

      // For other fields, ensure type safety by checking if the property exists
      const aValue =
        a.postGroupId?.[sortBy.value as keyof typeof a.postGroupId] ?? '';
      const bValue =
        b.postGroupId?.[sortBy.value as keyof typeof b.postGroupId] ?? '';

      return String(aValue).localeCompare(String(bValue)) * modifier;
    });
  });

  // Sorted post bundles
  const sortedPostBundles = computed(() => {
    if (!userDetails.value?.postBundles) return [];

    const validSortKeys = [
      'scheduledTime',
      'createdAt',
      'updatedAt',
      'status',
    ] as const;
    type SortKey = (typeof validSortKeys)[number];

    const currentSortBy = sortBy.value;
    if (!validSortKeys.includes(currentSortBy as SortKey)) {
      return userDetails.value.postBundles;
    }

    return [...userDetails.value.postBundles].sort((a, b) => {
      // Explicitly type the values we're comparing
      const aValue = a[currentSortBy as SortKey];
      const bValue = b[currentSortBy as SortKey];
      const modifier = sortOrder.value === 'asc' ? 1 : -1;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        if (
          currentSortBy === 'scheduledTime' ||
          currentSortBy === 'createdAt' ||
          currentSortBy === 'updatedAt'
        ) {
          return (
            (new Date(aValue).getTime() - new Date(bValue).getTime()) * modifier
          );
        }
        return aValue.localeCompare(bValue) * modifier;
      }
      return 0;
    });
  });

  const fetchUserDetails = async () => {
    try {
      const userId = route.params.userId as string;
      const details = await getUserDetails(userId);
      userDetails.value = details;
    } catch (err) {
      error.value = 'Failed to load user details';
      console.error(err);
    } finally {
      loading.value = false;
    }
  };

  onMounted(fetchUserDetails);
</script>

<template>
  <div class="user-details p-8">
    <LoadingSpinner v-if="loading" />

    <div v-else-if="error" class="text-red-600">{{ error }}</div>

    <div v-else-if="userDetails" class="mx-auto max-w-7xl">
      <div class="mb-8 flex items-center justify-between">
        <div>
          <button
            @click="router.push('/admin')"
            class="mb-4 inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <span class="mr-2">←</span> Back to Admin Panel
          </button>
          <h1 class="text-2xl font-bold">
            User Details: {{ userDetails.user.username }}
          </h1>
        </div>
      </div>

      <div class="space-y-8">
        <!-- User Info -->
        <div class="rounded-lg bg-white p-6 shadow">
          <h2 class="mb-4 text-xl font-semibold">User Information</h2>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-600">Username</p>
              <p class="font-medium">{{ userDetails.user.username }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-600">Type</p>
              <p class="font-medium">{{ userDetails.user.type }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-600">Admin Status</p>
              <p class="font-medium">
                {{ userDetails.user.isAdmin ? 'Yes' : 'No' }}
              </p>
            </div>
            <div>
              <p class="text-sm text-gray-600">Created On</p>
              <p class="font-medium">
                {{ formatDate(userDetails.user.creationDate) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Post Summary -->
        <div class="rounded-lg bg-white p-6 shadow">
          <h2 class="mb-4 text-xl font-semibold">Posts Summary</h2>
          <div
            v-if="Object.keys(getPostStats()).length === 0"
            class="text-gray-500"
          >
            No posts found
          </div>
          <div v-else>
            <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div
                v-for="(stats, platform) in getPostStats()"
                :key="platform"
                class="rounded-lg border border-gray-200 p-4"
              >
                <h3 class="mb-3 text-lg font-medium capitalize">
                  {{ platform }}
                </h3>
                <div class="space-y-2">
                  <div
                    v-if="stats.scheduled > 0"
                    class="flex items-center justify-between"
                  >
                    <span class="text-sm text-gray-600">Scheduled</span>
                    <span
                      class="inline-flex rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800"
                    >
                      {{ stats.scheduled }}
                    </span>
                  </div>
                  <div
                    v-if="stats.published > 0"
                    class="flex items-center justify-between"
                  >
                    <span class="text-sm text-gray-600">Published</span>
                    <span
                      class="text-green-800 inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium"
                    >
                      {{ stats.published }}
                    </span>
                  </div>
                  <div
                    v-if="stats.failed > 0"
                    class="flex items-center justify-between"
                  >
                    <span class="text-sm text-gray-600">Failed</span>
                    <span
                      class="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800"
                    >
                      {{ stats.failed }}
                    </span>
                  </div>
                  <div
                    v-if="stats.draft > 0"
                    class="flex items-center justify-between"
                  >
                    <span class="text-sm text-gray-600">Draft</span>
                    <span
                      class="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800"
                    >
                      {{ stats.draft }}
                    </span>
                  </div>
                  <div class="mt-3 border-t border-gray-100 pt-2">
                    <div class="flex items-center justify-between">
                      <span class="text-sm font-medium text-gray-900"
                        >Total</span
                      >
                      <span class="text-sm font-medium text-gray-900">
                        {{
                          stats.scheduled +
                          stats.published +
                          stats.failed +
                          stats.draft
                        }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Overall Totals -->
            <div class="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-6">
              <h3 class="mb-4 text-lg font-medium">Overall Totals</h3>
              <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div class="rounded-lg bg-white p-4 shadow-sm">
                  <div class="text-sm text-gray-600">Scheduled</div>
                  <div class="mt-2 flex items-center justify-between">
                    <span class="text-2xl font-semibold text-gray-900">{{
                      getTotalStats().scheduled
                    }}</span>
                    <span
                      class="inline-flex rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800"
                    >
                      {{
                        (
                          (getTotalStats().scheduled / getTotalStats().total) *
                          100
                        ).toFixed(1)
                      }}%
                    </span>
                  </div>
                </div>
                <div class="rounded-lg bg-white p-4 shadow-sm">
                  <div class="text-sm text-gray-600">Published</div>
                  <div class="mt-2 flex items-center justify-between">
                    <span class="text-2xl font-semibold text-gray-900">{{
                      getTotalStats().published
                    }}</span>
                    <span
                      class="text-green-800 inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium"
                    >
                      {{
                        (
                          (getTotalStats().published / getTotalStats().total) *
                          100
                        ).toFixed(1)
                      }}%
                    </span>
                  </div>
                </div>
                <div class="rounded-lg bg-white p-4 shadow-sm">
                  <div class="text-sm text-gray-600">Failed</div>
                  <div class="mt-2 flex items-center justify-between">
                    <span class="text-2xl font-semibold text-gray-900">{{
                      getTotalStats().failed
                    }}</span>
                    <span
                      class="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800"
                    >
                      {{
                        (
                          (getTotalStats().failed / getTotalStats().total) *
                          100
                        ).toFixed(1)
                      }}%
                    </span>
                  </div>
                </div>
                <div class="rounded-lg bg-white p-4 shadow-sm">
                  <div class="text-sm text-gray-600">Draft</div>
                  <div class="mt-2 flex items-center justify-between">
                    <span class="text-2xl font-semibold text-gray-900">{{
                      getTotalStats().draft
                    }}</span>
                    <span
                      class="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800"
                    >
                      {{
                        (
                          (getTotalStats().draft / getTotalStats().total) *
                          100
                        ).toFixed(1)
                      }}%
                    </span>
                  </div>
                </div>
                <div class="rounded-lg bg-white p-4 shadow-sm">
                  <div class="text-sm text-gray-600">Total Posts</div>
                  <div class="mt-2 flex items-center justify-between">
                    <span class="text-2xl font-semibold text-gray-900">{{
                      getTotalStats().total
                    }}</span>
                    <span
                      class="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800"
                    >
                      100%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Post Bundles -->
        <div class="rounded-lg bg-white p-6 shadow">
          <h2 class="mb-4 text-xl font-semibold">Post Bundles</h2>
          <div
            v-if="userDetails.postBundles.length === 0"
            class="text-gray-500"
          >
            No post bundles found
          </div>
          <div v-else class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  >
                    Scheduled Time
                  </th>
                  <th
                    @click="toggleSort('createdAt')"
                    class="group cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:text-gray-900"
                  >
                    <div class="flex items-center gap-1">
                      Created At
                      <span class="text-gray-400 group-hover:text-gray-600">{{
                        getSortIcon('createdAt')
                      }}</span>
                    </div>
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 bg-white">
                <tr v-for="bundle in sortedPostBundles" :key="bundle._id">
                  <td class="whitespace-nowrap px-6 py-4">
                    {{ formatDate(bundle.scheduledTime) }}
                  </td>
                  <td class="whitespace-nowrap px-6 py-4">
                    {{ formatDate(bundle.createdAt) }}
                  </td>
                  <td class="whitespace-nowrap px-6 py-4">
                    <span
                      class="inline-flex rounded-full px-2 py-1 text-xs font-medium"
                      :class="{
                        'bg-yellow-100 text-yellow-800':
                          bundle.status === 'scheduled',
                        'text-green-800 bg-green-100':
                          bundle.status === 'published',
                        'bg-red-100 text-red-800': bundle.status === 'failed',
                        'bg-gray-100 text-gray-800': bundle.status === 'draft',
                      }"
                    >
                      {{ bundle.status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Individual Posts -->
        <div class="rounded-lg bg-white p-6 shadow">
          <h2 class="mb-4 text-xl font-semibold">Individual Posts</h2>
          <div v-if="userDetails.posts.length === 0" class="text-gray-500">
            No posts found
          </div>
          <div v-else class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  >
                    Platform
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  >
                    Content
                  </th>
                  <th
                    @click="toggleSort('scheduledDate')"
                    class="group cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:text-gray-900"
                  >
                    <div class="flex items-center gap-1">
                      Scheduled Date
                      <span class="text-gray-400 group-hover:text-gray-600">{{
                        getSortIcon('scheduledDate')
                      }}</span>
                    </div>
                  </th>
                  <th
                    @click="toggleSort('createdAt')"
                    class="group cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:text-gray-900"
                  >
                    <div class="flex items-center gap-1">
                      Created At
                      <span class="text-gray-400 group-hover:text-gray-600">{{
                        getSortIcon('createdAt')
                      }}</span>
                    </div>
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  >
                    Status
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  >
                    Error message
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 bg-white">
                <tr v-for="post in sortedPosts" :key="post._id">
                  <td class="whitespace-nowrap px-6 py-4">
                    {{ post.platform }}
                  </td>
                  <td class="px-6 py-4">{{ post.content }}</td>
                  <td class="whitespace-nowrap px-6 py-4">
                    {{
                      post.postGroupId?.scheduledTime
                        ? new Date(
                            post.postGroupId.scheduledTime
                          ).toLocaleString()
                        : '-'
                    }}
                  </td>
                  <td class="whitespace-nowrap px-6 py-4">
                    {{ new Date(post.createdAt).toLocaleString() }}
                  </td>
                  <td class="whitespace-nowrap px-6 py-4">
                    <span
                      class="inline-flex rounded-full px-2 py-1 text-xs font-medium"
                      :class="{
                        'bg-yellow-100 text-yellow-800':
                          post.status === 'scheduled',
                        'text-green-800 bg-green-100':
                          post.status === 'published',
                        'bg-red-100 text-red-800': post.status === 'failed',
                        'bg-gray-100 text-gray-800': post.status === 'draft',
                      }"
                    >
                      {{ post.status }}
                    </span>
                  </td>
                  <td class="whitespace-nowrap px-6 py-4">
                    <span class="text-red-600">
                      {{ post.status === 'failed' ? post.errorMessage : '' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .user-details {
    min-height: calc(100vh - 4rem);
  }
</style>
