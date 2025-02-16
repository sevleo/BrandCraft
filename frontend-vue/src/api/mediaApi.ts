import axios from 'axios';

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

export async function uploadVideoToS3(
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  // Check if the file is a MOV video
  if (
    file.type === 'video/quicktime' ||
    file.name.toLowerCase().endsWith('.mov')
  ) {
    // For MOV files, send to backend for processing
    const formData = new FormData();
    formData.append('video', file);

    const response = await axiosInstance.post(
      `${import.meta.env.VITE_BACKEND_URL}/media/process-video`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const progress = (progressEvent.loaded / progressEvent.total) * 100;
            onProgress(progress);
          }
          console.log(progressEvent);
        },
      }
    );

    return response.data.key;
  }

  // For non-MOV files, proceed with direct S3 upload
  const { uploadUrl, key } = await getVideoUploadUrl(file.name, file.type);

  console.log(uploadUrl);
  console.log(key);

  await axios.put(uploadUrl, file, {
    headers: {
      'Content-Type': file.type,
    },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onProgress) {
        const progress = (progressEvent.loaded / progressEvent.total) * 100;
        onProgress(progress);
      }
    },
  });

  return key;
}
