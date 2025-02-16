const asyncHandler = require("express-async-handler");
const User = require("../models/user");
const {
  generateRefreshToken,
  generateSigninToken,
} = require("../helpers/tokens/generateTokens");
const { addToBlacklist } = require("../helpers/tokens/disableTokens");
const { isValidEmail, isValidPassword } = require("../helpers/validation");
const { hashPassword, comparePassword } = require("../helpers/bcryptHelper");
const passport = require("passport");

const signUp = asyncHandler(async (req, res, next) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required" });
  }

  if (!isValidEmail(username)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  if (!isValidPassword(password)) {
    return res
      .status(400)
      .json({ message: "Password must be at least 8 characters long" });
  }

  const existingUser = await User.findOne({ username });
  if (existingUser) {
    return res.status(409).json({ message: "Username exists" });
  }

  const hashedPassword = await hashPassword(password);
  const newUser = new User({
    username: username,
    displayName: username,
    password: hashedPassword,
    creationDate: new Date(),
    type: "password",
    twitterAccount: null,
    threadsAccount: null,
    blueskyAccount: null,
  });

  await newUser.save();

  const payload = { username, password };

  res.status(200).json({
    success: true,
    message: "User created successfully",
    accessToken: generateSigninToken(payload),
    refreshToken: generateRefreshToken(payload),
    username: username,
  });
});

const signIn = async (req, res, next) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required" });
  }

  const user = await User.findOne({ username });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const validPassword = await comparePassword(password, user.password);
  if (!validPassword) {
    return res.status(401).json({ message: "Invalid password" });
  }

  const payload = { username: user.username, password };

  const accessToken = generateSigninToken(payload);
  const refreshToken = generateRefreshToken(payload);

  res.status(200).json({
    success: true,
    message: "Logged in successfully",
    accessToken: accessToken,
    refreshToken: refreshToken,
    username: user.username,
  });
};

const logout = asyncHandler(async (req, res) => {
  const accessToken = req.body.accessToken;
  const refreshToken = req.body.refreshToken;

  if (!accessToken || !refreshToken) {
    return res.sendStatus(401);
  }

  await addToBlacklist(accessToken);
  await addToBlacklist(refreshToken);

  res.status(200).json({ message: "Logged out successfully" });
});

const sendAuthData = asyncHandler(async (req, res) => {
  const authData = {
    user: {
      username: req.user.username,
      displayName: req.user.displayName,
      type: req.user.type,
      passwordSet: req.user.password ? true : false,
      isAdmin: req.user.isAdmin,
    },
    newAccessToken: req.newAccessToken,
  };

  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, private"
  );
  return res.status(200).json(authData);
});

const updatePassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ username: req.user.username });

  // Validate password
  const validPassword = await comparePassword(
    req.body.currentPassword,
    user._doc.password
  );

  if (!validPassword) {
    return res
      .status(401)
      .json({ message: "The current password you entered is incorrect" });
  } else {
    const newPassword = await hashPassword(req.body.newPassword);
    await user.updateOne({ password: newPassword });
  }
  res.status(200).json({ message: "Successfully updated password" });
});

const setPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const userId = req.user.id;

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password is required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const hashedPassword = await hashPassword(newPassword);
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password set successfully",
    });
  } catch (error) {
    console.error("Error in setPassword:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while setting the password",
    });
  }
};

const federatedLogin = (provider) =>
  asyncHandler((req, res, next) => {
    passport.authenticate(provider)(req, res, next);
  });

const federatedRedirect = (provider) =>
  asyncHandler((req, res, next) => {
    passport.authenticate(provider, { session: false }, async (err, user) => {
      if (err || !user) {
        return res.redirect(`${process.env.FRONTEND_URL}`);
      }
      const accessToken = generateSigninToken({ username: user.username });
      const refreshToken = generateRefreshToken({ username: user.username });

      console.log(process.env.FRONTEND_URL);
      console.log(
        `${process.env.FRONTEND_URL}/?accessToken=${accessToken}&refreshToken=${refreshToken}`
      );

      res.redirect(
        `${process.env.FRONTEND_URL}/?accessToken=${accessToken}&refreshToken=${refreshToken}`
      );
    })(req, res, next);
  });

module.exports = {
  signUp,
  signIn,
  logout,
  sendAuthData,
  updatePassword,
  setPassword,
  loginFederatedGoogle: federatedLogin("google"),
  redirectGoogle: federatedRedirect("google"),
  loginFederatedGithub: federatedLogin("github"),
  redirectGithub: federatedRedirect("github"),
  loginFederatedFacebook: federatedLogin("facebook"),
  redirectFacebook: federatedRedirect("facebook"),
};
