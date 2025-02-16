const express = require("express");
const {
  handleEmailData,
  countEmails,
} = require("../controllers/emailDataController");
const { trackVisitor } = require("../controllers/visitorDataController");

const router = express.Router();

router.post("/add-email", handleEmailData);
router.get("/emails-count", countEmails);
router.post("/track-visitor", trackVisitor);

module.exports = router;
