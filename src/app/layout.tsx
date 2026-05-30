import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "REDDIT.ANALYTICS // v3",
  description: "Multi-user Reddit profile analytics & insights",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head />
      <body>{children}</body>
    </html>
  );
}
