const express = require("express");
const authenticateWithRefresh = require("../middleware/authenticateWithRefresh");
const linkedinController = require("../controllers/linkedinController");

const router = express.Router();

router.get(
  "/connect",
  authenticateWithRefresh,
  linkedinController.initiateLinkedinConnect
);
router.get("/callback", linkedinController.handleLinkedinCallback);

module.exports = router;
