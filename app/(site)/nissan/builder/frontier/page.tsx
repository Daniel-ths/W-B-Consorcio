"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";

/* =========================================================
   TIPOS
========================================================= */
type ColorVariant = {
  id: string;
  name: string;
  swatch: string;
  extraPrice: number;
  images: {
    front: string;
    side: string;
    rear: string;
    wheel: string;
    seats: string;
  };
};

type VersionItem = {
  id: string;
  title: string;
  subtitle: string;
  price: number;
  fuel: string;
  transmission: string;
  power: string;
  torque: string;
  highlights: string[];
};

/* =========================================================
   DADOS REAIS FRONTIER 2026 (Nissan Brasil)
========================================================= */
const VERSIONS: VersionItem[] = [
  {
    id: "attack",
    title: "Attack AT 4x4",
    subtitle: "Porta de entrada off-road",
    price: 277590,
    fuel: "Diesel",
    transmission: "Automática 7 marchas",
    power: "190 cv @ 3.750 rpm",
    torque: "45,9 kgfm @ 1.500-2.500 rpm",
    highlights: [
      "Motor 2.3 Bi-Turbo Diesel",
      "Tração 4x4 com reduzida",
      "Multimídia 8\"",
      "6 airbags",
      "Estribos laterais",
      "Rodas 17\" pretas",
    ],
  },
  {
    id: "platinum",
    title: "Platinum AT 4x4",
    subtitle: "Conforto e sofisticação",
    price: 317990,
    fuel: "Diesel",
    transmission: "Automática 7 marchas",
    power: "190 cv @ 3.750 rpm",
    torque: "45,9 kgfm @ 1.500-2.500 rpm",
    highlights: [
      "Teto solar",
      "Câmera 360º",
      "Bancos em couro sintético",
      "Ar dual zone",
      "Rodas 18\" diamantadas",
      "Pacote ADAS completo",
    ],
  },
  {
    id: "pro4x",
    title: "PRO-4X AT 4x4",
    subtitle: "Off-road raiz",
    price: 317990,
    fuel: "Diesel",
    transmission: "Automática 7 marchas",
    power: "190 cv @ 3.750 rpm",
    torque: "45,9 kgfm @ 1.500-2.500 rpm",
    highlights: [
      "Bloqueio de diferencial traseiro",
      "Pneus All-Terrain",
      "Teto solar",
      "Câmera 360º",
      "Visual exclusivo PRO-4X",
      "Pacote ADAS completo",
    ],
  },
];

// Imagens de fallback (use as do seu Supabase ou faça upload das reais)
const FALLBACK_IMAGES = {
  front:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/frontier_frente.webp.ximg.l_4_m.smart.webp",
  side:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/frontier_frente.webp.ximg.l_4_m.smart.webp",
  rear:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/frontier_frente.webp.ximg.l_4_m.smart.webp",
  wheel:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/frontier_frente.webp.ximg.l_4_m.smart.webp",
  seats:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/frontier_frente.webp.ximg.l_4_m.smart.webp",
};

const COLORS: ColorVariant[] = [
  {
    id: "branco-aspen",
    name: "Branco Aspen",
    swatch: "#F2F2F0",
    extraPrice: 0,
    images: { ...FALLBACK_IMAGES },
  },
  {
    id: "preto-premium",
    name: "Preto Premium",
    swatch: "#1A1A1A",
    extraPrice: 1950,
    images: { ...FALLBACK_IMAGES },
  },
  {
    id: "cinza-grafite",
    name: "Cinza Grafite",
    swatch: "#555555",
    extraPrice: 1950,
    images: { ...FALLBACK_IMAGES },
  },
  {
    id: "prata-classic",
    name: "Prata Classic",
    swatch: "#B0B0B0",
    extraPrice: 1950,
    images: { ...FALLBACK_IMAGES },
  },
  {
    id: "vermelho-alert",
    name: "Vermelho Alert",
    swatch: "#B91C1C",
    extraPrice: 2200,
    images: { ...FALLBACK_IMAGES },
  },
];

