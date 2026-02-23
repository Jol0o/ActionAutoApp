import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from '../providers/QueryProvider'
import "mapbox-gl/dist/mapbox-gl.css";

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
  title: "AAU | Supra AI",
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

import { Toaster } from "@/components/ui/sonner"
import { ImpersonationBanner } from '@/components/admin/ImpersonationBanner';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      appearance={{
        baseTheme: dark,
        captcha: {
          theme: 'auto',
          size: 'flexible',
          language: 'en',
        },
      }}
    >

      <html lang="en" className="dark scrollbar-thin">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <main className="flex-1 overflow-hidden bg-background">
            <QueryProvider>
              {children}
            </QueryProvider>
          </main>
          <Toaster />
          <ImpersonationBanner />
          <InstallPrompt />
        </body>
      </html>
    </ClerkProvider>
  );
}
