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
  "public_profile",
].join(",");

const initiateFacebookConnect = async (req, res) => {
  const state = makeId(6);
  const userId = req.user._id;

  const authUrl =
    `https://www.facebook.com/v18.0/dialog/oauth` +
    `?client_id=${process.env.FACEBOOK_APP_ID}` +
    `&redirect_uri=${process.env.FACEBOOK_CALLBACK_URL}` +
    `&scope=${SCOPES}` +
    `&state=${state}` +
    `&response_type=code`;

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
  const code = req.query.code;
  const state = req.query.state;

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

    // Get user profile
    const userResponse = await axios.get(`${GRAPH_API_BASE_URL}/me`, {
      params: {
        fields: "id,name,picture",
        access_token: tokenResponse.data.access_token,
      },
    });

    // Get user's pages
    const pagesResponse = await axios.get(`${GRAPH_API_BASE_URL}/me/accounts`, {
      params: {
        access_token: tokenResponse.data.access_token,
      },
    });

    // Store each page as a separate connection
    for (const page of pagesResponse.data.data) {
      const existingConnection = await PlatformConnection.findOne({
        platformId: page.id,
        userId: userId,
        platform: "facebook",
      });

      const connectionData = {
        userId: userId,
        platform: "facebook",
        platformId: page.id,
        username: page.name,
        accessToken: page.access_token,
        accessTokenExpiresAt: null, // Facebook page tokens don't expire
        profileImageUrl: `https://graph.facebook.com/${page.id}/picture?type=large`,
        addedAt: new Date(),
        metadata: {
          pageId: page.id,
          pageName: page.name,
        },
      };

      let platformConnection;

      if (existingConnection) {
        platformConnection = await PlatformConnection.findOneAndUpdate(
          { userId: userId, platformId: page.id },
          connectionData,
          { new: true }
        );
      } else {
        platformConnection = new PlatformConnection(connectionData);
        await platformConnection.save();

        await User.findByIdAndUpdate(
          userId,
          { $addToSet: { platformConnections: platformConnection._id } },
          { new: true }
        );
      }
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