<script setup lang="ts">
  import { ref, computed, watch } from 'vue';

  const props = defineProps<{
    modelValue: Date;
  }>();

  const emit = defineEmits<{
    (e: 'update:modelValue', value: Date): void;
  }>();

  const hours = ref(props.modelValue.getHours());
  const minutes = ref(props.modelValue.getMinutes());
  const period = ref(hours.value >= 12 ? 'PM' : 'AM');

  const displayHours = computed(() => {
    let h = hours.value;
    if (h === 0) h = 12;
    if (h > 12) h = h - 12;
    return h.toString().padStart(2, '0');
  });

  const displayMinutes = computed(() => {
    return minutes.value.toString().padStart(2, '0');
  });

  function updateTime() {
    const date = new Date(props.modelValue);
    let h = hours.value;
    if (period.value === 'PM' && h < 12) h += 12;
    if (period.value === 'AM' && h === 12) h = 0;
    date.setHours(h);
    date.setMinutes(minutes.value);
    emit('update:modelValue', date);
  }

  function incrementHours() {
    hours.value = (hours.value + 1) % 24;
    updateTime();
  }

  function decrementHours() {
    hours.value = hours.value - 1;
    if (hours.value < 0) hours.value = 23;
    updateTime();
  }

  function incrementMinutes() {
    minutes.value = (minutes.value + 15) % 60;
    updateTime();
  }

  function decrementMinutes() {
    minutes.value = minutes.value - 15;
    if (minutes.value < 0) minutes.value = 45;
    updateTime();
  }

  function togglePeriod() {
    period.value = period.value === 'AM' ? 'PM' : 'AM';
    if (period.value === 'PM' && hours.value < 12) {
      hours.value += 12;
    } else if (period.value === 'AM' && hours.value >= 12) {
      hours.value -= 12;
    }
    updateTime();
  }

  // Watch for external changes
  watch(
    () => props.modelValue,
    (newValue) => {
      const h = newValue.getHours();
      hours.value = h;
      minutes.value = newValue.getMinutes();
      period.value = h >= 12 ? 'PM' : 'AM';
    },
    { immediate: true }
  );
</script>

<template>
  <div
    class="flex items-center gap-1 rounded-lg border border-gray-300 bg-white p-2"
  >
    <!-- Hours -->
    <div class="relative">
      <button
        @click="incrementHours"
        class="absolute -top-7 left-1/2 -translate-x-1/2 text-gray-500 hover:text-gray-700"
      >
        ▲
      </button>
      <input
        type="text"
        :value="displayHours"
        readonly
        class="w-8 bg-white text-center"
      />
      <button
        @click="decrementHours"
        class="absolute -bottom-7 left-1/2 -translate-x-1/2 text-gray-500 hover:text-gray-700"
      >
        ▼
      </button>
    </div>

    <span class="text-gray-500">:</span>

    <!-- Minutes -->
    <div class="relative">
      <button
        @click="incrementMinutes"
        class="absolute -top-7 left-1/2 -translate-x-1/2 text-gray-500 hover:text-gray-700"
      >
        ▲
      </button>
      <input
        type="text"
        :value="displayMinutes"
        readonly
        class="w-8 bg-white text-center"
      />
      <button
        @click="decrementMinutes"
        class="absolute -bottom-7 left-1/2 -translate-x-1/2 text-gray-500 hover:text-gray-700"
      >
        ▼
      </button>
    </div>

    <!-- AM/PM -->
    <button
      @click="togglePeriod"
      class="ml-1 rounded px-2 py-1 text-sm hover:bg-gray-100"
    >
      {{ period }}
    </button>
  </div>
</template>
