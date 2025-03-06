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
      default: "",
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
        "draft",
        "scheduled",
        "published",
        "failed",
        "partially_published",
      ],
    },
    processingStatus: {
      type: String,
      enum: ["pending", "processing", "finished"],
      default: "pending",
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
            "",
          ],
          default: "",
        },
        allowComments: { type: Boolean, default: true },
        allowDuet: { type: Boolean, default: false },
        allowStitch: { type: Boolean, default: false },
        commercialContent: { type: Boolean, default: false },
        brandOrganic: { type: Boolean, default: false },
        brandedContent: { type: Boolean, default: false },
      },
      instagram: {
        videoType: {
          type: String,
          enum: ["REELS", "STORIES"],
          default: "REELS",
        },
      },
      youtube: {
        privacy: {
          type: String,
          enum: ["private", "public", "unlisted"],
          default: "public",
        },
        title: {
          type: String,
          default: "",
        },
      },
    },
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
