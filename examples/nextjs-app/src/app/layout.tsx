import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { DocsLayout } from "@/components/docs-layout";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "NeuraForge UI — Component Library for AI Agents",
  description:
    "20 accessible React + Tailwind components that AI coding agents query over MCP. Checksum verified. MIT licensed.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans">
        <DocsLayout>{children}</DocsLayout>
      </body>
    </html>
  );
}
