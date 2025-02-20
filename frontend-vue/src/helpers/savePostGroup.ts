import { savePostGroup as apiSavePostGroup } from '@/api/postApi';
import postsStore from '@/utils/postsStore';
import editorDataStore from '@/utils/editorDataStore';
import router from '@/router';

async function savePostGroup(status: string) {
  // If not on editor, navigate first then reset

  const formData = new FormData();
  formData.append('status', status);

  const newPostGroup = await apiSavePostGroup(formData);

  console.log(newPostGroup);
  await postsStore.getAllPostGroups();
  editorDataStore.reset();
  editorDataStore.selectedPost.value._id = newPostGroup._id;
  router.push('/dashboard/editor');
}

export { savePostGroup };
