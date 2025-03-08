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
const ScheduledPostGroup = require("../models/scheduledPostGroup");
const mediaController = require("../controllers/mediaController");
const { EventEmitter } = require("events");

const router = express.Router();

// Configure multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 512 * 1024 * 1024, // 512MB limit for videos
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "video/quicktime" || file.mimetype === "video/mp4") {
      cb(null, true);
    } else {
      cb(new Error("Only MOV/MP4 files are allowed for this endpoint"));
    }
  },
});

// Configure multer for post media uploads
const postMediaUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 512 * 1024 * 1024, // 512MB limit for videos
    files: 4, // Max 4 files
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype.startsWith("video/")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only image and video files are allowed"));
    }
  },
});

// Save image(s)
router.post(
  "/post/:postGroupId/upload",
  authenticateWithRefresh,
  postMediaUpload.fields([{ name: "media", maxCount: 4 }]),
  mediaController.uploadMedia
);

// Delete image/video
router.delete(
  "/post/media/:mediaId",
  authenticateWithRefresh,
  mediaController.deleteMedia
);

// Not using
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

const clients = {}; // Store SSE clients

// SSE route for processing progress
router.get("/processing-progress/:id", (req, res) => {
  const { id } = req.params;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  clients[id] = res;

  req.on("close", () => {
    delete clients[id];
  });
});

