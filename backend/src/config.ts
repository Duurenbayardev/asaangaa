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

  mail: {
    from: process.env.MAIL_FROM ?? "noreply@asaangaa.local",
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    resendApiKey: process.env.RESEND_API_KEY ?? "",
  },

  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID ?? "",
    authToken: process.env.TWILIO_AUTH_TOKEN ?? "",
    verifyServiceSid: process.env.TWILIO_VERIFY_SERVICE_SID ?? "",
  },

  qpay: {
    baseUrl: (process.env.QPAY_BASE_URL ?? "https://merchant-sandbox.qpay.mn").trim(),
    clientId: (process.env.QPAY_CLIENT_ID ?? "").trim(),
    clientSecret: (process.env.QPAY_CLIENT_SECRET ?? "").trim(),
    invoiceCode: (process.env.QPAY_INVOICE_CODE ?? "").trim(),
    callbackBaseUrl: (process.env.QPAY_CALLBACK_BASE_URL ?? "").trim().replace(/\/$/, ""),
  },
};

if (config.jwt.secret.length < 32 && config.isProduction) {
  throw new Error("JWT_SECRET must be at least 32 characters in production");
}
