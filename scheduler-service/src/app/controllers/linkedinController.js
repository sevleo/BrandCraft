const axios = require("axios");
require("dotenv").config();
const platformConnection = require("../models/platformConnection");

const API_BASE_URL = "https://api.linkedin.com/v2";

exports.postToLinkedinInternal = async ({ content, user, media = [], post }) => {
  const connection = await platformConnection.findOne({
    userId: user._id,
    platform: post.platform,
    platformId: post.platformId,
  });

  try {
    let shareRequest = {
      author: `urn:li:person:${connection.platformId}`,
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: {
            text: content
          },
          shareMediaCategory: "NONE"
        }
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
      }
    };

    if (media && media.length > 0) {
      // Handle media upload
      const mediaAssets = await Promise.all(
        media.map(async (file) => {
          const registerUpload = await axios.post(
            `${API_BASE_URL}/assets?action=registerUpload`,
            {
              registerUploadRequest: {
                recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
                owner: `urn:li:person:${connection.platformId}`,
                serviceRelationships: [
                  {
                    relationshipType: "OWNER",
                    identifier: "urn:li:userGeneratedContent"
                  }
                ]
              }
            },
            {
              headers: {
                Authorization: `Bearer ${connection.accessToken}`
              }
            }
          );

          // Upload the media file
          await axios.put(
            registerUpload.data.value.uploadMechanism["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"].uploadUrl,
            file.buffer,
            {
              headers: {
                Authorization: `Bearer ${connection.accessToken}`
              }
            }
          );

          return registerUpload.data.value.asset;
        })
      );

      // Add media to share request
      shareRequest.specificContent["com.linkedin.ugc.ShareContent"].shareMediaCategory = "IMAGE";
      shareRequest.specificContent["com.linkedin.ugc.ShareContent"].media = mediaAssets.map(asset => ({
        status: "READY",
        media: asset,
      }));
    }

    const response = await axios.post(
      `${API_BASE_URL}/ugcPosts`,
      shareRequest,
      {
        headers: {
          Authorization: `Bearer ${connection.accessToken}`,
          "X-Restli-Protocol-Version": "2.0.0",
          "Content-Type": "application/json"
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error("LinkedIn posting error:", error);
    throw error;
  }
}; 