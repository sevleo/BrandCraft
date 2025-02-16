import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URL}/auth/youtube`,
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

async function connectYoutube() {
  try {
    const response = await axiosInstance.get('/connect');
    return response.data;
  } catch (error) {
    console.error('Error connecting to YouTube:', error);
    throw error;
  }
}

async function postToYoutube(formData: FormData) {
  try {
    const response = await axiosInstance.post('/post', formData);
    return response.data;
  } catch (error) {
    console.error('Error posting to YouTube:', error);
    throw error;
  }
}

export { connectYoutube, postToYoutube };
