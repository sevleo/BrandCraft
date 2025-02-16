const axios = require("axios");
const User = require("../models/user");
const makeId = require("../helpers/makeId");
const { redisClient } = require("../config/RedisInitializer");
const PlatformConnection = require("../models/platformConnection");

const GRAPH_API_BASE_URL = "https://graph.instagram.com";

const SCOPES = [
  "instagram_business_basic",
  "instagram_business_content_publish",
  // "instagram_business_manage_messages",
].join(",");

const initiateInstagramConnect = async (req, res) => {
  const state = makeId(6);
  const userId = req.user._id;

  const authUrl =
    `https://www.instagram.com/oauth/authorize` +
    `?client_id=${process.env.INSTAGRAM_APP_ID}` +
    `&redirect_uri=${process.env.INSTAGRAM_CALLBACK_URL}` +
    `&scope=${SCOPES}` +
    `&response_type=code` +
    `&state=${state}`;

  try {
    // Store state and userId in Redis with 15 minutes expiration
    await redisClient.set(`instagram:oauth:${state}`, userId.toString(), {
      EX: 900, // 15 minutes
    });

    res.json({ authUrl });
  } catch (err) {
    console.error("Error storing OAuth state:", err);
    res.status(500).json({ error: "Failed to initiate OAuth flow" });
  }
};

const handleInstagramCallback = async (req, res) => {
  const code = req.query.code;
  const state = req.query.state;

  try {
    const userId = await redisClient.get(`instagram:oauth:${state}`);

    if (!userId) {
      return res.status(400).json({ error: "Invalid or expired OAuth state" });
    }

    await redisClient.del(`instagram:oauth:${state}`);

    // Exchange code for short-lived access token
    const tokenResponse = await axios.post(
      "https://api.instagram.com/oauth/access_token",
      new URLSearchParams({
        client_id: process.env.INSTAGRAM_APP_ID,
        client_secret: process.env.INSTAGRAM_APP_SECRET,
        grant_type: "authorization_code",
        redirect_uri: process.env.INSTAGRAM_CALLBACK_URL,
        code,
      }).toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    // URL for long-lived access token
    const longTokenUrl =
      `${GRAPH_API_BASE_URL}/access_token?` +
      `grant_type=ig_exchange_token&` +
      `client_secret=${process.env.INSTAGRAM_APP_SECRET}&` +
      `access_token=${tokenResponse.data.access_token}`;

    // Get long-lived access token
    const longTokenResponse = await axios.get(longTokenUrl);

    const refreshUrl =
      `${GRAPH_API_BASE_URL}/refresh_access_token?` +
      `access_token=${longTokenResponse.data.access_token}&` +
      `grant_type=ig_refresh_token`;

    const refreshTokenResponse = await axios.get(refreshUrl);

    // Calculate token expiration date (subtract 5 minutes for safety margin)
    const accessTokenExpiresAt = new Date(
      Date.now() + (refreshTokenResponse.data.expires_in - 300) * 1000
    );

    const userDetailsUrl = `${GRAPH_API_BASE_URL}/me?fields=user_id,username,profile_picture_url&access_token=${longTokenResponse.data.access_token}`;

    const userResponse = await axios.get(userDetailsUrl);

    // Check if a connection with this Instagram ID already exists
    const existingConnection = await PlatformConnection.findOne({
      platformId: userResponse.data.user_id,
      userId: userId,
      platform: "instagram",
    });

    const connectionData = {
      userId: userId,
      platform: "instagram",
      platformId: userResponse.data.user_id,
      username: userResponse.data.username,
      accessToken: longTokenResponse.data.access_token,
      refreshToken: refreshTokenResponse.data.access_token,
      accessTokenExpiresAt: accessTokenExpiresAt,
      profileImageUrl: userResponse.data.profile_picture_url,
      addedAt: new Date(),
    };

    let platformConnection;

    if (existingConnection) {
      console.log("Updating existing connection");
      platformConnection = await PlatformConnection.findOneAndUpdate(
        { userId: userId, platformId: userResponse.data.user_id },
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

    res.redirect(`${process.env.FRONTEND_URL}/dashboard?instagram=connected`);
  } catch (error) {
    console.error("Error getting access token:", error);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?instagram=error`);
  }
};

// const getRateLimits = async (req, res) => {
//   console.log("get rate limit");
//   const user = await User.findById(req.user._id);

//   try {
//     const rateLimit = await axios.get(
//       `${GRAPH_API_BASE_URL}/${igId}/content_publishing_limit?access_token=${user.instagramAccount.accessToken}`
//     );

//     console.log("rate limit");
//     console.log(rateLimit.data.data);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Failed to get limits" });
//   }
// };

module.exports = {
  initiateInstagramConnect,
  handleInstagramCallback,
  // getRateLimits,
};
