import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URL}/posts`,
  withCredentials: true, // Important for sessions to work
});

const mediaAxiosInstance = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URL}/media`,
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

// Add auth token to media requests
mediaAxiosInstance.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  if (accessToken && refreshToken) {
    config.headers.authorization = accessToken;
    config.headers.refreshToken = refreshToken;
  }
  return config;
});

async function apiSavePostGroup(postData: FormData, id?: string) {
  try {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };

    let response;
    if (id) {
      response = await axiosInstance.put(`/update/${id}`, postData, config);
    } else {
      response = await axiosInstance.post('/create', postData, config);
    }

    return response.data.postGroup;
  } catch (error) {
    console.error('API Error:', error?.response?.data || error);
    throw error;
  }
}

async function getPostGroups() {
  try {
    const response = await axiosInstance.get('/scheduled-posts');
    return response.data;
  } catch (error) {
    console.error('Failed to get scheduled posts:', error);
    throw error;
  }
}

async function deleteScheduledPost(id: string) {
  try {
    const response = await axiosInstance.delete(`/scheduled-posts/${id}`);
    return response.data;
  } catch (error) {
    console.error('Failed to delete scheduled post:', error);
    throw error;
  }
}

async function getPostsStats() {
  try {
    const response = await axiosInstance.get('/scheduled-posts-stats');
    return response.data;
  } catch (error) {
    console.error('Error getting scheduled posts stats:', error);
    throw error;
  }
}

async function uploadMedia(postGroupId: string, mediaFiles: File[]) {
  try {
    const formData = new FormData();
    mediaFiles.forEach((file) => {
      formData.append('media', file);
    });

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };

    const response = await mediaAxiosInstance.post(
      `/post/${postGroupId}/upload`,
      formData,
      config
    );
    return response.data.mediaFiles;
  } catch (error) {
    console.error('Failed to upload media:', error);
    throw error;
  }
}

async function deleteMedia(mediaId: string) {
  try {
    const response = await mediaAxiosInstance.delete(`/post/media/${mediaId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to delete media:', error);
    throw error;
  }
}

export { 
  apiSavePostGroup, 
  getPostGroups, 
  deleteScheduledPost, 
  getPostsStats,
  uploadMedia,
  deleteMedia
};
