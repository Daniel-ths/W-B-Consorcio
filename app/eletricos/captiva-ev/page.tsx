"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  ArrowRight,
  BatteryCharging,
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
  Sofa,
  Sparkles,
  Sun,
  Shield,
  PlugZap,
  Loader2,
  AlertCircle,
  Lock,
  Wallet,
  Banknote,
  CheckCircle2,
} from "lucide-react";

/**
 * Captiva EV 2026 — Landing + FINALIZAÇÃO no final (mesma lógica do Equinox EV)
 * ✅ Todos CTAs rolam pro final
 * ✅ Se logado: salva em sales e abre /vendedor/analise com query
 * ✅ Se não logado: bloqueia e mostra botão login
 */

// =========================
// CONFIG (edite aqui)
// =========================
const CONFIG = {
  ano: "2026",
  titulo: "Captiva EV",
  subtitulo: "Consórcio ou financiamento • Simule em minutos",

  ctaHero: "Simular agora",
  ctaSecondary: "Solicitar contato",

  // Preço oficial (site Chevrolet) — mantenha o * se quiser
  precoAPartir: "A partir de R$ 199.990*",

  stats: [
    { value: "304", unit: "km", label: "Autonomia (PBEV)", icon: <BatteryCharging size={18} /> },
    { value: "60", unit: "kWh", label: "Capacidade da bateria", icon: <PlugZap size={18} /> },
    { value: "201", unit: "cv", label: "Potência do motor elétrico", icon: <Gauge size={18} /> },
    { value: "403", unit: "L", label: "Porta-malas", icon: <MonitorSmartphone size={18} /> },
  ],

  heroImage:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/eletricos/evo/chevrolet-captiva-ev-suv-estrada-montanhas.avif",

  sectionImage:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/eletricos/evo/chevrolet-captiva-ev-urbano-noturno-fechada-01.avif",

  sectionTitle: "Tudo o que importa, em um só SUV",
  sectionText:
    "A Captiva EV foi feita para acompanhar o seu ritmo, com conforto em cada detalhe, espaço de sobra e um design que inspira. Mais do que um carro, transforma cada percurso em um momento de prazer e tranquilidade.",

  highlights: [
    { title: "Amplo espaço interno", subtitle: "Conveniência", icon: <Sofa size={18} /> },
    { title: "Acabamento premium", subtitle: "Conforto", icon: <Sparkles size={18} /> },
    { title: "Teto panorâmico", subtitle: "Design", icon: <Sun size={18} /> },
    { title: "Chevrolet Intelligent Driving", subtitle: "Segurança", icon: <Shield size={18} /> },
  ],

  gallery: [
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/eletricos/evo/chevrolet-captiva-ev-2026-dsc03858.avif",
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/eletricos/evo/interior-suv-chevrolet-captiva-ev-painel-digital-rua-arborizada.avif",
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/eletricos/evo/interior-suv-chevrolet-captiva-ev-camera-re-visao-360.avif",
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/eletricos/evo/galeria-cargador-captiva-ev.avif",
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/eletricos/evo/casal-suv-chevrolet-captiva-ev-cinza-porta-malas.avif",
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/eletricos/evo/captiva-ev-bancos-traseiro.avif",
  ],

  exterior: {
    trimLabel: "EV",
    headline: "O SUV elétrico que abre espaço para a vida acontecer",
    colors: [
      {
        name: "Cinza Diamantina",
        hex: "#4b5563",
        img: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/eletricos/evo/cinza.png",
      },
      {
        name: "Branco",
        hex: "#e9e9e9",
        img: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/eletricos/evo/branco.png",
      },
      {
        name: "Azul",
        hex: "#1f3b6d",
        img: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/eletricos/evo/azul.png",
      },
      {
        name: "Bege",
        hex: "#b7a68d",
        img: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/eletricos/evo/dourado.png",
      },
    ],
  },

  interior: {
    trimLabel: "EV",
    colors: [
      {
        name: "Jet Black",
        hex: "#111318",
        images: [
          "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/eletricos/evo/interior-suv-chevrolet-captiva-ev-painel-digital-rua-arborizada.avif",
          "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/eletricos/evo/captiva-ev-bancos-traseiro.avif",
        ],
      },
    ],
  },

  charging: {
    eyebrow: "Carregamento",
    title: "Tão fácil quanto recarregar um celular",
    text:
      "Para recarregar sua Captiva EV em casa, basta conectar o cabo e deixar a energia fazer o resto. Simples, prático e pronto para a sua rotina.",
    cards: [
      {
        title: "Carregador Portátil",
        desc: "Leve essa solução aonde quiser e carregue em tomadas convencionais. Potência de até 4,4 kW.*",
      },
      {
        title: "Carregador Portátil de Alta Potência",
        desc: "Mais versatilidade para tomadas residenciais e industriais. Potência de até 7 kW.*",
      },
      {
        title: "Carregador de Parede",
        desc: "Mais comodidade para sua casa. Opções de 7 kW e 22 kW.*",
      },
    ],
    footnote:
      "*A potência de recarga varia com as condições da instalação e características do veículo. Consulte sua concessionária Chevrolet.",
  },

  quickSpecs: [
    { k: "Potência", v: "201 cv" },
    { k: "Torque", v: "31,6 kgfm" },
    { k: "0–100 km/h", v: "9,9 s" },
    { k: "Bateria", v: "60 kWh" },
    { k: "Porta-malas", v: "403 L" },
    { k: "Autonomia", v: "PBEV 304 km" },
  ],

  benefits: [
    { icon: <CarFront size={18} />, title: "Simulação rápida", desc: "consórcio ou financiamento" },
    { icon: <Wrench size={18} />, title: "Atendimento humano", desc: "sem complicação" },
    { icon: <FileText size={18} />, title: "Documentação orientada", desc: "do início ao fim" },
    { icon: <ShieldCheck size={18} />, title: "Transparência", desc: "condições claras" },
  ],
};

