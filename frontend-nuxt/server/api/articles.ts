// server/api/articles.ts
import { BlogClient } from "seobot";

export default defineEventHandler(async (event) => {
  const seobotKey: any = process.env.SEOBOT_KEY;

  const client = new BlogClient(seobotKey);

  const { page = 0, limit = 9 } = getQuery(event) as {
    page: number;
    limit: number;
  };

  try {
    const response = await client.getArticles(page, limit);

    return { articles: response.articles };
  } catch (error) {
    console.error("Error fetching articles:", error);
    return { error: "Failed to fetch articles" };
  }
});
