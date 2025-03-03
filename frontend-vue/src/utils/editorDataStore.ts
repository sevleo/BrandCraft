import { ref, watch, computed } from 'vue';
import { getCreatorInfo } from '@/api/tiktokApi';
import postsStore from './postsStore';

type SelectedPost = {
  _id: string;
  content: string;
  platforms: string[];
  status:
    | 'draft'
    | 'scheduled'
    | 'published'
    | 'partially_published'
    | 'failed';
  scheduledTime: string | null;
  mediaFiles: { url: string; type: 'image' | 'video' }[];
  mediaPreviewUrls: string[];
  videoTimestamp: number;
  posts?: any[];
  platformSettings: {
    tiktok?: TikTokSettings;
    instagram?: InstagramSettings;
    youtube?: YoutubeSettings;
  };
  createdAt: string;
  updatedAt: string;
};

interface TikTokSettings {
  viewerSetting: string;
  allowComments: boolean;
  allowDuet: boolean;
  allowStitch: boolean;
  commercialContent: boolean;
  brandOrganic: boolean;
  brandedContent: boolean;
}

interface InstagramSettings {
  videoType: 'REELS' | 'STORIES';
}

interface YoutubeSettings {
  privacy: 'private' | 'public' | 'unlisted';
  title: string;
}

// Default post template
const defaultPost: SelectedPost = {
  _id: '',
  content: '',
  platforms: [],
  status: 'draft',
  scheduledTime: null,
  mediaFiles: [],
  mediaPreviewUrls: [],
  videoTimestamp: 0,
  posts: [],
  platformSettings: {
    tiktok: {
      viewerSetting: '',
      allowComments: true,
      allowDuet: false,
      allowStitch: false,
      commercialContent: false,
      brandOrganic: false,
      brandedContent: false,
    },
    instagram: {
      videoType: 'REELS',
    },
    youtube: {
      privacy: 'public',
      title: '',
    },
  },
  createdAt: '',
  updatedAt: '',
};

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Reactive references
const selectedPost = ref<SelectedPost>(structuredClone(defaultPost));
const currentMediaType = ref<'image' | 'video' | null>(null);
const isUploading = ref<boolean>(false);
const isUserEdit = ref<boolean>(false);
const selectedMedia = ref<File[]>([]); // this is newly selected media
const filesToDelete = ref<string[]>([]); // track files to delete
const uploadProgress = ref<number>(0);
const processingProgress = ref<number>(0);
const isPanelVisible = ref<boolean>(true); // Track right panel visibility
const viewMode = ref(localStorage.getItem('postFormViewMode') || 'compact');
const isSaving = ref(false);
const videoRef = ref<HTMLVideoElement | null>(null);
const videoDuration = ref<string>('');
const videoDurationSeconds = ref<number | null>(null);

// Update video duration when videoRef changes
watch(
  videoRef,
  (newVideo) => {
    if (newVideo && newVideo.readyState >= 1) {
      // Video is already loaded
      updateVideoDuration(newVideo);
    }

    if (newVideo) {
      // Add event listener for when metadata loads
      newVideo.addEventListener('loadedmetadata', () => {
        updateVideoDuration(newVideo);
      });
    }
  },
  { immediate: true }
);

// Function to update video duration
const updateVideoDuration = (video: HTMLVideoElement) => {
  if (video && !isNaN(video.duration)) {
    videoDurationSeconds.value = video.duration;
    videoDuration.value = formatTime(video.duration);
  }
};

// Video metadata
const videoMetadata = computed(() => {
  if (!videoRef?.value) return null;

  return {
    duration: videoDuration.value,
  };
});

// Computed properties for content statistics
const contentStats = computed(() => {
  const content = selectedPost.value?.content || '';

  // More accurate character count that properly handles emojis
  const characterCount = getAccurateCharacterCount(content);

  // Word count (split by whitespace and filter out empty strings)
  const wordCount = content
    .split(/\s+/)
    .filter((word) => word.length > 0).length;

  // Calculate reading time (average reading speed is ~200-250 words per minute)
  const wordsPerMinute = 160;
  const readingTimeRaw = wordCount / wordsPerMinute;

  // Format reading time
  let readingTime: string;

  if (readingTimeRaw < 1 / 60) {
    // Less than 1 second
    readingTime = '0 sec read';
  } else if (readingTimeRaw < 1) {
    // Less than 1 minute, show seconds
    const seconds = Math.ceil(readingTimeRaw * 60);
    readingTime = `${seconds} sec read`;
  } else {
    // 1 minute or more
    const minutes = Math.ceil(readingTimeRaw);
    readingTime = minutes === 1 ? '1 min read' : `${minutes} min read`;
  }

  return {
    characterCount,
    wordCount,
    readingTime,
  };
});

// Watch for changes to viewMode and save to localStorage
watch(viewMode, (newValue) => {
  localStorage.setItem('postFormViewMode', newValue);
});

// ✅ Simple reset
const reset = () => {
  selectedPost.value = structuredClone(defaultPost);
  currentMediaType.value = null;
  isUploading.value = false;
  isUserEdit.value = false;
  selectedMedia.value = [];
  filesToDelete.value = [];
  uploadProgress.value = 0;
  processingProgress.value = 0;
  isPanelVisible.value = true;
};

