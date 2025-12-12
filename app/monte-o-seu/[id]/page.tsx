import { supabase } from "@/lib/supabase";
import VehicleBuilder from "@/components/VehicleBuilder"; // Importa o componente da pasta components
import Link from "next/link";
import { ArrowLeft, Settings } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function BuilderPage({ params }: { params: { id: string } }) {
  const { data: car } = await supabase.from('vehicles').select('*').eq('id', params.id).single();

  if (!car) return <div>Veículo não encontrado</div>

  return (
    <div className="min-h-screen bg-white text-gray-900 pt-20">
      <div className="border-b border-gray-100 bg-white sticky top-16 z-30 py-4 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-6 flex justify-between items-center">
             <Link href="/" className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black transition-colors gap-2"><ArrowLeft size={14} /> Voltar</Link>
            <div className="flex items-center gap-2 text-yellow-600 font-bold uppercase tracking-widest text-xs"><Settings size={16}/> Modo Configurador</div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-12">
         <VehicleBuilder vehicle={car} />
      </div>
    </div>
  )
}