<script setup lang="ts">
  import { onMounted } from 'vue';
  import DashboardNavigation from '../../layout/DashboardNavigation.vue';

  onMounted(async () => {
    // Check if user is already logged in
    // If yes, redirect to dashboard
  });
</script>

<template>
  <DashboardNavigation />
  <main
    class="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6"
  >
    engage
  </main>
</template>

<style scoped></style>
