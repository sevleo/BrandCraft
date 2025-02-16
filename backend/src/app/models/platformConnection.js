const mongoose = require("mongoose");
const appDataConnection = require("../config/MongoDbAppData");

const platformConnectionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    platform: { type: String, required: true }, // twitter, threads, bluesky, etc.
    platformId: { type: String },
    username: { type: String, required: true },
    displayName: { type: String },
    profileImageUrl: { type: String },
    accessToken: { type: String },
    refreshToken: { type: String },
    accessSecret: { type: String }, // for Twitter
    accessTokenExpiresAt: { type: Date },
    accessTokenSplit: { type: String }, // for Twitter
    password: { type: String }, // for Bluesky

    addedAt: { type: Date, default: Date.now },
  },
  {
    collection: "platformConnections",
  }
);

module.exports = appDataConnection.model(
  "PlatformConnection",
  platformConnectionSchema
);
