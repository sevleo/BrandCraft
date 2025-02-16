const express = require("express");
const router = express.Router();
const authenticateWithRefresh = require("../middleware/authenticateWithRefresh");
const youtubeController = require("../controllers/youtubeController");

// YouTube Integration
router.get(
  "/connect",
  authenticateWithRefresh,
  youtubeController.initiateYoutubeConnect
);

router.get("/callback", youtubeController.handleYoutubeCallback);

module.exports = router;
