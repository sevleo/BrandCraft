import { BlogClient } from "seobot";

export default defineEventHandler(async (event) => {
  const seobotKey: any = process.env.SEOBOT_KEY;

  const client = new BlogClient(seobotKey);

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
