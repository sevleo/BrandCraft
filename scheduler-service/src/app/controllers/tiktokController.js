const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");
const platformConnection = require("../models/platformConnection");

// Internal method for posting videos to TikTok (used by scheduler)
exports.postTikTokVideoInternal = async ({
  content,
  user,
  media = [],
  post,
}) => {
  if (post.status === "scheduled" && (!media || media.length === 0)) {
    throw new Error("TikTok posts require at least one video URL");
  }

  if (media.length > 1) {
    throw new Error("TikTok currently only supports single video upload");
  }

  await post.populate("postGroupId");

  const tiktokSettings = post.postGroupId.platformSettings?.tiktok;

  const connection = await platformConnection.findOne({
    userId: user._id,
    platform: post.platform,
    platformId: post.platformId,
  });

  const accessToken = connection.accessToken;

  let mediaContainerId = post?.publishId;

  if (!mediaContainerId) {
    // Step 1: Create Media Container
    try {
      const initResponse = await axios.post(
        "https://open.tiktokapis.com/v2/post/publish/video/init/",
        {
          post_info: {
            title: content,
            privacy_level: tiktokSettings.viewerSetting,
            disable_duet: tiktokSettings.allowDuet,
            disable_comment: tiktokSettings.allowComments,
            disable_stitch: tiktokSettings.allowStitch,
            video_cover_timestamp_ms: Math.round(
              post.postGroupId.videoTimestamp * 1000
            ),
            brand_content_toggle: tiktokSettings.brandedContent,
            brand_organic_toggle: tiktokSettings.brandOrganic,
            is_aigc: false,
          },
          source_info: {
            source: "PULL_FROM_URL",
            video_url: media[0].url,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json; charset=UTF-8",
          },
        }
      );

      mediaContainerId = initResponse.data.data.publish_id;
      post.publishId = mediaContainerId;
      await post.save();
    } catch (error) {
      console.error(error.response?.data?.error);
      const errorData = error.response?.data?.error;

      // Format error message more nicely
      let errorMessage = "TikTok API error";

      if (typeof errorData === "object") {
        // Check for specific error codes and provide more user-friendly messages
        if (
          errorData.code ===
          "unaudited_client_can_only_post_to_private_accounts"
        ) {
          errorMessage =
            "Your TikTok app is unaudited. Posts can only be made to private accounts.";
        } else {
          // For other error types, include code and message in a readable format
          errorMessage = errorData.code
            ? `${errorData.code}: ${errorData.message || ""}`
            : JSON.stringify(errorData);
        }
      } else {
        errorMessage = errorData || "TikTok API error";
      }

      throw errorMessage;
    }
  }

  await checkMediaStatus(mediaContainerId, accessToken, post);

  return {
    success: false,
    status: "unknown",
    platform: "tiktok",
  };
};

const checkMediaStatus = async (publish_id, accessToken, post) => {
  const statusResponse = await axios.post(
    "https://open.tiktokapis.com/v2/post/publish/status/fetch/",
    {
      publish_id,
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  const status = statusResponse.data.data.status;

  switch (status) {
    case "PUBLISH_COMPLETE":
      post.status = "published";
      await post.save();
      return {
        success: true,
        postId: publish_id,
        platform: "tiktok",
      };

    case "PROCESSING_DOWNLOAD":
      post.status = "processing";
      await post.save();
      throw new Error("MEDIA_PROCESSING");

    case "FAILED":
      const failReason = statusResponse.data.data.fail_reason;

      // Format fail reason more nicely
      let formattedFailReason = failReason;

      switch (failReason) {
        case "frame_rate_check_failed":
          formattedFailReason = "Video has low frame rate. Minimum is 23 FPS.";
          break;
        case "file_format_check_failed":
          formattedFailReason =
            "Video format is not supported. Please upload a video in .mp4 format.";
          break;
        case "duration_check_failed":
          formattedFailReason = "Video duration is too long.";
          break;
        case "video_pull_failed":
        case "photo_pull_failed":
          formattedFailReason =
            "Internal TikTok error: failed to pull video or photo. Retry recommended.";
          break;
        default:
          formattedFailReason = failReason;
          break;
      }

      throw formattedFailReason;

    default:
      throw new Error("Status: " + status);
  }
};
