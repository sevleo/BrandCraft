import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URL}/auth/bluesky`,
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

interface BlueskyCredentials {
  identifier: string;
  password: string;
}

async function connectBluesky(credentials: BlueskyCredentials) {
  try {
    const response = await axiosInstance.post('/connect', credentials);
    return response.data;
  } catch (error) {
    console.error('Failed to connect Bluesky account:', error);
    throw error;
  }
}

export { connectBluesky };
