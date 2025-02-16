# syntax = docker/dockerfile:1

ARG NODE_VERSION=23.1.0
FROM node:${NODE_VERSION}-slim as base

WORKDIR /app

# Set production environment
ENV NODE_ENV="production"
ENV NUXT_HOST="0.0.0.0"
ENV NUXT_PORT="3001"

ARG NUXT_PUBLIC_FRONTEND_URL
ARG NUXT_PUBLIC_BACKEND_URL
ARG NUXT_PUBLIC_FRONTEND_DASHBOARD_URL

ENV NUXT_PUBLIC_FRONTEND_URL=$NUXT_PUBLIC_FRONTEND_URL
ENV NUXT_PUBLIC_BACKEND_URL=$NUXT_PUBLIC_BACKEND_URL
ENV NUXT_PUBLIC_FRONTEND_DASHBOARD_URL=$NUXT_PUBLIC_FRONTEND_DASHBOARD_URL

# ✅ Copy package.json and package-lock.json first
COPY package.json package-lock.json ./

# ✅ Install dependencies before copying all files
RUN npm ci --omit=dev

# ✅ Copy the rest of the Nuxt app files
COPY . .

# ✅ Build Nuxt for production (SSR)
RUN npm run build

# ✅ Remove unnecessary files to reduce size
RUN npm prune --omit=dev

# ---- Run Stage ----
FROM node:${NODE_VERSION}-slim as runner

WORKDIR /app

# ✅ Copy built Nuxt application (Fix: use `.output/` folder)
COPY --from=base /app/.output /app

# ✅ Force Nuxt to listen on the correct port
ENV HOST=0.0.0.0
ENV PORT=3001
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=3001

# ✅ Expose Nuxt SSR port
EXPOSE 3001

# ✅ Run Nuxt in production mode (Fix: Use the correct start command)
CMD ["node", "server/index.mjs"]
