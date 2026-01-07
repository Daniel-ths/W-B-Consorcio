"use client"

import { useState } from "react";
import Link from "next/link";
import { Search, User, MapPin, Menu, X, Phone, ShoppingBag, Briefcase, ChevronDown } from "lucide-react"; 
import VehiclesMenu from "./VehiclesMenu"; 

export default function Navbar() {
  // Estado para controlar qual menu dropdown está aberto (apenas 'veiculos' agora)
  const [menuAberto, setMenuAberto] = useState<string | null>(null);
  
  // Estado para o Menu Hambúrguer lateral
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleMenu = (menu: string) => {
    setMenuAberto(menuAberto === menu ? null : menu);
  };

  return (
    <>
        <nav className="fixed w-full z-[1001] top-0 bg-[#f8f8f8] border-b border-gray-200 h-16 flex items-center justify-between px-6 lg:px-12 shadow-sm font-sans">
        
            {/* ESQUERDA: Hambúrguer + Veículos + Comprar */}
            <div className="flex items-center gap-6">
                
                {/* 1. Botão Hambúrguer (Abre sidebar lateral) */}
                <button 
                    onClick={() => setSidebarOpen(true)}
                    className="p-1 text-gray-600 hover:text-black transition-colors rounded-md"
                >
                    <Menu size={24} />
                </button>

                <div className="hidden md:flex gap-6 items-center">
                    
                    {/* 2. Botão Veículos (Abre o Mega Menu) */}
                    <button 
                        onClick={() => toggleMenu('veiculos')}
                        className={`text-xs font-bold uppercase tracking-wide flex items-center gap-1 transition-colors ${menuAberto === 'veiculos' ? 'text-black' : 'text-gray-600 hover:text-black'}`}
                    >
                        {menuAberto === 'veiculos' ? <X size={16}/> : null} Veículos
                    </button>

                    {/* 3. Botão Comprar (Leva direto pro catálogo/estoque abaixo) */}
                    {/* Certifique-se que a div dos seus carros tenha id="estoque" ou "catalogo" */}
                    <Link href="#estoque" className="text-xs font-bold text-gray-600 uppercase tracking-wide hover:text-black transition-colors">
                        Comprar
                    </Link>
                </div>
            </div>

            {/* CENTRO: Logo */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <Link href="/" onClick={() => setMenuAberto(null)}>
                    <img 
                        src="https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/chevrolet-logo.svg" 
                        alt="Chevrolet" 
                        className="h-6 w-auto object-contain"
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

        {/* COMPONENTE DO MEGA MENU (Agora inclui Seminovos dentro dele) */}
        <div className={`fixed top-[0px] left-0 w-full bg-white shadow-2xl border-t border-gray-100 z-[1000] menu-dropdown ${menuAberto === 'veiculos' ? 'menu-dropdown-ativo' : ''}`}>
            {/* Passamos a função para fechar o menu quando clicar em algo */}
            <VehiclesMenu onClose={() => setMenuAberto(null)} />
        </div>

        {/* OVERLAY ESCURO (Para focar no menu quando aberto) */}
        {menuAberto && (
            <div 
                onClick={() => setMenuAberto(null)}
                className="fixed inset-0 top-16 bg-black/40 z-[999] backdrop-blur-[2px] transition-opacity duration-300"
            />
        )}

        {/* --- SIDEBAR LATERAL (MENU HAMBÚRGUER) --- */}
        {/* Overlay */}
        <div 
            className={`fixed inset-0 bg-black/60 z-[2000] backdrop-blur-sm transition-opacity duration-500 ${sidebarOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
            onClick={() => setSidebarOpen(false)}
        ></div>

        {/* Gaveta */}
        <div className={`fixed top-0 left-0 h-full w-[300px] bg-white z-[2001] shadow-2xl transform transition-transform duration-500 ease-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="flex justify-between items-center p-6 border-b border-gray-100 h-16">
                 <img src="https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/chevrolet-logo.svg" alt="Chevy" className="h-4" />
                 <button onClick={() => setSidebarOpen(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                    <X size={20} className="text-gray-600"/>
                 </button>
            </div>
            <div className="p-8 space-y-8 overflow-y-auto h-full pb-24">
                <div className="space-y-6">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Menu</p>
                    <Link href="#" className="flex items-center gap-4 text-gray-800 font-bold text-sm uppercase tracking-wide hover:text-[#CD9834] group transition-colors">
                        <Briefcase size={18} className="text-gray-400 group-hover:text-[#CD9834]"/> Vendas Diretas
                    </Link>
                    <Link href="#estoque" onClick={() => setSidebarOpen(false)} className="flex items-center gap-4 text-gray-800 font-bold text-sm uppercase tracking-wide hover:text-[#CD9834] group transition-colors">
                        <ShoppingBag size={18} className="text-gray-400 group-hover:text-[#CD9834]"/> Comprar
                    </Link>
                    <Link href="#" className="flex items-center gap-4 text-gray-800 font-bold text-sm uppercase tracking-wide hover:text-[#CD9834] group transition-colors">
                        <Phone size={18} className="text-gray-400 group-hover:text-[#CD9834]"/> Fale Conosco
                    </Link>
                    <Link href="#" className="flex items-center gap-4 text-gray-800 font-bold text-sm uppercase tracking-wide hover:text-[#CD9834] group transition-colors">
                        <MapPin size={18} className="text-gray-400 group-hover:text-[#CD9834]"/> Localizar Concessionária
                    </Link>
                </div>
            </div>
        </div>
    </>
  );
}