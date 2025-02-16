const express = require("express");
const router = express.Router();
const authenticateWithRefresh = require("../middleware/authenticateWithRefresh");
const User = require("../models/user");
const ScheduledPostGroup = require("../models/scheduledPostGroup");
const ScheduledPost = require("../models/scheduledPost");
const PlatformConnection = require("../models/platformConnection");

// Admin check middleware
const isAdmin = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res
      .status(403)
      .json({ message: "Forbidden: Admin access required" });
  }
  next();
};

// Get all users
router.get("/users", authenticateWithRefresh, isAdmin, async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 });

    // Get post statistics for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const platforms = [
          "twitter",
          "threads",
          "bluesky",
          "mastodon",
          "tiktok",
          "instagram",
          "youtube",
        ];
        const stats = {
          scheduled: {},
          published: {},
          draft: {},
          failed: {},
        };

        // Get post counts for each platform
        await Promise.all(
          platforms.map(async (platform) => {
            const scheduledCount = await ScheduledPost.countDocuments({
              userId: user._id,
              platform,
              status: "scheduled",
            });

            const publishedCount = await ScheduledPost.countDocuments({
              userId: user._id,
              platform,
              status: "published",
            });

            const draftCount = await ScheduledPost.countDocuments({
              userId: user._id,
              platform,
              status: "draft",
            });

            const failedCount = await ScheduledPost.countDocuments({
              userId: user._id,
              platform,
              status: "failed",
            });

            if (scheduledCount > 0) stats.scheduled[platform] = scheduledCount;
            if (publishedCount > 0) stats.published[platform] = publishedCount;
            if (draftCount > 0) stats.draft[platform] = draftCount;
            if (failedCount > 0) stats.failed[platform] = failedCount;
          })
        );

        return {
          ...user.toObject(),
          postStats: stats,
        };
      })
    );

    res.json(usersWithStats);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get user details with posts and post bundles
router.get(
  "/users/:userId/details",
  authenticateWithRefresh,
  isAdmin,
  async (req, res) => {
    try {
      const { userId } = req.params;

      // Get user
      const user = await User.findById(userId, { password: 0 });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get user's post bundles
      const postBundles = await ScheduledPostGroup.find({
        userId: userId,
      }).sort({ scheduledTime: -1 });

      // Get user's posts
      const posts = await ScheduledPost.find({ userId: userId })
        .populate("postGroupId")
        .sort({ createdAt: -1 });

      res.json({
        user,
        postBundles,
        posts,
      });
    } catch (error) {
      console.error("Error fetching user details:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Get all post bundles
router.get(
  "/post-bundles",
  authenticateWithRefresh,
  isAdmin,
  async (req, res) => {
    try {
      const postBundles = await ScheduledPostGroup.find()
        .populate("userId", "username displayName")
        .populate("posts");
      res.json(postBundles);
    } catch (error) {
      console.error("Error fetching post bundles:", error);
      res.status(500).json({ message: "Error fetching post bundles" });
    }
  }
);

// Get all posts
router.get("/posts", authenticateWithRefresh, isAdmin, async (req, res) => {
  try {
    const posts = await ScheduledPost.find()
      .populate("userId", "username displayName")
      .populate("postGroupId");
    res.json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ message: "Error fetching posts" });
  }
});

// Get platform connections for a user
router.get(
  "/platform-connections/:userId",
  authenticateWithRefresh,
  isAdmin,
  async (req, res) => {
    try {
      const connections = await PlatformConnection.find(
        { userId: req.params.userId },
        { 
          _id: 1,
          platform: 1,
          username: 1,
        }
      );
      res.json(connections);
    } catch (error) {
      console.error("Error fetching platform connections:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

module.exports = router;
