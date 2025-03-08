require("dotenv").config();
const express = require("express");
const User = require("../models/user");

const waitlistRoutes = require("./waitlistRoutes");
const authRoutes = require("./authRoutes");
const postRoutes = require("./postRoutes");
const mediaRoutes = require("./mediaRoutes");
const twitterRoutes = require("./twitterRoutes");
const threadsRoutes = require("./threadsRoutes");
const blueskyRoutes = require("./blueskyRoutes");
const tiktokRoutes = require("./tiktokRoutes");
const instagramRoutes = require("./instagramRoutes");
const youtubeRoutes = require("./youtubeRoutes");
const mastodonRoutes = require("./mastodonRoutes");
const linkedinRoutes = require("./linkedinRoutes");
const outrankRoutes = require("./outrankRoutes");

const adminRoutes = require("./adminRoutes");
const connectedAccountsRoutes = require("./connectedAccountsRoutes");

const router = express.Router();

router.use("/waitlist", waitlistRoutes);
router.use("/auth", authRoutes);
router.use("/posts", postRoutes);
router.use("/media", mediaRoutes);
router.use("/connected-accounts", connectedAccountsRoutes);
router.use("/auth/twitter", twitterRoutes);
router.use("/auth/threads", threadsRoutes);
router.use("/auth/bluesky", blueskyRoutes);
router.use("/auth/tiktok", tiktokRoutes);
router.use("/auth/instagram", instagramRoutes);
router.use("/auth/youtube", youtubeRoutes);
router.use("/auth/mastodon", mastodonRoutes);
router.use("/auth/linkedin", linkedinRoutes);
router.use("/admin", adminRoutes);

router.use("/outrank", outrankRoutes);

router.use("/performance-test", async (req, res) => {
  try {
    const reqStart = Date.now();
    console.log(`[${new Date().toISOString()}] Performance test started`);

    const start = Date.now();
    const user = await User.findOne({ username: "seva.leonov@hotmail.com" });
    const queryTime = Date.now() - start;
    console.log(`[${new Date().toISOString()}] DB Query Time: ${queryTime}ms`);

    res.json({
      message: "Performance test complete",
      queryTime: queryTime,
      user: user?._id || user,
    });

    console.log(
      `[${new Date().toISOString()}] Response sent, total time: ${
        Date.now() - reqStart
      }ms`
    );
  } catch (error) {
    console.error("Error in performance test:", error);
    res.status(500).json({ error: "Database query failed" });
  }
});

router.use("/performance-test-2", async (req, res) => {
  console.log("Performance test 2 started");
  res.json({
    message: "Performance test 2 complete",
  });
});

router.use("/performance-test-2", async (req, res) => {
  console.log("Performance test 2 started");
  res.json({
    message: "Performance test 2 complete",
  });
});

module.exports = router;
