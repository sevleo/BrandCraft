const mongoose = require("mongoose");
const appDataConnection = require("../config/MongoDbAppData");

const ArticleSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true }, // Outrank Article ID
    title: { type: String, required: true },
    content_markdown: { type: String, required: true },
    content_html: { type: String, required: true },
    meta_description: { type: String },
    created_at: { type: Date, required: true },
    image_url: { type: String },
    slug: { type: String, required: true, unique: true, index: true }, // Indexed for quick queries
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

module.exports = appDataConnection.model("OutrankArticle", ArticleSchema);
