import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import TeamQuickSearch from "./components/TeamQuickSearch";
import Link from "next/link";
import Image from "next/image";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VEXView",
  description: "Robotics team analysis and events dashboard",
  icons: {
    icon: "/icon.svg",
  },
};

import AppChrome from "./components/AppChrome";
import Analytics from "./components/Analytics";
import { Suspense } from "react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Suspense>
          <Analytics />
        </Suspense>
        <div className="min-h-screen flex flex-col">
          <Suspense>
            <AppChrome>
          <header className="sticky top-0 z-40 backdrop-blur border-b border-white/10 bg-white/60 dark:bg-slate-900/40">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
              <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
                <Image src="/icon.svg" alt="VEXView logo" width={32} height={32} className="h-8 w-8" />
                <span>VEXView</span>
              </Link>
              <div className="ml-auto w-full max-w-none sm:max-w-sm">
                <TeamQuickSearch compact placeholder="Search team…" maxWidthClass="max-w-full" fullWidth alignRight />
              </div>
            </div>
            {/* Search now lives inside the navbar on all breakpoints */}
          </header>
            </AppChrome>
          </Suspense>
          <main className="flex-1">
            {children}
          </main>
          <Suspense>
            <AppChrome>
          <footer className="mt-16 border-t border-white/10 bg-white/40 dark:bg-slate-900/40 backdrop-blur">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-sm text-slate-600 dark:text-slate-300 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span>© {new Date().getFullYear()} VEXView</span>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs sm:text-sm opacity-80">Powered by</span>
                <a href="https://www.robotevents.com/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
                  <Image src="/robotevents.png" alt="RobotEvents.com" width={200} height={18} className="h-[18px] w-auto opacity-80 hover:opacity-100 transition-opacity" />
                </a>
              </div>
            </div>
          </footer>
            </AppChrome>
          </Suspense>
        </div>
      </body>
    </html>
  );
}
