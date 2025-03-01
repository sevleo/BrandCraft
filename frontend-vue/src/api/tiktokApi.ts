import axios from 'axios';
import connectionsDataStore from '@/utils/connectionsDataStore';

const axiosInstance = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URL}/auth/tiktok`,
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

async function connectTikTok() {
  try {
    const response = await axiosInstance.post('/connect');
    return response.data;
  } catch (error) {
    console.error('Failed to initiate TikTok connection:', error);
    throw error;
  }
}

async function getCreatorInfo(platformId: string) {
  try {
    const response = await axiosInstance.post('/get-creator-info', {
      platformId,
    });

    const creatorInfo = response.data.creatorInfo.data;
    connectionsDataStore.tiktokAccount.value!.creatorInfo = creatorInfo;

    return response.data.creatorInfo.data;
  } catch (error) {
    console.error('Failed to get TikTok creator info:', error);
    throw error;
  }
}

export { connectTikTok, getCreatorInfo };
