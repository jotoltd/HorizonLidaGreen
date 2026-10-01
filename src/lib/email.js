import { Resend } from "resend";
import { canNotify } from "@/lib/preferences";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const from = process.env.FROM_EMAIL || "notifications@horizonlidagreen.com";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function trackingLink(trackingNumber) {
  return `${APP_URL}/track?ref=${encodeURIComponent(trackingNumber)}`;
}

export async function sendEmail({ to, subject, html, text }) {
  if (!resend) {
    console.warn("RESEND_API_KEY not configured; email not sent.", { to, subject });
    return { id: null, skipped: true };
  }
  try {
    const { data, error } = await resend.emails.send({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
    });
    if (error) throw error;
    return { id: data?.id, skipped: false };
  } catch (err) {
    console.error("Failed to send email:", err.message);
    return { id: null, skipped: false, error: err.message };
  }
}

export function baseTemplate({ title, body }) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #2c3e2d; background: #f7f8f3; margin: 0; padding: 0; }
      .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
      .header { background: #375737; padding: 32px; text-align: center; color: #fff; }
      .header h1 { margin: 0; font-size: 22px; font-weight: 600; }
      .content { padding: 32px; line-height: 1.6; }
      .footer { padding: 24px 32px; font-size: 12px; color: #8a9781; border-top: 1px solid #e1e7de; }
      .button { display: inline-block; padding: 12px 24px; background: #375737; color: #fff; text-decoration: none; border-radius: 8px; margin: 16px 0; }
      .muted { color: #71816f; }
      .field { margin: 8px 0; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header"><h1>Horizon Lida Green</h1></div>
      <div class="content">${body}</div>
      <div class="footer">© Horizon Lida Green Ltd · Vehicle logistics, made simple.</div>
    </div>
  </body>
</html>`;
}

export async function notifyNewClient({ client, password }) {
  if (!canNotify(client, "email", "booking")) return { skipped: true };
  const subject = "Welcome to the Horizon Lida Green delivery portal";
  const body = `<h2>Your account is ready</h2>
    <p>Welcome to the Horizon Lida Green delivery portal. You can sign in with the details below to track your vehicle deliveries and manage bookings.</p>
    <div class="field"><strong>Login email:</strong> ${client.email}</div>
    <div class="field"><strong>Password:</strong> ${password}</div>
    <p><a href="${APP_URL}/" class="button">Sign in</a></p>
    <p class="muted">If you did not request this account, please contact us.</p>`;
  return sendEmail({ to: client.email, subject, html: baseTemplate({ title: subject, body }), text: `Login email: ${client.email}\nPassword: ${password}\nSign in: ${APP_URL}/` });
}

export async function notifyBookingSubmitted({ shipment, client }) {
  if (!canNotify(client, "email", "booking")) return { skipped: true };
  const subject = `Booking request received · ${shipment.trackingNumber}`;
  const body = `<h2>Booking request received</h2>
    <p>Hi ${client.name || client.email},</p>
    <p>We have received your booking request. We will review and confirm it shortly.</p>
    <div class="field"><strong>Reference:</strong> ${shipment.trackingNumber}</div>
    <div class="field"><strong>Route:</strong> ${shipment.origin} → ${shipment.destination}</div>
    <div class="field"><strong>Vehicles:</strong> ${shipment.pieces || 1}</div>
    <p><a href="${trackingLink(shipment.trackingNumber)}" class="button">Track delivery</a></p>`;
  return sendEmail({ to: client.email, subject, html: baseTemplate({ title: subject, body }), text: `Booking ${shipment.trackingNumber} received. Track: ${trackingLink(shipment.trackingNumber)}` });
}

export async function notifyAdminNewBooking({ shipment, client }) {
  const subject = `New booking request · ${shipment.trackingNumber}`;
  const body = `<h2>New booking request</h2>
    <p>A new booking has been submitted by ${client.name || client.email} (${client.email}).</p>
    <div class="field"><strong>Reference:</strong> ${shipment.trackingNumber}</div>
    <div class="field"><strong>Route:</strong> ${shipment.origin} → ${shipment.destination}</div>
    <div class="field"><strong>Vehicles:</strong> ${shipment.pieces || 1}</div>
    <p><a href="${APP_URL}/admin/bookings" class="button">Review booking</a></p>`;
  return sendEmail({ to: process.env.ADMIN_EMAIL || "junyi.liang@horizonlidagreen.com", subject, html: baseTemplate({ title: subject, body }), text: `New booking ${shipment.trackingNumber} from ${client.email}. Review: ${APP_URL}/admin/bookings` });
}

export async function notifyBookingConfirmed({ shipment, client }) {
  if (!canNotify(client, "email", "booking")) return { skipped: true };
  const subject = `Booking confirmed · ${shipment.trackingNumber}`;
  const body = `<h2>Your booking is confirmed</h2>
    <p>Hi ${client.name || client.email},</p>
    <p>Your booking has been confirmed and is now being prepared for collection.</p>
    <div class="field"><strong>Reference:</strong> ${shipment.trackingNumber}</div>
    <div class="field"><strong>Route:</strong> ${shipment.origin} → ${shipment.destination}</div>
    <div class="field"><strong>Vehicles:</strong> ${shipment.pieces || 1}</div>
    <p><a href="${trackingLink(shipment.trackingNumber)}" class="button">Track delivery</a></p>`;
  return sendEmail({ to: client.email, subject, html: baseTemplate({ title: subject, body }), text: `Booking ${shipment.trackingNumber} confirmed. Track: ${trackingLink(shipment.trackingNumber)}` });
}

export async function notifyStatusUpdate({ shipment, client, previousStatus, event }) {
  if (!canNotify(client, "email", "status")) return { skipped: true };
  const statusLabel = (event?.description || shipment.status || "").replace(/_/g, " ");
  const subject = `Delivery update · ${shipment.trackingNumber}`;
  const body = `<h2>Delivery update</h2>
    <p>Hi ${client.name || client.email},</p>
    <p>There is an update on your delivery.</p>
    <div class="field"><strong>Reference:</strong> ${shipment.trackingNumber}</div>
    <div class="field"><strong>Route:</strong> ${shipment.origin} → ${shipment.destination}</div>
    <div class="field"><strong>Status:</strong> ${statusLabel}</div>
    ${event?.location ? `<div class="field"><strong>Location:</strong> ${event.location}</div>` : ""}
    <p><a href="${trackingLink(shipment.trackingNumber)}" class="button">Track delivery</a></p>`;
  return sendEmail({ to: client.email, subject, html: baseTemplate({ title: subject, body }), text: `Delivery ${shipment.trackingNumber} updated to ${statusLabel}. Track: ${trackingLink(shipment.trackingNumber)}` });
}

export async function notifyReceiptConfirmed({ shipment, receipt, adminEmail }) {
  const subject = `Receipt confirmed · ${shipment.trackingNumber}`;
  const status = receipt?.status === "DAMAGED" ? "with damage reported" : "without damage";
  const body = `<h2>Receipt confirmed ${status}</h2>
    <p>The client has confirmed receipt of the delivery for reference <strong>${shipment.trackingNumber}</strong>.</p>
    <div class="field"><strong>Route:</strong> ${shipment.origin} → ${shipment.destination}</div>
    ${receipt?.description ? `<div class="field"><strong>Description:</strong> ${receipt.description}</div>` : ""}
    <p><a href="${APP_URL}/admin" class="button">View delivery</a></p>`;
  return sendEmail({ to: adminEmail || process.env.ADMIN_EMAIL || "junyi.liang@horizonlidagreen.com", subject, html: baseTemplate({ title: subject, body }), text: `Receipt ${status} for ${shipment.trackingNumber}.` });
}

export async function notifyClaimStatus({ shipment, claim, client }) {
  if (!canNotify(client, "email", "claim")) return { skipped: true };
  const subject = `Insurance claim update · ${shipment.trackingNumber}`;
  const body = `<h2>Insurance claim update</h2>
    <p>Hi ${client.name || client.email},</p>
    <p>Your insurance claim for delivery <strong>${shipment.trackingNumber}</strong> has been updated.</p>
    <div class="field"><strong>Claim number:</strong> ${claim.claimNumber || "—"}</div>
    <div class="field"><strong>Insurer:</strong> ${claim.insurer || "—"}</div>
    <div class="field"><strong>Status:</strong> ${claim.status?.replace(/_/g, " ")}</div>
    <p><a href="${trackingLink(shipment.trackingNumber)}" class="button">View claim</a></p>`;
  return sendEmail({ to: client.email, subject, html: baseTemplate({ title: subject, body }), text: `Claim for ${shipment.trackingNumber} is now ${claim.status}.` });
}

export async function notifyClaimDocumentSubmitted({ shipment, documentLabel, client }) {
  const subject = `Claim document submitted · ${shipment.trackingNumber}`;
  const body = `<h2>Claim document submitted</h2>
    <p>${client.name || client.email} has submitted a document for the insurance claim on delivery <strong>${shipment.trackingNumber}</strong>.</p>
    <div class="field"><strong>Document:</strong> ${documentLabel}</div>
    <p><a href="${APP_URL}/admin" class="button">Review claim</a></p>`;
  return sendEmail({ to: process.env.ADMIN_EMAIL || "junyi.liang@horizonlidagreen.com", subject, html: baseTemplate({ title: subject, body }), text: `Claim document ${documentLabel} submitted for ${shipment.trackingNumber}.` });
}
