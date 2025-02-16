<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { Check } from "lucide-vue-next";
import { useHead, definePageMeta, useRuntimeConfig } from "#imports";
import { verifyAuth } from "@/api/authApi";
import click1 from "@/assets/LandingPageIcons/click1.png";
import click2 from "@/assets/LandingPageIcons/click2.png";
import click3 from "@/assets/LandingPageIcons/click3.png";
import FaqSection from "@/components/FaqSection.vue";

definePageMeta({
  title: "BrandCraft - The Ultimate Social Media Management Platform",
  description:
    "Save time and get real results on social media. Schedule posts, track performance, and grow your audience across all social platforms.",
  alias: ["/home"],
});

useHead({
  title: "BrandCraft - The Ultimate Social Media Management Platform",
  meta: [
    {
      name: "description",
      content:
        "Save time and get real results on social media. Schedule posts, track performance, and grow your audience across all social platforms.",
    },
  ],
});

// Import Assets (Nuxt auto-handles static files)
import screenshot1 from "@/assets/Waitlist/screenshot_1.png";
import screenshot2 from "@/assets/Waitlist/screenshot_2.png";

// Import Icons
import instagramIcon from "@/assets/icons/instagram.svg";
import xIcon from "@/assets/icons/x.svg";
import mastodonIcon from "@/assets/icons/mastodon.svg";
import facebookIcon from "@/assets/icons/facebook.svg";
import tiktokIcon from "@/assets/icons/tiktok.svg";
import youtubeIcon from "@/assets/icons/youtube.svg";
import blueskyIcon from "@/assets/icons/bluesky.svg";
import threadsIcon from "@/assets/icons/threads.svg";
import linkedinIcon from "@/assets/icons/linkedin.svg";
import pinterestIcon from "@/assets/icons/pinterest.svg";

// Runtime config
const config = useRuntimeConfig();

// Define proper types for the component's state
interface ComponentState {
  isLoaded: Ref<boolean>;
  email: Ref<string>;
  submitted: Ref<boolean>;
  instagramIcon: string;
  tiktokIcon: string;
  youtubeIcon: string;
  facebookIcon: string;
  threadsIcon: string;
  blueskyIcon: string;
  xIcon: string;
  mastodonIcon: string;
  screenshot1: string;
  screenshot2: string;
  click1: string;
  click2: string;
  click3: string;
}

// Create a composable for component state
const useComponentState = (): ComponentState => {
  const isLoaded = useState("isLoaded", () => ref(false));
  const email = ref("");
  const submitted = ref(false);

  return {
    isLoaded,
    email,
    submitted,
    instagramIcon,
    tiktokIcon,
    youtubeIcon,
    facebookIcon,
    threadsIcon,
    blueskyIcon,
    xIcon,
    mastodonIcon,
    screenshot1,
    screenshot2,
    click1,
    click2,
    click3,
  };
};

// Use the composable to manage state
const state = useComponentState();

const router = useRouter();

const getUTMParameters = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get("utm_source") || null;
};

const saveVisitorInfo = (utmSource: string | null, referrer: string | null) => {
  if (utmSource) localStorage.setItem("utmSource", utmSource);
  if (referrer) localStorage.setItem("referrer", referrer);
};

// Improve the tracking function with proper typing
interface TrackVisitorParams {
  utmParams: string | null;
  referrer: string | null;
}

const trackVisitor = async ({ utmParams, referrer }: TrackVisitorParams) => {
  try {
    const endpoint = `${config.public.NUXT_PUBLIC_BACKEND_URL}/waitlist/track-visitor`;
    await axios.post(endpoint, { utmParams, referrer });
  } catch (err) {
    console.error("Tracking error:", err);
  }
};

function redirectToSignup() {
  const frontendUrl = config.public.NUXT_PUBLIC_FRONTEND_URL;
  window.location.href = `${frontendUrl}/signup`;
}

