import Twilio from "twilio";
import { config } from "../config";

type TwilioErrorLike = {
  message?: string;
  status?: number;
  code?: number | string;
  moreInfo?: string;
};

function asTwilioError(err: unknown): TwilioErrorLike {
  if (!err || typeof err !== "object") return {};
  return err as TwilioErrorLike;
}

function wrapTwilioError(err: unknown): Error & { status?: number; code?: string } {
  const e = asTwilioError(err);
  const status = typeof e.status === "number" ? e.status : 502;
  const msg = e.message || "Twilio Verify request failed";
  const out = new Error(msg) as Error & { status?: number; code?: string };
  out.status = status;
  out.code = typeof e.code !== "undefined" ? `TWILIO_${String(e.code)}` : "TWILIO_ERROR";
  return out;
}

function getClient() {
  const { accountSid, authToken } = config.twilio;
  if (!accountSid || !authToken) {
    throw new Error("Twilio not configured: set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN");
  }
  return Twilio(accountSid, authToken);
}

function getVerifyServiceSid() {
  const { verifyServiceSid } = config.twilio;
  if (!verifyServiceSid) {
    throw new Error("Twilio Verify not configured: set TWILIO_VERIFY_SERVICE_SID");
  }
  return verifyServiceSid;
}

export async function twilioSendOtp(toE164: string) {
  try {
    const client = getClient();
    const serviceSid = getVerifyServiceSid();
    await client.verify.v2.services(serviceSid).verifications.create({
      to: toE164,
      channel: "sms",
    });
  } catch (err) {
    throw wrapTwilioError(err);
  }
}

export async function twilioVerifyOtp(toE164: string, code: string): Promise<boolean> {
  try {
    const client = getClient();
    const serviceSid = getVerifyServiceSid();
    const result = await client.verify.v2.services(serviceSid).verificationChecks.create({
      to: toE164,
      code,
    });
    return result.status === "approved";
  } catch (err) {
    throw wrapTwilioError(err);
  }
}

