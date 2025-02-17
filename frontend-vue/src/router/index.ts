import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from 'vue-router';
import authData from '../utils/authDataStore';
import { verifyAuth } from '../api/authApi';

import BaseView from '../components/views/BaseView.vue';
import WaitlistView from '../components/views/WaitlistView.vue';
import LoginView from '../components/views/LoginView.vue';
import SignupView from '../components/views/SignupView.vue';
import AdminView from '../components/views/AdminView.vue';
import UserDetailsView from '../components/views/UserDetailsView.vue';

// Dashboard views
import DashboardView from '../components/views/DashboardView.vue';
import BrandsView from '../components/views/DashboardViews/BrandsView.vue';
import CreateView from '../components/views/DashboardViews/CreateView.vue';
import EngageView from '../components/views/DashboardViews/EngageView.vue';
import PublishView from '../components/views/DashboardViews/PublishView.vue';
import SettingsView from '../components/views/DashboardViews/SettingsView.vue';

// Define Nuxt frontend URL
const NUXT_APP_URL = import.meta.env.VITE_FRONTEND_NUXT_URL;

// Define routes
const routes: RouteRecordRaw[] = [
  // Public routes (no component needed, but valid RouteRecordRaw structure)
  {
    path: '/',
    component: BaseView,
    name: 'Base',
    meta: { requiresAuth: false },
  },
  {
    path: '/waitlist',
    component: WaitlistView,
    name: 'Waitlist',
    meta: { requiresAuth: false },
  },
  {
    path: '/login',
    component: LoginView,
    name: 'Login',
    meta: { requiresAuth: false },
  },
  {
    path: '/signup',
    component: SignupView,
    name: 'Signup',
    meta: { requiresAuth: false },
  },

  // Protected routes
  {
    path: '/dashboard',
    component: DashboardView,
    name: 'Dashboard',
    meta: { requiresAuth: true, enforceSubdomain: 'app.brandcraft.art' },
  },
  {
    path: '/dashboard/brands',
    component: BrandsView,
    name: 'Brands',
    meta: { requiresAuth: true, enforceSubdomain: 'app.brandcraft.art' },
  },
  {
    path: '/dashboard/create',
    component: CreateView,
    name: 'Create',
    meta: { requiresAuth: true },
  },
  {
    path: '/dashboard/engage',
    component: EngageView,
    name: 'Engage',
    meta: { requiresAuth: true },
  },
  {
    path: '/dashboard/publish',
    component: PublishView,
    name: 'Publish',
    meta: { requiresAuth: true },
  },
  {
    path: '/dashboard/settings',
    component: SettingsView,
    name: 'Settings',
    meta: { requiresAuth: true },
  },

  // Admin routes
  {
    path: '/admin',
    component: AdminView,
    name: 'Admin',
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/admin/users/:userId',
    component: UserDetailsView,
    name: 'UserDetails',
    meta: { requiresAuth: true, requiresAdmin: true },
  },
];

// Create router
const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Global navigation guard to handle external redirects
router.beforeEach(async (to, _, next) => {
  // Redirect to Nuxt for specific routes
  if (['/home', '/privacy', '/terms'].includes(to.path)) {
    window.location.href = `${NUXT_APP_URL}${to.path === '/home' ? '' : to.path}`;
    return;
  }

  // Ensure authentication state is loaded
  if (!authData.loaded.value) {
    await verifyAuth();
  }

  // Enforce authentication
  if (to.meta.requiresAuth && !authData.signedIn.value) {
    next('/login');
  } else {
    next();
  }
});

export default router;
