import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import Navbar from "@/components/Navbar";
import FooterWrapper from "@/components/FooterWrapper";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/theme-provider"; // 👈 IMPORTANTE

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WB Auto | Portal Multimarca",
  description: "Portal multimarca com experiências Chevrolet e Hyundai",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${inter.className} flex flex-col min-h-screen bg-white text-gray-900 dark:bg-zinc-950 dark:text-white transition-colors`}
      >
        <ThemeProvider>
          <AuthProvider>
            <Navbar />

            <main className="flex-grow">
              {children}
            </main>

            <FooterWrapper />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}