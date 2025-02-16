const mongoose = require("mongoose");

const waitlistConnection = mongoose.createConnection(
  process.env.MONGO_DB_WAITLIST
);

waitlistConnection.on("connected", () => {
  console.log("Connected to MongoDB Waitlist Database");
});

waitlistConnection.on("error", (err) => {
  console.error("MongoDB Waitlist connection error:", err);
});

module.exports = waitlistConnection;
