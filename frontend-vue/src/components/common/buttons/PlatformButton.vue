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
  <div>
    <button
      type="button"
      class="relative flex h-[50px] w-[50px] items-center justify-center gap-2 rounded-full text-sm"
      :class="[
        isSelected
          ? 'outline outline-[1px] outline-[black] dark:outline-white'
          : 'outline outline-[1px] outline-black/20 grayscale dark:outline-white/20',
      ]"
      @click="onClick"
    >
      <div class="icon-container flex items-center justify-center">
        <FontAwesomeIcon
          :icon="account.platformIcon"
          class="icon h-[27px] rounded-full text-lg"
        />
      </div>

      <!-- <img
      :src="account.profileImageUrl"
      class="rounded-full p-[3px]"
      :alt="account.username"
    />

    <div
      class="icon-container absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border border-black bg-black p-[4px]"
    >
      <FontAwesomeIcon
        :icon="account.platformIcon"
        class="icon h-[27px] rounded-full text-lg"
      />
    </div> -->
    </button>
    <div>
      {{ account.username }}
    </div>
  </div>
</template>

<style scope>
  .icon-container path {
    fill: #212121 !important;
  }

  .dark .icon-container path {
    fill: white !important;
  }
</style>
