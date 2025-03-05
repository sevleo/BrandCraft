require("dotenv").config();
const express = require("express");

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

module.exports = router;
