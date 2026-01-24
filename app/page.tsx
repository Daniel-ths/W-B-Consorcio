"use client"

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { ArrowRight, Loader2, Car } from "lucide-react"; 
import Link from "next/link";

// 1. Slide Padrão (Caso o banco demore ou esteja vazio)
const DEFAULT_SLIDE = [{
  id: 0,
  title: "Bem-vindo à Chevrolet",
  subtitle: "Encontre o carro dos seus sonhos.",
  image_url: ""
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
      
      // Delay para transição suave
      setTimeout(() => {
          setLoading(false);
      }, 500);
    }
    fetchSlides();
  }, []);

  // Timer para passar os slides automaticamente
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);


  return (
    <main className="bg-black min-h-screen flex flex-col">

      {/* SEÇÃO HERO (BANNER) - Ocupa 100% da altura da tela (100vh) */}
      <section className="relative h-screen w-full overflow-hidden bg-gray-900 flex-1">
        
        {/* --- CORTINA DE CARREGAMENTO --- */}
        <div 
            className={`absolute inset-0 z-50 bg-black flex items-center justify-center transition-opacity duration-[1500ms] ease-in-out pointer-events-none ${loading ? 'opacity-100' : 'opacity-0'}`}
        >
            <Loader2 className={`w-10 h-10 text-white animate-spin ${loading ? 'block' : 'hidden'}`} />
        </div>
        
        {/* --- SLIDES DE FUNDO --- */}
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-[2000ms] ease-in-out ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            {/* Gradiente para escurecer a imagem e destacar o texto */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent z-10" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
            
            <img
              src={slide.image_url}
              alt={slide.title}
              className="w-full h-full object-cover object-center scale-105 animate-in fade-in zoom-in duration-[10s]" // Efeito de zoom lento (Ken Burns)
            />
          </div>
        ))}

        {/* --- CONTEÚDO (TEXTO E BOTÕES) --- */}
        <div className="absolute inset-0 z-20 flex items-center">
          <div className="container mx-auto px-6 md:px-12">
            <div className="max-w-3xl space-y-8">
              {slides.map((slide, index) => {
                if (index !== currentSlide) return null;
                return (
                  <div key={slide.id} className="animate-in slide-in-from-bottom-10 fade-in duration-1000">
                    <h1 className="text-5xl md:text-8xl font-black text-white uppercase tracking-tighter mb-4 leading-none drop-shadow-lg">
                      {slide.title}
                    </h1>
                    <p className="text-xl md:text-3xl text-gray-200 font-light mb-10 max-w-xl drop-shadow-md">
                      {slide.subtitle}
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* BOTÃO PRINCIPAL */}

                      
                      {/* BOTÃO SECUNDÁRIO */}

                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* --- CONTROLES DOS SLIDES (BOLINHAS) --- */}
        <div className="absolute bottom-12 left-0 right-0 z-30 flex justify-center gap-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-1.5 rounded-full transition-all duration-500 shadow-sm ${
                index === currentSlide ? "w-16 bg-white" : "w-4 bg-white/30 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      </section>

    </main>
  );
}