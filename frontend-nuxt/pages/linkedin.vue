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
  title: "LinkedIn Management - BrandCraft",
  description:
    "Manage your LinkedIn pages and content with BrandCraft's comprehensive tools",
});

useHead({
  title: "LinkedIn Management Platform | Schedule & Analyze Posts | BrandCraft",
  meta: [
    {
      name: "description",
      content:
        "Streamline your LinkedIn content management with BrandCraft. Plan content, schedule posts, analyze performance, and grow your following with our LinkedIn management tools.",
    },
    {
      name: "keywords",
      content:
        "LinkedIn management, LinkedIn scheduler, LinkedIn analytics, social media management, LinkedIn marketing, content planning, meta platforms",
    },
    {
      property: "og:title",
      content:
        "LinkedIn Management Platform | Schedule & Analyze Posts | BrandCraft",
    },
    {
      property: "og:description",
      content:
        "Streamline your LinkedIn content management with BrandCraft. Plan content, schedule posts, analyze performance, and grow your following with our LinkedIn management tools.",
    },
    {
      property: "og:url",
      content: "https://brandcraft.art/LinkedIn",
    },
    { property: "og:type", content: "website" },
    { name: "robots", content: "index, follow" },
  ],
  link: [
    {
      rel: "canonical",
      href: "https://brandcraft.art/LinkedIn",
    },
  ],
  script: [
    {
      type: "application/ld+json",
      children: JSON.stringify([
        generateOrganizationLD(defaultOrganization),
        generateSoftwareApplicationLD({
          ...defaultSoftwareApplication,
          name: "BrandCraft - LinkedIn Management Platform",
          description:
            "Professional LinkedIn management platform for scheduling posts, analyzing performance, and growing your audience.",
          applicationCategory:
            "SocialNetworkingApplication,BusinessApplication",
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
      class="mt-[64px] py-6 h-[200px] flex justify-center items-center bg-[#1877f2]"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <h1
            class="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl"
          >
            LinkedIn Management
          </h1>
          <p class="mt-3 max-w-2xl mx-auto text-xl text-gray-100 sm:mt-4">
            Manage your pages and grow your audience
          </p>
        </div>
      </div>
    </div>

    <!-- Features Grid -->
    <FeaturesGrid
      :features="commonFeatures"
      iconBgColor="bg-blue-100"
      iconColor="text-[#1877f2]"
    />

    <!-- Call to Action -->
    <div class="bg-white">
      <div
        class="max-w-7xl mx-auto text-center py-12 px-4 sm:px-6 lg:py-16 lg:px-8"
      >
        <h2
          class="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl"
        >
          Ready to enhance your LinkedIn presence?
        </h2>
        <p class="mt-4 text-lg text-gray-500">
          Join businesses using BrandCraft to manage their LinkedIn content
          strategy.
        </p>
        <div class="mt-8">
          <a
            href="#"
            @click.prevent="redirectToSignup()"
            class="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#1877f2] hover:bg-[#1877f2]/90"
          >
            Get Started
          </a>
        </div>
      </div>
    </div>
  </div>
  <FooterSection />
</template>
