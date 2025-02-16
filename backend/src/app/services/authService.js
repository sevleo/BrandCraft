const jwt = require("jsonwebtoken");
const User = require("../models/user");
const { generateSigninToken } = require("../helpers/tokens/generateTokens");

async function verifyRefreshToken(refreshToken) {
  return new Promise((resolve, reject) => {
    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      (err, decoded) => {
        if (err) return reject(err);
        resolve(decoded);
      }
    );
  });
}

async function authenticateUser(payload) {
  return await User.findOne({ username: payload.username });
}

async function handleTokenRefresh(req) {
  const decoded = await verifyRefreshToken(req.headers.refreshtoken);
  return generateSigninToken({
    username: decoded.payload.username,
    password: decoded.payload.password,
  });
}

module.exports = {
  verifyRefreshToken,
  authenticateUser,
  handleTokenRefresh,
};
