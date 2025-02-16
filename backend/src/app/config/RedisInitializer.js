const redis = require("redis");
const { RedisStore } = require("connect-redis");

// Initialize Redis client
const redisClient = redis.createClient({
  url: process.env.REDIS_URL,
  legacyMode: false, // Changed to false for newer Redis client
});

// Connect to Redis
(async () => {
  await redisClient.connect().catch(console.error);
})();

// Create Redis store instance
const redisStore = new RedisStore({
  client: redisClient,
  prefix: "brandcraft:",
});

module.exports = {
  redisStore,
  redisClient,
};
