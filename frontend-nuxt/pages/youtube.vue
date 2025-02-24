<script setup>
import HomeNavigation from "~/components/HomeNavigation.vue";
import FooterSection from "~/components/FooterSection.vue";
import FeaturesGrid from "~/components/FeaturesGrid.vue";
import { commonFeatures } from '@/config/features';
import { redirectToSignup } from "@/utils/redirects";

definePageMeta({
  title: "YouTube Management - BrandCraft",
  description:
    "Manage your YouTube content and grow your channel with BrandCraft's powerful tools",
});

useHead({
  title: "YouTube Channel Management | Content Strategy & Analytics | BrandCraft",
  meta: [
    {
      name: "description",
      content:
        "Optimize your YouTube channel with BrandCraft. Plan video content, schedule uploads, track analytics, and grow your subscriber base with our YouTube management tools.",
    },
    {
      name: "keywords",
      content:
        "youtube management, youtube scheduler, youtube analytics, video content management, youtube marketing, channel growth, video SEO",
    },
    {
      property: "og:title",
      content: "YouTube Channel Management | Content Strategy & Analytics | BrandCraft",
    },
    {
      property: "og:description",
      content:
        "Optimize your YouTube channel with BrandCraft. Plan video content, schedule uploads, track analytics, and grow your subscriber base with our YouTube management tools.",
    },
    {
      property: "og:url",
      content: "https://brandcraft.art/youtube",
    },
    { property: "og:type", content: "website" },
    { name: "robots", content: "index, follow" },
  ],
  link: [
    {
      rel: "canonical",
      href: "https://brandcraft.art/youtube",
    },
  ],
});
</script>

<template>
  <HomeNavigation />
  <div class="min-h-screen bg-gray-50">
    <!-- Header Section -->
    <div
      class="mt-[64px] py-6 h-[200px] flex justify-center items-center bg-gradient-to-r from-red-600 to-red-700"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <h1
            class="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl"
          >
            YouTube Management
          </h1>
          <p class="mt-3 max-w-2xl mx-auto text-xl text-gray-100 sm:mt-4">
            Schedule videos and grow your channel
          </p>
        </div>
      </div>
    </div>

    <!-- Features Grid -->
    <FeaturesGrid 
      :features="commonFeatures"
      iconBgColor="bg-red-100"
      iconColor="text-red-600"
    />

    <!-- Call to Action -->
    <div class="bg-white">
      <div class="max-w-7xl mx-auto text-center py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
        <h2 class="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          Ready to grow your YouTube channel?
        </h2>
        <p class="mt-4 text-lg text-gray-500">
          Join content creators using BrandCraft to manage their YouTube presence.
        </p>
        <div class="mt-8">
          <a
            href="#"
            @click.prevent="redirectToSignup()"
            class="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
          >
            Get Started
          </a>
        </div>
      </div>
    </div>
  </div>
  <FooterSection />
</template>
