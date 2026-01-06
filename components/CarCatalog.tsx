"use client"
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function CarCatalog() {
  const [vehicles, setVehicles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCars() {
      // Busca veículos e suas categorias
      const { data } = await supabase
        .from('vehicles')
        .select('*, categories(name, slug)')
        .order('price_start', { ascending: true }) // Ordena do mais barato para o mais caro
      
      if (data) setVehicles(data)
      setLoading(false)
    }
    fetchCars()
  }, [])

  if (loading) return <div className="py-20 text-center">Carregando estoque...</div>

  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-12 uppercase tracking-tight">
          Nossos Veículos
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {vehicles.map((car) => (
            <div key={car.id} className="group cursor-pointer">
              {/* Card de Imagem */}
              <div className="relative aspect-[4/3] bg-gray-50 rounded-2xl overflow-hidden mb-6 border border-gray-100 group-hover:border-gray-300 transition-all">
                <img 
                  src={car.image_url} 
                  alt={car.model_name} 
                  className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500" 
                />
              </div>

              {/* Informações */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-1 tracking-wider">
                  {car.categories?.name}
                </p>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {car.model_name}
                </h3>
                <p className="text-lg text-gray-600 font-light mb-6">
                  A partir de <span className="font-semibold text-gray-900">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(car.price_start)}
                  </span>
                </p>

                {/* Botão */}
                <Link 
                   href={`/configurador?id=${car.id}`} // Envia para o configurador
                   className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest border-b-2 border-transparent group-hover:border-black pb-1 transition-all"
                >
                  Configure o seu <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}