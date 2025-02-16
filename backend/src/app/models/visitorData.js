const mongoose = require("mongoose");
const waitlistConnection = require("../config/MongoDbWaitlist");

const visitorDataSchema = new mongoose.Schema(
  {
    referrer: { type: String },
    ipAddress: { type: String },
    utmParams: { type: String },
    creationDate: { type: Date },
  },
  { collection: "visitorData" }
);

module.exports = waitlistConnection.model("VisitorData", visitorDataSchema);
