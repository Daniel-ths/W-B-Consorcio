import Link from "next/link";
import { ArrowLeft, Calendar, Gauge, Fuel, Zap, Clock } from "lucide-react";
import Simulator from "@/components/Simulator"; 
import { formatCurrency } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

export default async function CarDetailsPage({ params }: { params: { id: string } }) {
  const { data: car } = await supabase.from('vehicles').select('*').eq('id', params.id).single();

  if (!car) return null;

  // Lógica de Promoção: Verifica se existe e se ainda não venceu
  const now = new Date();
  const expiresAt = car.promo_expires_at ? new Date(car.promo_expires_at) : null;
  const isPromoActive = car.promo_percent > 0 && expiresAt && expiresAt > now;

  // Preço Final (Com ou sem desconto)
  const finalPrice = isPromoActive 
    ? car.price - (car.price * (car.promo_percent / 100)) 
    : car.price;

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-20">
      
      <div className="max-w-[1400px] mx-auto px-6 mb-8">
        <Link href="/" className="inline-flex items-center text-xs font-bold uppercase tracking-[0.2em] text-gray-500 hover:text-white transition-colors gap-2">
          <ArrowLeft size={14} /> Voltar ao Showroom
        </Link>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* ESQUERDA: FOTO E DADOS */}
        <div className="lg:col-span-8 space-y-8">
          <div className="border-b border-gray-800 pb-8">
            <h2 className="text-sm font-bold tracking-[0.3em] text-gray-500 mb-2 uppercase">{car.brand}</h2>
            <h1 className="text-5xl md:text-7xl font-bold uppercase tracking-tighter mb-6">{car.model}</h1>
            
            <div className="flex gap-8 text-sm uppercase tracking-widest text-gray-300">
                <span className="flex items-center gap-2"><Calendar size={16}/> {car.year}</span>
                <span className="flex items-center gap-2"><Gauge size={16}/> 0 km</span>
                <span className="flex items-center gap-2"><Fuel size={16}/> Flex</span>
            </div>
          </div>

          <div className="aspect-[16/9] w-full bg-gray-900 relative overflow-hidden">
            {car.image_url && <img src={car.image_url} alt={car.model} className="w-full h-full object-cover"/>}
            
            {/* Tag de Promoção na Foto */}
            {isPromoActive && (
                <div className="absolute top-4 right-4 bg-yellow-500 text-black px-4 py-2 font-bold uppercase tracking-widest text-sm shadow-xl flex items-center gap-2 animate-pulse">
                    <Zap size={18} fill="black" /> Oferta Relâmpago
                </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div>
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-6 border-b border-gray-800 pb-2">Detalhes</h3>
                <p className="text-gray-300 leading-loose font-light text-justify">
                    {car.description || "Veículo premium selecionado."}
                </p>
            </div>
            <div>
                 {/* Opcionais... */}
            </div>
          </div>
        </div>

        {/* DIREITA: PREÇO E SIMULADOR */}
        <div className="lg:col-span-4 space-y-8">
           <div className="sticky top-24">
               
               {/* BLOCO DE PREÇO DINÂMICO */}
               <div className="mb-8 bg-neutral-900/30 p-6 border border-white/5 backdrop-blur">
                  
                  {isPromoActive ? (
                      <div className="space-y-2">
                          <div className="flex items-center gap-2 text-yellow-500 mb-2">
                              <Clock size={16} />
                              <span className="text-xs font-bold uppercase tracking-widest">Tempo Limitado</span>
                          </div>
                          
                          {/* Preço Antigo Riscado */}
                          <span className="text-lg text-gray-500 line-through block">
                              {formatCurrency(car.price)}
                          </span>
                          
                          {/* Preço Novo Gigante */}
                          <div className="text-5xl font-bold text-white tracking-tight text-yellow-400">
                            {formatCurrency(finalPrice)}
                          </div>
                          <p className="text-xs text-gray-400 uppercase tracking-wider mt-2">
                              Desconto de {car.promo_percent}% aplicado
                          </p>
                      </div>
                  ) : (
                      // Preço Normal
                      <div>
                          <span className="text-xs font-bold uppercase tracking-widest text-gray-500 block mb-2">Valor à Vista</span>
                          <div className="text-5xl font-light text-white">
                            {formatCurrency(car.price)}
                          </div>
                      </div>
                  )}
               </div>

               {/* Simulador (Passando o preço final, com desconto se houver) */}
               <Simulator vehiclePrice={finalPrice} vehicleModel={car.model} />

           </div>
        </div>

      </div>
    </div>
  )
}