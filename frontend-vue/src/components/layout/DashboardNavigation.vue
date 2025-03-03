<script setup lang="ts">
  import { useRouter } from 'vue-router';
  import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue';
  import authData from '@/utils/authDataStore';
  import { logout, verifyAuth } from '@/api/authApi';
  import connectionsDataStore from '@/utils/connectionsDataStore';
  // import { useThemeStore } from '@/utils/themeStore';
  import {
    Settings,
    LogOut,
    MessageSquare,
    ExternalLink,
    Shield,
    ChevronDown,
    Link,
    User,
    PencilLine,
    Trash2,
    Check,
    Loader2,
    Calendar,
  } from 'lucide-vue-next';
  import postsStore from '@/utils/postsStore';
  import editorDataStore from '@/utils/editorDataStore';
  import { createPostGroup } from '@/helpers/savePostGroup';
  import { deleteScheduledPost } from '@/api/postApi';
  import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

  // const themeStore = useThemeStore();

  const router = useRouter();
  const showDropdown = ref(false);
  const dropdownRef = ref<HTMLElement | null>(null);
  const activeView = ref(
    localStorage.getItem('dashboardActiveView') || 'drafts'
  );

  // Watch for changes in activeView and save to localStorage
  watch(activeView, async (newValue) => {
    localStorage.setItem('dashboardActiveView', newValue);
    // Refresh posts when switching tabs
    try {
      await postsStore.getAllPostGroups();
    } catch (error) {
      console.error('Failed to refresh posts:', error);
    }
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

  // function toggleTheme() {
  //   themeStore.toggleTheme();
  //   // showDropdown.value = false;
  // }

  function goToSettings() {
    router.push('/dashboard/settings');
    showDropdown.value = false;
  }

  function goToAdmin() {
    showDropdown.value = false;
    router.push('/admin');
  }

  async function navigateToEditor(post: any) {
    // Check if trying to switch to a different post while on editor
    if (
      router.currentRoute.value.path === '/dashboard/editor' &&
      editorDataStore.selectedPost.value._id !== post._id
    ) {
      if (editorDataStore.isSaving.value) {
        return;
      }
      editorDataStore.selectPost(post);
    } else if (router.currentRoute.value.path === '/dashboard/editor') {
      // Same post or initial load on editor
      editorDataStore.selectPost(post);
    } else {
      // Not on editor, navigate first then update post
      await router.push('/dashboard/editor');
      editorDataStore.selectPost(post);
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Extract platform name from platform ID string (e.g., "twitter-1234567890" -> "twitter")
  function getPlatformName(platformId: string): string {
    if (!platformId) return '';
    // Split by hyphen and take the first part
    return platformId.split('-')[0];
  }

  // Get account data for a platform
  function getAccountForPlatform(platformId: string) {
    const platformName = getPlatformName(platformId);
    const accounts = connectionsDataStore.connectedAccounts.value;

    // Find account that matches the platform and has the platformId
    return accounts.find(
      (account: any) =>
        account.platform === platformName && platformId.includes(account.id)
    );
  }

  // Get platform icon based on platform name
  function getPlatformIcon(platformName: string): string[] {
    switch (platformName) {
      case 'twitter':
        return ['fab', 'x-twitter'];
      case 'threads':
        return ['fab', 'threads'];
      case 'bluesky':
        return ['fab', 'bluesky'];
      case 'instagram':
        return ['fab', 'instagram'];
      case 'tiktok':
        return ['fab', 'tiktok'];
      case 'youtube':
        return ['fab', 'youtube'];
      case 'mastodon':
        return ['fab', 'mastodon'];
      case 'facebook':
        return ['fab', 'facebook'];
      default:
        return ['fas', 'link'];
    }
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
    const now = new Date().getTime();

    // First, separate posts into future and past
    const futurePosts = [];
    const pastPosts = [];

    for (const post of postsStore.scheduledPosts.value) {
      // Handle potential null scheduledTime
      if (!post.scheduledTime) {
        pastPosts.push(post);
        continue;
      }

      const postTime = new Date(post.scheduledTime).getTime();
      if (postTime > now) {
        futurePosts.push(post);
      } else {
        pastPosts.push(post);
      }
    }

    // Sort future posts by closest first (ascending)
    futurePosts.sort((a, b) => {
      return (
        new Date(a.scheduledTime).getTime() -
        new Date(b.scheduledTime).getTime()
      );
    });

    // Sort past posts by most recent first (descending)
    pastPosts.sort((a, b) => {
      return (
        new Date(b.scheduledTime).getTime() -
        new Date(a.scheduledTime).getTime()
      );
    });

    // Combine the arrays: past posts first, then future posts
    return [...pastPosts, ...futurePosts];
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

  // Track which post is waiting for delete confirmation
  const deletingPostId = ref<string | null>(null);
  const deletingPosts = ref<Set<string>>(new Set());
  const isCreatingDraft = ref(false);

  const handleCreateDraft = async () => {
    if (isCreatingDraft.value) return;

    try {
      isCreatingDraft.value = true;
      await createPostGroup();
      activeView.value = 'drafts';
    } finally {
      isCreatingDraft.value = false;
    }
  };

  // Handle post deletion
  const handleDeletePost = async (postId: string, event: Event) => {
    event.stopPropagation(); // Prevent navigation when clicking delete

    // Prevent duplicate deletion requests
    if (deletingPosts.value.has(postId)) {
      return;
    }

    if (deletingPostId.value === postId) {
      try {
        deletingPosts.value.add(postId);
        await deleteScheduledPost(postId);
        await postsStore.getAllPostGroups();

        // After deletion, handle editor state
        if (editorDataStore.selectedPost.value?._id === postId) {
          // Find the most recent post based on the active view
          let recentPost;
          if (activeView.value === 'drafts') {
            recentPost = sortedDraftPosts.value[0];
          } else if (activeView.value === 'scheduled') {
            recentPost = sortedScheduledPosts.value[0];
          } else if (activeView.value === 'published') {
            recentPost = sortedPublishedPosts.value[0];
          } else if (activeView.value === 'failed') {
            recentPost = sortedFailedPosts.value[0];
          }

          if (recentPost) {
            editorDataStore.selectPost(recentPost);
          } else {
            editorDataStore.reset();
          }
        }
      } catch (error) {
        console.error('Error deleting post:', error);
      } finally {
        deletingPosts.value.delete(postId);
        deletingPostId.value = null;
      }
    } else {
      deletingPostId.value = postId;
    }
  };

  const handleMouseLeave = () => {
    deletingPostId.value = null;
  };

  // Platform popup state
  const showPlatformPopup = ref(false);
  const activePopupPlatforms = ref<string[]>([]);
  const popupPosition = ref({ top: '', bottom: '', left: '0px' });

  // Show platform popup
  function showPopup(event: MouseEvent, platforms: string[]) {
    const target = event.currentTarget as HTMLElement;
    activePopupPlatforms.value = platforms;

    nextTick(() => {
      const targetRect = target.getBoundingClientRect();
      const POPUP_MARGIN = 10; // Margin between popup and target
      const SCREEN_MARGIN = 10; // Margin from screen edges

      // Determine if we should show popup above or below
      // If target is in the upper half of the screen, show popup below
      // If target is in the lower half of the screen, show popup above
      const viewportHeight = window.innerHeight;
      const isInUpperHalf = targetRect.top < viewportHeight / 2;

      // Reset positions
      popupPosition.value.top = '';
      popupPosition.value.bottom = '';

      // Center horizontally relative to the target
      const initialLeft = targetRect.left + targetRect.width / 2;
      popupPosition.value.left = `${initialLeft}px`;

      // Show the popup
      showPlatformPopup.value = true;

      // After popup is visible, adjust position based on its width and height
      nextTick(() => {
        const popup = document.querySelector('.platform-popup') as HTMLElement;
        if (popup) {
          const popupWidth = popup.offsetWidth;

          // Adjust horizontal position
          popupPosition.value.left = `${initialLeft - popupWidth / 2}px`;

          // Make sure the popup doesn't go off-screen to the left
          if (parseFloat(popupPosition.value.left) < SCREEN_MARGIN) {
            popupPosition.value.left = `${SCREEN_MARGIN}px`;
          }

          // Make sure the popup doesn't go off-screen to the right
          if (
            parseFloat(popupPosition.value.left) + popupWidth >
            window.innerWidth - SCREEN_MARGIN
          ) {
            popupPosition.value.left = `${window.innerWidth - popupWidth - SCREEN_MARGIN}px`;
          }

          // Set vertical position based on available space
          if (isInUpperHalf) {
            // Position below the target
            popupPosition.value.top = `${targetRect.bottom + POPUP_MARGIN}px`;
          } else {
            // Position above the target
            popupPosition.value.bottom = `${viewportHeight - targetRect.top + POPUP_MARGIN}px`;
          }
        }
      });
    });
  }

  // Hide platform popup
  function hidePopup() {
    showPlatformPopup.value = false;
  }

  onMounted(async () => {
    await verifyAuth();
    document.addEventListener('click', handleClickOutside);
    await Promise.all([
      postsStore.getAllPostGroups(),
      connectionsDataStore.getAllAccounts(),
    ]);
    if (editorDataStore.selectedPost.value._id === '') {
      editorDataStore.selectPost(sortedDraftPosts.value[0]);
    }
  });

  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
  });
</script>

<template>
  <nav
    class="fixed bottom-0 left-0 top-0 h-screen w-[260px] border-r border-layoutSoft bg-white transition-colors duration-200 dark:border-[#313131] dark:bg-[#121212]"
  >
    <div class="flex h-full flex-col bg-lightWhite">
      <div
        @click="handleCreateDraft"
        class="group flex min-h-[70px] cursor-pointer items-center border-b border-t border-layoutSoft bg-white px-4 py-2 transition-all duration-200 hover:bg-white"
      >
        <div class="flex items-center">
          <component
            :is="isCreatingDraft ? Loader2 : PencilLine"
            class="mr-[5px] h-4 w-4 transition-all duration-200"
            :class="
              isCreatingDraft
                ? 'animate-spin stroke-blue-500'
                : 'stroke-gray-500 group-hover:stroke-gray-900'
            "
          />
          <p
            class="italic transition-all duration-200"
            :class="
              isCreatingDraft
                ? 'text-blue-500'
                : 'text-gray-500 group-hover:text-gray-900'
            "
          >
            {{ isCreatingDraft ? 'Creating...' : 'New draft' }}
          </p>
        </div>
      </div>
      <!-- Posts -->
      <div class="flex flex-col">
        <!-- View Switcher -->
        <div class="tabs-shadow z-10 flex bg-white">
          <button
            @click="activeView = 'drafts'"
            class="flex-1 border-b-[2px] py-2 text-sm transition-all"
            :class="
              activeView === 'drafts'
                ? 'border-gray-400 font-medium text-gray-900 dark:text-gray-100'
                : 'border-b-[#efefef] font-normal text-gray-500'
            "
          >
            Drafts
          </button>
          <button
            @click="activeView = 'scheduled'"
            class="flex-1 border-b-[2px] py-2 text-sm transition-all"
            :class="
              activeView === 'scheduled'
                ? 'border-gray-400 font-medium text-gray-900 dark:text-gray-100'
                : 'border-b-[#efefef] font-normal text-gray-500'
            "
          >
            Scheduled
          </button>
          <button
            @click="activeView = 'published'"
            class="flex-1 border-b-[2px] py-2 text-sm transition-all"
            :class="
              activeView === 'published'
                ? 'border-gray-400 font-medium text-gray-900 dark:text-gray-100'
                : 'border-b-[#efefef] font-normal text-gray-500'
            "
          >
            Posted
          </button>
        </div>

        <!-- Posts List -->
        <div class="sidebar-scrollable mb-[250px] overflow-auto">
          <transition-group name="post-list" tag="div">
            <div
              v-if="activeView === 'drafts' && sortedDraftPosts.length === 0"
            >
              <p class="p-4 text-gray-500">Draft list is empty</p>
            </div>
            <div
              v-if="
                activeView === 'scheduled' && sortedScheduledPosts.length === 0
              "
            >
              <p class="p-4 text-gray-500">Scheduled list is empty</p>
            </div>
            <div
              v-if="
                activeView === 'published' && sortedPublishedPosts.length === 0
              "
            >
              <p class="p-4 text-gray-500">Published list is empty</p>
            </div>
            <div
              v-for="post in activeView === 'drafts'
                ? sortedDraftPosts
                : activeView === 'scheduled'
                  ? sortedScheduledPosts
                  : sortedPublishedPosts"
              :key="post._id"
              @click="navigateToEditor(post)"
              class="group cursor-pointer border-b border-layoutSoft bg-[#f5f5f5] transition-all duration-200"
              :class="{
                'bg-white dark:bg-[#d9d9d9]/10': post._id === selectedPostId,
              }"
            >
              <div
                class="relative flex h-[90px] flex-col justify-between border-l-[5px] px-4 py-2"
                :class="{
                  'border-l-[#00e676]': post._id === selectedPostId,
                  'border-l-transparent': post._id !== selectedPostId,
                }"
              >
                <!-- Post Content -->
                <div
                  class="line-clamp-2 pr-[5px] text-sm text-gray-700 dark:text-gray-300"
                >
                  <p v-if="post.content">
                    {{ post.content }}
                  </p>
                  <p v-else class="italic text-gray-500">Empty draft</p>
                </div>

                <!-- Post Details -->
                <div class="flex items-end justify-between text-xs">
                  <!-- Scheduled Time -->
                  <div
                    class="flex items-center text-[11px] text-gray-500 dark:text-gray-400"
                  >
                    {{ post.scheduledTime && formatDate(post.scheduledTime) }}
                  </div>

                  <!-- Platforms -->
                  <div class="ml-2 flex items-center gap-1">
                    <div
                      v-for="(platformId, _) in post.platforms.slice(0, 3)"
                      :key="platformId"
                      class="relative"
                    >
                      <div class="h-6 w-6 rounded-full bg-gray-200">
                        <img
                          v-if="
                            getAccountForPlatform(platformId)?.profileImageUrl
                          "
                          :src="
                            getAccountForPlatform(platformId)?.profileImageUrl
                          "
                          class="h-6 w-6 rounded-full object-cover"
                          :alt="getPlatformName(platformId)"
                        />
                      </div>
                      <div
                        class="icon-container absolute bottom-0 right-0 flex h-3 w-3 items-center justify-center rounded-full border border-black bg-black"
                      >
                        <FontAwesomeIcon
                          :icon="getPlatformIcon(getPlatformName(platformId))"
                          class="h-[8px] stroke-white"
                        />
                      </div>
                    </div>

                    <!-- Show "+" indicator if there are more than 3 platforms -->
                    <div
                      v-if="post.platforms.length > 3"
                      class="platform-more-container relative flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-gray-300 text-xs font-medium hover:bg-gray-400"
                      @mouseenter="showPopup($event, post.platforms)"
                      @mouseleave="hidePopup"
                    >
                      +{{ post.platforms.length - 3 }}
                    </div>
                  </div>
                </div>
                <button
                  class="absolute right-1 top-1 rounded text-gray-400"
                  :class="
                    deletingPosts.has(post._id)
                      ? 'block'
                      : 'hidden group-hover:block'
                  "
                  @click="(e) => handleDeletePost(post._id, e)"
                  @mouseleave="
                    deletingPosts.has(post._id) ? undefined : handleMouseLeave()
                  "
                  :title="
                    deletingPosts.has(post._id)
                      ? 'Deleting...'
                      : deletingPostId === post._id
                        ? 'Click again to confirm delete'
                        : 'Delete post'
                  "
                >
                  <component
                    :is="
                      deletingPosts.has(post._id)
                        ? Loader2
                        : deletingPostId === post._id
                          ? Check
                          : Trash2
                    "
                    class="h-5 w-5 rounded-full p-1 transition-all duration-200"
                    :class="[
                      deletingPosts.has(post._id)
                        ? 'animate-spin stroke-blue-500'
                        : deletingPostId === post._id
                          ? 'bg-red-50 stroke-red-500 hover:bg-red-100'
                          : 'stroke-gray-400 hover:bg-gray-200 hover:stroke-black',
                    ]"
                  />
                </button>
              </div>
            </div>
          </transition-group>
        </div>
      </div>
    </div>
    <div
      class="navigation-box sticky bottom-0 z-[1] w-full border-t border-layoutSoft bg-white py-[10px]"
    >
      <div class="flex flex-col py-[0px]">
        <router-link
          to="/dashboard/calendar"
          class="group flex items-center rounded-md py-1 text-[16px] hover:bg-gray-100 dark:hover:bg-[#d9d9d9]/10"
        >
          <Calendar
            class="ml-4 mr-2 h-5 w-5 stroke-gray-500 group-hover:stroke-gray-700"
          />
          <span
            class="text-[18px] font-normal text-gray-500 group-hover:text-gray-700"
          >
            Calendar
          </span>
        </router-link>
        <!-- <router-link
          to="/dashboard/list"
          class="flex items-center rounded-md text-[16px] font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-[#d9d9d9]/10"
        >
          <List class="mr-2 h-5 w-5" />
          List
        </router-link> -->
        <router-link
          to="/dashboard/accounts"
          class="group flex items-center rounded-md py-1 text-[16px] hover:bg-gray-100 dark:hover:bg-[#d9d9d9]/10"
        >
          <Link
            class="ml-4 mr-2 h-5 w-5 stroke-gray-500 group-hover:stroke-gray-700"
          />
          <span
            class="text-[18px] font-normal text-gray-500 group-hover:text-gray-700"
          >
            Connections
          </span>
        </router-link>

        <!-- User Profile Section -->
        <div
          class="relative"
          ref="dropdownRef"
          @click="showDropdown = !showDropdown"
        >
          <button
            class="group flex w-full items-center justify-between rounded-md py-1 text-[16px] hover:bg-gray-100 dark:hover:bg-[#d9d9d9]/10"
          >
            <div class="flex items-center">
              <User
                class="ml-4 mr-2 h-5 w-5 stroke-gray-500 group-hover:stroke-gray-700"
              />
              <span
                class="text-[18px] font-normal text-gray-500 group-hover:text-gray-700"
              >
                {{ authData.displayName }}
              </span>
            </div>
            <ChevronDown
              class="mr-4 h-5 w-5 stroke-gray-500 group-hover:stroke-gray-700"
            />
          </button>

          <!-- Custom Dropdown Menu -->
          <transition name="dropdown">
            <div
              v-if="showDropdown"
              class="absolute bottom-[38px] left-0 z-10 w-full rounded-md border border-gray-300 bg-white py-1 shadow-lg ring-opacity-5 dark:border-[#313131] dark:bg-[#121212]"
            >
              <div
                v-if="authData.isAdmin.value === true"
                @click="goToAdmin"
                class="flex cursor-pointer items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-[#d9d9d9]/10"
              >
                <Shield class="mr-2 h-4 w-4" :strokeWidth="2" />
                Admin Panel
              </div>
              <!-- <div
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
                    : 'Dark Mode '
                }}
              </div> -->
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
    </div>
  </nav>
  <teleport to="body">
    <!-- Hover popup to show all platforms -->
    <div
      v-if="showPlatformPopup"
      class="platform-popup fixed z-[9999] w-max rounded-md border border-gray-200 bg-white p-2 shadow-md dark:border-gray-700 dark:bg-[#212121]"
      :style="{
        top: popupPosition.top,
        bottom: popupPosition.bottom,
        left: popupPosition.left,
      }"
      @mouseenter="showPlatformPopup = true"
      @mouseleave="showPlatformPopup = false"
    >
      <div class="flex flex-col gap-2">
        <div
          v-for="platformId in activePopupPlatforms"
          :key="platformId"
          class="flex items-center gap-2"
        >
          <div class="relative">
            <div class="h-6 w-6 rounded-full bg-gray-200">
              <img
                v-if="getAccountForPlatform(platformId)?.profileImageUrl"
                :src="getAccountForPlatform(platformId)?.profileImageUrl"
                class="h-6 w-6 rounded-full object-cover"
                :alt="getPlatformName(platformId)"
              />
            </div>
            <div
              class="icon-container absolute bottom-0 right-0 flex h-3 w-3 items-center justify-center rounded-full border border-black bg-black"
            >
              <FontAwesomeIcon
                :icon="getPlatformIcon(getPlatformName(platformId))"
                class="h-[8px] stroke-white"
              />
            </div>
          </div>
          <span class="text-xs">{{
            getAccountForPlatform(platformId)?.username ||
            getPlatformName(platformId)
          }}</span>
        </div>
      </div>
    </div>
  </teleport>
</template>

<style scoped>
  /* Platform popup styles - moved outside scoped to affect teleported elements */
  .platform-popup {
    max-height: 80vh;
    overflow-y: hidden;
  }

  .sidebar-scrollable {
    max-height: calc(100vh - 238px);
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

  .sidebar-scrollable {
    scrollbar-width: 2px;
    scrollbar-color: #d1d5db;
  }

  .dropdown-enter-active,
  .dropdown-leave-active {
    transition: all 0.1s ease;
  }

  .dropdown-enter-from,
  .dropdown-leave-to {
    opacity: 0;
    transform: translateY(20px);
  }

  .post-list-enter-active,
  .post-list-leave-active {
    transition: all 0.2s ease;
    max-height: 200px; /* Approximate max height of a post */
    overflow: hidden;
  }

  .post-list-enter-from {
    opacity: 0;
    max-height: 0;
    transform: translateY(-20px);
  }

  .post-list-leave-to {
    opacity: 0;
    max-height: 0;
    transform: translateY(20px);
  }

  .post-list-move {
    transition: transform 0.2s ease;
  }
</style>
