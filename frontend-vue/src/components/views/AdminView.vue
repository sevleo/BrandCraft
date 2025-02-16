<!-- AdminView.vue -->
<script setup lang="ts">
  import { onMounted, ref, computed } from 'vue';
  import { useRouter } from 'vue-router';
  import { getUsers, getPostBundles, getPosts } from '@/api/adminApi';
  import axios from 'axios';
  import { getTokens } from '@/utils/tokenUtils';
  import LoadingSpinner from '@/components/miscellaneous/LoadingSpinner.vue';
  import type { ScheduledPostGroup, ScheduledPost } from '@/api/adminApi';

  interface PostStats {
    scheduled?: Record<string, number>;
    published?: Record<string, number>;
    failed?: Record<string, number>;
    draft?: Record<string, number>;
  }

  interface PlatformConnection {
    _id: string;
    platform: string;
    username: string;
  }

  interface User {
    _id: string;
    username: string;
    type: string;
    postStats?: PostStats;
    isAdmin: boolean;
    creationDate: string;
    platformConnections: string[];
    platformConnectionDetails?: PlatformConnection[];
  }

  const API_URL = import.meta.env.VITE_BACKEND_URL;

  const router = useRouter();
  const message = ref<string | undefined>('');
  const loading = ref(true);
  const activeTab = ref('users');

  const users = ref<User[]>([]);
  const postBundles = ref<ScheduledPostGroup[]>([]);
  const posts = ref<ScheduledPost[]>([]);
  const loadingData = ref(false);

  // Sorting state
  const sortBy = ref('totalPosts');
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

  const getTotalPosts = (user: User) => {
    if (!user.postStats) return 0;

    return (
      Object.values(user.postStats.scheduled || {}).reduce((a, b) => a + b, 0) +
      Object.values(user.postStats.published || {}).reduce((a, b) => a + b, 0) +
      Object.values(user.postStats.draft || {}).reduce((a, b) => a + b, 0) +
      Object.values(user.postStats.failed || {}).reduce((a, b) => a + b, 0)
    );
  };

  const sortedUsers = computed(() => {
    return [...users.value].sort((a, b) => {
      const modifier = sortOrder.value === 'asc' ? 1 : -1;

      if (sortBy.value === 'totalPosts') {
        return (getTotalPosts(a) - getTotalPosts(b)) * modifier;
      }

      return 0;
    });
  });

  const sortedPostBundles = computed(() => {
    return [...postBundles.value].sort((a, b) => {
      const modifier = sortOrder.value === 'asc' ? 1 : -1;

      if (sortBy.value === 'scheduledTime') {
        const aDate = new Date(a.scheduledTime).getTime();
        const bDate = new Date(b.scheduledTime).getTime();
        return (aDate - bDate) * modifier;
      }

      if (sortBy.value === 'createdAt') {
        return (
          (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) *
          modifier
        );
      }

      return 0;
    });
  });

  const sortedPosts = computed(() => {
    return [...posts.value].sort((a, b) => {
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

      if (sortBy.value === 'createdAt') {
        return (
          (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) *
          modifier
        );
      }

      return 0;
    });
  });

  async function fetchData(tab: string) {
    loadingData.value = true;
    try {
      switch (tab) {
        case 'users':
          users.value = await getUsers();
          // Fetch platform connection details for each user
          const tokens = getTokens();
          const platformDetailsPromises = users.value.map(async (user) => {
            if (user.platformConnections?.length) {
              const response = await axios.get(
                `${API_URL}/admin/platform-connections/${user._id}`,
                {
                  headers: {
                    authorization: tokens.accessToken,
                    refreshToken: tokens.refreshToken,
                  },
                }
              );
              user.platformConnectionDetails = response.data;
            }
          });
          await Promise.all(platformDetailsPromises);
          break;
        case 'postBundles':
          postBundles.value = await getPostBundles();
          break;
        case 'posts':
          posts.value = await getPosts();
          break;
      }
      return true;
    } catch (error) {
      console.error(`Error fetching ${tab}:`, error);
      return false;
    } finally {
      loadingData.value = false;
    }
  }

  async function switchTab(tab: string) {
    activeTab.value = tab;
    await fetchData(tab);
  }

  onMounted(async () => {
    try {
      const result = await fetchData('users');

      if (!result) {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      message.value = 'Error checking admin status';
    } finally {
      loading.value = false;
    }
  });

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString();
  }
</script>

