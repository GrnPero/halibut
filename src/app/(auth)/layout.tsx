import type { ReactNode } from "react";

/**
 * A bare layout that centers its page, with no nav. Used by /login.
 *
 * @param props - The page to render.
 * @returns The page, centered.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      {children}
    </main>
  );
}
