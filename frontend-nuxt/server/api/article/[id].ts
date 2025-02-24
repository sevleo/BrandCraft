import { useRuntimeConfig } from "#imports";
import { BlogClient } from "seobot";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const client = new BlogClient(config.SEOBOT_KEY as string);

  // Get article ID from route params
  const { id } = event.context.params as { id: string };

  try {
    const article = await client.getArticle(id);

    if (!article) {
      throw new Error("Article not found");
    }

    return { article };
  } catch (error) {
    console.error("Failed to fetch article:", error);
    return {
      error: "Failed to fetch the article. Please try again later.",
      status: 404,
    };
  }
});
