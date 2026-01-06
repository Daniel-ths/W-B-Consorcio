import Link from "next/link";
import { ArrowLeft, Calendar, Gauge, Fuel, CheckCircle } from "lucide-react";
import Simulator from "@/components/Simulator"; 
import CarShowcase from "@/components/CarShowcase"; // <--- Importe o novo componente
import { formatCurrency } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

export default async function CarDetailsPage({ params }: { params: { id: string } }) {
  const { data: car } = await supabase.from('vehicles').select('*').eq('id', params.id).single();

  if (!car) return null;

  // Lógica de Promoção
  const now = new Date();
  const expiresAt = car.promo_expires_at ? new Date(car.promo_expires_at) : null;
  const isPromoActive = car.promo_percent > 0 && expiresAt && expiresAt > now;

  const finalPrice = isPromoActive 
    ? car.price - (car.price * (car.promo_percent / 100)) 
    : car.price;

  return (
    <div className="min-h-screen bg-white text-gray-900 pt-28 pb-20">
      
      <div className="max-w-[1400px] mx-auto px-6 mb-8">
        <Link href="/" className="inline-flex items-center text-xs font-bold uppercase tracking-[0.2em] text-gray-500 hover:text-black transition-colors gap-2">
          <ArrowLeft size={14} /> Voltar ao Showroom
        </Link>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* ESQUERDA: FOTO (AGORA COM CORES) E DADOS */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Título */}
          <div className="border-b border-gray-100 pb-8">
            <h2 className="text-sm font-bold tracking-[0.3em] text-yellow-600 mb-2 uppercase">{car.brand}</h2>
            <h1 className="text-4xl md:text-6xl font-extrabold uppercase tracking-tight mb-6 text-gray-900">{car.model}</h1>
            
            <div className="flex gap-8 text-sm uppercase tracking-widest text-gray-500 font-bold">
                <span className="flex items-center gap-2"><Calendar size={18} className="text-yellow-500"/> {car.year}</span>
                <span className="flex items-center gap-2"><Gauge size={18} className="text-yellow-500"/> 0 km</span>
                <span className="flex items-center gap-2"><Fuel size={18} className="text-yellow-500"/> Flex</span>
            </div>
          </div>

          {/* NOVO COMPONENTE DE VITRINE (Substitui a <img> antiga) */}
          <CarShowcase 
             initialImage={car.image_url} 
             model={car.model} 
             colors={car.colors} // Passamos as cores do banco
             isPromoActive={Boolean(isPromoActive)}
          />

          {/* Descrição e Itens */}
          <div className="grid md:grid-cols-2 gap-12 pt-4">
            <div>
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-6 border-b border-gray-100 pb-2">Sobre o Veículo</h3>
                <p className="text-gray-600 leading-loose text-justify">
                    {car.description || "Veículo selecionado com rigoroso padrão de qualidade WB Auto."}
                </p>
            </div>
            
            <div>
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-6 border-b border-gray-100 pb-2">Destaques</h3>
                <div className="grid grid-cols-1 gap-3">
                    {car.features?.map((item: string, index: number) => (
                        <div key={index} className="flex items-center gap-3 text-sm font-bold text-gray-700 uppercase tracking-wide bg-gray-50 p-3 rounded-lg">
                            <CheckCircle size={16} className="text-yellow-600" />
                            {item}
                        </div>
                    ))}
                </div>
            </div>
          </div>
        </div>

        {/* DIREITA: PREÇO E SIMULADOR */}
        <div className="lg:col-span-4 space-y-8">
           <div className="sticky top-28">
               
               {/* Preço Box */}
               <div className="mb-8 p-8 bg-gray-50 rounded-3xl border border-gray-100 shadow-sm">
                  {isPromoActive ? (
                      <div className="space-y-2">
                          <span className="text-xs font-bold uppercase tracking-widest text-red-500 block mb-1">Preço Promocional</span>
                          <span className="text-lg text-gray-400 line-through block font-medium">
                              {formatCurrency(car.price)}
                          </span>
                          <div className="text-5xl font-bold text-gray-900 tracking-tight">
                            {formatCurrency(finalPrice)}
                          </div>
                          <p className="text-xs text-green-700 font-bold uppercase tracking-wider mt-2 bg-green-100 inline-block px-2 py-1 rounded">
                              -{car.promo_percent}% OFF
                          </p>
                      </div>
                  ) : (
                      <div>
                          <span className="text-xs font-bold uppercase tracking-widest text-gray-500 block mb-2">Valor à Vista</span>
                          <div className="text-5xl font-bold text-gray-900 tracking-tight">
                            {formatCurrency(car.price)}
                          </div>
                      </div>
                  )}
               </div>

               <Simulator vehiclePrice={finalPrice} vehicleModel={car.model} />

           </div>
        </div>

      </div>
    </div>
  )
}