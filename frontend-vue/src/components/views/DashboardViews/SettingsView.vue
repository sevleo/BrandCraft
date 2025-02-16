<script setup lang="ts">
  import { ref, computed } from 'vue';
  import { updatePassword, setPassword, verifyAuth } from '@/api/authApi';
  import DashboardNavigation from '@/components/layout/DashboardNavigation.vue';
  import { onMounted } from 'vue';
  import { useThemeStore } from '@/utils/themeStore';
  import authData from '@/utils/authDataStore';

  const themeStore = useThemeStore();

  const currentPassword = ref('');
  const newPassword = ref('');
  const confirmPassword = ref('');
  const error = ref('');
  const successMessage = ref('');
  const isLoading = ref(false);

  const isFormValid = computed(() => {
    if (
      !currentPassword.value ||
      !newPassword.value ||
      !confirmPassword.value
    ) {
      return false;
    }
    if (newPassword.value !== confirmPassword.value) {
      return false;
    }
    if (newPassword.value.length < 8) {
      return false;
    }
    return true;
  });

  const isSetPasswordFormValid = computed(() => {
    if (!newPassword.value || !confirmPassword.value) {
      return false;
    }
    if (newPassword.value !== confirmPassword.value) {
      return false;
    }
    if (newPassword.value.length < 8) {
      return false;
    }
    return true;
  });

  async function handlePasswordChange() {
    if (!isFormValid.value) return;

    error.value = '';
    successMessage.value = '';
    isLoading.value = true;

    try {
      const result = await updatePassword(
        currentPassword.value,
        newPassword.value
      );

      if (result.success) {
        successMessage.value = 'Password updated successfully';
        currentPassword.value = '';
        newPassword.value = '';
        confirmPassword.value = '';
      } else {
        error.value = result.error;
      }
    } catch (err) {
      error.value = 'An unexpected error occurred. Please try again.';
    } finally {
      isLoading.value = false;
    }
  }

  async function handleSetPassword() {
    if (!isSetPasswordFormValid.value) return;

    error.value = '';
    successMessage.value = '';
    isLoading.value = true;

    try {
      const result = await setPassword(newPassword.value);

      if (result.success) {
        successMessage.value = 'Password set successfully';
        newPassword.value = '';
        confirmPassword.value = '';
        await verifyAuth();
      } else {
        error.value = result.error;
      }
    } catch (err) {
      error.value = 'An unexpected error occurred. Please try again.';
    } finally {
      isLoading.value = false;
    }
  }

  onMounted(() => {
    themeStore.initializeTheme();
  });
</script>

<template>
  <div>
    <DashboardNavigation />
    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div class="max-w-2xl space-y-6">
        <!-- Page Header -->
        <div>
          <h1 class="text-2xl font-semibold text-gray-900">Settings</h1>
          <p class="mt-1 text-sm text-gray-500">
            Manage your account settings and preferences
          </p>
        </div>
        <!-- User Information Section -->
        <div class="mt-6">
          <div
            class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-[#313131] dark:bg-[#121212]"
          >
            <h2 class="text-lg font-medium">Account Information</h2>
            <p class="mt-1 text-sm text-gray-500">Your account details</p>

            <div class="mt-4 space-y-4">
              <div>
                <label
                  class="block text-sm font-medium text-gray-700 dark:text-gray-200"
                >
                  Username
                </label>
                <div class="mt-1 text-sm text-gray-900 dark:text-gray-300">
                  {{ authData.user?.value || 'Not set' }}
                </div>
              </div>

              <div>
                <label
                  class="block text-sm font-medium text-gray-700 dark:text-gray-200"
                >
                  Display Name
                </label>
                <div class="mt-1 text-sm text-gray-900 dark:text-gray-300">
                  {{ authData.displayName?.value || 'Not set' }}
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- Set Initial Password Section -->
        <div v-if="authData.passwordSet?.value === false" class="mt-10">
          <div
            class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-[#313131] dark:bg-[#121212]"
          >
            <h2 class="text-lg font-medium">Set Password</h2>
            <p class="mt-1 text-sm text-gray-500">
              Use this to set a password if you want to give team members access
              to your Brandcraft account without using magic link or social
              sign-in.
            </p>

            <form @submit.prevent="handleSetPassword" class="mt-6 space-y-4">
              <div>
                <label
                  for="new-password"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-200"
                >
                  New Password
                </label>
                <input
                  id="new-password"
                  v-model="newPassword"
                  type="password"
                  required
                  class="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                  placeholder="Enter new password"
                  minlength="8"
                />
              </div>

              <div>
                <label
                  for="confirm-password"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-200"
                >
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  v-model="confirmPassword"
                  type="password"
                  required
                  class="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                  placeholder="Confirm new password"
                />
              </div>

              <div v-if="error" class="text-sm text-red-600">{{ error }}</div>
              <div v-if="successMessage" class="text-green-600 text-sm">
                {{ successMessage }}
              </div>

              <div class="flex justify-end">
                <button
                  type="submit"
                  :disabled="!isSetPasswordFormValid || isLoading"
                  class="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  <span v-if="isLoading">Setting password...</span>
                  <span v-else>Set Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Password Change Section -->
        <div v-if="authData.passwordSet?.value === true" class="mt-10">
          <div
            class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-[#313131] dark:bg-[#121212]"
          >
            <h2 class="text-lg font-medium">Change Password</h2>
            <p class="mt-1 text-sm text-gray-500">
              Update your password to keep your account secure
            </p>

            <form @submit.prevent="handlePasswordChange" class="mt-6 space-y-4">
              <div>
                <label
                  for="currentPassword"
                  class="block text-sm font-medium text-gray-700"
                >
                  Current Password
                </label>
                <input
                  id="currentPassword"
                  v-model="currentPassword"
                  type="password"
                  required
                  class="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-[#313131] dark:bg-[#1a1a1a] sm:text-sm"
                  :class="{ 'border-red-500': error }"
                />
              </div>

              <div>
                <label
                  for="newPassword"
                  class="block text-sm font-medium text-gray-700"
                >
                  New Password
                </label>
                <input
                  id="newPassword"
                  v-model="newPassword"
                  type="password"
                  required
                  class="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-[#313131] dark:bg-[#1a1a1a] sm:text-sm"
                  :class="{ 'border-red-500': error }"
                />
              </div>

              <div>
                <label
                  for="confirmPassword"
                  class="block text-sm font-medium text-gray-700"
                >
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  v-model="confirmPassword"
                  type="password"
                  required
                  class="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-[#313131] dark:bg-[#1a1a1a] sm:text-sm"
                  :class="{ 'border-red-500': error }"
                />
              </div>

              <!-- Error Message -->
              <div v-if="error" class="text-sm text-red-600">
                {{ error }}
              </div>

              <!-- Success Message -->
              <div
                v-if="successMessage"
                class="text-green-700 rounded-md bg-green-50 p-4 text-sm"
              >
                {{ successMessage }}
              </div>

              <div class="flex justify-end">
                <button
                  type="submit"
                  :disabled="isLoading || !isFormValid"
                  class="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span v-if="isLoading">Updating...</span>
                  <span v-else>Update Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
