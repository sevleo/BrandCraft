import axios from "axios";
import authData from "./authDataStore";

async function verifyAuth(BACKEND_URL: string) {
  const accessToken = localStorage.getItem("accessToken");
  const refreshToken = localStorage.getItem("refreshToken");

  if (accessToken && refreshToken) {
    try {
      const response = await axios.get(`${BACKEND_URL}/auth/verify-auth`, {
        headers: {
          authorization: accessToken,
          refreshToken: refreshToken,
        },
      });

      if (response.data.newAccessToken) {
        localStorage.setItem("accessToken", response.data.newAccessToken);
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

export { verifyAuth };
