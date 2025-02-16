const express = require("express");
const authenticateWithRefresh = require("../middleware/authenticateWithRefresh");
const { generatePresignedUploadUrl } = require("../services/s3Service");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");
const os = require("os");
const multer = require("multer");
const axios = require("axios");
const MediaFile = require("../models/mediaFile");

const router = express.Router();

// Configure multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 512 * 1024 * 1024, // 512MB limit for videos
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === "video/quicktime" ||
      file.originalname.toLowerCase().endsWith(".mov")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only MOV video files are allowed for this endpoint"));
    }
  },
});

router.post(
  "/generate-upload-url",
  authenticateWithRefresh,
  async (req, res) => {
    try {
      let { fileName, contentType } = req.body;

      fileName = sanitizeFileName(fileName);

      if (!fileName || !contentType) {
        return res
          .status(400)
          .json({ error: "fileName and contentType are required" });
      }

      if (!contentType.startsWith("video/")) {
        return res.status(400).json({ error: "Only video files are allowed" });
      }

      const { uploadUrl, key } = await generatePresignedUploadUrl(
        fileName,
        contentType
      );

      const newMediaFile = new MediaFile({
        userId: req.user._id,
        postGroupId: null,
        url: `https://media.brandcraft.art/${key}`,
        urlPure: `https://brandcraft-media.s3.amazonaws.com/${key}`,
        uploadUrl: uploadUrl,
        fileName: key,
        mimeType: contentType,
        size: null,
        type: "video",
      });
      await newMediaFile.save();

      res.json({ uploadUrl, key });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  }
);

const sanitizeFileName = (fileName) => {
  return fileName
    .trim()
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .replace(/[^\w.-]/g, ""); // Remove special characters except dots and hyphens
};

// Process and upload MOV video
router.post(
  "/process-video",
  authenticateWithRefresh,
  upload.single("video"),
  async (req, res) => {
    let tempInputPath;
    let tempOutputPath;

    try {
      if (!req.file) {
        return res.status(400).json({ error: "No video file uploaded" });
      }

      tempInputPath = path.join(os.tmpdir(), `input-${Date.now()}.mov`);
      tempOutputPath = path.join(os.tmpdir(), `output-${Date.now()}.mp4`);

      // Save uploaded file to temp location
      fs.writeFileSync(tempInputPath, req.file.buffer);

      // Process video with ffmpeg
      await new Promise((resolve, reject) => {
        ffmpeg(tempInputPath)
          .outputOptions([
            "-c:v libx264", // Use H.264 codec for compatibility
            "-preset ultrafast", // Faster encoding preset
            "-crf 28", // Quality setting (23 is a good trade-off between quality and speed)
            "-vf scale=w=1080:h=1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2", // Adjust aspect ratio to 9:16
            "-r 60", // Set frame rate to 60
            "-y", // Overwrite output file if exists
          ])
          .toFormat("mp4")
          .on("progress", (progress) => {
            // progress.percent gives us the conversion progress
            if (progress.percent) {
              console.log(
                `Conversion progress: ${Math.round(progress.percent)}%`
              );
            }
          })
          .on("end", () => {
            console.log("Video conversion completed");
            resolve();
          })
          .on("error", (err) => {
            console.error("Error during video conversion:", err);
            reject(err);
          })
          .save(tempOutputPath);
      });

      // Read the processed file
      const processedVideoBuffer = fs.readFileSync(tempOutputPath);

      // Get presigned URL for the processed MP4 file
      const outputFilename = `${path.basename(
        req.file.originalname,
        ".mov"
      )}.mp4`;
      const { uploadUrl, key } = await generatePresignedUploadUrl(
        outputFilename,
        "video/mp4"
      );

      const newMediaFile = new MediaFile({
        userId: req.user._id,
        postGroupId: null,
        url: `https://media.brandcraft.art/${key}`,
        urlPure: `https://brandcraft-media.s3.amazonaws.com/${key}`,
        uploadUrl: uploadUrl,
        fileName: key,
        mimeType: "video/mp4",
        size: null,
        type: "video",
      });
      await newMediaFile.save();

      // Upload to S3 using presigned URL
      await axios.put(uploadUrl, processedVideoBuffer, {
        headers: {
          "Content-Type": "video/mp4",
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = (progressEvent.loaded / progressEvent.total) * 100;
            console.log(`Upload progress: ${progress}%`);
          }
        },
      });

      res.json({ key });
    } catch (error) {
      console.error("Error processing video:", error);
      res.status(500).json({ error: "Error processing video" });
    } finally {
      // Ensure temp files are cleaned up
      if (tempInputPath && fs.existsSync(tempInputPath)) {
        fs.unlink(tempInputPath, (err) => {
          if (err) console.error(`Failed to delete temp input file: ${err}`);
        });
      }
      if (tempOutputPath && fs.existsSync(tempOutputPath)) {
        fs.unlink(tempOutputPath, (err) => {
          if (err) console.error(`Failed to delete temp output file: ${err}`);
        });
      }
    }
  }
);

module.exports = router;
