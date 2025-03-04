<script setup lang="ts">
import birdLogoIcon from "@/public/perfect_logo_full_white.svg";
import { ref } from "vue";
import { Menu, X, ChevronRight, ChevronDown } from "lucide-vue-next";
import { redirectToLogin, redirectToSignup } from "@/utils/redirects";

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
  <nav
    class="fixed left-0 top-0 z-50 w-full flex justify-center items-center bg-[#0a0a0a]"
  >
    <div class="">
      <div
        class="flex h-16 items-center justify-between px-[20px] max-w-[1200px] w-[100vw]"
      >
        <!-- Left: BrandCraft -->
        <NuxtLink to="/home" class="flex items-center gap-2">
          <img
            :src="birdLogoIcon"
            alt="BrandCraft Bird"
            class="h-[40px] sm:h-[50px] transition-transform duration-300"
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
          <button
            @click="redirectToLogin()"
            class="font-medium text-gray-100 hover:text-gray-300 cursor-pointer"
          >
            Log in
          </button>
          <button
            @click="redirectToSignup()"
            class="inline-flex cursor-pointer items-center justify-center rounded-full bg-green-900 px-6 py-2 text-base font-medium text-white hover:bg-greenLightBG"
          >
            Sign Up
          </button>
        </div>

        <!-- Mobile Menu Button -->
        <button
          @click="toggleMenu"
          class="hidden text-gray-300 hover:text-gray-900 max-xsm:block"
        >
          <Menu v-if="!isMenuOpen" class="h-6 w-6" />
          <X v-else class="h-6 w-6" />
        </button>
      </div>
    </div>

    <!-- Mobile Menu -->
    <Transition name="fade" mode="out-in">
      <div v-if="isMenuOpen" class="fixed inset-0 top-16 z-50 bg-[#0b0b0b]">
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
                class="flex w-full items-center justify-between py-2 text-lg font-medium text-gray-100"
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
                  class="block cursor-not-allowed py-2 text-gray-200 opacity-50"
                  >Smart Scheduling</span
                >
                <span
                  class="block cursor-not-allowed py-2 text-gray-200 opacity-50"
                  >Analytics</span
                >
                <span
                  class="block cursor-not-allowed py-2 text-gray-200 opacity-50"
                  >Content Management</span
                >
              </div>
            </div>

            <!-- Channels -->
            <div>
              <button
                @click="toggleItem('channels')"
                class="flex w-full items-center justify-between py-2 text-lg font-medium text-gray-100"
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
                  class="block cursor-not-allowed py-2 text-gray-200 opacity-50"
                  >Instagram</span
                >
                <span
                  class="block cursor-not-allowed py-2 text-gray-200 opacity-50"
                  >TikTok</span
                >
                <span
                  class="block cursor-not-allowed py-2 text-gray-200 opacity-50"
                  >Bluesky</span
                >
                <span
                  class="block cursor-not-allowed py-2 text-gray-200 opacity-50"
                  >Threads</span
                >
                <span
                  class="block cursor-not-allowed py-2 text-gray-200 opacity-50"
                  >Mastodon</span
                >
                <span
                  class="block cursor-not-allowed py-2 text-gray-200 opacity-50"
                  >Twitter</span
                >
                <span
                  class="block cursor-not-allowed py-2 text-gray-200 opacity-50"
                  >Facebook</span
                >
                <span
                  class="block cursor-not-allowed py-2 text-gray-200 opacity-50"
                  >LinkedIn</span
                >
                <span
                  class="block cursor-not-allowed py-2 text-gray-200 opacity-50"
                  >YouTube</span
                >
              </div>
            </div>

            <!-- Blog -->
            <span
              class="cursor-not-allowed py-2 text-lg font-medium text-gray-100"
            >
              Blog
            </span>
            <a
              href="https://discord.gg/KYZGsH7Mfb"
              target="_blank"
              rel="noopener noreferrer"
              class="py-2 text-lg font-medium text-gray-100"
              >Join Discord</a
            >
            <a
              href="https://insigh.to/b/brandcraftart"
              target="_blank"
              rel="noopener noreferrer"
              class="py-2 text-lg font-medium text-gray-100"
              >Request a feature</a
            >

            <!-- Login -->
            <button
              @click="redirectToLogin()"
              class="py-2 text-lg font-medium text-green hover:text-greenLight"
            >
              Log In
            </button>

            <!-- Get Started Button -->
            <button
              @click="redirectToSignup()"
              class="bg-greenBG hover:bg-greenLightBG rounded-full px-6 py-3 text-center text-lg font-medium text-white"
            >
              Get Started Now
            </button>
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
