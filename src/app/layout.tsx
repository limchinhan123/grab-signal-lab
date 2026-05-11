import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Grab Signal Lab",
  description: "Turn Malaysia market signals into actionable GrabFood test plans."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
