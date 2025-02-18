const mongoose = require("mongoose");
const appDataConnection = require("../config/MongoDbAppData");

const ScheduledPostGroupSchema = new mongoose.Schema(
  {
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
  },
  { timestamps: true }
);

// Update the updatedAt timestamp before saving
ScheduledPostGroupSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = appDataConnection.model(
  "ScheduledPostGroup",
  ScheduledPostGroupSchema
);
