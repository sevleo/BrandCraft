const axios = require("axios");
const User = require("../models/user");
const makeId = require("../helpers/makeId");
const { redisClient } = require("../config/RedisInitializer");
const PlatformConnection = require("../models/platformConnection");

const LINKEDIN_API_URL = "https://api.linkedin.com/v2";

const SCOPES = [
  "r_liteprofile",
  "r_emailaddress",
  "w_member_social",
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
  const { code, state } = req.query;

  try {
    const userId = await redisClient.get(`linkedin:oauth:${state}`);

    if (!userId) {
      return res.status(400).json({ error: "Invalid or expired OAuth state" });
    }

    await redisClient.del(`linkedin:oauth:${state}`);

    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://www.linkedin.com/oauth/v2/accessToken',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.LINKEDIN_CALLBACK_URL,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET,
      }).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    const accessToken = tokenResponse.data.access_token;
    const expiresIn = tokenResponse.data.expires_in;

    // Get user profile
    const profileResponse = await axios.get(
      `${LINKEDIN_API_URL}/me?projection=(id,localizedFirstName,localizedLastName,profilePicture(displayImage~:playableStreams))`,
      {
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'cache-control': 'no-cache',
          'X-Restli-Protocol-Version': '2.0.0'
        }
      }
    );

    const profile = profileResponse.data;
    const profileImageUrl = profile.profilePicture?.['displayImage~']?.elements?.[0]?.identifiers?.[0]?.identifier;

    // Calculate token expiration date
    const accessTokenExpiresAt = new Date(Date.now() + (expiresIn - 300) * 1000);

    const connectionData = {
      userId: userId,
      platform: "linkedin",
      platformId: profile.id,
      username: `${profile.localizedFirstName} ${profile.localizedLastName}`,
      accessToken: accessToken,
      accessTokenExpiresAt: accessTokenExpiresAt,
      profileImageUrl: profileImageUrl,
      addedAt: new Date(),
    };

    // Update or create platform connection
    const platformConnection = await PlatformConnection.findOneAndUpdate(
      { userId: userId, platformId: profile.id, platform: "linkedin" },
      connectionData,
      { upsert: true, new: true }
    );

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