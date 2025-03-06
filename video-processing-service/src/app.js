require("dotenv").config();
require("../../scheduler-service/src/app/config/MongoDbAppData"); // If MongoDB is used
const express = require("express");
const schedulerService = require("../../scheduler-service/src/app/services/schedulerService");

// Create Express app
const app = express();

// Middleware (if needed)
app.use(express.json());

const port = process.env.PORT || 4000;

// Start the server (no HTTPS needed)
app.listen(port, () => {
  console.log(`Video Processing Service running on http://localhost:${port}`);
});

// Start BullMQ Worker
schedulerService.start();
console.log("Video processing worker started");
