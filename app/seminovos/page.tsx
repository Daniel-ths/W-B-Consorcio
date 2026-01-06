"use client"

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

// URL base do seu Supabase
const BASE_URL = "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/";

// Logo URL
const LOGO_URL = `${BASE_URL}logo semi novos.webp?v=8`;

const BRANDS = [
  { name: 'CHEVROLET', file: 'chevrolet.webp?v=3' }, 
  { name: 'VOLKSWAGEN', file: 'volkswagen.webp?v=3' }, 
  { name: 'RENAULT', file: 'renault.webp?v=3' },
  { name: 'FORD', file: 'ford.webp?v=3' },
  { name: 'HYUNDAI', file: 'hyundai.webp?v=3' },
  { name: 'TOYOTA', file: 'toyota.webp?v=3' },
  { name: 'NISSAN', file: 'nissan.webp?v=3' },
  { name: 'HONDA', file: 'honda.webp?v=3' },
  { name: 'FIAT', file: 'fiat.webp?v=3' },
  { name: 'JEEP', file: 'jeep.webp?v=3' },
  { name: 'CITROËN', file: 'citroen.webp?v=3' },
  { name: 'PEUGEOT', file: 'peugeot.webp?v=3' },
];

export default function SeminovosPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredBrands = BRANDS.filter((brand) =>
    brand.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col">
      
      {/* pt-16: Altura exata da Navbar (remove o buraco entre header e amarelo)
         pb-8: Distância menor para o footer 
      */}
      <main className="flex-grow pt-16 pb-8">
        
        {/* BARRA DE TOPO (Restaurada para py-6 original) */}
        <div className="bg-[#f2e14c] w-full py-6 px-6 shadow-md mb-8">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                
                <div className="flex items-center gap-8 w-full md:w-auto justify-center md:justify-start">
                    
                    {/* --- LOGO REDUZIDA PELA METADE --- */}
                    <div className="flex items-center"> 
                        <img 
                            src={LOGO_URL} 
                            // h-4 (mobile) e h-8 (desktop) -> Metade do tamanho anterior
                            className="h-4 md:h-8 w-auto object-contain" 
                            alt="Logo Seminovos"
                        />
                    </div>

                    {/* Links Centrais */}
                    <div className="hidden md:flex gap-8 text-sm font-bold text-black uppercase tracking-wide items-center h-full">
                        <Link href="#" className="hover:underline">Comprar Carro</Link>
                        <Link href="#" className="hover:underline opacity-60">Vender Meu Carro</Link>
                    </div>
                </div>

                {/* Busca */}
                <div className="relative w-full max-w-md group">
                    <input 
                        type="text" 
                        placeholder="Buscar por marca..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-4 pr-12 py-3 bg-white/90 border-none focus:ring-2 focus:ring-black/10 focus:bg-white placeholder-gray-500 text-sm font-bold uppercase text-gray-800 rounded-sm shadow-inner transition-all duration-300"
                    />
                    <button className="absolute right-1 top-1 bottom-1 w-10 bg-[#333] text-white flex items-center justify-center hover:bg-black transition-colors rounded-sm group-hover:scale-105 duration-300">
                        <Search size={18} />
                    </button>
                </div>
            </div>
        </div>

        {/* CONTAINER DO GRID */}
        <div className="max-w-6xl mx-auto px-6">
            
            {/* TÍTULO */}
            <div className="text-center mb-10">
                <h2 className="text-xl font-bold text-gray-800 uppercase inline-block border-b-4 border-[#f2e14c] pb-2 px-6 tracking-wide">
                    Veículos por marca
                </h2>
            </div>

            {/* GRID DE MARCAS (Restaurado para h-48 original) */}
            {filteredBrands.length > 0 ? (
                <div 
                    key={searchTerm}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 place-content-center"
                >
                    {filteredBrands.map((brand, index) => (
                        <div 
                            key={brand.name} 
                            style={{ animationDelay: `${index * 75}ms`, animationFillMode: 'both' }}
                            // Mantido h-48 (Altura original dos cards)
                            className="h-48 bg-[#f2e14c] relative overflow-hidden group cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-in fade-in slide-in-from-bottom-10 duration-500 ease-out"
                        >
                            <div className="absolute top-4 left-5 z-20">
                                <span className="text-black text-sm font-black uppercase tracking-widest">
                                    {brand.name}
                                </span>
                            </div>

                            <div className="absolute bottom-[-5%] right-[-10%] w-[105%] h-[95%] z-10 transition-transform duration-500 transform scale-110 group-hover:scale-115 origin-bottom-right">
                                <img 
                                    src={`${BASE_URL}${brand.file}`} 
                                    alt={brand.name} 
                                    className="w-full h-full object-contain object-bottom"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <p className="text-xl font-bold text-gray-400 uppercase tracking-widest mb-4">Nenhuma marca encontrada</p>
                    <button 
                        onClick={() => setSearchTerm("")}
                        className="px-6 py-2 bg-gray-100 hover:bg-[#f2e14c] text-gray-800 font-bold uppercase text-xs tracking-wider rounded transition-colors"
                    >
                        Limpar busca
                    </button>
                </div>
            )}

        </div>
      </main>
      
    </div>
  )
}