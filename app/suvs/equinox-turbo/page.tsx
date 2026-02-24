"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  ArrowRight,
  Gauge,
  MonitorSmartphone,
  ChevronDown,
  FileText,
  ShieldCheck,
  Wrench,
  CarFront,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Expand,
  Tag,
  Loader2,
  AlertCircle,
  Lock,
  Wallet,
  Banknote,
  CheckCircle2,
} from "lucide-react";

/**
 * TEMPLATE — Landing no MODELO DOS ELÉTRICOS (Equinox EV/Blazer EV)
 * ✅ FINALIZAÇÃO NO FINAL (igual Camaro)
 * ✅ Botões "Simular agora" rolam pro final
 * ✅ Se logado: salva em sales e vai pra /vendedor/analise com query
 * ✅ Se não logado: bloqueia e mostra botão de login
 * ✅ Preço: R$ 275.790 + entrada sugerida 30%
 */

// =========================
// CONFIG (edite aqui)
// =========================
const CONFIG = {
  ano: "2026",
  titulo: "Equinox Turbo",
  subtitulo: "Consórcio ou financiamento • Simule em minutos",

  // ✅ PREÇO REAL
  priceStart: 275790, // R$ 275.790

  ctaHero: "Simular agora",
  ctaSecondary: "Solicitar contato",

  // ✅ CORRIGIDO: preenchidos os destaques que estavam como "—"
  stats: [
    { value: "177", unit: "cv", label: "1.5 Turbo • AWD • AT 8", icon: <Gauge size={18} /> },
    { value: "Wi-Fi", unit: "nativo", label: "Google integrado • AA/CarPlay", icon: <MonitorSmartphone size={18} /> },
    { value: "6", unit: "airbags", label: "Frenagem autônoma • Faixa • Ponto cego", icon: <ShieldCheck size={18} /> },
    { value: "468", unit: "L", label: "Porta-malas • conforto e acabamento", icon: <CarFront size={18} /> },
  ],

  heroImage: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/suv/galeria-aberta-01.avif",

  sectionImage:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/suv/Equinox-turbo/galeria-aberta-02.avif",
  sectionTitle: "Feito para o seu dia a dia. Completo para ir além.",
  sectionText:
    "Conforto, tecnologia e dirigibilidade equilibrada para a rotina. Simule consórcio ou financiamento de forma rápida, com atendimento humano.",

  gallery: [
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/suv/Equinox-turbo/galeria-aberta-04.avif",
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/suv/Equinox-turbo/galeria-aberta-06.avif",
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/suv/Equinox-turbo/galeria-aberta-08.avif",
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/suv/Equinox-turbo/galeria-aberta-09.avif",
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/suv/Equinox-turbo/galeria-aberta-13.avif",
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/suv/Equinox-turbo/galeria-aberta-10.avif",
  ],

  exterior: {
    trimLabel: "Chevrolet",
    headline: "Escolha o exterior e visualize em tempo real",
    colors: [
      {
        name: "Prata Shark",
        hex: "#adadad",
        img: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/suv/Equinox-turbo/Prata%20Shark.png",
      },
      {
        name: "Verde Cacti",
        hex: "#46cc73",
        img: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/suv/Equinox-turbo/Verde%20Cacti.png",
      },
      {
        name: "Preto ouro negro",
        hex: "#1f2328",
        img: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/eletricos/Screenshot_1.png",
      },
    ],
  },

  interior: {
    trimLabel: "Interior",
    colors: [
      {
        name: "Jet Black",
        hex: "#111318",
        images: [
          "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/suv/Equinox-turbo/galeria-aberta-13.avif",
          "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/suv/Equinox-turbo/galeria-aberta-15.avif",
        ],
      },
    ],
  },

  benefits: [
    { icon: <CarFront size={18} />, title: "Simulação rápida", desc: "consórcio ou financiamento" },
    { icon: <Wrench size={18} />, title: "Atendimento humano", desc: "sem complicação" },
    { icon: <FileText size={18} />, title: "Documentação orientada", desc: "do início ao fim" },
    { icon: <ShieldCheck size={18} />, title: "Transparência", desc: "condições claras" },
  ],
};

