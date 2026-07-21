import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gatezly Portal - Smart Access & Security System",
  description: "Enterprise gate management, visitor access control, and intelligent security portal.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#090d16] text-slate-100 antialiased min-h-screen selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}

