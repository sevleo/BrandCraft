const mongoose = require("mongoose");
const appDataConnection = require("../config/MongoDbAppData");

const mediaFileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    postGroupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ScheduledPostGroup",
    },
    url: { type: String },
    urlPure: { type: String },
    uploadUrl: { type: String },
    fileName: { type: String },
    filePath: { type: String }, // Local file path (new field)
    type: { type: String, enum: ["image", "video"] },
    metadata: {
      size: { type: Number },
      mimeType: { type: String },
      width: { type: Number, default: 0 },
      height: { type: Number, default: 0 },
      aspectRatio: { type: String, default: "unknown" },
      frameRate: { type: Number, default: 0 },
      codecName: { type: String, default: "unknown" },
      bitRate: { type: Number, default: 0 },
      duration: { type: Number, default: 0 },
    },
    addedAt: { type: Date, default: Date.now },
  },
  {
    collection: "mediaFiles",
  }
);

module.exports = appDataConnection.model("MediaFile", mediaFileSchema);
