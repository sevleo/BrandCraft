<script setup lang="ts">
import { useHead } from "@unhead/vue";

useHead({
  script: [
    {
      src: "https://www.googletagmanager.com/gtag/js?id=G-VHPLXRGRB6",
      async: true,
      defer: true, // Loads after other critical resources
    },
    {
      children: `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-VHPLXRGRB6');
      `,
    },
  ],
});
</script>

<template>
  <div>
    <NuxtPage />
  </div>
</template>
