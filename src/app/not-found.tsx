import Link from "next/link";

import { Shell } from "@/components/Shell";
import { MAJOR, cityBySlug, cityPath } from "@/lib/cities";

/** Unknown addresses get the full header, so the search box is right there. */
export default function NotFound() {
  return (
    <Shell sky="night">
      <div className="sky sky-short">
        <section className="notice" aria-labelledby="nf-title">
          <h1 id="nf-title">Page not found</h1>
          <p>There&apos;s no page at this address. Search for a place above, or pick a city:</p>
          <ul className="notice-links">
            {MAJOR.map((slug) => cityBySlug(slug)!).map((city) => (
              <li key={city.slug}>
                <Link prefetch={false} href={cityPath(city)} className="button button-quiet">
                  {city.name}
                </Link>
              </li>
            ))}
            <li>
              <Link prefetch={false} href="/" className="button">
                All Pakistan weather
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </Shell>
  );
}
