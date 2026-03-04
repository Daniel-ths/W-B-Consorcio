"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

import VehicleDiscovery from "@/components/VehicleDiscovery";

const DEFAULT_SLIDE = [
  {
    id: 0,
    title: "Bem-vindo à Chevrolet",
    subtitle: "Encontre o carro dos seus sonhos.",
    image_url:
      "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=2070&auto=format&fit=crop",
    vehicle_id: null,
  },
];

export default function Home() {
  const [slides, setSlides] = useState<any[]>(DEFAULT_SLIDE);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);

  const SLIDE_DURATION = 4000;

  useEffect(() => {
    async function fetchSlides() {
      const { data } = await supabase
        .from("hero_slides")
        .select("*")
        .order("created_at", { ascending: false });

      if (data && data.length > 0) {
        setSlides(data);
      }

      setTimeout(() => setLoading(false), 500);
    }
    fetchSlides();
  }, []);

  // ✅ removi currentSlide do dependency (evita recriar interval toda troca)
  useEffect(() => {
    if (slides.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, SLIDE_DURATION);

    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <main className="bg-black min-h-screen flex flex-col font-sans">
      {/* HERO */}
      <section className="relative h-screen w-full overflow-hidden bg-gray-900">
        <div
          className={`absolute inset-0 z-50 bg-black flex items-center justify-center transition-opacity duration-[1500ms] ${
            loading ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <Loader2 className="w-10 h-10 text-white animate-spin" />
        </div>

        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-[1500ms] ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent z-10" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />

            {slide.image_url && (
              <img
                src={slide.image_url}
                alt={slide.title}
                className="w-full h-full object-cover object-center"
              />
            )}
          </div>
        ))}

        <div className="absolute inset-0 z-20 flex items-center">
          <div className="container mx-auto px-6 md:px-12">
            {slides.map((slide, index) => {
              if (index !== currentSlide) return null;

              return (
                <div key={slide.id}>
                  <h1 className="text-5xl md:text-8xl font-black text-white uppercase mb-4">
                    {slide.title}
                  </h1>
                  <p className="text-xl md:text-3xl text-gray-200 mb-10">{slide.subtitle}</p>

                  <Link
                    href="/vendedor/seminovos"
                    className="px-8 py-4 border-2 border-white text-white hover:bg-white hover:text-black font-bold uppercase rounded-full transition-all"
                  >
                    Seminovos
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        {/* ✅ BARRINHA CENTRALIZADA EMBAIXO (enche e quando completa, troca slide) */}
        {slides.length > 1 && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 w-full max-w-md px-6">
            <div className="h-[4px] rounded-full bg-white/25 overflow-hidden">
              <div
                key={currentSlide} // reinicia animação a cada slide
                onAnimationEnd={() =>
                  setCurrentSlide((prev) => (prev + 1) % slides.length)
                }
                className="h-full bg-white hero-progress"
                style={{ animationDuration: `${SLIDE_DURATION}ms` }}
              />
            </div>
          </div>
        )}
      </section>

      {/* SEÇÃO INFERIOR */}
      <VehicleDiscovery />

      {/* ================= PRIMEIRO BANNER ================= */}
      <section className="relative h-screen w-full overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0">
          <img
            src="https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/Screenshot_2.png"
            alt="Banner 1"
            className="w-full h-full object-cover object-center"
          />
        </div>

        <div className="relative z-10 text-center px-6 max-w-4xl">
          <h2 className="text-4xl md:text-7xl font-black text-white uppercase mb-6">
            Condições Especiais
          </h2>

          <p className="text-lg md:text-2xl text-gray-300 mb-10">
            Ofertas exclusivas para você sair de carro novo hoje.
          </p>
        </div>
      </section>

      {/* ================= SEGUNDO BANNER ================= */}
      <section className="relative h-screen w-full overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0">
          <img
            src="https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/mh-homepagedesktop.png"
            alt="Banner 2"
            className="w-full h-full object-cover object-center"
          />
        </div>

        <div className="relative z-10 text-center px-6 max-w-4xl">
          <h2 className="text-4xl md:text-7xl font-black text-white uppercase mb-6"></h2>

          <p className="text-lg md:text-2xl text-gray-300 mb-10"></p>
        </div>
      </section>

      <style jsx global>{`
        /* ✅ animação da barrinha */
        .hero-progress {
          width: 0%;
          animation-name: fillProgress;
          animation-timing-function: linear;
          animation-fill-mode: forwards;
        }

        @keyframes fillProgress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}