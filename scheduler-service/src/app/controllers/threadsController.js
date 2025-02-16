const axios = require("axios");
require("dotenv").config();
const platformConnection = require("../models/platformConnection");

const GRAPH_API_BASE_URL = "https://graph.threads.net/";

// Internal method for posting to Threads (used by scheduler)
exports.postToThreadsInternal = async ({ content, user, media = [], post }) => {
  const trimmedContent = content ? content.trim() : "";

  const connection = await platformConnection.findOne({
    userId: user._id,
    platform: post.platform,
    platformId: post.platformId,
  });

  if (media.length > 1) {
    // Handle carousel post
    const mediaContainerIds = [];

    // Step 1: Create Media Containers for each media file
    for (const file of media) {
      const mediaContainerUrl =
        `${GRAPH_API_BASE_URL}me/threads` +
        `?media_type=IMAGE` +
        `&image_url=${encodeURIComponent(file.url)}` +
        `&is_carousel_item=true` +
        `&access_token=${encodeURIComponent(connection.accessToken)}`;

      const mediaContainer = await axios.post(mediaContainerUrl);
      mediaContainerIds.push(mediaContainer.data.id);
    }

    // Step 2: Create a Carousel Container
    const carouselContainerUrl =
      `${GRAPH_API_BASE_URL}me/threads` +
      `?media_type=CAROUSEL` +
      `&children=${mediaContainerIds.join(",")}` +
      `&text=${encodeURIComponent(trimmedContent)}` +
      `&access_token=${encodeURIComponent(connection.accessToken)}`;

    const carouselContainer = await axios.post(carouselContainerUrl);
    const carouselContainerId = carouselContainer.data.id;

    // Step 3: Publish the Carousel Container
    const publishThreadsUrl =
      `${GRAPH_API_BASE_URL}me/threads_publish` +
      `?creation_id=${carouselContainerId}` +
      `&access_token=${encodeURIComponent(connection.accessToken)}`;

    const publishResponse = await axios.post(publishThreadsUrl);

    return publishResponse.data;
  }

  if (media.length === 1 || post.status === "processing") {
    let mediaType;
    let mediaContainerId = post?.mediaContainerId;

    if (!mediaContainerId) {
      const file = media[0];
      mediaType = file.type === "video" ? "VIDEO" : "IMAGE";

      const encodedUrl = encodeURI(file.url);

      const mediaContainerUrl =
        `${GRAPH_API_BASE_URL}me/threads` +
        `?media_type=${mediaType}` +
        `&${mediaType.toLowerCase()}_url=${encodedUrl}` +
        `&access_token=${encodeURIComponent(connection.accessToken)}`;

      // Step 1: Create Media Container
      const mediaContainer = await axios.post(mediaContainerUrl, {
        text: trimmedContent,
      });

      mediaContainerId = mediaContainer.data.id;
      post.mediaContainerId = mediaContainerId;
      await post.save();
    }

    await checkMediaStatus(mediaContainerId, user, post, connection);

    // Step 2: Publish the Media Container
    try {
      const publishResponse = await axios.post(
        `${GRAPH_API_BASE_URL}me/threads_publish`,
        {
          creation_id: mediaContainerId,
          access_token: connection.accessToken,
        }
      );

      return publishResponse.data;
    } catch (error) {
      console.log("error while publishing, but may still be okay");
      console.log(error.response.data.error);
    }
  } else {
    // Handle text-only post
    const createTextContainerUrl =
      `${GRAPH_API_BASE_URL}me/threads` +
      `?media_type=TEXT` +
      `&access_token=${encodeURIComponent(connection.accessToken)}`;

    const textContainerResponse = await axios.post(createTextContainerUrl, {
      text: trimmedContent,
    });

    const publishThreadsUrl =
      `${GRAPH_API_BASE_URL}me/threads_publish` +
      `?creation_id=${textContainerResponse.data.id}` +
      `&access_token=${encodeURIComponent(connection.accessToken)}`;

    const publishResponse = await axios.post(publishThreadsUrl);

    return publishResponse.data;
  }
};

const checkMediaStatus = async (containerId, user, post, connection) => {
  const response = await axios.get(
    `${GRAPH_API_BASE_URL}${containerId}` +
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
