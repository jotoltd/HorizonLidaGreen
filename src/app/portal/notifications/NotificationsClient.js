"use client";

import { useEffect, useState } from "react";

const CHANNELS = [
  { key: "email", label: "Email" },
  { key: "sms", label: "SMS" },
];

const EVENTS = [
  { key: "booking", label: "Booking confirmations & requests" },
  { key: "status", label: "Delivery status updates" },
  { key: "receipt", label: "Receipt confirmations" },
  { key: "claim", label: "Insurance claim updates" },
  { key: "documents", label: "Document uploads" },
];

export default function NotificationsClient() {
  const [prefs, setPrefs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/notifications/preferences")
      .then((r) => r.json())
      .then((data) => {
        setPrefs(data.preferences);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const toggle = (channel, event) => {
    setPrefs((prev) => ({
      ...prev,
      [channel]: { ...prev[channel], [event]: !prev[channel][event] },
    }));
    setMessage("");
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: prefs }),
      });
      const data = await res.json();
      if (res.ok) {
        setPrefs(data.preferences);
        setMessage("Preferences saved.");
      } else {
        setMessage(data.error || "Failed to save preferences.");
      }
    } catch {
      setMessage("Failed to save preferences.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="muted">Loading preferences…</p>;
  if (!prefs) return <p className="muted">Unable to load preferences.</p>;

  return (
    <div className="card">
      <h2 className="card-title">Notification channels</h2>
      <p className="muted">Toggle any channel and event type below. Changes take effect immediately.</p>

      {CHANNELS.map((channel) => (
        <div key={channel.key} className="notification-channel">
          <h3>{channel.label}</h3>
          <div className="notification-options">
            {EVENTS.map((event) => (
              <label key={event.key} className="notification-option">
                <input
                  type="checkbox"
                  checked={prefs[channel.key]?.[event.key] !== false}
                  onChange={() => toggle(channel.key, event.key)}
                />
                <span>{event.label}</span>
              </label>
            ))}
          </div>
        </div>
      ))}

      {message && <p className="form-message">{message}</p>}

      <button className="btn-pill btn-pill-primary" onClick={save} disabled={saving}>
        {saving ? "Saving…" : "Save preferences"}
      </button>
    </div>
  );
}
