import axios from 'axios';
import authData from '../utils/authDataStore';

async function signUp(email: string, password: string) {
  const endpoint = `${import.meta.env.VITE_BACKEND_URL}/auth/signup`;
  try {
    const response = await axios.post(endpoint, {
      username: email,
      password: password,
    });

    localStorage.setItem('accessToken', response.data.accessToken);
    localStorage.setItem('refreshToken', response.data.refreshToken);
    authData.user.value = response.data.username;
    authData.signedIn.value = true;

    return { success: true, data: response.data };
  } catch (err: any) {
    console.error('Signup error:', err);
    const errorMessage =
      err.response?.data?.message || 'Failed to create account';
    return { success: false, error: errorMessage };
  }
}

async function signIn(email: string, password: string) {
  const endpoint = `${import.meta.env.VITE_BACKEND_URL}/auth/signin`;

  try {
    const response = await axios.post(endpoint, {
      username: email,
      password: password,
    });

    localStorage.setItem('accessToken', response.data.accessToken);
    localStorage.setItem('refreshToken', response.data.refreshToken);
    authData.user.value = response.data.username;
    authData.signedIn.value = true;

    return { success: true, data: response.data };
  } catch (err: any) {
    console.error('Login error:', err);
    const errorMessage =
      err.response?.data?.message || 'Invalid email or password';
    return { success: false, error: errorMessage };
  }
}

async function logout() {
  try {
    await axios.post(`${import.meta.env.VITE_BACKEND_URL}/auth/logout`, {
      accessToken: localStorage.getItem('accessToken'),
      refreshToken: localStorage.getItem('refreshToken'),
    });
  } catch (err) {
    console.error(err);
  }
}

async function verifyAuth() {
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');

  if (accessToken && refreshToken) {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/auth/verify-auth`,
        {
          headers: {
            authorization: accessToken,
            refreshToken: refreshToken,
          },
        }
      );

      if (response.data.newAccessToken) {
        localStorage.setItem('accessToken', response.data.newAccessToken);
      }

      authData.user.value = response.data.user.username;
      authData.userType.value = response.data.user.type;
      authData.passwordSet.value = response.data.user.passwordSet;
      authData.signedIn.value = true;
      authData.isAdmin.value = response.data.user.isAdmin;
      authData.displayName.value = response.data.user.displayName;
    } catch (err) {
      console.error(err);
      authData.signedIn.value = false;
    }
  }

  authData.loaded.value = true;
}

async function updatePassword(currentPassword: string, newPassword: string) {
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_BACKEND_URL}/auth/update-password`,
      {
        currentPassword,
        newPassword,
      },
      {
        headers: {
          authorization: accessToken,
          refreshToken: refreshToken,
        },
      }
    );

    return { success: true, data: response.data };
  } catch (err: any) {
    console.error('Password update error:', err);
    const errorMessage =
      err.response?.data?.message || 'Failed to update password';

    return { success: false, error: errorMessage };
  }
}

async function setPassword(newPassword: string) {
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_BACKEND_URL}/auth/set-password`,
      {
        newPassword,
      },
      {
        headers: {
          authorization: accessToken,
          refreshToken: refreshToken,
        },
      }
    );

    return { success: true, data: response.data };
  } catch (err: any) {
    console.error('Password set error:', err);
    const errorMessage =
      err.response?.data?.message || 'Failed to set password';

    return { success: false, error: errorMessage };
  }
}

export { signUp, signIn, logout, verifyAuth, updatePassword, setPassword };
