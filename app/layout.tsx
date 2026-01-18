import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
// MUDANÇA 1: Importamos o Wrapper em vez do Footer direto
import FooterWrapper from "@/components/FooterWrapper"; 
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Chevrolet | WB Auto",
  description: "Concessionária Chevrolet - Encontre seu 0km",
  icons: {
    icon: 'https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/chevrolet-logo.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} flex flex-col min-h-screen bg-white text-gray-900`}>
        <AuthProvider>
          <Navbar />

          {/* MAIN precisa ser flex-grow e padding-bottom suficiente para o footer */}
          <main className="flex-grow">
            {children}
          </main>

          {/* MUDANÇA 2: Usamos o Wrapper que decide se mostra ou não o Footer */}
          <FooterWrapper />
          
        </AuthProvider>
      </body>
    </html>
  );
}