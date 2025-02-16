const express = require("express");
const authController = require("../controllers/authController");
const authenticateWithRefresh = require("../middleware/authenticateWithRefresh");

const router = express.Router();

router.post("/signup", authController.signUp);
router.post("/signin", authController.signIn);
router.post("/logout", authController.logout);
router.get(
  "/verify-auth",
  authenticateWithRefresh,
  authController.sendAuthData
);
router.post(
  "/update-password",
  authenticateWithRefresh,
  authController.updatePassword
);

router.post(
  "/set-password",
  authenticateWithRefresh,
  authController.setPassword
);

// Federated Login
router.get("/login/federated/google", authController.loginFederatedGoogle);
router.get("/oauth2/redirect/google", authController.redirectGoogle);
router.get("/login/federated/github", authController.loginFederatedGithub);
router.get("/oauth2/redirect/github", authController.redirectGithub);
router.get("/login/federated/facebook", authController.loginFederatedFacebook);
router.get("/oauth2/redirect/facebook", authController.redirectFacebook);

module.exports = router;
