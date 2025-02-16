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
  title: "BrandCraft - Social Media Management Tool",
  description: "Manage your social media presence with BrandCraft",
  alias: ["/home"],
});

useHead({
  title: "BrandCraft - Social Media Management Tool",
  meta: [
    {
      name: "description",
      content: "Manage your social media presence with BrandCraft",
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

// Create a state to track when styles are applied
const isLoaded = useState("isLoaded", () => ref(false));

const router = useRouter();
const email = ref("");
const submitted = ref(false);

const getUTMParameters = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get("utm_source") || null;
};

const saveVisitorInfo = (utmSource: string | null, referrer: string | null) => {
  if (utmSource) localStorage.setItem("utmSource", utmSource);
  if (referrer) localStorage.setItem("referrer", referrer);
};

const trackVisitor = async (
  utmParams: string | null,
  referrer: string | null
) => {
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
  isLoaded.value = true;
  await verifyAuth(config.public.NUXT_PUBLIC_BACKEND_URL);
  const utmParams = getUTMParameters();
  const storedUTM = localStorage.getItem("utmSource");
  const referrer =
    localStorage.getItem("referrer") || document.referrer || null;

  saveVisitorInfo(storedUTM || utmParams, referrer);
  trackVisitor(storedUTM || utmParams, referrer);
});
</script>

<template>
  <div v-if="isLoaded" class="home-view">
    <HomeNavigation />
    <main
      class="main flex h-full w-full items-center justify-center pt-[100px]"
    >
      <div
        class="waitlist-container mx-auto flex h-full w-full max-w-xl flex-col items-start px-4 text-center"
      >
        <!-- Heading and Subheading -->
        <section
          class="mt-[20px] flex h-auto w-full flex-col justify-between sm:mt-[50px]"
        >
          <div class="flex flex-col items-center">
            <header class="w-full max-w-[500px] self-center">
              <h1
                class="mb-[20px] mt-[20px] text-[32px] font-semibold leading-[1.2] tracking-tight max-xsm:px-[20px] sm:text-[50px] sm:leading-[50px]"
              >
                Schedule your content everywhere
              </h1>
              <h2
                class="mb-[30px] mt-[20px] text-center text-[16px] sm:mb-[40px] sm:mt-[40px] sm:text-[20px]"
              >
                Save countless hours while growing your audience
              </h2>
              <!-- Platform Icons -->
              <div
                class="mb-[20px] mt-[20px] flex flex-wrap justify-center gap-[10px] px-4 sm:px-0"
              >
                <img :src="instagramIcon" alt="Instagram" class="h-8 w-8" />
                <img :src="tiktokIcon" alt="TikTok" class="h-8 w-8" />
                <img :src="youtubeIcon" alt="YouTube" class="h-8 w-8" />
                <img :src="facebookIcon" alt="Facebook" class="h-8 w-8" />
                <img :src="threadsIcon" alt="Threads" class="h-8 w-8" />
                <img :src="blueskyIcon" alt="Bluesky" class="h-8 w-8" />
                <img :src="xIcon" alt="X (Twitter)" class="h-8 w-8" />
                <img :src="mastodonIcon" alt="Mastodon" class="h-8 w-8" />
              </div>
            </header>

            <!-- Signup Form -->
            <div aria-labelledby="sign-up" class="w-full max-w-[450px]">
              <button
                @click="redirectToSignup"
                type="submit"
                class="mt-[0px] mb-[20px] w-full cursor-pointer rounded-full bg-greenBG px-6 py-2 font-medium text-white hover:bg-greenLightBG sm:w-[150px]"
              >
                Get for FREE
              </button>

              <div
                class="flex flex-col gap-3 text-[12px] sm:flex-row sm:justify-center sm:gap-5"
              >
                <div class="flex items-center justify-center gap-2">
                  <Check :size="14" color="#22c55e" />
                  <p>Try for free</p>
                </div>
                <div class="flex items-center justify-center gap-2">
                  <Check :size="14" color="#22c55e" />
                  <p>No credit card required</p>
                </div>
                <!-- <div class="flex items-center justify-center gap-2">
                  <Check :size="14" color="#22c55e" />
                  <p>Unlimited number of accounts</p>
                </div> -->
              </div>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="previews"
          class="mt-[150px] h-[400px] w-full self-center overflow-hidden sm:h-[600px] sm:w-full"
        >
          <h2
            class="text-center text-[40px] font-semibold tracking-tight leading-[1.2]"
          >
            Built by Creator, for Creators
          </h2>
          <div class="relative h-full w-full">
            <img
              :src="screenshot1"
              alt="Screenshot 1"
              class="screenshot absolute left-1/2 top-[50px] w-[600px] -translate-x-[calc(50%+100px)] rounded-lg object-contain shadow-lg"
            />
            <img
              :src="screenshot2"
              alt="Screenshot 2"
              class="screenshot absolute left-1/2 top-[200px] w-[600px] -translate-x-[calc(50%-100px)] rounded-lg object-contain shadow-lg"
            />
          </div>
        </section>

        <!-- How it works section -->
        <section aria-labelledby="how-it-works" class="w-full mt-[150px]">
          <div class="w-full">
            <h2
              class="text-center text-[40px] font-semibold tracking-tight leading-[1.2]"
            >
              How it works?
            </h2>
            <p class="mb-[60px] text-center text-[16px] text-gray-600">
              Schedule posts with just a few clicks.
            </p>
            <div class="flex flex-col gap-[20px]">
              <!-- Step 1 -->
              <div
                class="grid grid-cols-1 sm:grid-cols-[1fr_0.5fr_1fr] items-center h-[460px]"
              >
                <div
                  class="bg-[#22c55e]/10 rounded-[20px] aspect-video flex items-center justify-start px-6 pt-10"
                >
                  <img :src="click1" alt="Click 1" />
                </div>
                <div class="flex flex-col items-start col-start-3">
                  <div
                    class="mb-2 flex py-[3px] px-[12px] items-center justify-center text-greenBG text-[16px] font-medium border border-greenBG rounded-full"
                  >
                    Click 1
                  </div>
                  <h3 class="mb-2 text-[24px] font-medium">Write your post</h3>
                  <p
                    class="text-gray-600 text-[16px] leading-relaxed text-start"
                  >
                    Create engaging content for your audience in one place. Our
                    intuitive editor makes it easy to craft the perfect post
                    that resonates with your followers.
                  </p>
                </div>
              </div>

              <!-- Step 2 -->
              <div
                class="grid grid-cols-1 sm:grid-cols-[1fr_0.5fr_1fr] items-center h-[460px]"
              >
                <div class="flex flex-col items-start sm:order-1">
                  <div
                    class="mb-2 flex py-[3px] px-[12px] items-center justify-center text-greenBG text-[16px] font-medium border border-greenBG rounded-full"
                  >
                    Click 2
                  </div>
                  <h3 class="mb-2 text-[24px] font-medium">Select platforms</h3>
                  <p
                    class="text-gray-600 text-[16px] leading-relaxed text-start"
                  >
                    Choose where you want your content to be published. Connect
                    multiple social media accounts and manage them all from one
                    dashboard.
                  </p>
                </div>
                <div
                  class="bg-[#22c55e]/10 rounded-[20px] col-start-3 aspect-video flex items-center justify-end px-6 pt-10 sm:order-2"
                >
                  <img :src="click2" alt="Click 2" />
                </div>
              </div>

              <!-- Step 3 -->
              <div
                class="grid grid-cols-1 sm:grid-cols-[1fr_0.5fr_1fr] items-center h-[460px]"
              >
                <div
                  class="bg-[#22c55e]/10 rounded-[20px] aspect-video flex items-center justify-start px-6 pt-10"
                >
                  <img :src="click3" alt="Click 3" />
                </div>
                <div class="flex flex-col items-start col-start-3">
                  <div
                    class="mb-2 flex py-[3px] px-[12px] items-center justify-center text-greenBG text-[16px] font-medium border border-greenBG rounded-full"
                  >
                    Click 3
                  </div>
                  <h3 class="mb-2 text-[24px] font-medium">Select time</h3>
                  <p
                    class="text-gray-600 text-[16px] leading-relaxed text-start"
                  >
                    Schedule your post for the perfect time to reach your
                    audience. Our platform helps you maintain a consistent
                    posting schedule across all platforms.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <TestimonialsSection />
        <FaqSection />

        <!-- Privacy Policy Link -->
        <footer class="privacy self-center max-xsm:mb-[150px] mt-[150px]">
          <p class="privacy mb-[30px] mt-[10px] text-xs text-gray-500">
            Join us on
            <a
              @click=""
              href="https://discord.gg/KYZGsH7Mfb"
              class="underline"
              target="_blank"
              >Discord</a
            >
            | Submit a bug or request a feature
            <a
              @click=""
              href="https://insigh.to/b/brandcraftart"
              class="underline"
              target="_blank"
              >here</a
            >
          </p>
          <p class="privacy mt-[10px] text-xs text-gray-500">
            @ 2024 Brandcraft.art by
            <a href="https://x.com/sev_tinker" class="underline">Seva Leo</a>.
          </p>

          <p
            class="privacy mt-[10px] flex justify-center gap-2 text-xs text-gray-500"
          >
            <NuxtLink to="/privacy" class="underline hover:text-green"
              >Privacy Policy</NuxtLink
            >
            <NuxtLink to="/terms" class="underline hover:text-green"
              >Terms & Conditions</NuxtLink
            >
          </p>
          <p class="privacy mb-[10px] mt-[10px] text-xs text-gray-500">
            All rights reserved.
          </p>
        </footer>
      </div>
    </main>
  </div>
</template>

<style scoped>
.waitlist-container {
  max-width: 1200px;
}

path {
  color: rgb(193, 0, 0);
}

.youtube-icon :deep(svg path) {
  fill: #212121;
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

.screenshot {
  box-shadow: 0px 0px 10px 2px rgba(0, 0, 0, 0.1);
}
</style>
