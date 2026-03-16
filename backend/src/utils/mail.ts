import dns from "dns";
import nodemailer from "nodemailer";
import { config } from "../config";

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
  transporterPromise = Promise.resolve(
    nodemailer.createTransport({
      host: resolvedHost,
      port: port ?? 587,
      secure: port === 465,
      auth: { user, pass },
      tls: { servername: host },
    })
  );
  return transporterPromise;
}

/** Send OTP email. If SMTP is not configured, logs the code and resolves (for development). */
export async function sendOtpEmail(to: string, code: string): Promise<void> {
  const trans = await getTransporter();
  const from = config.mail.from;
  const subject = "Таны баталгаажуулах код - Asaangaa";
  const text = `Таны имэйл баталгаажуулах код: ${code}\n\nЭнэ кодыг хэнд ч хэлэхгүй байна.`;
  const html = `<p>Таны имэйл баталгаажуулах код: <strong>${code}</strong></p><p>Энэ кодыг хэнд ч хэлэхгүй байна.</p>`;

  if (!trans) {
    console.log("[Mail] OTP (no SMTP):", { to, code });
    return;
  }
  try {
    await trans.sendMail({ from, to, subject, text, html });
  } catch (err) {
    console.error("[Mail] sendOtpEmail failed:", err);
    throw new Error("Failed to send verification email. Check SMTP settings or try again later.");
  }
}

/** Send password reset code. If SMTP is not configured, logs the code (for development). */
export async function sendPasswordResetEmail(to: string, code: string): Promise<void> {
  const trans = await getTransporter();
  const from = config.mail.from;
  const subject = "Нууц үг сэргээх код - Asaangaa";
  const text = `Таны нууц үг сэргээх код: ${code}\n\nЭнэ кодыг 15 минутын дотор ашиглана уу. Хэнд ч хэлэхгүй байна.`;
  const html = `<p>Таны нууц үг сэргээх код: <strong>${code}</strong></p><p>Энэ кодыг 15 минутын дотор ашиглана уу. Хэнд ч хэлэхгүй байна.</p>`;

  if (!trans) {
    console.log("[Mail] Password reset (no SMTP):", { to, code });
    return;
  }
  try {
    await trans.sendMail({ from, to, subject, text, html });
  } catch (err) {
    console.error("[Mail] sendPasswordResetEmail failed:", err);
    throw new Error("Failed to send password reset email. Check SMTP settings or try again later.");
  }
}
