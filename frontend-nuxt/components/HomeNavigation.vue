<script setup lang="ts">
import birdLogoFullGreenBlack from "/bird_logo_full_green_black.svg";
import { ref } from "vue";
import { Menu, X, ChevronRight, ChevronDown } from "lucide-vue-next";

const config = useRuntimeConfig();

const isMenuOpen = ref(false);
const expandedItems = ref<string[]>([]);

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
  if (!isMenuOpen.value) {
    expandedItems.value = [];
  }
};

const toggleItem = (item: string) => {
  if (expandedItems.value.includes(item)) {
    expandedItems.value = expandedItems.value.filter((i) => i !== item);
  } else {
    expandedItems.value.push(item);
  }
};

onMounted(() => {});
</script>

<template>
  <nav class="fixed left-0 top-0 z-50 w-full bg-white">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="flex h-16 items-center justify-between">
        <!-- Left: BrandCraft -->
        <NuxtLink to="/home">
          <img
            :src="birdLogoFullGreenBlack"
            alt="BrandCraft Logo"
            class="h-[40px]"
          />
        </NuxtLink>

        <!-- Middle: Tools and Channels -->
        <!-- <div class="hidden space-x-8 md:flex">
          <a href="#tools" class="font-medium text-gray-600 hover:text-gray-900"
            >Tools</a
          >
          <a
            href="#channels"
            class="font-medium text-gray-600 hover:text-gray-900"
            >Channels</a
          >
          <a
            href="#pricing"
            class="font-medium text-gray-600 hover:text-gray-900"
            >Pricing</a
          >
          <a href="#blog" class="font-medium text-gray-600 hover:text-gray-900"
            >Blog</a
          >
        </div> -->

        <!-- Right: Login/Signup or Dashboard -->
        <div class="flex items-center gap-4 space-x-4 max-xsm:hidden">
          <NuxtLink
            :to="`${config.public.NUXT_PUBLIC_FRONTEND_URL}/login`"
            class="font-medium text-gray-600 hover:text-gray-900"
          >
            Login
          </NuxtLink>
          <NuxtLink
            :to="`${config.public.NUXT_PUBLIC_FRONTEND_URL}/signup`"
            class="bg-greenBG hover:bg-greenLightBG rounded-full px-6 py-2 font-medium text-white"
          >
            Sign Up
          </NuxtLink>
        </div>

        <!-- Mobile Menu Button -->
        <button
          @click="toggleMenu"
          class="hidden text-gray-600 hover:text-gray-900 max-xsm:block"
        >
          <Menu v-if="!isMenuOpen" class="h-6 w-6" />
          <X v-else class="h-6 w-6" />
        </button>
      </div>
    </div>

    <!-- Mobile Menu -->
    <Transition name="fade" mode="out-in">
      <div v-if="isMenuOpen" class="fixed inset-0 top-16 z-50 bg-white">
        <div
          class="h-[calc(100vh-4rem)] overflow-y-auto overscroll-contain px-4 py-6"
          @touchmove.stop
          @wheel.stop
        >
          <div class="flex flex-col gap-4 pb-[140px]">
            <!-- Features -->
            <div>
              <button
                @click="toggleItem('features')"
                class="flex w-full items-center justify-between py-2 text-lg font-medium text-gray-900"
              >
                <span>Features</span>
                <ChevronDown
                  v-if="!expandedItems.includes('features')"
                  class="h-5 w-5"
                />
                <ChevronRight v-else class="h-5 w-5" />
              </button>
              <div
                v-if="expandedItems.includes('features')"
                class="ml-4 mt-2 space-y-2"
              >
                <span
                  class="block cursor-not-allowed py-2 text-gray-400 opacity-50"
                  >Smart Scheduling</span
                >
                <span
                  class="block cursor-not-allowed py-2 text-gray-400 opacity-50"
                  >Analytics</span
                >
                <span
                  class="block cursor-not-allowed py-2 text-gray-400 opacity-50"
                  >Content Management</span
                >
              </div>
            </div>

            <!-- Channels -->
            <div>
              <button
                @click="toggleItem('channels')"
                class="flex w-full items-center justify-between py-2 text-lg font-medium text-gray-900"
              >
                <span>Channels</span>
                <ChevronDown
                  v-if="!expandedItems.includes('channels')"
                  class="h-5 w-5"
                />
                <ChevronRight v-else class="h-5 w-5" />
              </button>
              <div
                v-if="expandedItems.includes('channels')"
                class="ml-4 mt-2 space-y-2"
              >
                <span
                  class="block cursor-not-allowed py-2 text-gray-400 opacity-50"
                  >Instagram</span
                >
                <span
                  class="block cursor-not-allowed py-2 text-gray-400 opacity-50"
                  >TikTok</span
                >
                <span
                  class="block cursor-not-allowed py-2 text-gray-400 opacity-50"
                  >Bluesky</span
                >
                <span
                  class="block cursor-not-allowed py-2 text-gray-400 opacity-50"
                  >Threads</span
                >
                <span
                  class="block cursor-not-allowed py-2 text-gray-400 opacity-50"
                  >Mastodon</span
                >
                <span
                  class="block cursor-not-allowed py-2 text-gray-400 opacity-50"
                  >Twitter</span
                >
                <span
                  class="block cursor-not-allowed py-2 text-gray-400 opacity-50"
                  >Facebook</span
                >
                <span
                  class="block cursor-not-allowed py-2 text-gray-400 opacity-50"
                  >LinkedIn</span
                >
                <span
                  class="block cursor-not-allowed py-2 text-gray-400 opacity-50"
                  >YouTube</span
                >
              </div>
            </div>

            <!-- Blog -->
            <span
              class="cursor-not-allowed py-2 text-lg font-medium text-gray-400 opacity-50"
            >
              Blog
            </span>
            <a
              href="https://discord.gg/KYZGsH7Mfb"
              target="_blank"
              rel="noopener noreferrer"
              class="py-2 text-lg font-medium text-gray-900"
              >Join Discord</a
            >
            <a
              href="https://insigh.to/b/brandcraftart"
              target="_blank"
              rel="noopener noreferrer"
              class="py-2 text-lg font-medium text-gray-900"
              >Request a feature</a
            >

            <!-- Login -->
            <NuxtLink
              :to="`${config.public.NUXT_PUBLIC_FRONTEND_URL}/login`"
              class="py-2 text-lg font-medium text-green hover:text-greenLight"
            >
              Log In
            </NuxtLink>

            <!-- Get Started Button -->
            <NuxtLink
              :to="`${config.public.NUXT_PUBLIC_FRONTEND_URL}/signup`"
              class="bg-greenBG hover:bg-greenLightBG mt-[30px] rounded-full px-6 py-3 text-center text-lg font-medium text-white"
            >
              Get Started Now
            </NuxtLink>
          </div>
        </div>
      </div>
    </Transition>
  </nav>
</template>

<style scoped>
.fade-enter-from {
  opacity: 0;
}

.fade-enter-active {
  opacity: 0;
  animation: movingIn 0.3s;
}

.fade-leave-active {
  animation: movingOut 0.3s;
}

@keyframes movingIn {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

@keyframes movingOut {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}
</style>
