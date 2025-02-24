import { ref } from 'vue';

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

// ✅ Simple reset
const reset = () => {
  selectedPost.value = structuredClone(defaultPost);
  currentMediaType.value = null;
  isUploading.value = false;
  isUserEdit.value = false;
};

// Select a post without triggering auto-save
const selectPost = (post: any) => {
  isUserEdit.value = false; // Ensure no auto-save triggers
  selectedPost.value = post;
};

export default {
  selectedPost,
  currentMediaType,
  isUploading,
  isUserEdit,
  reset,
  selectPost,
};
