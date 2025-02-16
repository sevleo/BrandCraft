import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URL}/posts`,
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

async function createPostBundle(postData: FormData) {
  try {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };

    const response = await axiosInstance.post(
      '/scheduled-posts',
      postData,
      config
    );
    return response.data;
  } catch (error) {
    console.error('Failed to create scheduled post:', error);
    throw error;
  }
}

async function updatePostBundle(id: string, postData: FormData) {
  try {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };
    const response = await axiosInstance.put(
      `/scheduled-posts/${id}`,
      postData,
      config
    );
    return response.data;
  } catch (error) {
    console.error('Failed to update scheduled post:', error);
    throw error;
  }
}

async function getScheduledPosts() {
  try {
    const response = await axiosInstance.get('/scheduled-posts');
    console.log(response.data);
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

async function getScheduledPostsStats() {
  try {
    const response = await axiosInstance.get('/scheduled-posts-stats');
    return response.data;
  } catch (error) {
    console.error('Error getting scheduled posts stats:', error);
    throw error;
  }
}

export {
  createPostBundle,
  getScheduledPosts,
  updatePostBundle,
  deleteScheduledPost,
  getScheduledPostsStats,
};
