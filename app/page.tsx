import Link from "next/link";
import { supabase } from "@/lib/supabase";
import CarCard from "@/components/CarCard";

export const dynamic = 'force-dynamic';

export default async function Home() {
  // Busca os carros, mas não repete a Silverado na lista de baixo
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('*')
    .eq('is_active', true)
    .not('model', 'ilike', '%Silverado%') 
    .order('price', { ascending: true });

  return (
    <div className="bg-white min-h-screen text-gray-900 font-sans">
      
      {/* HERO SECTION - CAPA COM SUA FOTO NOVA */}
      <section className="relative h-[85vh] w-full overflow-hidden mt-16">
        
        {/* IMAGEM DE FUNDO (Link Oficial do seu Supabase) */}
        <div className="absolute inset-0 z-0">
             <img 
                src="https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/2024_Chevrolet_Silverado_HD_Z71_Side_View.avif" 
                className="w-full h-full object-cover object-center"
                alt="Chevrolet Silverado 2026"
             />
             {/* Degradê sutil para o texto branco aparecer bem */}
             <div className="absolute top-0 left-0 w-full h-2/3 bg-gradient-to-b from-black/50 via-black/10 to-transparent"></div>
        </div>
        
        {/* TEXTOS (Posicionados no canto superior esquerdo) */}
        <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 h-full pt-24 lg:pt-32">
          <div className="max-w-3xl text-white">
            
            <h2 className="text-xl font-medium tracking-wide mb-2 opacity-90 text-shadow-sm">
              Silverado 2026
            </h2>
            
            <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-8 drop-shadow-md">
              A picape pra quem pensa <br/> (muito) grande!
            </h1>
            
            <Link 
                href="#estoque" 
                className="bg-white text-gray-900 px-10 py-4 rounded-full font-bold text-sm hover:bg-gray-100 transition-all inline-block shadow-xl hover:-translate-y-1"
            >
                Saber mais
            </Link>
          </div>
        </div>
      </section>

      {/* CATÁLOGO DE MODELOS */}
      <section id="estoque" className="py-20 bg-white">
        <div className="max-w-[1400px] mx-auto px-6">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-bold uppercase tracking-tight text-gray-400 mb-2">
                    Modelos
                </h2>
                <p className="text-gray-900 text-4xl font-bold">
                    Encontre o seu Chevrolet
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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