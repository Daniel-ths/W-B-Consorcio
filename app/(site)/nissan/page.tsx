"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ChevronLeft } from "lucide-react";

type ColorVariant = {
  id: string;
  name: string;
  extraPrice?: number;
  swatch: string;
  image_url?: string;
};

type VersionItem = {
  id: string;
  title: string;
  subtitle?: string;
  price: number;
  note?: string;
  fuel?: string;
  transmission?: string;
  power?: string;
  torque?: string;
  trunk?: string;
  colors?: ColorVariant[];
};

type VehicleRow = {
  id: number;
  model_name: string;
  slug: string;
  price_start?: number | null;
  is_visible?: boolean | null;
  versions?: VersionItem[] | null;
};

const MODEL_IMAGES: Record<string, string> = {
  kicks:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/kicks_frente.webp.ximg.l_4_m.smart.webp",
  kait:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/kait_frontal_v2.webp.ximg.l_4_m.smart.webp",
  versa:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/versa_exclusive_frontal_v2.webp.ximg.l_4_m.smart.webp",
  frontier:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/frontier_frente.webp.ximg.l_4_m.smart.webp",
};

const MODEL_META: Record<
  string,
  { tagline: string; category: string; highlights: string[] }
> = {
  kicks: {
    tagline: "Attitude to disrupt",
    category: "SUV",
    highlights: ["Safety Shield", "Multimídia", "Design moderno"],
  },
  kait: {
    tagline: "Cabe tudo que é bom",
    category: "SUV",
    highlights: ["Espaço interno", "Custo-benefício", "Tecnologia"],
  },
  versa: {
    tagline: "Sedã completo e sofisticado",
    category: "Sedã",
    highlights: ["Porta-malas amplo", "Conforto", "Eficiência"],
  },
  frontier: {
    tagline: "Desenhada para fazer mais",
    category: "Picape",
    highlights: ["Capacidade de carga", "Robustez", "Trabalho e lazer"],
  },
  default: {
    tagline: "Tecnologia e confiança Nissan",
    category: "Modelo",
    highlights: ["Garantia de fábrica", "Rede nacional", "Consórcio"],
  },
};

const REAL_NISSAN_COLORS: Record<
  string,
  { name: string; swatch: string; extraPrice?: number }[]
> = {
  kicks: [
    { name: "Branco Diamond", swatch: "#F5F5F0" },
    { name: "Preto Premium", swatch: "#1A1A1A" },
    { name: "Prata Classic", swatch: "#C0C0C0" },
    { name: "Cinza Grafite", swatch: "#5A5A5A" },
    { name: "Vermelho Scarlet", swatch: "#B91C1C", extraPrice: 1500 },
    { name: "Azul Cascadia", swatch: "#1E3A5F", extraPrice: 1200 },
  ],
  kait: [
    { name: "Branco Solid", swatch: "#FFFFFF" },
    { name: "Preto Metálico", swatch: "#111111" },
    { name: "Prata Lunar", swatch: "#B8B8B8" },
    { name: "Cinza Storm", swatch: "#6B6B6B" },
    { name: "Vermelho Passion", swatch: "#9B1B1B", extraPrice: 1000 },
  ],
  versa: [
    { name: "Branco Pearl", swatch: "#F8F8F4" },
    { name: "Preto Super Black", swatch: "#0D0D0D" },
    { name: "Prata Brilliant", swatch: "#C5C5C5" },
    { name: "Cinza Gun Metallic", swatch: "#4A4A4A" },
    { name: "Azul Caspian", swatch: "#1B4F72", extraPrice: 1300 },
    { name: "Vermelho Coulis", swatch: "#8B1A1A", extraPrice: 1300 },
  ],
  frontier: [
    { name: "Branco Glacier", swatch: "#F2F2F0" },
    { name: "Preto Magnetic", swatch: "#1C1C1C" },
    { name: "Prata Brilliant", swatch: "#B0B0B0" },
    { name: "Cinza Gun", swatch: "#555555" },
    { name: "Azul Horizon", swatch: "#1A3C6E", extraPrice: 1800 },
    { name: "Laranja Atomic", swatch: "#D35400", extraPrice: 2000 },
  ],
  default: [
    { name: "Branco", swatch: "#F5F5F5" },
    { name: "Preto", swatch: "#1A1A1A" },
    { name: "Prata", swatch: "#C0C0C0" },
    { name: "Cinza", swatch: "#6B6B6B" },
  ],
};

