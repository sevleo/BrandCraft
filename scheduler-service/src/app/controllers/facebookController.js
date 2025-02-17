const axios = require("axios");
const PlatformConnection = require("../models/platformConnection");

exports.postToFacebookInternal = async ({ content, user, media = [], post }) => {
  const connection = await PlatformConnection.findOne({
    userId: user._id,
    platform: post.platform,
    platformId: post.platformId,
  });

  if (!connection) {
    throw new Error("Facebook connection not found");
  }

  try {
    let postData = {
      message: content,
    };

    if (media && media.length > 0) {
      if (media[0].type === "video") {
        // Handle video upload
        const videoResponse = await axios.post(
          `https://graph.facebook.com/v18.0/${connection.platformId}/videos`,
          {
            description: content,
            file_url: media[0].url,
            access_token: connection.accessToken,
          }
        );
        return videoResponse.data;
      } else {
        // Handle photo upload(s)
        if (media.length === 1) {
          postData.url = media[0].url;
        } else {
          // Multiple photos
          postData.attached_media = media.map((m, index) => ({
            media_fbid: m.url,
          }));
        }
      }
    }

    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${connection.platformId}/feed`,
      {
        ...postData,
        access_token: connection.accessToken,
      }
    );

    return response.data;
  } catch (error) {
    console.error('Facebook post error:', error.response?.data || error);
    throw new Error(error.response?.data?.message || 'Failed to post to Facebook');
  }
}; 