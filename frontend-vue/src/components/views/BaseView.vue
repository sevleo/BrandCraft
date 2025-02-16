<script setup lang="ts">
  import { onMounted } from 'vue';
  import { useRouter } from 'vue-router';
  import authData from '../../utils/authDataStore';

  const router = useRouter();

  onMounted(async () => {
    const urlParams = new URLSearchParams(window.location.search);
    let accessToken = urlParams.get('accessToken');
    let refreshToken = urlParams.get('refreshToken');

    if (!accessToken || !refreshToken) {
      console.log('No tokens found in URL');
      accessToken = localStorage.getItem('accessToken');
      refreshToken = localStorage.getItem('refreshToken');
    }

    if (accessToken && refreshToken) {
      // Store tokens securely
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      // Remove tokens from URL for cleaner look
      window.history.replaceState({}, document.title, window.location.pathname);
      authData.signedIn.value = true;
      router.push('/dashboard');
      return;
    } else {
      // router.push('/home');
      window.location.href = `${import.meta.env.VITE_FRONTEND_NUXT_URL}`;
    }
  });
</script>

<template></template>

<style scoped></style>
