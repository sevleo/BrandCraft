<script setup>
import HomeNavigation from "~/components/HomeNavigation.vue";
import FooterSection from "~/components/FooterSection.vue";
import FeaturesGrid from "~/components/FeaturesGrid.vue";
import { commonFeatures } from '@/config/features';
import { redirectToSignup } from "@/utils/redirects";
import { generateOrganizationLD, generateSoftwareApplicationLD, defaultOrganization, defaultSoftwareApplication } from '@/utils/jsonld';

definePageMeta({
  title: "Threads Management - BrandCraft",
  description:
    "Manage your Threads content and grow your audience with BrandCraft",
});

useHead({
  title: "Threads Management Platform | Schedule & Analyze Posts | BrandCraft",
  meta: [
    {
      name: "description",
      content:
        "Streamline your Threads content management with BrandCraft. Plan content, schedule posts, analyze performance, and grow your following with our Threads management tools.",
    },
    {
      name: "keywords",
      content:
        "threads management, threads scheduler, threads analytics, social media management, threads marketing, content planning",
    },
    {
      property: "og:title",
      content: "Threads Management Platform | Schedule & Analyze Posts | BrandCraft",
    },
    {
      property: "og:description",
      content:
        "Streamline your Threads content management with BrandCraft. Plan content, schedule posts, analyze performance, and grow your following with our Threads management tools.",
    },
    {
      property: "og:url",
      content: "https://brandcraft.art/threads",
    },
    { property: "og:type", content: "website" },
    { name: "robots", content: "index, follow" },
  ],
  link: [
    {
      rel: "canonical",
      href: "https://brandcraft.art/threads",
    },
  ],
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify([
        generateOrganizationLD(defaultOrganization),
        generateSoftwareApplicationLD({
          ...defaultSoftwareApplication,
          name: 'BrandCraft - Threads Management Platform',
          description: 'Professional Threads management platform for scheduling posts, analyzing performance, and growing your audience.',
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
      class="mt-[64px] py-6 h-[200px] flex justify-center items-center bg-black"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <h1
            class="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl"
          >
            Threads Management
          </h1>
          <p class="mt-3 max-w-2xl mx-auto text-xl text-gray-100 sm:mt-4">
            Create engaging threads and grow your community
          </p>
        </div>
      </div>
    </div>

    <!-- Features Grid -->
    <FeaturesGrid 
      :features="commonFeatures"
      iconBgColor="bg-gray-100"
      iconColor="text-gray-900"
    />

    <!-- Call to Action -->
    <div class="bg-white">
      <div class="max-w-7xl mx-auto text-center py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
        <h2 class="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          Ready to enhance your Threads presence?
        </h2>
        <p class="mt-4 text-lg text-gray-500">
          Join the conversation with BrandCraft's Threads management tools.
        </p>
        <div class="mt-8">
          <a
            href="#"
            @click.prevent="redirectToSignup()"
            class="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-black hover:bg-gray-900"
          >
            Get Started
          </a>
        </div>
      </div>
    </div>
  </div>
  <FooterSection />
</template>
