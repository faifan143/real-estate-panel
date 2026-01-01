import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { I18nProvider } from "@/components/providers/i18n-provider";
import { I18nClient } from "@/components/providers/i18n-client";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Real Estate Panel",
  description: "Semester Project - Real Estate Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <I18nProvider>
          <I18nClient>
            <QueryProvider>
              <AuthProvider>
                {children}
                <Toaster />
              </AuthProvider>
            </QueryProvider>
          </I18nClient>
        </I18nProvider>
      </body>
    </html>
  );
}
