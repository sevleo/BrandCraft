<script setup lang="ts">
import HomeNavigation from "~/components/HomeNavigation.vue";
import FooterSection from "~/components/FooterSection.vue";
import { useAsyncData } from "nuxt/app";

useHead({
  title: "Blog - Social Media Management Tips & Strategies | BrandCraft",
  meta: [
    {
      name: "description",
      content:
        "Latest insights, tips, and strategies for social media management. Learn how to grow your brand and engage with your audience effectively.",
    },
    {
      name: "keywords",
      content:
        "social media management, content creation, digital marketing, brand growth",
    },
    {
      property: "og:title",
      content: "Blog - Social Media Management Tips & Strategies | BrandCraft",
    },
    {
      property: "og:description",
      content:
        "Latest insights, tips, and strategies for social media management. Learn how to grow your brand and engage with your audience effectively.",
    },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ],
});

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

// Pagination state
const currentPage = ref(0);
const itemsPerPage = 9;

// ✅ Fetch articles using server API proxy
const {
  data,
  pending: loading,
  error,
} = await useAsyncData<{ articles: IArticle[] }>("articles", () =>
  $fetch("/api/articles", {
    params: { page: currentPage.value, limit: itemsPerPage },
  })
);

// ✅ Format date utility
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};
</script>

<template>
  <HomeNavigation />
  <div class="min-h-screen bg-gray-50">
    <!-- Header Section -->
    <div class="py-16 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <h1
            class="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl"
          >
            Our Blog
          </h1>
          <p class="mt-5 max-w-xl mx-auto text-xl text-gray-500">
            Latest insights, tips, and strategies for social media management
          </p>
        </div>
      </div>
    </div>

    <!-- Articles Grid -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div v-if="loading" class="flex justify-center items-center py-12">
        <div
          class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"
        ></div>
      </div>
      <div
        v-else-if="data && data.articles && data.articles.length"
        class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3"
      >
        <NuxtLink
          v-for="article in data.articles"
          :key="article.id"
          :to="`/blog/${article.slug}`"
          class="article-card no-underline"
        >
          <article
            class="flex flex-col overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300"
          >
            <div class="flex-shrink-0">
              <img
                :src="article.image"
                :alt="article.headline"
                class="h-48 w-full object-cover"
              />
            </div>
            <div class="flex-1 flex-col justify-between bg-white p-6">
              <div class="flex-1">
                <p class="text-sm font-medium text-primary-600">
                  {{ article.category.title }}
                </p>
                <div class="mt-2 block">
                  <p class="text-xl font-semibold text-gray-900">
                    {{ article.headline }}
                  </p>
                  <p class="mt-3 text-base text-gray-500">
                    {{ article.metaDescription }}
                  </p>
                  <div class="mt-5 flex flex-wrap gap-2">
                    <span
                      v-for="tag in article.tags"
                      :key="tag.id"
                      class="hashtag"
                      >#{{ tag.title }}</span
                    >
                  </div>
                </div>
              </div>
              <div class="mt-6 flex items-center">
                <div class="flex space-x-1 text-sm text-gray-500">
                  <time :datetime="article.createdAt">{{
                    formatDate(article.createdAt)
                  }}</time>
                  <span aria-hidden="true">&middot;</span>
                  <span>{{ article.readingTime }} min read</span>
                </div>
              </div>
            </div>
          </article>
        </NuxtLink>
      </div>
      <div v-else class="text-center text-gray-500">No articles found.</div>
    </div>
  </div>
  <FooterSection />
</template>

<style scoped>
.article-card {
  text-decoration: none;
  color: inherit;
  display: block;
}

.article-card:hover article {
  transform: translateY(-4px);
}

.article-card article {
  transition: all 0.3s ease;
}

.loading-spinner {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3rem 0;
}

.spinner {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  border: 2px solid transparent;
  border-bottom-color: var(--primary-color);
  animation: spin 1s linear infinite;
}

.hashtag {
  background: var(--primary-color-light);
  color: var(--primary-color);
  padding: 0.2rem 0.5rem;
  border-radius: 9999px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

<style>
:root {
  --primary-color: #2563eb;
  --primary-color-light: #dbeafe;
  --primary-color-dark: #1e40af;
}
</style>
