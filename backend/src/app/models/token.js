const mongoose = require("mongoose");
const appDataConnection = require("../config/MongoDbAppData");

const tokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { collection: "disabledTokens" }
);

module.exports = appDataConnection.model("Token", tokenSchema);