const BENEFITS = [
  {
    title: "Consórcio Nissan",
    text: "Planeje a compra com parcelas que cabem no bolso, sem juros de financiamento tradicional.",
  },
  {
    title: "Safety Shield",
    text: "Pacote de segurança ativa em vários modelos da linha, com assistências ao motorista.",
  },
  {
    title: "Rede nacional",
    text: "Atendimento e pós-venda em concessionárias Nissan em todo o Brasil.",
  },
  {
    title: "Garantia de fábrica",
    text: "Cobertura oficial Nissan conforme o modelo e a versão escolhida.",
  },
];

function modelKey(slug: string, modelName: string) {
  return (slug || modelName || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function getMeta(slug: string, modelName: string) {
  const key = modelKey(slug, modelName);
  if (key.includes("kicks")) return MODEL_META.kicks;
  if (key.includes("kait")) return MODEL_META.kait;
  if (key.includes("versa")) return MODEL_META.versa;
  if (key.includes("frontier")) return MODEL_META.frontier;
  return MODEL_META.default;
}

function getModelImage(slug: string, modelName: string) {
  const key = modelKey(slug, modelName);
  if (key.includes("kicks")) return MODEL_IMAGES.kicks;
  if (key.includes("kait")) return MODEL_IMAGES.kait;
  if (key.includes("versa")) return MODEL_IMAGES.versa;
  if (key.includes("frontier")) return MODEL_IMAGES.frontier;
  return MODEL_IMAGES.kicks;
}

function resolveColors(
  vehicle: VehicleRow,
  version: VersionItem | null
): ColorVariant[] {
  const fromDb = Array.isArray(version?.colors)
    ? version!.colors.filter((c) => c && (c.name || c.swatch))
    : [];

  if (fromDb.length > 0) {
    return fromDb.map((c, i) => ({
      id: c.id || `db-${i}`,
      name: c.name || `Cor ${i + 1}`,
      swatch: c.swatch || "#CCCCCC",
      extraPrice: Number(c.extraPrice || 0),
      image_url: c.image_url || "",
    }));
  }

  const key = modelKey(vehicle.slug, vehicle.model_name);
  let palette = REAL_NISSAN_COLORS.default;
  if (key.includes("kicks")) palette = REAL_NISSAN_COLORS.kicks;
  else if (key.includes("kait")) palette = REAL_NISSAN_COLORS.kait;
  else if (key.includes("versa")) palette = REAL_NISSAN_COLORS.versa;
  else if (key.includes("frontier")) palette = REAL_NISSAN_COLORS.frontier;

  return palette.map((c, i) => ({
    id: `real-${key}-${i}`,
    name: c.name,
    swatch: c.swatch,
    extraPrice: c.extraPrice || 0,
    image_url: "",
  }));
}

function formatPrice(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  });
}

