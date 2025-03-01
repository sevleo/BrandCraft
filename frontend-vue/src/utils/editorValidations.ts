import { computed, ref, watchEffect } from 'vue';
import editorDataStore from '@/utils/editorDataStore';
import connectionsDataStore from '@/utils/connectionsDataStore';

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

const validateIsUploading = () => {
  const errors: ValidationError[] = [];

  if (editorDataStore.isUploading.value) {
    errors.push({
      platform: 'All',
      message: 'Please wait for media upload to complete',
      type: 'error',
    });
  }

  return errors;
};

const validateTikTok = () => {
  const errors: ValidationError[] = [];

  // TikTok errors
  if (
    editorDataStore.selectedPost.value?.platforms.some((p: any) =>
      p.startsWith('tiktok')
    )
  ) {
    // 1. Check if media is uploaded
    if (editorDataStore.selectedPost.value.mediaPreviewUrls.length === 0) {
      errors.push({
        platform: 'TikTok',
        message: 'Please upload a video for your TikTok post',
        type: 'error',
      });
    }
    // 2. Check if it's a video
    if (editorDataStore.currentMediaType.value === 'image') {
      errors.push({
        platform: 'TikTok',
        message: 'Images are not supported for TikTok posts',
        type: 'error',
      });
    }

    // 3. Check video duration
    if (editorDataStore.currentMediaType.value === 'video') {
      // const maxDuration = 10;
      const maxDuration =
        connectionsDataStore.tiktokAccount.value?.creatorInfo
          .max_video_post_duration_sec || 900;

      const currentDuration = editorDataStore.videoDurationSeconds.value;

      if (
        currentDuration !== null &&
        Math.floor(currentDuration) > maxDuration
      ) {
        errors.push({
          platform: 'TikTok',
          message: `Video duration (${Math.floor(currentDuration)}s) exceeds maximum allowed length of ${maxDuration} seconds`,
          type: 'error',
        });
      }
    }
    // 4. Check commercial content settings
    if (
      editorDataStore.selectedPost.value.platformSettings.tiktok
        ?.commercialContent &&
      !editorDataStore.selectedPost.value.platformSettings.tiktok
        ?.brandOrganic &&
      !editorDataStore.selectedPost.value.platformSettings.tiktok
        ?.brandedContent
    ) {
      errors.push({
        platform: 'TikTok',
        message:
          'You need to indicate if your content promotes yourself, a third party, or both.',
        type: 'error',
      });
    }
  }
  return errors;
};

const validateInstagram = () => {
  const errors: ValidationError[] = [];

  if (
    editorDataStore.selectedPost.value?.platforms.some((p: any) =>
      p.startsWith('instagram')
    )
  ) {
    // 1. Check if media is uploaded
    if (editorDataStore.selectedPost.value.mediaPreviewUrls.length === 0) {
      errors.push({
        platform: 'Instagram',
        message: 'Please upload a video for your Instagram post',
        type: 'error',
      });
    }
    // 2. Check video duration limits for Reels and Stories
    if (editorDataStore.currentMediaType.value === 'video') {
      const maxDuration =
        editorDataStore.selectedPost.value?.platformSettings.instagram!
          .videoType === 'REELS'
          ? 900
          : 60;
      // const maxDuration = 10;
      const currentDuration = editorDataStore.videoDurationSeconds.value;

      if (
        currentDuration !== null &&
        Math.floor(currentDuration) > maxDuration
      ) {
        errors.push({
          platform: 'Instagram',
          message: `Video duration (${Math.floor(currentDuration)}s) exceeds maximum allowed length of ${maxDuration} seconds`,
          type: 'error',
        });
      }
    }
  }

  return errors;
};

const validateYoutube = () => {
  const errors: ValidationError[] = [];

  if (
    editorDataStore.selectedPost.value?.platforms.some((p: any) =>
      p.startsWith('youtube')
    )
  ) {
    // 1. Check if media is uploaded
    if (editorDataStore.selectedPost.value.mediaPreviewUrls.length === 0) {
      errors.push({
        platform: 'Youtube',
        message: 'Please upload a video for your Youtube post',
        type: 'error',
      });
    }
    // 2. Check if it's a video
    if (editorDataStore.currentMediaType.value === 'image') {
      errors.push({
        platform: 'Youtube',
        message: 'Images are not supported for Youtube posts',
        type: 'error',
      });
    }
  }

  return errors;
};

// Set up watchers to validate whenever relevant data changes
watchEffect(() => {
  // Clear previous errors
  validationErrors.value = [];

  // Run all validation functions and combine results
  // Run all validation functions and combine results
  validationErrors.value = [
    ...validateContentLength(),
    ...validateIsUploading(),
    ...validateTikTok(),
    ...validateInstagram(),
    ...validateYoutube(),
    // Add more validation functions here as needed
  ];
});

// Export a computed property that returns the current validation errors
export const errors = computed(() => validationErrors.value);

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
