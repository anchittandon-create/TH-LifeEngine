import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./responsive.css";

export const metadata: Metadata = {
  title: "TH+ LifeEngine",
  description: "Personalized health booster",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#111111",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="auto-scale">{children}</body>
    </html>
  );
}
