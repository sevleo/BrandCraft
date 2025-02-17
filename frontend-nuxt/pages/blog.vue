<script setup>
import HomeNavigation from "~/components/HomeNavigation.vue";
import FooterSection from "~/components/FooterSection.vue";

const articles = ref([
  {
    id: 1,
    title: "Maximizing Your Social Media Presence",
    excerpt:
      "Learn the essential strategies to boost your brand's visibility across social media platforms.",
    date: "2025-02-17",
    category: "Social Media Strategy",
    image:
      "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 2,
    title: "Content Creation Best Practices",
    excerpt:
      "Discover how to create engaging content that resonates with your target audience.",
    date: "2025-02-15",
    category: "Content Creation",
    image:
      "https://images.unsplash.com/photo-1542744094-3a31f272c490?ixlib=rb-4.0.3",
  },
  {
    id: 3,
    title: "Analytics and Performance Tracking",
    excerpt:
      "Master the art of measuring and optimizing your social media performance.",
    date: "2025-02-13",
    category: "Analytics",
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3",
  },
]);

const formatDate = (dateString) => {
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
            class="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl"
          >
            Our Blog
          </h1>
          <p class="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            Insights, updates, and stories from the BrandCraft team
          </p>
        </div>
      </div>
    </div>

    <!-- Blog Grid -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <!-- Blog cards will be dynamically rendered here -->
        <div
          v-for="article in articles"
          :key="article.id"
          class="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:transform hover:scale-105"
        >
          <div class="h-48 w-full overflow-hidden">
            <img
              :src="article.image"
              :alt="article.title"
              class="w-full h-full object-cover"
            />
          </div>
          <div class="p-6">
            <div class="flex items-center mb-4">
              <span class="text-sm text-gray-500">{{
                formatDate(article.date)
              }}</span>
              <span class="mx-2 text-gray-300">•</span>
              <span class="text-sm text-indigo-600">{{
                article.category
              }}</span>
            </div>
            <h2 class="text-xl font-semibold text-gray-900 mb-2">
              {{ article.title }}
            </h2>
            <p class="text-gray-600 mb-4 line-clamp-3">{{ article.excerpt }}</p>
            <a
              href="#"
              class="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Read more →
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
  <FooterSection />
</template>
