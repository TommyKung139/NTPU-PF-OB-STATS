import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Baseball Savant Stats",
  description: "Advanced team analytics and lineup optimizer",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import { StoreInitializer } from '@/components/StoreInitializer';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <StoreInitializer />
        <Navbar />
        <main className="min-h-screen bg-slate-50">
          {children}
        </main>
      </body>
    </html>
  );
}
