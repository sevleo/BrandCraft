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
  platformSettings?: {
    tiktok?: TikTokSettings;
    instagram?: any;
    youtube?: any;
  };
};

interface TikTokSettings {
  viewerSetting: any;
  allowComments: boolean;
  allowDuet: boolean;
  allowStitch: boolean;
  commercialContent: boolean;
  brandOrganic: boolean;
  brandedContent: boolean;
}

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
  posts: [],
  platformSettings: {},
};

const selectedPost = ref<SelectedPost>(structuredClone(defaultPost));
const selectedDateTime = ref<Date | null>(null);
const currentMediaType = ref<'image' | 'video' | null>(null);
const isUploading = ref<boolean>(false);
const tiktokSettings = ref<TikTokSettings>({
  viewerSetting: {
    label: '',
    val: '',
  },
  allowComments: false,
  allowDuet: false,
  allowStitch: false,
  commercialContent: false,
  brandOrganic: false,
  brandedContent: false,
});

const reset = () => {
  selectedPost.value = structuredClone(defaultPost);
  selectedDateTime.value = null;
  currentMediaType.value = null;
  isUploading.value = false;
  tiktokSettings.value = {
    viewerSetting: {
      label: '',
      val: '',
    },
    allowComments: false,
    allowDuet: false,
    allowStitch: false,
    commercialContent: false,
    brandOrganic: false,
    brandedContent: false,
  };
};

export default {
  selectedPost,
  selectedDateTime,
  currentMediaType,
  isUploading,
  tiktokSettings,
  reset,
};
