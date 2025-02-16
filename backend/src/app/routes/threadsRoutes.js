const express = require("express");
const authenticateWithRefresh = require("../middleware/authenticateWithRefresh");
const threadsController = require("../controllers/threadsController");

const router = express.Router();

router.get(
  "/connect",
  authenticateWithRefresh,
  threadsController.initiateThreadsConnect
);
router.get("/callback", threadsController.handleThreadsCallback);

module.exports = router;
