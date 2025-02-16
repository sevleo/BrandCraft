<script setup lang="ts">
  import { onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { useToast } from 'primevue/usetoast';

  import axios from 'axios';
  import check from '../../assets/check.svg';
  import giftIcon from '../../assets/giftIcon.svg';
  import screenshot1 from '../../assets/Waitlist/screenshot_1.png';
  import screenshot2 from '../../assets/Waitlist/screenshot_2.png';

  const toast = useToast();

  const router = useRouter();

  const emailsCount = ref(0);
  const email = ref('');
  const error = ref('');
  const loading = ref(false);
  const success = ref(false);

  const showError = () => {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.value,
      life: 4000,
    });
  };

  const getUTMParameters = () => {
    const params = new URLSearchParams(window.location.search);

    return params.get('utm_source') || null;
  };

  const saveVisitorInfo = (
    utmSource: string | null,
    referrer: string | null
  ) => {
    if (utmSource) {
      safeLocalStorage.setItem('utmSource', utmSource);
    }
    if (referrer) {
      safeLocalStorage.setItem('referrer', referrer);
    }
  };

  const trackVisitor = async (
    utmParams: string | null,
    referrer: string | null
  ) => {
    try {
      const endpoint = `${import.meta.env.VITE_BACKEND_URL}/waitlist/track-visitor`;
      await axios.post(endpoint, {
        utmParams,
        referrer,
      });
    } catch (err) {}
  };

  const handleSubmit = async () => {
    loading.value = true;
    const endpoint = `${import.meta.env.VITE_BACKEND_URL}/waitlist/add-email`;

    const utmParams = getUTMParameters();
    const storedUTM = safeLocalStorage.getItem('utmSource');

    const referrer =
      safeLocalStorage.getItem('referrer') || document.referrer || null;

    try {
      loading.value = true;
      const response = await axios.post(endpoint, {
        email: email.value,
        utmParams: storedUTM || utmParams,
        referrer,
      });
      emailsCount.value = response.data.emailCount;
      email.value = '';
      error.value = '';
      success.value = true;
    } catch (err: any) {
      error.value = err.response.data.message;
      showError();
    } finally {
      loading.value = false;
    }
  };

  const handleButtonClick = () => {
    const section = document.querySelector('#top');
    const inputField = document.querySelector('#email') as HTMLInputElement;
    const topPosition = section!.getBoundingClientRect().top;

    window.scrollTo({
      top: topPosition,
      behavior: 'smooth',
    });

    setTimeout(() => {
      inputField!.focus();
    }, 500);
  };

  const safeLocalStorage = {
    getItem: (key: string) => {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    setItem: (key: string, value: string) => {
      try {
        localStorage.setItem(key, value);
      } catch {
        // Ignore errors
      }
    },
  };

  onMounted(async () => {
    const utmParams = getUTMParameters();
    const storedUTM = safeLocalStorage.getItem('utmSource');

    const referrer =
      safeLocalStorage.getItem('referrer') || document.referrer || null;

    saveVisitorInfo(storedUTM || utmParams, referrer);

    trackVisitor(storedUTM || utmParams, referrer);

    try {
      const endpoint = `${import.meta.env.VITE_BACKEND_URL}/waitlist/emails-count`;
      const response = await axios.get(endpoint);
      emailsCount.value = response.data.emailCount;
    } catch (e) {
      console.error('Failed to load email count', e);
    }
  });
</script>

<template>
  <main class="main flex h-auto w-full items-center justify-center">
    <div
      class="waitlist-container flex w-full max-w-xl flex-col items-start px-4 py-8 text-center"
    >
      <div id="top" class="mt-[20px] text-[30px] font-light max-lg:w-full">
        Brandcraft.art
      </div>
      <!-- Heading and Subheading -->
      <div class="mt-[50px] flex w-full justify-between max-lg:flex-col">
        <header class="max-w-[320px] max-lg:max-w-[600px] max-lg:self-center">
          <h1
            class="mb-[20px] mt-[20px] text-start text-[50px] font-extrabold leading-[50px] tracking-tight max-lg:text-center"
          >
            Grow Your Personal Brand
          </h1>
          <h2
            class="mb-[80px] text-start text-[20px] max-lg:text-center max-[500px]:mb-[40px]"
          >
            Build engagement, track growth, and manage all your platforms from a
            single dashboard
          </h2>
        </header>
        <div class="relative ml-[100px] w-[600px] max-lg:hidden">
          <img
            :src="screenshot1"
            alt="Screenshot 1"
            class="absolute left-[100px] top-[0px] h-auto w-[600px] rotate-[-5deg] transform rounded-lg object-contain shadow-lg"
          />
          <img
            :src="screenshot2"
            alt="Screenshot 2"
            class="absolute left-[20px] top-[250px] h-auto w-[600px] rotate-[5deg] transform rounded-lg object-contain shadow-lg"
          />
        </div>
      </div>

      <!-- Signup Form -->
      <section
        aria-labelledby="sign-up"
        class="max-w-[350px] max-lg:self-center"
      >
        <div v-if="!success" class="h-[140px]">
          <div class="flex items-center justify-center gap-1">
            <img :src="giftIcon" alt="Gift Icon" class="h-4 w-4" />
            <p>Exclusive discount for Early Birds</p>
          </div>
          <form @submit.prevent="handleSubmit" class="mb-4 w-full">
            <label for="email" class="sr-only">Email</label>
            <input
              v-model="email"
              type="email"
              id="email"
              placeholder="Enter your email"
              class="mt-[10px] w-full rounded-lg border bg-[white] p-2 outline-none focus:border-[#0000005a]"
              required
            />

            <button
              type="submit"
              class="mt-[10px] w-full rounded-lg p-2 font-semibold text-white transition hover:bg-[#047f58df]"
              :class="
                loading
                  ? 'pointer-events-none cursor-not-allowed bg-[#9d9d9d]'
                  : 'bg-[#047f58]'
              "
            >
              {{ loading ? 'Saving...' : 'Join the Waitlist' }}
            </button>
          </form>
        </div>
        <div v-else-if="!loading" class="flex h-[140px] w-[350px] p-5">
          <div
            class="flex w-full flex-col items-center justify-center rounded-xl border-[1px] border-[#047f5888] bg-[#e2fbe8] py-[40px]"
          >
            <img
              :src="check"
              alt="Done"
              class="h-[20px] w-[20px] text-red-600"
            />

            <p class="text-[18px] font-bold text-[black]">Done!</p>
            <p class="text-[14px] text-[black]">
              You'll receive an email with your discount code on launch day.
            </p>
          </div>
        </div>

        <!-- Social Proof -->
        <p class="mt-[0px] text-sm">
          <strong>
            <span>{{ emailsCount !== undefined ? emailsCount : 0 }}</span> brand
            builders
          </strong>
          have already joined!
        </p>
      </section>

      <section
        aria-labelledby="previews "
        class="mt-[100px] hidden h-[700px] self-center max-lg:block"
      >
        <div class="h-[200px]">
          <img
            :src="screenshot1"
            alt="Screenshot 1"
            class="left-[100px] top-[0px] h-auto w-[600px] rotate-[-5deg] transform rounded-lg object-contain shadow-lg"
          />
          <img
            :src="screenshot2"
            alt="Screenshot 2"
            class="left-[20px] top-[250px] h-auto w-[600px] rotate-[5deg] transform rounded-lg object-contain shadow-lg"
          />
        </div>
      </section>

      <!-- Features Section -->
      <section
        aria-labelledby="features-title"
        class="features mt-[100px] self-center text-left"
      >
        <h2 class="mb-[80px] text-center text-[30px] font-semibold">
          Features You'll Love
        </h2>
        <ul class="flex flex-col gap-6">
          <li>
            <div class="flex items-center justify-start gap-16">
              <p
                class="w-[40px] self-start font-sans text-[50px] font-thin leading-[1]"
              >
                1
              </p>
              <div>
                <p class="text-[20px] font-bold">Calendar</p>
                <ul>
                  <li class="text-gray-700">
                    Bird’s-eye view of all your social media presence.
                  </li>
                  <li class="text-gray-700">
                    Schedule content for automatic posting across platforms.
                  </li>
                  <li class="text-gray-700">
                    Drag & drop to organize and shuffle scheduled posts.
                  </li>
                </ul>
              </div>
            </div>
          </li>
          <li>
            <div class="flex items-center justify-start gap-16">
              <p
                class="w-[40px] self-start font-sans text-[50px] font-thin leading-[1]"
              >
                2
              </p>
              <div>
                <p class="text-[20px] font-bold">
                  AI-Driven Content Suggestions
                </p>
                <ul>
                  <li class="text-gray-700">
                    Platform-specific recommendations for tone, length, and
                    engagement.
                  </li>
                  <li class="text-gray-700">
                    Real-time adjustments based on current trends.
                  </li>
                  <li class="text-gray-700">
                    Guided prompts from AI to help craft engaging posts.
                  </li>
                </ul>
              </div>
            </div>
          </li>
          <li>
            <div class="flex items-center justify-start gap-16">
              <p
                class="w-[40px] self-start font-sans text-[50px] font-thin leading-[1]"
              >
                3
              </p>
              <div>
                <p class="text-[20px] font-bold">Campaign and Story Planner</p>
                <ul>
                  <li class="text-gray-700">
                    Define campaigns with themes, stories, and target topics.
                  </li>
                  <li class="text-gray-700">
                    Use AI to break down stories into tailored posts for each
                    platform.
                  </li>
                </ul>
              </div>
            </div>
          </li>

          <li>
            <div class="flex items-center justify-start gap-16">
              <p
                class="w-[40px] self-start font-sans text-[50px] font-thin leading-[1]"
              >
                4
              </p>
              <div>
                <p class="text-[20px] font-bold">
                  Cross-Platform Story Cohesion
                </p>
                <ul>
                  <li class="text-gray-700">
                    Maintain a consistent brand voice with platform-specific
                    adaptations.
                  </li>
                  <li class="text-gray-700">
                    AI-assisted storytelling aligned with brand goals and
                    audience needs.
                  </li>
                </ul>
              </div>
            </div>
          </li>

          <li>
            <div class="flex items-center justify-start gap-16">
              <p
                class="w-[40px] self-start font-sans text-[50px] font-thin leading-[1]"
              >
                5
              </p>
              <div>
                <p class="text-[20px] font-bold">Analytics & Growth Insights</p>
                <ul>
                  <li class="text-gray-700">
                    Track engagement, follower growth, and top-performing
                    content.
                  </li>
                  <li class="text-gray-700">
                    Platform-specific insights for refining content strategy.
                  </li>
                </ul>
              </div>
            </div>
          </li>

          <li>
            <div class="flex items-center justify-start gap-16">
              <p
                class="w-[40px] self-start font-sans text-[50px] font-thin leading-[1]"
              >
                6
              </p>
              <div>
                <p class="text-[20px] font-bold">
                  Multi-Platform Campaign Management
                </p>
                <ul>
                  <li class="text-gray-700">
                    Plan, schedule, and track multi-platform campaigns from one
                    dashboard.
                  </li>
                  <li class="text-gray-700">
                    Efficiently coordinate posts for a cohesive brand presence.
                  </li>
                </ul>
              </div>
            </div>
          </li>
        </ul>
      </section>

      <!-- FAQ Section -->
      <section
        aria-labelledby="faq-title"
        class="faq mt-[140px] flex flex-col items-center justify-center self-center text-left"
      >
        <h2 class="mb-[40px] text-center text-[30px] font-semibold">
          Frequently Asked Questions
        </h2>

        <div class="flex max-w-[400px] flex-col gap-8">
          <div>
            <p class="text-[20px] font-bold">What is this?</p>
            <p class="text-gray-700">
              A unified social media management tool to grow your personal brand
              across platforms with integrated AI support.
            </p>
          </div>
          <div>
            <p class="text-[20px] font-bold">Why do I need this?</p>
            <p class="text-gray-700">
              If you're serious about building a cohesive brand presence, this
              tool saves you time and optimizes your message for each platform.
            </p>
          </div>
          <div>
            <p class="text-[20px] font-bold">Why should I join waitlist?</p>
            <p class="text-gray-700">
              As an early access user, you will enjoy lifetime discount to use
              the product.
            </p>
          </div>
          <div>
            <p class="text-[20px] font-bold">What about pricing?</p>
            <p class="text-gray-700">
              We are finalizing pricing and will notify you upon launch, but
              most likely it will be a credit based pricing due to high AI
              usage. You pay for what you use.
            </p>
          </div>
          <div>
            <p class="text-[20px] font-bold">Will there be a free tier?</p>
            <p class="text-gray-700">
              Yes, a basic free tier will be available to help you get started!
            </p>
          </div>
          <div>
            <p class="text-[20px] font-bold">How will my email be used?</p>
            <p class="text-gray-700">
              We will use it to notify you about major launches and releases.
            </p>
            <p class="text-gray-700">
              We may also occasionally contact you to ask for feedback and
              suggestions.
            </p>
          </div>
        </div>
      </section>

      <p class="mt-[100px] self-center">
        Don’t miss out – join the waitlist today for exclusive perks!
      </p>
      <button
        @click="handleButtonClick"
        type="submit"
        class="mt-[10px] w-[350px] self-center rounded-lg bg-[#047f58] p-2 font-semibold text-white transition hover:bg-[#047f58df]"
      >
        Join the Waitlist
      </button>

      <!-- Privacy Policy Link -->
      <footer class="privacy mt-[100px] self-center">
        <p class="privacy mt-[100px] text-xs text-gray-500">
          By joining the waitlist, you agree to our
          <a @click="router.push('/privacy')" href="#" class="underline"
            >Privacy Policy</a
          >
          on email handling.
        </p>
        <p class="privacy mt-[10px] text-xs text-gray-500">
          @ 2024 Brandcraft.art by
          <a href="https://x.com/sev_tinker" class="underline">Seva Leo</a>.
        </p>
        <p class="privacy mt-[10px] text-xs text-gray-500">
          All rights reserved.
        </p>
      </footer>
    </div>
  </main>
</template>

<style scoped>
  .waitlist-container {
    max-width: 1000px;
  }

  path {
    color: rgb(193, 0, 0);
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
