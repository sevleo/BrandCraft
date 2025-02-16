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
