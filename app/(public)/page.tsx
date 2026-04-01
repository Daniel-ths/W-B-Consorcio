"use client";
export const dynamic = "force-dynamic";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

type BrandKey = "chevrolet" | "hyundai";
type Brand = { key: BrandKey; name: string; logo: string; disabled?: boolean };

export default function ChooseBrandPage() {
  const router = useRouter();
  const [entering, setEntering] = useState<Brand | null>(null);

  const navTimeoutRef = useRef<number | null>(null);
  const resetTimeoutRef = useRef<number | null>(null);

  const brands = useMemo<Brand[]>(
    () => [
      {
        key: "chevrolet",
        name: "Chevrolet",
        logo: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/chevrolet-logo.svg",
      },
      {
        key: "hyundai",
        name: "Hyundai",
        logo: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/avatars/580b585b2edbce24c47b2c77.png",
      },
    ],
    []
  );

  const clearTimers = () => {
    if (navTimeoutRef.current) window.clearTimeout(navTimeoutRef.current);
    if (resetTimeoutRef.current) window.clearTimeout(resetTimeoutRef.current);
    navTimeoutRef.current = null;
    resetTimeoutRef.current = null;
  };

  const go = (b: Brand) => {
    if (entering) return;
    if (b.disabled) return;

    setEntering(b);
    clearTimers();

    navTimeoutRef.current = window.setTimeout(() => {
      router.push(`/${b.key}`);
    }, 520);

    resetTimeoutRef.current = window.setTimeout(() => {
      setEntering(null);
      clearTimers();
    }, 5000);
  };

  const goToConsultaCpf = () => {
    if (entering) return;
    router.push("supervisor/consultar-cliente");
  };

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

  useEffect(() => {
    return () => clearTimers();
  }, []);

  return (
    <main className="fixed inset-0 h-[100svh] w-full overflow-hidden bg-white text-zinc-900 dark:bg-zinc-950 dark:text-white">
      <div className="absolute inset-0 bg-white dark:bg-zinc-950" />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07] dark:opacity-[0.10] bg-grid" />
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_35%,rgba(0,0,0,0.10)_100%)] dark:bg-[radial-gradient(circle_at_center,transparent_25%,rgba(0,0,0,0.55)_100%)]" />
      </div>

<div className="fixed bottom-4 left-4 z-[60] sm:bottom-6 sm:left-6">
  <button
    type="button"
    onClick={goToConsultaCpf}
    aria-label="Abrir consulta de CPF"
    className="group flex h-12 w-12 items-center overflow-hidden rounded-full border border-zinc-200/70 bg-white/90 text-zinc-900 shadow-lg backdrop-blur-md transition-all duration-300 hover:w-[220px] hover:border-zinc-300 dark:border-white/10 dark:bg-zinc-900/85 dark:text-white dark:hover:border-white/20"
  >
    <div className="flex h-12 w-12 min-w-12 items-center justify-center">
      <Search className="h-5 w-5" />
    </div>

    <span className="pr-5 text-sm font-semibold whitespace-nowrap opacity-0 max-w-0 overflow-hidden transition-all duration-300 group-hover:opacity-100 group-hover:max-w-[160px]">
      Consulta de CPF
    </span>
  </button>
