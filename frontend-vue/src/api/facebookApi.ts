import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URL}/auth/facebook`,
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  if (accessToken && refreshToken) {
    config.headers.authorization = accessToken;
    config.headers.refreshToken = refreshToken;
  }
  return config;
});

async function connectFacebook() {
  try {
    const response = await axiosInstance.get(`/connect`);
    return response.data;
  } catch (error) {
    console.error('Error initiating Facebook auth:', error);
    throw error;
  }
}

export { connectFacebook }; 