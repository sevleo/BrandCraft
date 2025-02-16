<script setup lang="ts">
  import SummaryCard from '@/components/views/DashboardViews/BrandsView/PlatformCards/SummaryCard.vue';
  import TwitterCard from '@/components/views/DashboardViews/BrandsView/PlatformCards/TwitterCard.vue';
  import ThreadsCard from '@/components/views/DashboardViews/BrandsView/PlatformCards/ThreadsCard.vue';
  import BlueskyCard from '@/components/views/DashboardViews/BrandsView/PlatformCards/BlueskyCard.vue';
  import TikTokCard from '@/components/views/DashboardViews/BrandsView/PlatformCards/TiktokCard.vue';
  import YoutubeCard from '@/components/views/DashboardViews/BrandsView/PlatformCards/YoutubeCard.vue';
  import InstagramCard from '@/components/views/DashboardViews/BrandsView/PlatformCards/InstagramCard.vue';
  import MastodonCard from '@/components/views/DashboardViews/BrandsView/PlatformCards/MastodonCard.vue';
  import FacebookCard from '@/components/views/DashboardViews/BrandsView/PlatformCards/FacebookCard.vue';

  defineProps<{
    type:
      | 'twitter'
      | 'threads'
      | 'bluesky'
      | 'tiktok'
      | 'instagram'
      | 'youtube'
      | 'mastodon'
      | 'summary'
      | 'facebook';
  }>();
</script>

<template>
  <Transition name="fade" mode="out-in">
    <div
      :key="type"
      class="custom-shadow w-full rounded-xl bg-white p-8 dark:bg-[#121212]"
    >
      <div v-if="type === 'twitter'" class="w-full max-w-2xl">
        <TwitterCard />
      </div>

      <div v-else-if="type === 'threads'" class="w-full max-w-2xl">
        <ThreadsCard />
      </div>

      <div v-else-if="type === 'bluesky'" class="w-full max-w-2xl">
        <BlueskyCard />
      </div>

      <div v-else-if="type === 'tiktok'" class="w-full max-w-2xl">
        <TikTokCard />
      </div>

      <div v-else-if="type === 'instagram'" class="w-full max-w-2xl">
        <InstagramCard />
      </div>

      <div v-else-if="type === 'facebook'" class="w-full max-w-2xl">
        <FacebookCard />
      </div>

      <div v-else-if="type === 'youtube'" class="w-full max-w-2xl">
        <YoutubeCard />
      </div>

      <div v-else-if="type === 'mastodon'" class="w-full max-w-2xl">
        <MastodonCard />
      </div>

      <div v-else-if="type === 'summary'" class="w-full max-w-2xl">
        <SummaryCard />
      </div>
    </div>
  </Transition>
</template>

<style scoped>
  .fade-enter-active,
  .fade-leave-active {
    transition: all 0.1s ease-in-out;
  }

  .fade-enter-from {
    opacity: 0;
    /* transform: translateX(100px); */
  }

  .fade-leave-to {
    opacity: 0;
    /* transform: translateX(100px); */
  }

  .custom-shadow {
    box-shadow: 0px 0px 4px 1px rgba(0, 0, 0, 0.1);
  }

  .dark .custom-shadow {
    box-shadow: 0px 0px 4px 1px rgba(255, 255, 255, 0.1);
  }
</style>
