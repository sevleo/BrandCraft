<script setup>
import { ref } from "vue";
import xIcon from "@/assets/icons/x.svg";
import threadsIcon from "@/assets/icons/threads.svg";
import facebookIcon from "@/assets/icons/facebook.svg";

const getIconForPlatform = (platform) => {
  switch (platform) {
    case "X":
      return xIcon;
    case "Threads":
      return threadsIcon;
    case "Facebook":
      return facebookIcon;
    default:
      return xIcon;
  }
};

const testimonials = ref([
  {
    name: "Elitza Vasileva",
    handle: "@ElitzaVasileva",
    avatar: "/testimonials/elitza.jpg",
    tweetUrl: "https://x.com/ElitzaVasileva/status/1886736890423882099",
    content: [
      "I really like the tool that @sev_tinker created. It is Brandcraft.art",
    ],
    platform: "X",
  },
  {
    name: "Fejiro Gospel",
    handle: "@FejiroGospel",
    avatar: "/testimonials/fejiro.jpg",
    tweetUrl: "https://x.com/FejiroGospel/status/1884557362411041241",
    content: ["Good for anyone using ghostwriters and social media assistants"],
    platform: "X",
  },
  {
    name: "Pavel Noskov",
    handle: "@npv256",
    avatar: "/testimonials/pavel.jpg",
    tweetUrl: "https://x.com/npv256/status/1889183252176339139",
    content: [
      "I can plan and post all my content from one place with @brandcraftArt from @sev_tinker.",
      "It took just 5 minutes to connect all my profiles!",
    ],
    platform: "X",
  },
  {
    name: "ཏོ་ཧ་ T0ha 📷💻🔬📊⛷️",
    handle: "@T0ha666",
    avatar: "/testimonials/toha.png",
    tweetUrl: "https://x.com/T0ha666/status/1889202559073784274",
    content: [
      "It's a great solution for scheduling posts across several social media platforms like X, BSky, Mastodon, Threads and a lot more.",
      "Thank you @sev_tinker 🙏",
    ],
    platform: "X",
  },
  {
    name: "alexasoft",
    handle: "alexasoft",
    avatar: "/testimonials/alexasoft.jpg",
    tweetUrl:
      "https://www.threads.net/@alexasoft/post/DGAnf-_IsAr?xmt=AQGz_DkcWIq8-a3inqfvymeK1kmTJH4VyfqR10uqQWD8Xg",
    content: [
      "I've been using Brandcraft.art for several weeks already and it saves me a lot of time. Recommending it to anyone managing social media 🫶🏽",
    ],
    platform: "Threads",
  },
  {
    name: "Velvette Nhung Nguyen",
    handle: "velvette",
    avatar: "/testimonials/velvette.jpg",
    tweetUrl: "https://www.facebook.com/share/1ZKUNmKMqS/?mibextid=wwXIfr",
    content: [
      "That's so genuinely absolutely incredible. And it is currently being offered for free without limits.",
    ],
    platform: "Facebook",
  },
]);
</script>

<template>
  <section class="mx-auto mt-[150px] max-w-7xl px-4 sm:px-6 lg:px-8">
    <h2 class="text-center text-[32px] font-bold tracking-tight text-gray-900">
      See what others say
    </h2>
    <p class="mb-[60px] text-center text-[18px] text-gray-600">
      What people are saying about BrandCraft
    </p>
    <div
      class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 place-items-center"
    >
      <div
        v-for="testimonial in testimonials"
        :key="testimonial.handle"
        class="flex flex-col gap-4 rounded-lg bg-white p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300 max-w-[320px]"
      >
        <div class="flex items-start gap-2">
          <img
            :src="getIconForPlatform(testimonial.platform)"
            :alt="testimonial.platform"
            class="h-5 w-5 text-[#2E53DA]"
          />
          <p
            class="whitespace-pre-line text-[15px] text-gray-700 leading-relaxed"
          >
            <template v-for="(line, index) in testimonial.content" :key="index">
              {{ line }}
              <br v-if="index < testimonial.content.length - 1" />
            </template>
          </p>
        </div>

        <div
          class="flex items-center gap-3 mt-auto pt-4 border-t border-gray-100"
        >
          <img
            :src="testimonial.avatar"
            :alt="testimonial.name"
            class="h-10 w-10 rounded-full object-cover"
          />
          <div class="flex-1">
            <h3 class="font-semibold text-gray-900 text-sm">
              {{ testimonial.name }}
            </h3>
            <p class="text-sm text-gray-500">{{ testimonial.handle }}</p>
          </div>
          <a
            :href="testimonial.tweetUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="text-[#2E53DA] hover:text-[#1E3BB8] transition-colors duration-200"
          >
            View
          </a>
        </div>
      </div>
    </div>
  </section>
</template>
