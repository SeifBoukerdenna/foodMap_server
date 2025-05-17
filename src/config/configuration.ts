// src/config/configuration.ts

/**
 * Configuration factory function with defaults for development
 */
export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },
  // Optional configurations with sensible defaults
  database: {
    url:
      process.env.DATABASE_URL ||
      'postgresql://postgres:postgres@localhost:5432/foodmap',
    enabled: !!process.env.DATABASE_URL,
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    enabled: !!process.env.REDIS_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
  googleMaps: {
    apiKey: process.env.GOOGLE_MAPS_API_KEY || '',
    enabled: !!process.env.GOOGLE_MAPS_API_KEY,
  },
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    enabled: !!(
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_PRIVATE_KEY &&
      process.env.FIREBASE_CLIENT_EMAIL
    ),
  },
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
  },
  // Auth bypass flag
  auth: {
    disabled: process.env.DISABLE_AUTH === 'true',
  },
});
