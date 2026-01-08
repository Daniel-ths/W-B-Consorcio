import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
// 1. IMPORTA O CONTEXTO DE AUTENTICAÇÃO
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Chevrolet | WB Auto",
  description: "Concessionária Chevrolet - Encontre seu 0km",
  icons: {
    icon: 'https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/chevrolet-bowtie-120.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} min-h-screen bg-white text-gray-900`}>
        
        {/* 2. O AUTHPROVIDER ENVOLVE TUDO (NAVBAR, MAIN, FOOTER) */}
        <AuthProvider>
          
          <Navbar />
          
          <main className="min-h-screen">
            {children}
          </main>
          
          {/* --- SEUS BOTÕES FLUTUANTES --- */}
          {/* <AdminButton /> */} 

          <Footer />
          
        </AuthProvider>

      </body>
    </html>
  );
}