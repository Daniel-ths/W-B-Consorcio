"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

interface VehiclesMenuProps {
  onClose: () => void
}

export default function VehiclesMenu({ onClose }: VehiclesMenuProps) {
  const [categories, setCategories] = useState<any[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [selectedCatId, setSelectedCatId] = useState<number | string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: cats } = await supabase.from('categories').select('*').order('id')
        const { data: vecs } = await supabase.from('vehicles').select('*').order('price_start')

        if (cats && cats.length > 0) {
          const categoriasComSeminovos = [
            ...cats, 
            { id: 'SEMINOVOS', name: 'Seminovos' }
          ];
          setCategories(categoriasComSeminovos)
          setSelectedCatId(cats[0].id)
        }
        if (vecs) {
          setVehicles(vecs)
        }
      } catch (error) {
        console.error("Erro ao buscar menu:", error)
      } finally {
        // Um pequeno delay artificial opcional para a animação não piscar muito rápido (pode remover se quiser mais rápido)
        setTimeout(() => setLoading(false), 500)
      }
    }
    fetchData()
  }, [])

  const filteredVehicles = selectedCatId === 'SEMINOVOS' 
    ? [] 
    : vehicles.filter(v => v.category_id === selectedCatId)

  // --- AQUI ESTÁ A ALTERAÇÃO: SKELETON LOADING ---
  // Em vez de um spinner, mostramos o esqueleto da página pulsando
  if (loading) return (
    <div className="w-full bg-white border-t border-gray-200 shadow-xl pt-16">
      <div className="max-w-[1400px] mx-auto p-10 min-h-[450px] flex">
        
        {/* Skeleton da Esquerda (Menu) */}
        <div className="w-1/4 border-r border-gray-100 pr-8 space-y-2 animate-pulse">
            {[1,2,3,4,5,6].map(i => (
                <div key={i} className="h-12 bg-gray-100 rounded-lg w-full"></div>
            ))}
        </div>

        {/* Skeleton da Direita (Cards) */}
        <div className="w-3/4 pl-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
                {[1,2,3].map(i => (
                     <div key={i} className="flex flex-col items-center space-y-3">
                        {/* Imagem do carro */}
                        <div className="h-32 bg-gray-100 rounded-lg w-full"></div>
                        {/* Nome */}
                        <div className="h-4 bg-gray-100 rounded w-2/3"></div>
                        {/* Preço */}
                        <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                     </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="w-full bg-white border-t border-gray-200 shadow-xl pt-16 animate-in fade-in slide-in-from-top-2 duration-500">
      <div className="max-w-[1400px] mx-auto p-10 min-h-[450px] flex">
        
        {/* --- COLUNA ESQUERDA: LISTA DE CATEGORIAS --- */}
        <div className="w-1/4 border-r border-gray-100 pr-8 space-y-1">
          {categories.map((cat) => (
            <div 
                key={cat.id}
                onMouseEnter={() => setSelectedCatId(cat.id)}
                className={`cursor-pointer px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-wide flex items-center justify-between transition-all 
                ${selectedCatId === cat.id ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-50'}`}
            >
                <span className={cat.id === 'SEMINOVOS' ? "border-l-4 border-transparent pl-0" : ""}>
                    {cat.name}
                </span>
                {selectedCatId === cat.id && <ArrowRight size={16} />}
            </div>
          ))}
        </div>

        {/* --- COLUNA DIREITA: CONTEÚDO --- */}
        <div className="w-3/4 pl-12 flex items-center justify-center">
            
            {selectedCatId === 'SEMINOVOS' ? (
                // BANNER SEMINOVOS
                <div className="animate-in fade-in slide-in-from-left-4 duration-300 w-full flex justify-center">
                    <div className="w-full max-w-2xl bg-gray-50 p-12 text-center rounded-sm">
                        <img src="https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/chevrolet-logo.svg" className="h-8 mx-auto mb-6 opacity-80" alt="Logo"/>
                        <h3 className="text-4xl font-extrabold text-gray-800 uppercase tracking-tighter mb-2">Seminovos</h3>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-8">Qualidade Certificada Chevrolet</p>
                        <div className="flex justify-center gap-4">
                            <Link href="/seminovos" onClick={onClose} className="px-6 py-3 bg-blue-600 text-white text-xs font-bold uppercase tracking-wide hover:bg-blue-700 transition-colors">
                                Ver Estoque
                            </Link>
                            <Link href="/seminovos/premium" onClick={onClose} className="px-6 py-3 border border-gray-300 text-gray-700 text-xs font-bold uppercase tracking-wide hover:bg-gray-200 transition-colors">
                                Linha Premium
                            </Link>
                        </div>
                    </div>
                </div>
            ) : (
                // GRID DE VEÍCULOS
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full animate-in fade-in slide-in-from-left-4 duration-300">
                    {filteredVehicles.length > 0 ? (
                        filteredVehicles.map((car) => (
                            <Link 
                                key={car.id} 
                                href={`/configurador?id=${car.id}`}
                                onClick={onClose}
                                className="group block text-center relative"
                            >
                                <div className="h-32 bg-gray-50 rounded-lg mb-4 flex items-center justify-center overflow-hidden mix-blend-multiply group-hover:bg-gray-100 transition-colors">
                                    <img 
                                        src={car.image_url} 
                                        alt={car.model_name} 
                                        className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                                    />
                                </div>

                                <h4 className="text-sm font-bold text-gray-900 uppercase group-hover:text-blue-600 transition-colors">
                                    {car.model_name}
                                </h4>
                                
                                <p className="text-xs text-gray-500 mt-1 font-semibold">
                                    A partir de {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(car.price_start)}
                                </p>

                                <span className="text-[10px] text-blue-600 font-bold uppercase mt-2 inline-block border-b border-transparent group-hover:border-blue-600">
                                    Saiba mais
                                </span>
                            </Link>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-20 text-gray-400">
                            <p>Nenhum veículo encontrado nesta categoria.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  )
}