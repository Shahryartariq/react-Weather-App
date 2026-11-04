import Link from "next/link";

import { MAJOR, cityBySlug, cityPath } from "@/lib/cities";

export default function NotFound() {
  return (
    <div className="page" data-sky="night">
      <header className="topbar">
        <Link href="/" className="brand">
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <circle cx="12" cy="13" r="6" className="brand-sun" />
            <path d="M9 24h14a5 5 0 0 0 .6-9.96A6.5 6.5 0 0 0 11.3 16.1 4 4 0 0 0 9 24Z" className="brand-cloud" />
          </svg>
          Skycast <span className="brand-tag">Pakistan</span>
        </Link>
      </header>
      <main id="main" className="sky sky-short">
        <section className="notice" aria-labelledby="nf-title">
          <h1 id="nf-title">This page drifted off</h1>
          <p>There&apos;s nothing at this address. Pick a city, or go back to the start page and search for one.</p>
          <ul className="notice-links">
            <li>
              <Link href="/" className="button">
                Start page
              </Link>
            </li>
            {MAJOR.map((slug) => cityBySlug(slug)!).map((city) => (
              <li key={city.slug}>
                <Link href={cityPath(city)} className="button button-quiet">
                  {city.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