// Save video
router.post(
  "/process-video",
  authenticateWithRefresh,
  upload.single("video"),
  async (req, res) => {
    let tempInputPath;
    // let tempOutputPath;

    try {
      if (!req.file) {
        return res.status(400).json({ error: "No video file uploaded" });
      }

      const sessionId = Date.now().toString();
      res.json({ sessionId });

      const sanitizedFileName = sanitizeFileName(req.file.originalname);

      const fileExtension = path.extname(sanitizedFileName) || ".mp4"; // Default to .mp4 if not found

      // Dynamically set the temp input path
      tempInputPath = path.join(
        os.tmpdir(),
        `input-${Date.now()}${fileExtension}`
      );
      // tempOutputPath = path.join(os.tmpdir(), `output-${Date.now()}.mp4`);

      // Save uploaded file to temp location
      fs.writeFileSync(tempInputPath, req.file.buffer);

      const inputMetadata = await new Promise((resolve, reject) => {
        ffmpeg.ffprobe(tempInputPath, (err, metadata) => {
          if (err) return reject(err);
          resolve(metadata);
        });
      });

      const inputVideoStream = inputMetadata.streams.find(
        (stream) => stream.codec_type === "video"
      );

      // Extract key metadata
      const width = inputVideoStream.width || 0;
      const height = inputVideoStream.height || 0;
      const aspectRatio =
        width && height ? (width / height).toFixed(2) : "unknown";
      const codecName = inputVideoStream.codec_name || "unknown";
      const frameRateString = inputVideoStream.r_frame_rate || "0/1";
      const [numerator, denominator] = frameRateString.split("/").map(Number);
      const frameRate =
        numerator && denominator ? (numerator / denominator).toFixed(2) : 0;
      const bitRate = inputVideoStream.bit_rate
        ? parseInt(inputVideoStream.bit_rate)
        : 0;
      const duration = inputMetadata.format.duration
        ? parseFloat(inputMetadata.format.duration)
        : 0;
      const fileSize = inputMetadata.format.size
        ? parseInt(inputMetadata.format.size)
        : 0;

      console.log(`Extracted Metadata:
          Resolution: ${width}x${height}
          Aspect Ratio: ${aspectRatio}
          Codec: ${codecName}
          Frame Rate: ${frameRate} fps
          Bitrate: ${bitRate} bps
          Duration: ${duration} sec
          File Size: ${fileSize} bytes
        `);

      // // if (needsProcessing) {
      // if (1 === 1) {
      //   // Process video with ffmpeg
      //   await new Promise((resolve, reject) => {
      //     ffmpeg(tempInputPath)
      //       .outputOptions([
      //         "-c:v libx264", // Use H.264 codec for compatibility
      //         "-preset ultrafast", // Faster encoding preset
      //         "-crf 28", // Quality setting (23 is a good trade-off between quality and speed)
      //         "-vf scale=w=1080:h=1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2", // Adjust aspect ratio to 9:16
      //         "-r 60", // Set frame rate to 60
      //         "-y", // Overwrite output file if exists
      //       ])
      //       .toFormat("mp4")
      //       .on("progress", (progress) => {
      //         // progress.percent gives us the conversion progress
      //         console.log(
      //           `Conversion progress: ${Math.round(progress.percent)}%`
      //         );

      //         if (clients[sessionId]) {
      //           clients[sessionId].write(
      //             `data: ${JSON.stringify({
      //               percent: Math.round(progress.percent),
      //             })}\n\n`
      //           );
      //         }
      //       })
      //       .on("end", () => {
      //         console.log("Video conversion completed");
      //         if (clients[sessionId]) {
      //           clients[sessionId].write(
      //             `data: ${JSON.stringify({ completed: true })}\n\n`
      //           );
      //           clients[sessionId].end();
      //         }
      //         resolve();
      //       })
      //       .on("error", (err) => {
      //         console.error("Error during video conversion:", err);
      //         if (clients[sessionId]) {
      //           clients[sessionId].write(
      //             `data: ${JSON.stringify({ error: err.message })}\n\n`
      //           );
      //           clients[sessionId].end();
      //         }
      //         reject(err);
      //       })
      //       .save(tempOutputPath);
      //   });
      // } else {
      //   tempOutputPath = tempInputPath;
      //   if (clients[sessionId]) {
      //     // clients[sessionId].write(
      //     //   `data: ${JSON.stringify({ percent: 100, completed: true })}\n\n`
      //     // );
      //     // clients[sessionId].end();

      //     console.log("Sending final event...");
      //     clients[sessionId].write(
      //       `data: ${JSON.stringify({ percent: 100, completed: true })}\n\n`
      //     );
      //     clients[sessionId].flushHeaders();
      //     setTimeout(() => {
      //       clients[sessionId]?.end();
      //     }, 1000);
      //   }
      // }

      // Read the processed file
      // const processedVideoBuffer = fs.readFileSync(tempOutputPath);
      const processedVideoBuffer = fs.readFileSync(tempInputPath);

      // Get presigned URL for the processed MP4 file
      // const outputFilename = `${path.basename(
      //   sanitizedFileName,
      //   path.extname(sanitizedFileName)
      // )}.mp4`;

      const inputFileName = `${path.basename(sanitizedFileName)}`;

      const inputMimeType = req.file.mimetype; // Get the real MIME type from multer

      const { uploadUrl, key } = await generatePresignedUploadUrl(
        // outputFilename,
        inputFileName,
        inputMimeType
      );

      const newMediaFile = new MediaFile({
        userId: req.user._id,
        postGroupId: req.body.postGroupId,
        url: `https://media.brandcraft.art/${key}`,
        urlPure: `https://brandcraft-media.s3.amazonaws.com/${key}`,
        uploadUrl: uploadUrl,
        fileName: key,
        type: "video",
        metadata: {
          mimeType: inputMimeType,
          size: fileSize,
          width,
          height,
          aspectRatio,
          frameRate,
          codecName,
          bitRate,
          duration,
        },
      });
      await newMediaFile.save();

      await ScheduledPostGroup.updateOne(
        { _id: req.body.postGroupId },
        { $push: { mediaFiles: newMediaFile._id } }
      );

      const progressEmitter = new EventEmitter();

      // Upload to S3 using presigned URL with improved progress reporting
      const chunkSize = 1024 * 1024 * 20; // 20MB chunks
      const totalSize = processedVideoBuffer.length;
      let uploadedBytes = 0;
      let lastReportedProgress = 0;

      // Configure axios with proper chunking
      await axios.put(uploadUrl, processedVideoBuffer, {
        headers: {
          "Content-Type": inputMimeType,
          "Content-Length": totalSize.toString(),
        },
        // Force axios to use chunked upload
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        // Set a smaller chunk size
        maxRate: chunkSize,
        onUploadProgress: (progressEvent) => {
          uploadedBytes = progressEvent.loaded;
          const currentProgress = Math.floor((uploadedBytes / totalSize) * 100);

          // Report progress if it's changed by at least 1%
          if (currentProgress > lastReportedProgress) {
            lastReportedProgress = currentProgress;

            if (clients[sessionId]) {
              clients[sessionId].write(
                `data: ${JSON.stringify({
                  percent: Math.round(currentProgress),
                })}\n\n`
              );
            }

            // If you're using SSE, emit the event here
            // progressEmitter.emit('progress', { percent: currentProgress });
          }
        },
      });

      console.log("Video uploaded successfully to S3");
      if (clients[sessionId]) {
        clients[sessionId].write(
          `data: ${JSON.stringify({ completed: true })}\n\n`
        );
        clients[sessionId].end();
      }
    } catch (error) {
      console.error("Error processing video:", error);
      if (clients[req.body.sessionId]) {
        clients[req.body.sessionId].write(
          `data: ${JSON.stringify({ error: error.message })}\n\n`
        );
        clients[req.body.sessionId].end();
      }
    } finally {
      // Ensure temp files are cleaned up
      if (tempInputPath && fs.existsSync(tempInputPath)) {
        fs.unlink(tempInputPath, (err) => {
          if (err) console.error(`Failed to delete temp input file: ${err}`);
        });
      }
      // if (
      //   tempOutputPath &&
      //   tempOutputPath !== tempInputPath &&
      //   fs.existsSync(tempOutputPath)
      // ) {
      //   fs.unlink(tempOutputPath, (err) => {
      //     if (err) console.error(`Failed to delete temp output file: ${err}`);
      //   });
      // }
    }
  }
);

module.exports = router;
