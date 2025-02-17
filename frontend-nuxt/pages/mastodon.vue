<script setup>
import HomeNavigation from "~/components/HomeNavigation.vue";
import FooterSection from "~/components/FooterSection.vue";
import FeaturesGrid from "~/components/FeaturesGrid.vue";
import { commonFeatures } from '@/config/features';
import { redirectToSignup } from "@/utils/redirects";

definePageMeta({
  title: "Mastodon Management - BrandCraft",
  description:
    "Manage your Mastodon presence and engage with the federated social network",
});
</script>

<template>
  <HomeNavigation />
  <div class="min-h-screen bg-gray-50">
    <!-- Header Section -->
    <div
      class="mt-[64px] py-6 h-[200px] flex justify-center items-center bg-[#6364FF]"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <h1
            class="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl"
          >
            Mastodon Management
          </h1>
          <p class="mt-3 max-w-2xl mx-auto text-xl text-gray-100 sm:mt-4">
            Connect with the federated social network
          </p>
        </div>
      </div>
    </div>

    <!-- Features Grid -->
    <FeaturesGrid 
      :features="commonFeatures"
      iconBgColor="bg-indigo-100"
      iconColor="text-[#6364FF]"
    />

    <!-- Call to Action -->
    <div class="bg-white">
      <div class="max-w-7xl mx-auto text-center py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
        <h2 class="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          Ready to join the federated social network?
        </h2>
        <p class="mt-4 text-lg text-gray-500">
          Start managing your Mastodon presence with BrandCraft's powerful tools.
        </p>
        <div class="mt-8">
          <a
            href="#"
            @click.prevent="redirectToSignup()"
            class="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#6364FF] hover:bg-[#6364FF]/90"
          >
            Get Started
          </a>
        </div>
      </div>
    </div>
  </div>
  <FooterSection />
</template>
