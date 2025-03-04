<script setup lang="ts">
import { computed } from "vue";

import HomeNavigation from "@/components/HomeNavigation.vue";
import FooterSection from "@/components/FooterSection.vue";
import { useAsyncData } from "nuxt/app";

interface IArticle {
  id: string;
  slug: string;
  headline: string;
  metaDescription: string;
  metaKeywords: string;
  tags: ITag[];
  category: ICategory;
  readingTime: number;
  html: string;
  markdown: string;
  outline: string;
  deleted: boolean;
  published: boolean;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  relatedPosts: IRelatedPost[];
  image: string;
}

interface ITag {
  id: string;
  title: string;
  slug: string;
}

interface ICategory {
  id: string;
  title: string;
  slug: string;
}

interface IRelatedPost {
  id: string;
  headline: string;
  slug: string;
}
const config = useRuntimeConfig();

const route = useRoute();
const articleId = route.params.id as string;

// ✅ Fetch the article using useAsyncData
const {
  data,
  pending: loading,
  error,
} = await useAsyncData<{ article: IArticle }>(`article-${articleId}`, () =>
  $fetch(`/api/article/${articleId}`)
);

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// SEO Meta Tags
useHead({
  title: computed(() =>
    data.value?.article.headline
      ? `${data.value.article.headline} - Blog`
      : "Article Not Found"
  ),
  meta: [
    {
      name: "description",
      content: computed(
        () => data.value?.article.metaDescription || "Article not found"
      ),
    },
    {
      name: "keywords",
      content: computed(() => data.value?.article.metaKeywords || ""),
    },
  ],
});
</script>

<template>
  <HomeNavigation />
  <main class="article-page">
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner">
        <div class="spinner"></div>
      </div>
    </div>

    <div v-else-if="error" class="error-container">
      <div class="error-content">
        <h1>{{ error }}</h1>
        <p>Please try again later or return to the blog homepage.</p>
        <NuxtLink to="/blog" class="back-button">
          <span class="back-arrow">←</span>
          <span>Back to Blog</span>
        </NuxtLink>
      </div>
    </div>

    <article v-else-if="data" class="article-container">
      <!-- Hero Image -->
      <div class="hero-image">
        <img :src="data.article.image" :alt="data.article.headline" />
      </div>

      <!-- Article Content -->
      <div class="article-content">
        <!-- Article Header -->
        <header class="article-header">
          <div class="article-meta">
            <time :datetime="data.article.publishedAt">{{
              formatDate(data.article.publishedAt)
            }}</time>
            <span class="meta-separator">•</span>
            <span>{{ data.article.readingTime }} min read</span>
          </div>
        </header>

        <!-- Main Content -->
        <div class="article-body" v-html="data.article.html"></div>

        <!-- Tags -->
        <div class="tags-section">
          <div class="tags-container">
            <span v-for="tag in data.article.tags" :key="tag.id" class="tag">
              {{ tag.title }}
            </span>
          </div>
        </div>

        <!-- Related Posts -->
        <div v-if="data.article.relatedPosts?.length > 0" class="related-posts">
          <h2>Related Articles</h2>
          <div class="related-posts-grid">
            <NuxtLink
              v-for="post in data.article.relatedPosts"
              :key="post.id"
              :to="`/blog/${post.slug}`"
              class="related-post-card"
            >
              <h3>{{ post.headline }}</h3>
              <span class="read-more">Read more →</span>
            </NuxtLink>
          </div>
        </div>
      </div>
    </article>

    <div v-else class="error-container">
      <div class="error-content">
        <h1>Article not found</h1>
        <p>The article you're looking for doesn't exist or has been removed.</p>
        <NuxtLink to="/blog" class="back-button">
          <span class="back-arrow">←</span>
          <span>Back to Blog</span>
        </NuxtLink>
      </div>
    </div>
  </main>
  <FooterSection />
</template>

<style scoped>
.article-page {
  min-height: 100vh;
  background-color: #f0f0f0;
}

/* Loading Styles */
.loading-container {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Error Styles */
.error-container {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
}

.error-content {
  max-width: 600px;
}

.error-content h1 {
  font-size: 2rem;
  color: #f0f0f0;
  margin-bottom: 1rem;
}

.error-content p {
  color: #f0f0f0;
  margin-bottom: 2rem;
}

/* Article Styles */
.article-container {
  max-width: 100%;
  margin: 0 auto;
  background: #191919;
}

.hero-image {
  position: relative;
  width: 100%;
  height: 60vh;
  overflow: hidden;
}

.hero-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 200px;
  background: linear-gradient(to bottom, transparent, rgba(255, 255, 255, 1));
}

