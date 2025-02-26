<!-- ToggleSlider.vue -->
<script setup lang="ts">
  import { computed } from 'vue';

  const props = defineProps<{
    modelValue: string;
    leftOption: string;
    rightOption: string;
    leftValue: string;
    rightValue: string;
    disabled?: boolean;
  }>();

  const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void;
  }>();

  const isRightSelected = computed(() => props.modelValue === props.rightValue);

  const toggleValue = () => {
    emit(
      'update:modelValue',
      isRightSelected.value ? props.leftValue : props.rightValue
    );
  };
</script>

<template>
  <div class="toggle-slider-container">
    <div
      class="toggle-slider"
      :class="{ disabled: disabled }"
      @click="!disabled && toggleValue()"
    >
      <div class="options-container">
        <span class="option" :class="{ active: !isRightSelected }">
          {{ leftOption }}
        </span>
        <span class="option" :class="{ active: isRightSelected }">
          {{ rightOption }}
        </span>
      </div>
      <div
        class="slider-thumb"
        :class="{ 'right-position': isRightSelected }"
      ></div>
    </div>
  </div>
</template>

<style scoped>
  .toggle-slider-container {
    display: inline-flex;
    align-items: center;
  }

  .toggle-slider {
    position: relative;
    width: 120px;
    height: 24px;
    background-color: #f0f0f0;
    border-radius: 12px;
    cursor: pointer;
    overflow: hidden;
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
  }

  .dark .toggle-slider {
    background-color: #2a2a2a;
  }

  .options-container {
    display: flex;
    width: 100%;
    height: 100%;
    position: relative;
    z-index: 2;
  }

  .option {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 500;
    color: #777;
    transition: color 0.3s ease;
    user-select: none;
  }

  .dark .option {
    color: #999;
  }

  .option.active {
    color: #131313;
  }

  .slider-thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: calc(50% - 4px);
    height: calc(100% - 4px);
    background-color: #c3c3c3;
    border-radius: 10px;
    transition: transform 0.3s ease;
    z-index: 1;
  }

  .dark .slider-thumb {
    background-color: #555;
  }

  .slider-thumb.right-position {
    transform: translateX(calc(100% + 4px));
  }

  .toggle-slider.disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>
