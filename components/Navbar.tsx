"use client"

import { useState } from "react";
import Link from "next/link";
import { Search, User, MapPin, ChevronDown, X } from "lucide-react"; 
import VehiclesMenu from "./VehiclesMenu"; 

export default function Navbar() {
  const [menuAberto, setMenuAberto] = useState<string | null>(null);

  const toggleMenu = (menu: string) => {
    setMenuAberto(menuAberto === menu ? null : menu);
  };

  return (
    <>
        <nav className="fixed w-full z-[1001] top-0 bg-[#f8f8f8] border-b border-gray-200 h-16 flex items-center justify-between px-6 lg:px-12 shadow-sm">
        
            {/* ESQUERDA: Botões */}
            <div className="flex items-center gap-8">
                <div className="hidden md:flex gap-6 items-center">
                    
                    <button 
                        onClick={() => toggleMenu('veiculos')}
                        className={`text-xs font-bold uppercase tracking-wide flex items-center gap-1 transition-colors ${menuAberto === 'veiculos' ? 'text-black' : 'text-gray-600 hover:text-black'}`}
                    >
                        {menuAberto === 'veiculos' ? <X size={16}/> : null} Veículos
                    </button>

                    <Link href="#estoque" className="text-xs font-bold text-gray-600 uppercase tracking-wide hover:text-black transition-colors">
                        Comprar
                    </Link>
                    <Link href="#" className="text-xs font-bold text-gray-600 uppercase tracking-wide hover:text-black transition-colors">
                        Vendas Diretas
                    </Link>
                    
                    <div className="relative">
                        <button 
                            onClick={() => toggleMenu('seminovos')}
                            className={`text-xs font-bold uppercase tracking-wide flex items-center gap-1 transition-colors ${menuAberto === 'seminovos' ? 'text-[#FFD600]' : 'text-gray-600 hover:text-[#FFD600]'}`}
                        >
                            Seminovos 
                            <ChevronDown size={14} className={`transition-transform duration-300 ${menuAberto === 'seminovos' ? 'rotate-180' : ''}`}/>
                        </button>

                        <div className={`absolute top-full left-0 mt-5 w-56 bg-white border border-gray-200 shadow-xl rounded-md overflow-hidden menu-dropdown ${menuAberto === 'seminovos' ? 'menu-dropdown-ativo' : ''}`}>
                             <div className="flex flex-col py-2">
                                <Link href="/seminovos" className="px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 hover:text-black transition-colors font-medium">
                                    Ver Estoque Completo
                                </Link>
                                <Link href="/seminovos/premium" className="px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 hover:text-black transition-colors font-medium border-t border-gray-100">
                                    Linha Premium
                                </Link>
                             </div>
                        </div>
                    </div>

                </div>
                
                <button className="md:hidden text-gray-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
            </div>

            {/* CENTRO: Logo (ATUALIZADA) */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <Link href="/" onClick={() => setMenuAberto(null)}>
                    <img 
                        src="https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/chevrolet-logo.svg" 
                        alt="Chevrolet" 
                        className="h-6 w-auto object-contain" // Ajustei a altura para ficar proporcional
                    />
                </Link>
            </div>

            {/* DIREITA: Ícones */}
            <div className="flex items-center gap-6 text-gray-600">
                <button className="hover:text-black transition-colors"><Search size={20} /></button>
                <Link href="/admin" className="hover:text-black transition-colors flex items-center gap-2">
                    <User size={20} />
                    <span className="hidden lg:inline text-xs font-bold uppercase">Login</span>
                </Link>
                <button className="hover:text-black transition-colors hidden sm:block"><MapPin size={20} /></button>
            </div>
        </nav>

        <div className={`fixed top-[0px] left-0 w-full bg-white shadow-2xl border-t border-gray-100 z-[1000] menu-dropdown ${menuAberto === 'veiculos' ? 'menu-dropdown-ativo' : ''}`}>
            <VehiclesMenu onClose={() => setMenuAberto(null)} />
        </div>

        {menuAberto && (
            <div 
                onClick={() => setMenuAberto(null)}
                className="fixed inset-0 top-16 bg-black/40 z-[999] backdrop-blur-[2px] transition-opacity duration-300"
            />
        )}
    </>
  );
}