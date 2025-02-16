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
    mimeType: { type: String },
    size: { type: Number },
    type: { type: String, enum: ["image", "video"] },
    filePath: { type: String }, // Local file path (new field)

    addedAt: { type: Date, default: Date.now },
  },
  {
    collection: "mediaFiles",
  }
);

module.exports = appDataConnection.model("MediaFile", mediaFileSchema);
