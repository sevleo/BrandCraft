import { createRouter, createWebHistory } from "vue-router";
import BlogArticle from "@/pages/blog/[slug].vue";

const routes = [
  {
    path: "/blog/test",
    name: "test",
    component: BlogArticle,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
