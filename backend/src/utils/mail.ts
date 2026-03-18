import nodemailer from "nodemailer";
import { Resend } from "resend";
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
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 20_000,
  });
  return transporter;
}

const SUBJECT = "Имэйл баталгаажуулах код - Asaangaa";
const textBody = (code: string) =>
  `Таны бүртгэл баталгаажуулах код: ${code}\n\n Энэ кодыг 15 минутын дотор оруулна уу. `;
const htmlBody = (code: string) =>
  `<p>Таны бүртгэл баталгаажуулах код: <strong>${code}</strong></p><p>Энэ кодыг 15 минутын дотор оруулна уу.</p>`;

type SendEmailInput = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
};

async function sendEmail({ to, subject, text, html }: SendEmailInput): Promise<void> {
  const from = config.mail.from;

  if (config.mail.resendApiKey) {
    const resend = new Resend(config.mail.resendApiKey);
    const fromAddress =
      from.endsWith(".local") || from === "noreply@asaangaa.local"
        ? "Asaangaa <onboarding@resend.dev>"
        : (from.includes("<") ? from : `Asaangaa <${from}>`);
    // Resend SDK types can be overly strict across versions (some require `react`),
    // but the API accepts html/text payloads. Cast to avoid TS mismatch.
    const { error } = await resend.emails.send({
      from: fromAddress,
      to: [to],
      subject,
      html: html ?? (text ? `<pre>${escapeHtml(text)}</pre>` : undefined),
      text,
    } as unknown as Parameters<typeof resend.emails.send>[0]);
    if (error) {
      console.error("[Mail] Resend failed:", error);
      throw error;
    }
    return;
  }

  const trans = getTransporter();
  if (!trans) {
    console.log("[Mail] Email (no SMTP/Resend):", { to, subject, text });
    return;
  }
  await trans.sendMail({ from, to, subject, text, html });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Send email verification code. Uses Resend API if RESEND_API_KEY is set (works on Render); else SMTP; else logs (dev). */
export async function sendVerificationCodeEmail(to: string, code: string): Promise<void> {
  await sendEmail({
    to,
    subject: SUBJECT,
    text: textBody(code),
    html: htmlBody(code),
  });
}

export type AdminOrderEmailData = {
  id: string;
  status: string;
  grandTotal: number;
  createdAtIso: string;
  items: Array<{ name: string; qty: number }>;
  phone?: string;
  city?: string;
};

export async function sendAdminNewOrderEmail(to: string, data: AdminOrderEmailData): Promise<void> {
  const shortId = data.id.slice(-8).toUpperCase();
  const subject = `Шинэ захиалга #${shortId} (${data.status})`;
  const lines = data.items.map((i) => `- ${i.name} × ${i.qty}`).join("\n");
  const text =
    `Шинэ захиалга ирлээ.\n\n` +
    `Дугаар: #${shortId}\n` +
    `Төлөв: ${data.status}\n` +
    `Нийт: ${data.grandTotal}\n` +
    (data.phone ? `Утас: ${data.phone}\n` : "") +
    (data.city ? `Хот/Аймаг: ${data.city}\n` : "") +
    `Огноо: ${data.createdAtIso}\n\n` +
    `Бараа:\n${lines}\n`;

  const html =
    `<h3>Шинэ захиалга ирлээ</h3>` +
    `<p><strong>Дугаар:</strong> #${shortId}</p>` +
    `<p><strong>Төлөв:</strong> ${escapeHtml(data.status)}</p>` +
    `<p><strong>Нийт:</strong> ${data.grandTotal}</p>` +
    (data.phone ? `<p><strong>Утас:</strong> ${escapeHtml(data.phone)}</p>` : "") +
    (data.city ? `<p><strong>Хот/Аймаг:</strong> ${escapeHtml(data.city)}</p>` : "") +
    `<p><strong>Огноо:</strong> ${escapeHtml(data.createdAtIso)}</p>` +
    `<p><strong>Бараа:</strong></p>` +
    `<ul>${data.items.map((i) => `<li>${escapeHtml(i.name)} × ${i.qty}</li>`).join("")}</ul>`;

  await sendEmail({ to, subject, text, html });
}

export async function sendPasswordResetCodeEmail(to: string, code: string): Promise<void> {
  const subject = "Нууц үг сэргээх код - Asaangaa";
  const text =
    `Нууц үг сэргээх код: ${code}\n\n` +
    `Энэ кодыг 15 минутын дотор ашиглана уу. Хэрэв та хүсээгүй бол энэ имэйлийг үл тооно уу.`;
  const html =
    `<p>Нууц үг сэргээх код: <strong>${escapeHtml(code)}</strong></p>` +
    `<p>Энэ кодыг 15 минутын дотор ашиглана уу. Хэрэв та хүсээгүй бол энэ имэйлийг үл тооно уу.</p>`;
  await sendEmail({ to, subject, text, html });
}
