import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Asistoria - Autonomous Voice Platform",
  description:
    "Asistoria powers real-time voice agents for housing associations, hotels, restaurants, and concierge teams. One platform, every business line.",
  openGraph: {
    title: "Asistoria - Autonomous Voice Platform",
    description:
      "Real-time voice agents for housing, hotels, restaurants, and concierge. Handle calls end-to-end in one intelligent voice.",
    type: "website",
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: "Asistoria - Autonomous Voice Platform",
    description: "Real-time voice agents for every business line.",
  },
};

import { PublicNav } from "@/components/PublicNav";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PublicNav />
        {children}
      </body>
    </html>
  );
}
