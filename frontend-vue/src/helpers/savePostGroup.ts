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
}

async function updatePostGroup(
  videoS3Key: string | null,
  selectedMedia: File[]
) {
  const keptMediaUrls =
    editorDataStore.selectedPost.value.mediaPreviewUrls.filter((url) =>
      editorDataStore.selectedPost.value.initialMediaUrls.includes(url)
    );

  const formData = new FormData();

  // Add common post details
  if (editorDataStore.selectedPost.value?.content) {
    formData.append(
      'content',
      editorDataStore.selectedPost.value?.content || ''
    );
  }

  if (editorDataStore.selectedDateTime.value) {
    formData.append(
      'scheduledTime',
      editorDataStore.selectedDateTime.value?.toISOString() || ''
    );
  }

  if (editorDataStore.selectedPost.value?.platforms) {
    formData.append(
      'platforms',
      JSON.stringify(editorDataStore.selectedPost.value?.platforms)
    );
  }

  if (keptMediaUrls) {
    formData.append('keptMediaUrls', JSON.stringify(keptMediaUrls));
  }

  if (editorDataStore.currentMediaType.value === 'video' && videoS3Key) {
    formData.append('videoS3Key', videoS3Key);
  }

  if (editorDataStore.currentMediaType.value === 'image') {
    selectedMedia.forEach((file) => {
      formData.append('media', file);
    });
  }

  console.log(editorDataStore.selectedPost.value);
  if (editorDataStore.selectedPost.value?.platformSettings) {
    formData.append(
      'platformSettings',
      JSON.stringify(editorDataStore.selectedPost.value?.platformSettings)
    );
  }

  //   if (
  //     editorDataStore.selectedPost.value?.platforms.some((p) =>
  //       p.startsWith('instagram')
  //     )
  //   ) {
  //     formData.append(
  //       'instagramSettings',
  //       JSON.stringify({
  //         videoType: instagramSettings.value.videoType,
  //       })
  //     );
  //   }

  //   if (
  //     editorDataStore.selectedPost.value?.platforms.some((p) =>
  //       p.startsWith('youtube')
  //     )
  //   ) {
  //     formData.append(
  //       'youtubeSettings',
  //       JSON.stringify({
  //         privacy: youtubeSettings.value.privacy,
  //         title: youtubeSettings.value.title,
  //       })
  //     );
  //   }

  if (editorDataStore.selectedPost.value?.videoTimestamp) {
    formData.append(
      'videoTimestamp',
      editorDataStore.selectedPost.value?.videoTimestamp.toString()
    );
  }

  formData.append('sameContent', 'true');
  formData.append('status', 'draft');

  await apiSavePostGroup(formData, editorDataStore.selectedPost.value?._id);

  await postsStore.getAllPostGroups();
}

export { createPostGroup, updatePostGroup };
