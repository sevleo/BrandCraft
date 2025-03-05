const axios = require("axios");
const User = require("../models/user");
const PlatformConnection = require("../models/platformConnection");
const makeId = require("../helpers/makeId");
const { redisClient } = require("../config/RedisInitializer");

const LINKEDIN_BASE_URL = "https://www.linkedin.com/oauth/v2";

const SCOPE = ["openid", "profile", "w_member_social", "email"].join(",");

const initiateLinkedinConnect = async (req, res) => {
  const state = makeId(6);
  const userId = req.user._id;

  const authUrl =
    `${LINKEDIN_BASE_URL}/authorization?` +
    `client_id=${process.env.LINKEDIN_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(process.env.LINKEDIN_CALLBACK_URL)}` +
    `&scope=${encodeURIComponent(SCOPE)}` +
    `&response_type=code` +
    `&state=${state}`;

  try {
    // Store state and userId in Redis with 15 minutes expiration
    await redisClient.set(`linkedin:oauth:${state}`, userId.toString(), {
      EX: 900, // 15 minutes
    });

    res.json({ authUrl });
  } catch (err) {
    console.error("Error storing OAuth state:", err);
    res.status(500).json({ error: "Failed to initiate OAuth flow" });
  }
};

const handleLinkedinCallback = async (req, res) => {
  const code = req.query.code;
  const state = req.query.state;

  try {
    const userId = await redisClient.get(`linkedin:oauth:${state}`);

    await redisClient.del(`linkedin:oauth:${state}`);

    if (!userId) {
      return res.status(400).json({ error: "Invalid or expired OAuth state" });
    }

    const tokenResponse = await axios.post(
      `${LINKEDIN_BASE_URL}/accessToken`,
      new URLSearchParams({
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET,
        grant_type: "authorization_code",
        redirect_uri: process.env.LINKEDIN_CALLBACK_URL,
        code,
      }).toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const { access_token, expires_in } = tokenResponse.data;

    const accessTokenExpiresAt = new Date(
      Date.now() + (expires_in - 300) * 1000
    );

    const userResponse = await axios.get(
      "https://api.linkedin.com/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    // Check if a connection with this Linkedin ID already exists
    const existingConnection = await PlatformConnection.findOne({
      platformId: userResponse.data.sub,
      userId: userId,
      platform: "linkedin",
    });

    const connectionData = {
      userId: userId,
      platform: "linkedin",
      platformId: userResponse.data.sub,
      username: userResponse.data.email,
      profileImageUrl: userResponse.data.picture,
      accessToken: access_token,
      accessTokenExpiresAt: accessTokenExpiresAt,
      addedAt: new Date(),
    };

    let platformConnection;

    if (existingConnection) {
      console.log("Updating existing connection");
      platformConnection = await PlatformConnection.findOneAndUpdate(
        { userId: userId, platformId: userResponse.data.sub },
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

    res.redirect(`${process.env.FRONTEND_URL}/dashboard?linkedin=connected`);
  } catch (error) {
    console.error(
      "Linkedin callback error:",
      error.response?.data || error.message
    );
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?linkedin=error`);
  }
};

module.exports = {
  initiateLinkedinConnect,
  handleLinkedinCallback,
};
