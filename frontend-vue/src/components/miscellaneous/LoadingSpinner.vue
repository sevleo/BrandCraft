<!-- LoadingSpinner.vue -->
<script setup lang="ts">
  defineProps({
    size: {
      type: String,
      default: '3rem', // 12 = 3rem in Tailwind
    },
    color: {
      type: String,
      default: 'blue-500',
    },
  });
</script>

<template>
  <div class="flex min-h-[200px] items-center justify-center">
    <div
      class="animate-spin rounded-full border-4"
      :class="`border-${color} border-t-transparent`"
      :style="{ width: size, height: size }"
    ></div>
  </div>
</template>

<style scoped>
  .animate-spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
</style>
