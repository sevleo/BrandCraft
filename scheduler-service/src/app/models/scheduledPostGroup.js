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
  platformSettings: {
    tiktok: {
      viewerSetting: {
        type: String,
        enum: [
          "PUBLIC_TO_EVERYONE",
          "MUTUAL_FOLLOW_FRIENDS",
          "FOLLOWER_OF_CREATOR",
          "SELF_ONLY",
        ],
      },
      allowComments: Boolean,
      allowDuet: Boolean,
      allowStitch: Boolean,
      commercialContent: Boolean,
      brandOrganic: Boolean,
      brandedContent: Boolean,
    },
    instagram: {
      videoType: {
        type: String,
        enum: ["REELS", "STORIES"],
      },
    },
    youtube: {
      privacy: {
        type: String,
        enum: ["private", "public", "unlisted"],
      },
      title: {
        type: String,
      },
    },
  },
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
