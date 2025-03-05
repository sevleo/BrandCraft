import axios from 'axios';
import editorDataStore from '@/utils/editorDataStore';
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
  isSaving?: { value: boolean }
): Promise<string> {
  editorDataStore.uploadProgress.value = 0;
  editorDataStore.processingProgress.value = 0;

  const formData = new FormData();
  formData.append('video', file);
  formData.append('postGroupId', editorDataStore.selectedPost.value?._id);

  if (isSaving) {
    isSaving.value = true;
  }
  
  const response = await axiosInstance.post(
    `${import.meta.env.VITE_BACKEND_URL}/media/process-video`,
    formData
  );

  const { sessionId } = response.data;

  // Step 2: Connect to WebSocket for processing progress
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(
      `${import.meta.env.VITE_BACKEND_URL}/media/processing-progress/${sessionId}`
    );

    socket.onopen = () => {
      console.log('WebSocket connection established');
    };

    socket.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      if (data.percent !== undefined) {
        editorDataStore.processingProgress.value = data.percent;
      }

      if (data.completed) {
        editorDataStore.uploadProgress.value = 100;
        editorDataStore.processingProgress.value = 100;
        socket.close();
        await postsStore.getAllPostGroups();
        resolve(sessionId);
      }

      if (data.error) {
        socket.close();
        reject(new Error(data.error));
      }
    };

    socket.onerror = (err) => {
      console.error('WebSocket Error:', err);
      socket.close();
      reject(new Error('Processing connection failed'));
    };

    setTimeout(() => {
      if (editorDataStore.processingProgress.value === 0) {
        console.warn('No WebSocket progress received, assuming connection failed.');
        socket.close();
        reject(new Error('Processing connection failed: No updates.'));
      }
    }, 5000);
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
