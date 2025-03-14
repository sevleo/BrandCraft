<p align="center">
  <img src="perfect_logo_full.svg" alt="BrandCraft Logo" width="400"/>
</p>

<p align="center">
  <strong>The Ultimate Social Media Management Tool for Content Creators</strong>
</p>

## About

BrandCraft is an all-in-one social media management platform designed specifically for content creators. It simplifies the process of managing and scheduling content across multiple social media platforms, helping creators maintain a consistent online presence without the hassle.

## Features

- **Multi-Platform Support**: Schedule and manage content for Instagram, TikTok, YouTube, Facebook, Threads, Bluesky, X (Twitter), and Mastodon
- **Cross-Platform Posting**: Create once, share everywhere with platform-specific optimizations
- **Advanced Scheduling**: Plan your content calendar weeks or months in advance
- **Analytics Dashboard**: Track your performance and engagement across all platforms
- **Multi-Account Management**: Handle multiple social media accounts from a single dashboard
- **Content Customization**: Tailor your content for each platform while maintaining brand consistency

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Docker
- MongoDB
- Vue
- Nuxt
- Amazon S3

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/brandcraft.git
cd brandcraft
```

2. Install dependencies

```
npm install
```

3. Set up environment variables
- Copy the example environment file:
```
cp .env.example .env
```
- Open .env and configure the necessary values (database URL, API keys, AWS credentials, etc.).

4. Run the application using Docker (Recommended)
- Ensure Docker is running, then execute:

```
docker-compose up --build
```
- This will start all required services, including the database and backend.
- The .app application should be available at http://localhost:5173
- The Nuxt landing page should be available at http://localhost:3001
- The Backend should be available at http://localhost:3000
- The Scheduler Service should be available at http://localhost:4000

  
## Deployment
For production deployment, ensure you configure:

- Database URL (MongoDB Atlas or self-hosted)
- S3 bucket for media storage
- Environment variables (.env.production)

For cloud deployment, consider:

- Fly.io for frontend
- Render.com for backend
- MongoDB Atlas for database
- S3 for media storage




## Contributing

We welcome contributions! Please read our [Contributing Guidelines](CONTRIBUTING.md) for details on how to submit pull requests.

## License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

#### Important Notes:

- Any modifications or derivative works **must also be open-source** under the same license.
- If you use this project or modify it, **you must provide attribution** by linking to the original source: [BrandCraft](https://github.com/sevleo/BrandCraft).
- If you deploy this project as a web service, **you must provide access to the modified source code**.

For more details, see the **[`LICENSE`](./LICENSE)** file in this repository.

## Support

Need help? Email us at sev@brandcraft.art or [request a feature here](https://insigh.to/b/brandcraftart).

---

<p align="center">Made with ❤️ for Content Creators</p>
