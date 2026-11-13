"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { UNITS_COOKIE } from "@/lib/units";

/**
 * The °C link. Its address asks the server to forget a saved °F choice (`?units=metric`), which
 * works without JavaScript. With JavaScript, it forgets the choice here and goes straight to the
 * clean address, saving a redirect.
 */
export function CelsiusLink({ href, clean, current, children }: { href: string; clean: string; current: boolean; children: ReactNode }) {
  const router = useRouter();
  return (
    <Link
      prefetch={false}
      href={href}
      aria-current={current ? "true" : undefined}
      scroll={false}
      rel="nofollow"
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
        event.preventDefault();
        document.cookie = `${UNITS_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
        router.push(clean, { scroll: false });
      }}
    >
      {children}
    </Link>
  );
}
