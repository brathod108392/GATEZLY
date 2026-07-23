import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Gatezly Portal - Smart Gate & Society Management",
  description: "Comprehensive gate management, resident directory, visitor passes, and society administration portal.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans bg-slate-50 text-slate-900 antialiased min-h-screen selection:bg-blue-600 selection:text-white`}>
        {children}
      </body>
    </html>
  );
}
