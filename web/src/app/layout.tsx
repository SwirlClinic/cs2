import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CS2 Loadout",
  description: "Customize your CS2 loadout — skins, knives, gloves, and more",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen bg-bg text-text">
        {children}
      </body>
    </html>
  );
}
