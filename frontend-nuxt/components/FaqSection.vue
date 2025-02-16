<script setup lang="ts">
import { ref } from "vue";
import { ChevronDown } from "lucide-vue-next";

// FAQ state management
const openQuestions = ref<number[]>([]);
const toggleQuestion = (index: number) => {
  const position = openQuestions.value.indexOf(index);
  if (position === -1) {
    openQuestions.value.push(index);
  } else {
    openQuestions.value.splice(position, 1);
  }
};
</script>

<template>
  <section aria-labelledby="faq" class="w-full mt-[150px] mb-[100px]">
    <h2
      class="text-center text-[40px] font-semibold tracking-tight leading-[1.2] mb-[60px]"
    >
      Frequently Asked Questions
    </h2>
    <div class="max-w-[800px] mx-auto space-y-6">
      <!-- Question 5 -->
      <div
        class="border cursor-pointer border-gray-200 hover:border-gray-400 transition-colors duration-300 rounded-lg overflow-hidden flex flex-col"
        @click="toggleQuestion(4)"
      >
        <button class="w-full cursor-pointer p-6 text-left flex justify-between items-center">
          <h3 class="text-xl font-medium">Is it really free?</h3>
          <ChevronDown
            class="transform transition-transform duration-300 w-6 h-6"
            :class="{ 'rotate-180': openQuestions.includes(4) }"
          />
        </button>

        <!-- Pure CSS transition using max-height -->
        <div
          class="faq-content px-6 flex justify-center items-center overflow-hidden transition-all duration-300 ease-in-out"
          :class="openQuestions.includes(4) ? 'h-[100px] ' : 'h-[0px] '"
        >
          <p class="text-gray-600 text-start">
            Yes! It's totally free. You can use all functionality without
            limitations. At some point however we will add paid plans for
            extra features: AI Assistance and Video Editing.
          </p>
        </div>
      </div>

      <!-- Question 1 -->
      <div
        class="border cursor-pointer border-gray-200 hover:border-gray-400 transition-colors duration-300 rounded-lg overflow-hidden flex flex-col"
        @click="toggleQuestion(0)"
      >
        <button class="w-full cursor-pointer p-6 text-left flex justify-between items-center">
          <h3 class="text-xl font-medium">
            What platforms does BrandCraft support?
          </h3>
          <ChevronDown
            class="transform transition-transform duration-300 w-6 h-6"
            :class="{ 'rotate-180': openQuestions.includes(0) }"
          />
        </button>

        <!-- Pure CSS transition using max-height -->
        <div
          class="faq-content px-6 flex justify-center items-center overflow-hidden transition-all duration-300 ease-in-out"
          :class="openQuestions.includes(0) ? 'h-[120px] ' : 'h-[0px] '"
        >
          <p class="text-gray-600 text-start">
            BrandCraft supports all major social media platforms including
            Instagram, TikTok, YouTube, Facebook, Threads, Bluesky, X
            (Twitter), and Mastodon. We're constantly adding support for new
            platforms. To request a specific platform be added, please send an
            email to
            <a href="mailto:support@brandcraft.com" class="text-blue-500 hover:underline"
              >sev@brandcraft.com</a
            >, or
            <a
              href="https://insigh.to/b/brandcraftart"
              class="text-blue-500 hover:underline"
              >request a feature here</a
            >.
          </p>
        </div>
      </div>

      <!-- Question 2 -->
      <div
        class="border cursor-pointer border-gray-200 hover:border-gray-400 transition-colors duration-300 rounded-lg overflow-hidden flex flex-col"
        @click="toggleQuestion(1)"
      >
        <button class="w-full cursor-pointer p-6 text-left flex justify-between items-center">
          <h3 class="text-xl font-medium">
            Is there a limit to how many posts I can schedule?
          </h3>
          <ChevronDown
            class="transform transition-transform duration-300 w-6 h-6"
            :class="{ 'rotate-180': openQuestions.includes(1) }"
          />
        </button>

        <!-- Pure CSS transition using max-height -->
        <div
          class="faq-content px-6 flex justify-center items-center overflow-hidden transition-all duration-300 ease-in-out"
          :class="openQuestions.includes(1) ? 'h-[80px] ' : 'h-[0px] '"
        >
          <p class="text-gray-600 text-start">
            No, there's no limit to the number of posts you can schedule.
            Our platform is designed to handle your content needs, whether
            you're posting once a day or multiple times across different
            platforms.
          </p>
        </div>
      </div>

      <!-- Question 3 -->
      <div
        class="border cursor-pointer border-gray-200 hover:border-gray-400 transition-colors duration-300 rounded-lg overflow-hidden flex flex-col"
        @click="toggleQuestion(2)"
      >
        <button class="w-full cursor-pointer p-6 text-left flex justify-between items-center">
          <h3 class="text-xl font-medium">Can I manage multiple accounts?</h3>
          <ChevronDown
            class="transform transition-transform duration-300 w-6 h-6"
            :class="{ 'rotate-180': openQuestions.includes(2) }"
          />
        </button>

        <!-- Pure CSS transition using max-height -->
        <div
          class="faq-content px-6 flex justify-center items-center overflow-hidden transition-all duration-300 ease-in-out"
          :class="openQuestions.includes(2) ? 'h-[80px] ' : 'h-[0px] '"
        >
          <p class="text-gray-600 text-start">
            Yes! You can manage multiple accounts across different platforms
            from a single dashboard. This makes it easy to maintain
            consistent branding and messaging across all your social media
            presence.
          </p>
        </div>
      </div>

      <!-- Question 4 -->
      <div
        class="border cursor-pointer border-gray-200 hover:border-gray-400 transition-colors duration-300 rounded-lg overflow-hidden flex flex-col"
        @click="toggleQuestion(3)"
      >
        <button class="w-full cursor-pointer p-6 text-left flex justify-between items-center">
          <h3 class="text-xl font-medium">
            How far in advance can I schedule posts?
          </h3>
          <ChevronDown
            class="transform transition-transform duration-300 w-6 h-6"
            :class="{ 'rotate-180': openQuestions.includes(3) }"
          />
        </button>

        <!-- Pure CSS transition using max-height -->
        <div
          class="faq-content px-6 flex justify-center items-center overflow-hidden transition-all duration-300 ease-in-out"
          :class="openQuestions.includes(3) ? 'h-[80px] ' : 'h-[0px] '"
        >
          <p class="text-gray-600 text-start">
            You can schedule posts as far in advance as you'd like. Many of
            our users plan their content weeks or months ahead to maintain a
            consistent posting schedule.
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
