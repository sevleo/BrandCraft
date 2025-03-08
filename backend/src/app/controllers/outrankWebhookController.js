const OutrankArticle = require("../models/outrankArticle");
const ACCESS_TOKEN = process.env.OUTRANK_WEBHOOK_TOKEN;

// Function to validate the access token in the request header
function validateAccessToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }
  const token = authHeader.split(" ")[1];
  return token === ACCESS_TOKEN;
}

// Webhook controller function
const webhook = async (req, res) => {
  console.log("Received Outrank Webhook");
  try {
    // Validate access token
    if (!validateAccessToken(req)) {
      console.warn("Unauthorized webhook attempt");
      return res.status(401).json({ error: "Invalid access token" });
    }

    const { event_type, timestamp, data } = req.body;

    // Validate payload structure
    if (event_type !== "publish_articles" || !data?.articles) {
      console.error("Invalid webhook payload:", req.body);
      return res.status(400).json({ error: "Invalid webhook payload" });
    }

    console.log(`Received Outrank Webhook at ${timestamp}`);

    // Process and store articles
    for (const article of data.articles) {
      const {
        id,
        title,
        content_markdown,
        content_html,
        meta_description,
        created_at,
        image_url,
        slug,
      } = article;

      try {
        // Upsert (Insert if new, Update if exists)
        await OutrankArticle.findOneAndUpdate(
          { id }, // Filter by article ID
          {
            title,
            content_markdown,
            content_html,
            meta_description,
            created_at: new Date(created_at), // Ensure correct Date format
            image_url,
            slug,
          },
          { upsert: true, new: true, runValidators: true } // Insert if missing, return updated
        );

        console.log(`Processed article: ${title}`);
      } catch (error) {
        console.error(`Error processing article "${title}":`, error);
      }
    }

    res.status(200).json({ message: "Webhook processed successfully" });
  } catch (error) {
    console.error("Error handling webhook:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { webhook };
