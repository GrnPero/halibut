/**
 * Joins class names and resolves Tailwind conflicts, so later classes win.
 * Re-exports shadcn's `cn` package (a drop-in for clsx + tailwind-merge) at the `utils` alias in components.json.
 */
export { cn } from "cn";
