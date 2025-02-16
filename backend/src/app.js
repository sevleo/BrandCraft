require("dotenv").config();
const cors = require("cors");
const express = require("express");
const https = require("https");
const fs = require("fs");
const path = require("path");
const mainRouter = require("./app/routes/mainRouter");
const session = require("express-session");
const initializePassport = require("./app/config/passportInitializer");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const { redisStore } = require("./app/config/RedisInitializer");

require("./app/config/MongoDbWaitlist");
require("./app/config/MongoDbAppData");

const app = express();

// Session configuration
app.use(
  session({
    store: redisStore,
    secret: process.env.SESSION_SECRET,
    name: "brandcraft.sid",
    saveUninitialized: false,
    resave: false,
    // rolling: true,
    cookie: {
      // domain: process.env.NODE_ENV === "production" ? "brandcraft-backend.fly.dev" : "",
      secure: true,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: "none",
    },
    proxy: true,
  })
);

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

const port = process.env.PORT || 3000;

const sslOptions = {
  key: fs.readFileSync(path.join(__dirname, "../certs/localhost-key.pem")),
  cert: fs.readFileSync(path.join(__dirname, "../certs/localhost.pem")),
};

const corsOptions = {
  origin: [process.env.FRONTEND_URL, process.env.FRONTEND_LANDING_URL],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
  credentials: true,
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Custom-Header",
    "refreshtoken",
  ],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Middleware setup - order is important
app.use(express.json()); // Parse JSON payloads
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cookieParser());

initializePassport(app);

app.use("/", mainRouter);

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
