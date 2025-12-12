"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { formatCurrency } from "@/lib/utils"

const CATEGORIES = [
  { id: 'eletrico', label: 'Elétricos', keywords: ['Bolt', 'EUV'] },
  { id: 'suv', label: 'SUVs', keywords: ['Tracker', 'Equinox', 'Trailblazer'] },
  { id: 'picape', label: 'Picapes', keywords: ['S10', 'Silverado', 'Montana'] },
  { id: 'hatch', label: 'Hatchs e Sedans', keywords: ['Onix', 'Cruze'] },
  { id: 'esportivo', label: 'Esportivos', keywords: ['Camaro', 'Corvette'] },
]

export default function VehiclesMenu({ onClose }: { onClose: () => void }) {
  const [activeCategory, setActiveCategory] = useState('picape') 
  const [vehicles, setVehicles] = useState<any[]>([])
  const [isAnimating, setIsAnimating] = useState(false) 

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase.from('vehicles').select('*').eq('is_active', true)
      if (data) setVehicles(data)
    }
    fetchData()
  }, [])

  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 50); 
    return () => clearTimeout(timer);
  }, [activeCategory]);

  const filteredVehicles = vehicles.filter(car => {
    const category = CATEGORIES.find(c => c.id === activeCategory)
    return category?.keywords.some(k => car.model.includes(k))
  })

  return (
    <>
        {/* 1. O FUNDO ESCURO (OVERLAY) */}
        {/* Ele aparece suavemente (fade-in) atrás do menu e cobre o site todo */}
        <div 
            onClick={onClose}
            className="fixed inset-0 top-16 bg-black/40 backdrop-blur-sm z-30 animate-in fade-in duration-500"
        ></div>

        {/* 2. O MENU BRANCO (PAINEL) */}
        {/* Ele desliza de cima para baixo (slide-in-from-top) com elasticidade (ease-out) */}
        <div className="absolute top-16 left-0 w-full bg-white border-b border-gray-200 shadow-2xl z-40 py-10 animate-in slide-in-from-top-10 fade-in duration-500 ease-out origin-top">
        
            <div className="max-w-[1400px] mx-auto px-6 flex min-h-[350px]">
                
                {/* LADO ESQUERDO: CATEGORIAS */}
                <div className="w-64 border-r border-gray-100 pr-8 space-y-2">
                {CATEGORIES.map((cat, index) => (
                    <button
                    key={cat.id}
                    onMouseEnter={() => setActiveCategory(cat.id)}
                    className={`block w-full text-left text-sm font-bold uppercase tracking-wide transition-all duration-300 p-4 rounded-lg flex items-center justify-between group ${
                        activeCategory === cat.id 
                        ? 'text-gray-900 bg-gray-50 translate-x-2 border-l-4 border-yellow-500 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                    // Cascata na entrada das categorias
                    style={{ animationDelay: `${index * 0.05}s` }} 
                    >
                    {cat.label}
                    {/* Seta pequena que aparece ao passar o mouse */}
                    <span className={`opacity-0 transition-opacity ${activeCategory === cat.id ? 'opacity-100' : 'group-hover:opacity-50'}`}>›</span>
                    </button>
                ))}
                </div>

                {/* LADO DIREITO: CARROS */}
                <div className="flex-1 pl-12">
                    {!isAnimating && (
                        <div className="grid grid-cols-4 gap-8">
                            {filteredVehicles.length > 0 ? (
                                filteredVehicles.map((car, index) => (
                                    <div 
                                        key={car.id} 
                                        className="text-center group animate-in fade-in slide-in-from-left-2 duration-500 fill-mode-forwards"
                                        style={{ animationDelay: `${index * 0.05}s` }} 
                                    >
                                        {/* Imagem do Carro */}
                                        <div className="h-32 flex items-center justify-center mb-4 relative cursor-pointer">
                                            {/* Bolinha de fundo ao passar o mouse */}
                                            <div className="absolute inset-0 bg-gray-100 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300 ease-out -z-10"></div>
                                            
                                            <Link href={`/carros/${car.id}`} onClick={onClose}>
                                                <img 
                                                    src={car.image_url} 
                                                    alt={car.model} 
                                                    className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-110 group-hover:-translate-y-2 drop-shadow-sm group-hover:drop-shadow-xl"
                                                />
                                            </Link>
                                        </div>
                                        
                                        {/* Info */}
                                        <h4 className="font-bold text-gray-900 text-sm mb-1 uppercase tracking-tight group-hover:text-yellow-600 transition-colors">
                                            {car.model}
                                        </h4>
                                        <p className="text-[10px] text-gray-500 mb-3 font-medium">
                                            A partir de {formatCurrency(car.price)}
                                        </p>
                                        
                                        {/* Link */}
                                        <Link 
                                            href={`/carros/${car.id}`} 
                                            onClick={onClose}
                                            className="text-yellow-600 text-xs font-bold uppercase tracking-widest hover:text-yellow-500 transition-colors border-b border-transparent hover:border-yellow-500 pb-0.5"
                                        >
                                            Saiba mais
                                        </Link>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-4 flex flex-col items-center justify-center text-gray-300 py-12 animate-in fade-in">
                                    <p className="uppercase tracking-widest text-xs font-bold">Categoria indisponível</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

            </div>
        </div>
    </>
  )
}