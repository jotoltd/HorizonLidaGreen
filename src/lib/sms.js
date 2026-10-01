import twilio from "twilio";
import { canNotify } from "@/lib/preferences";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const from = process.env.TWILIO_PHONE_NUMBER;
const defaultCountryCode = process.env.TWILIO_DEFAULT_COUNTRY_CODE || "";

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export function normalizePhone(raw) {
  if (!raw) return null;
  const digits = raw.toString().replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("0") && defaultCountryCode) {
    return `+${defaultCountryCode}${digits.slice(1)}`;
  }
  if (!digits.startsWith("0") && defaultCountryCode) {
    return `+${defaultCountryCode}${digits}`;
  }
  return null;
}

export async function sendSms({ to, body }) {
  const phone = normalizePhone(to);
  if (!phone) {
    return { sid: null, skipped: true, reason: "No valid phone number." };
  }
  if (!client || !from) {
    console.warn("Twilio not configured; SMS not sent.", { to: phone });
    return { sid: null, skipped: true, reason: "Twilio not configured." };
  }
  try {
    const message = await client.messages.create({
      from,
      to: phone,
      body,
    });
    return { sid: message.sid, skipped: false };
  } catch (err) {
    console.error("Failed to send SMS:", err.message);
    return { sid: null, skipped: false, error: err.message };
  }
}

function trackingLink(trackingNumber) {
  return `${APP_URL}/track?ref=${encodeURIComponent(trackingNumber)}`;
}

export async function smsNotifyBookingSubmitted({ shipment, client }) {
  if (!canNotify(client, "sms", "booking")) return { skipped: true };
  if (!client.phone) return { skipped: true, reason: "No phone number." };
  const body = `Horizon Lida Green: Your booking ${shipment.trackingNumber} (${shipment.origin} → ${shipment.destination}) has been received. Track: ${trackingLink(shipment.trackingNumber)}`;
  return sendSms({ to: client.phone, body });
}

export async function smsNotifyBookingConfirmed({ shipment, client }) {
  if (!canNotify(client, "sms", "booking")) return { skipped: true };
  if (!client.phone) return { skipped: true, reason: "No phone number." };
  const body = `Horizon Lida Green: Your booking ${shipment.trackingNumber} is confirmed. Track: ${trackingLink(shipment.trackingNumber)}`;
  return sendSms({ to: client.phone, body });
}

export async function smsNotifyStatusUpdate({ shipment, client, event }) {
  if (!canNotify(client, "sms", "status")) return { skipped: true };
  if (!client.phone) return { skipped: true, reason: "No phone number." };
  const statusLabel = (event?.description || shipment.status || "").replace(/_/g, " ");
  const body = `Horizon Lida Green: Update on ${shipment.trackingNumber} — ${statusLabel}. Track: ${trackingLink(shipment.trackingNumber)}`;
  return sendSms({ to: client.phone, body });
}

export async function smsNotifyReceiptConfirmed({ shipment, receipt, adminPhone }) {
  const phone = adminPhone || process.env.ADMIN_NOTIFICATION_PHONE;
  if (!phone) return { skipped: true, reason: "No admin phone number." };
  const status = receipt?.status === "DAMAGED" ? "with damage" : "no damage";
  const body = `Horizon Lida Green: Receipt confirmed ${status} for ${shipment.trackingNumber} (${shipment.origin} → ${shipment.destination}).`;
  return sendSms({ to: phone, body });
}

export async function smsNotifyClaimStatus({ shipment, claim, client }) {
  if (!canNotify(client, "sms", "claim")) return { skipped: true };
  if (!client.phone) return { skipped: true, reason: "No phone number." };
  const body = `Horizon Lida Green: Your claim for ${shipment.trackingNumber} is now ${claim.status?.replace(/_/g, " ")}.`;
  return sendSms({ to: client.phone, body });
}

export async function smsNotifyClaimDocumentSubmitted({ shipment, documentLabel, adminPhone }) {
  const phone = adminPhone || process.env.ADMIN_NOTIFICATION_PHONE;
  if (!phone) return { skipped: true, reason: "No admin phone number." };
  const body = `Horizon Lida Green: Claim document submitted for ${shipment.trackingNumber}: ${documentLabel}`;
  return sendSms({ to: phone, body });
}
