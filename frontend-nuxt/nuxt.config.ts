import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
  compatibilityDate: "2025-02-16",

  ssr: true,

  css: ["@/assets/css/main.css"],

  // ✅ Ensure correct Nitro preset for Fly.io
  nitro: {
    preset: "node-server", // Use "node-server" instead of "node"
    serveStatic: true,
  },

  // ✅ Set the correct port and host
  devServer: {
    port: 3001,
    host: "0.0.0.0",
  },

  app: {
    baseURL: "/",
  },

  runtimeConfig: {
    public: {
      NUXT_PUBLIC_BACKEND_URL: process.env.NUXT_PUBLIC_BACKEND_URL,
      NUXT_PUBLIC_FRONTEND_URL: process.env.NUXT_PUBLIC_FRONTEND_URL,
      NUXT_PUBLIC_FRONTEND_DASHBOARD_URL:
        process.env.NUXT_PUBLIC_FRONTEND_DASHBOARD_URL,
    },
  },

  // ✅ Configure aliases (Vite works within Nuxt)
  alias: {
    "@assets": "./assets",
    "@components": "./components",
    "@api": "./api",
  },

  // ✅ Ensure compatibility with Vite's alias handling
  vite: {
    resolve: {
      alias: {
        "@assets": new URL("./assets", import.meta.url).pathname,
        "@components": new URL("./components", import.meta.url).pathname,
        "@api": new URL("./api", import.meta.url).pathname,
      },
    },
    plugins: [tailwindcss()],
  },
  postcss: {
    plugins: {
      "@tailwindcss/postcss": {},
      autoprefixer: {},
    },
  },
});
