const axios = require("axios");
require("dotenv").config();
const platformConnection = require("../models/platformConnection");

const GRAPH_API_BASE_URL = "https://graph.instagram.com";

exports.postToInstagramInternal = async ({
  content,
  user,
  media = [],
  post,
}) => {
  const trimmedContent = content ? content.trim() : "";

  if (post.status === "scheduled" && (!media || media.length === 0)) {
    throw new Error("Instagram posts require at least one media item");
  }

  const connection = await platformConnection.findOne({
    userId: user._id,
    platform: post.platform,
    platformId: post.platformId,
  });

  if (media.length > 1) {
    // Handle carousel post
    const mediaContainerIds = [];

    for (const file of media) {
      const mediaType = file.type === "video" ? "video_url" : "image_url";
      const encodedUrl = encodeURI(file.url);

      // Step 1: Create Media Container
      const mediaContainer = await axios.post(
        `${GRAPH_API_BASE_URL}/v21.0/${connection.platformId}/media`,
        {
          [mediaType]: encodedUrl, // Dynamically set image_url or video_url
          media_type: mediaType === "video_url" ? "VIDEO" : "",
          is_carousel_item: true,
          access_token: connection.accessToken,
        }
      );

      mediaContainerIds.push(mediaContainer.data.id);
    }

    // Step 2: Create Carousel Container
    const carouselContainer = await axios.post(
      `${GRAPH_API_BASE_URL}/${connection.platformId}/media`,
      {
        media_type: "CAROUSEL",
        children: mediaContainerIds.join(","),
        caption: trimmedContent,
        access_token: connection.accessToken,
      }
    );

    const carouselContainerId = carouselContainer.data.id;

    try {
      // Step 3: Publish Carousel Container
      const publishResponse = await axios.post(
        `${GRAPH_API_BASE_URL}/${connection.platformId}/media_publish`,
        {
          creation_id: carouselContainerId,
          access_token: connection.accessToken,
        }
      );

      return publishResponse.data;
    } catch (err) {
      console.log("err", err.response.data);
      return;
    }
  }

  if (media.length === 1 || post.status === "processing") {
    let mediaType;
    let mediaContainerId = post?.mediaContainerId;

    if (!mediaContainerId) {
      const file = media[0];
      mediaType = file.type === "video" ? "video_url" : "image_url";

      const encodedUrl = encodeURI(file.url);

      const mediaContainerUrl = `${GRAPH_API_BASE_URL}/v21.0/${connection.platformId}/media`;

      // Step 1: Create Media Container
      const mediaContainer = await axios.post(
        mediaContainerUrl, // Constructed URL
        {
          [mediaType]: encodedUrl, // Dynamically set image_url or video_url
          caption: trimmedContent, // Optional caption
          media_type:
            mediaType === "video_url"
              ? post.platformSettings?.instagram?.videoType || "REELS"
              : "",
          access_token: connection.accessToken,
          thumb_offset: Math.round(post.postGroupId.videoTimestamp * 1000),
        }
      );

      mediaContainerId = mediaContainer.data.id;
      post.mediaContainerId = mediaContainerId;
      await post.save();
    }

    await checkMediaStatus(mediaContainerId, user, post, connection);
    // if (mediaType === "video_url" || post.status === "processing") {
    // }

    // Step 2: Publish the Media Container

    const publishResponse = await axios.post(
      `${GRAPH_API_BASE_URL}/${connection.platformId}/media_publish`,
      {
        creation_id: mediaContainerId,
        access_token: connection.accessToken,
      }
    );

    return publishResponse.data;
  }
};

const checkMediaStatus = async (containerId, user, post, connection) => {
  const response = await axios.get(
    `${GRAPH_API_BASE_URL}/${containerId}` +
      `?access_token=${encodeURIComponent(connection.accessToken)}`
  );

  const status = response.data.status;

  switch (status) {
    case "FINISHED":
      console.log("finished");
      return true;

    case "IN_PROGRESS":
      post.status = "processing";
      await post.save();
      throw new Error("MEDIA_PROCESSING");

    case "ERROR":
      throw new Error(
        response.data.error?.error_user_msg ||
          response.data.error?.message ||
          "Unknown Instagram API error"
      );

    default:
      throw new Error("Status: " + status);
  }
};
