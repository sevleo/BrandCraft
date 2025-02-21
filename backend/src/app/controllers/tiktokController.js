const axios = require("axios");
const User = require("../models/user");
require("dotenv").config();
const makeId = require("../helpers/makeId");
const { redisClient } = require("../config/RedisInitializer");
const PlatformConnection = require("../models/platformConnection");

// TikTok: Initiate Connection
const initiateTikTokConnect = async (req, res) => {
  const state = makeId(6);
  const userId = req.user._id;

  // TikTok OAuth Configuration
  const tiktokAuthParams = {
    client_key: process.env.TIKTOK_CLIENT_KEY,
    redirect_uri: process.env.TIKTOK_CALLBACK_URL,
    response_type: "code",
    state: state,
    scope: [
      "user.info.basic",
      "user.info.profile",
      // "user.info.stats",
      "video.publish",
      "video.upload",
    ].join(","), // Join scopes into a single string
  };

  // Construct TikTok Authorization URL
  const authUrl = `https://www.tiktok.com/v2/auth/authorize?${new URLSearchParams(
    tiktokAuthParams
  ).toString()}`;

  try {
    // Store state and userId in Redis with 15 minutes expiration
    await redisClient.set(`tiktok:oauth:${state}`, userId.toString(), {
      EX: 900, // 15 minutes
    });

    res.json({ authUrl });
  } catch (err) {
    console.error("Error storing OAuth state:", err);
    res.status(500).json({ error: "Failed to initiate OAuth flow" });
  }
};

// TikTok: Handle OAuth Callback
const handleTikTokCallback = async (req, res) => {
  const code = req.query.code;
  const state = req.query.state;

  try {
    const userId = await redisClient.get(`tiktok:oauth:${state}`);

    if (!userId) {
      return res.status(400).json({ error: "Invalid or expired OAuth state" });
    }

    await redisClient.del(`tiktok:oauth:${state}`);

    // Exchange code for access token
    const tokenResponse = await fetch(
      "https://open.tiktokapis.com/v2/oauth/token/",
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        method: "POST",
        body: new URLSearchParams({
          client_key: process.env.TIKTOK_CLIENT_KEY,
          client_secret: process.env.TIKTOK_CLIENT_SECRET,
          code,
          grant_type: "authorization_code",
          redirect_uri: process.env.TIKTOK_CALLBACK_URL,
        }).toString(),
      }
    );

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error("Error fetching access token:", errorData);
      return res.status(500).json({ error: "Failed to fetch access token" });
    }

    const tokenData = await tokenResponse.json();

    // Optional: Fetch user info from TikTok (if required)
    const userInfoResponse = await fetch(
      "https://open.tiktokapis.com/v2/user/info/?fields=open_id,avatar_url,display_name,union_id,username",
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );

    const userData = await userInfoResponse.json();

    // Check if a connection with this Instagram ID already exists
    const existingConnection = await PlatformConnection.findOne({
      platformId: tokenData.open_id,
      userId: userId,
      platform: "tiktok",
    });

    const connectionData = {
      userId: userId,
      platform: "tiktok",
      platformId: tokenData.open_id,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      username: userData.data.user.username,
      profileImageUrl: userData.data.user.avatar_url,
      addedAt: new Date(),
    };

    let platformConnection;

    if (existingConnection) {
      console.log("Updating existing connection");
      platformConnection = await PlatformConnection.findOneAndUpdate(
        { userId: userId, platformId: tokenData.open_id },
        connectionData,
        { new: true }
      );
    } else {
      console.log("Creating new connection");
      platformConnection = new PlatformConnection(connectionData);
      await platformConnection.save();
    }

    await User.findByIdAndUpdate(
      userId,
      { $addToSet: { platformConnections: platformConnection._id } },
      { new: true }
    );

    res.redirect(`${process.env.FRONTEND_URL}/dashboard?tiktok=connected`);
  } catch (error) {
    console.error("TikTok callback error:", error);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?tiktok=error`);
  }
};

const getCreatorInfo = async (req, res) => {
  try {
    const { platformId } = req.body;

    const response = await tiktokApiRequest(
      platformId,
      "/v2/post/publish/creator_info/query/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      }
    );

    console.log(response);

    res.json({ creatorInfo: response });
  } catch (error) {
    console.error("Error getting creator info:", error);
    res.status(500).json({ error: "Failed to get creator info" });
  }
};

// Wrapper to refreshToken for requests
const tiktokApiRequest = async (platformId, endpoint, options = {}) => {
  const connection = await PlatformConnection.findOne({ platformId });

  let accessToken = connection.accessToken;

  const makeRequest = async () => {
    const response = await fetch(`https://open.tiktokapis.com${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.status === 401) {
      // Token expired; refresh token
      console.log("Access token expired, attempting to refresh...");
      const refreshResult = await refreshTikTokToken(connection);

      if (!refreshResult.success) {
        throw new Error("Failed to refresh TikTok access token");
      }

      accessToken = refreshResult.accessToken;

      // Retry the original request with the new token
      return fetch(`https://open.tiktokapis.com${endpoint}`, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${accessToken}`,
        },
      });
    }

    return response;
  };

  const finalResponse = await makeRequest();

  if (!finalResponse.ok) {
    const errorData = await finalResponse.json();
    console.error("Error in TikTok API request:", errorData);
    throw new Error(errorData.error || "TikTok API request failed");
  }

  return finalResponse.json();
};

const refreshTikTokToken = async (connection) => {
  try {
    if (!connection || !connection.refreshToken) {
      throw new Error("User TikTok account or refresh token not found");
    }

    const refreshToken = connection.refreshToken;

    const tokenResponse = await fetch(
      "https://open.tiktokapis.com/v2/oauth/token/",
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        method: "POST",
        body: new URLSearchParams({
          client_key: process.env.TIKTOK_CLIENT_KEY,
          client_secret: process.env.TIKTOK_CLIENT_SECRET,
          grant_type: "refresh_token",
          refresh_token: refreshToken,
        }).toString(),
      }
    );

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error("Error refreshing access token:", errorData);
      throw new Error("Failed to refresh access token");
    }

    const tokenData = await tokenResponse.json();

    // Update user TikTok account with new token info
    connection.accessToken = tokenData.access_token;
    connection.refreshToken = tokenData.refresh_token;

    await connection.save();
    console.log("TikTok token refreshed successfully");

    return { success: true, accessToken: tokenData.access_token };
  } catch (error) {
    console.error("Error refreshing TikTok token:", error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  initiateTikTokConnect,
  handleTikTokCallback,
  getCreatorInfo,
};