<template>
  <div class="admin-view p-8">
    <LoadingSpinner v-if="loading" />
    <div v-else class="mx-auto max-w-7xl">
      <div class="mb-8 flex items-center justify-between">
        <h1 class="text-2xl font-bold">Admin Panel</h1>
        <button
          @click="router.push('/dashboard')"
          class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Back to App
        </button>
      </div>

      <!-- Navigation Tabs -->
      <div class="mb-6 flex space-x-4 border-b border-gray-200">
        <button
          v-for="tab in ['users', 'postBundles', 'posts']"
          :key="tab"
          @click="switchTab(tab)"
          class="border-b-2 px-4 py-2 text-sm font-medium"
          :class="[
            activeTab === tab
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
          ]"
        >
          {{ tab.charAt(0).toUpperCase() + tab.slice(1) }}
        </button>
      </div>

      <!-- Content Area -->
      <div v-if="loadingData" class="mt-4">
        <LoadingSpinner />
      </div>

      <div v-else>
        <!-- Users Table -->
        <div v-if="activeTab === 'users'" class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th
                  class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Username
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Type
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Admin
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Created
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Connected Accounts
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Post Statistics
                </th>
                <th
                  class="group cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:text-gray-900"
                  @click="toggleSort('totalPosts')"
                >
                  <div class="flex items-center gap-1">
                    Total Posts Count
                    <span class="text-gray-400 group-hover:text-gray-600">{{
                      getSortIcon('totalPosts')
                    }}</span>
                  </div>
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 bg-white">
              <tr v-for="user in sortedUsers" :key="user._id">
                <td class="whitespace-nowrap px-6 py-4">{{ user.username }}</td>
                <td class="whitespace-nowrap px-6 py-4">{{ user.type }}</td>
                <td class="whitespace-nowrap px-6 py-4">
                  <span
                    :class="[
                      'inline-flex rounded-full px-2 text-xs font-semibold leading-5',
                      user.isAdmin
                        ? 'text-green-800 bg-green-100'
                        : 'bg-gray-100 text-gray-800',
                    ]"
                  >
                    {{ user.isAdmin ? 'Yes' : 'No' }}
                  </span>
                </td>
                <td class="whitespace-nowrap px-6 py-4">
                  {{ formatDate(user.creationDate) }}
                </td>
                <td class="px-6 py-4">
                  <div
                    v-if="user.platformConnectionDetails?.length"
                    class="flex flex-col gap-1"
                  >
                    <div
                      v-for="connection in user.platformConnectionDetails"
                      :key="connection._id"
                      class="flex items-center gap-2"
                    >
                      <span class="text-xs font-medium text-gray-700">
                        {{ connection.platform }}:
                      </span>
                      <span class="text-xs text-gray-600">
                        {{ connection.username }}
                      </span>
                    </div>
                  </div>
                  <div v-else class="text-xs text-gray-500">
                    No connected platforms
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="flex flex-col gap-2">
                    <div v-if="user.postStats" class="space-y-2">
                      <div
                        v-if="
                          user.postStats?.scheduled &&
                          Object.keys(user.postStats.scheduled).length > 0
                        "
                        class="text-sm"
                      >
                        <span class="font-medium">Scheduled:</span>
                        <div class="mt-1 flex flex-wrap gap-2">
                          <span
                            v-for="(count, platform) in user.postStats
                              .scheduled"
                            :key="platform"
                            class="inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800"
                          >
                            {{ platform }}: {{ count }}
                          </span>
                        </div>
                      </div>
                      <div
                        v-if="
                          user.postStats?.draft &&
                          Object.keys(user.postStats.draft || {}).length > 0
                        "
                        class="text-sm"
                      >
                        <span class="font-medium">Draft:</span>
                        <div class="mt-1 flex flex-wrap gap-2">
                          <span
                            v-for="(count, platform) in user.postStats.draft"
                            :key="platform"
                            class="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800"
                          >
                            {{ platform }}: {{ count }}
                          </span>
                        </div>
                      </div>
                      <div
                        v-if="
                          user.postStats?.published &&
                          Object.keys(user.postStats.published || {}).length > 0
                        "
                        class="text-sm"
                      >
                        <span class="font-medium">Published:</span>
                        <div class="mt-1 flex flex-wrap gap-2">
                          <span
                            v-for="(count, platform) in user.postStats
                              .published"
                            :key="platform"
                            class="text-green-800 inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium"
                          >
                            {{ platform }}: {{ count }}
                          </span>
                        </div>
                      </div>
                      <div
                        v-if="
                          user.postStats?.failed &&
                          Object.keys(user.postStats.failed || {}).length > 0
                        "
                        class="text-sm"
                      >
                        <span class="font-medium">Failed:</span>
                        <div class="mt-1 flex flex-wrap gap-2">
                          <span
                            v-for="(count, platform) in user.postStats.failed"
                            :key="platform"
                            class="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800"
                          >
                            {{ platform }}: {{ count }}
                          </span>
                        </div>
                      </div>
                      <div
                        v-if="
                          (!user.postStats?.scheduled ||
                            !Object.keys(user.postStats.scheduled || {})
                              .length) &&
                          (!user.postStats?.published ||
                            !Object.keys(user.postStats.published || {})
                              .length) &&
                          (!user.postStats?.draft ||
                            !Object.keys(user.postStats.draft || {}).length) &&
                          (!user.postStats?.failed ||
                            !Object.keys(user.postStats.failed || {}).length)
                        "
                        class="text-sm text-gray-500"
                      >
                        No posts yet
                      </div>
                    </div>
                  </div>
                </td>
                <td class="whitespace-nowrap px-6 py-4">
                  <span
                    class="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800"
                  >
                    {{
                      Object.values(user.postStats?.scheduled || {}).reduce(
                        (a, b) => a + b,
                        0
                      ) +
                      Object.values(user.postStats?.published || {}).reduce(
                        (a, b) => a + b,
                        0
                      ) +
                      Object.values(user.postStats?.failed || {}).reduce(
                        (a, b) => a + b,
                        0
                      ) +
                      Object.values(user.postStats?.draft || {}).reduce(
                        (a, b) => a + b,
                        0
                      )
                    }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <button
                    @click="router.push(`/admin/users/${user._id}`)"
                    class="inline-flex items-center rounded-md bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Post Bundles Table -->
        <div v-if="activeTab === 'postBundles'" class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th
                  class="group cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:text-gray-900"
                  @click="toggleSort('scheduledTime')"
                >
                  <div class="flex items-center gap-1">
                    Scheduled Time
                    <span class="text-gray-400 group-hover:text-gray-600">{{
                      getSortIcon('scheduledTime')
                    }}</span>
                  </div>
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  User
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Status
                </th>
                <th
                  class="group cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:text-gray-900"
                  @click="toggleSort('createdAt')"
                >
                  <div class="flex items-center gap-1">
                    Created At
                    <span class="text-gray-400 group-hover:text-gray-600">{{
                      getSortIcon('createdAt')
                    }}</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 bg-white">
              <tr v-for="bundle in sortedPostBundles" :key="bundle._id">
                <td class="whitespace-nowrap px-6 py-4">
                  {{ formatDate(bundle.scheduledTime) }}
                </td>
                <td class="whitespace-nowrap px-6 py-4">
                  {{ bundle.userId?.username }}
                </td>
                <td class="whitespace-nowrap px-6 py-4">
                  <span
                    class="inline-flex rounded-full px-2 text-xs font-semibold leading-5"
                    :class="{
                      'bg-yellow-100 text-yellow-800':
                        bundle.status === 'draft',
                      'bg-blue-100 text-blue-800':
                        bundle.status === 'scheduled',
                      'text-green-800 bg-green-100':
                        bundle.status === 'published',
                      'bg-red-100 text-red-800': bundle.status === 'failed',
                      'bg-orange-100 text-orange-800':
                        bundle.status === 'partially_published',
                    }"
                  >
                    {{ bundle.status }}
                  </span>
                </td>
                <td class="whitespace-nowrap px-6 py-4">
                  {{ formatDate(bundle.createdAt) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Posts Table -->
        <div v-if="activeTab === 'posts'" class="overflow-x-auto">
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
                  class="group cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:text-gray-900"
                  @click="toggleSort('scheduledDate')"
                >
                  <div class="flex items-center gap-1">
                    Scheduled Date
                    <span class="text-gray-400 group-hover:text-gray-600">{{
                      getSortIcon('scheduledDate')
                    }}</span>
                  </div>
                </th>
                <th
                  class="group cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:text-gray-900"
                  @click="toggleSort('createdAt')"
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
              <tr v-for="post in sortedPosts" :key="post._id">
                <td class="whitespace-nowrap px-6 py-4">{{ post.platform }}</td>
                <td class="px-6 py-4">
                  <div class="max-w-xs truncate">{{ post.content }}</div>
                </td>
                <td class="whitespace-nowrap px-6 py-4">
                  {{ formatDate(post.postGroupId?.scheduledTime) }}
                </td>
                <td class="whitespace-nowrap px-6 py-4">
                  {{ formatDate(post.createdAt) }}
                </td>
                <td class="whitespace-nowrap px-6 py-4">
                  <span
                    :class="[
                      'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
                      post.status === 'published'
                        ? 'text-green-800 bg-green-100'
                        : post.status === 'scheduled'
                          ? 'bg-yellow-100 text-yellow-800'
                          : post.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : post.status === 'draft'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-gray-100 text-gray-800',
                    ]"
                  >
                    {{ post.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .admin-view {
    min-height: calc(100vh - 4rem);
  }
</style>
