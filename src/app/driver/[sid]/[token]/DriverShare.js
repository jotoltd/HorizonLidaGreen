"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const MIN_INTERVAL_MS = 15000;

export default function DriverShare({ sid, token }) {
  const [info, setInfo] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [sharing, setSharing] = useState(false);
  const [status, setStatus] = useState("");
  const [lastSent, setLastSent] = useState(null);
  const watchId = useRef(null);
  const lastPost = useRef(0);

  useEffect(() => {
    fetch(`/api/driver/${sid}?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not load delivery.");
        setInfo(data);
      })
      .catch((e) => setLoadError(e.message));
  }, [sid, token]);

  const postLocation = useCallback(
    async (pos) => {
      const now = Date.now();
      if (now - lastPost.current < MIN_INTERVAL_MS) return;
      lastPost.current = now;
      try {
        const res = await fetch("/api/driver/location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sid,
            token,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          }),
        });
        if (res.ok) {
          setLastSent(new Date());
          setStatus("Location shared — updates are live.");
        } else {
          setStatus("Could not send location. Check your connection.");
        }
      } catch {
        setStatus("Could not send location. Check your connection.");
      }
    },
    [sid, token]
  );

  function startSharing() {
    if (!("geolocation" in navigator)) {
      setStatus("This device does not support location sharing.");
      return;
    }
    setStatus("Requesting location permission…");
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => postLocation(pos),
      (err) => {
        setSharing(false);
        setStatus(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied. Enable it in your browser settings and try again."
            : "Could not get your location. Move somewhere with a better signal and try again."
        );
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
    );
    setSharing(true);
  }

  function stopSharing() {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null;
    lastPost.current = 0;
    setSharing(false);
    setStatus("Location sharing stopped.");
  }

  useEffect(() => () => {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
  }, []);

  return (
    <main className="login-screen">
      <div className="login-background" />
      <header className="login-header">
        <div className="brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/company-logo.jpg" alt="Horizon Lida Green Ltd" />
        </div>
      </header>

      <div className="login-layout" style={{ justifyContent: "center" }}>
        <section className="login-card" style={{ maxWidth: 480, width: "100%" }}>
          <p className="eyebrow">DRIVER LOCATION SHARING</p>
          {loadError && (
            <>
              <h2>Link unavailable</h2>
              <p className="muted">{loadError}</p>
            </>
          )}
          {!loadError && !info && <p className="muted">Loading delivery…</p>}
          {info && (
            <>
              <h2>
                {info.shipment.trackingNumber}
              </h2>
              <p className="muted">
                {info.shipment.origin} → {info.shipment.destination}
              </p>
              <p className="preview-note" style={{ textAlign: "left" }}>
                Tap below to share your live location with Horizon Lida Green and the customer while
                you complete this delivery. Keep this page open — updates send automatically every
                few seconds.
              </p>

              <div style={{ margin: "24px 0 12px", display: "flex", justifyContent: "center" }}>
                {sharing ? (
                  <button onClick={stopSharing} className="btn-pill btn-pill-outline" style={{ borderColor: "#e0c4c4", color: "#b44444" }}>
                    Stop sharing
                  </button>
                ) : (
                  <button onClick={startSharing} className="btn-pill btn-pill-primary">
                    Start sharing location
                  </button>
                )}
              </div>

              <p className="preview-note">
                {sharing && <span className="saved-dot" style={{ display: "inline-block", marginRight: 6 }} />}
                {status}
                {lastSent && (
                  <>
                    <br />
                    Last update sent {lastSent.toLocaleTimeString("en-GB")}
                  </>
                )}
              </p>
            </>
          )}
        </section>
      </div>

      <footer className="login-footer">
        © Horizon Lida Green Ltd<span>Vehicle logistics, made simple.</span>
      </footer>
    </main>
  );
}
