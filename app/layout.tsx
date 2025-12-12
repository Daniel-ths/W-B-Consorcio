import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer"; 

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WB Auto | Veículos Premium",
  description: "Sistema de Venda de Carros WB Auto",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} min-h-screen bg-black text-white`}>
        <Navbar />
        
        {/* O 'main' empurra o rodapé para baixo se a página for curta */}
        <main className="min-h-screen">
          {children}
        </main>
        
        {/* Botão Flutuante do WhatsApp (Fica fixo no canto) */}
        <a 
          href="https://wa.me/5591999999999" // ⚠️ Troque pelo número real do Warllon
          target="_blank"
          className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-400 text-white p-4 rounded-full shadow-2xl shadow-green-900/50 hover:-translate-y-1 transition-all"
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