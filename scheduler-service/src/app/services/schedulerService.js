const cron = require("node-cron");
const path = require("path");
const fs = require("fs/promises");

const twitterController = require("../controllers/twitterController");
const threadsController = require("../controllers/threadsController");
const blueskyController = require("../controllers/blueskyController");
const tiktokController = require("../controllers/tiktokController");
const instagramController = require("../controllers/instagramController");
const mastodonController = require("../controllers/mastodonController");
const youtubeController = require("../controllers/youtubeController");

const ScheduledPost = require("../models/scheduledPost");
const ScheduledPostGroup = require("../models/scheduledPostGroup");
const User = require("../models/user");
const {
  downloadFileFromS3,
  deleteFileFromS3,
} = require("../services/s3Service");

const MediaFile = require("../models/mediaFile");

class SchedulerService {
  constructor() {
    this.job = null;
  }

  // Helper function to ensure directory exists
  async ensureDir(dir) {
    try {
      await fs.access(dir);
    } catch (error) {
      await fs.mkdir(dir, { recursive: true, mode: 0o777 });
    }
  }

  async processScheduledPosts() {
    console.log("Processing scheduled posts...");

    try {
      const now = new Date();

      // Step 1: Find post groups that need media processing
      const postGroups = await ScheduledPostGroup.find({
        status: "scheduled",
        processingStatus: "pending",
        scheduledTime: { $lte: now },
      });

      console.log(`Found ${postGroups.length} post groups to process.`);

      // Process media uploads in parallel
      await Promise.all(
        postGroups.map((group) => this.processMediaForGroup(group))
      );

      console.log("All post groups media processed.");

      // Step 2: Find posts that belong to a "processing" group and are not failed or pending
      const postsToProcess = await ScheduledPost.find({
        status: { $nin: ["failed", "pending", "published"] },
      }).populate("postGroupId");

      // Filter posts to ensure they belong to a processing group
      const validPosts = postsToProcess.filter(
        (post) => post?.postGroupId?.processingStatus === "processing"
      );

      console.log(`Found ${validPosts.length} posts to process.`);

      // Even if no new groups were found, we still need to process existing posts
      if (validPosts && validPosts.length > 0) {
        await Promise.all(
          validPosts.map((post) => this.processSinglePost(post))
        );
      }

      console.log("All scheduled posts processed.");

      // Step 3: **Run group status updates after all posts are processed**
      await this.updateAllGroupStatuses();
    } catch (error) {
      console.error("Error in processScheduledPosts:", error);
    }
  }

