// stores/themeStore.ts
import { defineStore } from 'pinia';

const THEME_KEY = 'brandcraft-theme';

export const useThemeStore = defineStore('theme', {
  state: () => ({
    currentTheme: 'light' as 'light' | 'dark',
  }),
  actions: {
    initializeTheme() {
      const savedTheme = localStorage.getItem(THEME_KEY);
      if (savedTheme === 'light' || savedTheme === 'dark') {
        // this.currentTheme = savedTheme;
        this.currentTheme = 'light';
      } else {
        // const prefersDark = window.matchMedia(
        //   '(prefers-color-scheme: dark)'
        // ).matches;
        // this.currentTheme = prefersDark ? 'dark' : 'light';
        this.currentTheme = 'light';
      }
      this.applyTheme(this.currentTheme);
    },
    applyTheme(theme: 'light' | 'dark') {
      document.documentElement.classList.toggle('dark', theme === 'dark');
      localStorage.setItem(THEME_KEY, theme);
    },
    toggleTheme() {
      this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
      this.applyTheme(this.currentTheme);
    },
  },
});
