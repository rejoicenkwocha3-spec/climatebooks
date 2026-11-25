import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "ClimateBooks: Measure Impact. Manage Carbon. Build a Better Future.", template: "%s | ClimateBooks" },
  description: "ClimateBooks helps businesses measure their carbon footprint, manage sustainability data and create meaningful climate reports with intelligent AI powered tools.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}
