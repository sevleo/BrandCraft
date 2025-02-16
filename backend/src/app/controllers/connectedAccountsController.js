const User = require("../models/user");
const PlatformConnection = require("../models/platformConnection");

const getAllConnectedAccounts = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const connections = await PlatformConnection.find({
      userId: user._id,
    });
    res.json({ accounts: connections });
  } catch (error) {
    console.error("Get all connected accounts error:", error);
    res.status(500).json({ error: "Failed to get all connected accounts" });
  }
};

const disconnectConnectedAccount = async (req, res) => {
  try {
    const { platformId } = req.body;

    // Find and remove the platform connection
    const connection = await PlatformConnection.findOneAndDelete({
      userId: req.user._id,
      platformId: platformId,
    });

    if (!connection) {
      return res.status(404).json({ error: "Connected account not found" });
    }

    // Remove the reference from user's platformConnections array using the connection's _id
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { platformConnections: connection._id },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error disconnecting TikTok account:", error);
    res.status(500).json({ error: "Failed to disconnect TikTok account" });
  }
};

module.exports = { getAllConnectedAccounts, disconnectConnectedAccount };