// =========================
// FINALIZAÇÃO helpers
// =========================
const maskCPF = (value: string) =>
  value
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})/, "$1-$2")
    .replace(/(-\d{2})\d+?$/, "$1");

const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// telefone fixo +55 (91)
const PHONE_PREFIX_DISPLAY = "+55 (91) ";
const PHONE_PREFIX_E164 = "+5591";

const maskPhoneAfterPrefix = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 9);
  if (!digits) return "";
  if (digits.length <= 1) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 1)}${digits.slice(1)}`;
  return `${digits.slice(0, 1)}${digits.slice(1, 5)}-${digits.slice(5)}`;
};

const getPhoneDigitsAfterPrefix = (fullValue: string) => {
  const digits = fullValue.replace(/\D/g, "");
  if (digits.startsWith("5591")) return digits.slice(4).slice(0, 9);
  return digits.slice(0, 9);
};

// preço (string "A partir de ...") → number (ex: 199990)
const parseBRLFromString = (text: string) => {
  const nums = String(text || "").replace(/[^\d]/g, "");
  if (!nums) return 0;
  const n = Number(nums);
  return Number.isFinite(n) ? n : 0;
};

function buildAnaliseParams() {
  const valor = parseBRLFromString(CONFIG.precoAPartir);
  const entrada = valor ? Math.round(valor * 0.3) : 0;
  return { valor, entrada };
}

type TabKey = "exterior" | "interior";

export default function CaptivaEVPage() {
  const router = useRouter();

  // ===== FINALIZAÇÃO NO FINAL =====
  const orderSectionId = "order-summary";

  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

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

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setClientCpf(maskCPF(e.target.value));
    if (errors.clientCpf) setErrors({ ...errors, clientCpf: "" });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const typed = e.target.value;

    let after = typed.startsWith(PHONE_PREFIX_DISPLAY)
      ? typed.slice(PHONE_PREFIX_DISPLAY.length)
      : typed.replace(PHONE_PREFIX_DISPLAY, "");

    const maskedAfter = maskPhoneAfterPrefix(after);
    setClientPhone(PHONE_PREFIX_DISPLAY + maskedAfter);

    if (errors.clientPhone) setErrors({ ...errors, clientPhone: "" });
  };

  // ✅ CTAs rolam pro final
  const goPrimary = () => scrollToId(orderSectionId);

  // ===== Página (UI) =====
  const [tab, setTab] = useState<TabKey>("exterior");

  const [selectedExterior, setSelectedExterior] = useState(0);
  const [selectedInterior, setSelectedInterior] = useState(0);
  const [interiorIndex, setInteriorIndex] = useState(0);

  const [lightboxOpen, setLightboxOpen] = useState(false);

  const [isImgSwitching, setIsImgSwitching] = useState(false);
  const [displayedSrc, setDisplayedSrc] = useState(() => {
    const firstExterior = CONFIG.exterior.colors[0]?.img?.trim();
    return firstExterior || CONFIG.heroImage;
  });
  const animTimer = useRef<number | null>(null);

  const mosaic = useMemo(() => {
    const g = (CONFIG.gallery ?? []).map((x) => (typeof x === "string" ? x.trim() : x)).filter(Boolean);
    while (g.length < 6) g.push((CONFIG.gallery?.[0] || CONFIG.heroImage).trim());
    return g.slice(0, 6);
  }, []);

  const exteriorCurrent = CONFIG.exterior.colors[selectedExterior]?.img?.trim() || CONFIG.heroImage;

  const interiorColor = CONFIG.interior.colors[selectedInterior];
  const interiorImages = (interiorColor?.images ?? []).map((x) => x.trim()).filter(Boolean);
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

    const phoneDigits = getPhoneDigitsAfterPrefix(clientPhone);
    if (phoneDigits.length < 9) {
      newErrors.clientPhone = "Telefone obrigatório (digite os 9 dígitos após o 9).";
      hasError = true;
    }

    setErrors(newErrors);
    if (hasError) return;

    setLoading(true);

    try {
      const telefoneE164 = `${PHONE_PREFIX_E164}${getPhoneDigitsAfterPrefix(clientPhone)}`;
      const { valor, entrada } = buildAnaliseParams();

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
          </div>

          <div className="absolute bottom-10 left-6 md:left-12 text-white/95">
            <p className="text-xs uppercase tracking-widest opacity-85">{CONFIG.subtitulo}</p>
            <p className="mt-2 text-sm md:text-base font-black">{CONFIG.precoAPartir}</p>
          </div>

          <div className="absolute bottom-8 right-6 md:right-12">
            <button
              onClick={goPrimary}
              className="h-10 md:h-11 px-6 rounded-lg bg-white text-gray-900 text-xs font-black uppercase tracking-widest hover:bg-gray-100 transition-colors"
            >
              {CONFIG.ctaSecondary}
            </button>
          </div>
        </div>

        {/* FAIXA PRETA: HIGHLIGHTS */}
        <div className="bg-[#151515] text-white">
          <div className="max-w-[1400px] mx-auto px-4 md:px-10 py-10">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8">
              {CONFIG.highlights.map((h, idx) => (
                <div key={idx} className="text-left">
                  <div className="flex items-center gap-2 text-white/85">
                    <span className="opacity-85">{h.icon}</span>
                    <p className="text-sm font-black">{h.title}</p>
                  </div>
                  <p className="mt-2 text-xs text-white/55">{h.subtitle}</p>
                  <div className="mt-4 h-px bg-white/15" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FAIXA PRETA: STATS */}
        <div className="bg-[#0f0f0f] text-white border-t border-white/10">
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
                    <span className="text-lg md:text-xl font-black opacity-90 mb-1">{s.unit}</span>
                  </div>
                  <p className="mt-2 text-xs opacity-70">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO IMAGEM + TEXTO (escura) */}
      <section className="bg-[#151515] text-white">
        <div className="max-w-[1400px] mx-auto px-4 md:px-10 py-14">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="rounded-none overflow-hidden bg-black/30">
              <img src={CONFIG.sectionImage} alt="Detalhe" className="w-full h-[320px] md:h-[420px] object-cover" />
            </div>

            <div className="max-w-xl">
              <h2 className="text-2xl md:text-3xl font-black leading-tight">{CONFIG.sectionTitle}</h2>
              <p className="mt-4 text-sm md:text-base text-white/75 leading-relaxed">{CONFIG.sectionText}</p>

              <div className="mt-8 grid grid-cols-2 gap-4">
                {CONFIG.quickSpecs.map((sp, i) => (
                  <div key={i} className="border border-white/10 rounded-xl p-4 bg-white/5">
                    <p className="text-xs text-white/55">{sp.k}</p>
                    <p className="mt-1 text-sm font-black">{sp.v}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <button
                  onClick={goPrimary}
                  className="h-11 px-6 rounded-lg bg-[#0b4b9a] text-white text-xs font-black uppercase tracking-widest hover:bg-[#093e80] transition-colors"
                >
                  {CONFIG.ctaHero}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* GALERIA MOSAICO */}
      <section className="bg-white">
        <div className="max-w-[1400px] mx-auto px-4 md:px-10 py-14">
          <p className="text-sm text-gray-500">Galeria</p>
          <h3 className="text-3xl md:text-4xl font-black tracking-tight mt-2">
            Descubra todos os ângulos do {CONFIG.titulo} {CONFIG.ano}
          </h3>

          <div className="mt-8 grid grid-cols-12 gap-3">
            <div className="col-span-12 lg:col-span-6 rounded-none overflow-hidden bg-gray-100">
              <img src={mosaic[0]} alt="Galeria 1" className="w-full h-[340px] md:h-[460px] object-cover" />
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
          <h3 className="text-center text-3xl md:text-4xl font-black tracking-tight mt-2">{CONFIG.exterior.headline}</h3>

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
                      tab === "exterior" ? "h-[360px] md:h-[420px] object-contain p-6" : "h-[360px] md:h-[420px] object-cover",
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
                    tab === "exterior" ? "text-[#0b4b9a] border-b-2 border-[#0b4b9a]" : "text-gray-600 hover:text-gray-900",
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
                    tab === "interior" ? "text-[#0b4b9a] border-b-2 border-[#0b4b9a]" : "text-gray-600 hover:text-gray-900",
                  ].join(" ")}
                >
                  Interior
                </button>
              </div>

              {tab === "exterior" ? (
                <div className="mt-5">
                  <p className="text-xs font-black uppercase tracking-widest text-gray-500">{CONFIG.exterior.trimLabel}</p>

                  <p className="mt-2 text-sm font-black text-gray-900">{CONFIG.exterior.colors[selectedExterior]?.name ?? "Cor"}</p>

                  <div className="mt-4 flex items-center gap-3">
                    {CONFIG.exterior.colors.map((c, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectExterior(idx)}
                        className={[
                          "w-10 h-10 rounded-full border transition-all p-1",
                          idx === selectedExterior ? "border-[#0b4b9a] ring-2 ring-[#0b4b9a]/20" : "border-gray-200 hover:border-gray-300",
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
                      Clique em <span className="font-black">Solicitar contato</span> para iniciar a simulação de consórcio/financiamento.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-5">
                  <p className="text-xs font-black uppercase tracking-widest text-gray-500">{CONFIG.interior.trimLabel}</p>

                  <p className="mt-2 text-sm font-black text-gray-900">{CONFIG.interior.colors[selectedInterior]?.name ?? "Interior"}</p>

                  <div className="mt-4 flex items-center gap-3">
                    {CONFIG.interior.colors.map((c, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectInterior(idx)}
                        className={[
                          "w-10 h-10 rounded-full border transition-all p-1",
                          idx === selectedInterior ? "border-[#0b4b9a] ring-2 ring-[#0b4b9a]/20" : "border-gray-200 hover:border-gray-300",
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

      {/* CARREGAMENTO */}
      <section className="bg-white border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-4 md:px-10 py-16">
          <p className="text-xs font-black uppercase tracking-widest text-gray-500">{CONFIG.charging.eyebrow}</p>
          <h3 className="mt-2 text-3xl md:text-4xl font-black tracking-tight">{CONFIG.charging.title}</h3>
          <p className="mt-4 text-gray-600 max-w-3xl leading-relaxed">{CONFIG.charging.text}</p>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            {CONFIG.charging.cards.map((c, idx) => (
              <div key={idx} className="rounded-2xl border border-gray-200 p-6 bg-white">
                <div className="flex items-center gap-2 text-[#0b4b9a]">
                  <PlugZap size={18} />
                  <p className="text-sm font-black">{c.title}</p>
                </div>
                <p className="mt-3 text-sm text-gray-600 leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>

          <p className="mt-6 text-xs text-gray-400">{CONFIG.charging.footnote}</p>
        </div>
      </section>

      {/* ANTES DO FOOTER */}
      <section className="bg-white text-gray-900 border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-4 md:px-10 py-14">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <p className="text-sm font-black">Chevrolet {CONFIG.titulo}</p>
              <p className="text-gray-500 text-sm mt-1">{CONFIG.precoAPartir} • Consórcio ou financiamento</p>
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
              <Link href="/login" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors">
                Fazer Login de Vendedor
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200">Informações do Cliente</h4>

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
                      onChange={(e) => handleCpfChange(e as any)}
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
                      maxLength={PHONE_PREFIX_DISPLAY.length + 10}
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
                        Avançar para Análise <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
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
                  <p className="text-sm text-gray-600 mt-1">{CONFIG.precoAPartir}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Exterior: <span className="font-bold">{CONFIG.exterior.colors[selectedExterior]?.name || "Padrão"}</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    Interior: <span className="font-bold">{CONFIG.interior.colors[selectedInterior]?.name || "Padrão"}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Entrada sugerida (30%): <span className="font-bold">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(buildAnaliseParams().entrada)}</span>
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
            <p className="text-[11px] text-gray-500 truncate">{CONFIG.precoAPartir}</p>
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
        <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6" onClick={closeLightbox}>
          <div className="max-w-5xl w-full bg-white rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <p className="text-sm font-black text-gray-900">
                {CONFIG.titulo} • {tab === "exterior" ? "Exterior" : "Interior"}
              </p>
              <button onClick={closeLightbox} className="text-xs font-black uppercase tracking-widest text-[#0b4b9a] hover:opacity-80">
                Fechar
              </button>
            </div>

            <div className="bg-white">
              <img src={tab === "exterior" ? exteriorCurrent : interiorCurrent} alt="Imagem ampliada" className="w-full max-h-[75vh] object-contain" />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}