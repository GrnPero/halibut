"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { messages } from "@/lib/messages";
import { cn } from "@/lib/utils";

const HOME = "/";

// The job detail page sits under Jobs, so it keeps Jobs highlighted.
const JOBS_DETAIL_PREFIX = "/jobs";

const NAV_LINKS = [
  { href: HOME, label: messages.nav.jobs },
  { href: "/applications", label: messages.nav.applications },
] as const;

/**
 * Tells whether a nav link points at the current page or one under it.
 *
 * @param pathname - The current path.
 * @param href - The nav link's target.
 * @returns True when the link should be highlighted.
 */
export function isActivePath(pathname: string, href: string): boolean {
  if (href === HOME) {
    return pathname === HOME || isUnder(pathname, JOBS_DETAIL_PREFIX);
  }

  return isUnder(pathname, href);
}

// Matches the path itself or anything below it, but not "/applicationsx".
function isUnder(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/**
 * The nav's page links, with the current page highlighted.
 *
 * @returns The Jobs and Applications links.
 */
export function NavLinks() {
  const pathname = usePathname();

  return (
    <ul className="flex items-center gap-1">
      {NAV_LINKS.map(({ href, label }) => {
        const active = isActivePath(pathname, href);

        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
