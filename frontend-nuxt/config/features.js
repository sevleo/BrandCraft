// Common SVG path data for icons
const icons = {
  scheduling:
    "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  analytics:
    "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  content:
    "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
};

// Core features that are consistent across all platforms
export const commonFeatures = [
  {
    title: "Content Scheduling",
    description: "Schedule posts at optimal times to maximize engagement and reach.",
    icon: icons.scheduling,
  },
  {
    title: "Analytics Dashboard",
    description: "Track engagement, growth, and performance metrics in real-time.",
    icon: icons.analytics,
  },
  {
    title: "Content Management",
    description: "Plan and organize your content with an intuitive interface.",
    icon: icons.content,
  },
];
