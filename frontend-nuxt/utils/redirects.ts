import { useRuntimeConfig } from "nuxt/app";

export function redirectToLogin() {
  const config = useRuntimeConfig();
  const frontendUrl = config.public.NUXT_PUBLIC_FRONTEND_URL;
  if (frontendUrl) {
    window.location.href = `${frontendUrl}/login`;
  }
}

export function redirectToSignup() {
  const config = useRuntimeConfig();
  const frontendUrl = config.public.NUXT_PUBLIC_FRONTEND_URL;
  if (frontendUrl) {
    window.location.href = `${frontendUrl}/signup`;
  }
}
