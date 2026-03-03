import { supabase } from "@/lib/supabase";
import VehicleBuilder from "@/components/VehicleBuilder"; 
import Link from "next/link";
import { ArrowLeft, Settings } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function BuilderPage({ params }: { params: { id: string } }) {
  // Buscamos os dados reais do carro
  const { data: car } = await supabase.from('vehicles').select('*').eq('id', params.id).single();

  if (!car) return <div className="p-10 text-center">Veículo não encontrado</div>

  return (
    // Mudei para h-screen flex flex-col para o layout ocupar a tela toda sem scroll
    <div className="h-screen w-full bg-white text-gray-900 flex flex-col overflow-hidden">
      
      {/* HEADER (Mantive o seu, mas ajustei para ser fixo no topo da estrutura flex) */}
      <div className="border-b border-gray-100 bg-white z-30 py-4 shadow-sm shrink-0">
        <div className="max-w-[1440px] mx-auto px-6 flex justify-between items-center">
             <Link href="/veiculos" className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black transition-colors gap-2">
                <ArrowLeft size={14} /> Voltar
             </Link>
            <div className="flex items-center gap-2 text-yellow-600 font-bold uppercase tracking-widest text-xs">
                <Settings size={16}/> Modo Configurador
            </div>
        </div>
      </div>

      {/* ÁREA DO CONFIGURADOR (Ocupa o resto da altura) */}
      <div className="flex-1 relative">
         {/* Passamos o carro do banco de dados para o componente */}
         <VehicleBuilder vehicle={car} />
      </div>
    </div>
  )
}