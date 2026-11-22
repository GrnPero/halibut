import { Upload } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { NavLinks } from "@/components/layout/nav-links";
import { Button } from "@/components/ui/button";
import { messages } from "@/lib/messages";

// The one file to replace to change the logo everywhere.
const LOGO_SRC = "/logo.svg";

// Square slot, in px (matches size-8).
const LOGO_SIZE = 32;

/**
 * The global nav, identical on every page: logo, page links, account buttons.
 *
 * @returns The top navigation bar.
 */
export function Nav() {
  return (
    <nav className="border-b">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-6">
        <Link href="/" className="flex items-center gap-2">
          {/* Empty alt: the wordmark next to it already names the app. */}
          <Image
            src={LOGO_SRC}
            alt=""
            width={LOGO_SIZE}
            height={LOGO_SIZE}
            className="size-8"
            loading="eager"
          />
          <span className="text-lg font-semibold tracking-tight">
            {messages.app.name}
          </span>
        </Link>

        <NavLinks />

        {/* Inert until their stories wire them up. */}
        <div className="ml-auto flex items-center gap-2">
          <Button type="button" variant="outline">
            <Upload data-icon="inline-start" />
            {messages.nav.uploadResume}
          </Button>
          <Button type="button" variant="ghost">
            {messages.nav.signOut}
          </Button>
        </div>
      </div>
    </nav>
  );
}
