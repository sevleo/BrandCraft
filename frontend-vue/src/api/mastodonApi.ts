import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URL}/auth/mastodon`,
  withCredentials: true,
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

async function connectMastodon() {
  try {
    const response = await axiosInstance.get('/connect');
    return response.data;
  } catch (error: any) {
    console.error('Error connecting Mastodon:', error);
    throw error;
  }
}

export { connectMastodon };
