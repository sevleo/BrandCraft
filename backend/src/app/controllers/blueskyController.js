const { AtpAgent } = require("@atproto/api");
require("dotenv").config();
const User = require("../models/user");
const PlatformConnection = require("../models/platformConnection");

// Bluesky: Initiate Connection
const initiateBlueskyConnect = async (req, res) => {
  try {
    const agent = new AtpAgent({ service: "https://bsky.social" });

    await agent.login({
      identifier: req.body.identifier,
      password: req.body.password,
    });

    const profile = await agent.getProfile({ actor: agent.session.did });

    // Check if a connection with this Bluesky ID already exists
    const existingConnection = await PlatformConnection.findOne({
      platformId: agent.session.did,
      userId: req.user._id,
      platform: "bluesky",
    });

    const connectionData = {
      userId: req.user._id,
      platform: "bluesky",
      platformId: agent.session.did,
      username: agent.session.handle,
      profileImageUrl: profile.data.avatar,
      displayName: profile.data.displayName,
      password: req.body.password,
      addedAt: new Date(),
    };

    let platformConnection;

    if (existingConnection) {
      console.log("Updating existing connection");
      platformConnection = await PlatformConnection.findOneAndUpdate(
        { userId: req.user._id, platformId: agent.session.did },
        connectionData,
        { new: true }
      );
    } else {
      console.log("Creating new connection");
      platformConnection = new PlatformConnection(connectionData);
      await platformConnection.save();
    }

    await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { platformConnections: platformConnection._id } },
      { new: true }
    );

    try {
      return res.json({
        success: true,
        account: {
          username: agent.session.handle,
          displayName: profile.data.displayName,
          profileImageUrl: profile.data.avatar,
        },
      });
    } catch (error) {
      console.error("Error connecting to Bluesky:", error);
      res.status(500).json({ error: "Failed to connect to Bluesky" });
    }
  } catch (error) {
    console.error("Error connecting to Bluesky:", error);
    res.status(500).json({ error: "Failed to connect to Bluesky" });
  }
};

module.exports = {
  initiateBlueskyConnect,
};
