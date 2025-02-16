<template>
  <div class="auth-form w-full max-w-md rounded-lg bg-white px-6 pb-[100px]">
    <div class="flex w-full flex-col gap-2">
      <div class="relative flex justify-start text-sm max-lg:justify-center">
        <span
          class="text-foreground mb-8 bg-[white] px-2 text-sm text-[#636365]"
        >
          Continue with
        </span>
      </div>
      <div class="flex w-full flex-col justify-center gap-2 max-sm:flex-row">
        <a :href="googleLoginUrl">
          <div
            aria-label="Login with Google"
            class="!text-primary-50 button google-button flex h-[55px] w-full items-center justify-center !border !border-white/30 hover:!bg-white/10"
          >
            <svg
              class="h-full w-auto p-3"
              role="img"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <title>Google</title>
              <path
                d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
              />
            </svg>
            <p class="max-sm:hidden">Google</p>
          </div>
        </a>
        <a :href="facebookLoginUrl">
          <div
            aria-label="Login with Facebook"
            class="!text-primary-50 button google-button flex h-[55px] w-full items-center justify-center !border !border-white/30 hover:!bg-white/10"
          >
            <svg
              class="h-full w-auto p-3"
              role="img"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <title>Facebook</title>
              <path
                d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
              />
            </svg>
            <p class="max-sm:hidden">Facebook</p>
          </div>
        </a>

        <a :href="githubLoginUrl">
          <div
            aria-label="Login with GitHub"
            class="!text-primary-50 button google-button flex h-[55px] w-full items-center justify-center !border !border-white/30 hover:!bg-white/10"
          >
            <svg
              class="h-full w-auto p-3"
              role="img"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <title>GitHub</title>
              <path
                d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
              />
            </svg>
            <p class="max-sm:hidden">GitHub</p>
          </div>
        </a>
      </div>

      <div class="relative mb-8 mt-8">
        <div class="absolute inset-0 flex items-center">
          <div class="border-strong w-full border-t border-[#c6c6c6]"></div>
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="text-foreground bg-[white] px-2 text-sm text-[#636365]">
            or
          </span>
        </div>
      </div>
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label
            for="email"
            class="mb-1 block text-sm font-medium text-gray-700"
          >
            Email
          </label>
          <input
            type="email"
            id="email"
            v-model="email"
            required
            class="w-full rounded-md border border-gray-300 bg-[white] px-3 py-2 text-[black] focus:outline-none focus:ring-2 focus:ring-[#34b26f]"
            placeholder="Enter your email"
            :disabled="isLoading"
          />
        </div>

        <div>
          <label
            for="password"
            class="mb-1 block text-sm font-medium text-gray-700"
          >
            Password
          </label>
          <input
            type="password"
            id="password"
            v-model="password"
            required
            class="w-full rounded-md border border-gray-300 bg-[white] px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#34b26f]"
            :placeholder="
              mode === 'login'
                ? 'Enter your password'
                : 'Create password (min 8 characters)'
            "
            :disabled="isLoading"
          />
          <p v-if="getPasswordError" class="mt-1 text-sm text-red-500">
            {{ getPasswordError }}
          </p>
        </div>

        <div v-if="mode === 'signup'">
          <label
            for="confirmPassword"
            class="mb-1 block text-sm font-medium text-gray-700"
          >
            Confirm Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            v-model="confirmPassword"
            required
            class="w-full rounded-md border border-gray-300 bg-[white] px-3 py-2 text-[black] focus:outline-none focus:ring-2 focus:ring-[#34b26f]"
            placeholder="Confirm your password"
            :disabled="isLoading"
          />
        </div>

        <div v-if="error" class="mt-2 text-sm text-red-600">
          {{ error }}
        </div>

        <button
          type="submit"
          class="focus:ring-greenLight w-full rounded-md bg-green px-4 py-2 text-white hover:bg-greenLight focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50"
          :disabled="!isFormValid || isLoading"
        >
          {{ buttonText }}
        </button>

        <div class="mt-4 pb-4 text-center">
          <p class="text-sm text-gray-600">
            {{
              mode === 'login'
                ? "Don't have an account?"
                : 'Already have an account?'
            }}
            <router-link
              :to="mode === 'login' ? '/signup' : '/login'"
              class="text-green underline hover:text-greenLight"
            >
              {{ mode === 'login' ? 'Sign up' : 'Login' }}
            </router-link>
          </p>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue';
  import { useRouter, useRoute } from 'vue-router';
  import authData from '@/utils/authDataStore';
  import { signIn, signUp } from '@/api/authApi';
  import { verifyAuth } from '@/api/authApi';

  const props = defineProps<{
    mode: 'login' | 'signup';
  }>();

  const router = useRouter();
  const route = useRoute();
  const email = ref('');
  const password = ref('');
  const confirmPassword = ref('');
  const isLoading = ref(false);
  const error = ref('');

  const isFormValid = computed(() => {
    if (props.mode === 'login') {
      return email.value.length > 0 && password.value.length > 0;
    }
    return (
      email.value.length > 0 &&
      password.value.length >= 8 &&
      password.value === confirmPassword.value
    );
  });

  const getPasswordError = computed(() => {
    if (
      props.mode === 'signup' &&
      password.value.length > 0 &&
      password.value.length < 8
    ) {
      return 'Password must be at least 8 characters long';
    }
    if (
      props.mode === 'signup' &&
      confirmPassword.value.length > 0 &&
      password.value !== confirmPassword.value
    ) {
      return 'Passwords do not match';
    }
    return '';
  });

  const buttonText = computed(() => {
    if (isLoading.value) {
      return props.mode === 'login' ? 'Logging in...' : 'Creating Account...';
    }
    return props.mode === 'login' ? 'Login' : 'Sign Up';
  });

  const handleSubmit = async () => {
    if (!isFormValid.value) return;

    isLoading.value = true;
    error.value = '';

    try {
      let result;
      if (props.mode === 'login') {
        result = await signIn(email.value, password.value);
      } else {
        result = await signUp(email.value, password.value);
      }

      if (result.success) {
        await router.push('/dashboard');
      } else {
        error.value = result.error;
      }
    } catch (err) {
      error.value = 'An unexpected error occurred. Please try again.';
    } finally {
      isLoading.value = false;
    }
  };

  const googleLoginUrl = computed(
    () => `${import.meta.env.VITE_BACKEND_URL}/auth/login/federated/google`
  );
  const githubLoginUrl = computed(
    () => `${import.meta.env.VITE_BACKEND_URL}/auth/login/federated/github`
  );
  const facebookLoginUrl = computed(
    () => `${import.meta.env.VITE_BACKEND_URL}/auth/login/federated/facebook`
  );

  onMounted(async () => {
    // Regular auth verification
    await verifyAuth();
    if (authData.signedIn.value) {
      router.push('/dashboard');
    }
    // Set email from query parameters if available
    if (route.query.email) {
      email.value = route.query.email as string;
    }
  });
</script>

<style scoped>
  .google-button {
    border-color: #c6c6c6 !important;
    background-color: #ffffffe4 !important;
    border-radius: 5px;
  }

  .google-button:hover {
    border-color: #7f7f7f !important;
    background-color: #dededee4 !important;
  }
</style>
