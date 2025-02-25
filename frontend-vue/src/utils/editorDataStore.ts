import { ref } from 'vue';
import { getCreatorInfo } from '@/api/tiktokApi';

type SelectedPost = {
  _id: string;
  content: string;
  platforms: string[];
  status: 'draft' | 'scheduled';
  scheduledTime: string | null;
  mediaFiles: { url: string; type: 'image' | 'video' }[];
  mediaPreviewUrls: string[];
  initialMediaUrls: string[];
  videoTimestamp: number;
  posts?: any[];
  platformSettings: {
    tiktok?: TikTokSettings;
    instagram?: InstagramSettings;
    youtube?: YoutubeSettings;
  };
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
  initialMediaUrls: [],
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
};

// Reactive references
const selectedPost = ref<SelectedPost>(structuredClone(defaultPost));
const currentMediaType = ref<'image' | 'video' | null>(null);
const isUploading = ref<boolean>(false);
const isUserEdit = ref<boolean>(false);
const selectedMedia = ref<File[]>([]); // this is newly selected media
const uploadProgress = ref<number>(0);

// ✅ Simple reset
const reset = () => {
  selectedPost.value = structuredClone(defaultPost);
  currentMediaType.value = null;
  isUploading.value = false;
  isUserEdit.value = false;
  selectedMedia.value = [];
  uploadProgress.value = 0;
};

// Select a post without triggering auto-save
const selectPost = async (post: any) => {
  isUserEdit.value = false; // Ensure no auto-save triggers
  selectedPost.value = post;

  // Initialize media URLs with proper null checks
  selectedPost.value.initialMediaUrls = selectedPost.value.mediaFiles.map(
    (file: any) => file.url
  );
  selectedPost.value.mediaPreviewUrls = selectedPost.value.mediaFiles.map(
    (file: any) => file.url
  );

  // Set currentMediaType based on first media file
  if (
    selectedPost.value.mediaFiles &&
    selectedPost.value.mediaFiles.length > 0
  ) {
    currentMediaType.value = selectedPost.value.mediaFiles[0].type as
      | 'image'
      | 'video';
  } else {
    currentMediaType.value = null;
  }

  // get creatorInfo for TikTok
  const tiktokPlatform = selectedPost.value?.platforms?.find((p: any) =>
    p.startsWith('tiktok')
  );
  if (tiktokPlatform) {
    await getCreatorInfo(tiktokPlatform.split('-').slice(1).join('-'));
  }

  console.log(selectedPost.value);
};

export default {
  selectedPost,
  currentMediaType,
  isUploading,
  isUserEdit,
  selectedMedia,
  uploadProgress,
  reset,
  selectPost,
};
