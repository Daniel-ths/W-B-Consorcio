"use client"

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { ArrowRight, Loader2 } from "lucide-react"; 
import Link from "next/link";

// 1. IMPORTAR O NOVO COMPONENTE
import VehicleDiscovery from "@/components/VehicleDiscovery";

// 2. Slide Padrão
const DEFAULT_SLIDE = [{
  id: 0,
  title: "Bem-vindo à Chevrolet",
  subtitle: "Encontre o carro dos seus sonhos.",
  image_url: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=2070&auto=format&fit=crop",
  vehicle_id: null
}];

export default function Home() {
  const [slides, setSlides] = useState<any[]>(DEFAULT_SLIDE);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);

  // Tempo de duração de cada slide (4 segundos)
  const SLIDE_DURATION = 4000;

  useEffect(() => {
    async function fetchSlides() {
      // Busca os slides e garante que traz o vehicle_id se existir
      const { data } = await supabase.from('hero_slides').select('*').order('created_at', { ascending: false });
      if (data && data.length > 0) {
        setSlides(data);
      }
      setTimeout(() => setLoading(false), 500);
    }
    fetchSlides();
  }, []);

  // Timer Automático
  useEffect(() => {
    if (slides.length <= 1) return;
    
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, SLIDE_DURATION);

    return () => clearInterval(timer);
  }, [slides.length, currentSlide]);

  return (
    <main className="bg-black min-h-screen flex flex-col font-sans">

      {/* SEÇÃO HERO (BANNER) */}
      <section className="relative h-screen w-full overflow-hidden bg-gray-900">
        
        {/* Loader */}
        <div className={`absolute inset-0 z-50 bg-black flex items-center justify-center transition-opacity duration-[1500ms] ease-in-out pointer-events-none ${loading ? 'opacity-100' : 'opacity-0'}`}>
            <Loader2 className={`w-10 h-10 text-white animate-spin ${loading ? 'block' : 'hidden'}`} />
        </div>
        
        {/* Slides */}
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-[1500ms] ease-in-out ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent z-10" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
            
            {slide.image_url && (
                <img
                  src={slide.image_url}
                  alt={slide.title}
                  className={`w-full h-full object-cover object-center ${index === currentSlide ? "scale-105 animate-in fade-in zoom-in duration-[10s]" : "scale-100"}`} 
                />
            )}
          </div>
        ))}

        {/* Conteúdo */}
        <div className="absolute inset-0 z-20 flex items-center">
          <div className="container mx-auto px-6 md:px-12">
            <div className="max-w-3xl space-y-8">
              {slides.map((slide, index) => {
                if (index !== currentSlide) return null;

                // LÓGICA DO LINK INTELIGENTE
                // Se o banner tem vehicle_id -> Abre o configurador daquele carro
                // Se não tem -> Abre o catálogo geral de carros
                const buttonLink = slide.vehicle_id 
                    ? `/configurador?id=${slide.vehicle_id}` 
                    : "/CarCatalog";

                return (
                  <div key={slide.id} className="animate-in slide-in-from-bottom-10 fade-in duration-700">
                    <h1 className="text-5xl md:text-8xl font-black text-white uppercase tracking-tighter mb-4 leading-none drop-shadow-lg">
                      {slide.title}
                    </h1>
                    <p className="text-xl md:text-3xl text-gray-200 font-light mb-10 max-w-xl drop-shadow-md">
                      {slide.subtitle}
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* BOTÃO MONTE O SEU (BRANCO + LINK DINÂMICO) */}
                      
                      {/* BOTÃO SEMINOVOS */}
                      <Link 
                        href="/vendedor/seminovos" 
                        className="px-8 py-4 border-2 border-white text-white hover:bg-white hover:text-black font-bold uppercase tracking-widest rounded-full transition-all"
                      >
                        Seminovos
                      </Link>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* --- INDICADORES COM BARRA DE PROGRESSO ANIMADA --- */}
        <div className="absolute bottom-12 left-0 right-0 z-30 flex justify-center gap-3">
          {slides.map((_, index) => {
            const isActive = index === currentSlide;
            return (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`relative h-1.5 rounded-full overflow-hidden transition-all duration-500 shadow-sm ${
                  isActive ? "w-16 bg-white/30" : "w-4 bg-white/30 hover:bg-white/60"
                }`}
              >
                {/* Barra de Progresso Interna */}
                {isActive && (
                    <div 
                        className="absolute top-0 left-0 h-full bg-white rounded-full"
                        style={{ 
                            width: '100%',
                            animation: `fillProgress ${SLIDE_DURATION}ms linear` 
                        }} 
                    />
                )}
              </button>
            )
          })}
        </div>
      </section>

      {/* SEÇÃO INFERIOR */}
      <VehicleDiscovery />

      {/* ESTILO PARA A ANIMAÇÃO DA BARRA */}
      <style jsx global>{`
        @keyframes fillProgress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>

    </main>
  );
}