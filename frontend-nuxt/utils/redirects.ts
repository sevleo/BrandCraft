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

export function redirectToBlog() {
  const config = useRuntimeConfig();
  const frontendUrl = config.public.NUXT_PUBLIC_FRONTEND_URL;
  if (frontendUrl) {
    window.location.href = `${frontendUrl}/blog`;
  }
}

export function redirectToBlogArticle(slug: string) {
  const config = useRuntimeConfig();
  const frontendUrl = config.public.NUXT_PUBLIC_FRONTEND_URL;
  console.log(frontendUrl);
  if (frontendUrl) {
    window.location.href = `http://localhost:3001/blog/${slug}`;
  }
}
