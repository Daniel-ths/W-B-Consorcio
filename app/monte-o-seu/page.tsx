import VehicleBuilder from "@/components/VehicleBuilder";
import Link from "next/link";
import { ArrowLeft, Settings } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

// Força a página a ser dinâmica para sempre buscar dados novos
export const dynamic = 'force-dynamic';

export default async function BuilderPage({ params }: { params: { id: string } }) {
  
  // 1. Criamos um cliente Supabase específico para o Servidor (Server-Side)
  // Isso evita conflitos com o cliente do navegador que configuramos no login
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 2. Busca o carro na tabela correta ('cars')
  // Note que usamos .select() simples
  const { data: car, error } = await supabase
    .from('cars') // <--- Corrigido de 'vehicles' para 'cars'
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !car) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white text-gray-500 font-sans">
            <h1 className="text-2xl font-bold mb-2">Veículo não encontrado</h1>
            <p className="mb-6">O carro que você procura não existe ou foi removido.</p>
            <Link href="/" className="px-6 py-3 bg-black text-white rounded-lg text-sm font-bold uppercase tracking-wide">
                Voltar ao Estoque
            </Link>
        </div>
      )
  }

  // 3. Mapeamento de Dados
  // O componente VehicleBuilder espera 'model', mas o banco tem 'name'.
  // Vamos adaptar aqui:
  const vehicleProps = {
      id: car.id,
      model: car.name, // Adapta 'name' para 'model'
      price: car.price,
      image_url: car.image_url || "https://via.placeholder.com/800x600?text=Sem+Foto"
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 pt-20 font-sans">
      
      {/* Header Fixo Simples */}
      <div className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-40 py-4 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-6 flex justify-between items-center">
             <Link href="/" className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black transition-colors gap-2">
                <ArrowLeft size={14} /> Voltar ao Estoque
            </Link>
            <div className="flex items-center gap-2 text-yellow-600 font-bold uppercase tracking-widest text-xs">
                <Settings size={16}/> Configurador Online
            </div>
        </div>
      </div>

      {/* Carrega o Configurador com os dados do banco */}
      <div className="max-w-[1400px] mx-auto px-0 md:px-6 py-0 md:py-12 h-[calc(100vh-80px)]">
         <VehicleBuilder vehicle={vehicleProps} />
      </div>

    </div>
  )
}