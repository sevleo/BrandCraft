const mongoose = require("mongoose");

const appDataConnection = mongoose.createConnection(
  process.env.MONGO_DB_APPDATA
);

appDataConnection.on("connected", () => {
  console.log("Connected to MongoDB App Data Database");
});

appDataConnection.on("error", (err) => {
  console.error("MongoDB App Data connection error:", err);
});

module.exports = appDataConnection;
