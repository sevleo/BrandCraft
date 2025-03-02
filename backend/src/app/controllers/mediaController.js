const MediaFile = require("../models/mediaFile");
const ScheduledPostGroup = require("../models/scheduledPostGroup");
const { uploadFileToS3, deleteFileFromS3 } = require("../services/s3Service");

/**
 * Upload media files and associate them with a post group
 */
exports.uploadMedia = async (req, res) => {
  try {
    const { postGroupId } = req.params;
    const userId = req.user._id;

    // Verify post group exists and belongs to user
    const postGroup = await ScheduledPostGroup.findOne({
      _id: postGroupId,
      userId,
    });

    if (!postGroup) {
      return res.status(404).json({ error: "Post group not found" });
    }

    // Verify bundle hasn't been published
    if (postGroup.status === "published" || postGroup.status === "failed") {
      return res.status(400).json({
        error: "Cannot update bundle that has already been published or failed",
      });
    }

    // Handle file uploads
    if (!req.files?.media || req.files.media.length === 0) {
      return res.status(400).json({ error: "No media files uploaded" });
    }

    // Upload files to S3
    const uploadedFiles = await handleImageUpload(req.files.media, userId);

    // Save new media files to the database
    const newMediaFiles = await Promise.all(
      uploadedFiles.map(async (file) => {
        const newMediaFile = new MediaFile({
          userId: userId,
          postGroupId: postGroup._id,
          url: file.url,
          fileName: file.filename,
          mimeType: file.mimeType,
          size: file.size,
          type: file.type,
        });
        await newMediaFile.save();
        return newMediaFile;
      })
    );

    // Update post group with new media files
    const mediaFileIds = newMediaFiles.map((file) => file._id);
    await ScheduledPostGroup.findByIdAndUpdate(postGroup._id, {
      $push: { mediaFiles: { $each: mediaFileIds } },
      $currentDate: { updatedAt: true },
    });

    res.json({
      success: true,
      mediaFiles: newMediaFiles.map((file) => ({
        _id: file._id,
        url: file.url,
        fileName: file.fileName,
        type: file.type,
      })),
    });
  } catch (error) {
    console.error("Media upload error:", error);
    res.status(500).json({ error: "Failed to upload media files" });
  }
};

/**
 * Delete a media file
 */
exports.deleteMedia = async (req, res) => {
  try {
    const { mediaId } = req.params;
    const userId = req.user._id;

    // Find the media file and verify ownership
    const mediaFile = await MediaFile.findOne({
      _id: mediaId,
      userId,
    });

    if (!mediaFile) {
      return res.status(404).json({ error: "Media file not found" });
    }

    // Find the associated post group
    const postGroup = await ScheduledPostGroup.findOne({
      _id: mediaFile.postGroupId,
    });

    // Verify bundle hasn't been published if it exists
    if (
      postGroup &&
      (postGroup.status === "published" || postGroup.status === "failed")
    ) {
      return res.status(400).json({
        error:
          "Cannot delete media from a post that has already been published or failed",
      });
    }

    // Delete the file from S3
    try {
      await deleteFileFromS3(mediaFile.url);
    } catch (s3Error) {
      console.error("Error deleting file from S3:", s3Error);
      // Continue with database deletion even if S3 deletion fails
    }

    // Remove the media file from the post group
    if (postGroup) {
      await ScheduledPostGroup.findByIdAndUpdate(postGroup._id, {
        $pull: { mediaFiles: mediaFile._id },
        $currentDate: { updatedAt: true },
      });
    }

    // Delete the media file record
    await mediaFile.deleteOne();

    res.json({ success: true });
  } catch (error) {
    console.error("Media deletion error:", error);
    res.status(500).json({ error: "Failed to delete media file" });
  }
};

/**
 * Handle image upload to S3
 */
async function handleImageUpload(files, userId) {
  const uploadedFiles = [];
  const timestamp = Date.now();

  for (const file of files) {
    const formattedOriginalname = file.originalname
      .replace(/[^A-Za-z0-9]/g, "-")
      .toLowerCase();
    const s3FileName = `${timestamp}-${formattedOriginalname}-${userId}`;

    try {
      const fileUrl = await uploadFileToS3(
        file.buffer,
        s3FileName,
        file.mimetype
      );

      uploadedFiles.push({
        filename: s3FileName,
        url: fileUrl,
        mimeType: file.mimetype,
        size: file.size,
        type: "image",
      });
    } catch (error) {
      console.error("Error uploading file to S3:", error);
      throw error;
    }
  }

  return uploadedFiles;
}