.article-content {
  max-width: 800px;
  margin: -100px auto 0;
  position: relative;
  padding: 2rem;
  background: #141414;
  border-radius: 1rem;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.article-header {
  margin-bottom: 3rem;
}

.meta-separator {
  margin: 0 0.5rem;
}

.article-body {
  font-size: 1.125rem;
  line-height: 1.8;
  color: #f0f0f0;
}

.article-body :deep(h1) {
  font-size: 2.5rem;
  font-weight: 800;
  color: #f0f0f0;
  line-height: 1.2;
  margin-bottom: 1rem;
}

.article-body :deep(h2) {
  font-size: 1.875rem;
  font-weight: 700;
  margin: 2rem 0 1rem;
  color: #f0f0f0;
  line-height: 1.3;
}

.article-body :deep(h3) {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 2rem 0 1rem;
  color: #f0f0f0;
  line-height: 1.3;
}

.article-body :deep(p) {
  margin-bottom: 1.5rem;
}

.article-body :deep(ul),
.article-body :deep(ol) {
  margin-bottom: 1.5rem;
  padding-left: 3.5rem;
  list-style-type: decimal;
}

.article-body :deep(li) {
  margin-bottom: 0.5rem;
}

.article-body :deep(a) {
  color: var(--primary-color);
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-color 0.2s;
}

.article-body :deep(a:hover) {
  border-color: var(--primary-color);
}

/* Table Styles */
.article-body :deep(table) {
  width: 100%;
  margin: 2rem 0;
  border-collapse: collapse;
  /* border-radius: 0.5rem; */
  border-radius: 15px;
  overflow: hidden;
  /* box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); */
  background-color: black;
  border: 1px solid #000000;
}

.article-body :deep(thead) {
  background-color: black;
  border-bottom: 2px solid #000000;
}

.article-body :deep(th) {
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #f0f0f0;
  text-transform: uppercase;
  font-size: 0.875rem;
  letter-spacing: 0.05em;
}

.article-body :deep(table) td {
  padding: 1rem;
  border-bottom: 1px solid #000000;
  color: #f0f0f0;
  vertical-align: middle;
}

.article-body :deep(table) tr:last-child td {
  border-bottom: none;
}

.article-body :deep(table) tr {
  background-color: #434343;
}

.article-body :deep(table) tr:hover {
  background-color: #303030;
}

.article-body :deep(blockquote) {
  margin: 2rem 0;
  padding: 1rem 2rem;
  border-left: 4px solid #a3a3a3;
  background-color: #060606;
  color: #f0f0f0;
  font-size: 1.1rem;
  font-style: italic;
}

.article-body :deep(blockquote) p:last-child {
  margin-bottom: 0;
}

/* Responsive table */
@media (max-width: 768px) {
  .article-body {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .article-body :deep(table) {
    min-width: 640px; /* Ensure table doesn't get too cramped */
  }

  .article-body :deep(table) th,
  .article-body :deep(table) td {
    white-space: nowrap; /* Prevent text wrapping in small screens */
  }
}

/* Zebra striping for better readability */
.article-body :deep(table) tbody tr:nth-child(even) {
  background-color: #242424;
}

.article-body :deep(table) tbody tr:nth-child(even):hover {
  background-color: #181818;
}

/* Tags Styles */
.tags-section {
  margin: 3rem 0;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.tag {
  display: inline-block;
  padding: 0.5rem 1rem;
  background-color: #1a1a1a;
  color: #f0f0f0;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
  cursor: pointer;
}

.tag:hover {
  background-color: #0f0f0f;
}

/* Related Posts Styles */
.related-posts {
  margin-top: 4rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
}

.related-posts h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #f0f0f0;
  margin-bottom: 1.5rem;
}

.related-posts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.related-post-card {
  padding: 1.5rem;
  background: #2d2d2d;
  border-radius: 0.75rem;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: all 0.3s ease;
}

.related-post-card:hover {
  background: #3d3d3d;
  transform: translateY(-2px);
}

.related-post-card :deep(h3) {
  font-size: 1.125rem;
  font-weight: 600;
  color: #f0f0f0;
  margin-bottom: 0.5rem;
}

.read-more {
  font-size: 0.875rem;
  color: var(--primary-color);
  font-weight: 500;
}

/* Back Button Styles */
.back-button {
  display: inline-flex;
  align-items: center;
  padding: 0.75rem 1.5rem;
  background-color: #f3f4f6;
  color: #f0f0f0;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.back-button:hover {
  background-color: #e5e7eb;
  color: #f0f0f0;
}

.back-arrow {
  margin-right: 0.5rem;
  font-size: 1.25rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .hero-image {
    height: 40vh;
  }

  .article-content {
    margin-top: -50px;
    padding: 1.5rem;
  }

  .article-header h1 {
    font-size: 2rem;
  }

  .article-description {
    font-size: 1.125rem;
  }

  .article-body {
    font-size: 1rem;
  }

  .related-posts-grid {
    grid-template-columns: 1fr;
  }
}
</style>
