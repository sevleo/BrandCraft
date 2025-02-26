# Use Node.js 18 LTS as the base image
FROM node:18-bullseye

# Set the working directory inside the container
WORKDIR /usr/src/app

# Install system dependencies (curl, git, ffmpeg)
RUN apt-get update || apt-get update --fix-missing && \
    apt-get install -y --no-install-recommends curl git ffmpeg && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set environment to production
ENV NODE_ENV=production

# Copy package.json and package-lock.json files
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]

# Install Node.js dependencies
RUN npm install --production --silent

# Copy the rest of the application source code
COPY . .

# Change ownership to the existing 'node' user
RUN chown -R node /usr/src/app

# Switch to the node user to avoid running the container as root
USER node

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["node", "--no-warnings", "src/app.js"]
