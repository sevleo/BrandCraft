<script setup>
import HomeNavigation from "~/components/HomeNavigation.vue";
import FooterSection from "~/components/FooterSection.vue";
import FeaturesGrid from "~/components/FeaturesGrid.vue";
import { commonFeatures } from "@/config/features";
import { redirectToSignup } from "@/utils/redirects";
import {
  generateOrganizationLD,
  generateSoftwareApplicationLD,
  defaultOrganization,
  defaultSoftwareApplication,
} from "@/utils/jsonld";

definePageMeta({
  title: "YouTube Management - BrandCraft",
  description:
    "Manage your YouTube content and grow your channel with BrandCraft's powerful tools",
});

useHead({
  title: "YouTube Management Platform | Schedule & Analyze Videos | BrandCraft",
  meta: [
    {
      name: "description",
      content:
        "Streamline your YouTube content management with BrandCraft. Plan content, schedule videos, analyze performance, and grow your channel with our YouTube management tools.",
    },
    {
      name: "keywords",
      content:
        "youtube management, youtube scheduler, youtube analytics, video management, youtube marketing, content planning, video optimization",
    },
    {
      property: "og:title",
      content:
        "YouTube Management Platform | Schedule & Analyze Videos | BrandCraft",
    },
    {
      property: "og:description",
      content:
        "Streamline your YouTube content management with BrandCraft. Plan content, schedule videos, analyze performance, and grow your channel with our YouTube management tools.",
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
  script: [
    {
      type: "application/ld+json",
      children: JSON.stringify([
        generateOrganizationLD(defaultOrganization),
        generateSoftwareApplicationLD({
          ...defaultSoftwareApplication,
          name: "BrandCraft - YouTube Management Platform",
          description:
            "Professional YouTube management platform for scheduling videos, analyzing performance, and growing your channel.",
          applicationCategory:
            "SocialNetworkingApplication,BusinessApplication,VideoApplication",
        }),
      ]),
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
      <div
        class="max-w-7xl mx-auto text-center py-12 px-4 sm:px-6 lg:py-16 lg:px-8"
      >
        <h2
          class="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl"
        >
          Ready to grow your YouTube channel?
        </h2>
        <p class="mt-4 text-lg text-gray-500">
          Join content creators using BrandCraft to manage their YouTube
          presence.
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
