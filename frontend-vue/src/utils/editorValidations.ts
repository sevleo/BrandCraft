import { computed, watchEffect, ref } from 'vue';
import editorDataStore from './editorDataStore';

// Define validation rules for different platforms
const platformCharacterLimits = {
  twitter: 280,
  bluesky: 300,
  threads: 500,
  // Add other platforms as needed
};

// Interface for validation errors
export interface ValidationError {
  platform: string;
  message: string;
  type: 'error' | 'warning';
}

// Create a reactive array to hold validation errors
const validationErrors = ref<ValidationError[]>([]);

// Function to validate content length for each platform
const validateContentLength = () => {
  const errors: ValidationError[] = [];
  const selectedPlatforms = editorDataStore.selectedPost.value?.platforms || [];

  // Get character count from the editor data store
  const characterCount = editorDataStore.contentStats.value.characterCount;

  // Check each selected platform for character limits
  selectedPlatforms.forEach((platformId) => {
    // Extract platform name from the ID (format is 'platform-id')
    const platform = platformId.split('-')[0];

    // Check if we have a limit for this platform
    if (platform in platformCharacterLimits) {
      const limit =
        platformCharacterLimits[
          platform as keyof typeof platformCharacterLimits
        ];

      if (characterCount > limit) {
        errors.push({
          platform: getPlatformDisplayName(platform),
          message: `Content exceeds ${limit} character limit (currently ${characterCount})`,
          type: 'error',
        });
      }
    }
  });

  return errors;
};

// Helper function to get display name for platforms
const getPlatformDisplayName = (platform: string): string => {
  const displayNames: Record<string, string> = {
    twitter: 'Twitter/X',
    bluesky: 'Bluesky',
    threads: 'Threads',
    mastodon: 'Mastodon',
    tiktok: 'TikTok',
    instagram: 'Instagram',
    youtube: 'YouTube',
  };

  return displayNames[platform] || platform;
};

// Set up watchers to validate whenever relevant data changes
watchEffect(() => {
  // Clear previous errors
  validationErrors.value = [];

  // Run all validation functions and combine results
  validationErrors.value = [
    ...validateContentLength(),
    // Add more validation functions here as needed
  ];
});

// Export a computed property that returns the current validation errors
export const errors = computed(() => validationErrors.value);