export default function ConsorcioPage() {
  const [vehicles, setVehicles] = useState<VehicleRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [builderOpen, setBuilderOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleRow | null>(null);
  const [selectedColor, setSelectedColor] = useState<ColorVariant | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<VersionItem | null>(null);
  const [step, setStep] = useState(1);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("vehicles")
          .select("*")
          .eq("brand", "nissan")
          .eq("is_visible", true)
          .order("price_start", { ascending: true });

        if (error) throw error;
        setVehicles((data as VehicleRow[]) || []);
      } catch (e) {
        console.error(e);
        setVehicles([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const availableColors = useMemo(() => {
    if (!selectedVehicle) return [];
    return resolveColors(selectedVehicle, selectedVersion);
  }, [selectedVehicle, selectedVersion]);

  function openBuilder(vehicle: VehicleRow) {
    const versions = Array.isArray(vehicle.versions) ? vehicle.versions : [];
    const firstVersion = versions[0] || null;
    const colors = resolveColors(vehicle, firstVersion);

    setSelectedVehicle(vehicle);
    setSelectedVersion(firstVersion);
    setSelectedColor(colors[0] || null);
    setStep(1);
    setBuilderOpen(true);
  }

  function selectVersion(version: VersionItem) {
    if (!selectedVehicle) return;
    const colors = resolveColors(selectedVehicle, version);
    setSelectedVersion(version);
    setSelectedColor(colors[0] || null);
  }

  function calcTotal() {
    if (!selectedVersion) return 0;
    return Number(selectedVersion.price || 0) + Number(selectedColor?.extraPrice || 0);
  }

  function getDisplayImage(vehicle: VehicleRow, color?: ColorVariant | null) {
    if (color?.image_url) return color.image_url;
    return getModelImage(vehicle.slug, vehicle.model_name);
  }

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex h-9 items-center gap-1.5 border border-zinc-200 bg-white px-2.5 text-[12px] font-medium text-zinc-700 hover:bg-zinc-50"
            >
              <ChevronLeft size={16} />
              <span className="hidden sm:inline">Marcas</span>
            </Link>
            <span className="text-lg font-semibold tracking-tight">NISSAN</span>
          </div>
          <span className="text-[12px] text-zinc-500">Consórcio · Monte o seu</span>
        </div>
      </header>

      {/* Intro */}
      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <p className="text-[12px] font-medium uppercase tracking-wider text-red-600">
            Linha Nissan Brasil
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Escolha o seu Nissan
          </h1>
          <p className="mt-2 max-w-2xl text-[13px] text-zinc-500">
            Configure versão e cor para simular o consórcio. SUVs, sedãs e a
            picape Frontier com a tecnologia e a segurança da marca.
          </p>
        </div>
      </section>

      {/* Modelos */}
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        {loading ? (
          <p className="py-16 text-center text-[13px] text-zinc-400">Carregando…</p>
        ) : vehicles.length === 0 ? (
          <p className="py-16 text-center text-[13px] text-zinc-400">
            Nenhum modelo Nissan disponível.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {vehicles.map((car) => {
              const meta = getMeta(car.slug, car.model_name);
              return (
                <div
                  key={car.id}
                  className="flex flex-col border border-zinc-200 bg-white p-4"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-600">
                      {meta.category}
                    </span>
                  </div>

                  <div className="mb-4 flex h-28 items-center justify-center">
                    <img
                      src={getModelImage(car.slug, car.model_name)}
                      alt={car.model_name}
                      className="max-h-full max-w-full object-contain"
                      loading="lazy"
                    />
                  </div>

                  <h2 className="text-[14px] font-semibold uppercase tracking-wide">
                    {car.model_name}
                  </h2>
                  <p className="mt-0.5 text-[12px] text-zinc-500">{meta.tagline}</p>

                  <ul className="mt-2 space-y-0.5">
                    {meta.highlights.slice(0, 2).map((h) => (
                      <li key={h} className="text-[11px] text-zinc-400">
                        · {h}
                      </li>
                    ))}
                  </ul>

                  <p className="mt-3 text-[12px] text-zinc-500">
                    A partir de{" "}
                    <span className="font-medium text-zinc-900">
                      {formatPrice(Number(car.price_start || 0))}
                    </span>
                  </p>

                  <button
                    type="button"
                    onClick={() => openBuilder(car)}
                    className="mt-4 w-full bg-zinc-900 py-2.5 text-[12px] font-semibold uppercase tracking-wide text-white hover:bg-zinc-800"
                  >
                    Monte o seu
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Benefícios Nissan */}
      <section className="border-t border-zinc-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          <h2 className="text-[16px] font-semibold">Por que Nissan</h2>
          <p className="mt-1 text-[13px] text-zinc-500">
            Diferenciais da marca no seu consórcio
          </p>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map((b) => (
              <div key={b.title} className="border border-zinc-200 p-4">
                <h3 className="text-[13px] font-semibold text-zinc-900">{b.title}</h3>
                <p className="mt-1 text-[12px] leading-relaxed text-zinc-500">
                  {b.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-zinc-50">
        <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-3 px-4 py-6 sm:flex-row sm:items-center sm:px-6">
          <p className="text-[12px] text-zinc-500">
            Nissan · Consórcio · Valores de referência para simulação
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-[12px] font-medium text-zinc-700 hover:text-zinc-900"
          >
            <ChevronLeft size={14} />
            Voltar para seleção de marcas
          </Link>
        </div>
      </footer>

      {/* Builder */}
      {builderOpen && selectedVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setBuilderOpen(false)}
          />

          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto bg-white">
            <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-zinc-200 bg-white px-5 py-4">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-zinc-400">
                  {getMeta(selectedVehicle.slug, selectedVehicle.model_name).category}
                </p>
                <h3 className="text-[16px] font-semibold">
                  {selectedVehicle.model_name}
                </h3>
                <p className="text-[12px] text-zinc-500">
                  Passo {step} de 3 · {formatPrice(calcTotal())}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBuilderOpen(false)}
                className="text-[13px] font-medium text-zinc-500 hover:text-zinc-900"
              >
                Fechar
              </button>
            </div>

            <div className="p-5">
              <div className="mb-6 flex justify-center">
                <img
                  src={getDisplayImage(selectedVehicle, selectedColor)}
                  alt={selectedVehicle.model_name}
                  className="h-36 object-contain"
                />
              </div>

              {step === 1 && (
                <div>
                  <h4 className="mb-3 text-[14px] font-semibold">Versão</h4>
                  <div className="space-y-2">
                    {(selectedVehicle.versions || []).map((version) => (
                      <button
                        key={version.id}
                        type="button"
                        onClick={() => selectVersion(version)}
                        className={`w-full border p-3 text-left ${
                          selectedVersion?.id === version.id
                            ? "border-zinc-900 bg-zinc-50"
                            : "border-zinc-200 hover:border-zinc-400"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="block text-[14px] font-medium">
                              {version.title}
                            </span>
                            {version.subtitle && (
                              <span className="text-[12px] text-zinc-500">
                                {version.subtitle}
                              </span>
                            )}
                          </div>
                          <span className="shrink-0 text-[13px] text-zinc-600">
                            {formatPrice(version.price || 0)}
                          </span>
                        </div>
                        {(version.fuel ||
                          version.transmission ||
                          version.power) && (
                          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-zinc-400">
                            {version.fuel && <span>{version.fuel}</span>}
                            {version.transmission && (
                              <span>{version.transmission}</span>
                            )}
                            {version.power && <span>{version.power}</span>}
                          </div>
                        )}
                      </button>
                    ))}
                    {(selectedVehicle.versions || []).length === 0 && (
                      <p className="text-[13px] text-zinc-500">
                        Nenhuma versão cadastrada.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h4 className="mb-3 text-[14px] font-semibold">Cor</h4>
                  <p className="mb-3 text-[12px] text-zinc-500">
                    {availableColors.some((c) => c.id.startsWith("real-"))
                      ? "Paleta de referência Nissan"
                      : "Cores cadastradas no sistema"}
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {availableColors.map((color) => (
                      <button
                        key={color.id}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={`flex flex-col items-center gap-2 border p-3 ${
                          selectedColor?.id === color.id
                            ? "border-zinc-900 bg-zinc-50"
                            : "border-zinc-200 hover:border-zinc-400"
                        }`}
                      >
                        <div
                          className="h-9 w-9 rounded-full border border-zinc-300 shadow-inner"
                          style={{ backgroundColor: color.swatch || "#ddd" }}
                        />
                        <span className="text-center text-[12px] font-medium leading-tight">
                          {color.name}
                        </span>
                        {!!color.extraPrice && color.extraPrice > 0 && (
                          <span className="text-[11px] text-zinc-500">
                            + {formatPrice(color.extraPrice)}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  <h4 className="mb-4 text-[14px] font-semibold">Resumo</h4>
                  <div className="space-y-2 border border-zinc-200 bg-zinc-50 p-4 text-[13px]">
                    <div className="flex justify-between gap-4">
                      <span className="text-zinc-500">Modelo</span>
                      <span className="text-right font-medium">
                        {selectedVehicle.model_name}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-zinc-500">Categoria</span>
                      <span className="text-right font-medium">
                        {
                          getMeta(selectedVehicle.slug, selectedVehicle.model_name)
                            .category
                        }
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-zinc-500">Versão</span>
                      <span className="text-right font-medium">
                        {selectedVersion?.title || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-zinc-500">Cor</span>
                      <span className="flex items-center gap-2 font-medium">
                        {selectedColor && (
                          <span
                            className="inline-block h-3.5 w-3.5 rounded-full border border-zinc-300"
                            style={{ backgroundColor: selectedColor.swatch }}
                          />
                        )}
                        {selectedColor?.name || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-zinc-200 pt-2 text-[14px]">
                      <span className="font-semibold">Total estimado</span>
                      <span className="font-semibold">{formatPrice(calcTotal())}</span>
                    </div>
                  </div>
                  <p className="mt-3 text-center text-[11px] text-zinc-400">
                    Valores de referência · Consulte condições com o vendedor
                  </p>
                </div>
              )}

              <div className="mt-6 flex gap-2">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={() => setStep((s) => s - 1)}
                    className="flex-1 border border-zinc-300 py-3 text-[13px] font-medium hover:bg-zinc-50"
                  >
                    Voltar
                  </button>
                )}
                {step < 3 ? (
                  <button
                    type="button"
                    onClick={() => setStep((s) => s + 1)}
                    disabled={step === 1 && !selectedVersion}
                    className="flex-1 bg-zinc-900 py-3 text-[13px] font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                  >
                    Continuar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      console.log({
                        brand: "nissan",
                        model: selectedVehicle.model_name,
                        version: selectedVersion?.title,
                        color: selectedColor?.name,
                        swatch: selectedColor?.swatch,
                        total: calcTotal(),
                      });
                      setBuilderOpen(false);
                    }}
                    className="flex-1 bg-red-600 py-3 text-[13px] font-medium text-white hover:bg-red-700"
                  >
                    Confirmar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}