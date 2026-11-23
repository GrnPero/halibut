import type { ReactNode } from "react";

/** Props for {@link PageHeader}. */
export type PageHeaderProps = {
  /** The page's title, shown as its h1. */
  title: string;
  /** The page's own buttons, shown on the right. */
  actions?: ReactNode;
};

/**
 * The bar under the nav with the page title and that page's actions.
 *
 * @param props - The title and optional actions.
 * @returns The page header.
 */
export function PageHeader({ title, actions }: PageHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-4 border-b pb-4">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
