import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { messages } from "@/lib/messages";

export const metadata: Metadata = { title: messages.pages.applications.title };

/**
 * The Applications page. A placeholder until application tracking lands.
 *
 * @returns The Applications page.
 */
export default function ApplicationsPage() {
  return <PageHeader title={messages.pages.applications.title} />;
}
