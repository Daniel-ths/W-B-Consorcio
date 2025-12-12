"use client"

import Link from "next/link";
import { Settings } from "lucide-react";

export default function HeroButtons() {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
        {/* Botão Ver Ofertas */}
        <Link href="#estoque" className="bg-blue-600 text-white px-8 py-4 font-bold uppercase tracking-widest text-sm rounded hover:bg-blue-700 transition-colors text-center shadow-lg shadow-blue-200">
            Ver Ofertas
        </Link>
        
        {/* Botão Monte o Seu (Com o clique que estava dando erro) */}
        <button 
            onClick={() => alert("Em breve: Funcionalidade de montar veículo!")} 
            className="bg-white text-gray-900 border-2 border-gray-900 px-8 py-4 font-bold uppercase tracking-widest text-sm rounded hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
        >
            <Settings size={18}/> Monte o Seu
        </button>
    </div>
  )
}