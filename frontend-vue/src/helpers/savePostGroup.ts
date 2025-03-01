import { apiSavePostGroup } from '@/api/postApi';
import postsStore from '@/utils/postsStore';
import editorDataStore from '@/utils/editorDataStore';
import router from '@/router';
import { errors } from '@/utils/editorValidations';

async function createPostGroup(scheduledTime: string) {
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
  if (editorDataStore.selectedPost.value?._id) {
    editorDataStore.updateTimestamps(editorDataStore.selectedPost.value._id);
    editorDataStore.selectedPost.value.scheduledTime = scheduledTime;
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

  // If there are validation errors, force the post to draft status
  if (errors.value.length > 0) {
    formData.append('status', 'draft');
  } else {
    formData.append('status', editorDataStore.selectedPost.value?.status);
  }

  // Save the post ID before saving
  const postId = editorDataStore.selectedPost.value?._id;

  await apiSavePostGroup(formData, postId);

  // Refresh the post groups
  await postsStore.getAllPostGroups();

  // Update just the timestamp fields without affecting other properties
  if (editorDataStore.selectedPost.value?._id) {
    editorDataStore.updateTimestamps(editorDataStore.selectedPost.value._id);
  }

  // Store the original status
  const originalStatus = editorDataStore.selectedPost.value?.status;

  // Track if status was changed due to validation errors
  let statusChangedDueToErrors = false;

  if (errors.value.length > 0) {
    // If the post was previously scheduled, update it to draft in the UI as well
    if (editorDataStore.selectedPost.value && originalStatus === 'scheduled') {
      // Update the status in the UI immediately
      editorDataStore.selectedPost.value.status = 'draft';
      statusChangedDueToErrors = true;
    }
  }

  // Return whether the status was changed due to validation errors
  return statusChangedDueToErrors;
}

export { createPostGroup, updatePostGroup };
