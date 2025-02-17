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
    <h2 class="text-center text-[32px] font-bold tracking-tight text-gray-900">
      Frequently Asked Questions
    </h2>
    <p class="text-center text-gray-600 text-lg mb-[60px]">
      Everything you need to know about BrandCraft
    </p>
    <div class="max-w-[800px] mx-auto space-y-4 px-3 lg:px-0">
      <div
        v-for="(question, index) in [4, 0, 1, 2, 3]"
        :key="question"
        class="group bg-white cursor-pointer rounded-xl border border-gray-200 overflow-hidden transition-all duration-200 hover:border-emerald-500 hover:shadow-md"
        @click="toggleQuestion(question)"
      >
        <button
          class="w-full cursor-pointer p-6 text-left flex justify-between items-center group-hover:text-emerald-600"
        >
          <h3
            class="text-[17px] font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors duration-200"
          >
            {{
              [
                "Is it really free?",
                "What platforms does BrandCraft support?",
                "Is there a limit to how many posts I can schedule?",
                "Can I manage multiple accounts?",
                "How far in advance can I schedule posts?",
              ][index]
            }}
          </h3>
          <ChevronDown
            class="transform transition-transform duration-200 w-5 h-5 text-gray-400 group-hover:text-emerald-500"
            :class="{ 'rotate-180': openQuestions.includes(question) }"
          />
        </button>

        <div
          class="overflow-hidden cursor-pointer transition-all duration-200 ease-in-out"
          :class="
            openQuestions.includes(question) ? 'max-h-[300px] pb-6' : 'max-h-0'
          "
        >
          <div class="px-6">
            <p class="text-gray-600 text-[15px] leading-relaxed">
              <span v-if="question === 4">
                Yes! It's totally free. You can use all functionality without
                limitations. At some point however we will add paid plans for
                extra features: AI Assistance and Video Editing.
              </span>
              <span v-if="question === 0">
                BrandCraft supports all major social media platforms including
                Instagram, TikTok, YouTube, Facebook, Threads, Bluesky, X
                (Twitter), and Mastodon. We're constantly adding support for new
                platforms. To request a specific platform be added, please send
                an email to
                <a
                  href="mailto:support@brandcraft.com"
                  class="text-emerald-600 hover:text-emerald-700 font-medium"
                  >sev@brandcraft.com</a
                >, or
                <a
                  href="https://insigh.to/b/brandcraftart"
                  class="text-emerald-600 hover:text-emerald-700 font-medium"
                  >request a feature here</a
                >.
              </span>
              <span v-if="question === 1">
                No, there's no limit to the number of posts you can schedule.
                Our platform is designed to handle your content needs, whether
                you're posting once a day or multiple times across different
                platforms.
              </span>
              <span v-if="question === 2">
                Yes! You can manage multiple accounts across different platforms
                from a single dashboard. This makes it easy to maintain
                consistent branding and messaging across all your social media
                presence.
              </span>
              <span v-if="question === 3">
                You can schedule posts as far in advance as you'd like. Many of
                our users plan their content weeks or months ahead to maintain a
                consistent posting schedule.
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
