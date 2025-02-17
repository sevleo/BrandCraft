<script setup>
import HomeNavigation from "~/components/HomeNavigation.vue";
import FooterSection from "~/components/FooterSection.vue";
import FeaturesGrid from "~/components/FeaturesGrid.vue";
import { commonFeatures } from "@/config/features";
import { redirectToSignup } from "@/utils/redirects";

definePageMeta({
  title: "TikTok Management - BrandCraft",
  description:
    "Create and schedule viral TikTok content with BrandCraft's advanced tools",
});
</script>

<template>
  <HomeNavigation />
  <div class="min-h-screen bg-gray-50">
    <!-- Header Section -->
    <div
      class="mt-[64px] py-6 h-[200px] flex justify-center items-center bg-gradient-to-r from-[#00f2ea] via-[#ff0050] to-black"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <h1
            class="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl"
          >
            TikTok Management
          </h1>
          <p class="mt-3 max-w-2xl mx-auto text-xl text-gray-100 sm:mt-4">
            Create and schedule viral content with ease
          </p>
        </div>
      </div>
    </div>

    <!-- Features Grid -->
    <FeaturesGrid
      :features="commonFeatures"
      iconBgColor="bg-cyan-100"
      iconColor="text-[#ff0050]"
    />

    <!-- Call to Action -->
    <div class="bg-white">
      <div
        class="max-w-7xl mx-auto text-center py-12 px-4 sm:px-6 lg:py-16 lg:px-8"
      >
        <h2
          class="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl"
        >
          Ready to go viral on TikTok?
        </h2>
        <p class="mt-4 text-lg text-gray-500">
          Join the creators using BrandCraft to manage their TikTok content
          strategy.
        </p>
        <div class="mt-8">
          <a
            href="#"
            @click.prevent="redirectToSignup()"
            class="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#ff0050] hover:bg-[#ff0050]/90"
          >
            Get Started
          </a>
        </div>
      </div>
    </div>
  </div>
  <FooterSection />
</template>
