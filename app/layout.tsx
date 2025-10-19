import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TH+ LifeEngine — Verbal Edition",
  description: "Personalised wellness planning with verbal RAG and Gemini.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