onMounted(async () => {
  state.isLoaded.value = true;
  await verifyAuth(config.public.NUXT_PUBLIC_BACKEND_URL);
  const utmParams = getUTMParameters();
  const storedUTM = localStorage.getItem("utmSource");
  const referrer =
    localStorage.getItem("referrer") || document.referrer || null;

  saveVisitorInfo(storedUTM || utmParams, referrer);
  await trackVisitor({
    utmParams: storedUTM || utmParams,
    referrer,
  });
});
</script>

<template>
  <div v-if="state.isLoaded" class="home-view">
    <HomeNavigation />
    <main class="main w-full">
      <!-- Hero Section -->
      <section
        class="hero-section bg-gradient-to-b from-white to-gray-50 mt-[50px] sm:mt-[200px]"
      >
        <div class="container mx-auto max-w-7xl px-4 sm:px-6">
          <div class="grid grid-cols-1 gap-12 lg:grid-cols-2">
            <!-- Left Column: Text Content -->
            <div class="flex flex-col justify-center">
              <h1
                class="mb-6 text-4xl font-bold leading-tight tracking-tight text-gray-900 sm:text-5xl lg:text-6xl"
              >
                Save time and get
                <span class="text-greenBG">real results</span> on social media
              </h1>
              <p class="mb-8 text-xl text-gray-600">
                BrandCraft makes it easy to schedule posts, track performance,
                and grow your audience across all social platforms.
              </p>
              <div
                class="flex flex-col gap-4 sm:flex-row items-center justify-center sm:justify-start"
              >
                <button
                  @click="redirectToSignup"
                  type="submit"
                  class="inline-flex items-center max-sm:w-[300px] justify-center cursor-pointer rounded-full bg-greenBG px-8 py-3 text-lg font-semibold text-white transition hover:bg-greenLightBG"
                >
                  Get for free
                </button>
                <a
                  href="#how-it-works"
                  class="inline-flex items-center max-sm:w-[300px] justify-center cursor-pointer rounded-full border border-gray-300 bg-white px-8 py-3 text-lg font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  See how it works
                </a>
              </div>

              <!-- Trust Badges -->
              <div class="mt-8 flex flex-wrap items-center gap-4">
                <div class="flex items-center gap-2">
                  <Check :size="20" color="#22c55e" />
                  <span class="text-sm text-gray-600"
                    >No credit card required</span
                  >
                </div>
                <div class="flex items-center gap-2">
                  <Check :size="20" color="#22c55e" />
                  <span class="text-sm text-gray-600">Free forever plan</span>
                </div>
              </div>
            </div>

            <!-- Right Column: Platform Preview -->
            <div class="relative mt-[80px] sm:mt-[0px]">
              <img
                :src="state.screenshot1"
                alt="BrandCraft Platform Preview"
                class="rounded-lg shadow-xl transition-all duration-300 hover:shadow-2xl"
              />
              <!-- Platform Icons Floating -->
              <div
                class="absolute max-sm:w-[93vw] left-[50%] flex justify-center items-center max-sm:translate-x-[-50%] -top-[100px] sm:-left-4 sm:-top-4 gap-3 rounded-lg bg-white p-4 shadow-lg"
              >
                <img
                  v-for="icon in [
                    state.instagramIcon,
                    state.tiktokIcon,
                    state.youtubeIcon,
                    state.facebookIcon,
                    state.threadsIcon,
                    state.blueskyIcon,
                    state.xIcon,
                    state.mastodonIcon,
                  ]"
                  :key="icon"
                  :src="icon"
                  :alt="icon"
                  class="h-8 w-8 transition-transform hover:scale-110"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Stats Section -->
      <section class="bg-gray-50 py-20">
        <div class="container mx-auto max-w-7xl px-4 sm:px-6">
          <div class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div class="text-center">
              <div class="text-4xl font-bold text-greenBG">100+</div>
              <div class="mt-2 text-gray-600">Active Users</div>
            </div>
            <div class="text-center">
              <div class="text-4xl font-bold text-greenBG">8+</div>
              <div class="mt-2 text-gray-600">Supported Platforms</div>
            </div>
            <div class="text-center">
              <div class="text-4xl font-bold text-greenBG">1000+</div>
              <div class="mt-2 text-gray-600">Posts Scheduled</div>
            </div>
            <div class="text-center">
              <div class="text-4xl font-bold text-greenBG">24/7</div>
              <div class="mt-2 text-gray-600">Support</div>
            </div>
          </div>
        </div>
      </section>

      <!-- How it works section -->
      <section id="how-it-works" class="w-full py-24 bg-gray-50">
        <div class="container mx-auto max-w-7xl px-4 sm:px-6">
          <div class="text-center mb-6">
            <h2 class="text-4xl md:text-5xl font-bold text-gray-900">
              How it works?
            </h2>
            <p class="text-xl text-gray-600 max-w-2xl mx-auto">
              Schedule content in 3 simple steps
            </p>
          </div>

          <div class="space-y-24">
            <!-- Step 1 -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div class="order-1">
                <div class="p-8 rounded-2xl">
                  <span
                    class="inline-block px-4 py-1 border border-greenBG text-greenBG rounded-full text-sm mb-4"
                  >
                    Step 1
                  </span>
                  <h3 class="text-2xl font-bold text-gray-900 mb-4">
                    Craft your perfect post
                  </h3>
                  <p class="text-lg text-gray-600 leading-relaxed">
                    Create compelling content that resonates with your audience.
                    Our AI-powered editor helps you optimize your posts for each
                    platform, ensuring maximum engagement.
                  </p>
                  <ul class="mt-6 space-y-3">
                    <li class="flex items-center text-gray-600">
                      <Check class="h-5 w-5 text-greenBG mr-2" />
                      <span>Smart text formatting for each platform</span>
                    </li>
                    <!-- <li class="flex items-center text-gray-600">
                      <Check class="h-5 w-5 text-greenBG mr-2" />
                      <span>Built-in hashtag suggestions</span>
                    </li> -->
                    <li class="flex items-center text-gray-600">
                      <Check class="h-5 w-5 text-greenBG mr-2" />
                      <span>Media optimization tools</span>
                    </li>
                  </ul>
                </div>
              </div>
              <div class="order-2">
                <div
                  class="bg-gradient-to-br from-green-50 to-white p-6 rounded-2xl"
                >
                  <img
                    :src="state.click1"
                    alt="Content creation interface"
                    class="w-full rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300"
                  />
                </div>
              </div>
            </div>

            <!-- Step 2 -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div class="order-2 lg:order-1">
                <div
                  class="bg-gradient-to-br from-green-50 to-white p-6 rounded-2xl"
                >
                  <img
                    :src="state.click2"
                    alt="Platform selection interface"
                    class="w-full rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300"
                  />
                </div>
              </div>
              <div class="order-1 lg:order-2">
                <div class="p-8 rounded-2xl">
                  <span
                    class="inline-block px-4 py-1 border border-greenBG text-greenBG rounded-full text-sm mb-4"
                  >
                    Step 2
                  </span>
                  <h3 class="text-2xl font-bold text-gray-900 mb-4">
                    Connect your platforms
                  </h3>
                  <p class="text-lg text-gray-600 leading-relaxed">
                    Manage all your social media accounts from one central
                    dashboard. Connect once, publish everywhere, and save hours
                    of manual work.
                  </p>
                  <ul class="mt-6 space-y-3">
                    <li class="flex items-center text-gray-600">
                      <Check class="h-5 w-5 text-greenBG mr-2" />
                      <span>One-click platform connection</span>
                    </li>
                    <li class="flex items-center text-gray-600">
                      <Check class="h-5 w-5 text-greenBG mr-2" />
                      <span>Support for 8+ social networks</span>
                    </li>
                    <li class="flex items-center text-gray-600">
                      <Check class="h-5 w-5 text-greenBG mr-2" />
                      <span>Unified content calendar</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- Step 3 -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div class="order-2">
                <div class="p-8 rounded-2xl">
                  <span
                    class="inline-block px-4 py-1 border border-greenBG text-greenBG rounded-full text-sm mb-4"
                  >
                    Step 3
                  </span>
                  <h3 class="text-2xl font-bold text-gray-900 mb-4">
                    Schedule strategically
                  </h3>
                  <p class="text-lg text-gray-600 leading-relaxed">
                    Maximize your reach with intelligent scheduling. Our AI
                    analyzes your audience's behavior to recommend the best
                    posting times.
                  </p>
                  <ul class="mt-6 space-y-3">
                    <!-- <li class="flex items-center text-gray-600">
                      <Check class="h-5 w-5 text-greenBG mr-2" />
                      <span>AI-powered optimal timing</span>
                    </li> -->
                    <li class="flex items-center text-gray-600">
                      <Check class="h-5 w-5 text-greenBG mr-2" />
                      <span>Bulk scheduling features</span>
                    </li>
                    <li class="flex items-center text-gray-600">
                      <Check class="h-5 w-5 text-greenBG mr-2" />
                      <span>Draft management</span>
                    </li>
                    <!-- <li class="flex items-center text-gray-600">
                      <Check class="h-5 w-5 text-greenBG mr-2" />
                      <span>Time zone management</span>
                    </li> -->
                  </ul>
                </div>
              </div>
              <div class="order-2">
                <div
                  class="bg-gradient-to-br from-green-50 to-white p-6 rounded-2xl"
                >
                  <img
                    :src="state.click3"
                    alt="Scheduling interface"
                    class="w-full rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <TestimonialsSection />
      <FaqSection />
      <!-- Bottom CTA Section -->
      <section
        class="w-full py-20 bg-gradient-to-br bg-green-100 h-[500px] flex justify-center items-center"
      >
        <div
          class="max-w-[800px] mx-auto text-center flex flex-col justify-center items-center px-[50px]"
        >
          <h2
            class="text-[40px] mb-[20px] font-semibold tracking-tight leading-[1.2] max-w-[400px]"
          >
            Ready to streamline your social media?
          </h2>
          <p class="text-xl text-gray-600">
            Schedule all your content in minutes, not hours.
          </p>
          <p class="text-xl text-gray-600">
            Post consistently across all platforms.
          </p>
          <button
            @click="redirectToSignup"
            class="px-8 mt-[40px] cursor-pointer py-4 text-lg font-medium text-white bg-greenBG hover:bg-greenLightBG rounded-full transition-all duration-200"
          >
            Get for free
          </button>
        </div>
      </section>
    </main>
    <!-- Privacy Policy Link -->
    <footer
      class="privacy justify-center items-center flex flex-col pt-[60px] px-[50px] w-full"
    >
      <div
        class="w-full max-w-[1000px] flex gap-4 flex-col lg:flex-row lg:w-[80%]"
      >
        <div
          class="flex h-full w-full lg:justify-center items-start justify-center"
        >
          <div class="flex flex-col justify-center items-start">
            <img
              src="@/public/perfect_logo_full.svg"
              alt="BrandCraft Logo"
              class="w-[200px] mb-[10px] self-center lg:self-start"
            />
            <p
              class="text-gray-600 text-[14px] leading-relaxed w-[300px] text-center lg:text-start"
            >
              Open-source social media scheduler.
            </p>
            <p
              class="text-gray-600 text-[14px] leading-relaxed w-[300px] text-center lg:text-start"
            >
              Join us on
              <a
                @click=""
                href="https://discord.gg/KYZGsH7Mfb"
                class="underline"
                target="_blank"
                >Discord</a
              >.
            </p>
            <p
              class="text-gray-600 text-[14px] leading-relaxed w-[300px] text-center lg:text-start"
            >
              Submit a bug or request a feature
              <a
                @click=""
                href="https://insigh.to/b/brandcraftart"
                class="underline"
                target="_blank"
                >here</a
              >.
            </p>

            <!-- <div class="flex mt-[20px]">
              <div>github link</div>
              <div>discord link</div>
              <div>twitter link</div>
            </div> -->
          </div>
        </div>

        <div
          class="flex h-full w-full lg:justify-center items-start justify-center"
        >
          <div
            class="flex flex-col w-[120px] justify-center items-center lg:items-start gap-1 mt-[15px]"
          >
            <p
              class="text-[16px] text-gray-500 tracking-wider font-medium mb-[10px]"
            >
              RESOURCES
            </p>
            <a href="/blog" class="hover:underline">Blog</a>
            <a href="https://discord.gg/KYZGsH7Mfb" class="hover:underline"
              >Discord</a
            >
            <a href="mailto:sev@brandcraft.art" class="hover:underline"
              >Email</a
            >
          </div>
        </div>
        <div
          class="flex h-full w-full lg:justify-center items-start justify-center"
        >
          <div
            class="flex w-[120px] flex-col justify-center items-center lg:items-start gap-1 mt-[15px]"
          >
            <p
              class="text-[16px] text-gray-500 tracking-wider font-medium mb-[10px]"
            >
              CHANNELS
            </p>
            <NuxtLink href="/instagram" class="hover:underline"
              >Instagram</NuxtLink
            >
            <NuxtLink href="/tiktok" class="hover:underline">TikTok</NuxtLink>
            <NuxtLink href="/youtube" class="hover:underline">YouTube</NuxtLink>
            <NuxtLink href="/facebook" class="hover:underline"
              >Facebook</NuxtLink
            >
            <NuxtLink href="/threads" class="hover:underline">Threads</NuxtLink>
            <NuxtLink href="/bluesky" class="hover:underline">Bluesky</NuxtLink>
            <NuxtLink href="/x" class="hover:underline">X (Twitter)</NuxtLink>
            <NuxtLink href="/twitter" class="hover:underline">Twitter</NuxtLink>
            <NuxtLink href="/mastodon" class="hover:underline"
              >Mastodon</NuxtLink
            >
          </div>
        </div>
        <div
          class="flex h-full w-full lg:justify-center items-start justify-center"
        >
          <div
            class="flex flex-col w-[120px] justify-center items-center lg:items-start gap-1 mt-[15px]"
          >
            <p
              class="text-[16px] text-gray-500 tracking-wider font-medium mb-[10px]"
            >
              LEGAL
            </p>
            <NuxtLink
              href="/terms"
              class="hover:underline lg:text-start text-center"
              >Terms and Conditions</NuxtLink
            >
            <NuxtLink href="/privacy" class="hover:underline"
              >Privacy Policy</NuxtLink
            >
          </div>
        </div>
      </div>
      <div class="flex justify-center items-start w-full mt-[50px] mb-[20px]">
        <p class="privacy mt-[10px] text-[14px] text-gray-500">
          @ 2024 Brandcraft All rights reserved.
        </p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
