<script setup lang="ts">
  import { errors, warnings } from '@/utils/editorValidations';
  import {
    AlertCircle,
    AlertTriangle,
    ChevronDown,
    ChevronUp,
  } from 'lucide-vue-next';
  import { ref } from 'vue';

  const isErrorsExpanded = ref(false);
  const isWarningsExpanded = ref(false);

  const toggleErrorsExpand = () => {
    isErrorsExpanded.value = !isErrorsExpanded.value;
  };

  const toggleWarningsExpand = () => {
    isWarningsExpanded.value = !isWarningsExpanded.value;
  };
</script>

<template>
  <!-- Errors Section -->
  <div class="mb-4 flex flex-col">
    <div
      v-if="errors.length > 0"
      class="validation-errors rounded-lg border border-red-800 bg-red-50 px-4"
    >
      <div
        @click="toggleErrorsExpand"
        class="validation-summary flex cursor-pointer items-center justify-between"
      >
        <div class="flex items-center gap-2">
          <AlertCircle
            class="h-4 w-4 stroke-red-700 text-red-700 dark:text-red-400"
          />
          <span class="text-sm font-medium text-red-700 dark:text-red-400">
            {{ errors.length }}
            {{ errors.length === 1 ? 'issue' : 'issues' }}
          </span>
        </div>

        <div
          class="flex h-8 w-8 items-center justify-center rounded-full transition-colors"
        >
          <component
            :is="isErrorsExpanded ? ChevronUp : ChevronDown"
            class="h-5 w-5 text-gray-600"
          />
        </div>
      </div>

      <div v-if="isErrorsExpanded" class="my-3 space-y-2">
        <ol class="list-decimal pl-5">
          <li
            v-for="(error, index) in errors"
            :key="index"
            class="validation-error mb-2 text-sm text-red-700 dark:text-red-400"
          >
            <div>
              <span class="font-medium">{{
                error.platform && error.platform + ':'
              }}</span>
              <span class="ml-1 opacity-90">{{ error.message }}</span>
            </div>
          </li>
        </ol>
      </div>
    </div>

    <!-- Warnings Section -->
    <div
      v-if="warnings.length > 0"
      class="validation-warnings mt-1 rounded-lg border border-amber-600 bg-amber-50 px-4"
    >
      <div
        @click="toggleWarningsExpand"
        class="validation-summary flex cursor-pointer items-center justify-between"
      >
        <div class="flex items-center gap-2">
          <AlertTriangle
            class="h-4 w-4 stroke-amber-600 text-amber-600 dark:text-amber-400"
          />
          <span class="text-sm font-medium text-amber-600 dark:text-amber-400">
            {{ warnings.length }}
            {{ warnings.length === 1 ? 'warning' : 'warnings' }}
          </span>
        </div>

        <div
          class="flex h-8 w-8 items-center justify-center rounded-full transition-colors"
        >
          <component
            :is="isWarningsExpanded ? ChevronUp : ChevronDown"
            class="h-5 w-5 text-gray-600"
          />
        </div>
      </div>

      <div v-if="isWarningsExpanded" class="my-3 space-y-2">
        <ol class="list-decimal pl-5">
          <li
            v-for="(warning, index) in warnings"
            :key="index"
            class="validation-warning mb-2 text-sm text-amber-600 dark:text-amber-400"
          >
            <div>
              <span class="font-medium">{{ warning.platform }}:</span>
              <span class="ml-1 opacity-90">{{ warning.message }}</span>
            </div>
          </li>
        </ol>
      </div>
    </div>
  </div>

  <div v-if="errors.length === 0 && warnings.length === 0" class="h-0"></div>
</template>

<style scoped></style>
