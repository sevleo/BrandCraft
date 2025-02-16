/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./**/*.{vue,js,jsx,ts,tsx}",
    "./components/**/*.{vue,js,ts,jsx,tsx}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./app.vue",
    "./nuxt.config.{js,ts}",
  ],
  darkMode: "class",
  theme: {
    screens: {
      xsm: "500px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      fontFamily: {
        "noto-sans": ['"Noto Sans"', "sans-serif"],
      },
      transitionTimingFunction: {
        custom: "cubic-bezier(0.65, 0.05, 0.36, 1)",
      },
    },
  },
  plugins: [],
};