</div>

      <div className="relative z-10 flex h-full w-full items-center justify-center px-4 py-6 sm:px-6 sm:py-8">
        <div className="w-full max-w-lg sm:max-w-xl md:max-w-4xl">
          <div className="mb-8 text-center sm:mb-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200/70 bg-white/70 px-3 py-1 backdrop-blur dark:border-white/10 dark:bg-white/5">
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-900/70 dark:bg-white/70" />
              <span className="text-[10px] uppercase tracking-[0.22em] text-zinc-600 dark:text-zinc-300 sm:text-[11px] sm:tracking-[0.28em]">
                Nacional Consórcios
              </span>
            </div>

            <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl md:text-5xl">
              Escolha a marca
            </h1>

            <p className="mt-3 px-4 text-xs text-zinc-600 dark:text-zinc-300 sm:px-0 sm:text-sm">
              Você pode alternar entre marcas a qualquer momento.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
            {brands.map((b) => (
              <button
                key={b.key}
                onClick={() => go(b)}
                disabled={!!b.disabled}
                className={`
                  group relative w-full overflow-hidden
                  rounded-[24px] sm:rounded-[28px]
                  border border-zinc-200/70 dark:border-white/10
                  bg-white/75 dark:bg-white/5 backdrop-blur-md
                  transition-transform duration-300
                  active:scale-[0.99] md:hover:-translate-y-1
                  ${b.disabled ? "cursor-not-allowed opacity-60" : ""}
                `}
              >
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 md:group-hover:opacity-100">
                  <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-zinc-200/50 blur-3xl dark:bg-white/10" />
                </div>

                <div className="flex items-center justify-between gap-4 p-5 sm:p-8 md:p-10">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-zinc-200/70 bg-white/85 dark:border-white/10 dark:bg-white/10 sm:h-16 sm:w-16">
                      <img
                        src={b.logo}
                        alt={b.name}
                        className={`w-auto object-contain ${
                          b.key === "hyundai" ? "h-8 sm:h-9" : "h-7 sm:h-8"
                        }`}
                      />
                    </div>

                    <div className="min-w-0 text-left">
                      <div className="truncate text-lg font-semibold sm:text-xl md:text-2xl">
                        {b.name}
                      </div>
                      <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 sm:text-sm">
                        {b.disabled ? "Em breve" : "Entrar"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-[2px] w-full bg-zinc-900/5 dark:bg-white/10" />
                <div className="h-[2px] w-0 bg-zinc-900/20 transition-all duration-500 dark:bg-white/20 md:group-hover:w-full" />

                <div className="pointer-events-none absolute inset-0 rounded-[24px] ring-0 transition-all ring-zinc-900/10 dark:ring-white/15 md:group-hover:ring-2 sm:rounded-[28px]" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        className={`fixed inset-0 z-[9999] transition-all duration-500 ${
          entering ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div className="absolute inset-0 bg-white/75 backdrop-blur-xl dark:bg-black/70" />

        <div className="relative z-10 grid h-[100svh] place-items-center p-6">
          <div className="flex w-full max-w-xs flex-col items-center gap-4 text-center sm:max-w-sm">
            {entering?.logo && (
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-zinc-200/70 bg-white/85 dark:border-white/10 dark:bg-white/10 sm:h-20 sm:w-20">
                <img
                  src={entering.logo}
                  alt={entering.name}
                  className="h-8 w-auto object-contain sm:h-10"
                />
              </div>
            )}

            <div className="text-[10px] uppercase tracking-[0.28em] text-zinc-500 dark:text-zinc-300 sm:text-xs">
              Entrando
            </div>

            <div className="text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
              {entering?.name}
            </div>

            <div className="h-1 w-48 overflow-hidden rounded-full bg-zinc-200 dark:bg-white/10 sm:w-64">
              <div className="loading-bar h-full w-0 bg-zinc-900/40 dark:bg-white/35" />
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        html,
        body {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          overscroll-behavior: none;
          background: #ffffff;
        }

        .dark html,
        .dark body,
        html.dark,
        body.dark {
          background: #09090b;
        }

        #__next {
          height: 100%;
          overflow: hidden;
        }

        .bg-grid {
          background-image:
            linear-gradient(to right, rgba(0, 0, 0, 0.35) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 0, 0, 0.35) 1px, transparent 1px);
          background-size: 56px 56px;
        }

        .dark .bg-grid {
          background-image:
            linear-gradient(to right, rgba(255, 255, 255, 0.35) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.35) 1px, transparent 1px);
        }

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

        @media (max-width: 640px) {
          .blob {
            width: 320px;
            height: 320px;
            filter: blur(44px);
            opacity: 0.32;
          }

          .dark .blob {
            opacity: 0.18;
          }

          .bg-grid {
            background-size: 40px 40px;
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