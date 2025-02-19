const express = require("express");
const authenticateWithRefresh = require("../middleware/authenticateWithRefresh");
const multer = require("multer");

const scheduledPostController = require("../controllers/scheduledPostController");

const router = express.Router();

const upload = multer({
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

router.post(
  "/scheduled-posts",
  authenticateWithRefresh,
  upload.fields([{ name: "media", maxCount: 4 }]),
  scheduledPostController.createScheduledPost
);

router.put(
  "/scheduled-posts/:id",
  authenticateWithRefresh,
  upload.fields([{ name: "media", maxCount: 4 }]),
  scheduledPostController.updateScheduledPost
);

router.get(
  "/scheduled-posts",
  authenticateWithRefresh,
  scheduledPostController.getPostGroups
);

router.delete(
  "/scheduled-posts/:id",
  authenticateWithRefresh,
  scheduledPostController.deleteScheduledPost
);

router.get(
  "/scheduled-posts-stats",
  authenticateWithRefresh,
  scheduledPostController.getAllScheduledPostsStats
);

module.exports = router;
