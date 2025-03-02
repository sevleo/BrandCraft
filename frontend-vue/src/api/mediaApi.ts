import axios from 'axios';
import editorDataStore from '@/utils/editorDataStore';
import { updatePostGroup } from '@/helpers/savePostGroup';
import postsStore from '@/utils/postsStore';

const axiosInstance = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URL}`,
  withCredentials: true, // Important for sessions to work
});

// Add auth token to requests
axiosInstance.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  if (accessToken && refreshToken) {
    config.headers.authorization = accessToken;
    config.headers.refreshToken = refreshToken;
  }
  return config;
});

export async function uploadVideoToS3(
  file: File,
  onProgress?: (progress: number) => void,
  isSaving?: any
): Promise<string> {
  editorDataStore.uploadProgress.value = 0;
  editorDataStore.processingProgress.value = 0;

  const formData = new FormData();
  formData.append('video', file);
  formData.append('postGroupId', editorDataStore.selectedPost.value?._id);

  isSaving.value = true;
  await postsStore.getAllPostGroups();

  const response = await axiosInstance.post(
    `${import.meta.env.VITE_BACKEND_URL}/media/process-video`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const progress = (progressEvent.loaded / progressEvent.total) * 100;
          editorDataStore.uploadProgress.value = progress;
          if (onProgress) {
            onProgress(progress);
          }
        }
      },
    }
  );

  const { sessionId } = response.data;
  isSaving.value = false;

  // Step 2: Connect to SSE for processing progress
  return new Promise((resolve, reject) => {
    const eventSource = new EventSource(
      `${import.meta.env.VITE_BACKEND_URL}/media/processing-progress/${sessionId}`
    );

    eventSource.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      if (data.percent !== undefined) {
        editorDataStore.processingProgress.value = data.percent;
      }

      if (data.completed) {
        editorDataStore.uploadProgress.value = 100;
        editorDataStore.processingProgress.value = 100;
        eventSource.close();
        await postsStore.getAllPostGroups();
        // Refresh the selected post in editor store with updated data
        const updatedPost = postsStore.postGroups.value.find(
          (post) => post._id === editorDataStore.selectedPost.value?._id
        );
        if (updatedPost) {
          await editorDataStore.selectPost(updatedPost);
        }

        console.log('finished uploading from mediaApi');
        resolve(sessionId);
      }

      if (data.error) {
        eventSource.close();
        reject(new Error(data.error));
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE Error:', err);
      eventSource.close();
      reject(new Error('Processing connection failed'));
    };
  });
}

interface UploadUrlResponse {
  uploadUrl: string;
  key: string;
}

export async function getVideoUploadUrl(
  fileName: string,
  contentType: string
): Promise<UploadUrlResponse> {
  const response = await axiosInstance.post(
    `${import.meta.env.VITE_BACKEND_URL}/media/generate-upload-url`,
    {
      fileName,
      contentType,
    }
  );

  return response.data;
}
