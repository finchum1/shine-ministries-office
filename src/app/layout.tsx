import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Shine Ministries — Office",
  description: "Back office for editing the Shine Ministries website.",
  robots: { index: false, follow: false },
  icons: {
    icon: "https://www.shineministriesok.com/icon.png",
    shortcut: "https://www.shineministriesok.com/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable} h-full`}>
      <body className="min-h-full bg-cream-soft text-clay-900 antialiased">{children}</body>
    </html>
  );
}
