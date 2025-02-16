const asyncHandler = require("express-async-handler");
const axios = require("axios");
const User = require("../models/user");
const makeId = require("../helpers/makeId");
const { redisClient } = require("../config/RedisInitializer");
const PlatformConnection = require("../models/platformConnection");

const MASTODON_INSTANCE = "https://mastodon.social";
const CLIENT_ID = process.env.MASTODON_CLIENT_ID;
const CLIENT_SECRET = process.env.MASTODON_CLIENT_SECRET;
const REDIRECT_URI = `${process.env.BACKEND_URL}/auth/mastodon/callback`;
const SCOPE = "read write push";

const connect = asyncHandler(async (req, res) => {
  const state = makeId(6);
  const userId = req.user._id;

  const authUrl =
    `${MASTODON_INSTANCE}/oauth/authorize?` +
    `client_id=${CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
    `scope=${encodeURIComponent(SCOPE)}&` +
    `response_type=code&` +
    `state=${state}`;

  try {
    // Store state and userId in Redis with 15 minutes expiration
    await redisClient.set(`mastodon:oauth:${state}`, userId.toString(), {
      EX: 900, // 15 minutes
    });

    res.json({ authUrl });
  } catch (err) {
    console.error("Error storing OAuth state:", err);
    res.status(500).json({ error: "Failed to initiate OAuth flow" });
  }
});

const callback = asyncHandler(async (req, res) => {
  const code = req.query.code;
  const state = req.query.state;

  try {
    const userId = await redisClient.get(`mastodon:oauth:${state}`);

    if (!userId) {
      return res.status(400).json({ error: "Invalid or expired OAuth state" });
    }

    // Clean up Redis state
    await redisClient.del(`mastodon:oauth:${state}`);

    // Exchange code for access token
    const tokenResponse = await axios.post(
      `${MASTODON_INSTANCE}/oauth/token`,
      new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
        code,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const { access_token } = tokenResponse.data;

    // Get user info
    const userResponse = await axios.get(
      `${MASTODON_INSTANCE}/api/v1/accounts/verify_credentials`,
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );

    const mastodonUser = userResponse.data;

    // Check if a connection with this Mastodon ID already exists
    const existingConnection = await PlatformConnection.findOne({
      platformId: mastodonUser.id,
      userId: userId,
      platform: "mastodon",
    });

    const connectionData = {
      userId: userId,
      platform: "mastodon",
      platformId: mastodonUser.id,
      accessToken: access_token,
      username: mastodonUser.username,
      profileImageUrl: mastodonUser.avatar,
      displayName: mastodonUser.display_name,
      addedAt: new Date(),
    };

    let platformConnection;

    if (existingConnection) {
      console.log("Updating existing connection");
      platformConnection = await PlatformConnection.findOneAndUpdate(
        { userId: userId, platformId: mastodonUser.id },
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

    res.redirect(`${process.env.FRONTEND_URL}/dashboard?mastodon=connected`);
  } catch (error) {
    console.error(
      "Mastodon callback error:",
      error.response?.data || error.message
    );
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?mastodon=error`);
  }
});

module.exports = {
  connect,
  callback,
};
