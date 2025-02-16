// This middleware allows entering by refreshToken and sends new access token to the client

const passport = require("passport");
const { isTokenBlacklisted } = require("../helpers/tokens/disableTokens");
const authService = require("../services/authService");

const authenticateWithRefresh = async (req, res, next) => {
  passport.authenticate("jwt", { session: false }, async (err, user) => {
    if (
      (await isTokenBlacklisted(req.headers.authorization)) ||
      (await isTokenBlacklisted(req.headers.refreshtoken))
    ) {
      return res.status(401).send({
        success: false,
        message: "Unauthorized",
      });
    }

    // If user is authenticated, proceed
    if (user) {
      req.user = user;
      return next();
    }

    if (!req.headers.refreshtoken) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      req.newAccessToken = await authService.handleTokenRefresh(req);
      const decoded = await authService.verifyRefreshToken(
        req.headers.refreshtoken
      );

      const user = await authService.authenticateUser(decoded.payload);

      if (user) {
        req.user = user;
        return next();
      } else {
        return res.status(401).json({ message: "User not found in DB" });
      }
    } catch (err) {
      console.error(err);
      return res.status(401).json({ message: "Unauthorized" });
    }
  })(req, res, next);
};

module.exports = authenticateWithRefresh;
