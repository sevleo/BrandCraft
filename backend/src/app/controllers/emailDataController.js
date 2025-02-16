const EmailData = require("../models/emailData");
const { isValidEmail } = require("../helpers/validation");

const handleEmailData = async (req, res, next) => {
  const { email, utmParams, referrer } = req.body;

  if (email && isValidEmail(email)) {
    const existingEmail = await EmailData.findOne({ email: email });

    if (existingEmail) {
      res.status(409).send({
        message: "Email already exists",
      });
      return;
    }

    const newEmail = new EmailData({
      email,
      utmParams,
      referrer,
      creationDate: new Date(),
    });

    await newEmail.save();

    const emailCount = await EmailData.countDocuments();

    res.status(200).send({
      success: true,
      message: "Received email",
      emailCount: emailCount,
    });
  } else {
    res.status(500).send({ message: "Please provide a proper email" });
  }
};

const countEmails = async (req, res, next) => {
  const emailCount = await EmailData.countDocuments();

  res.status(200).send({
    success: true,
    emailCount: emailCount,
  });
};

module.exports = {
  handleEmailData,
  countEmails,
};