// Select a post without triggering auto-save
const selectPost = async (post: any) => {
  if (post) {
    // Reset video-related state when switching posts
    videoRef.value = null;
    videoDuration.value = '';
    videoDurationSeconds.value = null;

    isUserEdit.value = false; // Ensure no auto-save triggers

    // Set the post first
    selectedPost.value = post;

    // Initialize media URLs with proper null checks
    if (
      selectedPost.value.mediaFiles &&
      selectedPost.value.mediaFiles.length > 0
    ) {
      selectedPost.value.mediaPreviewUrls = selectedPost.value.mediaFiles.map(
        (file: any) => file.url
      );

      // Set currentMediaType based on first media file
      currentMediaType.value = selectedPost.value.mediaFiles[0].type as
        | 'image'
        | 'video';
    } else {
      selectedPost.value.mediaPreviewUrls = [];
      currentMediaType.value = null;
    }

    // get creatorInfo for TikTok
    const tiktokPlatform = selectedPost.value?.platforms?.find((p: any) =>
      p.startsWith('tiktok')
    );
    if (tiktokPlatform) {
      await getCreatorInfo(tiktokPlatform.split('-').slice(1).join('-'));
    }

    if (videoRef.value) {
      videoDuration.value = formatTime(
        (videoRef.value as HTMLVideoElement).duration
      );
    }

    // Refresh the current post data after selection to ensure we have the latest data
    await refreshCurrentPost();
  }
};

// Update just the timestamp fields without affecting other properties
const updateTimestamps = (postId: string) => {
  // Find the post in postsStore to get the latest timestamps
  const refreshedPost = postsStore.postGroups.value.find(
    (group) => group._id === postId
  );

  if (refreshedPost && selectedPost.value) {
    selectedPost.value.createdAt = refreshedPost.createdAt;
    selectedPost.value.updatedAt = refreshedPost.updatedAt;
  }
};

// Refresh the current post data after media operations
const refreshCurrentPost = async () => {
  if (!selectedPost.value?._id) return;

  // Refresh all posts to get the latest data
  await postsStore.getAllPostGroups();

  // Find the current post in the refreshed data
  const refreshedPost = postsStore.postGroups.value.find(
    (group) => group._id === selectedPost.value._id
  );

  if (refreshedPost) {
    // Preserve important local state
    const currentContent = selectedPost.value.content;
    const currentStatus = selectedPost.value.status;

    // Update the entire post with the refreshed data
    selectedPost.value = JSON.parse(JSON.stringify(refreshedPost));

    // Restore important local state if needed
    if (currentContent) selectedPost.value.content = currentContent;
    if (currentStatus) selectedPost.value.status = currentStatus;

    // Ensure the mediaPreviewUrls are properly set
    if (
      selectedPost.value.mediaFiles &&
      selectedPost.value.mediaFiles.length > 0
    ) {
      selectedPost.value.mediaPreviewUrls = selectedPost.value.mediaFiles.map(
        (file: any) => file.url
      );

      // Set currentMediaType based on first media file
      currentMediaType.value = selectedPost.value.mediaFiles[0].type as
        | 'image'
        | 'video';
    } else {
      selectedPost.value.mediaPreviewUrls = [];
      currentMediaType.value = null;
    }
  } else {
    console.warn(
      'Could not find refreshed post with ID:',
      selectedPost.value._id
    );
  }
};

export default {
  selectedPost,
  currentMediaType,
  isUploading,
  isUserEdit,
  selectedMedia,
  filesToDelete,
  uploadProgress,
  processingProgress,
  isPanelVisible,
  viewMode,
  isSaving,
  videoRef,
  videoDuration,
  videoDurationSeconds,
  videoMetadata,
  contentStats,
  reset,
  selectPost,
  updateTimestamps,
  refreshCurrentPost,
  getAccurateCharacterCount,
};

/**
 * Gets an accurate character count that properly handles emojis and special characters
 * Many social media platforms count emojis as multiple characters
 * @param text The text to count characters in
 * @returns The character count
 */
function getAccurateCharacterCount(text: string): number {
  if (!text) return 0;

  // Process URLs (most platforms count URLs as fixed length)
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  let processedText = text;
  const urls = text.match(urlRegex) || [];

  // Count characters with special handling for emojis
  let count = 0;

  // Convert string to array of code points
  const codePoints = [...processedText];

  for (let i = 0; i < codePoints.length; i++) {
    const char = codePoints[i];

    // Check if it's a URL and skip (we'll add fixed counts for URLs later)
    if (urls.some((url) => processedText.indexOf(url, count) === count)) {
      const url = urls.find(
        (url) => processedText.indexOf(url, count) === count
      )!;
      count += 23; // Standard t.co URL length for Twitter
      i += url.length - 1;
      continue;
    }

    // Check if it's an emoji (most emojis are in the Supplementary Multilingual Plane or higher)
    const codePoint = char.codePointAt(0) || 0;

    // Emoji ranges
    const isEmoji =
      (codePoint >= 0x1f000 && codePoint <= 0x1ffff) || // Emoticons, transport & map symbols, etc.
      (codePoint >= 0x2600 && codePoint <= 0x27bf) || // Miscellaneous symbols
      (codePoint >= 0x2b50 && codePoint <= 0x2b55) || // Star symbols
      (codePoint >= 0x2700 && codePoint <= 0x27bf) || // Dingbats
      (codePoint >= 0x3030 && codePoint <= 0x303d) || // CJK symbols
      (codePoint >= 0x3297 && codePoint <= 0x3299) || // Japanese symbols
      codePoint === 0x00a9 || // Copyright
      codePoint === 0x00ae; // Registered trademark

    if (isEmoji) {
      count += 2; // Most platforms count emojis as 2 characters
    } else {
      count += 1; // Regular character
    }
  }

  return count;
}
