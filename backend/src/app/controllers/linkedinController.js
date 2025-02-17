const axios = require("axios");
const User = require("../models/user");
const makeId = require("../helpers/makeId");
const { redisClient } = require("../config/RedisInitializer");
const PlatformConnection = require("../models/platformConnection");

const API_BASE_URL = "https://api.linkedin.com/v2";

const SCOPES = [
  "w_member_social",
  "r_liteprofile",
  "w_organization_social",
].join(" ");

const initiateLinkedinConnect = async (req, res) => {
  const state = makeId(6);
  const userId = req.user._id;

  const authUrl =
    `https://www.linkedin.com/oauth/v2/authorization` +
    `?client_id=${process.env.LINKEDIN_CLIENT_ID}` +
    `&redirect_uri=${process.env.LINKEDIN_CALLBACK_URL}` +
    `&scope=${SCOPES}` +
    `&response_type=code` +
    `&state=${state}`;

  try {
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

    if (!userId) {
      return res.status(400).json({ error: "Invalid or expired OAuth state" });
    }

    await redisClient.del(`linkedin:oauth:${state}`);

    // Exchange code for access token
    const tokenResponse = await axios.post(
      "https://www.linkedin.com/oauth/v2/accessToken",
      new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET,
        redirect_uri: process.env.LINKEDIN_CALLBACK_URL,
      }).toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    // Get user profile
    const userResponse = await axios.get(`${API_BASE_URL}/me`, {
      headers: {
        Authorization: `Bearer ${tokenResponse.data.access_token}`,
      },
    });

    const accessTokenExpiresAt = new Date(
      Date.now() + tokenResponse.data.expires_in * 1000
    );

    // Check for existing connection
    const existingConnection = await PlatformConnection.findOne({
      platformId: userResponse.data.id,
      userId: userId,
      platform: "linkedin",
    });

    const connectionData = {
      userId: userId,
      platform: "linkedin",
      platformId: userResponse.data.id,
      username: `${userResponse.data.localizedFirstName} ${userResponse.data.localizedLastName}`,
      accessToken: tokenResponse.data.access_token,
      accessTokenExpiresAt: accessTokenExpiresAt,
      profileImageUrl: userResponse.data.profilePicture?.["displayImage~"]?.elements[0]?.identifiers[0]?.identifier || "",
      addedAt: new Date(),
    };

    let platformConnection;

    if (existingConnection) {
      platformConnection = await PlatformConnection.findOneAndUpdate(
        { userId: userId, platformId: userResponse.data.id },
        connectionData,
        { new: true }
      );
    } else {
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
    console.error("Error in LinkedIn callback:", error);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?linkedin=error`);
  }
};

module.exports = {
  initiateLinkedinConnect,
  handleLinkedinCallback,
}; 