// =========================
// helpers
// =========================
const formatBRL0 = (val: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(val);

const calcEntrada30 = (valor: number) => Math.round(valor * 0.3);

type TabKey = "exterior" | "interior";

// --- MÁSCARAS E HELPERS (OrderSummary) ---
const maskCPF = (value: string) =>
  value
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})/, "$1-$2")
    .replace(/(-\d{2})\d+?$/, "$1");

const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// --- TELEFONE (BR) — com DDD + número completo ---
// Display: "+55 (DD) 9XXXX-XXXX" / "+55 (DD) XXXX-XXXX"
// DB/URL (E164 digits): "55DD9XXXXXXXX"
const PHONE_PREFIX_DISPLAY = "+55 ";
const DEFAULT_DDD = "91"; // fallback se colarem sem DDD

const onlyDigits = (v: string) => String(v || "").replace(/\D/g, "");

const maskPhoneBR = (digitsNational: string) => {
  // digitsNational = DDD(2) + número(8/9)
  const d = onlyDigits(digitsNational).slice(0, 11); // 2 + 9 = 11 máx
  if (!d) return "";

  const ddd = d.slice(0, 2);
  const num = d.slice(2);

  if (num.length <= 4) return `(${ddd}) ${num}`;
  if (num.length <= 8) return `(${ddd}) ${num.slice(0, 4)}-${num.slice(4)}`;
  return `(${ddd}) ${num.slice(0, 5)}-${num.slice(5)}`; // 9 dígitos
};

const toE164Digits = (displayPhone: string) => {
  const digits = onlyDigits(displayPhone);

  // já veio com 55
  if (digits.startsWith("55")) {
    const national = digits.slice(2);

    if (national.length === 10 || national.length === 11) return `55${national}`;

    // se veio só número (8/9) depois do 55 (sem DDD), aplica fallback
    if ((national.length === 8 || national.length === 9) && DEFAULT_DDD) {
      return `55${DEFAULT_DDD}${national}`;
    }

    return null;
  }

  // veio sem 55: pode ser DDD+numero
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;

  // veio só número (8/9), aplica fallback
  if ((digits.length === 8 || digits.length === 9) && DEFAULT_DDD) return `55${DEFAULT_DDD}${digits}`;

  return null;
};

