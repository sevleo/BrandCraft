const axios = require("axios");
require("dotenv").config();
const platformConnection = require("../models/platformConnection");

const GRAPH_API_BASE_URL = "https://graph.facebook.com/v18.0";

exports.postToFacebookInternal = async ({ content, user, media = [], post }) => {
  const connection = await platformConnection.findOne({
    userId: user._id,
    platform: post.platform,
    platformId: post.platformId,
  });

  try {
    let postData = {
      message: content,
    };

    if (media && media.length > 0) {
      if (media.length === 1) {
        const file = media[0];
        if (file.type === "video") {
          // Handle video upload
          const videoResponse = await axios.post(
            `${GRAPH_API_BASE_URL}/${connection.platformId}/videos`,
            {
              file_url: file.url,
              description: content,
              access_token: connection.accessToken,
            }
          );
          return videoResponse.data;
        } else {
          // Handle image upload
          postData.url = file.url;
        }
      } else {
        // Handle multiple images as a carousel
        const mediaIds = await Promise.all(
          media.map(async (file) => {
            const uploadResponse = await axios.post(
              `${GRAPH_API_BASE_URL}/${connection.platformId}/photos`,
              {
                url: file.url,
                published: false,
                access_token: connection.accessToken,
              }
            );
            return uploadResponse.data.id;
          })
        );

        postData.attached_media = mediaIds.map(id => ({ media_fbid: id }));
      }
    }

    const response = await axios.post(
      `${GRAPH_API_BASE_URL}/${connection.platformId}/feed`,
      {
        ...postData,
        access_token: connection.accessToken,
      }
    );

    return response.data;
  } catch (error) {
    console.error("Facebook posting error:", error);
    throw error;
  }
}; 