"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Menu, X, ShoppingBag, LayoutDashboard } from "lucide-react";
import VehiclesMenu from "./VehiclesMenu";

const LOGO_NAVBAR = "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/chevrolet-logo.svg";

export default function Navbar() {
  const [menuAberto, setMenuAberto] = useState<string | null>(null);
  
  // SEM LÓGICA DE USUÁRIO
  // SEM USEEFFECT
  // SEM SUPABASE

  return (
    <>
      <nav className="fixed w-full z-[1001] top-0 bg-[#f8f8f8] border-b border-gray-200 h-16 flex items-center justify-between px-6 lg:px-12 shadow-sm font-sans">
        
        {/* MENU VEÍCULOS */}
        <div className="flex items-center gap-6">
          <div className="hidden md:flex gap-6 items-center">
            <button onClick={() => setMenuAberto(menuAberto ? null : 'veiculos')} className="text-xs font-bold uppercase flex items-center gap-1">
              {menuAberto ? <X size={16}/> : <Menu size={16}/>} Veículos
            </button>
          </div>
        </div>

        {/* LOGO */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <Link href="/"><img src={LOGO_NAVBAR} alt="Logo" className="h-8 w-auto object-contain" /></Link>
        </div>

        {/* BOTÃO DE EMERGÊNCIA PARA O FUNCIONÁRIO */}
        <div className="flex items-center gap-6">
          <Link href="/admin" className="bg-red-600 text-white px-4 py-2 rounded font-bold text-xs flex items-center gap-2">
             <LayoutDashboard size={16}/> ACESSAR PAINEL
          </Link>
        </div>
      </nav>

      {/* MENU DROP */}
      {menuAberto && (
        <div className="fixed top-[64px] left-0 w-full bg-white shadow-xl z-[1000]">
          <VehiclesMenu onClose={() => setMenuAberto(null)} />
        </div>
      )}
    </>
  );
}