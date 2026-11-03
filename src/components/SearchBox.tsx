"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { placeHref, placeLabel } from "@/lib/query";
import type { Place, Units } from "@/lib/types";

const RECENT_KEY = "skycast:recent";
const MAX_RECENT = 5;

function readRecent(): Place[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

function saveRecent(place: Place) {
  try {
    const rest = readRecent().filter((p) => placeLabel(p) !== placeLabel(place));
    localStorage.setItem(RECENT_KEY, JSON.stringify([place, ...rest].slice(0, MAX_RECENT)));
  } catch {
    // Storage blocked (private mode): recent places just aren't remembered.
  }
}

type Status = "idle" | "loading" | "done" | "error";

/**
 * City search as an ARIA combobox. Works without JavaScript too: the form submits
 * `?q=` and the server looks the city up.
 */
export function SearchBox({ units }: { units: Units }) {
  const router = useRouter();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const [recent, setRecent] = useState<Place[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);

  const trimmed = query.trim();
  const showingRecent = trimmed.length < 2;
  const options = showingRecent ? recent : results;

  // Fetch suggestions as the reader types, debounced, cancelling stale requests.
  useEffect(() => {
    if (trimmed.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setStatus("loading");
      try {
        const response = await fetch(`/api/places?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(String(response.status));
        const data: { places: Place[] } = await response.json();
        setResults(data.places);
        setActive(data.places.length ? 0 : -1);
        setStatus("done");
      } catch (error) {
        if ((error as Error).name !== "AbortError") setStatus("error");
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed]);

  // Close when clicking anywhere else.
  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function choose(place: Place) {
    saveRecent(place);
    setOpen(false);
    setQuery("");
    setResults([]);
    setStatus("idle");
    (document.activeElement as HTMLElement | null)?.blur();
    router.push(placeHref(place, units));
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActive((i) => (options.length ? (i + 1) % options.length : -1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => (options.length ? (i - 1 + options.length) % options.length : -1));
    } else if (event.key === "Escape") {
      setOpen(false);
    } else if (event.key === "Enter" && open && active >= 0 && options[active]) {
      event.preventDefault();
      choose(options[active]);
    }
  }

  const expanded = open && (options.length > 0 || (!showingRecent && status !== "idle"));
  const activeId = expanded && active >= 0 ? `${listId}-${active}` : undefined;

  return (
    <div className="search" ref={boxRef}>
      <form action="/" method="get" role="search" className="search-form" onSubmit={(e) => {
        // With JavaScript, pick the highlighted suggestion instead of a full page load.
        if (options[active]) {
          e.preventDefault();
          choose(options[active]);
        }
      }}>
        <label htmlFor={`${listId}-input`} className="visually-hidden">
          Search for a city
        </label>
        <svg viewBox="0 0 24 24" className="search-glyph" aria-hidden="true">
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4 4" />
        </svg>
        <input
          id={`${listId}-input`}
          name="q"
          type="search"
          value={query}
          placeholder="Search a city"
          autoComplete="off"
          spellCheck={false}
          minLength={2}
          maxLength={80}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={expanded}
          aria-controls={listId}
          aria-activedescendant={activeId}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            if (event.target.value.trim().length < 2) setActive(-1);
          }}
          onFocus={() => {
            setRecent(readRecent());
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
        />
        {units === "imperial" && <input type="hidden" name="units" value="imperial" />}
      </form>

      <div className={expanded ? "search-panel is-open" : "search-panel"}>
        {showingRecent && options.length > 0 && <p className="search-heading">Recent</p>}
        <ul id={listId} role="listbox" aria-label={showingRecent ? "Recent places" : "Matching places"}>
          {options.map((place, index) => (
            <li
              key={`${place.lat},${place.lon}`}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === active}
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => choose(place)}
              onPointerMove={() => setActive(index)}
            >
              <span className="option-name">{place.name}</span>
              <span className="option-meta">{[place.region, place.country].filter(Boolean).join(", ")}</span>
            </li>
          ))}
        </ul>
        {!showingRecent && status === "loading" && options.length === 0 && (
          <p className="search-note">Searching…</p>
        )}
        {!showingRecent && status === "done" && options.length === 0 && (
          <p className="search-note">No places match “{trimmed}”. Try adding the country, like “Paris, FR”.</p>
        )}
        {!showingRecent && status === "error" && (
          <p className="search-note">Search isn&apos;t working right now. Press Enter to try a full search.</p>
        )}
      </div>
    </div>
  );
}
