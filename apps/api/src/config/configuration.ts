export default () => ({
  port: parseInt(process.env.PORT || "3001", 10),
  nodeEnv: process.env.NODE_ENV || "development",

  database: {
    url: process.env.DATABASE_URL,
    host: process.env.DATABASE_HOST || "localhost",
    port: parseInt(process.env.DATABASE_PORT || "3306", 10),
    name: process.env.DATABASE_NAME || "plataforma",
  },

  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379", 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },

  jwt: {
    secret: process.env.JWT_SECRET || "dev-secret-change-me",
    refreshSecret:
      process.env.JWT_REFRESH_SECRET || "dev-refresh-secret-change-me",
    expiration: process.env.JWT_EXPIRATION || "15m",
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || "7d",
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL,
  },

  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  },

  smtp: {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    from: process.env.MAIL_FROM || "noreply@plataforma.com",
  },

  storage: {
    provider: process.env.STORAGE_PROVIDER || "local",
    path: process.env.STORAGE_PATH || "./uploads",
    maxFileSize: parseInt(process.env.STORAGE_MAX_FILE_SIZE || "10485760", 10),
  },

  payphone: {
    appId: process.env.PAYPHONE_APP_ID,
    token: process.env.PAYPHONE_TOKEN,
  },

  vercel: {
    token: process.env.VERCEL_TOKEN,
    projectId:
      process.env.VERCEL_PROJECT_ID ||
      "prj_ksOJayvuXl3yBIJFCaV9IFK7i7Yh",
  },

  whatsapp: {
    apiUrl:
      process.env.WHATSAPP_API_URL ||
      "https://graph.facebook.com/v21.0",
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
  },

  rateLimit: {
    ttl: parseInt(process.env.RATE_LIMIT_TTL || "60", 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || "100", 10),
  },
});
