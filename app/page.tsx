import Link from "next/link";
import { supabase } from "@/lib/supabase";
import CarCard from "@/components/CarCard";
import { ChevronDown } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  return (
    <div className="bg-black min-h-screen text-white selection:bg-white selection:text-black">
      
      {/* HERO SECTION */}
      <section className="relative h-screen w-full overflow-hidden flex flex-col justify-center">
        <div className="absolute inset-0 z-0">
             <img 
                src="https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=2000&auto=format&fit=crop" 
                className="w-full h-full object-cover opacity-60"
                alt="Chevrolet Background"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40"></div>
             <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-transparent"></div>
        </div>
        
        <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 grid md:grid-cols-2 gap-6 mt-20">
          <div>
            <h2 className="text-xs font-bold tracking-[0.2em] text-gray-400 mb-4 uppercase">
              Bem-vindo à WB Auto
            </h2>
            <h1 className="text-5xl md:text-8xl font-bold uppercase leading-[0.9] tracking-tighter mb-6">
              O Prazer <br/> de Dirigir.
            </h1>
            <div className="h-1 w-20 bg-white mb-8"></div>
            
            <div className="flex gap-4">
                <Link href="#estoque" className="bg-white text-black px-8 py-4 font-bold uppercase tracking-widest text-xs hover:bg-gray-200 transition-colors">
                    Ver Veículos
                </Link>
                <Link href="/carros/1" className="backdrop-blur-md border border-white/30 text-white px-8 py-4 font-bold uppercase tracking-widest text-xs hover:bg-white hover:text-black transition-colors">
                    Simular
                </Link>
            </div>
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-50">
            <ChevronDown size={32} />
        </div>
      </section>

      {/* SECTION ESTOQUE */}
      <section id="estoque" className="py-20 bg-black">
        <div className="max-w-[1400px] mx-auto px-6">
            <div className="flex justify-between items-end mb-12 border-b border-gray-800 pb-4">
                <h2 className="text-3xl md:text-5xl font-light uppercase tracking-tight">
                    Veículos <span className="font-bold">Disponíveis</span>
                </h2>
                <span className="hidden md:block text-gray-500 text-sm tracking-widest">
                    {vehicles?.length || 0} MODELOS ENCONTRADOS
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                {vehicles?.map((car) => (
                    <CarCard 
                        key={car.id}
                        id={car.id}
                        brand={car.brand}
                        model={car.model}
                        year={car.year}
                        price={car.price}
                        image_url={car.image_url}
                        description={car.description || ''}
                    />
                ))}
            </div>
        </div>
      </section>
    </div>
  );
}