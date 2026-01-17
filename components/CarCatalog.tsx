"use client"
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ArrowRight, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function CarCatalog() {
  const [vehicles, setVehicles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCars() {
      const { data } = await supabase
        .from('vehicles')
        .select('*, categories(name, slug)')
        .order('price_start', { ascending: true })
      
      if (data) setVehicles(data)
      setLoading(false)
    }
    fetchCars()
  }, [])

  if (loading) return <div className="py-20 text-center text-gray-400 flex justify-center"><Loader2 className="animate-spin"/></div>

  return (
    <section id="catalogo" className="py-24 px-6 bg-white border-t border-gray-100 scroll-mt-20">
      <div className="max-w-7xl mx-auto">
        {/* Título com a fonte light e tracking elegante do original */}
        <h2 className="text-4xl font-light text-gray-900 mb-16 uppercase tracking-tight">
          Nossos <span className="font-bold">Veículos</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-20">
          {vehicles.map((car) => (
            <div key={car.id} className="group flex flex-col">
              
              {/* Moldura da Imagem - Mantendo o arredondado suave e fundo cinza claro */}
              <div className="relative aspect-[16/10] bg-[#f9f9f9] rounded-2xl overflow-hidden mb-8 border border-gray-50 transition-all duration-500 group-hover:shadow-xl group-hover:shadow-gray-100 group-hover:border-gray-200">
                <img 
                  src={car.image_url} 
                  alt={car.model_name} 
                  className="w-full h-full object-contain p-8 group-hover:scale-105 transition-transform duration-700 ease-in-out" 
                />
              </div>

              {/* Textos - Hierarquia limpa */}
              <div className="flex-1">
                <p className="text-[10px] font-black text-[#f2e14c] bg-black inline-block px-2 py-0.5 uppercase mb-3 tracking-[0.2em]">
                  {car.categories?.name}
                </p>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">
                  {car.model_name}
                </h3>
                
                <div className="flex flex-col mb-8">
                  <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">A partir de</span>
                  <span className="text-xl text-gray-900 font-light">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(car.price_start)}
                  </span>
                </div>
              </div>

              {/* Botão de Link Estilo "Clean" do anterior */}
              <div className="mt-auto">
                <Link 
                   href={`/configurador?id=${car.id}`} 
                   className="inline-flex items-center gap-3 text-xs font-black uppercase tracking-[0.2em] text-gray-900 border-b border-gray-200 pb-2 hover:border-black transition-all group-hover:gap-5"
                >
                  Monte o seu <ArrowRight size={14} className="text-[#f2e14c]" />
                </Link>
              </div>

            </div>
          ))}
        </div>
      </div>
    </section>
  )
}