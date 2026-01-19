"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Search, 
  User, 
  MapPin, 
  Menu, 
  X, 
  Phone, 
  ShoppingBag,
  LayoutDashboard
} from "lucide-react";
import VehiclesMenu from "./VehiclesMenu";

// =====================================================================
// 🔧 ÁREA DE CONFIGURAÇÃO DE IMAGENS
// =====================================================================
const LOGO_NAVBAR = "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/chevrolet-logo.svg";
const LOGO_SIDEBAR = "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/parceirologo.jpg";
// =====================================================================

export default function Navbar() {
  const [menuAberto, setMenuAberto] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // --- MODO DE SEGURANÇA: REMOVEMOS TODA A LÓGICA DE LOGIN ---
  // O site vai achar que você é um visitante normal.
  // Isso impede que o componente tente conectar no Supabase e cause loop.
  
  const user = null; 
  const loading = false;

  const toggleMenu = (menu: string) => {
    setMenuAberto(menuAberto === menu ? null : menu);
  };

  return (
    <>
      <nav className="fixed w-full z-[1001] top-0 bg-[#f8f8f8] border-b border-gray-200 h-16 flex items-center justify-between px-6 lg:px-12 shadow-sm font-sans">
        
        {/* ESQUERDA */}
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-1 text-gray-600 hover:text-black transition-colors rounded-md"
          >
            <Menu size={24} />
          </button>

          <div className="hidden md:flex gap-6 items-center">
              <button 
                onClick={() => toggleMenu('veiculos')}
                className={`text-xs font-bold uppercase tracking-wide flex items-center gap-1 transition-colors ${menuAberto === 'veiculos' ? 'text-black' : 'text-gray-600 hover:text-black'}`}
              >
                {menuAberto === 'veiculos' ? <X size={16}/> : null} Veículos
              </button>
          </div>
        </div>

        {/* CENTRO */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <a href="/">
            <img src={LOGO_NAVBAR} alt="Logo" className="h-8 w-auto object-contain" />
          </a>
        </div>

        {/* DIREITA */}
        <div className="flex items-center gap-6 text-gray-600">
          <button className="hover:text-black transition-colors"><Search size={20} /></button>

          {/* BOTÃO DE LOGIN SIMPLIFICADO (Link direto para /login) */}
          <Link href="/login" className="text-sm font-bold text-gray-700 hover:text-black hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
            <User size={18} /> Entrar
          </Link>
          
          {/* BOTÃO DE ADMIN DE EMERGÊNCIA (Aparece sempre neste modo debug) */}
          <Link href="/admin" className="hidden md:flex text-xs font-bold text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 px-3 py-1 rounded transition-colors items-center gap-1">
             <LayoutDashboard size={14} /> Painel
          </Link>

          <button className="hover:text-black transition-colors hidden sm:block"><MapPin size={20} /></button>
        </div>
      </nav>

      {/* MEGA MENU */}
      <div className={`fixed top-[0px] left-0 w-full bg-white shadow-2xl border-t border-gray-100 z-[1000] menu-dropdown ${menuAberto === 'veiculos' ? 'menu-dropdown-ativo' : ''}`}>
          <VehiclesMenu onClose={() => setMenuAberto(null)} />
      </div>

      {/* SIDEBAR MOBILE */}
      <div className={`fixed inset-0 bg-black/60 z-[2000] backdrop-blur-sm transition-opacity duration-500 ${sidebarOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`} onClick={() => setSidebarOpen(false)}></div>

      <div className={`fixed top-0 left-0 h-full w-[300px] bg-white z-[2001] shadow-2xl transform transition-transform duration-500 ease-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex justify-between items-center p-6 border-b border-gray-100 h-16">
          <a href="/">
             <img src={LOGO_SIDEBAR} alt="Logo" className="h-14 w-auto object-contain" />
          </a>
          <button onClick={() => setSidebarOpen(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
            <X size={20} className="text-gray-600"/>
          </button>
        </div>
        <div className="p-8 space-y-8 overflow-y-auto h-full pb-24">
          <div className="space-y-6">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Menu</p>
            <Link href="/login" className="flex items-center gap-4 text-blue-600 font-bold text-sm uppercase tracking-wide">
              <User size={18}/> Fazer Login
            </Link>
            <Link href="/admin" className="flex items-center gap-4 text-red-600 font-bold text-sm uppercase tracking-wide">
              <LayoutDashboard size={18}/> Painel Admin
            </Link>
          </div>
        </div>
      </div> 
    </>
  );
}