const express = require("express");
const authenticateWithRefresh = require("../middleware/authenticateWithRefresh");
const connectedAccountsController = require("../controllers/connectedAccountsController");

const router = express.Router();

router.get(
  "/get-all-accounts",
  authenticateWithRefresh,
  connectedAccountsController.getAllConnectedAccounts
);

router.post(
  "/disconnect-account",
  authenticateWithRefresh,
  connectedAccountsController.disconnectConnectedAccount
);

module.exports = router;
