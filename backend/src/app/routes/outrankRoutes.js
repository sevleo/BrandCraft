const express = require("express");
const { webhook } = require("../controllers/outrankWebhookController");

const router = express.Router();

router.post("/webhook", webhook);

module.exports = router;
