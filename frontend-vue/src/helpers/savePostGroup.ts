import { apiSavePostGroup } from '@/api/postApi';
import postsStore from '@/utils/postsStore';
import editorDataStore from '@/utils/editorDataStore';
import router from '@/router';

async function createPostGroup() {
  // If not on editor, navigate first then reset

  const formData = new FormData();
  formData.append('status', 'draft');

  const newPostGroup = await apiSavePostGroup(formData);

  console.log(newPostGroup);
  await postsStore.getAllPostGroups();
  editorDataStore.reset();
  editorDataStore.selectedPost.value._id = newPostGroup._id;
  router.push('/dashboard/editor');
  console.log(editorDataStore.selectedPost.value);

  // Update just the timestamp fields without affecting other properties
  if (editorDataStore.selectedPost.value?._id) {
    editorDataStore.updateTimestamps(editorDataStore.selectedPost.value._id);
  }
}

async function updatePostGroup(selectedMedia: File[]) {
  const keptMediaUrls =
    editorDataStore.selectedPost.value?.mediaPreviewUrls?.filter((url) =>
      editorDataStore.selectedPost.value?.initialMediaUrls?.includes(url)
    );

  const formData = new FormData();

  // Add common post details
  formData.append('content', editorDataStore.selectedPost.value?.content || '');

  // Always send scheduledTime, even if null
  formData.append(
    'scheduledTime',
    editorDataStore.selectedPost.value?.scheduledTime || ''
  );

  if (editorDataStore.selectedPost.value?.platforms) {
    formData.append(
      'platforms',
      JSON.stringify(editorDataStore.selectedPost.value?.platforms)
    );
  }

  if (keptMediaUrls) {
    formData.append('keptMediaUrls', JSON.stringify(keptMediaUrls));
  }

  if (editorDataStore.currentMediaType.value === 'image') {
    selectedMedia.forEach((file) => {
      formData.append('media', file);
    });
  }

  if (editorDataStore.selectedPost.value?.platformSettings) {
    formData.append(
      'platformSettings',
      JSON.stringify(editorDataStore.selectedPost.value?.platformSettings)
    );
  }

  if (editorDataStore.selectedPost.value?.videoTimestamp) {
    formData.append(
      'videoTimestamp',
      editorDataStore.selectedPost.value?.videoTimestamp.toString()
    );
  }

  formData.append('sameContent', 'true');
  formData.append('status', editorDataStore.selectedPost.value?.status);

  await apiSavePostGroup(formData, editorDataStore.selectedPost.value?._id);

  await postsStore.getAllPostGroups();

  // Update just the timestamp fields without affecting other properties
  if (editorDataStore.selectedPost.value?._id) {
    editorDataStore.updateTimestamps(editorDataStore.selectedPost.value._id);
  }
}

export { createPostGroup, updatePostGroup };
