const axios = require("axios");
const PlatformConnection = require("../models/platformConnection");

exports.postToLinkedinInternal = async ({ content, user, media = [], post }) => {
  const connection = await PlatformConnection.findOne({
    userId: user._id,
    platform: post.platform,
    platformId: post.platformId,
  });

  if (!connection) {
    throw new Error("LinkedIn connection not found");
  }

  try {
    let shareContent = {
      author: `urn:li:person:${connection.platformId}`,
      lifecycleState: "PUBLISHED",
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
      // Handle media upload and attachment
      const mediaAssets = await Promise.all(
        media.map(file => uploadMediaToLinkedin(file, connection.accessToken))
      );

      shareContent.specificContent["com.linkedin.ugc.ShareContent"].shareMediaCategory = 
        media[0].type === "video" ? "VIDEO" : "IMAGE";
      shareContent.specificContent["com.linkedin.ugc.ShareContent"].media = mediaAssets;
    }

    const response = await axios.post(
      'https://api.linkedin.com/v2/ugcPosts',
      shareContent,
      {
        headers: {
          'Authorization': `Bearer ${connection.accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('LinkedIn post error:', error.response?.data || error);
    throw new Error(error.response?.data?.message || 'Failed to post to LinkedIn');
  }
};

async function uploadMediaToLinkedin(file, accessToken) {
  // Implementation for media upload to LinkedIn
  // This would handle both images and videos according to LinkedIn's API
  // Return the media asset URN
} 