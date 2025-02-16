const jwt = require("jsonwebtoken");

const generateSigninToken = (payload) => {
  return jwt.sign({ payload }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "1d",
  });
};

const generateRefreshToken = (payload) => {
  return jwt.sign({ payload }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });
};

module.exports = {
  generateSigninToken,
  generateRefreshToken,
};
