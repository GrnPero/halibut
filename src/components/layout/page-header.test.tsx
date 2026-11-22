import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { PageHeader } from "@/components/layout/page-header";
import { messages } from "@/lib/messages";

const TITLE = messages.pages.jobs.title;

describe("PageHeader", () => {
  test("renders the title as the page heading", () => {
    render(<PageHeader title={TITLE} />);

    expect(
      screen.getByRole("heading", { level: 1, name: TITLE }),
    ).toBeVisible();
  });

  test("renders the actions it's given", () => {
    render(
      <PageHeader title={TITLE} actions={<button type="button">Act</button>} />,
    );

    expect(screen.getByRole("button", { name: "Act" })).toBeVisible();
  });

  test("renders no actions when none are given", () => {
    render(<PageHeader title={TITLE} />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
