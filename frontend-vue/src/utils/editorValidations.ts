import { computed, ref, watchEffect } from 'vue';
import editorDataStore from '@/utils/editorDataStore';
import connectionsDataStore from '@/utils/connectionsDataStore';

// Interface for validation errors
export interface ValidationError {
  platform?: string;
  message: string;
  type: 'error' | 'warning';
}

// Create reactive arrays to hold validation errors and warnings
const validationErrors = ref<ValidationError[]>([]);
const validationWarnings = ref<ValidationError[]>([]);

// Function to validate if content is being uploaded
const validateIsUploading = () => {
  const errors: ValidationError[] = [];

  if (editorDataStore.isUploading.value) {
    errors.push({
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
        connectionsDataStore.tiktokAccount?.value?.creatorInfo
          ?.max_video_post_duration_sec || 900;

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
          'You need to indicate if your content promotes yourself, a third party, or both',
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

const validateScheduledTime = () => {
  const errors: ValidationError[] = [];

  // Check if post is scheduled but no time is set
  if (
    !editorDataStore.selectedPost.value?.scheduledTime ||
    editorDataStore.selectedPost.value?.scheduledTime === ''
  ) {
    errors.push({
      message: 'Scheduled time is required for scheduled posts',
      type: 'error',
    });
  }

  return errors;
};

const validateTwitter = () => {
  const errors: ValidationError[] = [];

  // Check if Twitter is selected
  if (
    editorDataStore.selectedPost.value?.platforms.some((p) =>
      p.startsWith('twitter')
    )
  ) {
    // Check if there's content or media
    const hasContent = editorDataStore.selectedPost.value.content.trim() !== '';
    const hasMedia =
      editorDataStore.selectedPost.value.mediaPreviewUrls.length > 0;

    if (!hasContent && !hasMedia) {
      errors.push({
        platform: 'Twitter/X',
        message: 'Either text content or media is required for Twitter posts',
        type: 'error',
      });
    }

    // Check character limit (280 for Twitter) - as a warning
    const characterCount = editorDataStore.contentStats.value.characterCount;
    if (characterCount > 280) {
      errors.push({
        platform: 'Twitter/X',
        message: `Content exceeds 280 character limit (currently ${characterCount}). If you have Premium, this is fine. If you don't have Premium, the post will fail.`,
        type: 'warning',
      });
    }
  }

  return errors;
};

const validateMastodon = () => {
  const errors: ValidationError[] = [];

  // Check if Mastodon is selected
  if (
    editorDataStore.selectedPost.value?.platforms.some((p) =>
      p.startsWith('mastodon')
    )
  ) {
    // Check if there's content or media
    const hasContent = editorDataStore.selectedPost.value.content.trim() !== '';
    const hasMedia =
      editorDataStore.selectedPost.value.mediaPreviewUrls.length > 0;

    if (!hasContent && !hasMedia) {
      errors.push({
        platform: 'Mastodon',
        message: 'Either text content or media is required for Mastodon posts',
        type: 'error',
      });
    }

    // Check character limit for Mastodon (500 characters)
    const characterCount = editorDataStore.contentStats.value.characterCount;
    if (characterCount > 500) {
      errors.push({
        platform: 'Mastodon',
        message: `Content exceeds 500 character limit (currently ${characterCount})`,
        type: 'error',
      });
    }
  }

  return errors;
};

const validateBluesky = () => {
  const errors: ValidationError[] = [];

  // Check if Bluesky is selected
  if (
    editorDataStore.selectedPost.value?.platforms.some((p) =>
      p.startsWith('bluesky')
    )
  ) {
    // Check if there's content or media
    const hasContent = editorDataStore.selectedPost.value.content.trim() !== '';
    const hasMedia =
      editorDataStore.selectedPost.value.mediaPreviewUrls.length > 0;

    if (!hasContent && !hasMedia) {
      errors.push({
        platform: 'Bluesky',
        message: 'Either text content or media is required for Bluesky posts',
        type: 'error',
      });
    }

    // Check character limit for Bluesky (300 characters)
    const characterCount = editorDataStore.contentStats.value.characterCount;
    if (characterCount > 300) {
      errors.push({
        platform: 'Bluesky',
        message: `Content exceeds 300 character limit (currently ${characterCount})`,
        type: 'error',
      });
    }
  }

  return errors;
};

const validateThreads = () => {
  const errors: ValidationError[] = [];

  // Check if Threads is selected
  if (
    editorDataStore.selectedPost.value?.platforms.some((p) =>
      p.startsWith('threads')
    )
  ) {
    // Check if there's content or media
    const hasContent = editorDataStore.selectedPost.value.content.trim() !== '';
    const hasMedia =
      editorDataStore.selectedPost.value.mediaPreviewUrls.length > 0;

    if (!hasContent && !hasMedia) {
      errors.push({
        platform: 'Threads',
        message: 'Either text content or media is required for Threads posts',
        type: 'error',
      });
    }

    // Check character limit for Threads (500 characters)
    const characterCount = editorDataStore.contentStats.value.characterCount;
    if (characterCount > 500) {
      errors.push({
        platform: 'Threads',
        message: `Content exceeds 500 character limit (currently ${characterCount})`,
        type: 'error',
      });
    }
  }

  return errors;
};

const validatePlatformSelection = () => {
  const errors: ValidationError[] = [];

  // Check if platforms array exists and has at least one item
  if (
    !editorDataStore.selectedPost.value?.platforms ||
    editorDataStore.selectedPost.value.platforms.length === 0
  ) {
    errors.push({
      message: 'Please select at least one platform to post to',
      type: 'error',
    });
  }

  return errors;
};

// Helper function to deduplicate validation errors
const deduplicateErrors = (errors: ValidationError[]): ValidationError[] => {
  // Use a Map to track unique error messages per platform
  const uniqueErrors = new Map<string, ValidationError>();

  errors.forEach((error) => {
    // Create a unique key based on platform and message
    const key = `${error.platform}:${error.message}`;

    // Only add the error if we haven't seen this exact error before
    if (!uniqueErrors.has(key)) {
      uniqueErrors.set(key, error);
    }
  });

  // Convert the Map values back to an array
  return Array.from(uniqueErrors.values());
};

// Set up watchers to validate whenever relevant data changes
watchEffect(() => {
  // Clear previous errors and warnings
  validationErrors.value = [];
  validationWarnings.value = [];

  // Run all validation functions and combine results
  const allValidations = [
    ...validateIsUploading(),
    ...validateTikTok(),
    ...validateInstagram(),
    ...validateYoutube(),
    ...validateScheduledTime(),
    ...validateTwitter(),
    ...validateMastodon(),
    ...validateBluesky(),
    ...validateThreads(),
    ...validatePlatformSelection(),
    // Add more validation functions here as needed
  ];

  // Separate errors and warnings
  const errors = allValidations.filter(
    (validation) => validation.type === 'error'
  );
  const warnings = allValidations.filter(
    (validation) => validation.type === 'warning'
  );

  // Deduplicate errors and warnings before assigning
  validationErrors.value = deduplicateErrors(errors);
  validationWarnings.value = deduplicateErrors(warnings);
});

// Export computed properties that return the current validation errors and warnings
export const errors = computed(() => validationErrors.value);
export const warnings = computed(() => validationWarnings.value);
