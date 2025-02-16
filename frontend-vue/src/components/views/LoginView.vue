<script setup lang="ts">
  import AuthForm from '../common/forms/AuthForm.vue';
  import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
  import birdLogoFullGreenBlack from '/bird_logo_full_green_black.svg';

  const redirectToHome = () => {
    window.location.href = import.meta.env.VITE_FRONTEND_NUXT_URL;
  };
</script>

<template>
  <div class="flex min-h-screen">
    <!-- Left Section - Login Form -->
    <div
      class="flex w-1/3 flex-col items-center justify-start bg-white px-4 max-lg:w-full max-lg:px-8"
    >
      <!-- Logo -->
      <div
        class="flex h-[64px] w-full cursor-pointer items-center justify-center self-start text-xl font-bold text-gray-800 lg:justify-start"
        @click="redirectToHome"
      >
        <img
          :src="birdLogoFullGreenBlack"
          alt="BrandCraft Logo"
          class="h-[40px]"
        />
      </div>

      <div class="mb-auto w-full max-w-md lg:my-auto">
        <h1
          class="mb-8 mt-6 px-6 text-center text-3xl font-medium text-gray-800 lg:text-left"
        >
          Log In
        </h1>
        <AuthForm mode="login" />
      </div>
    </div>

    <!-- Right Section - Benefits -->
    <div
      class="flex w-1/2 flex-1 flex-col justify-center bg-blue-50 px-12 text-gray-900 max-lg:hidden"
    >
      <div class="mx-auto max-w-[500px]">
        <h2 class="mb-8 text-4xl font-bold text-gray-900">
          Streamline Your Social Media Management
        </h2>

        <div class="space-y-8">
          <div class="flex items-start gap-6">
            <div
              class="flex items-center justify-center rounded-full bg-blue-100 p-3"
            >
              <font-awesome-icon
                :icon="['fas', 'rocket']"
                class="h-6 w-6 text-blue-600"
              />
            </div>
            <div>
              <h3 class="text-xl font-semibold text-gray-900">
                Save Time with Mass Posting
              </h3>
              <p class="text-gray-900">
                Create and manage posts for multiple platforms simultaneously.
                Reduce repetitive work and focus on creating great content.
              </p>
            </div>
          </div>

          <div class="flex items-start gap-6">
            <div
              class="flex items-center justify-center rounded-full bg-blue-100 p-3"
            >
              <font-awesome-icon
                :icon="['fas', 'calendar']"
                class="h-6 w-6 text-blue-600"
              />
            </div>
            <div>
              <h3 class="text-xl font-semibold text-gray-900">
                Maintain Consistent Presence
              </h3>
              <p class="text-gray-900">
                Schedule your posts in advance to maintain a regular posting
                schedule. Keep your audience engaged with timely, consistent
                content.
              </p>
            </div>
          </div>

          <div class="flex items-start gap-6">
            <div
              class="flex items-center justify-center rounded-full bg-blue-100 p-3"
            >
              <font-awesome-icon
                :icon="['fas', 'share-nodes']"
                class="h-6 w-6 text-blue-600"
              />
            </div>
            <div>
              <h3 class="text-xl font-semibold text-gray-900">
                Expand Your Reach
              </h3>
              <p class="text-gray-900">
                Effortlessly manage multiple social media platforms from one
                place. Reach a broader audience while maintaining your unique
                voice across platforms.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
