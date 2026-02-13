"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BatteryCharging,
  PlugZap,
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
} from "lucide-react";

/**
 * Equinox EV — Landing (mesmo estilo do print / Blazer EV RS)
 * ✅ Exterior/Interior com cores + troca de imagem
 * ✅ Interior com setas (carousel) — só linkar as imagens
 * ✅ Sem aluguel/assinatura (consórcio/financiamento)
 * ✅ Animação suave ao trocar: cor, tab e carousel
 * ✅ Fundo BRANCO no configurador
 * ✅ Seção antes do footer: branca (mais agradável com footer cinza)
 *
 * ONDE COLOCAR:
 * - app/eletricos/equinox-ev/page.tsx
 */

// =========================
// helpers
// =========================
const moneyBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

// =========================
// CONFIG (edite aqui)
// =========================
const CONFIG = {
  ano: "2024",
  titulo: "Equinox EV",
  subtitulo: "Consórcio ou financiamento • Simule em minutos",

  // ✅ preço oficial (Chevrolet Brasil) — “A partir de R$ 349.990”
  preco: 349990,

  ctaHero: "Simular agora",
  ctaSecondary: "Solicitar contato",

  // ✅ oficiais Chevrolet (Equinox EV Brasil)
  stats: [
    { value: "443", unit: "km", label: "de autonomia", icon: <BatteryCharging size={18} /> },
    { value: "~48", unit: "min", label: "até 80% da carga", icon: <PlugZap size={18} /> },
    { value: "292", unit: "cv", label: "Potência (AWD)", icon: <Gauge size={18} /> },
    {
      value: "17,7",
      unit: '"',
      label: "MyLink + Google built-in",
      icon: <MonitorSmartphone size={18} />,
    },
  ],

  // HERO (troque se quiser)
  heroImage:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/eletricos/22/imagem-06.avif",

  sectionImage:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/eletricos/imagem-05.avif",

  sectionTitle: "SUV elétrico para a rotina. Tecnologia para ir além.",
  sectionText:
    "O Equinox EV é um SUV 100% elétrico com tração integral (dois motores), 292 cv e 46 kgf.m de torque, entregando condução silenciosa com resposta imediata. A bateria de 85 kWh ajuda a alcançar até 443 km de autonomia e recarga de 0–80% em cerca de 48 minutos (condições ideais).",

  // Galeria mosaico (6 imagens) — só trocar
  gallery: [
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/eletricos/imagem-02.avif",
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/eletricos/imagem-03.avif",
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/eletricos/imagem-04.avif",
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/eletricos/imagem-08.avif",
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/eletricos/imagem-01%20(1).avif",
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/eletricos/imagem-07.avif",
  ],

  // ======= EXTERIOR (cores + imagem por cor) =======
  exterior: {
    trimLabel: "EV",
    headline: "Moderno, inteligente e 100% elétrico",
    colors: [
      {
        name: "Branco",
        hex: "#e9e9e9",
        img: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/eletricos/branco%20summit.png",
      },
      {
        name: "Cinza",
        hex: "#9aa3ad",
        img: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/eletricos/prata%20shark.png",
      },
      {
        name: "Preto",
        hex: "#1f2328",
        img: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/eletricos/Screenshot_1.png",
      },
      {
        name: "Vermelho",
        hex: "#ce0000",
        img: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/eletricos/vermelho.png",
      },
    ],
  },

  // ======= INTERIOR (cores + imagens em carousel por cor) =======
  interior: {
    trimLabel: "EV",
    colors: [
      {
        name: "Jet Black",
        hex: "#111318",
        images: [
          "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/eletricos/imagem-03.avif",
          "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/eletricos/imagem-04.avif",
        ],
      },
    ],
  },

  // bloco inferior (benefícios)
  benefits: [
    { icon: <CarFront size={18} />, title: "Simulação rápida", desc: "consórcio ou financiamento" },
    { icon: <Wrench size={18} />, title: "Atendimento humano", desc: "sem complicação" },
    { icon: <FileText size={18} />, title: "Documentação orientada", desc: "do início ao fim" },
    { icon: <ShieldCheck size={18} />, title: "Transparência", desc: "condições claras" },
  ],
};

