// app/(site)/hyundai/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/**
 * ✅ Hyundai Home (responsive premium)
 * - HERO com altura responsiva (não estoura em HD e fica ótimo no 2K)
 * - Autoplay robusto (sem pular slide por timer + animationEnd)
 * - Layout mais apresentável no mobile
 * - Containers com max-width correto (evita “esticar demais”)
 */

type HeroSlide = { id: string; imageUrl: string };

type OfferCard = {
  id: string;
  imageUrl: string;
  aspect: "SQ_1_1" | "RECT_500_1015";
};

type TilePair = {
  leftImageUrl: string;
  rightImageUrl: string;
};

export default function HyundaiHomePage() {
  const HERO_SLIDE_DURATION = 6000;

  // =========================
  // ✅ TROQUE AQUI (APENAS LINKS)
  // =========================
  const heroSlides: HeroSlide[] = useMemo(
    () => [
      {
        id: "hero-1",
        imageUrl:
          "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/avatars/1920X800_MKV_Converao_IONIQ5_Signature_janeiro%20(1).webp",
      },
      {
        id: "hero-2",
        imageUrl:
          "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/avatars/1920x800_MKV_CONVERSAO_CRETA-N-LINE_Quem-compara-compra-Hyundai.webp",
      },
      {
        id: "hero-3",
        imageUrl:
          "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/avatars/1920x800_MKV_IBR_Promocao-Copa.webp",
      },
    ],
    []
  );

  const offerCards: OfferCard[] = useMemo(
    () => [
      {
        id: "creta-rect",
        imageUrl:
          "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/avatars/card-home-oferta-creta.webp",
        aspect: "RECT_500_1015",
      },
      {
        id: "kona-rect",
        imageUrl:
          "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/avatars/618x1278_CARD_HOME_CONVERSAO_KONA_v3.webp",
        aspect: "RECT_500_1015",
      },
      {
        id: "ioniq-sq",
        imageUrl:
          "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/avatars/mosaico_squad_ioniq.webp",
        aspect: "SQ_1_1",
      },
    ],
    []
  );

  const tiles: TilePair = useMemo(
    () => ({
      leftImageUrl:
        "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/avatars/mosaico_squad_palisade2.webp",
      rightImageUrl:
        "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/avatars/banner_hb20_home.webp",
    }),
    []
  );

  const copaBannerUrl = useMemo(
    () =>
      "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/avatars/desktop_2598x738.webp",
    []
  );

  // =========================
  // HERO logic (sem bug)
  // =========================
  const [heroIndex, setHeroIndex] = useState(0);
  const timeoutRef = useRef<number | null>(null);

  const goHero = (idx: number) => {
    const total = heroSlides.length;
    const next = ((idx % total) + total) % total;
    setHeroIndex(next);
  };

  const goPrev = () => {
    if (heroSlides.length <= 1) return;
    goHero(heroIndex - 1);
  };

  const goNext = () => {
    if (heroSlides.length <= 1) return;
    goHero(heroIndex + 1);
  };

  // ✅ autoplay por setTimeout (1 fonte de verdade)
  useEffect(() => {
    if (heroSlides.length <= 1) return;

    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      setHeroIndex((p) => (p + 1) % heroSlides.length);
    }, HERO_SLIDE_DURATION);

    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    };
  }, [heroIndex, heroSlides.length, HERO_SLIDE_DURATION]);

  const rectCards = useMemo(
    () => offerCards.filter((c) => c.aspect === "RECT_500_1015").slice(0, 2),
    [offerCards]
  );

  const sqCardUrl = useMemo(
    () => offerCards.find((c) => c.aspect === "SQ_1_1")?.imageUrl || "",
    [offerCards]
  );

  return (
    <main className="min-h-screen bg-white text-zinc-900">
      <style jsx global>{`
        /* ===== progress ===== */
        .hy-hero-progress {
          width: 0%;
          animation-name: hyFill;
          animation-timing-function: linear;
          animation-fill-mode: forwards;
        }
        @keyframes hyFill {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }

        /* ===== dots ===== */
        .hy-dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.45);
          transition: all 180ms ease;
        }
        .hy-dot.on {
          width: 18px;
          background: rgba(255, 255, 255, 0.92);
        }

        /* ===== image base ===== */
        .hy-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          display: block;
        }

        /* ===== card polish ===== */
        .hy-card {
          border-radius: 18px;
          overflow: hidden;
          border: 1px solid rgba(228, 228, 231, 1);
          background: rgba(250, 250, 250, 1);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
        }

        /* ===== arrows ===== */
        .hy-arrow {
          width: 42px;
          height: 42px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.35);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.18);
          color: rgba(255, 255, 255, 0.95);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: transform 120ms ease, background 180ms ease, opacity 180ms ease;
          user-select: none;
        }
        .hy-arrow:hover {
          background: rgba(0, 0, 0, 0.5);
          transform: scale(1.03);
        }
        .hy-arrow:active {
          transform: scale(0.98);
        }

        /* ===== hero height: premium em HD e 2K =====
           - mobile: ~340px
           - 1366/1920: ~460-620px
           - 2K/4K: limita em ~780px
        */
        .hy-hero-height {
          height: clamp(340px, 42vw, 780px);
        }

        /* melhora toque no mobile */
        @media (max-width: 640px) {
          .hy-arrow {
            width: 38px;
            height: 38px;
          }
        }
      `}</style>

      {/* =========================
          HERO
      ========================= */}
      <section className="relative w-full overflow-hidden bg-black">
        <div className="relative hy-hero-height">
          {heroSlides.map((s, idx) => (
            <div
              key={s.id}
              className={`absolute inset-0 transition-opacity duration-[800ms] ${
                idx === heroIndex ? "opacity-100" : "opacity-0"
              }`}
            >
              <img
                src={s.imageUrl}
                alt=""
                className="hy-img"
                draggable={false}
                loading={idx === heroIndex ? "eager" : "lazy"}
              />

              {/* ✅ overlay premium (gradiente em vez de chapado) */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/10 to-black/35" />
            </div>
          ))}

          {/* ✅ setas */}
          {heroSlides.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Slide anterior"
                onClick={goPrev}
                className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-30 hy-arrow"
              >
                <span className="text-2xl leading-none">‹</span>
              </button>

              <button
                type="button"
                aria-label="Próximo slide"
                onClick={goNext}
                className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-30 hy-arrow"
              >
                <span className="text-2xl leading-none">›</span>
              </button>
            </>
          )}

          {/* ✅ bolinhas + barra */}
          {heroSlides.length > 1 && (
            <div className="absolute bottom-4 sm:bottom-6 left-0 right-0 z-30">
              <div className="mx-auto max-w-7xl px-4 sm:px-6">
                <div className="flex items-center justify-center gap-2 sm:gap-3">
                  {heroSlides.map((_, idx) => (
                    <button
                      key={idx}
                      aria-label={`Ir para slide ${idx + 1}`}
                      onClick={() => goHero(idx)}
                      className="p-2"
                    >
                      <div className={`hy-dot ${idx === heroIndex ? "on" : ""}`} />
                    </button>
                  ))}
                </div>

                <div className="mt-3 sm:mt-4 flex items-center justify-center">
                  <div className="h-[3px] w-full max-w-sm sm:max-w-md rounded-full bg-white/25 overflow-hidden">
                    <div
                      key={heroIndex}
                      className="h-full bg-white hy-hero-progress"
                      style={{ animationDuration: `${HERO_SLIDE_DURATION}ms` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* =========================
          MOSAICO / OFERTAS
      ========================= */}
      <section className="w-full bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 items-start">
            {/* 2 retangulares */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
              {rectCards.map((c) => (
                <div
                  key={c.id}
                  className="hy-card"
                  style={{ aspectRatio: "500 / 1015" }}
                >
                  <img src={c.imageUrl} alt="" className="hy-img" draggable={false} loading="lazy" />
                </div>
              ))}
            </div>

            {/* 1 quadrado */}
            <div className="hy-card" style={{ aspectRatio: "1 / 1" }}>
              <img src={sqCardUrl} alt="" className="hy-img" draggable={false} loading="lazy" />
            </div>
          </div>
        </div>
      </section>

      {/* =========================
          PALISADE vs HB20
      ========================= */}
      <section className="w-full bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 pb-8 sm:pb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            <div className="hy-card" style={{ aspectRatio: "1 / 1" }}>
              <img src={tiles.leftImageUrl} alt="" className="hy-img" draggable={false} loading="lazy" />
            </div>

            <div className="hy-card" style={{ aspectRatio: "1 / 1" }}>
              <img src={tiles.rightImageUrl} alt="" className="hy-img" draggable={false} loading="lazy" />
            </div>
          </div>
        </div>
      </section>

      {/* =========================
          BANNER COPA
      ========================= */}
      <section className="w-full bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 pb-10 sm:pb-12">
          <div
            className="hy-card w-full"
            style={{ aspectRatio: "2090 / 550" }}
          >
            <img src={copaBannerUrl} alt="" className="hy-img" draggable={false} loading="lazy" />
          </div>
        </div>
      </section>

      <div className="h-6 sm:h-10" />
    </main>
  );
}