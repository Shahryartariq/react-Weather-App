"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { placeHref } from "@/lib/query";
import type { Units } from "@/lib/types";

const MESSAGES: Record<number, string> = {
  1: "Location access is blocked. Allow it in your browser settings, or search for a city.",
  2: "Your location isn't available right now. Search for a city instead.",
  3: "Finding your location took too long. Try again or search for a city.",
};

/** Asks the browser for the reader's position and shows the weather there. */
export function LocateButton({ units }: { units: Units }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  function locate() {
    if (!("geolocation" in navigator)) {
      setMessage("This browser can't share your location. Search for a city instead.");
      return;
    }
    setBusy(true);
    setMessage("");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setBusy(false);
        router.push(placeHref({ lat: +coords.latitude.toFixed(3), lon: +coords.longitude.toFixed(3) }, units));
      },
      (error) => {
        setBusy(false);
        setMessage(MESSAGES[error.code] ?? MESSAGES[2]);
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 10 * 60_000 },
    );
  }

  return (
    <div className="locate">
      <button type="button" className="icon-button" onClick={locate} disabled={busy} aria-describedby={message ? "locate-message" : undefined}>
        <svg viewBox="0 0 24 24" aria-hidden="true" className={busy ? "spin" : undefined}>
          <circle cx="12" cy="12" r="3.2" />
          <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3" />
          <circle cx="12" cy="12" r="7" />
        </svg>
        <span className="visually-hidden">{busy ? "Finding your location" : "Use my location"}</span>
      </button>
      {message && (
        <p id="locate-message" role="status" className="locate-message">
          {message}
        </p>
      )}
    </div>
  );
}
