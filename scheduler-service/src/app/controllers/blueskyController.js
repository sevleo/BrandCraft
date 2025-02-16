const { AtpAgent } = require("@atproto/api");
const sharp = require("sharp");
require("dotenv").config();
const fs = require("fs/promises");
const platformConnection = require("../models/platformConnection");

// Internal method for posting to Bluesky
async function postToBlueskyInternal({ content, user, media = [], post }) {
  const agent = new AtpAgent({ service: "https://bsky.social" });

  const connection = await platformConnection.findOne({
    userId: user._id,
    platform: post.platform,
    platformId: post.platformId,
  });

  await agent.login({
    identifier: connection.username,
    password: connection.password,
  });

  try {
    let embed;

    // Process and upload media
    if (media && media.length > 0) {
      const firstMedia = media[0];

      if (firstMedia.type === "video") {
        // For videos, first read the file and upload it as a blob
        const videoBuffer = await fs.readFile(firstMedia.path);
        const uploadResponse = await agent.uploadBlob(videoBuffer, {
          encoding: firstMedia.mimetype,
        });

        // Then use the blob reference in the video embed
        embed = {
          $type: "app.bsky.embed.video",
          video: uploadResponse.data.blob, // Just use the blob reference directly
        };
      } else {
        // For images, use the existing image embed
        const preparedMedia = await prepareMedia(media);
        const images = [];

        for (const mediaItem of preparedMedia) {
          const response = await agent.uploadBlob(mediaItem.buffer, {
            encoding: "image/jpeg",
          });

          images.push({
            alt: mediaItem.alt,
            image: response.data.blob,
            aspectRatio: {
              width: 1000,
              height: 500,
            },
          });
        }

        if (images.length > 0) {
          embed = {
            $type: "app.bsky.embed.images",
            images,
          };
        }
      }
    }

    const hashtagRegex = /#(\w+)/g;
    const hashtags = [...content.matchAll(hashtagRegex)].map(
      (match) => match[1]
    );

    // Generate facets for hashtags
    const facets = hashtags.map((tag) => ({
      index: {
        byteStart: content.indexOf(`#${tag}`),
        byteEnd: content.indexOf(`#${tag}`) + tag.length + 1,
      },
      features: [{ $type: "app.bsky.richtext.facet#tag", tag }],
    }));

    // Create the post
    const postResponse = await agent.post({
      text: content,
      facets, // Add the clickable hashtags
      embed: embed,
    });

    return { success: true, postId: postResponse.uri };
  } catch (error) {
    console.error("Error posting to Bluesky:", error);
    throw error;
  }
}

module.exports = {
  postToBlueskyInternal,
};

// Internal method for preparing media files
async function prepareMedia(media) {
  const processedMedia = [];

  for (const mediaItem of media) {
    // Skip video files
    if (mediaItem.type === "video") continue;

    let imageBuffer;

    // Load the image buffer based on the input type
    if (mediaItem.buffer) {
      // If already a buffer (e.g., uploaded directly from the browser)
      imageBuffer = mediaItem.buffer;
    } else if (mediaItem.path) {
      // If a file path, read the file into a buffer
      imageBuffer = await fs.readFile(mediaItem.path);
    } else {
      throw new Error("Invalid media format: must provide a buffer or path.");
    }

    // Process the image
    const strippedImageBuffer = await sharp(imageBuffer)
      .toFormat("jpeg") // Convert to JPEG for uniformity
      .jpeg({ quality: 90 }) // Adjust quality as needed
      .toBuffer();

    processedMedia.push({
      buffer: strippedImageBuffer,
      alt: mediaItem.alt || "",
    });
  }

  return processedMedia;
}
