const mongoose = require("mongoose");
const appDataConnection = require("../config/MongoDbAppData");

const scheduledPostSchema = new mongoose.Schema({
  postGroupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ScheduledPostGroup",
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  content: {
    type: String,
  },
  platform: {
    type: String,
  },
  platformId: {
    type: String,
  },
  status: {
    type: String,
    enum: ["draft", "scheduled", "published", "failed"],
  },

  errorMessage: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  // container id for Threads video upload
  mediaContainerId: {
    type: String,
  },
  // container id for Tiktok video upload
  publishId: {
    type: String,
  },
  // container id for Mastodon video upload
  mediaId: {
    type: String,
  },
  // container id for YouTube video upload
  uploadId: {
    type: String,
  },
  attempts: {
    type: Number,
    default: 0,
  },
});

// Update the updatedAt timestamp before saving
scheduledPostSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = appDataConnection.model("ScheduledPost", scheduledPostSchema);