  async processMediaForGroup(group) {
    console.log(`Processing media for group: ${group._id}`);

    // Step 1: Populate mediaFiles to access full media details
    await group.populate("mediaFiles");

    // Step 2: Update processingStatus to "processing"
    group.processingStatus = "processing";
    await group.save();

    // Step 3: Download media if filePath is missing
    const updates = [];

    await Promise.all(
      group.mediaFiles.map(async (media) => {
        if (!media.filePath) {
          const sanitizedFilename = media.fileName.replace(/\//g, "_");
          const tempPath = path.join("/tmp", sanitizedFilename);

          console.log(`Downloading media for group ${group._id}: ${tempPath}`);

          await downloadFileFromS3(media.url, tempPath);

          // Collect updates for bulk update
          updates.push({
            updateOne: {
              filter: { _id: media._id },
              update: { filePath: tempPath },
            },
          });
        }
      })
    );
    // Step 4: Perform a single bulk update if there are media updates
    if (updates.length > 0) {
      await MediaFile.bulkWrite(updates);
    }

    await group.save();
  }

  async processSinglePost(post) {
    console.log(`Processing single post: ${post._id}`);

    try {
      post.status = "pending";
      await post.save();

      const user = await User.findById(post.userId);

      await post.postGroupId.populate("mediaFiles");

      const mediaFiles = post.postGroupId.mediaFiles.map((media) => ({
        path: media.filePath,
        mimetype: media.mimeType,
        url: media.url,
        type: media.type,
      }));

      console.log("Publishing post...");

      await this.publishToPlatform(post.platform, post, user, mediaFiles);

      console.log("setting status to published on post", post._id);
      post.status = "published";
      post.errorMessage = null;

      await post.save();
    } catch (error) {
      console.error(`Error processing post ${post._id}: ${error}`);
      console.log(error);

      // Don't mark as failed if it's just media processing
      if (error.message !== "MEDIA_PROCESSING") {
        post.status = "failed";
        post.errorMessage = error;
        await post.save();
      }
    }
  }

  async publishToPlatform(platform, post, user, mediaFiles) {
    console.log("publish to platform");

    if (post.platform === "twitter") {
      await twitterController.postTweetInternal({
        content: post.content,
        user,
        media: mediaFiles,
        post,
      });
    } else if (post.platform === "threads") {
      await threadsController.postToThreadsInternal({
        content: post.content,
        user,
        media: mediaFiles,
        post,
      });
    } else if (post.platform === "bluesky") {
      await blueskyController.postToBlueskyInternal({
        content: post.content,
        user,
        media: mediaFiles,
        post,
      });
    } else if (post.platform === "tiktok") {
      await tiktokController.postTikTokVideoInternal({
        content: post.content,
        user,
        media: mediaFiles,
        post,
      });
    } else if (post.platform === "instagram") {
      await instagramController.postToInstagramInternal({
        content: post.content,
        user,
        media: mediaFiles,
        post,
      });
    } else if (post.platform === "mastodon") {
      await mastodonController.postToMastodonInternal({
        content: post.content,
        user,
        media: mediaFiles,
        post,
      });
    } else if (post.platform === "youtube") {
      await youtubeController.postToYoutubeInternal({
        content: post.content,
        user,
        media: mediaFiles,
        post,
      });
    } else {
      throw new Error(`Unsupported platform or missing account: ${platform}`);
    }
  }

  async updateAllGroupStatuses() {
    console.log("Updating all group statuses...");

    const postGroups = await ScheduledPostGroup.find().populate("posts");

    await Promise.all(
      postGroups
        .filter((group) => group.status !== "draft" && group.posts.length > 0) // Exclude drafts and empty groups
        .map(async (group) => {
          const totalPosts = group.posts.length;

          const publishedPosts = group.posts.filter(
            (post) => post.status === "published"
          ).length;

          const failedPosts = group.posts.filter(
            (post) => post.status === "failed"
          ).length;

          if (publishedPosts === totalPosts) {
            group.status = "published";
            group.processingStatus = "finished";
          } else if (totalPosts === failedPosts) {
            group.status = "failed";
            group.processingStatus = "finished";
          } else if (totalPosts === publishedPosts + failedPosts) {
            group.status = "partially_published";
            group.processingStatus = "finished";
          } else {
            return; // Group is still processing, don't update status
          }

          await group.save();

          // Step 5: Cleanup media files only when group is fully processed
          await this.cleanupMediaFiles(group);
        })
    );

    console.log("All group statuses updated.");
  }

  async cleanupMediaFiles(group) {
    if (!group.cleanupRequired) return; // Only clean if it's required
    try {
      await group.populate("mediaFiles");

      // Step 1: Collect updates for bulk delete
      const mediaIdsToDelete = [];
      const deletePromises = [];

      for (const media of group.mediaFiles) {
        if (!media.filePath) continue;

        // Delete from S3 and local storage
        // deletePromises.push(deleteFileFromS3(media.url));
        deletePromises.push(fs.unlink(media.filePath));
        console.log(`Deleted: ${media.filePath}`);
        // mediaIdsToDelete.push(media._id);
      }

      // Step 2: Execute all delete operations in parallel
      await Promise.all(deletePromises);

      // Step 3: Bulk delete media files from the database
      if (mediaIdsToDelete.length > 0) {
        await MediaFile.deleteMany({ _id: { $in: mediaIdsToDelete } });
      }
    } catch (error) {
      console.error("Error cleaning up media files:", error);
    } finally {
      group.cleanupRequired = false;
      await group.save();
    }
  }

  async cleanupOrphanedMediaFiles() {
    try {
      console.log("Starting cleanup of orphaned media files...");

      // Find all media files that don't have a postGroupId and are older than 1 hour
      const oneMinuteAgo = new Date(Date.now() - 60 * 60000);
      const orphanedFiles = await MediaFile.find({
        postGroupId: null,
        addedAt: { $lt: oneMinuteAgo },
      });

      if (orphanedFiles.length === 0) {
        console.log("No orphaned media files found.");
        return;
      }

      console.log(
        `Found ${orphanedFiles.length} orphaned media files older than 1 hour.`
      );

      try {
        await Promise.all(
          orphanedFiles.map(async (file) => {
            try {
              // Delete from S3
              console.log(`Deleting S3 file: ${file.url}`);
              await deleteFileFromS3(file.url);

              // Delete local file if it exists
              if (file.filePath) {
                console.log(`Deleting local file: ${file.filePath}`);
                await fs.unlink(file.filePath);
              }

              // Delete the database record
              console.log(`Deleting media file record: ${file._id}`);
              await file.deleteOne();
            } catch (error) {
              console.error(`Error processing file ${file._id}:`, error);
            }
          })
        );
      } catch (error) {
        console.error("Error cleaning up orphaned media files:", error);
      }

      console.log("Orphaned media files cleanup completed.");
    } catch (error) {
      console.error("Error in cleanupOrphanedMediaFiles:", error);
    }
  }

  start() {
    if (this.job) {
      console.log("Scheduler is already running");
      return;
    }
    // Run every minute to check for posts that need to be published
    this.job = cron.schedule(
      "* * * * *",
      this.processScheduledPosts.bind(this)
    );
    this.job = cron.schedule(
      "* * * * *",
      this.cleanupOrphanedMediaFiles.bind(this)
    );
    this.job = cron.schedule(
      "* * * * *",
      this.cleanupOrphanedMediaFiles.bind(this)
    );
    console.log("Scheduler service started");
  }

  stop() {
    if (this.job) {
      this.job.stop();
      this.job = null;
      console.log("Scheduler service stopped");
    }
  }
}

// Create and export a singleton instance
const schedulerService = new SchedulerService();
module.exports = schedulerService;
