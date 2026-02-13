import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from '../providers/QueryProvider'
import "mapbox-gl/dist/mapbox-gl.css";
<<<<<<< HEAD

=======
>>>>>>> e8cfe2633dc30f90eda18b6b65112f7a1247a99f

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import type { Viewport } from "next";

export const metadata: Metadata = {
  title: "Action Auto Utah Dashboard",
  description: "Advanced Car Dealership Management",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Action Auto",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import { ClerkProvider } from '@clerk/nextjs'
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { dark } from '@clerk/themes'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider appearance={{
      baseTheme: dark,
      captcha: {
        theme: 'auto',
        size: 'flexible',
        language: 'en',
      },
    }}>
      <html lang="en" className="dark scrollbar-thin">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <main className="flex-1 overflow-hidden bg-background">
            <QueryProvider>
              {children}
            </QueryProvider>
          </main>
          {/* <Toaster /> */}
          <InstallPrompt />
        </body>
      </html>
    </ClerkProvider>
  );
}
