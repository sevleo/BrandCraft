<script setup lang="ts">
  import { RouterView } from 'vue-router';
  import Toast from 'primevue/toast';
  import { onMounted } from 'vue';
  // import { useThemeStore } from '@/utils/themeStore';

  // const themeStore = useThemeStore();

  onMounted(() => {
    // themeStore.initializeTheme();
  });
</script>

<template>
  <Toast />
  <!-- <transition name="fade" mode="out-in"> -->
  <RouterView />
  <!-- </transition> -->
</template>

<style scoped>
  /* Navigation styles */
  nav ul {
    list-style: none;
    padding: 0;
  }

  nav li {
    display: inline;
    margin-right: 1em;
  }
</style>

<style>
  /* Transition styles */
  .fade-enter-from {
    opacity: 0;
  }

  .fade-enter-active {
    opacity: 0;
    animation: movingIn 0.3s;
  }

  .fade-leave-active {
    animation: movingOut 0s;
  }

  @keyframes movingIn {
    0% {
      opacity: 0;
    }

    100% {
      opacity: 1;
    }
  }

  @keyframes movingOut {
    0% {
      opacity: 1;
    }

    100% {
      opacity: 0;
    }
  }
</style>
