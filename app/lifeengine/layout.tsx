import type { Metadata } from "next";
import AppShell from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "TH+ LifeEngine",
  description: "Verbal Edition: Gemini-guided personalised planning.",
};

export default function LifeengineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
