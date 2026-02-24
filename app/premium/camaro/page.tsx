"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  ArrowRight,
  Gauge,
  Timer,
  Zap,
  ChevronRight,
  Volume2,
  VolumeX,
  ShieldCheck,
  Award,
  Flame,
  MousePointer2,
  RotateCw,
  Layers,
  Loader2,
  AlertCircle,
  Lock,
  Wallet,
  Banknote,
  CheckCircle2,
} from "lucide-react";

// --- MÁSCARAS E HELPERS (do OrderSummary) ---
const maskCPF = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})/, "$1-$2")
    .replace(/(-\d{2})\d+?$/, "$1");
};

const validateEmail = (email: string) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// --- TELEFONE FIXO +55 ---
const PHONE_PREFIX_DISPLAY = "+55 ";
const PHONE_PREFIX_E164 = "+55";

// ✅ fallback padrão (pra não “sumir” o DDD quando o usuário digitar só o número)
// Troque para "" se você quiser OBRIGAR digitar DDD
const DEFAULT_DDD = "91";

// ✅ máscara agora aceita DDD (2) + número (9) = 11 dígitos
// Formato: "91 9XXXX-XXXX"
const maskPhoneAfterPrefix = (value: string) => {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 11); // 2 DDD + 9 número
  if (!digits) return "";

  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2); // até 9

  // só DDD
  if (digits.length <= 2) return ddd;

  // DDD + 1..5
  if (rest.length <= 5) return `${ddd} ${rest}`;

  // DDD + 9xxxx-xxxx
  return `${ddd} ${rest.slice(0, 5)}-${rest.slice(5, 9)}`;
};

// ✅ pega SOMENTE dígitos do telefone e normaliza para E.164 com +55
// - aceita input com +55, com/sem máscara
// - se vier só número (8/9), aplica DEFAULT_DDD (se definido)
const normalizePhoneToE164 = (fullValue: string) => {
  const digits = String(fullValue || "").replace(/\D/g, "");
  const noCountry = digits.startsWith("55") ? digits.slice(2) : digits;

  // já veio com DDD + número (fixo 10 ou cel 11)
  if (noCountry.length === 10 || noCountry.length === 11) return `+55${noCountry}`;

  // veio só número (8/9), aplica fallback
  if ((noCountry.length === 8 || noCountry.length === 9) && DEFAULT_DDD) {
    const ddd = String(DEFAULT_DDD).replace(/\D/g, "").slice(0, 2);
    if (ddd.length === 2) return `+55${ddd}${noCountry}`;
  }

  return ""; // inválido
};

const moneyBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(!!mq.matches);
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);
  return reduced;
}

function SectionTitle({
  eyebrow,
  title,
  subtitle,
  icon,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="text-center mb-14">
      {eyebrow ? (
        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#f2e14c]/90 mb-4">
          {eyebrow}
        </p>
      ) : null}
      <div className="inline-flex items-center justify-center gap-2 mb-4">
        {icon ? <span className="text-[#f2e14c]">{icon}</span> : null}
        <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tight">{title}</h2>
      </div>
      {subtitle ? (
        <p className="text-sm text-white/55 leading-relaxed max-w-2xl mx-auto">{subtitle}</p>
      ) : null}
    </div>
  );
}

function SpecCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="group relative rounded-2xl border border-white/8 bg-white/[0.04] p-6 overflow-hidden transition-all hover:border-[#f2e14c]/35 hover:bg-white/[0.055]">
      <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-[#f2e14c]/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-[#f2e14c]/10 border border-[#f2e14c]/15 flex items-center justify-center text-[#f2e14c]">
            {icon}
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-white/55 group-hover:text-white/80 transition-colors">
            {label}
          </span>
        </div>

        <p className="text-4xl font-black italic text-white tracking-tight">{value}</p>
        <p className="text-[10px] text-white/35 mt-2 uppercase tracking-widest">{hint}</p>
      </div>
    </div>
  );
}

