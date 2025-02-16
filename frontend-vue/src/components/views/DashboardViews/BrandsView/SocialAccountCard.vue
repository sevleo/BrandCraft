<!-- SocialAccountCard.vue -->
<script setup lang="ts">
  import { computed } from 'vue';
  import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
  import { CirclePlus } from 'lucide-vue-next';
  // import { useThemeStore } from '@/utils/themeStore';

  // const themeStore = useThemeStore();

  const props = defineProps<{
    networkName: string;
    account: any;
    isConnecting: boolean;
    buttonColor: string;
  }>();

  defineEmits<{
    (e: 'open'): void;
  }>();

  const isConnected = computed(() => !!props.account);

  // computed(() => [
  //   `bg-${props.buttonColor}-500`,
  //   `hover:bg-${props.buttonColor}-600`,
  //   `focus:ring-${props.buttonColor}-500`,
  //   'transition-colors duration-200',
  // ]);

  const networkIcon = computed(() => {
    switch (props.networkName) {
      case 'Twitter':
        return ['fab', 'x-twitter'];
      case 'Threads':
        return ['fab', 'threads'];
      case 'Bluesky':
        return ['fab', 'bluesky'];
      case 'Instagram':
        return ['fab', 'instagram'];
      case 'TikTok':
        return ['fab', 'tiktok'];
      case 'YouTube':
        return ['fab', 'youtube'];
      case 'Mastodon':
        return ['fab', 'mastodon'];
      case 'Facebook':
        return ['fab', 'facebook'];
      default:
        return ['fas', 'link'];
    }
  });
</script>

<template>
  <!-- {{ props }} -->
  <div
    class="add-icon-container flex h-[60px] w-[250px] cursor-pointer rounded-lg border p-2 shadow-sm transition-colors duration-200 dark:border-[#313131]"
    :class="[
      $attrs.class,
      {
        'bg-[#212121] hover:bg-[#212121]/90 dark:bg-[#d9d9d9] dark:hover:bg-[#d9d9d9]/80':
          $attrs['data-active'],
        'bg-white hover:bg-gray-100 dark:bg-[#121212] dark:hover:bg-[#d9d9d9]/10':
          !$attrs['data-active'],
      },
    ]"
    :data-active="$attrs['data-active']"
    @click="$emit('open')"
  >
    <!-- Not Connected State -->
    <div
      v-if="!isConnected || isConnected"
      class="flex w-full items-center justify-start gap-3"
    >
      <div class="flex h-10 w-10 items-center justify-center rounded-full">
        <FontAwesomeIcon
          :icon="networkIcon"
          :class="networkIcon[1] === 'youtube' ? 'text-[27px]' : 'text-[27px]'"
        />
      </div>

      <div class="flex items-center justify-between">
        <span
          class="text-[12px] font-medium"
          :class="[
            $attrs['data-active']
              ? 'text-white dark:text-black'
              : 'text-[black] dark:text-white',
          ]"
          >{{ networkName }}</span
        >
      </div>
      <div v-if="!isConnected" class="ml-auto">
        <CirclePlus strokeWidth="0.7" class="add-icon" width="35" height="35" />
      </div>
      <div v-else class="ml-auto">
        <div class="flex h-[35px] w-[35px] items-center justify-center">
          <img
            :src="props.account.profileImageUrl"
            class="h-[35px] w-[35px] rounded-full object-cover"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .add-icon-container .add-icon {
    stroke: #212121;
  }

  .add-icon-container[data-active='true'] .add-icon {
    stroke: white;
  }

  .add-icon-container :deep(svg path) {
    fill: #212121;
  }

  .add-icon-container[data-active='true'] :deep(svg path) {
    fill: white;
  }

  .dark .add-icon-container .add-icon {
    stroke: white;
  }

  .dark .add-icon-container[data-active='true'] .add-icon {
    stroke: #212121;
  }

  .dark .add-icon-container :deep(svg path) {
    fill: white;
  }

  .dark .add-icon-container[data-active='true'] :deep(svg path) {
    fill: #212121;
  }
</style>
