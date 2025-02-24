import { defineEventHandler } from "h3";
import { BlogClient } from "seobot";
import { useRuntimeConfig } from "nuxt/app";

const config = useRuntimeConfig();

interface Article {
  slug: string;
  updatedAt: string;
}

export default defineEventHandler(async (event) => {
  let articles: Article[] = [];

  try {
    const client = new BlogClient(config.public.NUXT_PUBLIC_SEOBOT_KEY);
    const response = await client.getArticles(0, 100); // Get up to 100 articles
    articles = response.articles || [];
  } catch (error) {
    console.error("Error fetching articles for sitemap:", error);
    // Continue with empty articles array rather than failing
  }

  // Generate sitemap XML
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Home Page -->
  <url>
    <loc>https://brandcraft.art/</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>

  <!-- Platform Pages -->
  <url>
    <loc>https://brandcraft.art/instagram</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://brandcraft.art/facebook</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://brandcraft.art/x</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://brandcraft.art/tiktok</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://brandcraft.art/youtube</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://brandcraft.art/threads</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://brandcraft.art/mastodon</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://brandcraft.art/bluesky</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>

  <!-- Blog Section -->
  <url>
    <loc>https://brandcraft.art/blog</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>

  <!-- Blog Articles -->
  ${articles
    .map(
      (article: Article) => `
  <url>
    <loc>https://brandcraft.art/blog/${article.slug}</loc>
    <lastmod>${new Date(article.updatedAt).toISOString().split("T")[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  `
    )
    .join("")}

  <!-- Legal Pages -->
  <url>
    <loc>https://brandcraft.art/privacy</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://brandcraft.art/terms</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>`;

  // Set response headers
  event.node.res.setHeader("Content-Type", "application/xml");
  return sitemap;
});
