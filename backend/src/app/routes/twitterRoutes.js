const express = require("express");
const authenticateWithRefresh = require("../middleware/authenticateWithRefresh");
const twitterController = require("../controllers/twitterController");

const router = express.Router();

router.get(
  "/connect",
  authenticateWithRefresh,
  twitterController.initiateTwitterConnect
);

router.get("/callback", twitterController.handleTwitterCallback);

module.exports = router;