// --- DADOS DO CAMARO ---
const CAMARO_DATA = {
  nome: "Camaro SS Collection",
  subtitulo: "A Despedida da Lenda. Edição Limitada.",
  preco: 555900,

  motor: "6.2L V8 LT1",
  potencia: "461 CV",
  torque: "62.9 kgfm",
  velocidade_max: "290 km/h",

  imagem_hero:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/2018-Camaro-ZL1-1LE-13.jpg",
  imagem_interior_full:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/2024-chevrolet-camaro-ss-collectors-edition-1200x720.jpg",
  imagem_volante:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/galeria-3%20(1).avif",
  imagem_bancos:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/galeria-4.avif",
  imagem_motor:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/pbx_9188-tif.webp",

  som_motor:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/esportivos/audio%20motor%20camaro.mp4",
};

const ROTATION_IMAGES = [
  "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/esportivos/camaro-ss/cor-preto_global-front/1769189515548_25jz4n.avif",
  "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/esportivos/camaro-ss/cor-preto_global-side/1769189515793_7xi1ud.avif",
  "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/esportivos/camaro-ss/cor-preto_global-rear_angle/1769189516087_tj1mii.avif",
];

export default function CamaroPage() {
  const router = useRouter();
  const prefersReducedMotion = usePrefersReducedMotion();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeRafRef = useRef<number | null>(null);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [showStickyNav, setShowStickyNav] = useState(false);
  const [showMobileCTA, setShowMobileCTA] = useState(false);

  const [rotationIndex, setRotationIndex] = useState(0);

  // ✅ auth + user
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // ✅ scroll para o final (form)
  const orderSectionId = "order-summary";

  // ✅ form (igual OrderSummary)
  const [clientName, setClientName] = useState("");
  const [clientCpf, setClientCpf] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState(PHONE_PREFIX_DISPLAY);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    clientName: "",
    clientCpf: "",
    clientEmail: "",
    clientPhone: "",
  });

  // Section refs (scroll suave)
  const sectionRefs = useMemo(
    () => ({
      specs: "specs",
      rot: "rotacao",
      engine: "motor",
      interior: "interior",
      cta: "cta",
      order: orderSectionId,
    }),
    []
  );

  const scrollToId = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
  };

  // --- áudio ---
  const stopImmediatelyAndResetSoft = () => {
    const a = audioRef.current;
    if (!a) return;

    try {
      a.pause();
    } catch {}

    setIsFadingOut(true);
    const start = performance.now();
    const startVol = typeof a.volume === "number" ? a.volume : 0.6;
    const DURATION = 220;

    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / DURATION);
      a.volume = Math.max(0, startVol * (1 - p));

      if (p < 1) {
        fadeRafRef.current = requestAnimationFrame(tick);
        return;
      }

      try {
        a.currentTime = 0;
      } catch {}
      a.volume = 0.6;
      setIsFadingOut(false);
    };

    if (fadeRafRef.current) cancelAnimationFrame(fadeRafRef.current);
    fadeRafRef.current = requestAnimationFrame(tick);
  };

  const playFromStartNoLoop = async () => {
    const a = audioRef.current;
    if (!a) return;

    if (fadeRafRef.current) cancelAnimationFrame(fadeRafRef.current);
    setIsFadingOut(false);

    a.loop = false;
    try {
      a.currentTime = 0;
    } catch {}
    a.volume = 0.6;

    try {
      await a.play();
      setIsPlaying(true);
    } catch (e) {
      console.log("Interação necessária", e);
    }
  };

  const toggleEngine = () => {
    const a = audioRef.current;
    if (!a || isFadingOut) return;

    if (isPlaying) {
      stopImmediatelyAndResetSoft();
      setIsPlaying(false);
    } else {
      playFromStartNoLoop();
    }
  };

  // ✅ auth session
  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        setUser(data.session?.user ?? null);
      } finally {
        if (mounted) setAuthLoading(false);
      }
    }

    loadSession();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Scroll effects
  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setShowStickyNav(y > 220);
      setShowMobileCTA(y > 520);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Teclado para rotação 360
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") setRotationIndex((v) => clamp(v - 1, 0, ROTATION_IMAGES.length - 1));
      if (e.key === "ArrowRight") setRotationIndex((v) => clamp(v + 1, 0, ROTATION_IMAGES.length - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      const a = audioRef.current;
      if (a) {
        try {
          a.pause();
          a.currentTime = 0;
        } catch {}
      }
      if (fadeRafRef.current) cancelAnimationFrame(fadeRafRef.current);
    };
  }, []);

  // ✅ "Garanta o seu": vai pro final da página (form)
  const handleFazerPedido = () => {
    scrollToId(sectionRefs.order);
  };

  // --- Handlers do form (do OrderSummary) ---
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setClientCpf(maskCPF(e.target.value));
    if (errors.clientCpf) setErrors({ ...errors, clientCpf: "" });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const typed = e.target.value || "";

    let after = typed.startsWith(PHONE_PREFIX_DISPLAY)
      ? typed.slice(PHONE_PREFIX_DISPLAY.length)
      : typed.replace(PHONE_PREFIX_DISPLAY, "");

    const maskedAfter = maskPhoneAfterPrefix(after);
    setClientPhone(PHONE_PREFIX_DISPLAY + maskedAfter);

    if (errors.clientPhone) setErrors({ ...errors, clientPhone: "" });
  };

  // ✅ finalizar: salva em sales e envia para /vendedor/analise com query preenchida
  const handleFinishOrder = async () => {
    let newErrors = { clientName: "", clientCpf: "", clientEmail: "", clientPhone: "" };
    let hasError = false;

    if (authLoading) return;

    if (!user) {
      scrollToId(sectionRefs.order);
      return;
    }

    if (clientName.trim().length < 3) {
      newErrors.clientName = "Nome completo é obrigatório.";
      hasError = true;
    }

    if (clientCpf.length < 14) {
      newErrors.clientCpf = "CPF inválido ou incompleto.";
      hasError = true;
    }

    if (!clientEmail || !validateEmail(clientEmail)) {
      newErrors.clientEmail = "Insira um e-mail válido.";
      hasError = true;
    }

    // ✅ agora valida DDD+telefone OU aplica fallback DEFAULT_DDD
    const telefoneE164 = normalizePhoneToE164(clientPhone);
    if (!telefoneE164) {
      newErrors.clientPhone = DEFAULT_DDD
        ? "Telefone inválido. Digite DDD + número (ex: 91 9XXXX-XXXX)."
        : "Telefone inválido. Digite DDD + número (ex: 11 9XXXX-XXXX).";
      hasError = true;
    }

    setErrors(newErrors);
    if (hasError) return;

    setLoading(true);

    try {
      const saleData = {
        car_id: "camaro-ss-collection",
        car_name: CAMARO_DATA.nome,
        seller_id: user.id,
        client_name: clientName,
        client_cpf: clientCpf,
        client_email: clientEmail,
        client_phone: telefoneE164, // ✅ E.164 correto
        total_price: CAMARO_DATA.preco,
        status: "Enviado para Análise",
        interest_type: "Pendente (Aba Análise)",
        details: {
          color: "Padrão",
          wheels: "Padrão",
          seats: "Padrão",
          accessories: [],
        },
        created_at: new Date().toISOString(),
      };

      await supabase.from("sales").insert([saleData]);

      const query = new URLSearchParams({
        nome: clientName,
        cpf: clientCpf,
        telefone: telefoneE164, // ✅ não some no contrato
        modelo: CAMARO_DATA.nome,
        valor: CAMARO_DATA.preco.toString(),
        entrada: "0",
        renda: "0",
        imagem: CAMARO_DATA.imagem_hero,
      }).toString();

      router.push(`/vendedor/analise?${query}`);
    } catch (error: any) {
      console.error("Erro ao processar:", error);
      alert("Erro ao processar pedido: " + (error?.message || "erro desconhecido"));
      setLoading(false);
    }
  };

  const rotPct = (rotationIndex / (ROTATION_IMAGES.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#f2e14c] selection:text-black pb-24 overflow-x-hidden">
      <audio
        ref={audioRef}
        src={CAMARO_DATA.som_motor}
        preload="none"
        loop={false}
        onEnded={() => {
          setIsPlaying(false);
          const a = audioRef.current;
          if (a) {
            try {
              a.currentTime = 0;
            } catch {}
            a.volume = 0.6;
          }
        }}
      />

      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(242,225,76,0.08)_0%,rgba(5,5,5,0)_55%)] opacity-60" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.65)_70%)]" />
      </div>

      {/* --- NAVBAR --- */}
      <header
        className={[
          "fixed top-0 w-full z-50 transition-all duration-500 border-b",
          showStickyNav
            ? "bg-black/80 backdrop-blur-xl border-white/10 py-3"
            : "bg-transparent border-transparent py-6",
        ].join(" ")}
      >
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <Link
            href="/"
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Voltar
          </Link>

          <nav
            className={[
              "hidden lg:flex items-center gap-5 text-[10px] font-black uppercase tracking-widest transition-all duration-500",
              showStickyNav ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none",
            ].join(" ")}
          >
            <button
              onClick={() => scrollToId(sectionRefs.specs)}
              className="text-white/55 hover:text-white transition-colors"
            >
              Destaques
            </button>
            <button
              onClick={() => scrollToId(sectionRefs.rot)}
              className="text-white/55 hover:text-white transition-colors"
            >
              360º
            </button>
            <button
              onClick={() => scrollToId(sectionRefs.engine)}
              className="text-white/55 hover:text-white transition-colors"
            >
              Motor
            </button>
            <button
              onClick={() => scrollToId(sectionRefs.interior)}
              className="text-white/55 hover:text-white transition-colors"
            >
              Interior
            </button>
            <button
              onClick={() => scrollToId(sectionRefs.order)}
              className="text-white/55 hover:text-white transition-colors"
            >
              Finalizar
            </button>
            <span className="mx-1 w-[1px] h-4 bg-white/10" />
            <span className="text-white/85 tracking-tight">{CAMARO_DATA.nome}</span>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleEngine}
              disabled={isFadingOut}
              className={[
                "hidden md:flex items-center gap-3 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full border transition-all",
                isFadingOut ? "opacity-60 cursor-not-allowed" : "",
                isPlaying
                  ? "border-[#f2e14c]/60 text-[#f2e14c] bg-[#f2e14c]/10"
                  : "border-white/10 text-white/70 hover:text-white hover:border-white/20 bg-black/20",
              ].join(" ")}
            >
              <span className={isPlaying ? "animate-pulse" : ""}>
                {isPlaying ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </span>
              {isPlaying ? "Motor ligado" : "Ouvir V8"}
            </button>

            <button
              onClick={handleFazerPedido}
              className="bg-[#f2e14c] hover:bg-white text-black text-[10px] font-black uppercase px-5 py-2.5 rounded-full transition-all shadow-[0_0_18px_rgba(242,225,76,0.25)] hover:shadow-[0_0_28px_rgba(242,225,76,0.55)]"
            >
              Garanta o seu
            </button>
          </div>
        </div>
      </header>

      {/* --- HERO --- */}
      <section className="relative min-h-[100svh] w-full flex items-center justify-center overflow-hidden z-10">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/25 to-[#050505] z-10" />
          <div className="absolute inset-0 bg-black/35 z-10" />
          <img
            src={CAMARO_DATA.imagem_hero}
            alt="Camaro Hero"
            className={[
              "w-full h-full object-cover object-center scale-105",
              prefersReducedMotion ? "" : "animate-in zoom-in duration-[3000ms]",
            ].join(" ")}
          />
        </div>

        <div className="relative z-20 text-center px-6 max-w-5xl mx-auto pt-24 md:pt-28">
          <div className="inline-flex items-center gap-3 border border-white/15 bg-black/35 backdrop-blur-md px-5 py-2 rounded-full mb-8 shadow-lg">
            <Award size={16} className="text-[#f2e14c] fill-[#f2e14c]" />
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/90">
              The Final Edition
            </span>
          </div>

          <h1 className="text-6xl md:text-[9.5rem] font-black uppercase tracking-tighter leading-[0.86] italic drop-shadow-2xl">
            Camaro{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-[#f2e14c] to-[#ffc400] drop-shadow-none">
              SS
            </span>
          </h1>

          <p className="text-base md:text-xl text-white/70 font-medium mt-5 mb-10 max-w-2xl mx-auto leading-relaxed">
            {CAMARO_DATA.subtitulo}{" "}
            <span className="text-white/55">O último suspiro do V8 aspirado puro sangue.</span>
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
            <button
              onClick={handleFazerPedido}
              className="group relative bg-white text-black h-14 px-10 transform -skew-x-12 hover:bg-[#f2e14c] transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.18)] hover:shadow-[0_0_40px_rgba(242,225,76,0.35)]"
            >
              <div className="transform skew-x-12 flex items-center gap-3 font-black uppercase tracking-widest text-xs">
                Garanta o Seu
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            <button
              onClick={toggleEngine}
              disabled={isFadingOut}
              className={[
                "flex items-center gap-4 text-xs font-black uppercase tracking-widest text-white/85 hover:text-[#f2e14c] transition-colors group bg-black/25 backdrop-blur-sm px-6 py-4 rounded-full border border-white/10 hover:border-[#f2e14c]/40",
                isFadingOut ? "opacity-60 cursor-not-allowed" : "",
              ].join(" ")}
            >
              <div
                className={[
                  "w-9 h-9 rounded-full border flex items-center justify-center transition-all",
                  isPlaying
                    ? "border-[#f2e14c] text-[#f2e14c] bg-[#f2e14c]/15 animate-pulse"
                    : "border-white/25 text-white/80 group-hover:border-[#f2e14c]/60 group-hover:bg-[#f2e14c]/10",
                ].join(" ")}
              >
                {isPlaying ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </div>
              <span className="group-hover:translate-x-1 transition-transform">
                {isPlaying ? "Desligar Motor" : "Ouvir o V8"}
              </span>
            </button>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-2">
            {[
              { label: "Motor", value: CAMARO_DATA.motor },
              { label: "Potência", value: CAMARO_DATA.potencia },
              { label: "0–100", value: "4.2s" },
              { label: "Vel. Máx", value: CAMARO_DATA.velocidade_max },
            ].map((x) => (
              <div
                key={x.label}
                className="px-4 py-2 rounded-full border border-white/10 bg-black/25 backdrop-blur text-[10px] uppercase tracking-widest text-white/70"
              >
                <span className="text-white/40 mr-2">{x.label}</span>
                <span className="text-white/90 font-black">{x.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- SPECS GRID --- */}
      <section id={sectionRefs.specs} className="py-24 px-6 relative z-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <SectionTitle
            eyebrow="Destaques"
            title={
              <>
                Performance <span className="text-[#f2e14c]">na veia</span>
              </>
            }
            subtitle="Números que explicam por que o Camaro SS é uma experiência — não só um carro."
            icon={<ShieldCheck size={18} />}
          />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <SpecCard icon={<Gauge size={20} />} label="Potência" value={CAMARO_DATA.potencia} hint="@ 6.000 RPM" />
            <SpecCard icon={<Flame size={20} />} label="Torque" value={CAMARO_DATA.torque} hint="Força Bruta" />
            <SpecCard icon={<Timer size={20} />} label="0 a 100" value="4.2s" hint="Controle de Largada" />
            <SpecCard icon={<Zap size={20} />} label="Velocidade" value={CAMARO_DATA.velocidade_max} hint="Limitada eletronicamente" />
          </div>
        </div>
      </section>

      {/* --- ROTAÇÃO 360 --- */}
      <section
        id={sectionRefs.rot}
        className="py-24 px-6 bg-[#080808] relative z-10 border-t border-white/5 overflow-hidden"
      >
        <div className="max-w-6xl mx-auto">
          <SectionTitle
            eyebrow="Experiência"
            title={
              <>
                Explore cada <span className="text-[#f2e14c]">ângulo</span>
              </>
            }
            subtitle={<>Use o slider (ou ← → no teclado) para alternar os ângulos.</>}
            icon={<RotateCw size={18} className={prefersReducedMotion ? "" : "animate-spin-slow"} />}
          />

          <div className="relative">
            <div className="relative aspect-[16/9] w-full max-w-5xl mx-auto rounded-3xl overflow-hidden bg-white/5 border border-white/10 shadow-2xl">
              {ROTATION_IMAGES.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`Camaro ângulo ${idx}`}
                  className={[
                    "absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-in-out",
                    rotationIndex === idx ? "opacity-100 z-10" : "opacity-0 z-0",
                  ].join(" ")}
                />
              ))}
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/55 via-transparent to-transparent z-20" />
            </div>

            <div className="mt-8 max-w-2xl mx-auto">
              <div className="flex items-center justify-between gap-3 mb-4">
                <button
                  onClick={() => setRotationIndex((v) => clamp(v - 1, 0, ROTATION_IMAGES.length - 1))}
                  className="px-4 py-3 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.06] transition-all text-[10px] font-black uppercase tracking-widest"
                >
                  ← Anterior
                </button>
                <div className="text-[10px] uppercase tracking-widest text-white/50 font-black">
                  {rotationIndex + 1}/{ROTATION_IMAGES.length}
                </div>
                <button
                  onClick={() => setRotationIndex((v) => clamp(v + 1, 0, ROTATION_IMAGES.length - 1))}
                  className="px-4 py-3 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.06] transition-all text-[10px] font-black uppercase tracking-widest"
                >
                  Próximo →
                </button>
              </div>

              <div className="relative w-full h-2 bg-white/10 rounded-full">
                <div
                  className="absolute top-0 left-0 h-full bg-[#f2e14c] rounded-full transition-all duration-300"
                  style={{ width: `${rotPct}%` }}
                />
                <input
                  aria-label="Controle de rotação do Camaro"
                  type="range"
                  min="0"
                  max={ROTATION_IMAGES.length - 1}
                  step="1"
                  value={rotationIndex}
                  onChange={(e) => setRotationIndex(parseInt(e.target.value))}
                  className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-30"
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full shadow-[0_0_15px_rgba(242,225,76,0.8)] border-2 border-[#f2e14c] pointer-events-none transition-all duration-300 z-20"
                  style={{ left: `${rotPct}%`, transform: `translate(-50%, -50%)` }}
                />
              </div>

              <p className="mt-4 text-xs text-white/55 flex items-center justify-center gap-2">
                <MousePointer2 size={12} /> Arraste para girar (ou ← →)
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- ENGINE SECTION --- */}
      <section id={sectionRefs.engine} className="py-20 relative z-10 overflow-hidden border-t border-white/5">
        <div className="absolute inset-0">
          <img
            src={CAMARO_DATA.imagem_motor}
            className="w-full h-full object-cover opacity-10 blur-xl scale-125"
            alt="Background texture"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-[#050505]/85 to-[#050505]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center relative">
          <div className="relative rounded-3xl overflow-hidden border border-white/10 aspect-square lg:aspect-[4/3] bg-white/5">
            <img src={CAMARO_DATA.imagem_motor} alt="Motor V8" className="w-full h-full object-cover" />
            <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black via-black/80 to-transparent">
              <p className="text-white font-black text-2xl uppercase">6.2L LT1 V8</p>
              <p className="text-white/55 text-xs">Small Block Chevy • Injeção Direta</p>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#f2e14c]/90 mb-4">Mecânica</p>
            <h2 className="text-4xl md:text-6xl font-black uppercase italic mb-6 leading-[0.95]">
              O Coração <br />
              <span className="text-[#f2e14c]">Da Besta.</span>
            </h2>

            <p className="text-white/55 text-sm leading-relaxed mb-8 border-l-2 border-[#f2e14c] pl-4">
              Sob o capô, respira o lendário motor V8 Small Block da GM. Sem turbos, sem assistência elétrica.
              Apenas admissão atmosférica pura, entregando torque instantâneo e uma sinfonia mecânica a 6.000 RPM.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <button
                onClick={toggleEngine}
                disabled={isFadingOut}
                className={[
                  "px-5 py-3 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all",
                  isFadingOut ? "opacity-60 cursor-not-allowed" : "",
                  isPlaying
                    ? "border-[#f2e14c]/55 bg-[#f2e14c]/10 text-[#f2e14c]"
                    : "border-white/10 bg-white/[0.03] text-white/70 hover:text-white hover:bg-white/[0.05] hover:border-white/20",
                ].join(" ")}
              >
                {isPlaying ? "Desligar som do motor" : "Tocar som do motor"}
              </button>

              <button
                onClick={() => scrollToId(sectionRefs.order)}
                className="px-5 py-3 rounded-full border border-[#f2e14c]/35 bg-[#f2e14c]/10 text-[#f2e14c] text-[10px] font-black uppercase tracking-widest hover:bg-[#f2e14c]/15 transition-all"
              >
                Ir para finalização
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* --- INTERIOR --- */}
      <section id={sectionRefs.interior} className="py-24 px-6 bg-[#080808] relative z-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <SectionTitle
            eyebrow="Cabine"
            title={
              <>
                Cockpit <span className="text-[#f2e14c]">Jet-Fighter</span>
              </>
            }
            subtitle="Inspirado em caças de combate, focado no piloto. Materiais premium e ergonomia de pista."
            icon={<Layers size={18} />}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-1 md:col-span-2 relative h-[52vh] rounded-3xl overflow-hidden group border border-white/10 bg-white/5">
              <img
                src={CAMARO_DATA.imagem_interior_full}
                alt="Interior Camaro"
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
            </div>

            <div className="relative h-[40vh] rounded-3xl overflow-hidden group border border-white/10 bg-white/5">
              <img
                src={CAMARO_DATA.imagem_bancos}
                alt="Bancos Camaro"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/45 group-hover:bg-black/25 transition-all" />
            </div>

            <div className="relative h-[40vh] rounded-3xl overflow-hidden group border border-white/10 bg-white/5">
              <img
                src={CAMARO_DATA.imagem_volante}
                alt="Sistema de som e cockpit"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/45 group-hover:bg-black/25 transition-all" />
            </div>
          </div>
        </div>
      </section>

      {/* --- FINALIZAÇÃO (FORM EM FUNDO BRANCO) --- */}
      <section id={orderSectionId} className="py-24 px-6 relative z-10 border-t border-white/5 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10">
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-black/70 mb-3">Finalização</p>
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-black">
              Garanta o Seu <span className="text-black/60">com segurança</span>
            </h2>
            <p className="text-sm text-black/60 mt-3 max-w-3xl">
              Preencha os dados do cliente para enviar para o módulo de <strong>Análise de Crédito</strong>.
              *Somente vendedores logados conseguem avançar.
            </p>
          </div>

          {!user ? (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-10 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                <Lock className="text-gray-500" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Funcionalidade Restrita</h3>
              <p className="text-gray-500 mb-6 max-w-md">A finalização de propostas é exclusiva para vendedores logados.</p>
              <Link
                href="/login"
                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
              >
                Fazer Login de Vendedor
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* FORM */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200">
                  Informações do Cliente
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                      Nome Completo <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={clientName}
                      onChange={(e) => {
                        setClientName(e.target.value);
                        if (errors.clientName) setErrors({ ...errors, clientName: "" });
                      }}
                      className={`w-full h-12 px-4 border rounded-lg focus:outline-none transition-all text-sm text-black placeholder-gray-400
                        ${errors.clientName ? "border-red-500 bg-red-50" : "border-gray-300 focus:border-black bg-white"}
                      `}
                      placeholder="Digite o nome completo"
                    />
                    {errors.clientName && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle size={10} /> {errors.clientName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                      CPF <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={clientCpf}
                      onChange={handleCpfChange}
                      maxLength={14}
                      className={`w-full h-12 px-4 border rounded-lg focus:outline-none transition-all text-sm text-black placeholder-gray-400
                        ${errors.clientCpf ? "border-red-500 bg-red-50" : "border-gray-300 focus:border-black bg-white"}
                      `}
                      placeholder="000.000.000-00"
                    />
                    {errors.clientCpf && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle size={10} /> {errors.clientCpf}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={clientEmail}
                      onChange={(e) => {
                        setClientEmail(e.target.value);
                        if (errors.clientEmail) setErrors({ ...errors, clientEmail: "" });
                      }}
                      className={`w-full h-12 px-4 border rounded-lg focus:outline-none transition-all text-sm text-black placeholder-gray-400
                        ${errors.clientEmail ? "border-red-500 bg-red-50" : "border-gray-300 focus:border-black bg-white"}
                      `}
                      placeholder="exemplo@email.com"
                    />
                    {errors.clientEmail && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle size={10} /> {errors.clientEmail}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                      Telefone <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={clientPhone}
                      onChange={handlePhoneChange}
                      // ✅ +55 + " " + (2 DDD + espaço + 9xxxx-xxxx) ≈ 16 chars
                      maxLength={PHONE_PREFIX_DISPLAY.length + 14}
                      className={`w-full h-12 px-4 border rounded-lg focus:outline-none transition-all text-sm text-black placeholder-gray-400
                        ${errors.clientPhone ? "border-red-500 bg-red-50" : "border-gray-300 focus:border-black bg-white"}
                      `}
                      placeholder="+55 91 9XXXX-XXXX"
                    />
                    {errors.clientPhone && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle size={10} /> {errors.clientPhone}
                      </p>
                    )}
                    {/* ✅ dica pro vendedor */}
                    <p className="text-[11px] text-gray-500 mt-2">
                      Digite <strong>DDD + número</strong> (ex: <strong>91 9XXXX-XXXX</strong>)
                      {DEFAULT_DDD ? (
                        <>
                          {" "}
                          • Se digitar só o número, o sistema usa <strong>DDD {DEFAULT_DDD}</strong>.
                        </>
                      ) : null}
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <button
                    onClick={handleFinishOrder}
                    disabled={loading}
                    className="bg-[#1c1c1c] text-white font-bold py-4 px-10 rounded-xl hover:bg-black transition-all flex items-center gap-3 shadow-lg disabled:opacity-70 text-xs uppercase tracking-widest group"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <>
                        Avançar para Análise{" "}
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* INFO */}
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                <h4 className="text-sm font-bold text-gray-700 uppercase mb-4 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-green-600" /> Próxima Etapa: Crédito
                </h4>

                <div className="grid grid-cols-1 gap-4 opacity-80">
                  <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center gap-3">
                    <Banknote className="text-blue-600" size={24} />
                    <div>
                      <p className="text-sm font-bold text-gray-900 leading-none">Financiamento</p>
                      <p className="text-[11px] text-gray-500 mt-1 uppercase">Aprovação em minutos</p>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center gap-3">
                    <Wallet className="text-purple-600" size={24} />
                    <div>
                      <p className="text-sm font-bold text-gray-900 leading-none">Consórcio</p>
                      <p className="text-[11px] text-gray-500 mt-1 uppercase">Cartas de crédito</p>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-gray-400 mt-4 italic">
                  * As taxas e coeficientes serão aplicados na próxima aba após a validação dos dados acima.
                </p>

                <div className="mt-6 p-4 rounded-xl border border-gray-200 bg-white">
                  <p className="text-[11px] text-gray-500 uppercase font-bold mb-2">Veículo</p>
                  <p className="text-sm font-semibold text-gray-900">{CAMARO_DATA.nome}</p>
                  <p className="text-sm text-gray-600 mt-1">{moneyBRL(CAMARO_DATA.preco)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* --- MOBILE FLOAT CTA --- */}
      <div
        className={[
          "fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md transition-all duration-500",
          showMobileCTA ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6 pointer-events-none",
        ].join(" ")}
      >
        <div className="rounded-2xl border border-white/10 bg-black/70 backdrop-blur-xl p-3 shadow-2xl">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-widest text-white/45 font-black">Camaro SS</p>
              <p className="text-sm font-black text-white truncate">{moneyBRL(CAMARO_DATA.preco)}</p>
            </div>
            <button
              onClick={handleFazerPedido}
              className="shrink-0 bg-[#f2e14c] hover:bg-white text-black text-[10px] font-black uppercase px-4 py-3 rounded-xl transition-all shadow-[0_0_18px_rgba(242,225,76,0.25)]"
            >
              Garanta o seu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}