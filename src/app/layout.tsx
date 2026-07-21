import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased min-h-screen selection:bg-blue-600 selection:text-white font-sans">
        {children}
      </body>
    </html>
  );
}
