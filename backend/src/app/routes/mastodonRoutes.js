const express = require("express");
const mastodonController = require("../controllers/mastodonController");
const authenticateWithRefresh = require("../middleware/authenticateWithRefresh");

const router = express.Router();

// OAuth routes
router.get("/connect", authenticateWithRefresh, mastodonController.connect);
router.get("/callback", mastodonController.callback);

module.exports = router;
