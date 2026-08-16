"use client";
export const dynamic = "force-dynamic";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";

type BrandKey =
  | "chevrolet"
  | "hyundai"
  | "fiat"
  | "volkswagen"
  | "renault"
  | "nissan";

type Brand = {
  key: BrandKey;
  name: string;
  logo: string;
  disabled?: boolean;
  accent: string;
  soft: string;
};

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
        accent: "from-yellow-400 to-amber-500",
        soft: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20",
      },
      {
        key: "hyundai",
        name: "Hyundai",
        logo: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/avatars/580b585b2edbce24c47b2c77.png",
        accent: "from-sky-500 to-cyan-500",
        soft: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/20",
      },
      {
        key: "fiat",
        name: "Fiat",
        logo: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/avatars/fiat_logo_icon_145827.png",
        accent: "from-red-500 to-rose-600",
        soft: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20",
      },
      {
        key: "volkswagen",
        name: "Volkswagen",
        logo: "https://upload.wikimedia.org/wikipedia/commons/6/6d/Volkswagen_logo_2019.svg",
        accent: "from-blue-700 to-cyan-500",
        soft: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20",
      },
      {
        key: "renault",
        name: "Manutenção",
        logo: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/images.jfif",
        accent: "from-yellow-500 to-amber-600",
        soft: "bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-300 dark:border-yellow-500/20",
      },
      {
        key: "nissan",
        name: "Manutenção",
        logo: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/hd-nissan-emblem-logo-transparent-png-701751694774302g4gilafdjp.png",
        accent: "from-red-600 to-orange-500",
        soft: "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/20",
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

      if (e.key === "1" && brands[0]) go(brands[0]);
      if (e.key === "2" && brands[1]) go(brands[1]);
      if (e.key === "3" && brands[2]) go(brands[2]);
      if (e.key === "4" && brands[3]) go(brands[3]);
      if (e.key === "5" && brands[4]) go(brands[4]);
      if (e.key === "6" && brands[5]) go(brands[5]);
      if (e.key === "Enter" && brands[0]) go(brands[0]);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [brands, entering]);

  useEffect(() => {
    return () => clearTimers();
  }, []);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.07, delayChildren: 0.12 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 22, scale: 0.97 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring" as const, stiffness: 320, damping: 24 },
    },
  };

  const logoSize = (key: BrandKey) => {
    if (key === "hyundai") return "h-8 sm:h-9";
    if (key === "volkswagen") return "h-9 sm:h-10";
    if (key === "fiat") return "h-7 sm:h-8";
    if (key === "renault") return "h-8 sm:h-9";
    if (key === "nissan") return "h-7 sm:h-8";
    return "h-7 sm:h-8";
  };

  return (
    <main className="fixed inset-0 h-[100svh] w-full overflow-hidden bg-white text-zinc-900 dark:bg-zinc-950 dark:text-white">
      <div className="absolute inset-0 bg-white dark:bg-zinc-950" />

      {/* fundo */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07] dark:opacity-[0.10] bg-grid" />
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_35%,rgba(0,0,0,0.10)_100%)] dark:bg-[radial-gradient(circle_at_center,transparent_25%,rgba(0,0,0,0.55)_100%)]" />
      </div>

      {/* botão CPF */}
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
          <span className="max-w-0 overflow-hidden pr-5 text-sm font-semibold whitespace-nowrap opacity-0 transition-all duration-300 group-hover:max-w-[160px] group-hover:opacity-100">
            Consulta de CPF
          </span>
        </button>
      </div>

      {/* conteúdo */}
      <div className="relative z-10 flex h-full w-full items-center justify-center px-4 py-6 sm:px-6 sm:py-8">
        <div className="w-full max-w-lg sm:max-w-xl md:max-w-6xl">
          {/* header */}
          <motion.div
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="mb-8 text-center sm:mb-10"
          >
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
          </motion.div>

          {/* grid de marcas */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3"
          >
            {brands.map((b) => (
              <motion.div key={b.key} variants={item} className="h-full">
                <motion.button
                  type="button"
                  onClick={() => go(b)}
                  disabled={!!b.disabled || !!entering}
                  whileHover={b.disabled || entering ? undefined : { y: -6, scale: 1.015 }}
                  whileTap={b.disabled || entering ? undefined : { scale: 0.985 }}
                  transition={{ type: "spring", stiffness: 400, damping: 22 }}
                  className={`
                    group relative h-full w-full overflow-hidden
                    rounded-[24px] sm:rounded-[28px]
                    border border-zinc-200/70 dark:border-white/10
                    bg-white/80 dark:bg-white/5 backdrop-blur-md
                    text-left shadow-sm
                    transition-shadow duration-300
                    hover:shadow-xl hover:shadow-zinc-200/50 dark:hover:shadow-black/40
                    ${b.disabled ? "cursor-not-allowed opacity-60" : ""}
                  `}
                >
                  {/* barra de cor no topo */}
                  <div
                    className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${b.accent} opacity-80 transition-all group-hover:h-1.5`}
                  />

                  {/* glow */}
                  <div
                    className={`pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br ${b.accent} opacity-0 blur-3xl transition-opacity duration-300 group-hover:opacity-25`}
                  />

                  <div className="relative flex items-center justify-between gap-4 p-5 sm:p-7 md:p-8">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-zinc-200/70 bg-white/90 dark:border-white/10 dark:bg-white/10 sm:h-16 sm:w-16">
                        <img
                          src={b.logo}
                          alt={b.name}
                          className={`w-auto object-contain ${logoSize(b.key)}`}
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-lg font-semibold sm:text-xl md:text-2xl">
                            {b.name}
                          </span>
                          <span
                            className={`hidden rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide sm:inline-flex ${b.soft}`}
                          >
                            {b.name}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 sm:text-sm">
                          {b.disabled ? "Em breve" : "Entrar"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* linha inferior animada */}
                  <div className="h-[2px] w-full bg-zinc-900/5 dark:bg-white/10" />
                  <div
                    className={`h-[2px] w-0 bg-gradient-to-r ${b.accent} transition-all duration-500 group-hover:w-full`}
                  />
                </motion.button>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* overlay de entrada */}
      <AnimatePresence>
        {entering && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 z-[9999]"
          >
            <div className="absolute inset-0 bg-white/80 backdrop-blur-xl dark:bg-black/75" />

            <div className="relative z-10 grid h-[100svh] place-items-center p-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ type: "spring", stiffness: 280, damping: 22 }}
                className="flex w-full max-w-xs flex-col items-center gap-4 text-center sm:max-w-sm"
              >
                {entering.logo && (
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-zinc-200/70 bg-white/90 dark:border-white/10 dark:bg-white/10 sm:h-20 sm:w-20">
                    <img
                      src={entering.logo}
                      alt={entering.name}
                      className={`w-auto object-contain ${logoSize(entering.key)}`}
                    />
                  </div>
                )}

                <div className="text-[10px] uppercase tracking-[0.28em] text-zinc-500 dark:text-zinc-300 sm:text-xs">
                  Entrando
                </div>

                <div className="text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
                  {entering.name}
                </div>

                <div className="h-1 w-48 overflow-hidden rounded-full bg-zinc-200 dark:bg-white/10 sm:w-64">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 0.52, ease: "easeOut" }}
                    className={`h-full bg-gradient-to-r ${entering.accent}`}
                  />
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
      `}</style>
    </main>
  );
}