html,
body {
  overflow-x: hidden;
  position: relative;
  width: 100%;
}

.home-view {
  overflow-x: hidden;
  position: relative;
  width: 100%;
}

.waitlist-container {
  max-width: 1200px;
}

path {
  color: rgb(193, 0, 0);
}

.youtube-icon :deep(svg path) {
  fill: #212121;
}

/* Add smooth transitions */
.screenshot {
  box-shadow: 0px 0px 10px 2px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease-in-out;
}

.screenshot:hover {
  transform: translateY(-5px);
  box-shadow: 0px 5px 15px 2px rgba(0, 0, 0, 0.15);
}

/* Add hover effects to social icons */
.social-icon {
  transition: transform 0.2s ease;
}

.social-icon:hover {
  transform: scale(1.1);
}

/* Improve button animations */
button {
  transition: all 0.2s ease;
}

/* Add fade-in animation for content */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Add smooth scroll behavior */
html {
  scroll-behavior: smooth;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Add hover effects to cards */
.feature-card {
  transition: all 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

/* Improve responsive design */
@media (max-width: 640px) {
  .hero-section {
    padding-top: 80px;
  }

  h1 {
    font-size: 2.5rem;
    line-height: 1.2;
  }
}
</style>

<style>
.p-toast-detail {
  color: red !important;
}

@media (max-width: 700px) {
  .p-toast {
    width: 300px !important;
    left: 50%;
    transform: translateX(-50%);
  }

  .p-toast-message {
    background-color: rgb(255, 255, 255) !important;
  }
}
</style>
