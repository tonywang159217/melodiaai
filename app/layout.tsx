import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MelodiaAI — Generate unique music with AI",
  description:
    "Describe an idea, get a royalty-free song in seconds. Powered by Suno AI, with cloud storage and subscription billing.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
  openGraph: {
    title: "MelodiaAI — Generate unique music with AI",
    description:
      "Turn a prompt into a full, royalty-free track. Subscription plans for every creator.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MelodiaAI — Generate unique music with AI",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}