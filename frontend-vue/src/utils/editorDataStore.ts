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
  platformSettings: {
    tiktok?: TikTokSettings;
    instagram?: InstagramSettings;
    youtube?: YoutubeSettings;
  };
};

interface TikTokSettings {
  viewerSetting: { label: string; val: string };
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
  _id: 'new',
  content: '',
  platforms: [],
  status: 'draft',
  scheduledTime: null,
  mediaFiles: [],
  mediaPreviewUrls: [],
  initialMediaUrls: [],
  videoTimestamp: 0,
  platformSettings: {},
};

// Reactive references
const selectedPost = ref<SelectedPost>(structuredClone(defaultPost));
const selectedDateTime = ref<Date | null>(null);
const currentMediaType = ref<'image' | 'video' | null>(null);
const isUploading = ref<boolean>(false);

// ✅ Simple reset
const reset = () => {
  selectedPost.value = structuredClone(defaultPost);
  selectedDateTime.value = null;
  currentMediaType.value = null;
  isUploading.value = false;
};

export default {
  selectedPost,
  selectedDateTime,
  currentMediaType,
  isUploading,
  reset,
};
