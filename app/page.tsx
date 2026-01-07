"use client"

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { ArrowRight, Loader2 } from "lucide-react"; // Loader2 importado novamente
import Link from "next/link";
import CarCatalog from "@/components/CarCatalog";

// 1. Slide Padrão
const DEFAULT_SLIDE = [{
  id: 0,
  title: "Bem-vindo à Chevrolet",
  subtitle: "Cadastre seus banners no Painel Admin",
  image_url: "https://chevrolet.com.br/content/dam/chevrolet/mercosur/brazil/portuguese/index/pickups-and-trucks/2024-silverado/jellys/silverado-high-country-01.jpg?imwidth=1200"
}];

export default function Home() {
  const [slides, setSlides] = useState<any[]>(DEFAULT_SLIDE);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSlides() {
      const { data } = await supabase.from('hero_slides').select('*').order('created_at', { ascending: false });
      if (data && data.length > 0) {
        setSlides(data);
      }
      
      // Pequeno delay para garantir que o branco não pisque rápido demais
      setTimeout(() => {
          setLoading(false);
      }, 500);
    }
    fetchSlides();
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);


  return (
    <main className="bg-white min-h-screen">

      <section className="relative h-[95vh] w-full overflow-hidden bg-gray-900">
        
        {/* --- CORTINA DE CARREGAMENTO BRANCA COM LOADER --- */}
        {/* 1. bg-white: Fundo Branco */}
        {/* 2. flex items-center justify-center: Para centralizar a rodinha */}
        <div 
            className={`absolute inset-0 z-50 bg-white flex items-center justify-center transition-opacity duration-[1500ms] ease-in-out pointer-events-none ${loading ? 'opacity-100' : 'opacity-0'}`}
        >
            {/* Rodinha (Loader) preta para aparecer no fundo branco */}
            <Loader2 className={`w-10 h-10 text-black animate-spin ${loading ? 'block' : 'hidden'}`} />
        </div>
        
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-[1500ms] ease-in-out ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent z-10" />
            <img
              src={slide.image_url}
              alt={slide.title}
              className="w-full h-full object-cover object-center"
            />
          </div>
        ))}

        <div className="absolute inset-0 z-20 flex items-center">
          <div className="container mx-auto px-6 md:px-12">
            <div className="max-w-2xl space-y-6">
              {slides.map((slide, index) => {
                if (index !== currentSlide) return null;
                return (
                  <div key={slide.id} className="animate-in slide-in-from-left-10 fade-in duration-1000">
                    <h1 className="text-5xl md:text-7xl font-bold text-white uppercase tracking-tight mb-2">
                      {slide.title}
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-200 font-light mb-8">
                      {slide.subtitle}
                    </p>
                    
                    <div className="flex gap-4">
                      <Link 
                        href="/configurador" 
                        className="bg-white text-gray-900 hover:bg-gray-100 px-6 py-3 rounded font-bold uppercase tracking-widest transition-all flex items-center gap-2 text-sm shadow-lg hover:scale-105 transform duration-300"
                      >
                        Monte o Seu <ArrowRight size={18} />
                      </Link>
                      
                      <button className="border border-white text-white px-6 py-3 rounded font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all text-sm">
                        Saiba Mais
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="absolute bottom-10 left-0 right-0 z-30 flex justify-center gap-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-1 rounded-full transition-all duration-300 ${
                index === currentSlide ? "w-12 bg-white" : "w-6 bg-gray-500 hover:bg-white"
              }`}
            />
          ))}
        </div>
      </section>

      {/* --- SEÇÃO 2: CATÁLOGO --- */}
      <CarCatalog />

    </main>
  );
}