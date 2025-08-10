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
  title: "Robonalysis",
  description: "Robotics team analysis and events dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="min-h-screen flex flex-col">
          <header className="sticky top-0 z-40 backdrop-blur border-b border-white/10 bg-white/60 dark:bg-slate-900/40">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
              <a href="/" className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">R</span>
                <span>Robonalysis</span>
              </a>
              <nav className="hidden sm:flex items-center gap-6 text-sm text-slate-600 dark:text-slate-300">
                <a className="hover:text-indigo-600 dark:hover:text-indigo-400" href="/">Home</a>
                <a className="hover:text-indigo-600 dark:hover:text-indigo-400" href="/teams">Teams</a>
              </nav>
            </div>
          </header>
          <main className="flex-1">
            {children}
          </main>
          <footer className="mt-16 border-t border-white/10 bg-white/40 dark:bg-slate-900/40 backdrop-blur">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-sm text-slate-600 dark:text-slate-300 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span>© {new Date().getFullYear()} Robonalysis</span>
              <span className="opacity-70">Robotics performance analytics</span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
