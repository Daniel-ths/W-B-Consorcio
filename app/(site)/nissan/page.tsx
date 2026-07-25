"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

/* =========================================================
   TIPOS (alinhados com o admin)
========================================================= */
type ColorVariant = {
  id: string;
  name: string;
  internal?: string;
  extraPrice?: number;
  swatch: string;
  image_url: string;
};

type VersionItem = {
  id: string;
  title: string;
  subtitle?: string;
  price: number;
  note?: string;
  cover_image_url?: string;
  fuel?: string;
  transmission?: string;
  transmissionFull?: string;
  torque?: string;
  power?: string;
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

type HeroSlide = {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
};

/* =========================================================
   IMAGENS FIXAS (você já tem cadastradas)
========================================================= */
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

function getModelImage(slug: string, modelName: string) {
  const key = (slug || modelName || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

  if (key.includes("kicks")) return MODEL_IMAGES.kicks;
  if (key.includes("kait")) return MODEL_IMAGES.kait;
  if (key.includes("versa")) return MODEL_IMAGES.versa;
  if (key.includes("frontier")) return MODEL_IMAGES.frontier;

  return MODEL_IMAGES.kicks; // fallback
}

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
export default function ConsorcioPage() {
  const HERO_DURATION = 7000;

  const heroSlides: HeroSlide[] = useMemo(
    () => [
      {
        id: "1",
        title: "MONTE O SEU NISSAN",
        subtitle:
          "Escolha o modelo, a cor e a versão ideal para o seu consórcio.",
        imageUrl:
          "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1920&q=90",
      },
      {
        id: "2",
        title: "NOVO NISSAN KAIT",
        subtitle:
          "Espaço, tecnologia e o melhor custo-benefício do segmento.",
        imageUrl:
          "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1920&q=90",
      },
      {
        id: "3",
        title: "NISSAN FRONTIER 2026",
        subtitle: "Força e robustez para o seu dia a dia.",
        imageUrl:
          "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1920&q=90",
      },
    ],
    []
  );

  const [current, setCurrent] = useState(0);
  const timer = useRef<number>();

  // dados do Supabase
  const [vehicles, setVehicles] = useState<VehicleRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Builder state
  const [builderOpen, setBuilderOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleRow | null>(
    null
  );
  const [selectedColor, setSelectedColor] = useState<ColorVariant | null>(
    null
  );
  const [selectedVersion, setSelectedVersion] = useState<VersionItem | null>(
    null
  );
  const [step, setStep] = useState(1); // 1=versão, 2=cor, 3=resumo

  // carrega veículos Nissan do Supabase
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

  // hero timer
  useEffect(() => {
    timer.current = window.setTimeout(() => {
      setCurrent((p) => (p + 1) % heroSlides.length);
    }, HERO_DURATION);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [current, heroSlides.length]);

  function openBuilder(vehicle: VehicleRow) {
    const versions = Array.isArray(vehicle.versions) ? vehicle.versions : [];
    const firstVersion = versions[0] || null;
    const firstColor =
      firstVersion?.colors && firstVersion.colors.length > 0
        ? firstVersion.colors[0]
        : null;

    setSelectedVehicle(vehicle);
    setSelectedVersion(firstVersion);
    setSelectedColor(firstColor);
    setStep(1);
    setBuilderOpen(true);
  }

  // cores da versão selecionada
  const availableColors = useMemo(() => {
    if (!selectedVersion) return [];
    return Array.isArray(selectedVersion.colors)
      ? selectedVersion.colors
      : [];
  }, [selectedVersion]);

  // preço total = preço da versão + extra da cor
  function calcTotal() {
    if (!selectedVersion) return 0;
    const colorExtra = selectedColor?.extraPrice || 0;
    return Number(selectedVersion.price || 0) + Number(colorExtra);
  }

  // imagem do modelo (fixa ou da cor escolhida)
  function getDisplayImage(vehicle: VehicleRow, color?: ColorVariant | null) {
    if (color?.image_url) return color.image_url;
    return getModelImage(vehicle.slug, vehicle.model_name);
  }

  return (
    <main className="bg-white min-h-screen text-zinc-900 font-sans">
      {/* ===================== HEADER ===================== */}
      <header className="absolute top-0 left-0 right-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="text-white text-2xl font-bold tracking-tight">
            NISSAN
          </div>
          <div className="text-white/80 text-sm hidden sm:block">
            Consórcio • Monte o seu
          </div>
        </div>
      </header>

      {/* ===================== HERO ===================== */}
      <section className="relative h-[85vh] min-h-[600px] overflow-hidden">
        {heroSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              current === index ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="absolute inset-0 bg-[#0a1a14]">
              <img
                src={slide.imageUrl}
                alt={slide.title}
                className="w-full h-full object-cover opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent" />
            </div>

            <div className="absolute inset-0 flex items-center">
              <div className="max-w-[1400px] mx-auto px-6 w-full">
                <div className="max-w-lg">
                  <h1 className="text-white text-4xl md:text-5xl font-bold tracking-tight mb-4">
                    {slide.title}
                  </h1>
                  <p className="text-white/90 text-lg mb-8 leading-relaxed">
                    {slide.subtitle}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
          {heroSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-1.5 rounded-full transition-all ${
                current === i ? "bg-white w-8" : "bg-white/40 w-2"
              }`}
            />
          ))}
        </div>
      </section>

      {/* ===================== LINHA DE MODELOS ===================== */}
      <section className="bg-white py-20">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold">Escolha o seu modelo</h2>
            <p className="mt-2 text-zinc-500">
              Clique em <strong>Monte o seu</strong> e configure o carro ideal
            </p>
          </div>

          {loading ? (
            <div className="text-center text-zinc-500 py-20">
              Carregando modelos...
            </div>
          ) : vehicles.length === 0 ? (
            <div className="text-center text-zinc-500 py-20">
              Nenhum modelo Nissan disponível no momento.
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
              {vehicles.map((car) => {
                const image = getModelImage(car.slug, car.model_name);
                const price = Number(car.price_start || 0);
                const tagline =
                  car.versions?.[0]?.subtitle ||
                  car.versions?.[0]?.note ||
                  "";

                return (
                  <div key={car.id} className="text-center group">
                    <div className="mb-6 h-36 flex items-center justify-center">
                      <img
                        src={image}
                        alt={car.model_name}
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition duration-500"
                      />
                    </div>

                    <h3 className="text-[15px] font-bold tracking-wide uppercase">
                      {car.model_name}
                    </h3>

                    {tagline ? (
                      <p className="text-[13px] text-zinc-500 mt-1">
                        {tagline}
                      </p>
                    ) : null}

                    <p className="text-[13px] text-zinc-500 mt-3">
                      A partir de
                      <br />
                      <span className="text-zinc-900 font-medium">
                        {formatPrice(price)}
                      </span>
                    </p>

                    <div className="mt-5">
                      <button
                        onClick={() => openBuilder(car)}
                        className="w-full max-w-[180px] bg-black text-white text-[13px] font-semibold py-3 rounded-full hover:bg-zinc-800 transition"
                      >
                        MONTE O SEU
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ===================== BUILDER MODAL ===================== */}
      {builderOpen && selectedVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setBuilderOpen(false)}
          />

          <div className="relative bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-5 flex items-center justify-between z-10">
              <div>
                <h3 className="text-xl font-bold">
                  {selectedVehicle.model_name}
                </h3>
                <p className="text-sm text-zinc-500">
                  Passo {step} de 3 • {formatPrice(calcTotal())}
                </p>
              </div>
              <button
                onClick={() => setBuilderOpen(false)}
                className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center hover:bg-zinc-200 transition"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              {/* Preview */}
              <div className="flex justify-center mb-8">
                <img
                  src={getDisplayImage(selectedVehicle, selectedColor)}
                  alt={selectedVehicle.model_name}
                  className="h-40 object-contain"
                />
              </div>

              {/* STEP 1 — VERSÃO */}
              {step === 1 && (
                <div>
                  <h4 className="font-semibold text-lg mb-4">
                    Escolha a versão
                  </h4>
                  <div className="space-y-3">
                    {(selectedVehicle.versions || []).map((version) => (
                      <button
                        key={version.id}
                        onClick={() => {
                          setSelectedVersion(version);
                          // reseta cor para a primeira da nova versão
                          const first =
                            version.colors && version.colors.length > 0
                              ? version.colors[0]
                              : null;
                          setSelectedColor(first);
                        }}
                        className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition ${
                          selectedVersion?.id === version.id
                            ? "border-black bg-zinc-50"
                            : "border-zinc-200 hover:border-zinc-400"
                        }`}
                      >
                        <div className="text-left">
                          <span className="font-medium block">
                            {version.title}
                          </span>
                          {version.subtitle ? (
                            <span className="text-xs text-zinc-500">
                              {version.subtitle}
                            </span>
                          ) : null}
                        </div>
                        <span className="text-sm text-zinc-500">
                          {formatPrice(version.price || 0)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 2 — COR */}
              {step === 2 && (
                <div>
                  <h4 className="font-semibold text-lg mb-4">Escolha a cor</h4>

                  {availableColors.length === 0 ? (
                    <p className="text-sm text-zinc-500">
                      Nenhuma cor cadastrada para esta versão.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {availableColors.map((color) => (
                        <button
                          key={color.id}
                          onClick={() => setSelectedColor(color)}
                          className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition ${
                            selectedColor?.id === color.id
                              ? "border-black bg-zinc-50"
                              : "border-zinc-200 hover:border-zinc-400"
                          }`}
                        >
                          <div
                            className="w-10 h-10 rounded-full border border-zinc-300 shadow-inner"
                            style={{
                              backgroundColor: color.swatch || "#ddd",
                            }}
                          />
                          <span className="text-sm font-medium text-center">
                            {color.name}
                          </span>
                          {color.extraPrice ? (
                            <span className="text-[11px] text-zinc-500">
                              + {formatPrice(color.extraPrice)}
                            </span>
                          ) : null}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3 — RESUMO */}
              {step === 3 && (
                <div>
                  <h4 className="font-semibold text-lg mb-6">
                    Resumo da sua configuração
                  </h4>

                  <div className="bg-zinc-50 rounded-2xl p-5 space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Modelo</span>
                      <span className="font-medium">
                        {selectedVehicle.model_name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Versão</span>
                      <span className="font-medium">
                        {selectedVersion?.title || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Cor</span>
                      <span className="font-medium">
                        {selectedColor?.name || "—"}
                      </span>
                    </div>
                    <div className="border-t pt-3 flex justify-between text-base">
                      <span className="font-semibold">Total estimado</span>
                      <span className="font-bold text-lg">
                        {formatPrice(calcTotal())}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-400 mt-4 text-center">
                    Valores de referência para simulação de consórcio. Consulte
                    condições com o vendedor.
                  </p>
                </div>
              )}

              {/* Navegação */}
              <div className="mt-8 flex gap-3">
                {step > 1 && (
                  <button
                    onClick={() => setStep((s) => s - 1)}
                    className="flex-1 py-3.5 rounded-full border border-zinc-300 font-semibold hover:bg-zinc-50 transition"
                  >
                    Voltar
                  </button>
                )}

                {step < 3 ? (
                  <button
                    onClick={() => setStep((s) => s + 1)}
                    disabled={step === 1 && !selectedVersion}
                    className="flex-1 py-3.5 rounded-full bg-black text-white font-semibold hover:bg-zinc-800 transition disabled:opacity-50"
                  >
                    Continuar
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      alert(
                        `Configuração salva!\n\n${selectedVehicle.model_name}\nVersão: ${selectedVersion?.title}\nCor: ${selectedColor?.name || "—"}\nTotal: ${formatPrice(calcTotal())}`
                      );
                      setBuilderOpen(false);
                    }}
                    className="flex-1 py-3.5 rounded-full bg-red-600 text-white font-semibold hover:bg-red-700 transition"
                  >
                    Salvar configuração
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp */}
      <a
        href="#"
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition"
      >
        <svg
          className="w-7 h-7 text-white"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.85 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>
    </main>
  );
}