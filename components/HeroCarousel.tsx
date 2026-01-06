// Arquivo: components/HeroCarousel.tsx
"use client"

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

export default function HeroCarousel() {
  const [slides, setSlides] = useState<any[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSlides() {
      const { data } = await supabase.from('hero_slides').select('*').order('created_at', { ascending: false });
      if (data && data.length > 0) {
        setSlides(data);
      } else {
        setSlides([{
          id: 0,
          title: "Bem-vindo à Chevrolet",
          subtitle: "Cadastre seus banners no Painel Admin",
          image_url: "https://chevrolet.com.br/content/dam/chevrolet/mercosur/brazil/portuguese/index/pickups-and-trucks/2024-silverado/jellys/silverado-high-country-01.jpg?imwidth=1200"
        }]);
      }
      setLoading(false);
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

  if (loading) return <div className="h-[95vh] bg-gray-900 flex items-center justify-center text-white"><Loader2 className="animate-spin mr-2"/> Carregando...</div>;

  return (
    <section className="relative h-[95vh] w-full overflow-hidden">
      
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
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
                <div key={slide.id} className="animate-in slide-in-from-left-10 fade-in duration-700">
                  <h1 className="text-5xl md:text-7xl font-bold text-white uppercase tracking-tight mb-2">
                    {slide.title}
                  </h1>
                  <p className="text-xl md:text-2xl text-gray-200 font-light mb-8">
                    {slide.subtitle}
                  </p>
                  
                  {/* BOTÕES BRANCOS ATUALIZADOS */}
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
  );
}