const ANGLE_LABELS = {
  front: "Frente",
  side: "Lateral",
  rear: "Traseira",
  wheel: "Volante",
  seats: "Bancos",
} as const;

type AngleKey = keyof typeof ANGLE_LABELS;

/* =========================================================
   HELPERS
========================================================= */
function formatPrice(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  });
}

/* =========================================================
   PÁGINA
========================================================= */
export default function FrontierBuilderPage() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedVersion, setSelectedVersion] = useState<VersionItem | null>(
    VERSIONS[0]
  );
  const [selectedColor, setSelectedColor] = useState<ColorVariant | null>(
    COLORS[0]
  );
  const [currentAngle, setCurrentAngle] = useState<AngleKey>("front");

  const total = useMemo(() => {
    if (!selectedVersion) return 0;
    return selectedVersion.price + (selectedColor?.extraPrice || 0);
  }, [selectedVersion, selectedColor]);

  const currentImage = useMemo(() => {
    if (!selectedColor) return FALLBACK_IMAGES.front;
    return selectedColor.images[currentAngle] || FALLBACK_IMAGES.front;
  }, [selectedColor, currentAngle]);

  function handleConfirm() {
    if (!selectedVersion || !selectedColor) return;

    const payload = {
      source: "nissan-frontier-builder",
      status: "configured",
      brand: "nissan",
      vehicle_slug: "frontier",
      vehicle_name: "Nissan Frontier 2026",
      vehicle_title: "Nissan Frontier",
      vehicle_description: selectedVersion.subtitle,
      vehicle_image: selectedColor.images.front,
      version: {
        id: selectedVersion.id,
        name: selectedVersion.title,
        description: selectedVersion.subtitle,
        price: selectedVersion.price,
        image: selectedColor.images.front,
      },
      color: {
        id: selectedColor.id,
        name: selectedColor.name,
        price: selectedColor.extraPrice,
        image: selectedColor.images.front,
        hex: selectedColor.swatch,
        versionId: selectedVersion.id,
      },
      kits: [],
      accessories: [],
      totals: {
        vehicle: selectedVersion.price,
        color: selectedColor.extraPrice,
        kits: 0,
        accessories: 0,
        total: total,
      },
    };

    // Salva no formato que a análise e o contrato já esperam
    localStorage.setItem("wb_builder_order", JSON.stringify(payload));
    localStorage.setItem("wb_analysis_order", JSON.stringify(payload));

    // Redireciona para a página de análise do vendedor
    router.push("/vendedor/analise");
  }

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link
              href="/nissan"
              className="inline-flex h-9 items-center gap-1.5 border border-zinc-200 bg-white px-2.5 text-[12px] font-medium text-zinc-700 hover:bg-zinc-50"
            >
              <ChevronLeft size={16} />
              Voltar
            </Link>
            <span className="text-lg font-semibold tracking-tight">
              NISSAN FRONTIER
            </span>
          </div>
          <div className="flex items-center gap-2 text-[12px] text-zinc-500">
            <span
              className={`font-medium ${step === 1 ? "text-zinc-900" : ""}`}
            >
              1. Versão
            </span>
            <span>→</span>
            <span
              className={`font-medium ${step === 2 ? "text-zinc-900" : ""}`}
            >
              2. Cor
            </span>
            <span>→</span>
            <span
              className={`font-medium ${step === 3 ? "text-zinc-900" : ""}`}
            >
              3. Resumo
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-2">
        {/* ===================== VISUAL IMERSIVO ===================== */}
        <section className="space-y-4">
          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-zinc-200">
            <img
              src={currentImage}
              alt={`Frontier - ${ANGLE_LABELS[currentAngle]}`}
              className="h-full w-full object-contain transition-opacity duration-300"
            />
            <div className="absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-1 text-[11px] font-medium text-white">
              {ANGLE_LABELS[currentAngle]}
            </div>
          </div>

          {/* Seletor de ângulos */}
          <div className="flex flex-wrap gap-2">
            {(Object.keys(ANGLE_LABELS) as AngleKey[]).map((angle) => (
              <button
                key={angle}
                onClick={() => setCurrentAngle(angle)}
                className={`rounded-full px-4 py-2 text-[12px] font-medium transition ${
                  currentAngle === angle
                    ? "bg-zinc-900 text-white"
                    : "bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-400"
                }`}
              >
                {ANGLE_LABELS[angle]}
              </button>
            ))}
          </div>

          <p className="text-[12px] text-zinc-400">
            Toque nos ângulos para explorar o veículo em 360° (efeito imersivo).
            As imagens são ilustrativas.
          </p>
        </section>

        {/* ===================== CONFIGURAÇÃO ===================== */}
        <section className="space-y-6">
          {/* STEP 1 - Versão */}
          {step === 1 && (
            <div>
              <h2 className="mb-4 text-xl font-semibold">Escolha a versão</h2>
              <div className="space-y-3">
                {VERSIONS.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVersion(v)}
                    className={`w-full rounded-xl border p-4 text-left transition ${
                      selectedVersion?.id === v.id
                        ? "border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900"
                        : "border-zinc-200 bg-white hover:border-zinc-400"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{v.title}</p>
                        <p className="text-[13px] text-zinc-500">{v.subtitle}</p>
                      </div>
                      <p className="shrink-0 font-semibold">
                        {formatPrice(v.price)}
                      </p>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-zinc-400">
                      <span>{v.fuel}</span>
                      <span>·</span>
                      <span>{v.transmission}</span>
                      <span>·</span>
                      <span>{v.power}</span>
                    </div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStep(2)}
                disabled={!selectedVersion}
                className="mt-6 w-full rounded-xl bg-zinc-900 py-3.5 text-[14px] font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
              >
                Continuar para cores
              </button>
            </div>
          )}

          {/* STEP 2 - Cor */}
          {step === 2 && (
            <div>
              <h2 className="mb-4 text-xl font-semibold">Escolha a cor</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {COLORS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedColor(c)}
                    className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition ${
                      selectedColor?.id === c.id
                        ? "border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900"
                        : "border-zinc-200 bg-white hover:border-zinc-400"
                    }`}
                  >
                    <div
                      className="h-10 w-10 rounded-full border border-zinc-300 shadow-inner"
                      style={{ backgroundColor: c.swatch }}
                    />
                    <span className="text-center text-[12px] font-medium leading-tight">
                      {c.name}
                    </span>
                    {c.extraPrice > 0 && (
                      <span className="text-[11px] text-zinc-500">
                        + {formatPrice(c.extraPrice)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 rounded-xl border border-zinc-300 py-3.5 text-[14px] font-medium hover:bg-zinc-50"
                >
                  Voltar
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!selectedColor}
                  className="flex-1 rounded-xl bg-zinc-900 py-3.5 text-[14px] font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
                >
                  Ver resumo
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 - Resumo */}
          {step === 3 && selectedVersion && selectedColor && (
            <div>
              <h2 className="mb-4 text-xl font-semibold">Resumo da configuração</h2>
              <div className="space-y-3 rounded-xl border border-zinc-200 bg-white p-5 text-[14px]">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Modelo</span>
                  <span className="font-medium">Nissan Frontier 2026</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Versão</span>
                  <span className="font-medium">{selectedVersion.title}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Cor</span>
                  <span className="flex items-center gap-2 font-medium">
                    <span
                      className="inline-block h-4 w-4 rounded-full border border-zinc-300"
                      style={{ backgroundColor: selectedColor.swatch }}
                    />
                    {selectedColor.name}
                  </span>
                </div>
                <div className="flex justify-between border-t border-zinc-100 pt-3 text-[16px]">
                  <span className="font-semibold">Total estimado</span>
                  <span className="font-semibold text-red-600">
                    {formatPrice(total)}
                  </span>
                </div>
              </div>

              <p className="mt-3 text-center text-[11px] text-zinc-400">
                Valores de referência · Consulte condições com o vendedor
              </p>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 rounded-xl border border-zinc-300 py-3.5 text-[14px] font-medium hover:bg-zinc-50"
                >
                  Voltar
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-3.5 text-[14px] font-semibold text-white hover:bg-red-700"
                >
                  <Check size={18} />
                  Ir para Análise
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}