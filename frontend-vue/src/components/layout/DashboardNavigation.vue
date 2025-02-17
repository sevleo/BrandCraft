<script setup lang="ts">
  import { useRouter } from 'vue-router';
  import { ref, onMounted, onUnmounted } from 'vue';
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
    Calendar,
    List,
    Users,
    MessageCircle,
    User,
  } from 'lucide-vue-next';

  import birdLogoFullGreenBlack from '/bird_logo_full_green_black.svg';
  import birdLogoFullGreenWhite from '/bird_logo_full_green_white.svg';

  const themeStore = useThemeStore();

  const router = useRouter();
  const showDropdown = ref(false);
  const dropdownRef = ref<HTMLElement | null>(null);

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

  // const currentTheme = computed(() => themeStore.currentTheme);

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

  // Close dropdown when clicking outside
  function handleClickOutside(event: MouseEvent) {
    if (
      dropdownRef.value &&
      !dropdownRef.value.contains(event.target as Node)
    ) {
      showDropdown.value = false;
    }
  }

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
    class="border-layoutSoft fixed left-0 top-0 h-screen w-[270px] border-r bg-white transition-colors duration-200 dark:border-[#313131] dark:bg-[#121212]"
  >
    <div class="bg-lightWhite flex h-full flex-col">
      <!-- Navigation Links -->
      <div class="mt-6 flex flex-col space-y-4 px-4">
        <router-link
          to="/dashboard/brands"
          class="flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-[#d9d9d9]/10"
          :class="{
            'bg-gray-100 text-gray-900 dark:bg-[#d9d9d9]/10':
              $route.path === '/dashboard/brands',
          }"
        >
          Overview
        </router-link>
        <router-link
          to="/dashboard/publish"
          class="flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-[#d9d9d9]/10"
          :class="{
            'bg-gray-100 text-gray-900 dark:bg-[#d9d9d9]/10':
              $route.path === '/dashboard/publish',
          }"
        >
          Publish
        </router-link>
      </div>

      <!-- User Profile Section -->
      <div class="mt-[100px] p-4">
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
              class="absolute bottom-[55px] left-0 z-10 w-full rounded-md border border-gray-300 bg-white py-1 shadow-lg ring-opacity-5 dark:border-[#313131] dark:bg-[#121212]"
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
