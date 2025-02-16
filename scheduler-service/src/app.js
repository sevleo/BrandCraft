require("dotenv").config();
require("./app/config/MongoDbAppData");
const express = require("express");
const https = require("https");
const fs = require("fs");
const path = require("path");
const schedulerService = require("./app/services/schedulerService");

// App & Server
const app = express();

const port = process.env.PORT || 4000;

// SSL configuration
const sslOptions = {
  key: fs.readFileSync(path.join(__dirname, "../certs/localhost-key.pem")),
  cert: fs.readFileSync(path.join(__dirname, "../certs/localhost.pem")),
};

const isProduction = process.env.NODE_ENV === "production";

if (isProduction) {
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
} else {
  const server = https.createServer(sslOptions, app);
  server.listen(port, () => {
    console.log(`Server running on https://localhost:${port}`);
  });
}

schedulerService.start();
console.log("Post scheduler service started");
