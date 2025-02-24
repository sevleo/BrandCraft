<script setup>
import HomeNavigation from "~/components/HomeNavigation.vue";
import FooterSection from "~/components/FooterSection.vue";
import FeaturesGrid from "~/components/FeaturesGrid.vue";
import { commonFeatures } from '@/config/features';
import { redirectToSignup } from "@/utils/redirects";
import { generateOrganizationLD, generateSoftwareApplicationLD, defaultOrganization, defaultSoftwareApplication } from '@/utils/jsonld';

definePageMeta({
  title: "Bluesky Management - BrandCraft",
  description:
    "Manage your Bluesky presence and engage with the decentralized social network",
});

useHead({
  title: "Bluesky Management Platform | Schedule & Analyze Posts | BrandCraft",
  meta: [
    {
      name: "description",
      content:
        "Streamline your Bluesky content management with BrandCraft. Plan content, schedule posts, analyze performance, and grow your following with our Bluesky management tools.",
    },
    {
      name: "keywords",
      content:
        "bluesky management, bluesky scheduler, bluesky analytics, social media management, bluesky marketing, content planning, decentralized social",
    },
    {
      property: "og:title",
      content: "Bluesky Management Platform | Schedule & Analyze Posts | BrandCraft",
    },
    {
      property: "og:description",
      content:
        "Streamline your Bluesky content management with BrandCraft. Plan content, schedule posts, analyze performance, and grow your following with our Bluesky management tools.",
    },
    {
      property: "og:url",
      content: "https://brandcraft.art/bluesky",
    },
    { property: "og:type", content: "website" },
    { name: "robots", content: "index, follow" },
  ],
  link: [
    {
      rel: "canonical",
      href: "https://brandcraft.art/bluesky",
    },
  ],
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify([
        generateOrganizationLD(defaultOrganization),
        generateSoftwareApplicationLD({
          ...defaultSoftwareApplication,
          name: 'BrandCraft - Bluesky Management Platform',
          description: 'Professional Bluesky management platform for scheduling posts, analyzing performance, and growing your following.',
          applicationCategory: 'SocialNetworkingApplication,BusinessApplication'
        })
      ])
    }
  ]
});
</script>

<template>
  <HomeNavigation />
  <div class="min-h-screen bg-gray-50">
    <!-- Header Section -->
    <div
      class="mt-[64px] py-6 h-[200px] flex justify-center items-center bg-gradient-to-r from-sky-400 to-blue-500"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <h1
            class="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl"
          >
            Bluesky Management
          </h1>
          <p class="mt-3 max-w-2xl mx-auto text-xl text-gray-100 sm:mt-4">
            Grow your presence on the decentralized network
          </p>
        </div>
      </div>
    </div>

    <!-- Features Grid -->
    <FeaturesGrid 
      :features="commonFeatures"
      iconBgColor="bg-sky-100"
      iconColor="text-sky-600"
    />

    <!-- Call to Action -->
    <div class="bg-white">
      <div class="max-w-7xl mx-auto text-center py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
        <h2 class="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          Ready to join the decentralized social network?
        </h2>
        <p class="mt-4 text-lg text-gray-500">
          Start managing your Bluesky presence with BrandCraft's powerful tools.
        </p>
        <div class="mt-8">
          <a
            href="#"
            @click.prevent="redirectToSignup()"
            class="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-sky-500 hover:bg-sky-600"
          >
            Get Started
          </a>
        </div>
      </div>
    </div>
  </div>
  <FooterSection />
</template>
