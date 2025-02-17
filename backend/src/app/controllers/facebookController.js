const axios = require("axios");
const User = require("../models/user");
const makeId = require("../helpers/makeId");
const { redisClient } = require("../config/RedisInitializer");
const PlatformConnection = require("../models/platformConnection");

const GRAPH_API_BASE_URL = "https://graph.facebook.com/v18.0";

const SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_posts",
  "pages_manage_metadata",
].join(",");

const initiateFacebookConnect = async (req, res) => {
  const state = makeId(6);
  const userId = req.user._id;

  const authUrl = 
    `https://www.facebook.com/v18.0/dialog/oauth` +
    `?client_id=${process.env.FACEBOOK_APP_ID}` +
    `&redirect_uri=${process.env.FACEBOOK_CALLBACK_URL}` +
    `&scope=${SCOPES}` +
    `&state=${state}`;

  try {
    await redisClient.set(`facebook:oauth:${state}`, userId.toString(), {
      EX: 900, // 15 minutes
    });

    res.json({ authUrl });
  } catch (err) {
    console.error("Error storing OAuth state:", err);
    res.status(500).json({ error: "Failed to initiate OAuth flow" });
  }
};

const handleFacebookCallback = async (req, res) => {
  const { code, state } = req.query;

  try {
    const userId = await redisClient.get(`facebook:oauth:${state}`);

    if (!userId) {
      return res.status(400).json({ error: "Invalid or expired OAuth state" });
    }

    await redisClient.del(`facebook:oauth:${state}`);

    // Exchange code for access token
    const tokenResponse = await axios.get(
      `${GRAPH_API_BASE_URL}/oauth/access_token`,
      {
        params: {
          client_id: process.env.FACEBOOK_APP_ID,
          client_secret: process.env.FACEBOOK_APP_SECRET,
          redirect_uri: process.env.FACEBOOK_CALLBACK_URL,
          code,
        },
      }
    );

    const userAccessToken = tokenResponse.data.access_token;

    // Get user's Facebook pages
    const pagesResponse = await axios.get(
      `${GRAPH_API_BASE_URL}/me/accounts`,
      {
        params: {
          access_token: userAccessToken,
          fields: 'id,name,access_token,picture',
        },
      }
    );

    // Store each page as a separate connection
    for (const page of pagesResponse.data.data) {
      const connectionData = {
        userId: userId,
        platform: "facebook",
        platformId: page.id,
        username: page.name,
        accessToken: page.access_token,
        profileImageUrl: page.picture?.data?.url,
        addedAt: new Date(),
      };

      // Update or create platform connection
      const platformConnection = await PlatformConnection.findOneAndUpdate(
        { userId: userId, platformId: page.id, platform: "facebook" },
        connectionData,
        { upsert: true, new: true }
      );

      await User.findByIdAndUpdate(
        userId,
        { $addToSet: { platformConnections: platformConnection._id } },
        { new: true }
      );
    }

    res.redirect(`${process.env.FRONTEND_URL}/dashboard?facebook=connected`);
  } catch (error) {
    console.error("Error in Facebook callback:", error);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?facebook=error`);
  }
};

module.exports = {
  initiateFacebookConnect,
  handleFacebookCallback,
}; 