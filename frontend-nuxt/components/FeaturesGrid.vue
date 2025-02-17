<!-- FeaturesGrid.vue -->
<script setup>
defineProps({
  features: {
    type: Array,
    required: true,
    default: () => [],
  },
  bgColor: {
    type: String,
    default: "bg-white",
  },
  iconBgColor: {
    type: String,
    default: "bg-gray-100",
  },
  iconColor: {
    type: String,
    default: "text-gray-900",
  },
  textColor: {
    type: String,
    default: "text-gray-900",
  },
  descriptionColor: {
    type: String,
    default: "text-gray-600",
  },
});
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="(feature, index) in features"
        :key="index"
        :class="[bgColor, 'rounded-lg shadow-md p-6']"
      >
        <div
          :class="[
            iconBgColor,
            'w-12 h-12 rounded-lg flex items-center justify-center mb-4',
          ]"
        >
          <svg
            :class="[iconColor, 'w-6 h-6']"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              :d="feature.icon"
            />
          </svg>
        </div>
        <h3 :class="[textColor, 'text-lg font-semibold mb-2']">
          {{ feature.title }}
        </h3>
        <p :class="[descriptionColor]">
          {{ feature.description }}
        </p>
      </div>
    </div>
  </div>
</template>
