import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TH+ LifeEngine",
  description: "AI-powered personalised wellness planning for Times Health+.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-100 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
