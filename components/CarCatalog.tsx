"use client"
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ArrowRight, ImageOff } from 'lucide-react' // Adicionei ImageOff
import Link from 'next/link'

export default function CarCatalog() {
  const [vehicles, setVehicles] = useState<any[]>([])
  // Começamos carregando
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCars() {
      try {
        const { data, error } = await supabase
          .from('vehicles')
          .select('*, categories(name, slug)')
          .order('price_start', { ascending: true })
        
        if (error) throw error; // Se der erro no banco, joga pro catch
        if (data) setVehicles(data)

      } catch (err) {
        console.error("Erro ao carregar catálogo:", err)
        // Aqui você poderia colocar um toast de erro se quisesse
      } finally {
        // O segredo: Loading SEMPRE vira false, aconteça o que acontecer.
        setLoading(false)
      }
    }
    fetchCars()
  }, [])

  return (
    <section id="catalogo" className="py-24 px-6 bg-white border-t border-gray-100 scroll-mt-20">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl font-light text-gray-900 mb-16 uppercase tracking-tight">
          Nossos <span className="font-bold">Veículos</span>
        </h2>

        {/* LOADING STATE: Esqueletos pulsando em vez de spinner */}
        {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
               {[1,2,3].map(i => (
                 <div key={i} className="h-96 bg-gray-100 rounded-2xl animate-pulse"/>
               ))}
            </div>
        ) : vehicles.length === 0 ? (
           <p className="text-center text-gray-400">Nenhum veículo disponível.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-20">
            {vehicles.map((car) => (
              <div key={car.id} className="group flex flex-col">
                
                {/* ÁREA DA IMAGEM BLINDADA */}
                <div className="relative aspect-[16/10] bg-[#f9f9f9] rounded-2xl overflow-hidden mb-8 border border-gray-50 transition-all duration-500 group-hover:shadow-xl group-hover:shadow-gray-100 group-hover:border-gray-200">
                  {car.image_url ? (
                    <img 
                      src={car.image_url} 
                      alt={car.model_name} 
                      loading="lazy"
                      className="w-full h-full object-contain p-8 group-hover:scale-105 transition-transform duration-700 ease-in-out"
                      // Se a imagem falhar (ORB error), ela se esconde e mostra o ícone de fallback
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  
                  {/* Fallback Icon (Escondido por padrão, aparece se der erro) */}
                  <div className={`absolute inset-0 flex items-center justify-center text-gray-300 ${car.image_url ? 'hidden' : ''}`}>
                    <ImageOff size={48} />
                  </div>
                </div>

                {/* Textos */}
                <div className="flex-1">
                  <p className="text-[10px] font-black text-[#f2e14c] bg-black inline-block px-2 py-0.5 uppercase mb-3 tracking-[0.2em]">
                    {car.categories?.name || "Chevrolet"}
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

                {/* Botão */}
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
        )}
      </div>
    </section>
  )
}