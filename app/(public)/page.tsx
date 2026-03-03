"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type BrandKey = "chevrolet" | "hyundai";
type Brand = { key: BrandKey; name: string; logo: string };

export default function ChooseBrandPage() {
  const router = useRouter();
  const [entering, setEntering] = useState<Brand | null>(null);

  const brands = useMemo<Brand[]>(
    () => [
      {
        key: "chevrolet",
        name: "Chevrolet",
        logo:
          "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/chevrolet-logo.svg",
      },
      {
        key: "hyundai",
        name: "Hyundai",
        logo: "https://upload.wikimedia.org/wikipedia/commons/2/20/Hyundai_logo.svg",
      },
    ],
    []
  );

  const go = (b: Brand) => {
    if (entering) return;
    setEntering(b);
    setTimeout(() => router.push(`/${b.key}`), 520);
  };

  // atalhos (desktop)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (entering) return;
      if (e.key === "1") go(brands[0]);
      if (e.key === "2") go(brands[1]);
      if (e.key === "Enter") go(brands[0]);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [brands, entering]);

  return (
    <main className="min-h-screen w-full overflow-hidden bg-white text-zinc-900 dark:bg-zinc-950 dark:text-white">
      {/* ===== Background animado (leve) ===== */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 opacity-[0.07] dark:opacity-[0.10] bg-grid" />
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_35%,rgba(0,0,0,0.10)_100%)] dark:bg-[radial-gradient(circle_at_center,transparent_25%,rgba(0,0,0,0.55)_100%)]" />
      </div>

      {/* ===== Conteúdo ===== */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 sm:px-6">
        <div className="w-full max-w-lg sm:max-w-xl md:max-w-4xl">
          {/* Header: menor no mobile, mais elegante */}
          <div className="mb-8 sm:mb-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-200/70 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-900/70 dark:bg-white/70" />
              <span className="text-[10px] sm:text-[11px] tracking-[0.28em] uppercase text-zinc-600 dark:text-zinc-300">
                WB AUTO
              </span>
            </div>

            <h1 className="mt-4 text-2xl sm:text-3xl md:text-5xl font-semibold tracking-tight">
              Escolha a marca
            </h1>

            {/* texto só a partir de sm (mobile mais limpo) */}
            <p className="hidden sm:block mt-3 text-sm text-zinc-600 dark:text-zinc-300">
              Você pode alternar entre marcas a qualquer momento.
            </p>
          </div>

          {/* Cards: mobile 1 coluna, desktop 2 colunas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {brands.map((b, idx) => (
              <button
                key={b.key}
                onClick={() => go(b)}
                className="
                  group relative w-full overflow-hidden
                  rounded-[26px] sm:rounded-[28px]
                  border border-zinc-200/70 dark:border-white/10
                  bg-white/75 dark:bg-white/5 backdrop-blur-md
                  transition-transform duration-300
                  active:scale-[0.99] md:hover:-translate-y-1
                "
              >
                {/* brilho hover (só no md pra não pesar no mobile) */}
                <div className="pointer-events-none absolute inset-0 opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-zinc-200/50 dark:bg-white/10 blur-3xl" />
                </div>

                <div className="p-6 sm:p-8 md:p-10 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl border border-zinc-200/70 dark:border-white/10 bg-white/85 dark:bg-white/10 flex items-center justify-center shrink-0">
                      <img
                        src={b.logo}
                        alt={b.name}
                        className="h-7 sm:h-8 w-auto object-contain"
                      />
                    </div>

                    <div className="text-left min-w-0">
                      <div className="text-lg sm:text-xl md:text-2xl font-semibold truncate">
                        {b.name}
                      </div>
                      <div className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        Entrar
                      </div>
                    </div>
                  </div>

                  {/* tecla 1/2 só desktop */}
                  <div className="hidden md:block text-xs text-zinc-500 dark:text-zinc-400">
                    {idx === 0 ? "1" : "2"}
                  </div>
                </div>

                {/* underline micro */}
                <div className="h-[2px] w-full bg-zinc-900/5 dark:bg-white/10" />
                <div className="h-[2px] w-0 md:group-hover:w-full transition-all duration-500 bg-zinc-900/20 dark:bg-white/20" />

                {/* ring hover */}
                <div className="pointer-events-none absolute inset-0 rounded-[26px] sm:rounded-[28px] ring-0 md:group-hover:ring-2 ring-zinc-900/10 dark:ring-white/15 transition-all" />
              </button>
            ))}
          </div>

          {/* Hint: aparece só no desktop */}
          <div className="hidden md:block mt-10 text-center text-[11px] text-zinc-500 dark:text-zinc-400">
            
          </div>
        </div>
      </div>

      {/* ===== Overlay de entrada ===== */}
      <div
        className={`fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-500 ${
          entering ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="absolute inset-0 bg-white/75 dark:bg-black/70 backdrop-blur-xl" />

        <div className="relative z-10 flex flex-col items-center gap-4 px-6 text-center">
          {entering?.logo && (
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-3xl border border-zinc-200/70 dark:border-white/10 bg-white/85 dark:bg-white/10 flex items-center justify-center">
              <img
                src={entering.logo}
                alt={entering.name}
                className="h-8 sm:h-10 w-auto object-contain"
              />
            </div>
          )}

          <div className="text-[10px] sm:text-xs tracking-[0.28em] uppercase text-zinc-500 dark:text-zinc-300">
            Entrando
          </div>

          <div className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight">
            {entering?.name}
          </div>

          <div className="h-1 w-48 sm:w-64 rounded-full bg-zinc-200 dark:bg-white/10 overflow-hidden">
            <div className="h-full w-0 bg-zinc-900/40 dark:bg-white/35 loading-bar" />
          </div>
        </div>
      </div>

      <style jsx global>{`
        /* grid background */
        .bg-grid {
          background-image: linear-gradient(
              to right,
              rgba(0, 0, 0, 0.35) 1px,
              transparent 1px
            ),
            linear-gradient(to bottom, rgba(0, 0, 0, 0.35) 1px, transparent 1px);
          background-size: 56px 56px;
        }
        .dark .bg-grid {
          background-image: linear-gradient(
              to right,
              rgba(255, 255, 255, 0.35) 1px,
              transparent 1px
            ),
            linear-gradient(
              to bottom,
              rgba(255, 255, 255, 0.35) 1px,
              transparent 1px
            );
        }

        /* blobs (reduzidos no mobile) */
        .blob {
          position: absolute;
          width: 520px;
          height: 520px;
          border-radius: 999px;
          filter: blur(60px);
          opacity: 0.45;
          animation: floaty 14s ease-in-out infinite;
          mix-blend-mode: multiply;
        }
        .dark .blob {
          opacity: 0.22;
          mix-blend-mode: screen;
        }

        /* mobile: blobs menores e mais leves */
        @media (max-width: 640px) {
          .blob {
            width: 360px;
            height: 360px;
            filter: blur(50px);
            opacity: 0.35;
          }
          .dark .blob {
            opacity: 0.18;
          }
        }

        .blob-1 {
          left: -140px;
          top: -160px;
          background: radial-gradient(circle at 30% 30%, #60a5fa, transparent 55%);
          animation-delay: 0s;
        }
        .blob-2 {
          right: -160px;
          top: 18%;
          background: radial-gradient(circle at 30% 30%, #22c55e, transparent 55%);
          animation-delay: -3s;
        }
        .blob-3 {
          left: 18%;
          bottom: -220px;
          background: radial-gradient(circle at 30% 30%, #a78bfa, transparent 55%);
          animation-delay: -7s;
        }

        @keyframes floaty {
          0% {
            transform: translate3d(0px, 0px, 0) scale(1);
          }
          50% {
            transform: translate3d(22px, -16px, 0) scale(1.04);
          }
          100% {
            transform: translate3d(0px, 0px, 0) scale(1);
          }
        }

        .loading-bar {
          animation: load 520ms ease-out forwards;
        }
        @keyframes load {
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