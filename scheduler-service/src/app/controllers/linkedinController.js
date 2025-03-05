const axios = require("axios");
require("dotenv").config();
const platformConnection = require("../models/platformConnection");

const LINKEDIN_API_BASE_URL = "https://api.linkedin.com/v2";

exports.postToLinkedinInternal = async ({
  content,
  user,
  media = [],
  post,
}) => {
  const trimmedContent = content ? content.trim() : "";

  const connection = await platformConnection.findOne({
    userId: user._id,
    platform: "linkedin",
    platformId: post.platformId,
  });

  if (!connection) {
    throw new Error("No LinkedIn connection found for this user.");
  }

  const author = `urn:li:person:${connection.platformId}`;

  // If media is present, upload it first
  if (media.length > 0) {
    let uploadedMedia = [];

    if (media.length > 0) {
      uploadedMedia = await Promise.all(
        media.map((file) =>
          uploadMediaToLinkedIn(
            file.url,
            file.type,
            connection.accessToken,
            author
          )
        )
      );
    }

    console.log("✅ All media uploaded:", uploadedMedia);

    // ✅ **Now publish the post with all uploaded media**
    const publishedPost = await publishLinkedInPost({
      content: trimmedContent,
      media: uploadedMedia,
      author,
      accessToken: connection.accessToken,
      mediaType: media[0].type,
    });

    console.log("✅ Post published:", publishedPost);
  } else {
    // If no media, publish a text post
    const publishedPost = await publishLinkedInPost({
      content: trimmedContent,
      media: [],
      author,
      accessToken: connection.accessToken,
    });

    console.log(publishedPost);
  }
};

const uploadMediaToLinkedIn = async (
  mediaUrl,
  mediaType,
  accessToken,
  author
) => {
  console.log(`🔄 Registering media upload for ${mediaType}`);

  const registerUrl = `${LINKEDIN_API_BASE_URL}/assets?action=registerUpload`;

  const registerResponse = await axios.post(
    registerUrl,
    {
      registerUploadRequest: {
        owner: author,
        recipes: [
          mediaType === "video"
            ? "urn:li:digitalmediaRecipe:feedshare-video"
            : "urn:li:digitalmediaRecipe:feedshare-image",
        ],
        serviceRelationships: [
          {
            identifier: "urn:li:userGeneratedContent",
            relationshipType: "OWNER",
          },
        ],
      },
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  console.log(`✅ Media registered:`, registerResponse.data); // Log response

  const uploadMechanism = registerResponse.data?.value?.uploadMechanism;
  const uploadUrl =
    uploadMechanism?.[
      "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
    ]?.uploadUrl;
  const asset = registerResponse.data?.value?.asset;

  if (!uploadUrl || !asset) {
    throw new Error(
      "❌ Media registration failed, missing upload URL or asset."
    );
  }

  console.log(`🔄 Fetching media file from URL: ${mediaUrl}`);

  // Download the file and convert to buffer
  const response = await fetch(mediaUrl);
  const arrayBuffer = await response.arrayBuffer();
  const fileBuffer = Buffer.from(arrayBuffer);

  console.log(`✅ Media file fetched: ${fileBuffer.length} bytes`);

  // Upload the media to LinkedIn
  try {
    const uploadResponse = await axios.put(uploadUrl, fileBuffer, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type":
          mediaType === "video" ? "application/octet-stream" : "image/jpeg",
        "Content-Length": fileBuffer.length,
      },
    });

    console.log(
      `✅ Media uploaded successfully! Status: ${uploadResponse.status}`
    );
  } catch (err) {
    console.error(
      "❌ Error uploading media:",
      err.response?.data || err.message
    );
    throw err;
  }

  console.log(`✅ Uploaded media, asset: ${asset}`);

  // ✅ Directly return the asset ID instead of checking processing status
  //   return mediaType === "video"
  //     ? await checkMediaProcessing(asset, accessToken)
  //     : asset;
  return asset;
};

const publishLinkedInPost = async ({
  content,
  media,
  author,
  accessToken,
  mediaType = null,
}) => {
  console.log("📢 Publishing LinkedIn post with media:", media);

  // Determine the media category
  let shareMediaCategory = "NONE"; // Default to text-only
  if (mediaType && mediaType === "video") {
    shareMediaCategory = "VIDEO";
  } else if (mediaType && mediaType === "image") {
    shareMediaCategory = "IMAGE";
  }

  console.log(media);
  console.log(shareMediaCategory);

  const postBody = {
    author: author,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text: content },
        shareMediaCategory: shareMediaCategory, // ✅ Always include this field
      },
    },
    visibility: {
      "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
    },
  };

  // ✅ If media exists, add media array
  if (media.length > 0) {
    postBody.specificContent["com.linkedin.ugc.ShareContent"].media = media.map(
      (m) => ({
        status: "READY",
        media: m, // Ensure this is a valid asset ID
      })
    );
  }

  console.log("📢 Posting to LinkedIn:", JSON.stringify(postBody, null, 2));

  try {
    const postResponse = await axios.post(
      `${LINKEDIN_API_BASE_URL}/ugcPosts`,
      postBody,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Post published successfully:", postResponse.data);
    return postResponse.data;
  } catch (error) {
    console.error(
      "❌ Error publishing post:",
      error.response?.data || error.message
    );
    throw error;
  }
};

const checkMediaProcessing = async (asset, accessToken) => {
  console.log(
    `🔄 Checking media processing status: ${LINKEDIN_API_BASE_URL}/assets/${asset}`
  );

  for (let i = 0; i < 10; i++) {
    try {
      const response = await axios.get(
        `${LINKEDIN_API_BASE_URL}/assets/${asset}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      console.log(`✅ Media Processing Status: ${response.data.status}`);

      if (response.data.status === "READY") {
        return asset;
      }
    } catch (error) {
      console.error(
        `❌ Error checking media status:`,
        error.response?.data || error.message
      );
      if (error.response?.status === 400) {
        throw new Error("❌ Invalid asset ID, possible upload failure.");
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait 3s before retrying
  }

  throw new Error("❌ Media processing timeout on LinkedIn");
};
