import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import FooterWrapper from "@/components/FooterWrapper"; 
// import { AuthProvider } from "@/contexts/AuthContext"; // <--- 1. DESATIVADO

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Chevrolet | WB Auto",
  description: "Concessionária Chevrolet",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning={true}>
      <body className={`${inter.className} flex flex-col min-h-screen bg-white text-gray-900`} suppressHydrationWarning={true}>
        
        {/* SEM AUTHPROVIDER - O site roda "solto" */}
        <Navbar />

        <main className="flex-grow">
          {children}
        </main>

        <FooterWrapper />
          
      </body>
    </html>
  );
}