"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Loader2, ArrowRight } from "lucide-react"
import Link from "next/link"

interface VehiclesMenuProps {
  onClose: () => void
}

export default function VehiclesMenu({ onClose }: VehiclesMenuProps) {
  const [categories, setCategories] = useState<any[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: cats } = await supabase.from('categories').select('*').order('id')
        const { data: vecs } = await supabase.from('vehicles').select('*').order('price_start')

        if (cats && cats.length > 0) {
          setCategories(cats)
          setSelectedCatId(cats[0].id)
        }
        if (vecs) {
          setVehicles(vecs)
        }
      } catch (error) {
        console.error("Erro ao buscar menu:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filteredVehicles = vehicles.filter(v => v.category_id === selectedCatId)

  if (loading) return (
    <div className="flex justify-center items-center h-64 pt-20">
      <Loader2 className="animate-spin text-gray-400" />
    </div>
  )

  return (
    // Mantive o pt-24 para respeitar a altura do Navbar
    <div className="container mx-auto px-6 pt-24 pb-12 h-[80vh] overflow-y-auto">
      
      <div className="flex flex-col md:flex-row gap-8 h-full">
        
        {/* --- COLUNA ESQUERDA: LISTA DE CATEGORIAS --- */}
        <aside className="w-full md:w-1/4 border-r border-gray-100 pr-6">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Categorias</h3>
          <ul className="space-y-2">
            {categories.map((cat) => (
              <li key={cat.id}>
                <button
                  onClick={() => setSelectedCatId(cat.id)}
                  className={`text-lg font-bold uppercase tracking-tight w-full text-left transition-all duration-200 px-4 py-3 rounded-lg flex justify-between items-center
                    ${selectedCatId === cat.id 
                      ? 'bg-gray-100 text-black translate-x-2' 
                      : 'text-gray-500 hover:text-black hover:bg-gray-50'
                    }`}
                >
                  {cat.name}
                  {selectedCatId === cat.id && <ArrowRight size={16} />}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* --- COLUNA DIREITA: GRID DE CARROS --- */}
        <main className="flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-right-4 duration-500">
            {filteredVehicles.length > 0 ? (
              filteredVehicles.map((car) => (
                <Link 
                  key={car.id} 
                  href={`/configurador?id=${car.id}`}
                  onClick={onClose}
                  className="group block bg-white rounded-xl p-4 hover:shadow-xl transition-all border border-transparent hover:border-gray-100"
                >
                  {/* Imagem */}
                  <div className="aspect-[16/9] mb-4 overflow-hidden mix-blend-multiply">
                    <img 
                      src={car.image_url} 
                      alt={car.model_name} 
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  {/* Textos */}
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg leading-tight mb-1">{car.model_name}</h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">A partir de</p>
                    
                    {/* PREÇO EM CINZA (ALTERADO) */}
                    <p className="text-sm font-bold text-gray-600 mb-2">
                       {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(car.price_start)}
                    </p>

                    {/* SAIBA MAIS EM AZUL (ADICIONADO) */}
                    <p className="text-xs font-bold text-blue-600 uppercase tracking-widest group-hover:underline">
                      Saiba mais
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-20 text-gray-400">
                <p>Nenhum veículo encontrado nesta categoria.</p>
              </div>
            )}
          </div>
        </main>

      </div>
    </div>
  )
}