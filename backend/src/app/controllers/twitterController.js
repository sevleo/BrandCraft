const User = require("../models/user");
const PlatformConnection = require("../models/platformConnection");
const { TwitterApi } = require("twitter-api-v2");
const axios = require("axios");
const OAuth = require("oauth-1.0a");
const crypto = require("crypto");
const makeId = require("../helpers/makeId");
const { redisClient } = require("../config/RedisInitializer");

const initiateTwitterConnect = async (req, res) => {
  const state = makeId(6);
  const userId = req.user._id;

  // Initialize Twitter client
  const client = new TwitterApi({
    appKey: process.env.X_API_KEY,
    appSecret: process.env.X_API_SECRET,
  });

  const { url, oauth_token, oauth_token_secret } =
    await client.generateAuthLink(process.env.TWITTER_CALLBACK_URL, {
      authAccessType: "write",
      linkMode: "authenticate",
      state: state,
    });

  try {
    // Store state and userId in Redis with 15 minutes expiration
    await redisClient.set(`x:oauth:${state}`, userId.toString(), {
      EX: 900, // 15 minutes
    });

    res.json({
      authUrl: url,
      xLoginState: state,
      x_oauth_token_secret: oauth_token_secret,
    });
  } catch (err) {
    console.error("Error storing OAuth state:", err);
    res.status(500).json({ error: "Failed to initiate OAuth flow" });
  }
};

const handleTwitterCallback = async (req, res) => {
  try {
    const { state, oauth_token, oauth_token_secret, oauth_verifier } =
      req.query;

    if (!state) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/dashboard?twitter=connected&oauth_token=${oauth_token}&oauth_verifier=${oauth_verifier}`
      );
    }

    // Initialize TwitterApi client for OAuth1.0a
    const startingClient = new TwitterApi({
      appKey: process.env.X_API_KEY,
      appSecret: process.env.X_API_SECRET,
      accessToken: oauth_token,
      accessSecret: oauth_token_secret,
    });

    // Complete OAuth1.0a flow and get access tokens
    const { accessToken, accessSecret, client } = await startingClient.login(
      oauth_verifier
    );

    const { id, name, screen_name, profile_image_url } =
      await client.currentUser(true);

    const profileImageUrl = getHighQualityProfileImage(profile_image_url);

    const userId = await redisClient.get(`x:oauth:${state}`);

    // Clean up Redis state
    await redisClient.del(`x:oauth:${state}`);

    if (!userId) {
      return res.status(400).json({ error: "Invalid or expired OAuth state" });
    }

    // Check if a connection with this Twitter ID already exists
    const existingConnection = await PlatformConnection.findOne({
      platformId: id,
      userId: userId,
      platform: "twitter",
    });

    const connectionData = {
      userId: userId,
      platform: "twitter",
      platformId: id,
      username: screen_name,
      displayName: name,
      profileImageUrl: profileImageUrl,
      accessToken: accessToken,
      accessSecret: accessSecret,
      accessTokenSplit: accessToken + ":" + accessSecret,
      addedAt: new Date(),
    };

    let platformConnection;

    if (existingConnection) {
      console.log("Updating existing connection");
      platformConnection = await PlatformConnection.findOneAndUpdate(
        { userId: userId, platformId: id },
        connectionData,
        { new: true }
      );
    } else {
      console.log("Creating new connection");
      platformConnection = new PlatformConnection(connectionData);
      await platformConnection.save();

      // Add reference to user's platformConnections array only for new connections
      await User.findByIdAndUpdate(
        userId,
        { $addToSet: { platformConnections: platformConnection._id } },
        { new: true }
      );
    }

    return res.json({ message: "success" });
  } catch (error) {
    console.error("Twitter callback error:", error);
    return res.json({ message: "failure" });
  }
};

module.exports = {
  initiateTwitterConnect,
  handleTwitterCallback,
};

// Function to get high quality profile image
const getHighQualityProfileImage = (url) => {
  if (!url) return null;
  return url.replace("_normal", "").replace("_bigger", "");
};

// Add token usage query
const getTokenUsage = async (req, res) => {
  try {
    const response = await axios.get("https://api.x.com/2/usage/tweets", {
      headers: {
        Authorization: `Bearer ${process.env.X_BEARER_TOKEN}`,
      },
    });

    const usageData = response.data.data;
    res.json({ success: true, usage: usageData });
  } catch (error) {
    console.error("Error fetching token usage:", error);
    res.status(500).json({ error: "Failed to fetch token usage" });
  }
};

const fetchPersonalizedTrends = async (accessToken, accessSecret) => {
  // OAuth credentials
  const oauthConsumerKey = process.env.X_API_KEY; // API Key
  const oauthConsumerSecret = process.env.X_API_SECRET; // API Secret
  const oauthToken = accessToken; // Access Token for the user
  const oauthTokenSecret = accessSecret; // Access Secret for the user

  // Initialize OAuth1.0a
  const oauth = OAuth({
    consumer: {
      key: oauthConsumerKey,
      secret: oauthConsumerSecret,
    },
    signature_method: "HMAC-SHA1",
    hash_function(baseString, key) {
      return crypto.createHmac("sha1", key).update(baseString).digest("base64");
    },
  });

  const url = "https://api.x.com/2/users/personalized_trends";

  // Generate OAuth headers
  const requestData = {
    url,
    method: "GET",
  };

  const headers = {
    ...oauth.toHeader(
      oauth.authorize(requestData, {
        key: oauthToken,
        secret: oauthTokenSecret,
      })
    ),
    "Content-Type": "application/json",
  };

  try {
    const response = await axios.get(url, { headers });
    console.log("Personalized Trends:", response.data);
    return response.data.data;
  } catch (error) {
    console.error(
      "Error fetching personalized trends:",
      error.response?.data || error.message
    );
    throw new Error("Failed to fetch personalized trends");
  }
};
