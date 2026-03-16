import dns from "dns";
import nodemailer from "nodemailer";
import { Resend } from "resend";
import { config } from "../config";

const CONNECTION_TIMEOUT_MS = 15000;

let transporterPromise: Promise<nodemailer.Transporter | null> | null = null;

/** Get SMTP transporter, resolving host to IPv4 to avoid ENETUNREACH on hosts without IPv6 (e.g. Render). */
async function getTransporter(): Promise<nodemailer.Transporter | null> {
  if (transporterPromise !== null) return transporterPromise;
  const { host, port, user, pass } = config.mail;
  if (!host || !user || !pass) return null;
  let resolvedHost = host;
  try {
    const result = await dns.promises.lookup(host, { family: 4 });
    resolvedHost = result.address;
  } catch {
    // keep original host if DNS lookup fails
  }
  const portNum = port ?? 587;
  transporterPromise = Promise.resolve(
    nodemailer.createTransport({
      host: resolvedHost,
      port: portNum,
      secure: port === 465,
      auth: { user, pass },
      tls: { servername: host },
      connectionTimeout: CONNECTION_TIMEOUT_MS,
      greetingTimeout: CONNECTION_TIMEOUT_MS,
    })
  );
  return transporterPromise;
}

async function sendViaResend(to: string, subject: string, html: string, text: string): Promise<void> {
  const apiKey = config.mail.resendApiKey;
  if (!apiKey) throw new Error("RESEND_API_KEY not set");
  const resend = new Resend(apiKey);
  const from = config.mail.from;
  const { error } = await resend.emails.send({ from, to, subject, html, text });
  if (error) throw new Error(error.message);
}

/** Send OTP email. Uses Resend if RESEND_API_KEY is set (recommended on Render); otherwise SMTP. If neither works, logs code (dev). */
export async function sendOtpEmail(to: string, code: string): Promise<void> {
  const subject = "Таны баталгаажуулах код - Asaangaa";
  const text = `Таны имэйл баталгаажуулах код: ${code}\n\nЭнэ кодыг хэнд ч хэлэхгүй байна.`;
  const html = `<p>Таны имэйл баталгаажуулах код: <strong>${code}</strong></p><p>Энэ кодыг хэнд ч хэлэхгүй байна.</p>`;

  if (config.mail.resendApiKey) {
    try {
      await sendViaResend(to, subject, html, text);
      return;
    } catch (err) {
      console.error("[Mail] Resend sendOtpEmail failed:", err);
      throw new Error("Failed to send verification email. Check Resend API key or try again later.");
    }
  }

  const trans = await getTransporter();
  if (!trans) {
    console.log("[Mail] OTP (no SMTP):", { to, code });
    return;
  }
  const from = config.mail.from;
  try {
    await trans.sendMail({ from, to, subject, text, html });
  } catch (err) {
    console.error("[Mail] sendOtpEmail failed:", err);
    throw new Error("Failed to send verification email. Check SMTP settings or try again later.");
  }
}

/** Send password reset code. Uses Resend if RESEND_API_KEY is set; otherwise SMTP. */
export async function sendPasswordResetEmail(to: string, code: string): Promise<void> {
  const subject = "Нууц үг сэргээх код - Asaangaa";
  const text = `Таны нууц үг сэргээх код: ${code}\n\nЭнэ кодыг 15 минутын дотор ашиглана уу. Хэнд ч хэлэхгүй байна.`;
  const html = `<p>Таны нууц үг сэргээх код: <strong>${code}</strong></p><p>Энэ кодыг 15 минутын дотор ашиглана уу. Хэнд ч хэлэхгүй байна.</p>`;

  if (config.mail.resendApiKey) {
    try {
      await sendViaResend(to, subject, html, text);
      return;
    } catch (err) {
      console.error("[Mail] Resend sendPasswordResetEmail failed:", err);
      throw new Error("Failed to send password reset email. Check Resend API key or try again later.");
    }
  }

  const trans = await getTransporter();
  if (!trans) {
    console.log("[Mail] Password reset (no SMTP):", { to, code });
    return;
  }
  const from = config.mail.from;
  try {
    await trans.sendMail({ from, to, subject, text, html });
  } catch (err) {
    console.error("[Mail] sendPasswordResetEmail failed:", err);
    throw new Error("Failed to send password reset email. Check SMTP settings or try again later.");
  }
}
