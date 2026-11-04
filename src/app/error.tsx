"use client";

import Link from "next/link";

/** OpenWeather was down, slow or rate-limited. Offer a retry instead of a blank page. */
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="page" data-sky="clouds">
      <main id="main" className="sky sky-short">
        <section className="notice" aria-labelledby="error-title">
          <h1 id="error-title">The forecast didn&apos;t load</h1>
          <p>The weather service didn&apos;t answer in time. This is usually brief.</p>
          <p className="notice-actions">
            <button type="button" className="button" onClick={reset}>
              Try again
            </button>
            <Link href="/" className="button button-quiet">
              Go to the start page
            </Link>
          </p>
        </section>
      </main>
    </div>
  );
}
