import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URL}/auth/twitter`,
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

async function connectTwitter() {
  try {
    const response = await axiosInstance.get('/connect');
    localStorage.setItem('xLoginState', response.data.xLoginState);
    localStorage.setItem('xoats', response.data.x_oauth_token_secret);
    return response.data;
  } catch (error) {
    console.error('Failed to initiate Twitter connection:', error);
    throw error;
  }
}

async function handleTwitterCallback(
  oauthToken: string,
  oauthVerifier: string,
  state: string,
  x_oauth_token_secret: string
) {
  try {
    const response = await axiosInstance.get('/callback', {
      params: {
        oauth_token: oauthToken,
        oauth_verifier: oauthVerifier,
        state: state,
        oauth_token_secret: x_oauth_token_secret,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to handle Twitter callback:', error);
    throw error;
  }
}

export { connectTwitter, handleTwitterCallback };
