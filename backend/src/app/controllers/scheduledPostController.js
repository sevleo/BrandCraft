const ScheduledPost = require("../models/scheduledPost");
const ScheduledPostGroup = require("../models/scheduledPostGroup");
const { uploadFileToS3, deleteFileFromS3 } = require("../services/s3Service");
const MediaFile = require("../models/mediaFile");
const platformConnection = require("../models/platformConnection");
const axios = require("axios");

exports.createPostGroup = async (req, res) => {
  try {
    const { status } = req.body;
    const userId = req.user._id;

    const postGroup = new ScheduledPostGroup({
      userId: userId,
      status: status,
    });

    await postGroup.save();

    res.json({ success: true, postGroup });
  } catch (error) {
    console.error("Create scheduled post error:", error);
    res.status(500).json({ error: "Failed to create scheduled post" });
  }
};

exports.updatePostGroup = async (req, res) => {
  try {
    const {
      content,
      scheduledTime,
      platforms,
      sameContent,
      status,
      keptMediaUrls,
      videoTimestamp,
      platformSettings,
    } = req.body;
    const userId = req.user._id;
    const { id } = req.params;

    console.log("updating post group");
    console.log("status", status);

    // Find bundle and verify ownership
    const postGroup = await ScheduledPostGroup.findOneAndUpdate(
      {
        _id: id,
        userId,
      },
      {
        status: status,
        $currentDate: { updatedAt: true },
      },
      { new: true }
    );

    // Verify bundle hasn't been published
    if (postGroup.status === "published" || postGroup.status === "failed") {
      return res.status(400).json({
        error: "Cannot update bundle that has already been published or failed",
      });
    }

    if (
      !content &&
      !platforms &&
      !scheduledTime &&
      !keptMediaUrls &&
      !videoTimestamp &&
      !platformSettings &&
      !req.files?.media
    ) {
      return res.json({ success: true, postGroup });
    }

    // Parse arrays from form data
    const parsedPlatforms =
      typeof platforms === "string" ? JSON.parse(platforms) : platforms;
    const parsedKeptMediaUrls =
      typeof keptMediaUrls === "string"
        ? JSON.parse(keptMediaUrls)
        : keptMediaUrls;

    // Step 1: Identify and delete removed media files
    const mediaToDelete = await MediaFile.find({
      postGroupId: postGroup._id,
      url: { $nin: parsedKeptMediaUrls }, // Find media that is NOT in keptMediaUrls
    });

    await Promise.all(
      mediaToDelete.map(async (media) => {
        try {
          await deleteFileFromS3(media.url); // Delete from S3
          await media.deleteOne(); // Remove from DB
          await ScheduledPostGroup.updateOne(
            { _id: postGroup._id },
            { $pull: { mediaFiles: media._id } }
          );
        } catch (error) {
          console.error("Error deleting media:", error);
        }
      })
    );

    // Step 2: Keep media files that are still being used
    const keptMedia = await MediaFile.find({
      postGroupId: postGroup._id,
      url: { $in: parsedKeptMediaUrls },
    });

    let newMediaFiles = [];

    // Handle image uploads
    if (req.files?.media?.length > 0) {
      const uploadedFiles = [];
      const imageFiles = await handleImageUpload(req.files, userId);
      uploadedFiles.push(...imageFiles);

      // Step 4: Save new media files to the database
      newMediaFiles = await Promise.all(
        uploadedFiles.map(async (file) => {
          const newMediaFile = new MediaFile({
            userId: userId,
            postGroupId: postGroup._id,
            url: file.url,
            fileName: file.filename,
            mimeType: file.mimeType,
            size: file.size,
            type: file.type,
          });
          await newMediaFile.save();
          return newMediaFile._id;
        })
      );
    }

    // Step 6: Get all existing posts for this group
    const existingPosts = await ScheduledPost.find({
      postGroupId: postGroup._id,
    });

    // Step 7: Update or create posts for each platform
    const updatedPosts = await Promise.all(
      parsedPlatforms.map(async (platform) => {
        const platformName = platform.split("-")[0];
        const platformId = platform.split("-").slice(1).join("-");
        let post = existingPosts.find((p) => p.platformId === platformId);

        if (post) {
          // Update existing post
          post.content = content;
          if (status) {
            post.status = status;
          }
          post.videoTimestamp = videoTimestamp ? parseFloat(videoTimestamp) : 0;

          post.platform = platformName;
          post.platformId = platformId;
        } else {
          // Create new post for new platform
          post = new ScheduledPost({
            postGroupId: postGroup._id,
            userId,
            content,
            platform: platformName,
            platformId: platformId,
            status: status,
            videoTimestamp: videoTimestamp ? parseFloat(videoTimestamp) : 0,
          });
        }

        await post.save();
        return post;
      })
    );

    // Step 8: Delete any posts that are no longer relevant
    const parsedPlatformIds = parsedPlatforms.map((platform) => {
      const platformParts = platform.split("-");
      return platformParts.slice(1).join("-"); // Extract everything after the first '-'
    });

    await ScheduledPost.deleteMany({
      postGroupId: postGroup._id,
      platformId: { $nin: parsedPlatformIds }, // Delete only posts that are no longer needed
    });

    // Construct the update object dynamically
    const updateData = {};

    // Only include fields if they have values
    if (content !== undefined) updateData.content = content;

    if (scheduledTime && scheduledTime !== undefined) {
      const validatedTime = await validateScheduledTime(scheduledTime);
      if (validatedTime) updateData.scheduledTime = validatedTime;
    }
    if (parsedPlatforms !== undefined) updateData.platforms = parsedPlatforms;
    if (sameContent !== undefined)
      updateData.sameContent = sameContent === "true";
    if (videoTimestamp !== undefined)
      updateData.videoTimestamp = parseFloat(videoTimestamp);
    if (status !== undefined) updateData.status = status || postGroup.status;

    // Update mediaFiles and posts if they exist
    const allMediaFiles = [...keptMedia.map((m) => m._id), ...newMediaFiles];
    if (allMediaFiles.length > 0) updateData.mediaFiles = allMediaFiles;

    if (updatedPosts && updatedPosts.length > 0) {
      updateData.posts = updatedPosts.map((post) => post._id);
    }

    // Add platform-specific settings
    if (platformSettings) {
      const parsedPlatformSettings = JSON.parse(platformSettings);
      updateData.platformSettings = parsedPlatformSettings;
    }

    // Perform the update only if there is data to update
    if (Object.keys(updateData).length > 0) {
      await postGroup.updateOne(updateData);
    }

    res.json({ success: true, postGroup });

    // await postGroup.updateOne({
    //   content: content,
    //   scheduledTime: await validateScheduledTime(scheduledTime),
    //   platforms: parsedPlatforms,
    //   sameContent: sameContent === "true",
    //   videoTimestamp: videoTimestamp ? parseFloat(videoTimestamp) : 0,
    //   status: status || postGroup.status,
    //   mediaFiles: [...keptMedia.map((m) => m._id), ...newMediaFiles],
    //   posts: updatedPosts.map((post) => post._id),
    // });

    // res.json({ success: true, postGroup });
  } catch (error) {
    console.error("Update scheduled post error:", error);
    res.status(500).json({ error: "Failed to update scheduled post" });
  }
};

