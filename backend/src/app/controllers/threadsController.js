const axios = require("axios");
const User = require("../models/user");
const PlatformConnection = require("../models/platformConnection");
const makeId = require("../helpers/makeId");
const { redisClient } = require("../config/RedisInitializer");

const GRAPH_API_BASE_URL = "https://graph.threads.net";

const SCOPES = [
  "threads_basic",
  "threads_content_publish",
  // "threads_manage_insights",
  // "threads_manage_replies",
  // "threads_read_replies",
  // "threads_oembed_read",
].join(",");

const initiateThreadsConnect = async (req, res) => {
  const state = makeId(6);
  const userId = req.user._id;

  const authUrl =
    `https://www.threads.net/oauth/authorize` +
    `?client_id=${process.env.THREADS_APP_ID}` +
    `&redirect_uri=${process.env.THREADS_CALLBACK_URL}` +
    `&scope=${SCOPES}` +
    `&response_type=code` +
    `&state=${state}`;

  try {
    // Store state and userId in Redis with 15 minutes expiration
    await redisClient.set(`threads:oauth:${state}`, userId.toString(), {
      EX: 900, // 15 minutes
    });

    res.json({ authUrl });
  } catch (err) {
    console.error("Error storing OAuth state:", err);
    res.status(500).json({ error: "Failed to initiate OAuth flow" });
  }
};

const handleThreadsCallback = async (req, res) => {
  const code = req.query.code;
  const state = req.query.state;

  try {
    // Get userId from Redis using state
    const userId = await redisClient.get(`threads:oauth:${state}`);

    // Clean up Redis state
    await redisClient.del(`threads:oauth:${state}`);

    if (!userId) {
      return res.status(400).json({ error: "Invalid or expired OAuth state" });
    }

    // Exchange code for short-lived access token
    const tokenResponse = await axios.post(
      `${GRAPH_API_BASE_URL}/oauth/access_token`,
      new URLSearchParams({
        client_id: process.env.THREADS_APP_ID,
        client_secret: process.env.THREADS_APP_SECRET,
        grant_type: "authorization_code",
        redirect_uri: process.env.THREADS_CALLBACK_URL,
        code,
      }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    // URL for long-lived access token
    const longTokenUrl =
      `${GRAPH_API_BASE_URL}/access_token?` +
      `grant_type=th_exchange_token&` +
      `client_secret=${process.env.THREADS_APP_SECRET}&` +
      `access_token=${tokenResponse.data.access_token}`;

    // Get long-lived access token
    const longTokenResponse = await axios.get(longTokenUrl);

    const refreshUrl =
      `${GRAPH_API_BASE_URL}/refresh_access_token?` +
      `access_token=${longTokenResponse.data.access_token}&` +
      `grant_type=th_refresh_token`;

    const refreshTokenResponse = await axios.get(refreshUrl);

    // Calculate token expiration date (subtract 5 minutes for safety margin)
    const accessTokenExpiresAt = new Date(
      Date.now() + (refreshTokenResponse.data.expires_in - 300) * 1000
    );

    const userDetailsUrl = `${GRAPH_API_BASE_URL}/me?fields=username,threads_profile_picture_url&access_token=${longTokenResponse.data.access_token}`;

    const userResponse = await axios.get(userDetailsUrl);

    console.log(accessTokenExpiresAt);
    console.log(userResponse.data);

    // Check if a connection with this Threads ID already exists
    const existingConnection = await PlatformConnection.findOne({
      platformId: userResponse.data.id,
      userId: userId,
      platform: "threads",
    });

    const connectionData = {
      userId: userId,
      platform: "threads",
      platformId: userResponse.data.id,
      username: userResponse.data.username,
      profileImageUrl: userResponse.data.threads_profile_picture_url,
      accessToken: longTokenResponse.data.access_token,
      refreshToken: refreshTokenResponse.data.access_token,
      accessTokenExpiresAt: accessTokenExpiresAt,
      addedAt: new Date(),
    };

    let platformConnection;

    if (existingConnection) {
      console.log("Updating existing connection");
      platformConnection = await PlatformConnection.findOneAndUpdate(
        { userId: userId, platformId: userResponse.data.id },
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

    res.redirect(`${process.env.FRONTEND_URL}/dashboard?threads=connected`);
  } catch (error) {
    console.error(
      "Threads callback error:",
      error.response?.data || error.message
    );
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?threads=error`);
  }
};

module.exports = {
  initiateThreadsConnect,
  handleThreadsCallback,
};
