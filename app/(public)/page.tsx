"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Command,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

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
  accentSolid: string;
  soft: string;
  description: string;
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
        accent: "from-yellow-400 via-amber-400 to-orange-500",
        accentSolid: "#f59e0b",
        soft: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-400/10 dark:text-amber-300 dark:border-amber-400/20",
        description: "Acesso ao ambiente Chevrolet",
      },
      {
        key: "hyundai",
        name: "Hyundai",
        logo: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/avatars/580b585b2edbce24c47b2c77.png",
        accent: "from-sky-500 via-cyan-500 to-blue-600",
        accentSolid: "#0ea5e9",
        soft: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-400/10 dark:text-sky-300 dark:border-sky-400/20",
        description: "Acesso ao ambiente Hyundai",
      },
      {
        key: "fiat",
        name: "Fiat",
        logo: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/avatars/fiat_logo_icon_145827.png",
        accent: "from-red-500 via-rose-500 to-orange-500",
        accentSolid: "#ef4444",
        soft: "bg-red-50 text-red-700 border-red-200 dark:bg-red-400/10 dark:text-red-300 dark:border-red-400/20",
        description: "Acesso ao ambiente Fiat",
      },
      {
        key: "volkswagen",
        name: "Volkswagen",
        logo: "https://upload.wikimedia.org/wikipedia/commons/6/6d/Volkswagen_logo_2019.svg",
        accent: "from-blue-600 via-blue-500 to-cyan-400",
        accentSolid: "#2563eb",
        soft: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-400/10 dark:text-blue-300 dark:border-blue-400/20",
        description: "Acesso ao ambiente Volkswagen",
      },
      {
        key: "renault",
        name: "Renault",
        logo: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/images.jfif",
        accent: "from-yellow-400 via-amber-500 to-orange-500",
        accentSolid: "#eab308",
        soft: "bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-400/10 dark:text-yellow-300 dark:border-yellow-400/20",
        description: "Acesso ao ambiente Renault",
      },
      {
        key: "nissan",
        name: "Nissan",
        logo: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/hd-nissan-emblem-logo-transparent-png-701751694774302g4gilafdjp.png",
        accent: "from-red-600 via-red-500 to-orange-500",
        accentSolid: "#dc2626",
        soft: "bg-red-50 text-red-700 border-red-200 dark:bg-red-400/10 dark:text-red-300 dark:border-red-400/20",
        description: "Acesso ao ambiente Nissan",
      },
    ],
    []
  );

  const clearTimers = () => {
    if (navTimeoutRef.current) {
      window.clearTimeout(navTimeoutRef.current);
    }

    if (resetTimeoutRef.current) {
      window.clearTimeout(resetTimeoutRef.current);
    }

    navTimeoutRef.current = null;
    resetTimeoutRef.current = null;
  };

  const go = (brand: Brand) => {
    if (entering || brand.disabled) return;

    clearTimers();
    setEntering(brand);

    navTimeoutRef.current = window.setTimeout(() => {
      router.push(`/${brand.key}`);
    }, 560);

    resetTimeoutRef.current = window.setTimeout(() => {
      setEntering(null);
      clearTimers();
    }, 5000);
  };

  const goToConsultaCpf = () => {
    if (entering) return;

    router.push("/supervisor/consultar-cliente");
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (entering) return;

      const number = Number(event.key);

      if (number >= 1 && number <= brands.length) {
        const brand = brands[number - 1];

        if (brand) {
          go(brand);
        }
      }

      if (event.key === "Enter" && brands[0]) {
        go(brands[0]);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [brands, entering]);

  useEffect(() => {
    return () => clearTimers();
  }, []);

  const containerVariants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.07,
        delayChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 24,
      scale: 0.97,
    },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 24,
      },
    },
  };

  const logoSize = (key: BrandKey) => {
    switch (key) {
      case "hyundai":
        return "h-8 sm:h-9";

      case "volkswagen":
        return "h-9 sm:h-10";

      case "fiat":
        return "h-7 sm:h-8";

      case "renault":
        return "h-8 sm:h-9";

      case "nissan":
        return "h-7 sm:h-8";

      default:
        return "h-7 sm:h-8";
    }
  };

  return (
    <main className="fixed inset-0 h-[100svh] w-full overflow-hidden bg-[#f7f8fa] text-zinc-950 dark:bg-[#09090b] dark:text-white">
      {/* =========================================================
          BACKGROUND
      ========================================================== */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Grid */}
        <div className="absolute inset-0 bg-grid opacity-[0.35] dark:opacity-[0.16]" />

        {/* Ambient lights */}
        <div className="ambient ambient-blue" />
        <div className="ambient ambient-purple" />
        <div className="ambient ambient-cyan" />

        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_25%,rgba(255,255,255,0.55)_100%)] dark:bg-[radial-gradient(circle_at_center,transparent_20%,rgba(0,0,0,0.62)_100%)]" />
      </div>

      {/* =========================================================
          TOP BAR
      ========================================================== */}

      <header className="absolute left-0 right-0 top-0 z-30">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8 sm:py-7">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45 }}
            className="flex items-center gap-3"
          >


            <div className="hidden sm:block">



            </div>
          </motion.div>

          {/* Status */}
          <motion.div
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45 }}
            className="flex items-center gap-2 rounded-full border border-zinc-200/80 bg-white/75 px-3 py-2 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>

            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-600 dark:text-zinc-300 sm:text-xs">
              Sistema online
            </span>
          </motion.div>
        </div>
      </header>

      {/* =========================================================
          CPF BUTTON
      ========================================================== */}

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.45 }}
        className="fixed bottom-5 left-5 z-50 sm:bottom-7 sm:left-7"
      >
        <button
          type="button"
          onClick={goToConsultaCpf}
          disabled={!!entering}
          className="
            group flex items-center gap-0 overflow-hidden
            rounded-2xl border border-zinc-200/80
            bg-white/90 shadow-xl shadow-zinc-900/5
            backdrop-blur-xl
            transition-all duration-300
            hover:border-zinc-300 hover:shadow-2xl
            dark:border-white/10 dark:bg-zinc-900/90
            dark:hover:border-white/20
          "
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center">
            <Search className="h-[18px] w-[18px] text-zinc-600 transition-transform duration-300 group-hover:scale-110 dark:text-zinc-300" />
          </span>

          <span className="max-w-0 overflow-hidden pr-0 text-left opacity-0 transition-all duration-300 group-hover:max-w-[170px] group-hover:pr-4 group-hover:opacity-100">
            <span className="block whitespace-nowrap text-xs font-bold text-zinc-900 dark:text-white">
              Consultar cliente
            </span>

            <span className="block whitespace-nowrap text-[10px] text-zinc-500 dark:text-zinc-400">
              Pesquisa por CPF
            </span>
          </span>
        </button>
      </motion.div>

      {/* =========================================================
          MAIN CONTENT
      ========================================================== */}

      <div className="relative z-10 flex h-full w-full items-center justify-center overflow-y-auto px-4 pb-8 pt-24 sm:px-6 sm:pb-10 sm:pt-28">
        <div className="w-full max-w-6xl">
          {/* =====================================================
              HERO
          ====================================================== */}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="mx-auto mb-8 max-w-3xl text-center sm:mb-10"
          >
            {/* Small badge */}
            <div className="mb-5 flex justify-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200/80 bg-white/70 px-3 py-1.5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]">
                <Sparkles className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />

                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 sm:text-[11px]">
                  Ambiente comercial
                </span>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-[2rem] font-bold leading-[1.05] tracking-[-0.045em] text-zinc-950 sm:text-4xl md:text-5xl lg:text-[3.5rem] dark:text-white">
              Selecione a marca
              <span className="block text-zinc-400 dark:text-zinc-500">
                para continuar
              </span>
            </h1>

            <p className="mx-auto mt-4 max-w-xl px-3 text-sm leading-6 text-zinc-500 dark:text-zinc-400 sm:text-base">
              Escolha o ambiente da montadora que deseja acessar.
              <br className="hidden sm:block" />
              Seu acesso será direcionado automaticamente.
            </p>
          </motion.div>

          {/* =====================================================
              BRAND GRID
          ====================================================== */}

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3"
          >
            {brands.map((brand, index) => (
              <motion.div
                key={brand.key}
                variants={itemVariants}
                className="min-w-0"
              >
                <motion.button
                  type="button"
                  onClick={() => go(brand)}
                  disabled={!!brand.disabled || !!entering}
                  whileHover={
                    brand.disabled || entering
                      ? undefined
                      : {
                          y: -5,
                        }
                  }
                  whileTap={
                    brand.disabled || entering
                      ? undefined
                      : {
                          scale: 0.985,
                        }
                  }
                  transition={{
                    type: "spring",
                    stiffness: 380,
                    damping: 24,
                  }}
                  className={`
                    group relative w-full overflow-hidden
                    rounded-[22px]
                    border border-zinc-200/80
                    bg-white/80
                    text-left
                    shadow-[0_10px_40px_rgba(15,23,42,0.05)]
                    backdrop-blur-xl
                    transition-all duration-300
                    hover:border-zinc-300
                    hover:bg-white
                    hover:shadow-[0_20px_55px_rgba(15,23,42,0.10)]
                    dark:border-white/[0.08]
                    dark:bg-white/[0.045]
                    dark:hover:border-white/[0.15]
                    dark:hover:bg-white/[0.065]
                    dark:hover:shadow-[0_20px_60px_rgba(0,0,0,0.35)]
                    ${
                      brand.disabled
                        ? "cursor-not-allowed opacity-50"
                        : "cursor-pointer"
                    }
                  `}
                >
                  {/* Accent line */}
                  <div
                    className={`
                      absolute left-0 right-0 top-0 h-[3px]
                      bg-gradient-to-r ${brand.accent}
                      opacity-70
                      transition-all duration-300
                      group-hover:h-1
                    `}
                  />

                  {/* Hover glow */}
                  <div
                    className={`
                      pointer-events-none absolute
                      -right-20 -top-20 h-48 w-48
                      rounded-full
                      bg-gradient-to-br ${brand.accent}
                      opacity-0 blur-3xl
                      transition-opacity duration-500
                      group-hover:opacity-20
                    `}
                  />

                  <div className="relative p-5 sm:p-6">
                    {/* Top row */}
                    <div className="flex items-center justify-between">
                      {/* Logo */}
                      <div
                        className="
                          flex h-14 w-14 items-center justify-center
                          rounded-[17px]
                          border border-zinc-200/80
                          bg-white
                          shadow-sm
                          transition-all duration-300
                          group-hover:scale-105
                          group-hover:shadow-md
                          dark:border-white/10
                          dark:bg-white/[0.08]
                        "
                      >
                        <img
                          src={brand.logo}
                          alt={brand.name}
                          className={`w-auto object-contain ${logoSize(
                            brand.key
                          )}`}
                        />
                      </div>

                      {/* Shortcut */}
                      <div
                        className="
                          flex h-7 min-w-7 items-center justify-center
                          rounded-lg border border-zinc-200/70
                          bg-zinc-50 px-2
                          text-[10px] font-bold text-zinc-400
                          transition-colors
                          group-hover:border-zinc-300
                          group-hover:text-zinc-600
                          dark:border-white/10
                          dark:bg-white/[0.03]
                          dark:text-zinc-500
                          dark:group-hover:text-zinc-300
                        "
                      >
                        {index + 1}
                      </div>
                    </div>

                    {/* Text */}
                    <div className="mt-5">
                      <div className="flex items-center justify-between gap-3">
                        <h2 className="text-lg font-bold tracking-tight text-zinc-950 dark:text-white sm:text-xl">
                          {brand.name}
                        </h2>

                        <motion.div
                          initial={{ opacity: 0, x: -5 }}
                          whileHover={{ opacity: 1, x: 0 }}
                          className="text-zinc-400 transition-colors group-hover:text-zinc-700 dark:group-hover:text-zinc-200"
                        >
                          <ArrowRight className="h-5 w-5" />
                        </motion.div>
                      </div>

                      <p className="mt-1.5 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                        {brand.disabled
                          ? "Disponível em breve"
                          : brand.description}
                      </p>
                    </div>

                    {/* Bottom */}
                    <div className="mt-5 flex items-center justify-between">
                      <span
                        className={`
                          inline-flex items-center rounded-full
                          border px-2.5 py-1
                          text-[9px] font-bold uppercase
                          tracking-[0.14em]
                          ${brand.soft}
                        `}
                      >
                        {brand.disabled ? "Em breve" : "Disponível"}
                      </span>

                      {!brand.disabled && (
                        <span className="text-[10px] font-medium text-zinc-400 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 dark:text-zinc-500">
                          Acessar
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bottom progress */}
                  <div className="h-px w-full bg-zinc-200/60 dark:bg-white/[0.06]" />

                  <div
                    className={`
                      h-[2px] w-0
                      bg-gradient-to-r ${brand.accent}
                      transition-all duration-500
                      group-hover:w-full
                    `}
                  />
                </motion.button>
              </motion.div>
            ))}
          </motion.div>

          {/* =====================================================
              FOOTER / SHORTCUTS
          ====================================================== */}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-5"
          >

            <span className="hidden h-1 w-1 rounded-full bg-zinc-300 sm:block dark:bg-zinc-700" />

            <div className="text-[10px] text-zinc-400 dark:text-zinc-500">

            </div>
          </motion.div>
        </div>
      </div>

      {/* =========================================================
          ENTERING OVERLAY
      ========================================================== */}

      <AnimatePresence>
        {entering && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[9999]"
          >
            {/* Background */}
            <div className="absolute inset-0 bg-white/90 backdrop-blur-2xl dark:bg-black/85" />

            {/* Accent background */}
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.16 }}
              transition={{ duration: 0.8 }}
              className={`
                absolute left-1/2 top-1/2
                h-[500px] w-[500px]
                -translate-x-1/2 -translate-y-1/2
                rounded-full
                bg-gradient-to-br ${entering.accent}
                blur-[100px]
              `}
            />

            <div className="relative z-10 grid h-[100svh] place-items-center p-6">
              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.88,
                  y: 15,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  scale: 0.94,
                }}
                transition={{
                  type: "spring",
                  stiffness: 280,
                  damping: 22,
                }}
                className="flex w-full max-w-sm flex-col items-center text-center"
              >
                {/* Logo */}
                <div
                  className="
                    relative flex h-24 w-24
                    items-center justify-center
                    rounded-[28px]
                    border border-zinc-200/80
                    bg-white/90
                    shadow-2xl shadow-zinc-900/10
                    dark:border-white/10
                    dark:bg-white/[0.08]
                  "
                >
                  <div
                    className={`
                      absolute inset-0 rounded-[28px]
                      bg-gradient-to-br ${entering.accent}
                      opacity-10
                    `}
                  />

                  <img
                    src={entering.logo}
                    alt={entering.name}
                    className={`relative w-auto object-contain ${logoSize(
                      entering.key
                    )}`}
                  />
                </div>

                {/* Text */}
                <div className="mt-7 text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400 dark:text-zinc-500">
                  Acessando ambiente
                </div>

                <div className="mt-2 text-3xl font-bold tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
                  {entering.name}
                </div>

                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                  Preparando seu acesso...
                </p>

                {/* Progress */}
                <div className="mt-7 h-1 w-56 overflow-hidden rounded-full bg-zinc-200 dark:bg-white/10 sm:w-64">
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{
                      duration: 0.56,
                      ease: "easeOut",
                    }}
                    className={`h-full rounded-full bg-gradient-to-r ${entering.accent}`}
                  />
                </div>

                {/* Loading dots */}
                <div className="mt-5 flex items-center gap-1.5">
                  {[0, 1, 2].map((dot) => (
                    <motion.span
                      key={dot}
                      animate={{
                        opacity: [0.25, 1, 0.25],
                        scale: [0.8, 1, 0.8],
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: dot * 0.15,
                      }}
                      className="h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500"
                    />
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================
          GLOBAL STYLES
      ========================================================== */}

      <style jsx global>{`
        html,
        body {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          overscroll-behavior: none;
          background: #f7f8fa;
        }

        html.dark,
        body.dark {
          background: #09090b;
        }

        #__next {
          height: 100%;
          overflow: hidden;
        }

        /* ---------------------------------------------
           Grid
        --------------------------------------------- */

        .bg-grid {
          background-image:
            linear-gradient(
              to right,
              rgba(15, 23, 42, 0.055) 1px,
              transparent 1px
            ),
            linear-gradient(
              to bottom,
              rgba(15, 23, 42, 0.055) 1px,
              transparent 1px
            );
          background-size: 52px 52px;
        }

        .dark .bg-grid {
          background-image:
            linear-gradient(
              to right,
              rgba(255, 255, 255, 0.055) 1px,
              transparent 1px
            ),
            linear-gradient(
              to bottom,
              rgba(255, 255, 255, 0.055) 1px,
              transparent 1px
            );
        }

        /* ---------------------------------------------
           Ambient lights
        --------------------------------------------- */

        .ambient {
          position: absolute;
          border-radius: 9999px;
          pointer-events: none;
          filter: blur(90px);
          animation: ambientFloat 16s ease-in-out infinite;
        }

        .ambient-blue {
          width: 460px;
          height: 460px;
          left: -220px;
          top: -190px;
          background: rgba(59, 130, 246, 0.12);
        }

        .ambient-purple {
          width: 420px;
          height: 420px;
          right: -200px;
          bottom: -180px;
          background: rgba(139, 92, 246, 0.10);
          animation-delay: -5s;
        }

        .ambient-cyan {
          width: 340px;
          height: 340px;
          right: 10%;
          top: 15%;
          background: rgba(6, 182, 212, 0.07);
          animation-delay: -9s;
        }

        .dark .ambient-blue {
          background: rgba(59, 130, 246, 0.12);
        }

        .dark .ambient-purple {
          background: rgba(139, 92, 246, 0.12);
        }

        .dark .ambient-cyan {
          background: rgba(6, 182, 212, 0.08);
        }

        /* ---------------------------------------------
           Animation
        --------------------------------------------- */

        @keyframes ambientFloat {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
          }

          33% {
            transform: translate3d(18px, -20px, 0) scale(1.04);
          }

          66% {
            transform: translate3d(-12px, 15px, 0) scale(0.98);
          }

          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
        }

        /* ---------------------------------------------
           Mobile
        --------------------------------------------- */

        @media (max-width: 640px) {
          .bg-grid {
            background-size: 38px 38px;
          }

          .ambient {
            filter: blur(65px);
          }

          .ambient-blue {
            width: 300px;
            height: 300px;
            left: -150px;
            top: -130px;
          }

          .ambient-purple {
            width: 280px;
            height: 280px;
            right: -140px;
            bottom: -120px;
          }

          .ambient-cyan {
            width: 220px;
            height: 220px;
          }
        }

        /* ---------------------------------------------
           Reduced motion
        --------------------------------------------- */

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </main>
  );
}
