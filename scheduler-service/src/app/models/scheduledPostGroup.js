const mongoose = require("mongoose");
const appDataConnection = require("../config/MongoDbAppData");

const ScheduledPostGroupSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  scheduledTime: {
    type: Date,
  },
  platforms: [
    {
      type: String,
    },
  ],
  sameContent: {
    type: Boolean,
    default: true,
  },
  content: {
    type: String,
  },
  videoTimestamp: {
    type: Number,
    default: 0,
  },
  media: [
    {
      url: { type: String, required: true }, // S3 URL of the uploaded file
      filename: { type: String, required: true }, // Unique filename in S3
      mimetype: { type: String, required: true }, // File MIME type (e.g., "image/png")
      size: { type: Number, required: true }, // File size in bytes
      type: { type: String, enum: ["image", "video"], required: true }, // Media type
      filePath: { type: String }, // Local file path (new field)
    },
  ],
  mediaFiles: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MediaFile",
    },
  ],
  status: {
    type: String,
    enum: [
      "pending",
      "draft",
      "scheduled",
      "processing",
      "published",
      "failed",
      "partially_published",
    ],
  },
  posts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ScheduledPost",
    },
  ],
  errorMessage: {
    type: String,
  },
  cleanupRequired: { type: Boolean, default: true },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt timestamp before saving
ScheduledPostGroupSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = appDataConnection.model(
  "ScheduledPostGroup",
  ScheduledPostGroupSchema
);
