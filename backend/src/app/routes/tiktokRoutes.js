const express = require("express");
const authenticateWithRefresh = require("../middleware/authenticateWithRefresh");
const tiktokController = require("../controllers/tiktokController");

const router = express.Router();

// TikTok API
router.post(
  "/connect",
  authenticateWithRefresh,
  tiktokController.initiateTikTokConnect
);
router.get("/callback", tiktokController.handleTikTokCallback);

router.post(
  "/get-creator-info",
  authenticateWithRefresh,
  tiktokController.getCreatorInfo
);

module.exports = router;
