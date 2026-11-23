import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { messages } from "@/lib/messages";

export const metadata: Metadata = { title: messages.pages.jobs.title };

/**
 * The Jobs page, the home page. A placeholder until the job feed lands.
 *
 * @returns The Jobs page.
 */
export default function JobsPage() {
  return <PageHeader title={messages.pages.jobs.title} />;
}