export default function VehicleElectricStylePage() {
  const router = useRouter();

  // ======= FINALIZAÇÃO NO FINAL =======
  const orderSectionId = "order-summary";

  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Form states
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

  const scrollToId = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // ✅ pega usuário logado
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

  const handleCpfChange = (e: ChangeEvent<HTMLInputElement>) => {
    setClientCpf(maskCPF(e.target.value));
    if (errors.clientCpf) setErrors({ ...errors, clientCpf: "" });
  };

  // ✅ agora permite DDD + número completo
  const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
    const typed = e.target.value || "";

    // garante prefixo
    let rest = typed.startsWith(PHONE_PREFIX_DISPLAY)
      ? typed.slice(PHONE_PREFIX_DISPLAY.length)
      : typed.replace(PHONE_PREFIX_DISPLAY, "");

    const digitsRest = onlyDigits(rest);

    // limitar em DDD(2)+numero(9)=11
    const national = digitsRest.slice(0, 11);

    // se apagou tudo, mantém só +55
    if (!national) {
      setClientPhone(PHONE_PREFIX_DISPLAY);
      if (errors.clientPhone) setErrors({ ...errors, clientPhone: "" });
      return;
    }

    setClientPhone(PHONE_PREFIX_DISPLAY + maskPhoneBR(national));

    if (errors.clientPhone) setErrors({ ...errors, clientPhone: "" });
  };

  // ✅ todos CTAs chamam isso
  const goPrimary = () => scrollToId(orderSectionId);

  // ======= PAGE STATE (original) =======
  const [tab, setTab] = useState<TabKey>("exterior");

  const [selectedExterior, setSelectedExterior] = useState(0);
  const [selectedInterior, setSelectedInterior] = useState(0);
  const [interiorIndex, setInteriorIndex] = useState(0);

  const [lightboxOpen, setLightboxOpen] = useState(false);

  const [isImgSwitching, setIsImgSwitching] = useState(false);
  const [displayedSrc, setDisplayedSrc] = useState(CONFIG.exterior.colors[0]?.img || CONFIG.heroImage);
  const animTimer = useRef<number | null>(null);

  const mosaic = useMemo(() => {
    const g = (CONFIG.gallery ?? []).filter(Boolean);
    while (g.length < 6) g.push(CONFIG.gallery?.[0] || CONFIG.heroImage);
    return g.slice(0, 6);
  }, []);

  const exteriorCurrent = CONFIG.exterior.colors[selectedExterior]?.img?.trim() || CONFIG.heroImage;

  const interiorColor = CONFIG.interior.colors[selectedInterior];
  const interiorImages = (interiorColor?.images ?? []).filter(Boolean);
  const interiorCurrent = interiorImages[interiorIndex] || interiorImages[0] || CONFIG.heroImage;

  const switchImageTo = (nextSrc: string) => {
    if (animTimer.current) window.clearTimeout(animTimer.current);

    setIsImgSwitching(true);

    animTimer.current = window.setTimeout(() => {
      setDisplayedSrc(nextSrc);

      animTimer.current = window.setTimeout(() => {
        setIsImgSwitching(false);
      }, 90);
    }, 160);
  };

  const handleSelectInterior = (idx: number) => {
    setSelectedInterior(idx);
    setInteriorIndex(0);

    const nextColor = CONFIG.interior.colors[idx];
    const imgs = (nextColor?.images ?? []).filter(Boolean);
    const next = imgs[0] || CONFIG.heroImage;

    if (tab === "interior") switchImageTo(next);
  };

  const prevInterior = () => {
    if (interiorImages.length <= 1) return;
    const nextIndex = (interiorIndex - 1 + interiorImages.length) % interiorImages.length;
    setInteriorIndex(nextIndex);
    if (tab === "interior") switchImageTo(interiorImages[nextIndex]);
  };

  const nextInterior = () => {
    if (interiorImages.length <= 1) return;
    const nextIndex = (interiorIndex + 1) % interiorImages.length;
    setInteriorIndex(nextIndex);
    if (tab === "interior") switchImageTo(interiorImages[nextIndex]);
  };

  const handleSelectExterior = (idx: number) => {
    setSelectedExterior(idx);
    const next = CONFIG.exterior.colors[idx]?.img?.trim() || CONFIG.heroImage;
    if (tab === "exterior") switchImageTo(next);
  };

  const openLightbox = () => setLightboxOpen(true);
  const closeLightbox = () => setLightboxOpen(false);

  const handleFinishOrder = async () => {
    let newErrors = { clientName: "", clientCpf: "", clientEmail: "", clientPhone: "" };
    let hasError = false;

    if (authLoading) return;

    if (!user) {
      scrollToId(orderSectionId);
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

    const telefoneE164Digits = toE164Digits(clientPhone);
    if (!telefoneE164Digits) {
      newErrors.clientPhone = "Telefone inválido. Digite com DDD (ex: +55 (91) 9XXXX-XXXX).";
      hasError = true;
    } else {
      const national = telefoneE164Digits.slice(2); // DDD+numero
      if (national.length !== 10 && national.length !== 11) {
        newErrors.clientPhone = "Telefone incompleto. Informe DDD + número (8 ou 9 dígitos).";
        hasError = true;
      }
    }

    setErrors(newErrors);
    if (hasError) return;

    setLoading(true);

    try {
      const telefoneE164 = telefoneE164Digits!; // "55DD9XXXXXXXX"

      const valor = CONFIG.priceStart || 0;
      const entrada = valor ? calcEntrada30(valor) : 0;

      const saleData = {
        car_id: `landing-${CONFIG.titulo.toLowerCase().replace(/\s+/g, "-")}`,
        car_name: CONFIG.titulo,
        seller_id: user.id,
        client_name: clientName,
        client_cpf: clientCpf,
        client_email: clientEmail,
        client_phone: telefoneE164,
        total_price: valor,
        status: "Enviado para Análise",
        interest_type: "Pendente (Aba Análise)",
        details: {
          exterior_color: CONFIG.exterior.colors[selectedExterior]?.name || "Padrão",
          interior_color: CONFIG.interior.colors[selectedInterior]?.name || "Padrão",
          entrada_sugerida: entrada,
        },
        created_at: new Date().toISOString(),
      };

      await supabase.from("sales").insert([saleData]);

      const query = new URLSearchParams({
        nome: clientName,
        cpf: clientCpf,
        telefone: telefoneE164,
        modelo: CONFIG.titulo,
        valor: String(valor),
        entrada: String(entrada),
        renda: "0",
        imagem: CONFIG.heroImage,
      }).toString();

      router.push(`/vendedor/analise?${query}`);
    } catch (error: any) {
      console.error("Erro ao processar:", error);
      alert("Erro ao processar pedido: " + (error?.message || "erro desconhecido"));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* TOP */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto px-4 md:px-10 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-700 hover:text-black"
          >
            <ArrowLeft size={16} /> Voltar
          </Link>

          <button
            onClick={goPrimary}
            className="h-9 px-4 rounded-lg bg-[#0b4b9a] text-white text-xs font-black uppercase tracking-widest hover:bg-[#093e80] transition-colors flex items-center gap-2"
          >
            {CONFIG.ctaHero} <ArrowRight size={14} />
          </button>
        </div>
      </header>

      {/* HERO */}
      <section className="relative">
        <div className="relative w-full h-[520px] md:h-[640px] overflow-hidden">
          <img src={CONFIG.heroImage} alt={CONFIG.titulo} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/10 to-transparent" />

          <div className="absolute top-10 left-6 md:left-12 text-white">
            <p className="text-sm font-black opacity-90">{CONFIG.ano}</p>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight">{CONFIG.titulo}</h1>
            <p className="mt-2 text-sm md:text-base opacity-90">{CONFIG.subtitulo}</p>

            {CONFIG.priceStart > 0 ? (
              <div className="mt-4 inline-flex items-center gap-2 bg-black/35 backdrop-blur px-4 py-2 rounded-full border border-white/15">
                <Tag size={14} />
                <span className="text-xs font-black uppercase tracking-widest">
                  A partir de {formatBRL0(CONFIG.priceStart)}
                </span>
              </div>
            ) : null}
          </div>

          <div className="absolute bottom-8 right-6 md:right-12">
            <button
              onClick={goPrimary}
              className="h-10 md:h-11 px-6 rounded-lg bg-[#0b4b9a] text-white text-xs font-black uppercase tracking-widest hover:bg-[#093e80] transition-colors"
            >
              {CONFIG.ctaHero}
            </button>
          </div>
        </div>

        {/* FAIXA PRETA */}
        <div className="bg-[#151515] text-white">
          <div className="max-w-[1400px] mx-auto px-4 md:px-10 py-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-10">
              {CONFIG.stats.map((s, idx) => (
                <div key={idx} className="text-center">
                  <div className="flex items-center justify-center gap-2 text-white/80 mb-2">
                    <span className="opacity-80">{s.icon}</span>
                    <span className="text-[11px] font-extrabold uppercase tracking-widest opacity-70">
                      Destaque
                    </span>
                  </div>

                  <div className="flex items-end justify-center gap-2">
                    <span className="text-4xl md:text-5xl font-black tracking-tight">{s.value}</span>
                    {s.unit ? (
                      <span className="text-lg md:text-xl font-black opacity-90 mb-1">{s.unit}</span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-xs opacity-70">{s.label}</p>
                </div>
              ))}
            </div>

            {CONFIG.priceStart > 0 ? (
              <div className="mt-8 text-center text-xs text-white/60 font-bold uppercase tracking-widest">
                *Preço “a partir de” {formatBRL0(CONFIG.priceStart)}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* SEÇÃO IMAGEM + TEXTO */}
      <section className="bg-[#151515] text-white">
        <div className="max-w-[1400px] mx-auto px-4 md:px-10 py-14">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="rounded-none overflow-hidden bg-black/30">
              <img
                src={CONFIG.sectionImage}
                alt="Detalhe"
                className="w-full h-[320px] md:h-[420px] object-cover"
              />
            </div>

            <div className="max-w-xl">
              <h2 className="text-2xl md:text-3xl font-black leading-tight">{CONFIG.sectionTitle}</h2>
              <p className="mt-4 text-sm md:text-base text-white/75 leading-relaxed">
                {CONFIG.sectionText}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* GALERIA MOSAICO */}
      <section className="bg-white">
        <div className="max-w-[1400px] mx-auto px-4 md:px-10 py-14">
          <p className="text-sm text-gray-500">Galeria</p>
          <h3 className="text-3xl md:text-4xl font-black tracking-tight mt-2">
            Descubra todos os ângulos do {CONFIG.titulo}
          </h3>

          <div className="mt-8 grid grid-cols-12 gap-3">
            <div className="col-span-12 lg:col-span-6 rounded-none overflow-hidden bg-gray-100">
              <img
                src={mosaic[0]}
                alt="Galeria 1"
                className="w-full h-[340px] md:h-[460px] object-cover"
              />
            </div>

            <div className="col-span-12 lg:col-span-6 grid grid-cols-12 gap-3">
              <div className="col-span-12 md:col-span-6 rounded-none overflow-hidden bg-gray-100">
                <img src={mosaic[1]} alt="Galeria 2" className="w-full h-[220px] object-cover" />
              </div>
              <div className="col-span-12 md:col-span-6 rounded-none overflow-hidden bg-gray-100">
                <img src={mosaic[2]} alt="Galeria 3" className="w-full h-[220px] object-cover" />
              </div>

              <div className="col-span-12 md:col-span-4 rounded-none overflow-hidden bg-gray-100">
                <img src={mosaic[3]} alt="Galeria 4" className="w-full h-[210px] object-cover" />
              </div>
              <div className="col-span-12 md:col-span-4 rounded-none overflow-hidden bg-gray-100">
                <img src={mosaic[4]} alt="Galeria 5" className="w-full h-[210px] object-cover" />
              </div>
              <div className="col-span-12 md:col-span-4 rounded-none overflow-hidden bg-gray-100">
                <img src={mosaic[5]} alt="Galeria 6" className="w-full h-[210px] object-cover" />
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="h-10 px-6 rounded-lg border border-[#0b4b9a] text-[#0b4b9a] text-xs font-black uppercase tracking-widest hover:bg-[#0b4b9a] hover:text-white transition-colors"
            >
              Mais fotos
            </button>
          </div>
        </div>
      </section>

      {/* CONFIGURADOR */}
      <section className="bg-white border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-4 md:px-10 py-16">
          <p className="text-center text-sm text-gray-500">{CONFIG.titulo}</p>
          <h3 className="text-center text-3xl md:text-4xl font-black tracking-tight mt-2">
            {CONFIG.exterior.headline}
          </h3>

          <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="flex justify-center">
              <div className="relative w-full max-w-[780px]">
                <div className="relative rounded-2xl overflow-hidden bg-white border border-gray-200">
                  <img
                    src={displayedSrc}
                    alt={tab === "exterior" ? "Exterior" : "Interior"}
                    className={[
                      "w-full transition-all duration-300 ease-out will-change-transform",
                      isImgSwitching ? "opacity-0 scale-[0.985]" : "opacity-100 scale-100",
                      tab === "exterior"
                        ? "h-[360px] md:h-[420px] object-contain p-6"
                        : "h-[360px] md:h-[420px] object-cover",
                    ].join(" ")}
                  />

                  <button
                    onClick={openLightbox}
                    className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-white/95 border border-gray-200 flex items-center justify-center hover:bg-white transition-colors"
                    aria-label="Expandir imagem"
                    title="Expandir"
                  >
                    <Expand size={18} className="text-[#0b4b9a]" />
                  </button>

                  {tab === "interior" && interiorImages.length > 1 ? (
                    <>
                      <button
                        onClick={prevInterior}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 border border-gray-200 flex items-center justify-center hover:bg-white transition-colors"
                        aria-label="Imagem anterior"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button
                        onClick={nextInterior}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 border border-gray-200 flex items-center justify-center hover:bg-white transition-colors"
                        aria-label="Próxima imagem"
                      >
                        <ChevronRightIcon size={18} />
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="max-w-md">
              <div className="flex items-center gap-5 border-b border-gray-200 pb-3">
                <button
                  onClick={() => {
                    if (tab === "exterior") return;
                    setTab("exterior");
                    switchImageTo(exteriorCurrent);
                  }}
                  className={[
                    "text-sm font-black pb-2 transition-colors",
                    tab === "exterior"
                      ? "text-[#0b4b9a] border-b-2 border-[#0b4b9a]"
                      : "text-gray-600 hover:text-gray-900",
                  ].join(" ")}
                >
                  Exterior
                </button>

                <button
                  onClick={() => {
                    if (tab === "interior") return;
                    setTab("interior");
                    switchImageTo(interiorCurrent);
                  }}
                  className={[
                    "text-sm font-black pb-2 transition-colors",
                    tab === "interior"
                      ? "text-[#0b4b9a] border-b-2 border-[#0b4b9a]"
                      : "text-gray-600 hover:text-gray-900",
                  ].join(" ")}
                >
                  Interior
                </button>
              </div>

              {tab === "exterior" ? (
                <div className="mt-5">
                  <p className="text-xs font-black uppercase tracking-widest text-gray-500">
                    {CONFIG.exterior.trimLabel}
                  </p>

                  <p className="mt-2 text-sm font-black text-gray-900">
                    {CONFIG.exterior.colors[selectedExterior]?.name ?? "Cor"}
                  </p>

                  <div className="mt-4 flex items-center gap-3">
                    {CONFIG.exterior.colors.map((c, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectExterior(idx)}
                        className={[
                          "w-10 h-10 rounded-full border transition-all p-1",
                          idx === selectedExterior
                            ? "border-[#0b4b9a] ring-2 ring-[#0b4b9a]/20"
                            : "border-gray-200 hover:border-gray-300",
                        ].join(" ")}
                        title={c.name}
                        aria-label={c.name}
                      >
                        <span className="block w-full h-full rounded-full" style={{ backgroundColor: c.hex }} />
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={goPrimary}
                    className="mt-6 h-11 w-full rounded-lg bg-[#0b4b9a] text-white text-xs font-black uppercase tracking-widest hover:bg-[#093e80] transition-colors"
                  >
                    {CONFIG.ctaSecondary}
                  </button>

                  <div className="mt-6 flex items-start gap-3 text-sm text-gray-600">
                    <ChevronDown size={18} className="mt-0.5 text-gray-400" />
                    <p>
                      Clique em <span className="font-black">Solicitar contato</span> para iniciar a
                      simulação de consórcio/financiamento.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-5">
                  <p className="text-xs font-black uppercase tracking-widest text-gray-500">
                    {CONFIG.interior.trimLabel}
                  </p>

                  <p className="mt-2 text-sm font-black text-gray-900">
                    {CONFIG.interior.colors[selectedInterior]?.name ?? "Interior"}
                  </p>

                  <div className="mt-4 flex items-center gap-3">
                    {CONFIG.interior.colors.map((c, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectInterior(idx)}
                        className={[
                          "w-10 h-10 rounded-full border transition-all p-1",
                          idx === selectedInterior
                            ? "border-[#0b4b9a] ring-2 ring-[#0b4b9a]/20"
                            : "border-gray-200 hover:border-gray-300",
                        ].join(" ")}
                        title={c.name}
                        aria-label={c.name}
                      >
                        <span className="block w-full h-full rounded-full" style={{ backgroundColor: c.hex }} />
                      </button>
                    ))}
                  </div>

                  {interiorImages.length > 1 ? (
                    <p className="mt-3 text-xs text-gray-500">
                      Foto {interiorIndex + 1} de {interiorImages.length}
                    </p>
                  ) : null}

                  <button
                    onClick={goPrimary}
                    className="mt-6 h-11 w-full rounded-lg bg-[#0b4b9a] text-white text-xs font-black uppercase tracking-widest hover:bg-[#093e80] transition-colors"
                  >
                    {CONFIG.ctaSecondary}
                  </button>

                  <div className="mt-6 flex items-start gap-3 text-sm text-gray-600">
                    <ChevronDown size={18} className="mt-0.5 text-gray-400" />
                    <p>Você pode trocar o interior e navegar nas fotos pelas setas (quando houver mais de uma imagem).</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ANTES DO FOOTER */}
      <section className="bg-white text-gray-900 border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-4 md:px-10 py-14">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <p className="text-sm font-black">Chevrolet {CONFIG.titulo}</p>
              <p className="text-gray-500 text-sm mt-1">Consórcio ou financiamento • atendimento rápido</p>
              {CONFIG.priceStart > 0 ? (
                <p className="text-gray-700 text-sm mt-1">
                  A partir de <span className="font-black">{formatBRL0(CONFIG.priceStart)}</span>
                </p>
              ) : null}
            </div>

            <button
              onClick={goPrimary}
              className="h-11 px-6 rounded-lg bg-[#0b4b9a] text-white text-xs font-black uppercase tracking-widest hover:bg-[#093e80] transition-colors"
            >
              {CONFIG.ctaHero}
            </button>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-4 gap-6">
            {CONFIG.benefits.map((b, idx) => (
              <div key={idx} className="border-t border-gray-200 pt-6">
                <div className="flex items-center gap-3 text-gray-900">
                  <span className="text-[#0b4b9a]">{b.icon}</span>
                  <p className="text-sm font-black">{b.title}</p>
                </div>
                {b.desc ? <p className="mt-2 text-xs text-gray-500">{b.desc}</p> : null}
              </div>
            ))}
          </div>

          <div className="mt-10 text-xs text-gray-400">
            <p>
              <span className="font-black text-gray-600">Aviso:</span> informações e imagens podem variar por versão/ano-modelo. Sujeito a análise.
            </p>
          </div>
        </div>
      </section>

      {/* ================= FINALIZAÇÃO NO FINAL ================= */}
      <section id={orderSectionId} className="py-20 px-4 md:px-10 bg-white border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto">
          <div className="mb-10">
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-black/70 mb-3">Finalização</p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-black">
              Iniciar proposta com <span className="text-black/60">dados do cliente</span>
            </h2>
            <p className="text-sm text-black/60 mt-3 max-w-3xl">
              Preencha os dados do cliente para enviar para o módulo de <strong>Análise de Crédito</strong>. *Somente vendedores logados conseguem avançar.
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
                      maxLength={PHONE_PREFIX_DISPLAY.length + 16} // "+55 (DD) 9XXXX-XXXX"
                      className={`w-full h-12 px-4 border rounded-lg focus:outline-none transition-all text-sm text-black placeholder-gray-400
                        ${errors.clientPhone ? "border-red-500 bg-red-50" : "border-gray-300 focus:border-black bg-white"}
                      `}
                      placeholder="+55 (91) 9XXXX-XXXX"
                    />
                    {errors.clientPhone && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle size={10} /> {errors.clientPhone}
                      </p>
                    )}
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
                  <p className="text-sm font-semibold text-gray-900">{CONFIG.titulo}</p>

                  {CONFIG.priceStart > 0 ? (
                    <>
                      <p className="text-xs text-gray-500 mt-2">
                        Valor: <span className="font-bold">{formatBRL0(CONFIG.priceStart)}</span>
                      </p>
                      <p className="text-xs text-gray-500">
                        Entrada (30%):{" "}
                        <span className="font-bold">{formatBRL0(calcEntrada30(CONFIG.priceStart))}</span>
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-gray-500 mt-2">Consulte condições</p>
                  )}

                  <p className="text-xs text-gray-500 mt-2">
                    Exterior:{" "}
                    <span className="font-bold">{CONFIG.exterior.colors[selectedExterior]?.name || "Padrão"}</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    Interior:{" "}
                    <span className="font-bold">{CONFIG.interior.colors[selectedInterior]?.name || "Padrão"}</span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CTA FIXO */}
      <div className="fixed bottom-0 left-0 w-full z-50 bg-white border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-4 md:px-10 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-black text-gray-900 truncate">{CONFIG.titulo}</p>
            <p className="text-[11px] text-gray-500 truncate">
              {CONFIG.priceStart > 0 ? `A partir de ${formatBRL0(CONFIG.priceStart)} • simule agora` : "Simule consórcio/financiamento agora"}
            </p>
          </div>

          <button
            onClick={goPrimary}
            className="h-10 px-4 rounded-lg bg-[#0b4b9a] text-white text-xs font-black uppercase tracking-widest hover:bg-[#093e80] transition-colors flex items-center gap-2"
          >
            {CONFIG.ctaHero} <ArrowRight size={14} />
          </button>
        </div>
      </div>

      <div className="h-16" />

      {/* LIGHTBOX */}
      {lightboxOpen ? (
        <div
          className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={closeLightbox}
        >
          <div className="max-w-5xl w-full bg-white rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <p className="text-sm font-black text-gray-900">
                {CONFIG.titulo} • {tab === "exterior" ? "Exterior" : "Interior"}
              </p>
              <button
                onClick={closeLightbox}
                className="text-xs font-black uppercase tracking-widest text-[#0b4b9a] hover:opacity-80"
              >
                Fechar
              </button>
            </div>

            <div className="bg-white">
              <img
                src={tab === "exterior" ? exteriorCurrent : interiorCurrent}
                alt="Imagem ampliada"
                className="w-full max-h-[75vh] object-contain"
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}