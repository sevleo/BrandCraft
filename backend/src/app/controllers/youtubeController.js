const { google } = require("googleapis");
const User = require("../models/user");
const makeId = require("../helpers/makeId");
const { redisClient } = require("../config/RedisInitializer");
const PlatformConnection = require("../models/platformConnection");

// Initialize OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  process.env.YOUTUBE_CALLBACK_URL
);

// Define scopes for YouTube API
const SCOPES = [
  "https://www.googleapis.com/auth/youtube",
  "https://www.googleapis.com/auth/youtube.upload",
];

// Initialize YouTube API client
const youtube = google.youtube("v3");

// Controller functions
const initiateYoutubeConnect = async (req, res) => {
  const state = makeId(6);
  const userId = req.user._id;

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    include_granted_scopes: true,
    state,
    prompt: "consent",
  });

  try {
    await redisClient.set(`youtube:oauth:${state}`, userId.toString(), {
      EX: 900,
    });

    res.json({ authUrl });
  } catch (error) {
    console.error("Error initiating YouTube connect:", error);
    res.status(500).json({ error: "Failed to initiate YouTube connection" });
  }
};

const handleYoutubeCallback = async (req, res) => {
  const code = req.query.code;
  const state = req.query.state;

  try {
    const userId = await redisClient.get(`youtube:oauth:${state}`);

    await redisClient.del(`youtube:oauth:${state}`);

    const { tokens } = await oauth2Client.getToken(code);

    oauth2Client.setCredentials(tokens);

    // Get channel info
    const response = await youtube.channels.list({
      auth: oauth2Client,
      part: "snippet",
      mine: true,
    });

    const channel = response.data.items[0];
    const channelData = {
      channelId: channel.id,
      channelName: channel.snippet.title,
      profileImageUrl: channel.snippet.thumbnails.default.url,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiryDate: tokens.expiry_date,
    };

    // Check if a connection with this YouTube Channel ID already exists
    const existingConnection = await PlatformConnection.findOne({
      platformId: channelData.channelId,
      userId: userId,
      platform: "youtube",
    });

    const connectionData = {
      userId: userId,
      platform: "youtube",
      platformId: channelData.channelId,
      username: channelData.channelName,
      profileImageUrl: channelData.profileImageUrl,
      accessToken: channelData.accessToken,
      refreshToken: channelData.refreshToken,
      accessTokenExpiresAt: channelData.expiryDate,
      addedAt: new Date(),
    };

    let platformConnection;

    if (existingConnection) {
      console.log("Updating existing connection");
      platformConnection = await PlatformConnection.findOneAndUpdate(
        { userId: userId, platformId: channelData.channelId },
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

    res.redirect(process.env.FRONTEND_URL + "/dashboard/brands");
  } catch (error) {
    console.error("Error handling YouTube callback:", error);
    res.status(500).json({ error: "Failed to handle YouTube callback" });
  }
};

module.exports = {
  initiateYoutubeConnect,
  handleYoutubeCallback,
};
