"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

// --- SEUS DADOS ORIGINAIS DO CARROSSEL (VISUAL TOPO) ---
const CATEGORIES = [
  {
    id: "eletricos",
    label: "Elétricos",
    carImage: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/captiva-desk.avif", 
    link: "/eletricos"
  },
  {
    id: "picapes",
    label: "Picapes",
    carImage: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/carrocel-card.avif",
    link: "/picapes"
  },
  {
    id: "hatches",
    label: "Hatches e Sedans",
    carImage: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/spin.avif",
    link: "/hatches"
  },
  {
    id: "esportivos",
    label: "Esportivos",
    carImage: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/camaro%20(1).avif",
    link: "/esportivos"
  }
];

export default function VehicleDiscovery() {
  const [activeTab, setActiveTab] = useState("Elétricos");
  const [isAnimating, setIsAnimating] = useState(false);

  // Estados para os dados do Banco
  const [dbVehicles, setDbVehicles] = useState<any[]>([]);
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- 1. BUSCA DADOS REAIS DO SUPABASE ---
  useEffect(() => {
    async function fetchData() {
      try {
        const { data: cats } = await supabase.from('categories').select('*');
        const { data: vecs } = await supabase.from('vehicles')
          .select('id, model_name, image_url, price_start, category_id')
          .eq('is_visible', true);

        if (cats) setDbCategories(cats);
        if (vecs) setDbVehicles(vecs);
      } catch (err) {
        console.error("Erro ao buscar veículos", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // --- 2. FILTRA OS VEÍCULOS REAIS PELA ABA ATIVA ---
  const activeDbCategory = dbCategories.find(c => 
    c.name.toLowerCase().includes(activeTab.toLowerCase()) || 
    activeTab.toLowerCase().includes(c.name.toLowerCase())
  );

  const filteredVehicles = activeDbCategory 
    ? dbVehicles.filter(v => v.category_id === activeDbCategory.id)
    : [];

  const currentCategory = CATEGORIES.find(c => c.label === activeTab) || CATEGORIES[0];

  const handleTabChange = (label: string) => {
    if (label === activeTab) return;
    setIsAnimating(true);
    setActiveTab(label);
    setTimeout(() => setIsAnimating(false), 600);
  };

  return (
    <section className="py-20 md:py-32 bg-white overflow-hidden font-sans">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* =========================================================
            PARTE 1: SEU CARROSSEL ORIGINAL (VISUAL GRANDE)
           ========================================================= */}
        
        {/* CABEÇALHO */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-4xl md:text-5xl font-light text-gray-900 mb-10 tracking-tight">
            Sua viagem começa aqui
          </h2>

          {/* MENU DE ABAS */}
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 border-b border-gray-200 w-full max-w-4xl mx-auto px-4">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleTabChange(cat.label)}
                className={`pb-5 text-sm md:text-base font-bold uppercase tracking-widest transition-all duration-300 border-b-[4px] 
                  ${activeTab === cat.label 
                    ? "border-blue-600 text-blue-600" 
                    : "border-transparent text-gray-400 hover:text-gray-900 hover:border-gray-300"
                  }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* ÁREA VISUAL PRINCIPAL (CARRO FLUTUANDO) */}
        <div className="relative w-full flex flex-col items-center justify-center mt-4">
            
            <div className={`relative z-20 w-full flex justify-center items-center transition-all duration-700 ease-out transform ${isAnimating ? 'translate-x-20 opacity-0 blur-md' : 'translate-x-0 opacity-100 blur-0'}`}>
                <div className="relative w-full md:w-[95%] lg:w-[92%] aspect-[16/9] lg:aspect-[21/9] xl:aspect-[24/9]">
                    <img 
                        src={currentCategory.carImage} 
                        alt={currentCategory.label} 
                        // REMOVIDO: drop-shadow-[...] pois a imagem já tem sombra
                        className="w-full h-full object-contain" 
                    />
                </div>
            </div>

            <div className="z-30 transition-all duration-700 delay-100 transform translate-y-0 -mt-8 md:-mt-12 lg:-mt-16">
                 <Link 
                    href={currentCategory.link}
                    className="group bg-blue-600 text-white pl-8 pr-6 py-4 rounded-full text-sm font-bold uppercase tracking-widest flex items-center gap-3 hover:bg-blue-700 transition-all shadow-2xl hover:shadow-blue-900/30 hover:-translate-y-1"
                 >
                    Ver Ofertas 
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform stroke-[3]"/>
                 </Link>
            </div>

        </div>

        {/* =========================================================
            PARTE 2: MINI CARDS DOS VEÍCULOS REAIS (EMBAIXO)
           ========================================================= */}
        
        <div className="mt-24 border-t border-gray-100 pt-16">
            <h3 className="text-2xl font-light text-gray-800 mb-8 text-center uppercase tracking-wide">
                Modelos {activeTab} Disponíveis
            </h3>

            {loading ? (
                <div className="flex justify-center p-10"><Loader2 className="animate-spin text-gray-300"/></div>
            ) : filteredVehicles.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 px-4">
                    {filteredVehicles.map((vehicle) => (
                        <div key={vehicle.id} className="group bg-white rounded-2xl p-6 border border-gray-100 hover:border-blue-100 hover:shadow-xl transition-all duration-300 flex flex-col items-center">
                            
                            {/* Imagem do Mini Card */}
                            <div className="w-full h-32 mb-4 flex items-center justify-center overflow-hidden">
                                <img 
                                    src={vehicle.image_url} 
                                    alt={vehicle.model_name} 
                                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                                />
                            </div>

                            {/* Nome e Preço */}
                            <h4 className="text-lg font-black uppercase text-gray-900 mb-1 text-center">{vehicle.model_name}</h4>
                            <p className="text-xs text-gray-500 font-bold mb-6">
                                A partir de <span className="text-gray-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(vehicle.price_start)}</span>
                            </p>

                            {/* Botão Saber Mais */}
                            <Link 
                                href={`/configurador?id=${vehicle.id}`}
                                className="mt-auto text-xs font-bold uppercase tracking-widest text-blue-600 border border-blue-600 px-6 py-3 rounded-full hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2"
                            >
                                Saiba Mais
                                <ArrowRight size={14} />
                            </Link>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 text-gray-400">
                    <p>Nenhum veículo cadastrado nesta categoria ainda.</p>
                </div>
            )}
        </div>

      </div>
    </section>
  );
}