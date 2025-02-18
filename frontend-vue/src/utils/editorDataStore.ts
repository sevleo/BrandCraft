import { ref } from 'vue';

type ScheduledPost = {
  _id: string;
  content: string;
  platforms: string[];
  status: 'draft' | 'scheduled';
  scheduledTime: string | null;
  mediaFiles?: { url: string; type: string }[];
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
  posts: [],
  platformSettings: {},
};

const selectedPost = ref<ScheduledPost>(structuredClone(defaultPost));
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
