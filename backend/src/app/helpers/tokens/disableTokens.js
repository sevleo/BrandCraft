const Token = require("../../models/token");

const addToBlacklist = async (token) => {
  try {
    const newToken = new Token({
      token: token,
    });

    await newToken.save();
    console.log("Token added to blacklist");
  } catch (err) {
    console.error("Error blacklisting token:", err);
  }
};

const isTokenBlacklisted = async (token) => {
  try {
    const result = await Token.findOne({ token });
    return result !== null;
  } catch (err) {
    console.error("Error checking if token is blacklisted:", err);
    return false;
  }
};

module.exports = {
  addToBlacklist,
  isTokenBlacklisted,
};
