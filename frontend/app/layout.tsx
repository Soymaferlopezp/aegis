import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AEGIS — Financial guardrails for AI agents",
  description:
    "AEGIS is an on-chain control layer that enforces financial guardrails for AI agents.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body
        className={[
          "min-h-screen",
          "bg-[var(--bg)] text-[var(--text)]",
          "font-[var(--font-sans)]",
        ].join(" ")}
      >
        <div className="aegis-noise" />
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
