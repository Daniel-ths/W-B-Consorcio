import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
// 1. IMPORT DO BOTÃO ADMIN
import AdminButton from "@/components/AdminButton";

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
        <Navbar />
        
        <main className="min-h-screen">
          {children}
        </main>
        
        {/* --- SEUS BOTÕES FLUTUANTES --- */}

        {/* 2. Botão Admin (Canto Esquerdo) */}
        <AdminButton />

        {/* Botão WhatsApp (Canto Direito - Mantido Original) */}
        <a 
          href="https://wa.me/5591999999999" 
          target="_blank"
          className="fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#128C7E] text-white p-4 rounded-full shadow-2xl shadow-green-900/20 hover:-translate-y-1 transition-all"
          title="Falar com Vendedor"
        >
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" 
            className="w-8 h-8 filter invert brightness-0" 
            alt="WhatsApp" 
          />
        </a>

        <Footer /> 
      </body>
    </html>
  );
}