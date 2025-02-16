<!-- CustomSwitch.vue -->
<script setup lang="ts">
  import { computed } from 'vue';

  const props = defineProps<{
    modelValue: boolean;
    disabled?: boolean;
    label?: string;
  }>();

  const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void;
  }>();

  const isChecked = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value),
  });
</script>

<template>
  <label
    class="flex cursor-pointer items-center"
    :class="{ 'cursor-not-allowed opacity-50': disabled }"
  >
    <div class="relative">
      <input
        type="checkbox"
        class="sr-only"
        v-model="isChecked"
        :disabled="disabled"
      />
      <div
        class="block h-6 w-10 rounded-full transition-colors duration-200"
        :class="[
          isChecked ? 'bg-blue-500' : 'bg-gray-300',
          disabled ? 'cursor-not-allowed' : 'cursor-pointer',
        ]"
      ></div>
      <div
        class="dot absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition duration-200"
        :class="[
          isChecked ? 'translate-x-4' : 'translate-x-0',
          disabled ? 'cursor-not-allowed' : 'cursor-pointer',
        ]"
      ></div>
    </div>
    <span
      v-if="label"
      class="ml-3 text-sm text-gray-700"
      :class="{ 'cursor-not-allowed': disabled }"
    >
      {{ label }}
    </span>
  </label>
</template>

<style scoped>
  .dot {
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
</style>
