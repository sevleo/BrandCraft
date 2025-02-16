const mongoose = require("mongoose");
const waitlistConnection = require("../config/MongoDbWaitlist");

const emailDataSchema = new mongoose.Schema(
  {
    email: { type: String },
    referrer: { type: String },
    ipAddress: { type: String },
    utmParams: { type: String },
    creationDate: { type: Date },
  },
  { collection: "emailData" }
);

module.exports = waitlistConnection.model("EmailData", emailDataSchema);
