import dotenv from "dotenv";

dotenv.config();

const required = (key: string): string => {
  const v = process.env[key];
  if (v == null || v === "") {
    throw new Error(`Missing required env: ${key}`);
  }
  return v;
};

const optional = (key: string, fallback: string): string => {
  return process.env[key] ?? fallback;
};

export const config = {
  nodeEnv: optional("NODE_ENV", "development"),
  isProduction: process.env.NODE_ENV === "production",

  database: {
    url: required("DATABASE_URL"),
  },

  server: {
    port: parseInt(optional("PORT", "3000"), 10),
  },

  jwt: {
    secret: required("JWT_SECRET"),
    expiresIn: "7d",
  },

  cors: {
    origins: process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(",").map((s) => s.trim())
      : undefined,
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  },

  mail: {
    from: process.env.MAIL_FROM ?? "noreply@asaangaa.local",
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

if (config.jwt.secret.length < 32 && config.isProduction) {
  throw new Error("JWT_SECRET must be at least 32 characters in production");
}
