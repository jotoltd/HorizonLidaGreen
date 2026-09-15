"use client";

import { useState } from "react";
import TrackWidget from "./TrackWidget";

export default function TrackSection() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-6 border-t border-navy-100 pt-5">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between text-left">
        <span className="text-sm text-navy-400">Just need to track a shipment?</span>
        <svg
          className={`h-4 w-4 text-navy-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="mt-4">
          <TrackWidget />
        </div>
      )}
    </div>
  );
}
