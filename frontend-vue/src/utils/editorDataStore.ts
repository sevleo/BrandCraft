import { ref, reactive, watch } from 'vue';

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
  viewerSetting: { label: string; val: string };
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

// Use reactive for tiktokSettings
const tiktokSettings = reactive<TikTokSettings>({
  viewerSetting: { label: '', val: '' },
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

  // Reset tiktokSettings reactively
  Object.assign(tiktokSettings, {
    viewerSetting: { label: '', val: '' },
    allowComments: false,
    allowDuet: false,
    allowStitch: false,
    commercialContent: false,
    brandOrganic: false,
    brandedContent: false,
  });
};

//
// Watcher to sync tiktokSettings with selectedPost
//
watch(
  () => selectedPost.value,
  () => {
    if (selectedPost.value?.posts) {
      const tiktokPost = selectedPost.value.posts.find(
        (post: any) => post.platform === 'tiktok'
      );

      if (tiktokPost?.platformSettings?.tiktok) {
        const viewerSettingRaw =
          tiktokPost.platformSettings.tiktok.viewerSetting;

        const viewerSetting =
          typeof viewerSettingRaw === 'string'
            ? { label: viewerSettingRaw, val: viewerSettingRaw }
            : viewerSettingRaw || { label: '', val: '' };

        // Use Object.assign to update reactive object
        Object.assign(tiktokSettings, {
          viewerSetting,
          allowComments:
            tiktokPost.platformSettings.tiktok.allowComments || false,
          allowDuet: tiktokPost.platformSettings.tiktok.allowDuet || false,
          allowStitch: tiktokPost.platformSettings.tiktok.allowStitch || false,
          commercialContent:
            tiktokPost.platformSettings.tiktok.commercialContent || false,
          brandOrganic:
            tiktokPost.platformSettings.tiktok.brandOrganic || false,
          brandedContent:
            tiktokPost.platformSettings.tiktok.brandedContent || false,
        });
      } else {
        // Reset if no tiktok post found
        Object.assign(tiktokSettings, {
          viewerSetting: { label: '', val: '' },
          allowComments: false,
          allowDuet: false,
          allowStitch: false,
          commercialContent: false,
          brandOrganic: false,
          brandedContent: false,
        });
      }

      console.log('Synced tiktokSettings:', tiktokSettings);
    }
  },
  { immediate: true, deep: true }
);

export default {
  selectedPost,
  selectedDateTime,
  currentMediaType,
  isUploading,
  tiktokSettings,
  reset,
};
