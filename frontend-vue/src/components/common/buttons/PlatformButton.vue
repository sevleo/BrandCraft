<script setup lang="ts">
  import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

  interface Props {
    account: any;
    isSelected?: boolean;
    onClick?: () => void;
  }

  defineProps<Props>();
</script>

<template>
  <div
    class="group flex cursor-pointer items-center gap-2 rounded-full p-0 transition-all duration-100"
    :class="isSelected ? 'bg-gray-100' : ''"
    @click="onClick"
  >
    <button
      type="button"
      class="relative flex h-[50px] w-[50px] items-center justify-center gap-2 rounded-full text-sm"
      :class="[
        isSelected
          ? 'outline outline-[1px] outline-[black] dark:outline-white'
          : 'outline outline-[1px] outline-black/20 grayscale dark:outline-white/20',
      ]"
    >
      <!-- <div class="icon-container flex items-center justify-center">
        <FontAwesomeIcon
          :icon="account.platformIcon"
          class="icon h-[27px] rounded-full text-lg"
        />
      </div> -->

      <img
        :src="account.profileImageUrl"
        class="rounded-full p-[3px]"
        :alt="account.username"
      />

      <div
        class="icon-container absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full border border-black bg-black p-[4px]"
      >
        <FontAwesomeIcon
          :icon="account.platformIcon"
          class="icon h-[15px] rounded-full text-lg"
        />
      </div>
    </button>
    <span
      class="pr-3 text-sm text-gray-500 transition-colors duration-200 group-hover:text-gray-900"
      :class="{ 'text-gray-900 dark:text-gray-200': isSelected }"
    >
      {{ account.username }}
    </span>
  </div>
</template>

<style scope>
  .icon-container path {
    fill: white !important;
  }

  .dark .icon-container path {
    fill: white !important;
  }
</style>
