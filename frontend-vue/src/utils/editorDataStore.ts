import { ref, watch } from 'vue';

type ScheduledPost = {
  _id: string;
  content: string;
  platforms: string[];
  status: 'draft' | 'scheduled';
  scheduledTime: string | null;
  mediaFiles?: { url: string; type: string }[];
  mediaPreviewUrls: string[];
  initialMediaUrls: string[];
  posts?: any[];
  platformSettings?: {
    tiktok?: any;
    instagram?: any;
    youtube?: any;
  };
};

const defaultPost: ScheduledPost = {
  _id: 'new',
  content: '',
  platforms: [],
  status: 'draft',
  scheduledTime: null,
  mediaFiles: [],
  mediaPreviewUrls: [],
  initialMediaUrls: [],
  posts: [],
  platformSettings: {},
};

const selectedPost = ref<ScheduledPost>(structuredClone(defaultPost));
const selectedDateTime = ref<Date | null>(null);

const reset = () => {
  console.log('reset');
  selectedPost.value = structuredClone(defaultPost);
  selectedDateTime.value = null;
};

watch(
  () => selectedDateTime.value,
  (newDate) => {
    console.log('selectedDateTime changed:', newDate);
  }
);

export default {
  selectedPost,
  selectedDateTime,
  reset,
};
