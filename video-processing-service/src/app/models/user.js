const mongoose = require("mongoose");
const appDataConnection = require("../config/MongoDbAppData");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    displayName: { type: String, required: false },
    password: { type: String, required: false },
    googleId: { type: String, required: false },
    githubId: { type: String, required: false },
    facebookId: { type: String, required: false },
    creationDate: { type: Date, default: Date.now },
    type: { type: String, required: false }, // Type of user: google, password, facebook, etc.
    isAdmin: { type: Boolean, default: false },
    platformConnections: [
      { type: mongoose.Schema.Types.ObjectId, ref: "PlatformConnection" },
    ],
  },
  {
    timestamps: true,
    collection: "users",
  }
);

module.exports = appDataConnection.model("User", userSchema);
