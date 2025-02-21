const ScheduledPost = require("../models/scheduledPost");
const ScheduledPostGroup = require("../models/scheduledPostGroup");
const { uploadFileToS3, deleteFileFromS3 } = require("../services/s3Service");
const MediaFile = require("../models/mediaFile");
const platformConnection = require("../models/platformConnection");
const axios = require("axios");

exports.createScheduledPost = async (req, res) => {
  try {
    const {
      content,
      scheduledTime,
      platforms,
      sameContent,
      status,
      videoS3Key,
      tiktokSettings,
      instagramSettings,
      youtubeSettings,
      videoTimestamp,
    } = req.body;
    const userId = req.user._id;

    // Parse platforms if it's a string
    const parsedPlatforms =
      typeof platforms === "string" ? JSON.parse(platforms) : platforms;

    // Validate scheduled time
    const scheduledDate = await validateScheduledTime(scheduledTime);

    // Create the bundle
    const postGroup = new ScheduledPostGroup({
      userId: userId,
      scheduledTime: scheduledDate,
      platforms: parsedPlatforms,
      sameContent: sameContent,
      content: content,
      status: "pending",
      videoTimestamp: videoTimestamp ? parseFloat(videoTimestamp) : 0,
    });

    await postGroup.save();

    let newMediaFiles = [];

    if (videoS3Key) {
      const existingVideo = await MediaFile.findOne({
        userId: userId,
        fileName: videoS3Key,
      });

      if (existingVideo) {
        existingVideo.postGroupId = postGroup._id;
        await existingVideo.save();

        await postGroup.updateOne({
          $addToSet: { mediaFiles: { $each: [existingVideo._id] } },
        });
      }
    }

    // Handle image uploads
    if (!videoS3Key) {
      const uploadedFiles = [];
      const imageFiles = await handleImageUpload(req.files, userId);
      uploadedFiles.push(...imageFiles);

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

    // Ensure platformSettings is initialized
    postGroup.platformSettings = postGroup.platformSettings || {};

    // Add platform-specific settings
    if (platformName === "tiktok" && tiktokSettings) {
      const parsedTiktokSettings = JSON.parse(tiktokSettings);

      // Merge TikTok settings without overwriting others
      postGroup.platformSettings = {
        ...postGroup.platformSettings,
        tiktok: {
          viewerSetting: parsedTiktokSettings.viewerSetting,
          allowComments: parsedTiktokSettings.allowComments,
          allowDuet: parsedTiktokSettings.allowDuet,
          allowStitch: parsedTiktokSettings.allowStitch,
          commercialContent: parsedTiktokSettings.commercialContent,
          brandOrganic: parsedTiktokSettings.brandOrganic,
          brandedContent: parsedTiktokSettings.brandedContent,
        },
      };
    }

    if (platformName === "instagram" && instagramSettings) {
      const parsedInstagramSettings = JSON.parse(instagramSettings);

      // Merge Instagram settings without overwriting others
      postGroup.platformSettings = {
        ...postGroup.platformSettings,
        instagram: {
          videoType: parsedInstagramSettings.videoType,
        },
      };
    }

    if (platformName === "youtube" && youtubeSettings) {
      const parsedYoutubeSettings = JSON.parse(youtubeSettings);

      // Merge YouTube settings without overwriting others
      postGroup.platformSettings = {
        ...postGroup.platformSettings,
        youtube: {
          privacy: parsedYoutubeSettings.privacy,
          title: parsedYoutubeSettings.title,
        },
      };
    }

    await postGroup.updateOne({
      $addToSet: { mediaFiles: { $each: newMediaFiles } },
    });

    // Create individual posts for each platform
    const posts = await Promise.all(
      parsedPlatforms.map(async (platform) => {
        const platformName = platform.split("-")[0];
        const platformId = platform.split("-").slice(1).join("-");

        const post = {
          postGroupId: postGroup._id,
          userId: userId,
          content: content,
          platform: platformName,
          platformId: platformId,
          status: status,
          videoTimestamp: videoTimestamp ? parseFloat(videoTimestamp) : 0,
        };

        const newPost = new ScheduledPost(post);
        await newPost.save();
        return newPost;
      })
    );

    // Add posts to bundle & update status
    postGroup.posts = posts.map((post) => post._id);
    postGroup.status = status;

    await postGroup.save();

    res.status(201).json({
      success: true,
      postGroup,
    });
  } catch (error) {
    console.error("Create scheduled post error:", error);
    res.status(500).json({ error: "Failed to create scheduled post" });
  }
};

exports.updateScheduledPost = async (req, res) => {
  try {
    const {
      content,
      scheduledTime,
      platforms,
      sameContent,
      status,
      keptMediaUrls,
      videoS3Key,
      tiktokSettings,
      instagramSettings,
      youtubeSettings,
      videoTimestamp,
    } = req.body;
    const userId = req.user._id;
    const { id } = req.params;

    // Find bundle and verify ownership
    const postGroup = await ScheduledPostGroup.findOneAndUpdate(
      {
        _id: id,
        userId,
      },
      {
        status: "pending",
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

    if (videoS3Key) {
      const existingVideo = await MediaFile.findOne({
        userId: userId,
        fileName: videoS3Key,
      });

      if (existingVideo) {
        existingVideo.postGroupId = postGroup._id;
        await existingVideo.save();
        newMediaFiles.push(existingVideo._id);
      }
    }

    // Handle image uploads
    if (!videoS3Key && req.files?.media?.length > 0) {
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

        // Prepare platform-specific settings
        const platformSettings = {};
        if (platformName === "tiktok" && tiktokSettings) {
          const parsedTiktokSettings = JSON.parse(tiktokSettings);
          post.platformSettings = {
            tiktok: {
              viewerSetting: parsedTiktokSettings.viewerSetting,
              allowComments: parsedTiktokSettings.allowComments,
              allowDuet: parsedTiktokSettings.allowDuet,
              allowStitch: parsedTiktokSettings.allowStitch,
              commercialContent: parsedTiktokSettings.commercialContent,
              brandOrganic: parsedTiktokSettings.brandOrganic,
              brandedContent: parsedTiktokSettings.brandedContent,
            },
          };
        }

        if (platformName === "instagram" && instagramSettings) {
          const parsedInstagramSettings = JSON.parse(instagramSettings);
          post.platformSettings = {
            instagram: {
              videoType: parsedInstagramSettings.videoType,
            },
          };
        }

        if (platformName === "youtube" && youtubeSettings) {
          const parsedYoutubeSettings = JSON.parse(youtubeSettings);
          post.platformSettings = {
            youtube: {
              privacy: parsedYoutubeSettings.privacy,
              title: parsedYoutubeSettings.title,
            },
          };
        }

        if (post) {
          // Update existing post
          post.content = content;
          if (status) {
            post.status = status;
          }
          post.videoTimestamp = videoTimestamp ? parseFloat(videoTimestamp) : 0;

          post.platform = platformName;
          post.platformId = platformId;

          await post.save();
          return post;
        } else {
          // Create new post for new platform
          post = new ScheduledPost({
            postGroupId: postGroup._id,
            userId,
            content,
            platform: platformName,
            platformId: platformId,
            status: status,
            platformSettings,
            videoTimestamp: videoTimestamp ? parseFloat(videoTimestamp) : 0,
          });
          await post.save();
          return post;
        }
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

    // Final Optimized Update (Step 5 merged into Step 9)
    await postGroup.updateOne({
      content: content,
      scheduledTime: await validateScheduledTime(scheduledTime),
      platforms: parsedPlatforms,
      sameContent: sameContent === "true",
      videoTimestamp: videoTimestamp ? parseFloat(videoTimestamp) : 0,
      status: status || postGroup.status,
      mediaFiles: [...keptMedia.map((m) => m._id), ...newMediaFiles], // Update mediaFiles array
      posts: updatedPosts.map((post) => post._id), // Add updated posts
    });

    res.json({ success: true, postGroup });
  } catch (error) {
    console.error("Update scheduled post error:", error);
    res.status(500).json({ error: "Failed to update scheduled post" });
  }
};

exports.createPostGroup = async (req, res) => {
  try {
    const {
      content,
      scheduledTime,
      platforms,
      sameContent,
      status,
      videoS3Key,
      tiktokSettings,
      instagramSettings,
      youtubeSettings,
      videoTimestamp,
    } = req.body;

    console.log("test");

    const userId = req.user._id;

    // Parse platforms if it's a string
    const parsedPlatforms =
      typeof platforms === "string" ? JSON.parse(platforms) : platforms;

    // Validate scheduled time
    const scheduledDate =
      scheduledTime && (await validateScheduledTime(scheduledTime));

    // Create the bundle
    const postGroup = new ScheduledPostGroup({
      userId: userId,
      scheduledTime: scheduledDate,
      platforms: parsedPlatforms,
      sameContent: sameContent,
      content: content,
      status: "pending",
      videoTimestamp: videoTimestamp ? parseFloat(videoTimestamp) : 0,
    });

    await postGroup.save();

    let newMediaFiles = [];

    if (videoS3Key) {
      const existingVideo = await MediaFile.findOne({
        userId: userId,
        fileName: videoS3Key,
      });

      if (existingVideo) {
        existingVideo.postGroupId = postGroup._id;
        await existingVideo.save();

        await postGroup.updateOne({
          $addToSet: { mediaFiles: { $each: [existingVideo._id] } },
        });
      }
    }

    // Handle image uploads
    if (!videoS3Key) {
      const uploadedFiles = [];
      const imageFiles = await handleImageUpload(req.files, userId);
      uploadedFiles.push(...imageFiles);

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

    await postGroup.updateOne({
      $addToSet: { mediaFiles: { $each: newMediaFiles } },
    });

    // Create individual posts for each platform
    const posts =
      parsedPlatforms &&
      (await Promise.all(
        parsedPlatforms.map(async (platform) => {
          const platformName = platform.split("-")[0];
          const platformId = platform.split("-").slice(1).join("-");

          const post = {
            postGroupId: postGroup._id,
            userId: userId,
            content: content,
            platform: platformName,
            platformId: platformId,
            status: status,
            videoTimestamp: videoTimestamp ? parseFloat(videoTimestamp) : 0,
          };

          // Add platform-specific settings
          if (platformName === "tiktok" && tiktokSettings) {
            const parsedTiktokSettings = JSON.parse(tiktokSettings);
            post.platformSettings = {
              tiktok: {
                viewerSetting: parsedTiktokSettings.viewerSetting,
                allowComments: parsedTiktokSettings.allowComments,
                allowDuet: parsedTiktokSettings.allowDuet,
                allowStitch: parsedTiktokSettings.allowStitch,
                commercialContent: parsedTiktokSettings.commercialContent,
                brandOrganic: parsedTiktokSettings.brandOrganic,
                brandedContent: parsedTiktokSettings.brandedContent,
              },
            };
          }

          if (platformName === "instagram" && instagramSettings) {
            const parsedInstagramSettings = JSON.parse(instagramSettings);
            post.platformSettings = {
              instagram: {
                videoType: parsedInstagramSettings.videoType,
              },
            };
          }

          if (platformName === "youtube" && youtubeSettings) {
            const parsedYoutubeSettings = JSON.parse(youtubeSettings);
            post.platformSettings = {
              youtube: {
                privacy: parsedYoutubeSettings.privacy,
                title: parsedYoutubeSettings.title,
              },
            };
          }

          const newPost = new ScheduledPost(post);
          await newPost.save();
          return newPost;
        })
      ));

    // Add posts to bundle & update status
    postGroup.posts = posts && posts.map((post) => post._id);
    postGroup.status = status;

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
      videoS3Key,
      tiktokSettings,
      instagramSettings,
      youtubeSettings,
      videoTimestamp,
    } = req.body;
    const userId = req.user._id;
    const { id } = req.params;

    // Find bundle and verify ownership
    const postGroup = await ScheduledPostGroup.findOneAndUpdate(
      {
        _id: id,
        userId,
      },
      {
        status: "pending",
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
      !videoS3Key &&
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

    if (videoS3Key) {
      const existingVideo = await MediaFile.findOne({
        userId: userId,
        fileName: videoS3Key,
      });

      if (existingVideo) {
        existingVideo.postGroupId = postGroup._id;
        await existingVideo.save();
        newMediaFiles.push(existingVideo._id);
      }
    }

    // Handle image uploads
    if (!videoS3Key && req.files?.media?.length > 0) {
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

        // Prepare platform-specific settings
        if (platformName === "tiktok" && tiktokSettings) {
          const parsedTiktokSettings = JSON.parse(tiktokSettings);

          post.platformSettings = {
            tiktok: {
              viewerSetting: parsedTiktokSettings.viewerSetting,
              allowComments: parsedTiktokSettings.allowComments,
              allowDuet: parsedTiktokSettings.allowDuet,
              allowStitch: parsedTiktokSettings.allowStitch,
              commercialContent: parsedTiktokSettings.commercialContent,
              brandOrganic: parsedTiktokSettings.brandOrganic,
              brandedContent: parsedTiktokSettings.brandedContent,
            },
          };
        }

        if (platformName === "instagram" && instagramSettings) {
          const parsedInstagramSettings = JSON.parse(instagramSettings);
          post.platformSettings = {
            instagram: {
              videoType: parsedInstagramSettings.videoType,
            },
          };
        }

        if (platformName === "youtube" && youtubeSettings) {
          const parsedYoutubeSettings = JSON.parse(youtubeSettings);
          post.platformSettings = {
            youtube: {
              privacy: parsedYoutubeSettings.privacy,
              title: parsedYoutubeSettings.title,
            },
          };
        }

        await post.save();
        return post;
      })
    );

    console.log("updated posts");
    console.log(updatedPosts);

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
    if (scheduledTime !== undefined) {
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
        select:
          "content platform platformId status errorMessage platformSettings",
      })
      .populate({
        path: "mediaFiles",
        select: "url key fileName mimeType size type",
      })
      .select(
        "scheduledTime platforms mediaFiles status content sameContent videoTimestamp updatedAt"
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

// Helper functions
async function handleVideoUpload(videoS3Key) {
  if (!videoS3Key) return null;
  return {
    // url: `https://brandcraft-media.s3.amazonaws.com/${videoS3Key}`,
    url: `https://media.brandcraft.art/${videoS3Key}`,
    filename: videoS3Key,
    mimetype: "video/mp4",
    type: "video",
    size: 0,
  };
}

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
