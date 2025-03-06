import { apiSavePostGroup } from '@/api/postApi';
import postsStore from '@/utils/postsStore';
import editorDataStore from '@/utils/editorDataStore';
import router from '@/router';

async function createPostGroup(scheduledTime?: string) {
  // If not on editor, navigate first then reset

  const formData = new FormData();
  formData.append('status', 'draft');
  if (scheduledTime) formData.append('scheduledTime', scheduledTime);

  const newPostGroup = await apiSavePostGroup(formData);

  await postsStore.getAllPostGroups();
  editorDataStore.reset();
  editorDataStore.selectedPost.value._id = newPostGroup._id;
  router.push('/dashboard/editor');

  // Update just the timestamp fields without affecting other properties
  if (editorDataStore.selectedPost.value?._id && scheduledTime) {
    editorDataStore.updateTimestamps(editorDataStore.selectedPost.value._id);
    editorDataStore.selectedPost.value.scheduledTime = scheduledTime;
  }
}

async function updatePostGroup() {
  const postId = editorDataStore.selectedPost.value?._id;
  if (!postId) {
    console.error('No post ID available');
    return false;
  }

  // Step 3: Update the post group data
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

  formData.append('status', editorDataStore.selectedPost.value.status);

  await apiSavePostGroup(formData, postId);
  editorDataStore.isSaving.value = false;

  // Refresh the post groups
  await postsStore.getAllPostGroups();

  // Update just the timestamp fields without affecting other properties
  if (editorDataStore.selectedPost.value?._id) {
    editorDataStore.updateTimestamps(editorDataStore.selectedPost.value._id);
  }
}

export { createPostGroup, updatePostGroup };
