// server/api/articles.ts
import { useRuntimeConfig } from "#imports";
import { BlogClient } from "seobot";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const client = new BlogClient(config.SEOBOT_KEY as string);

  const { page = 0, limit = 9 } = getQuery(event) as {
    page: number;
    limit: number;
  };

  try {
    const response = await client.getArticles(page, limit);
    return { articles: response.articles };
  } catch (error) {
    return { error: "Failed to fetch articles" };
  }
});