exports.deleteScheduledPost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Find the post group and verify ownership
    const postGroup = await ScheduledPostGroup.findOne({
      _id: id,
      userId,
    });

    if (!postGroup) {
      return res.status(404).json({ error: "Post group not found" });
    }

    // Step 1: Retrieve associated media files
    const mediaFiles = await MediaFile.find({ postGroupId: postGroup._id });

    // Step 2: Delete media files from S3
    await Promise.all(
      mediaFiles.map(async (media) => {
        try {
          await deleteFileFromS3(media.url); // Delete from S3
        } catch (error) {
          console.error(`Failed to delete file ${media.url}:`, error);
        }
      })
    );

    // Step 3: Remove media records from the database
    await MediaFile.deleteMany({ postGroupId: postGroup._id });

    // Step 4: Delete all associated posts
    await ScheduledPost.deleteMany({ postGroupId: postGroup._id });

    // Step 5: Delete the post group
    await postGroup.deleteOne();

    res.json({ success: true });
  } catch (error) {
    console.error("Delete scheduled post error:", error);
    res.status(500).json({ error: "Failed to delete scheduled post" });
  }
};

exports.getPostGroups = async (req, res) => {
  try {
    const userId = req.user._id;
    const postGroups = await ScheduledPostGroup.find({ userId })
      .sort({ scheduledTime: -1 }) // Sort by newest first
      .populate({
        path: "posts",
        select: "content platform platformId status errorMessage ",
      })
      .populate({
        path: "mediaFiles",
        select: "url key fileName mimeType size type",
      })
      .select(
        "scheduledTime platforms mediaFiles status content sameContent platformSettings videoTimestamp updatedAt createdAt"
      );

    // Refresh Threads profil
    const threadsConnections = await platformConnection.find({
      userId,
      platform: "threads",
    });
    threadsConnections.forEach(async (connection) => {
      const accessToken = connection.accessToken;

      const userDetailsUrl = `https://graph.threads.net/me?fields=username,threads_profile_picture_url&access_token=${accessToken}`;

      const userResponse = await axios.get(userDetailsUrl);

      connection.profileImageUrl =
        userResponse.data.threads_profile_picture_url;
      await connection.save();
    });

    res.json({
      success: true,
      postGroups: postGroups,
    });
  } catch (error) {
    console.error("Get scheduled posts error:", error);
    res.status(500).json({ error: "Failed to get scheduled posts" });
  }
};

