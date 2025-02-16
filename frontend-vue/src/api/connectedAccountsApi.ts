import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URL}/connected-accounts`,
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

async function getAllConnectedAccounts() {
  try {
    const response = await axiosInstance.get('/get-all-accounts');
    return response.data;
  } catch (error) {
    console.error('Failed to get all connected accounts:', error);
    throw error;
  }
}

async function disconnectConnectedAccount(platformId: string) {
  try {
    await axiosInstance.post('/disconnect-account', { platformId });
  } catch (error) {
    console.error('Failed to disconnect connected account:', error);
    throw error;
  }
}

export { getAllConnectedAccounts, disconnectConnectedAccount };
