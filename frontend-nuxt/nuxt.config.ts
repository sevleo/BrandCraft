import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { defineNuxtConfig } from "nuxt/config";

// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
  compatibilityDate: "2025-02-16",

  ssr: true,

  css: ["@/assets/css/main.css"],

  // Enable pages directory
  pages: true,

  // Add router options
  router: {
    options: {
      strict: false,
    },
  },

  // ✅ Ensure correct Nitro preset for Fly.io
  nitro: {
    preset: "node-server",
    serveStatic: true,
    externals: {
      inline: ["#build/nuxt.config.mjs"],
    },
  },

  // ✅ Set the correct port and host
  devServer: {
    port: 3001,
    host: "0.0.0.0",
  },

  app: {
    baseURL: "/",
    head: {
      charset: "utf-8",
      viewport: "width=device-width, initial-scale=1",
    },
  },

  runtimeConfig: {
    SEOBOT_KEY: process.env.SEOBOT_KEY,
    public: {
      NUXT_PUBLIC_BACKEND_URL: process.env.NUXT_PUBLIC_BACKEND_URL,
      NUXT_PUBLIC_FRONTEND_URL: process.env.NUXT_PUBLIC_FRONTEND_URL,
      NUXT_PUBLIC_FRONTEND_DASHBOARD_URL:
        process.env.NUXT_PUBLIC_FRONTEND_DASHBOARD_URL,
      // NUXT_PUBLIC_SEOBOT_KEY: process.env.NUXT_PUBLIC_SEOBOT_KEY,
    },
  },

  // ✅ Configure aliases (Vite works within Nuxt)
  alias: {
    "@assets": "./assets",
    "@components": "./components",
    "@api": "./api",
    "@utils": "./utils",
  },

  // ✅ Ensure compatibility with Vite's alias handling
  vite: {
    resolve: {
      alias: {
        "@assets": path.resolve(__dirname, "./assets"),
        "@components": path.resolve(__dirname, "./components"),
        "@api": path.resolve(__dirname, "./api"),
        "@utils": path.resolve(__dirname, "./utils"),
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
