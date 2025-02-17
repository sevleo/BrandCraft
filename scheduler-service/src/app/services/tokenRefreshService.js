const axios = require("axios");
const PlatformConnection = require("../models/platformConnection");
const { google } = require("googleapis");

class TokenRefreshService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.YOUTUBE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET
    );
  }

  async refreshTokenIfNeeded(connection) {
    if (!connection) return null;

    // Check if token needs refresh (5 minutes buffer)
    const needsRefresh = this.isTokenExpired(connection.accessTokenExpiresAt);
    if (!needsRefresh) return connection.accessToken;

    try {
      switch (connection.platform) {
        case 'youtube':
          return await this.refreshYouTubeToken(connection);
        case 'facebook':
        case 'instagram':
          return await this.refreshMetaToken(connection);
        case 'linkedin':
          return await this.refreshLinkedInToken(connection);
        // Twitter/X uses OAuth 1.0a which doesn't require refresh
        // Threads uses long-lived tokens
        // Bluesky uses password auth
        default:
          return connection.accessToken;
      }
    } catch (error) {
      console.error(`Failed to refresh token for ${connection.platform}:`, error);
      throw error;
    }
  }

  isTokenExpired(expiryDate) {
    if (!expiryDate) return true;
    // Consider token expired if it expires in less than 5 minutes
    return new Date(expiryDate).getTime() - Date.now() < 5 * 60 * 1000;
  }

  async refreshYouTubeToken(connection) {
    this.oauth2Client.setCredentials({
      refresh_token: connection.refreshToken
    });

    const { credentials } = await this.oauth2Client.refreshAccessToken();
    
    await PlatformConnection.findByIdAndUpdate(connection._id, {
      accessToken: credentials.access_token,
      accessTokenExpiresAt: new Date(credentials.expiry_date)
    });

    return credentials.access_token;
  }

  async refreshMetaToken(connection) {
    const response = await axios.get(
      'https://graph.facebook.com/v18.0/oauth/access_token',
      {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: process.env.FACEBOOK_APP_ID,
          client_secret: process.env.FACEBOOK_APP_SECRET,
          fb_exchange_token: connection.accessToken
        }
      }
    );

    const newToken = response.data.access_token;
    const expiresIn = response.data.expires_in;

    await PlatformConnection.findByIdAndUpdate(connection._id, {
      accessToken: newToken,
      accessTokenExpiresAt: new Date(Date.now() + (expiresIn * 1000))
    });

    return newToken;
  }

  async refreshLinkedInToken(connection) {
    const response = await axios.post(
      'https://www.linkedin.com/oauth/v2/accessToken',
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: connection.refreshToken,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const newToken = response.data.access_token;
    const expiresIn = response.data.expires_in;

    await PlatformConnection.findByIdAndUpdate(connection._id, {
      accessToken: newToken,
      accessTokenExpiresAt: new Date(Date.now() + (expiresIn * 1000))
    });

    return newToken;
  }

  async withValidThreadsToken(callback, connection) {
    try {
      // Check if token needs refresh before making the call
      const token = await this.refreshTokenIfNeeded(connection);
      if (!token) {
        throw new Error('No valid Threads token found');
      }
      
      // Execute the wrapped API call with the valid token
      return await callback(token);
    } catch (error) {
      if (error.message?.includes('token')) {
        // If error is token related, force a refresh and try once more
        const newToken = await this.refreshTokenIfNeeded(connection);
        return await callback(newToken);
      }
      throw error;
    }
  }
}

module.exports = new TokenRefreshService(); 