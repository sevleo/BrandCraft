<script setup lang="ts">
  import { errors } from '@/utils/editorValidations';
  import { AlertCircle, AlertTriangle } from 'lucide-vue-next';
</script>

<template>
  <div v-if="errors.length > 0" class="validation-errors mt-4 px-3">
    <div class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
      Validation Issues:
    </div>
    <div class="space-y-2">
      <div
        v-for="(error, index) in errors"
        :key="index"
        class="validation-error flex items-start gap-2 rounded-md bg-red-50 p-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400"
      >
        <div class="mt-0.5 flex-shrink-0">
          <AlertCircle v-if="error.type === 'error'" class="h-4 w-4" />
          <AlertTriangle v-else class="h-4 w-4" />
        </div>
        <div>
          <div class="font-medium">{{ error.platform }}</div>
          <div class="text-sm opacity-90">{{ error.message }}</div>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="h-0"></div>
</template>

<style scoped>
  .validation-errors {
    transition: all 0.3s ease;
  }

  .validation-error {
    transition: all 0.2s ease;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }
</style>
