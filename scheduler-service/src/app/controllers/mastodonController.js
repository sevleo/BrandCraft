const axios = require("axios");
const FormData = require("form-data");
require("dotenv").config();
const platformConnection = require("../models/platformConnection");

const MASTODON_INSTANCE = "https://mastodon.social";

// Internal method for posting to Mastodon (used by scheduler)
exports.postToMastodonInternal = async ({
  content,
  user,
  media = [],
  post,
}) => {
  const trimmedContent = content ? content.trim() : "";

  // Validate: require either content or media
  if (post.status === "scheduled" && !trimmedContent && media.length === 0) {
    throw new Error("Post must contain either text or media");
  }

  const connection = await platformConnection.findOne({
    userId: user._id,
    platform: post.platform,
    platformId: post.platformId,
  });

  const mediaIds = [];

  // Check or upload media
  if (media.length === 1 || post.status === "processing") {
    let mediaType;
    let mediaId = post?.mediaId;

    if (!mediaId) {
      const file = media[0];
      mediaType = file.type === "video" ? "VIDEO" : "IMAGE";

      // Step 1: get the media
      const mediaResponse = await axios.get(file.url, {
        responseType: "arraybuffer",
      });

      const form = new FormData();
      form.append("file", Buffer.from(mediaResponse.data), {
        filename: file.url.split("/").pop(),
        contentType: file.type.includes("video") ? "video/mp4" : "image/jpeg",
      });

      if (file.description) {
        form.append("description", file.description);
      }

      // Step 2: upload the media to Mastodon
      const uploadResponse = await axios.post(
        `${MASTODON_INSTANCE}/api/v2/media`,
        form,
        {
          headers: {
            Authorization: `Bearer ${connection.accessToken}`,
            ...form.getHeaders(),
          },
        }
      );

      mediaId = uploadResponse.data.id;
      post.mediaId = mediaId;
      await post.save();
    }

    // Wait for media processing if it's a video
    // if (mediaType === "VIDEO") {
    await checkMediaStatus(mediaId, connection.accessToken, post);
    // }

    mediaIds.push(mediaId);

    try {
      // Step 3: Publish the Status (Post)
      const response = await axios.post(
        `${MASTODON_INSTANCE}/api/v1/statuses`,
        {
          status: trimmedContent,
          media_ids: mediaIds,
          visibility: "public",
        },
        {
          headers: {
            Authorization: `Bearer ${connection.accessToken}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.log("mastodon publish error");
      console.log(error.response.data);
    }
  } else if (media.length > 1) {
    for (const file of media) {
      // Get the file from the URL
      const mediaResponse = await axios.get(file.url, {
        responseType: "arraybuffer",
      });

      // Create form data
      const form = new FormData();

      // Append the file buffer to form data
      form.append("file", Buffer.from(mediaResponse.data), {
        filename: file.url.split("/").pop(),
        contentType: file.type.includes("video") ? "video/mp4" : "image/jpeg",
      });

      // Add description if available
      if (file.description) {
        form.append("description", file.description);
      }

      // Upload to Mastodon using v2 endpoint
      const uploadResponse = await axios.post(
        `${MASTODON_INSTANCE}/api/v2/media`,
        form,
        {
          headers: {
            Authorization: `Bearer ${connection.accessToken}`,
            ...form.getHeaders(),
          },
        }
      );

      // Add media ID to array
      mediaIds.push(uploadResponse.data.id);
    }
  }

  // Create the status
  const response = await axios.post(
    `${MASTODON_INSTANCE}/api/v1/statuses`,
    {
      status: trimmedContent,
      media_ids: mediaIds,
      visibility: "public",
    },
    {
      headers: {
        Authorization: `Bearer ${connection.accessToken}`,
      },
    }
  );

  return response.data;
};

const checkMediaStatus = async (mediaId, accessToken, post) => {
  console.log("checking media status");

  const response = await axios.get(
    `${MASTODON_INSTANCE}/api/v1/media/${mediaId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  await post.populate("postGroupId");

  const currentTime = new Date();
  const scheduledTime = new Date(post.postGroupId.scheduledTime);

  // Check if more than 5 minutes (300,000 ms) have passed
  if (currentTime - scheduledTime > 300000) {
    console.log("Media processing took too long. Marking as failed.");

    post.status = "failed";
    post.errorMessage = "Could not finish uploading video";
    await post.save();

    throw "Media processing took too long, marking as failed.";
  }

  if (response.data.url) {
    console.log("finished");
    return true;
  } else {
    post.status = "processing";
    await post.save();
    throw new Error("MEDIA_PROCESSING");
  }
};
