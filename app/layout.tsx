import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Open Field — Visual Travel Planner",
  description: "Three decision-led prototypes for a cinematic, interactive travel agent response.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
