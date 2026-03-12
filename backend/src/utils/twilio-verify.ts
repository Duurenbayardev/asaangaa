import Twilio from "twilio";
import { config } from "../config";

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
  const client = getClient();
  const serviceSid = getVerifyServiceSid();
  await client.verify.v2.services(serviceSid).verifications.create({
    to: toE164,
    channel: "sms",
  });
}

export async function twilioVerifyOtp(toE164: string, code: string): Promise<boolean> {
  const client = getClient();
  const serviceSid = getVerifyServiceSid();
  const result = await client.verify.v2.services(serviceSid).verificationChecks.create({
    to: toE164,
    code,
  });
  return result.status === "approved";
}

