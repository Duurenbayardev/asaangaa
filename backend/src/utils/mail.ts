import nodemailer from "nodemailer";
import { config } from "../config";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter !== null) return transporter;
  const { host, port, user, pass } = config.mail;
  if (!host || !user || !pass) return null;
  transporter = nodemailer.createTransport({
    host,
    port: port ?? 587,
    secure: port === 465,
    auth: { user, pass },
  });
  return transporter;
}

/** Send OTP email. If SMTP is not configured, logs the code and resolves (for development). */
export async function sendOtpEmail(to: string, code: string): Promise<void> {
  const trans = getTransporter();
  const from = config.mail.from;
  const subject = "Таны баталгаажуулах код - Asaangaa";
  const text = `Таны имэйл баталгаажуулах код: ${code}\n\nЭнэ кодыг хэнд ч хэлэхгүй байна.`;
  const html = `<p>Таны имэйл баталгаажуулах код: <strong>${code}</strong></p><p>Энэ кодыг хэнд ч хэлэхгүй байна.</p>`;

  if (!trans) {
    console.log("[Mail] OTP (no SMTP):", { to, code });
    return;
  }
  await trans.sendMail({ from, to, subject, text, html });
}

/** Send password reset code. If SMTP is not configured, logs the code (for development). */
export async function sendPasswordResetEmail(to: string, code: string): Promise<void> {
  const trans = getTransporter();
  const from = config.mail.from;
  const subject = "Нууц үг сэргээх код - Asaangaa";
  const text = `Таны нууц үг сэргээх код: ${code}\n\nЭнэ кодыг 15 минутын дотор ашиглана уу. Хэнд ч хэлэхгүй байна.`;
  const html = `<p>Таны нууц үг сэргээх код: <strong>${code}</strong></p><p>Энэ кодыг 15 минутын дотор ашиглана уу. Хэнд ч хэлэхгүй байна.</p>`;

  if (!trans) {
    console.log("[Mail] Password reset (no SMTP):", { to, code });
    return;
  }
  await trans.sendMail({ from, to, subject, text, html });
}
