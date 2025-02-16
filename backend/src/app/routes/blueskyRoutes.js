const express = require("express");
const authenticateWithRefresh = require("../middleware/authenticateWithRefresh");
const blueskyController = require("../controllers/blueskyController");

const router = express.Router();

router.post(
  "/connect",
  authenticateWithRefresh,
  blueskyController.initiateBlueskyConnect
);

module.exports = router;
