# Use the official Python 3.9 image as the base image
FROM python:3.9-bullseye

USER root

# Set the working directory inside the container
WORKDIR /usr/src/app

# Install Node.js, npm, and necessary build tools
RUN apt-get update && \
    apt-get install -y curl gnupg build-essential git ffmpeg && \
    curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - && \
    apt-get install -y nodejs npm && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create and activate a virtual environment
RUN python -m venv /venv
ENV PATH="/venv/bin:$PATH"

# Upgrade pip and install PyTorch
RUN pip install --upgrade pip && \
    pip install torch torchvision torchaudio --extra-index-url https://download.pytorch.org/whl/cpu


# Install yt-dlp for YouTube downloads
RUN pip install yt-dlp

# Add a non-root user for running the application
RUN useradd -ms /bin/sh node

# Set environment to production
ENV NODE_ENV=production

# Copy package.json and package-lock.json files, if they exist
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]

RUN node -v && npm -v


# Install Node.js dependencies
RUN npm install --production --silent && mv node_modules ../

# Copy the rest of the application source code
COPY . .

# Change the ownership of the directory to the node user
RUN chown -R node /usr/src/app

# Switch to the node user to avoid running the container as root
USER node

# Expose the application port
EXPOSE 3000

# Start the application (based on your folder structure)

# CMD ["node", "src/app.js"]
CMD ["node", "--no-warnings", "src/app.js"]