// =========================
// URL do seu fluxo (com preço + entrada)
// =========================
function buildAnaliseUrl() {
  const valor = CONFIG.preco ?? 0;
  const entrada = valor ? Math.round(valor * 0.3) : 0;

  const params = new URLSearchParams({
    modelo: CONFIG.titulo,
    valor: String(valor),
    entrada: String(entrada),
    imagem: CONFIG.heroImage,
  });

  return `/vendedor/analise?${params.toString()}`;
}

type TabKey = "exterior" | "interior";

export default function EquinoxEVPage() {
  const router = useRouter();

  const [tab, setTab] = useState<TabKey>("exterior");

  const [selectedExterior, setSelectedExterior] = useState(0);
  const [selectedInterior, setSelectedInterior] = useState(0);
  const [interiorIndex, setInteriorIndex] = useState(0);

  const [lightboxOpen, setLightboxOpen] = useState(false);

  // ---- animação de troca de imagem (fade + leve zoom) ----
  const [isImgSwitching, setIsImgSwitching] = useState(false);
  const [displayedSrc, setDisplayedSrc] = useState(
    CONFIG.exterior.colors[0]?.img || CONFIG.heroImage
  );
  const animTimer = useRef<number | null>(null);

  const mosaic = useMemo(() => {
    const g = (CONFIG.gallery ?? []).filter(Boolean);
    while (g.length < 6) g.push(CONFIG.gallery?.[0] || CONFIG.heroImage);
    return g.slice(0, 6);
  }, []);

  const goPrimary = () => router.push(buildAnaliseUrl());

  // exterior atual
  const exteriorCurrent = CONFIG.exterior.colors[selectedExterior]?.img?.trim() || CONFIG.heroImage;

  // interior atual (cor + carousel)
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

            {typeof CONFIG.preco === "number" && CONFIG.preco > 0 ? (
              <p className="mt-3 text-sm md:text-base font-black">
                A partir de <span className="text-white">{moneyBRL(CONFIG.preco)}</span>
              </p>
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
                    <span className="text-lg md:text-xl font-black opacity-90 mb-1">{s.unit}</span>
                  </div>
                  <p className="mt-2 text-xs opacity-70">{s.label}</p>
                </div>
              ))}
            </div>
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

      {/* ========= CONFIGURADOR (EXTERIOR / INTERIOR) ========= */}
      <section className="bg-white border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-4 md:px-10 py-16">
          <p className="text-center text-sm text-gray-500">{CONFIG.titulo}</p>
          <h3 className="text-center text-3xl md:text-4xl font-black tracking-tight mt-2">
            {CONFIG.exterior.headline}
          </h3>

          <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* ESQUERDA: IMAGEM */}
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

            {/* DIREITA: CONTROLES */}
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
                        <span
                          className="block w-full h-full rounded-full"
                          style={{ backgroundColor: c.hex }}
                        />
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
                        <span
                          className="block w-full h-full rounded-full"
                          style={{ backgroundColor: c.hex }}
                        />
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
                    <p>
                      Você pode trocar o interior e navegar nas fotos pelas setas (quando houver mais
                      de uma imagem).
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ANTES DO FOOTER: branco */}
      <section className="bg-white text-gray-900 border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-4 md:px-10 py-14">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <p className="text-sm font-black">Chevrolet {CONFIG.titulo}</p>
              <p className="text-gray-500 text-sm mt-1">Consórcio ou financiamento • atendimento rápido</p>
              {typeof CONFIG.preco === "number" && CONFIG.preco > 0 ? (
                <p className="text-gray-700 text-sm mt-1">
                  A partir de <span className="font-black">{moneyBRL(CONFIG.preco)}</span>
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
              <span className="font-black text-gray-600">Aviso:</span> informações e imagens podem variar
              por versão/ano-modelo. Sujeito a análise.
            </p>
          </div>
        </div>
      </section>

      {/* CTA FIXO */}
      <div className="fixed bottom-0 left-0 w-full z-50 bg-white border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-4 md:px-10 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-black text-gray-900 truncate">{CONFIG.titulo}</p>
            <p className="text-[11px] text-gray-500 truncate">
              {typeof CONFIG.preco === "number" && CONFIG.preco > 0
                ? `A partir de ${moneyBRL(CONFIG.preco)} • simule agora`
                : "Simule consórcio/financiamento agora"}
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
          <div
            className="max-w-5xl w-full bg-white rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
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