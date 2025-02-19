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
    tiktok?: any;
    instagram?: any;
    youtube?: any;
  };
};

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

const reset = () => {
  selectedPost.value = structuredClone(defaultPost);
  selectedDateTime.value = null;
};

export default {
  selectedPost,
  selectedDateTime,
  reset,
};
