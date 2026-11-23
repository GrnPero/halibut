import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { NavLinks } from "@/components/layout/nav-links";
import { messages } from "@/lib/messages";

vi.mock("next/navigation", () => ({ usePathname: vi.fn() }));

/**
 * Renders the links as if the browser were at the given path.
 *
 * @param pathname - The path usePathname returns.
 */
function renderAt(pathname: string) {
  vi.mocked(usePathname).mockReturnValue(pathname);
  render(<NavLinks />);
}

const jobsLink = () => screen.getByRole("link", { name: messages.nav.jobs });

const applicationsLink = () =>
  screen.getByRole("link", { name: messages.nav.applications });

describe("NavLinks", () => {
  beforeEach(() => {
    vi.mocked(usePathname).mockReset();
  });

  test("links to Jobs and Applications", () => {
    renderAt("/");

    expect(jobsLink()).toHaveAttribute("href", "/");
    expect(applicationsLink()).toHaveAttribute("href", "/applications");
  });

  test("highlights Jobs on the home page", () => {
    renderAt("/");

    expect(jobsLink()).toHaveAttribute("aria-current", "page");
    expect(applicationsLink()).not.toHaveAttribute("aria-current");
  });

  test("highlights Applications on its page", () => {
    renderAt("/applications");

    expect(applicationsLink()).toHaveAttribute("aria-current", "page");
    expect(jobsLink()).not.toHaveAttribute("aria-current");
  });

  test("keeps Jobs highlighted on a job's detail page", () => {
    renderAt("/jobs/abc");

    expect(jobsLink()).toHaveAttribute("aria-current", "page");
    expect(applicationsLink()).not.toHaveAttribute("aria-current");
  });

  test("matches a prefix only at a segment boundary", () => {
    renderAt("/applicationsx");

    expect(jobsLink()).not.toHaveAttribute("aria-current");
    expect(applicationsLink()).not.toHaveAttribute("aria-current");
  });
});
