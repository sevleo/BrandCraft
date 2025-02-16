const { google } = require("googleapis");
const axios = require("axios");
const fs = require("fs");
const User = require("../models/user");
const platformConnection = require("../models/platformConnection");
const youtube = google.youtube("v3");

exports.postToYoutubeInternal = async ({ content, user, media = [], post }) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET
  );

  if (post.status === "scheduled" && (!media || media.length === 0)) {
    throw new Error("YouTube posts require at least one video");
  }

  if (media.length > 1) {
    throw new Error("YouTube currently only supports single video upload");
  }

  if (post.status === "scheduled" && media[0]?.type !== "video") {
    throw new Error("YouTube only supports video uploads");
  }

  const connection = await platformConnection.findOne({
    userId: user._id,
    platform: post.platform,
    platformId: post.platformId,
  });

  let uploadId = post?.uploadId;

  console.log("Checking access token validity...");
  // Ensure we have a fresh access token
  const accessToken = await ensureValidAccessToken(connection, oauth2Client);

  console.log("Setting up OAuth2 credentials...");
  oauth2Client.setCredentials({ access_token: accessToken });

  if (!uploadId) {
    console.log("creating upload for YouTube");

    // Download video from our S3
    const videoResponse = await axios.get(media[0].url, {
      responseType: "stream",
    });

    // Create upload
    const upload = await youtube.videos.insert({
      auth: oauth2Client,
      part: "snippet,status",
      requestBody: {
        snippet: {
          title:
            post.platformSettings?.youtube?.title ||
            content?.substring(0, 70) ||
            "",
          description: content || "",
        },
        status: {
          privacyStatus: post.platformSettings?.youtube?.privacy || "public",
        },
      },
      media: {
        body: videoResponse.data,
      },
    });

    uploadId = upload.data.id;

    post.uploadId = uploadId;
    await post.save();
  }

  await checkUploadStatus(uploadId, oauth2Client, post);

  return;
};

const checkUploadStatus = async (uploadId, auth, post) => {
  const response = await youtube.videos.list({
    auth: auth,
    part: "status,processingDetails",
    id: uploadId,
  });

  if (response.data.items.length === 0) {
    post.status = "processing";
    await post.save();
    throw new Error("MEDIA_PROCESSING");
  }

  const video = response.data.items[0];
  const uploadStatus = video.status.uploadStatus;
  const processingStatus = video.processingDetails?.processingStatus;

  console.log("YouTube status:", { uploadStatus, processingStatus });

  switch (uploadStatus) {
    case "uploaded":
    case "processed":
      if (processingStatus === "processing") {
        post.status = "processing";
        await post.save();
        throw new Error("MEDIA_PROCESSING");
      } else if (processingStatus === "succeeded") {
        return true;
      } else if (processingStatus === "failed") {
        throw new Error(
          video.processingDetails?.processingFailureReason ||
            "YouTube processing failed"
        );
      }
      break;

    case "failed":
      throw new Error(video.status.failureReason || "YouTube upload failed");

    default:
      throw new Error("Status: " + uploadStatus);
  }
};

// Function to check and refresh the access token before making API calls
const ensureValidAccessToken = async (connection, oauth2Client) => {
  let accessToken = connection.accessToken;
  const refreshToken = connection.refreshToken;

  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  if (!accessToken || isTokenExpired(connection.accessTokenExpiresAt)) {
    console.log("Access token expired. Refreshing...");

    oauth2Client.setCredentials({ refresh_token: refreshToken });

    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      console.log(credentials);
      console.log("New access token received.");

      // Update user with new token in the database
      await platformConnection.findByIdAndUpdate(connection._id, {
        accessToken: credentials.access_token,
        accessTokenExpiresAt: credentials.expiry_date,
      });

      accessToken = credentials.access_token;
    } catch (error) {
      console.error("Failed to refresh access token:", error);
      throw new Error("YouTube authentication error");
    }
  }

  return accessToken;
};

// Function to check if the token is expired
const isTokenExpired = (accessTokenExpiresAt) => {
  // return true;
  return !accessTokenExpiresAt || Date.now() >= accessTokenExpiresAt - 60000; // If within 1 min of expiry, consider expired
};

[
  {
    platformSettings: { youtube: { privacy: "private", title: "test" } },
    _id: "67a6043df00341503938e8fe",
    content: "test",
    platform: "youtube",
    platformId: "UCIBCqZ14ykIxCdie6IRXqfg",
    status: "published",
    errorMessage: null,
  },
  {
    platformSettings: { youtube: { privacy: "private", title: "test" } },
    _id: "67a6043df00341503938e8ff",
    content: "test",
    platform: "youtube",
    platformId: "UCGgIgeaHXD-ayAsj8aJmDEQ",
    status: "failed",
    errorMessage:
      "TypeError: Cannot read properties of undefined (reading 'status')",
  },
];
