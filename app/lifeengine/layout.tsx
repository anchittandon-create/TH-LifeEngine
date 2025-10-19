import type { Metadata } from "next";

import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "TH+ LifeEngine",
  description: "Personalised wellness planning with Gemini AI.",
};

export default function LifeengineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
