const { TwitterApi } = require("twitter-api-v2");
const fs = require("fs");
const sharp = require("sharp");
const platformConnection = require("../models/platformConnection");

// Helper function to upload image
async function uploadImage(userClient, file) {
  const fileBuffer = fs.readFileSync(file.path);
  const mediaBuffer = await sharp(fileBuffer)
    .resize({ width: 1000, withoutEnlargement: true })
    .png()
    .toBuffer();

  return userClient.v1.uploadMedia(mediaBuffer, {
    mimeType: "image/png",
  });
}

// Helper function to upload video
async function uploadVideo(userClient, file) {
  console.log(file);
  const mediaData = fs.readFileSync(file.path);
  return userClient.v1.uploadMedia(mediaData, {
    mimeType: file.mimetype || "video/mp4", // Ensure the MIME type is set
  });
}

// Internal method for posting tweets (used by scheduler)
exports.postTweetInternal = async ({ content, user, media = [], post }) => {
  try {
    const connection = await platformConnection.findOne({
      userId: user._id,
      platform: post.platform,
      platformId: post.platformId,
    });

    // Extract accessToken and accessSecret for OAuth1.0a
    const [accessTokenSplit, accessSecretSplit] =
      connection.accessTokenSplit.split(":");

    const userClient = new TwitterApi({
      appKey: process.env.X_API_KEY,
      appSecret: process.env.X_API_SECRET,
      accessToken: accessTokenSplit,
      accessSecret: accessSecretSplit,
    });

    // Handle multiple media files
    const mediaIds = [];

    if (media && media.length > 0) {
      for (const file of media) {
        try {
          const mediaId =
            file.type === "video"
              ? await uploadVideo(userClient, file)
              : await uploadImage(userClient, file);

          mediaIds.push(mediaId);
        } catch (err) {
          console.error(`Error processing ${file.type}:`, file.filename, err);
          throw err; // Re-throw to handle in the outer catch
        }
      }
    }

    // Post tweet with media using v2
    const tweetOptions = {
      text: content,
    };

    if (mediaIds.length > 0) {
      tweetOptions.media = { media_ids: mediaIds };
    }

    const tweet = await userClient.v2.tweet(tweetOptions);
    return tweet;
  } catch (error) {
    console.error("Error posting to Twitter");
    console.log(error);
    throw error.data?.detail || error;
  }
};