exports.getAllScheduledPostsStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all post groups for the user with populated posts
    const postGroups = await ScheduledPostGroup.find({ userId }).populate(
      "posts"
    );

    // Get all posts across all groups
    const allPosts = postGroups.reduce(
      (acc, group) => [...acc, ...group.posts],
      []
    );

    // Count posts by status
    const scheduledPosts = allPosts.filter(
      (post) => post.status === "scheduled"
    ).length;
    const publishedPosts = allPosts.filter(
      (post) => post.status === "published"
    ).length;
    const draftPosts = allPosts.filter(
      (post) => post.status === "draft"
    ).length;
    const failedPosts = allPosts.filter(
      (post) => post.status === "failed"
    ).length;

    res.json({
      totalGroups: postGroups.length,
      totalPosts: allPosts.length,
      scheduledPosts,
      publishedPosts,
      draftPosts,
      failedPosts,
    });
  } catch (error) {
    console.error("Error getting scheduled posts stats:", error);
    res.status(500).json({ error: "Failed to get scheduled posts stats" });
  }
};

async function handleImageUpload(files, userId) {
  const uploadedFiles = [];
  if (!files?.media?.length) return uploadedFiles;

  const mediaFiles = Array.isArray(files.media) ? files.media : [files.media];
  const timestamp = Date.now().toString();

  for (let i = 0; i < mediaFiles.length; i++) {
    const file = mediaFiles[i];
    const s3FileName = `${timestamp}-${i}-${userId}`;

    try {
      const fileUrl = await uploadFileToS3(
        file.buffer,
        s3FileName,
        file.mimetype
      );
      uploadedFiles.push({
        filename: s3FileName,
        url: fileUrl,
        mimetype: file.mimetype,
        type: "image",
        size: file.size,
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      continue;
    }
  }

  return uploadedFiles;
}

async function validateScheduledTime(scheduledTime) {
  const date = new Date(scheduledTime);
  return date <= new Date() ? new Date() : date;
}
