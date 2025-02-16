<script setup lang="ts">
  import { computed } from 'vue';

  interface Props {
    variant?: 'default' | 'primary' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    active?: boolean;
    icon?: boolean;
    noborder?: boolean;
  }

  const props = withDefaults(defineProps<Props>(), {
    variant: 'default',
    size: 'md',
    active: false,
    icon: false,
    noborder: false,
  });

  const baseClasses = computed(() => [
    'inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-[#313131] font-medium transition-all duration-200  px-4 min-w-[45px] flex justify-center items-center',
    {
      // Size variations
      'h-[35px] text-sm': props.size === 'sm',
      'h-[45px] text-sm': props.size === 'md',
      'h-[55px] text-sm': props.size === 'lg',

      // Variant & state combinations
      'bg-black dark:bg-[#d9d9d9] text-white dark:text-black hover:bg-[#282828] dark:hover:bg-[#d9d9d9]/80':
        props.active || (!props.active && props.variant === 'primary'), // Combined condition
      'bg-white dark:bg-[#121212] text-gray-700 hover:bg-gray-50':
        !props.active && props.variant === 'default',
      'bg-red-600 dark:bg-red-700 dark:hover:bg-red-800 text-white hover:bg-red-700':
        !props.active && props.variant === 'danger',

      // Border variations
      'border-none': props.noborder === true,
    },
  ]);
</script>

<template>
  <button :class="baseClasses" type="button">
    <slot></slot>
  </button>
</template>
