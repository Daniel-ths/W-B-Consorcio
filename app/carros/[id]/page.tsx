import Link from "next/link";
import { ArrowLeft, Calendar, Gauge, Fuel, Zap, Clock, CheckCircle } from "lucide-react";
import Simulator from "@/components/Simulator"; 
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
    ? car.price - (car.price * (car.price / 100)) 
    : car.price;

  return (
    // Fundo branco e texto escuro
    <div className="min-h-screen bg-white text-gray-900 pt-28 pb-20">
      
      <div className="max-w-[1400px] mx-auto px-6 mb-8">
        {/* Link Voltar (Em cor neutra) */}
        <Link href="/" className="inline-flex items-center text-xs font-bold uppercase tracking-[0.2em] text-gray-500 hover:text-black transition-colors gap-2">
          <ArrowLeft size={14} /> Voltar ao Showroom
        </Link>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* ESQUERDA: FOTO E DADOS */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Título */}
          <div className="border-b border-gray-100 pb-8">
            {/* Marca em Amarelo/Gold */}
            <h2 className="text-sm font-bold tracking-[0.3em] text-yellow-600 mb-2 uppercase">{car.brand}</h2>
            <h1 className="text-4xl md:text-6xl font-extrabold uppercase tracking-tight mb-6 text-gray-900">{car.model}</h1>
            
            <div className="flex gap-8 text-sm uppercase tracking-widest text-gray-500 font-bold">
                {/* Ícones em Amarelo/Gold */}
                <span className="flex items-center gap-2"><Calendar size={18} className="text-yellow-500"/> {car.year}</span>
                <span className="flex items-center gap-2"><Gauge size={18} className="text-yellow-500"/> 0 km</span>
                <span className="flex items-center gap-2"><Fuel size={18} className="text-yellow-500"/> Flex</span>
            </div>
          </div>

          {/* Foto Principal */}
          <div className="aspect-[16/9] w-full bg-gray-100 rounded-3xl overflow-hidden shadow-xl relative">
            {car.image_url && <img src={car.image_url} alt={car.model} className="w-full h-full object-cover"/>}
            
{/* Foto Principal */}
          <div className="aspect-[16/9] w-full bg-gray-100 rounded-3xl overflow-hidden shadow-xl relative">
            {car.image_url && <img src={car.image_url} alt={car.model} className="w-full h-full object-cover"/>}
            
            {/* Banner de Promoção em Amarelo/Gold */}
            {isPromoActive && (
                <div className="absolute top-6 right-6 bg-yellow-400 text-black px-4 py-2 font-bold uppercase tracking-widest text-sm shadow-lg rounded flex items-center gap-2 animate-pulse">
                    <Zap size={18} /> Oferta Relâmpago
                </div>
            )}
          </div>
          </div>

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
                            {/* Ícones de Checagem em Verde/Gold */}
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
               
               {/* Preço Box (Fundo Cinza Suave) */}
               <div className="mb-8 p-8 bg-gray-50 rounded-3xl border border-gray-100">
                  {isPromoActive ? (
                      <div className="space-y-2">
                          <div className="flex items-center gap-2 text-yellow-600 mb-2">
                              <Clock size={16} />
                              <span className="text-xs font-bold uppercase tracking-widest">Tempo Limitado</span>
                          </div>
                          <span className="text-lg text-gray-400 line-through block font-medium">
                              {formatCurrency(car.price)}
                          </span>
                          <div className="text-5xl font-bold text-gray-900 tracking-tight">
                            {formatCurrency(finalPrice)}
                          </div>
                          {/* Desconto em Verde para destacar o benefício */}
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

               {/* O componente Simulator já está em Light Mode */}
               <Simulator vehiclePrice={finalPrice} vehicleModel={car.model} />

           </div>
        </div>

      </div>
    </div>
  )
}