import { Nav } from "@/components/layout/nav";

/**
 * The app's main layout: the global nav above the page. Each page renders its
 * own PageHeader, since the title changes per page.
 *
 * @param props - The page to render.
 * @returns The page inside the nav layout.
 */
export default function MainLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Nav />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-6">
        {children}
      </main>
    </>
  );
}
