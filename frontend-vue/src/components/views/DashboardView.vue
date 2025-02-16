<script setup lang="ts">
  import { onMounted } from 'vue';
  import { useRouter, useRoute } from 'vue-router';
  import { handleTwitterCallback } from '@/api/twitterApi';
  import connectionsDataStore from '@/utils/connectionsDataStore';
  import { useThemeStore } from '@/utils/themeStore';

  const themeStore = useThemeStore();

  const router = useRouter();
  const route = useRoute();

  onMounted(async () => {
    // Navigate to the desired page
    themeStore.initializeTheme();
    router.push('/dashboard/brands');
    // Extract query parameters

    const oauth_token = route.query.oauth_token as string | undefined;
    const oauth_verifier = route.query.oauth_verifier as string | undefined;
    const state = localStorage.getItem('xLoginState');
    const x_oauth_token_secret = localStorage.getItem('xoats');

    if (oauth_token && oauth_verifier) {
      await handleTwitterCallback(
        oauth_token,
        oauth_verifier,
        state as string,
        x_oauth_token_secret as string
      );

      await connectionsDataStore.getAllAccounts();
    }
  });
</script>

<template></template>
