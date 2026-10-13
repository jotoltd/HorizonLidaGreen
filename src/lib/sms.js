import { canNotify } from "@/lib/preferences";

const apiKey = process.env.PURESMS_API_KEY;
const sender = process.env.PURESMS_SENDER || "HLG_Ltd";
const defaultCountryCode = process.env.PURESMS_DEFAULT_COUNTRY_CODE || "44";

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
  if (!apiKey) {
    console.warn("PURESMS_API_KEY not configured; SMS not sent.", { to: phone });
    return { sid: null, skipped: true, reason: "PureSMS not configured." };
  }
  try {
    const res = await fetch("https://connect-api.divergent.cloud/sms/send", {
      method: "POST",
      headers: {
        "X-Api-Key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ sender, recipient: phone, content: body }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || data.error || `PureSMS error ${res.status}`);
    return { sid: data.id || null, skipped: false };
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
