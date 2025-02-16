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
    class="border-b border-gray-200 bg-white transition-colors duration-200 dark:border-[#313131] dark:bg-[#121212]"
  >
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="flex h-16 justify-between">
        <div class="flex gap-20">
          <div
            class="flex flex-shrink-0 cursor-pointer items-center"
            @click="router.push('/dashboard')"
          >
            <img
              :src="
                themeStore.currentTheme === 'dark'
                  ? birdLogoFullGreenWhite
                  : birdLogoFullGreenBlack
              "
              alt="BrandCraft Logo"
              class="flex h-[35px] items-center justify-center"
            />
          </div>

          <div class="ml-6 flex space-x-8">
            <router-link
              to="/dashboard/brands"
              class="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-[#9d9d9d] hover:text-gray-700"
              :class="{
                'border-[#9d9d9d] text-gray-900':
                  $route.path === '/dashboard/brands',
              }"
            >
              Overview
            </router-link>
            <router-link
              to="/dashboard/publish"
              class="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-[#9d9d9d] hover:text-gray-700"
              :class="{
                'border-[#9d9d9d] text-gray-900':
                  $route.path === '/dashboard/publish',
              }"
            >
              Publish
            </router-link>
          </div>
        </div>
        <div class="relative flex items-center" ref="dropdownRef">
          <div
            @click="showDropdown = !showDropdown"
            class="flex cursor-pointer items-center justify-start rounded-md border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-100 dark:border-[#313131] dark:bg-[#121212] dark:hover:bg-[#d9d9d9]/10"
          >
            <img />
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
              class="absolute right-0 top-[55px] z-10 w-48 rounded-md border border-gray-300 bg-white py-1 shadow-lg ring-opacity-5 dark:border-[#313131] dark:bg-[#121212]"
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
              <!-- Admin Button - Only shown for admin users -->

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
