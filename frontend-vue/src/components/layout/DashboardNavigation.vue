<script setup lang="ts">
  import { useRouter } from 'vue-router';
  import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
  import authData from '@/utils/authDataStore';
  import { logout, verifyAuth } from '@/api/authApi';
  import connectionsDataStore from '@/utils/connectionsDataStore';
  import { useThemeStore } from '@/utils/themeStore';
  import {
    Moon,
    Sun,
    Settings,
    LogOut,
    MessageSquare,
    ExternalLink,
    Shield,
    ChevronDown,
    List,
    Users,
    MessageCircle,
    User,
    FilePlus2,
    LayoutDashboard,
    Instagram,
    Youtube,
    Send,
    Clock,
  } from 'lucide-vue-next';
  import postsStore from '@/utils/postsStore';
  import editorDataStore from '@/utils/editorDataStore';

  const themeStore = useThemeStore();

  const router = useRouter();
  const showDropdown = ref(false);
  const dropdownRef = ref<HTMLElement | null>(null);
  const activeView = ref(
    localStorage.getItem('dashboardActiveView') || 'drafts'
  );

  // Watch for changes in activeView and save to localStorage
  watch(activeView, (newValue) => {
    localStorage.setItem('dashboardActiveView', newValue);
  });

  async function handleLogout() {
    try {
      await logout();
      authData.signedIn.value = false;
      authData.user.value = '';
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');

      connectionsDataStore.clearAccountData();

      window.location.href = import.meta.env.VITE_FRONTEND_NUXT_URL;
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  function toggleTheme() {
    themeStore.toggleTheme();
    // showDropdown.value = false;
  }

  function goToSettings() {
    router.push('/dashboard/settings');
    showDropdown.value = false;
  }

  function goToAdmin() {
    showDropdown.value = false;
    router.push('/admin');
  }

  async function navigateToEditor(post: any) {
    console.log('Selected post:', post._id);
    if (router.currentRoute.value.path === '/dashboard/editor') {
      // If already on editor, update the post first
      editorDataStore.selectedPost.value = post;
    } else {
      // If not on editor, navigate first then update the post
      await router.push('/dashboard/editor');
      editorDataStore.selectedPost.value = post;
    }
  }

  async function handleNewDraft() {
    // If not on editor, navigate first then reset
    await router.push('/dashboard/editor');
    editorDataStore.reset();
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Close dropdown when clicking outside
  function handleClickOutside(event: MouseEvent) {
    if (
      dropdownRef.value &&
      !dropdownRef.value.contains(event.target as Node)
    ) {
      showDropdown.value = false;
    }
  }

  const selectedPostId = computed(
    () => editorDataStore.selectedPost.value?._id
  );

  const sortedDraftPosts = computed(() => {
    return [...postsStore.draftPosts.value].sort((a, b) => {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  });

  const sortedScheduledPosts = computed(() => {
    return [...postsStore.scheduledPosts.value].sort((a, b) => {
      return (
        new Date(b.scheduledTime).getTime() -
        new Date(a.scheduledTime).getTime()
      );
    });
  });

  const sortedPublishedPosts = computed(() => {
    return [...postsStore.publishedPosts.value].sort((a, b) => {
      return (
        new Date(b.scheduledTime).getTime() -
        new Date(a.scheduledTime).getTime()
      );
    });
  });

  const sortedFailedPosts = computed(() => {
    return [...postsStore.failedPosts.value].sort((a, b) => {
      return (
        new Date(b.scheduledTime).getTime() -
        new Date(a.scheduledTime).getTime()
      );
    });
  });

  onMounted(async () => {
    await verifyAuth();
    document.addEventListener('click', handleClickOutside);
  });

  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
  });
</script>

<template>
  <nav
    class="border-layoutSoft fixed bottom-0 left-0 top-0 h-screen w-[270px] border-r bg-white transition-colors duration-200 dark:border-[#313131] dark:bg-[#121212]"
  >
    <div class="bg-lightWhite flex h-full flex-col">
      <!-- User Profile Section -->
      <div class="mb-[10px] p-4">
        <div class="relative" ref="dropdownRef">
          <div
            @click="showDropdown = !showDropdown"
            class="flex w-full cursor-pointer items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-100 dark:border-[#313131] dark:bg-[#121212] dark:hover:bg-[#d9d9d9]/10"
          >
            <p class="text-gray-700 dark:text-gray-300">
              {{ authData.displayName }}
            </p>
            <ChevronDown
              class="ml-2 h-4 w-4 text-gray-500 dark:text-gray-400"
            />
          </div>

          <!-- Custom Dropdown Menu -->
          <transition name="dropdown">
            <div
              v-if="showDropdown"
              class="absolute left-0 top-[40px] z-10 w-full rounded-md border border-gray-300 bg-white py-1 shadow-lg ring-opacity-5 dark:border-[#313131] dark:bg-[#121212]"
            >
              <div
                v-if="authData.isAdmin.value === true"
                @click="goToAdmin"
                class="flex cursor-pointer items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-[#d9d9d9]/10"
              >
                <Shield class="mr-2 h-4 w-4" :strokeWidth="2" />
                Admin Panel
              </div>
              <div
                @click="toggleTheme"
                class="flex w-full cursor-pointer items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-[#d9d9d9]/10"
              >
                <Moon
                  v-if="themeStore.currentTheme === 'light'"
                  class="mr-2 h-4 w-4"
                  :strokeWidth="2"
                />
                <Sun v-else class="mr-2 h-4 w-4" :strokeWidth="2" />
                {{
                  themeStore.currentTheme === 'dark'
                    ? 'Light Mode'
                    : 'Dark Mode'
                }}
              </div>
              <div
                @click="goToSettings"
                class="flex cursor-pointer items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-[#d9d9d9]/10"
              >
                <Settings class="mr-2 h-4 w-4" :strokeWidth="2" />
                Settings
              </div>
              <a
                href="https://insigh.to/b/brandcraftart"
                target="_blank"
                rel="noopener noreferrer"
                class="flex w-full cursor-pointer items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-[#d9d9d9]/10"
              >
                <MessageSquare class="mr-2 h-4 w-4" :strokeWidth="2" />
                Feedback
                <ExternalLink class="ml-auto h-3 w-3" :strokeWidth="2" />
              </a>
              <div
                @click="handleLogout"
                class="flex cursor-pointer items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-[#d9d9d9]/10"
              >
                <LogOut class="mr-2 h-4 w-4" :strokeWidth="2" />
                Sign out
              </div>
            </div>
          </transition>
        </div>
      </div>
      <!-- Navigation Links -->
      <div class="border-layoutSoft mt-6 flex flex-col space-y-4 border-b px-4">
        <button
          @click="handleNewDraft"
          class="flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-[#d9d9d9]/10"
          :class="{
            'bg-gray-100 text-gray-900 dark:bg-[#d9d9d9]/10':
              $route.path === '/dashboard/editor' && !selectedPostId,
          }"
        >
          <span class="font-medium">+ New draft</span>
        </button>
      </div>
      <!-- Posts -->
      <div class="flex flex-col">
        <!-- View Switcher -->
        <div class="flex">
          <button
            @click="activeView = 'drafts'"
            class="flex-1 border-b-[2px] px-4 py-2 text-sm font-medium transition-all"
            :class="
              activeView === 'drafts'
                ? 'border-gray-300 text-gray-900 dark:text-gray-100'
                : 'border-b-transparent text-gray-500'
            "
          >
            Drafts
          </button>
          <button
            @click="activeView = 'scheduled'"
            class="flex-1 border-b-[2px] px-4 py-2 text-sm font-medium transition-all"
            :class="
              activeView === 'scheduled'
                ? 'border-gray-300 text-gray-900 dark:text-gray-100'
                : 'border-b-transparent text-gray-500'
            "
          >
            Scheduled
          </button>
          <button
            @click="activeView = 'published'"
            class="flex-1 border-b-[2px] px-4 py-2 text-sm font-medium transition-all"
            :class="
              activeView === 'published'
                ? 'border-gray-300 text-gray-900 dark:text-gray-100'
                : 'border-b-transparent text-gray-500'
            "
          >
            Posted
          </button>
        </div>

        <!-- Posts List -->
        <div class="sidebar-scrollable mb-[250px] overflow-auto">
          <div class="border-layoutSoft border-t">
            <div
              v-for="post in activeView === 'drafts'
                ? sortedDraftPosts
                : activeView === 'scheduled'
                  ? sortedScheduledPosts
                  : sortedPublishedPosts"
              :key="post.id"
              @click="navigateToEditor(post)"
              class="border-layoutSoft group flex cursor-pointer flex-col gap-2 border-b bg-[#f5f5f5]"
              :class="{
                'bg-white dark:bg-[#d9d9d9]/10': post._id === selectedPostId,
              }"
            >
              <div
                class="flex h-[80px] flex-col justify-between border-l-[5px] px-4 py-2"
                :class="{
                  'border-l-[#00e676]': post._id === selectedPostId,
                  'border-l-transparent': post._id !== selectedPostId,
                }"
              >
                <!-- Post Content -->
                <div
                  class="mb-2 line-clamp-2 text-sm text-gray-700 dark:text-gray-300"
                >
                  {{ post.content }}
                </div>

                <!-- Post Details -->
                <div class="flex items-center justify-end text-xs">
                  <!-- Scheduled Time -->
                  <div
                    class="flex items-center text-gray-500 dark:text-gray-400"
                  >
                    {{ formatDate(post.scheduledTime) }}
                  </div>

                  <!-- Platforms -->
                  <div class="flex items-center space-x-1">
                    <Instagram
                      v-if="post.platforms?.includes('instagram')"
                      class="h-3 w-3 text-gray-500 dark:text-gray-400"
                    />
                    <Youtube
                      v-if="post.platforms?.includes('youtube')"
                      class="h-3 w-3 text-gray-500 dark:text-gray-400"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div
      class="navigation-box bg-lightWhite border-layoutSoft sticky bottom-0 z-[1] h-[250px] w-full border-t pl-2"
    >
      <div class="flex flex-col gap-[5px] pt-4">
        <router-link
          to="/dashboard/calendar"
          class="flex items-center rounded-md text-[16px] font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-[#d9d9d9]/10"
        >
          <Calendar class="mr-2 h-5 w-5" />
          Calendar
        </router-link>
        <router-link
          to="/dashboard/list"
          class="flex items-center rounded-md text-[16px] font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-[#d9d9d9]/10"
        >
          <List class="mr-2 h-5 w-5" />
          List
        </router-link>
        <router-link
          to="/dashboard/accounts"
          class="flex items-center rounded-md text-[16px] font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-[#d9d9d9]/10"
        >
          <Users class="mr-2 h-5 w-5" />
          Accounts
        </router-link>
        <router-link
          to="/dashboard/settings"
          class="flex items-center rounded-md text-[16px] font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-[#d9d9d9]/10"
        >
          <Settings class="mr-2 h-5 w-5" />
          Settings
        </router-link>
        <a
          href="https://insigh.to/b/brandcraftart"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center rounded-md text-[16px] font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-[#d9d9d9]/10"
        >
          <MessageCircle class="mr-2 h-5 w-5" />
          Feedback
        </a>
        <button
          @click="showDropdown = !showDropdown"
          class="flex items-center justify-between rounded-md text-[16px] font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-[#d9d9d9]/10"
        >
          <div class="flex items-center">
            <User class="mr-2 h-5 w-5" />
            <span>{{ authData.displayName }}</span>
          </div>
          <ChevronDown class="h-5 w-5" />
        </button>
      </div>
    </div>
  </nav>
</template>

<style scoped>
  .sidebar-scrollable {
    max-height: calc(100vh - 428px);
    overflow-y: auto;
  }

  .sidebar-scrollable::-webkit-scrollbar {
    width: 2px; /* Adjust scrollbar width */
  }

  .sidebar-scrollable::-webkit-scrollbar-track {
    background: transparent; /* Hides the track */
  }

  .sidebar-scrollable::-webkit-scrollbar-thumb {
    background: #d1d5db; /* Visible scrollbar */
  }

  .sidebar-scrollable::-webkit-scrollbar-thumb:hover {
    background: #a1a1aa; /* Darker shade on hover */
  }

  .dropdown-enter-active,
  .dropdown-leave-active {
    transition:
      opacity 0.2s,
      transform 0.2s;
  }

  .dropdown-enter-from,
  .dropdown-leave-to {
    opacity: 0;
    transform: translateY(-8px);
  }
</style>
