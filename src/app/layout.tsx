import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from '../providers/QueryProvider'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Action Auto Utah Dashboard",
  description: "Advanced Car Dealership Management",
};

import { ClerkProvider } from '@clerk/nextjs'
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
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <main className="flex-1 overflow-hidden bg-background">
            <QueryProvider> 
            {children}
            </QueryProvider>
          </main>
        </body>
      </html>
    </ClerkProvider>
  );
}
