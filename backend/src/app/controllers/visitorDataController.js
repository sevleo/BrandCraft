const VisitorData = require("../models/visitorData");

const trackVisitor = async (req, res) => {
  const { utmParams, referrer } = req.body;
  const ipAddress =
    req.headers["x-forwarded-for"] || req.connection.remoteAddress;

  try {
    const visitor = new VisitorData({
      utmParams,
      referrer,
      ipAddress,
      visitDate: new Date(),
    });

    await visitor.save();
    res.status(200).send({ message: "Visitor tracked successfully." });
  } catch (err) {
    console.error("Error tracking visitor:", err);
    res.status(500).send({ message: "Failed to track visitor." });
  }
};

module.exports = {
  trackVisitor,
};
