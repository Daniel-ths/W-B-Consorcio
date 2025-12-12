"use client" // <--- Agora é um componente interativo

import { useState } from "react";
import Link from "next/link";
import { Search, User, MapPin, ChevronDown, X } from "lucide-react"; 
import VehiclesMenu from "./VehiclesMenu"; // Importa o menu novo

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
        <nav className="fixed w-full z-50 top-0 bg-[#f8f8f8] border-b border-gray-200 h-16 flex items-center justify-between px-6 lg:px-12">
        
        {/* ESQUERDA: Botão Veículos com Ação */}
        <div className="flex items-center gap-8">
            <div className="hidden md:flex gap-6 items-center">
                
                {/* BOTÃO QUE ABRE O MEGA MENU */}
                <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className={`text-xs font-bold uppercase tracking-wide flex items-center gap-1 transition-colors ${isMenuOpen ? 'text-black' : 'text-gray-600 hover:text-black'}`}
                >
                    {isMenuOpen ? <X size={16}/> : null} Veículos
                </button>

                <Link href="#estoque" className="text-xs font-bold text-gray-600 uppercase tracking-wide hover:text-black transition-colors">
                    Comprar
                </Link>
                <Link href="#" className="text-xs font-bold text-gray-600 uppercase tracking-wide hover:text-black transition-colors">
                    Vendas Diretas
                </Link>
            </div>
            
            <button className="md:hidden text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
        </div>

        {/* CENTRO: Logo Chevrolet Dourada */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <Link href="/" onClick={() => setIsMenuOpen(false)}>
                <img 
                    src="https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/chevrolet-bowtie-120.svg" 
                    alt="Chevrolet" 
                    className="h-5 w-auto object-contain"
                />
            </Link>
        </div>

        {/* DIREITA: Ícones */}
        <div className="flex items-center gap-6 text-gray-600">
            <button className="hover:text-black transition-colors">
                <Search size={20} />
            </button>
            
            <Link href="/admin" className="hover:text-black transition-colors flex items-center gap-2">
                <User size={20} />
                <span className="hidden lg:inline text-xs font-bold uppercase">Login</span>
            </Link>

            <button className="hover:text-black transition-colors hidden sm:block">
                <MapPin size={20} />
            </button>
        </div>
        </nav>

        {/* O MEGA MENU APARECE AQUI SE ESTIVER ABERTO */}
        {isMenuOpen && <VehiclesMenu onClose={() => setIsMenuOpen(false)} />}
    </>
  );
}