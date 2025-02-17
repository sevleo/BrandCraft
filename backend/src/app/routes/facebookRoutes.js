const express = require("express");
const authenticateWithRefresh = require("../middleware/authenticateWithRefresh");
const facebookController = require("../controllers/facebookController");

const router = express.Router();

router.get(
  "/connect",
  authenticateWithRefresh,
  facebookController.initiateFacebookConnect
);
router.get("/callback", facebookController.handleFacebookCallback);

module.exports = router; 