"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

/* =========================================================
   TIPOS (iguais ao admin)
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

/* =========================================================
   IMAGENS FIXAS (fallback)
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
  return MODEL_IMAGES.kicks;
}

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
export default function BuilderVersoesPage() {
  const params = useParams();
  const router = useRouter();
  const slug = String(params?.slug || "");

  const [vehicle, setVehicle] = useState<VehicleRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [budget, setBudget] = useState(300000);
  const [selectedVersion, setSelectedVersion] = useState<VersionItem | null>(
    null
  );

  // carrega o veículo pelo slug
  useEffect(() => {
    if (!slug) return;

    async function load() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("vehicles")
          .select("*")
          .eq("brand", "nissan")
          .eq("slug", slug)
          .eq("is_visible", true)
          .single();

        if (error) throw error;
        setVehicle(data as VehicleRow);

        // define orçamento inicial com base no preço mais alto das versões
        const versions = Array.isArray(data?.versions) ? data.versions : [];
        if (versions.length > 0) {
          const maxPrice = Math.max(
            ...versions.map((v: VersionItem) => Number(v.price || 0))
          );
          setBudget(Math.ceil(maxPrice * 1.1));
        }
      } catch (e) {
        console.error(e);
        setVehicle(null);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [slug]);

  const versions = useMemo(() => {
    if (!vehicle?.versions) return [];
    return Array.isArray(vehicle.versions) ? vehicle.versions : [];
  }, [vehicle]);

  const filteredVersions = useMemo(() => {
    return versions.filter((v) => Number(v.price || 0) <= budget);
  }, [versions, budget]);

  const heroImage = vehicle
    ? getModelImage(vehicle.slug, vehicle.model_name)
    : MODEL_IMAGES.kicks;

  if (loading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-zinc-500">Carregando versões...</p>
      </main>
    );
  }

  if (!vehicle) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-500 mb-4">Modelo não encontrado.</p>
          <button
            onClick={() => router.push("/nissan")}
            className="text-sm font-semibold underline"
          >
            Voltar
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-zinc-900 font-sans">
      {/* ===================== HEADER ===================== */}
      <header className="border-b border-zinc-100">
        <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-zinc-800 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full border border-zinc-800" />
            </div>
            <span className="text-sm font-medium tracking-wide uppercase">
              {vehicle.model_name}
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-medium tracking-wide text-zinc-600">
            <a href="#" className="hover:text-zinc-900 transition">
              RESERVE O SEU VEÍCULO
            </a>
            <a href="#" className="hover:text-zinc-900 transition">
              ALUGUE O SEU
            </a>
            <a href="#" className="hover:text-zinc-900 transition">
              QUERO UM CONTATO
            </a>
          </nav>
        </div>
      </header>

      {/* ===================== HERO ===================== */}
      <section className="bg-[#f5f5f5] relative overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-6 py-16 md:py-20 flex flex-col md:flex-row items-center justify-between gap-10">
          <div>
            <h1 className="text-4xl md:text-5xl font-light tracking-tight text-zinc-900">
              Escolha a sua versão
            </h1>
            <p className="mt-2 text-zinc-500 text-lg">E monte do seu jeito</p>
          </div>

          <div className="w-full max-w-md">
            <img
              src={heroImage}
              alt={vehicle.model_name}
              className="w-full object-contain drop-shadow-xl"
            />
          </div>
        </div>
      </section>

      {/* ===================== CONTEÚDO ===================== */}
      <section className="max-w-[1400px] mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* FILTROS */}
          <aside className="w-full lg:w-56 flex-shrink-0">
            <h2 className="text-sm font-medium text-zinc-900 mb-1">Filtros</h2>
            <p className="text-[11px] text-zinc-400 uppercase tracking-wider mb-6">
              0 FILTROS SELECIONADOS
            </p>

            <div className="border-t border-zinc-200 py-4">
              <button className="w-full flex items-center justify-between text-sm text-zinc-700">
                <span>Ordenar por</span>
                <span className="text-lg leading-none">+</span>
              </button>
            </div>

            <div className="border-t border-zinc-200 py-4">
              <p className="text-sm text-zinc-700 mb-4">Orçamento</p>
              <input
                type="range"
                min={100000}
                max={500000}
                step={1000}
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full accent-zinc-900"
              />
              <p className="text-sm text-zinc-600 mt-2">
                {formatPrice(budget)}
              </p>
            </div>

            <div className="border-t border-zinc-200 py-4">
              <p className="text-sm text-zinc-700 mb-3">Tração</p>
              <label className="flex items-center gap-2 text-sm text-zinc-600 cursor-pointer">
                <input type="checkbox" className="rounded border-zinc-300" />
                Dianteira ({versions.length})
              </label>
            </div>

            <div className="border-t border-zinc-200 py-4">
              <p className="text-sm text-zinc-700 mb-3">Transmissão</p>
              <label className="flex items-center gap-2 text-sm text-zinc-600 cursor-pointer">
                <input type="checkbox" className="rounded border-zinc-300" />
                {versions[0]?.transmission || "Automática"} ({versions.length})
              </label>
            </div>
          </aside>

          {/* LISTA DE VERSÕES */}
          <div className="flex-1">
            <p className="text-sm text-zinc-500 mb-6">
              {filteredVersions.length} versão
              {filteredVersions.length !== 1 ? "ões" : ""} disponível
              {filteredVersions.length !== 1 ? "is" : ""}
            </p>

            {filteredVersions.length === 0 ? (
              <div className="text-center text-zinc-500 py-16">
                Nenhuma versão dentro do orçamento selecionado.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                {filteredVersions.map((version) => {
                  const image =
                    version.cover_image_url ||
                    getModelImage(vehicle.slug, vehicle.model_name);

                  return (
                    <div
                      key={version.id}
                      className="bg-[#f7f7f7] rounded-lg overflow-hidden flex flex-col"
                    >
                      {/* Imagem */}
                      <div className="h-44 flex items-center justify-center p-4 bg-[#f0f0f0]">
                        <img
                          src={image}
                          alt={version.title}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>

                      {/* Conteúdo */}
                      <div className="p-5 flex flex-col flex-1 bg-white">
                        {/* Tags */}
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {version.fuel ? (
                            <span className="text-[10px] bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded">
                              {version.fuel}
                            </span>
                          ) : null}
                          {version.transmission ? (
                            <span className="text-[10px] bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded">
                              {version.transmission}
                            </span>
                          ) : null}
                        </div>

                        {/* Nome */}
                        <h3 className="text-lg font-semibold text-zinc-900">
                          {version.title}
                        </h3>

                        {version.subtitle ? (
                          <p className="text-[12px] text-zinc-500 mt-0.5">
                            {version.subtitle}
                          </p>
                        ) : null}

                        <button className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1 hover:text-zinc-600 transition">
                          <span className="w-3.5 h-3.5 rounded-full border border-zinc-300 flex items-center justify-center text-[9px]">
                            i
                          </span>
                          LEIA MAIS
                        </button>

                        {/* Specs */}
                        <div className="mt-5 space-y-3 text-[13px]">
                          {version.torque ? (
                            <div>
                              <p className="font-semibold text-zinc-900">
                                {version.torque}
                              </p>
                              <p className="text-zinc-400 text-[11px]">
                                Torque Máx. Nm @ rpm
                              </p>
                            </div>
                          ) : null}

                          {version.power ? (
                            <div>
                              <p className="font-semibold text-zinc-900">
                                {version.power}
                              </p>
                              <p className="text-zinc-400 text-[11px]">
                                Potência Max. cv @ rpm
                              </p>
                            </div>
                          ) : null}

                          {version.transmissionFull ? (
                            <div>
                              <p className="font-semibold text-zinc-900">
                                {version.transmissionFull}
                              </p>
                              <p className="text-zinc-400 text-[11px]">
                                Transmissão
                              </p>
                            </div>
                          ) : null}

                          {version.trunk ? (
                            <div>
                              <p className="font-semibold text-zinc-900">
                                {version.trunk}
                              </p>
                              <p className="text-zinc-400 text-[11px]">
                                Porta-malas
                              </p>
                            </div>
                          ) : null}
                        </div>

                        {/* Preço + Botão */}
                        <div className="mt-auto pt-6">
                          <p className="text-[12px] text-zinc-500">
                            A partir de
                          </p>
                          <p className="text-lg font-semibold text-zinc-900 flex items-center gap-1">
                            {formatPrice(Number(version.price || 0))}
                            <span className="w-3.5 h-3.5 rounded-full border border-zinc-300 flex items-center justify-center text-[9px] text-zinc-400">
                              i
                            </span>
                          </p>

                          <button
                            onClick={() => setSelectedVersion(version)}
                            className="mt-4 w-full bg-zinc-900 text-white text-sm font-semibold py-3 rounded-full hover:bg-zinc-800 transition"
                          >
                            MONTE O SEU
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ===================== TEXTO LEGAL ===================== */}
      <section className="border-t border-zinc-100 mt-10">
        <div className="max-w-[1400px] mx-auto px-6 py-8">
          <p className="text-sm font-medium text-zinc-700 mb-3">Texto legal</p>
          <div className="text-[11px] text-zinc-400 leading-relaxed space-y-2 max-w-5xl">
            <p>
              As imagens dos veículos vendidos pela Nissan do Brasil incluídos
              nesta página são meramente ilustrativas e a tonalidade das cores
              verificadas no site pode variar em relação à cor real do veículo.
              Consulte a concessionária Nissan de sua preferência para saber
              sobre as características, acessórios e especificações técnicas de
              cada modelo e versão, bem como a disponibilidade das mesmas.
            </p>
            <p>
              *Preço público sugerido em reais, com frete incluso, válido para
              todo território nacional. O preço público sugerido é um valor
              referência e, por força de Lei, cada Concessionária tem a
              liberdade de praticar o seu preço específico. Consulte a
              concessionária de sua preferência para mais informações.
            </p>
          </div>
        </div>
      </section>

      {/* ===================== MODAL ===================== */}
      {selectedVersion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSelectedVersion(null)}
          />
          <div className="relative bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl">
            <button
              onClick={() => setSelectedVersion(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 hover:bg-zinc-200"
            >
              ✕
            </button>

            <h3 className="text-xl font-semibold mb-1">
              {selectedVersion.title}
            </h3>
            <p className="text-zinc-500 text-sm mb-6">
              Configuração iniciada para o consórcio
            </p>

            <div className="bg-zinc-50 rounded-xl p-4 mb-6 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Modelo</span>
                <span className="font-medium">{vehicle.model_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Versão</span>
                <span className="font-medium">{selectedVersion.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Preço a partir de</span>
                <span className="font-medium">
                  {formatPrice(Number(selectedVersion.price || 0))}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                // aqui você pode redirecionar para o builder de cor
                // ou salvar a escolha
                alert(
                  `Versão selecionada: ${selectedVersion.title}\nValor: ${formatPrice(Number(selectedVersion.price || 0))}`
                );
                setSelectedVersion(null);
              }}
              className="w-full bg-zinc-900 text-white py-3.5 rounded-full font-semibold hover:bg-zinc-800 transition"
            >
              Continuar configuração
            </button>
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