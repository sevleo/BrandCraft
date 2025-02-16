const express = require("express");
const authenticateWithRefresh = require("../middleware/authenticateWithRefresh");
const instagramController = require("../controllers/instagramController");

const router = express.Router();

router.get(
  "/connect",
  authenticateWithRefresh,
  instagramController.initiateInstagramConnect
);
router.get("/callback", instagramController.handleInstagramCallback);

module.exports = router;
