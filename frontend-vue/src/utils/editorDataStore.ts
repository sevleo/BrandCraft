import { ref } from 'vue';

const selectedPost = ref<any | null>(null);
const selectedDateTime = ref<Date | null>(null);

export default {
  selectedPost,
  selectedDateTime,
};
