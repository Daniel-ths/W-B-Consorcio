// app/(site)/hyundai/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/**
 * ✅ Hyundai Home
 * - HERO menor + overlay escuro leve
 * - Setas esquerda/direita para trocar slides
 * - Bolinhas + barra de progresso mantidas
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
  // HERO logic
  // =========================
  const [heroIndex, setHeroIndex] = useState(0);
  const heroTimerRef = useRef<number | null>(null);

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

  // reinicia timer sempre que trocar slide manualmente
  const restartTimer = () => {
    if (heroSlides.length <= 1) return;
    if (heroTimerRef.current) window.clearInterval(heroTimerRef.current);
    heroTimerRef.current = window.setInterval(() => {
      setHeroIndex((p) => (p + 1) % heroSlides.length);
    }, HERO_SLIDE_DURATION);
  };

  useEffect(() => {
    restartTimer();
    return () => {
      if (heroTimerRef.current) window.clearInterval(heroTimerRef.current);
      heroTimerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heroSlides.length, HERO_SLIDE_DURATION]);

  // quando muda o index (por seta/bolinha), reinicia a animação da barra e o timer
  useEffect(() => {
    restartTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heroIndex]);

  return (
    <main className="min-h-screen bg-white text-zinc-900">
      <style jsx global>{`
        /* ===== HERO progress ===== */
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

        /* ===== arrows ===== */
        .hy-arrow {
          width: 44px;
          height: 44px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.22);
          color: rgba(255, 255, 255, 0.95);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: transform 120ms ease, background 180ms ease, opacity 180ms ease;
          user-select: none;
        }
        .hy-arrow:hover {
          background: rgba(0, 0, 0, 0.48);
          transform: scale(1.03);
        }
        .hy-arrow:active {
          transform: scale(0.98);
        }
      `}</style>

      {/* =========================
          HERO (menor) + overlay escuro + setas
      ========================= */}
      <section className="relative w-full overflow-hidden bg-black">
        {/* ✅ menor que full-screen:
            - desktop: 520px
            - mobile: 360px
            - limite: não fica gigante
        */}
        <div className="relative h-[260px] sm:h-[420px] lg:h-[980px]">
          {heroSlides.map((s, idx) => (
            <div
              key={s.id}
              className={`absolute inset-0 transition-opacity duration-[900ms] ${
                idx === heroIndex ? "opacity-100" : "opacity-0"
              }`}
            >
              <img src={s.imageUrl} alt="" className="hy-img" draggable={false} />
              {/* ✅ overlay escuro leve */}
              <div className="absolute inset-0 bg-black/25" />
            </div>
          ))}

          {/* ✅ setas */}
          {heroSlides.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Slide anterior"
                onClick={goPrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-30 hy-arrow"
              >
                <span className="text-2xl leading-none">‹</span>
              </button>

              <button
                type="button"
                aria-label="Próximo slide"
                onClick={goNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-30 hy-arrow"
              >
                <span className="text-2xl leading-none">›</span>
              </button>
            </>
          )}

          {/* bolinhas + barra */}
          {heroSlides.length > 1 && (
            <div className="absolute bottom-6 left-0 right-0 z-30">
              <div className="max-w-[1200px] mx-auto px-6">
                <div className="flex items-center justify-center gap-3">
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

                <div className="mt-4 flex items-center justify-center">
                  <div className="h-[3px] w-full max-w-md rounded-full bg-white/25 overflow-hidden">
                    <div
                      key={heroIndex}
                      className="h-full bg-white hy-hero-progress"
                      style={{ animationDuration: `${HERO_SLIDE_DURATION}ms` }}
                      onAnimationEnd={() => {
                        if (heroSlides.length <= 1) return;
                        setHeroIndex((p) => (p + 1) % heroSlides.length);
                      }}
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
        <div className="max-w-[6200px] mx-auto px-6 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
              {offerCards
                .filter((c) => c.aspect === "RECT_500_1015")
                .slice(0, 2)
                .map((c) => (
                  <div
                    key={c.id}
                    className="relative overflow-hidden border border-zinc-200 bg-zinc-50"
                    style={{ aspectRatio: "500 / 1015" }}
                  >
                    <img src={c.imageUrl} alt="" className="hy-img" draggable={false} />
                  </div>
                ))}
            </div>

            <div
              className="relative overflow-hidden border border-zinc-200 bg-zinc-50"
              style={{ aspectRatio: "1 / 1" }}
            >
              <img
                src={offerCards.find((c) => c.aspect === "SQ_1_1")?.imageUrl || ""}
                alt=""
                className="hy-img"
                draggable={false}
              />
            </div>
          </div>
        </div>
      </section>

      {/* =========================
          PALISADE vs HB20
      ========================= */}
      <section className="w-full bg-white">
        <div className="max-w-[5200px] mx-auto px-6 pb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative overflow-hidden border border-zinc-200 bg-zinc-50" style={{ aspectRatio: "1 / 1" }}>
              <img src={tiles.leftImageUrl} alt="" className="hy-img" draggable={false} />
            </div>

            <div className="relative overflow-hidden border border-zinc-200 bg-zinc-50" style={{ aspectRatio: "1 / 1" }}>
              <img src={tiles.rightImageUrl} alt="" className="hy-img" draggable={false} />
            </div>
          </div>
        </div>
      </section>

      {/* =========================
          BANNER COPA
      ========================= */}
      <section className="w-full bg-white">
        <div className="max-w-[4200px] mx-auto px-6 pb-12">
          <div className="relative overflow-hidden border border-zinc-200 bg-zinc-50 w-full" style={{ aspectRatio: "2090 / 550" }}>
            <img src={copaBannerUrl} alt="" className="hy-img" draggable={false} />
          </div>
        </div>
      </section>

      <div className="h-10" />
    </main>
  );
}