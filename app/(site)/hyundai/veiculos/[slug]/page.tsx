// app/hyundai/veiculos/[slug]/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import OrderSummary from "@/components/OrderSummary";

import { Loader2 } from "lucide-react";

/* =========================================================
   ✅ CONFIG MANUAL (VOCÊ EDITA AQUI)
   - Imagem de fundo que fica atrás do veículo (texture / foto / pattern)
   - Cor base quando ainda não escolheu a cor (passo 1)
========================================================= */
const HERO_BG_IMAGE_URL =
  "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/73610802-natureza-fundo-natureza-papel-de-parede-meandros-rio-ventos-atraves-exuberante-verde-floresta-coberto-montanhas-debaixo-nublado-ceu-gratis-foto.jpg";
const HERO_BASE_TINT = "#03030300";

/* =========================================================
   TIPOS
========================================================= */
type SpecGroup = {
  id: string;
  title: string;
  description?: string;
  items?: string[];
};

type VersionItem = {
  id: string;
  title: string;
  subtitle: string;
  price: number;
  note?: string;
  heroLabel?: string;
  cover_image_url?: string | null;
  spec_groups?: SpecGroup[] | null;
  highlights?: string[] | null;
  colors?: ColorVariant[] | null;
};

type ColorVariant = {
  id: string;
  name: string;
  internal?: string;
  extraPrice?: number;
  swatch: string;
  image_url: string;
  bg_swatch?: string | null;
};

type VehicleRow = {
  id: number;
  model_name: string;
  slug: string;
  image_url?: string | null;
  brand?: string | null;
  is_visible?: boolean | null;
  price_start?: number | null;
  versions?: VersionItem[] | null;
  colors?: ColorVariant[] | null;
  spec_groups?: SpecGroup[] | null;
  highlights?: string[] | null;
};

const HY_BLUE = "#00A3C8";

const money = (v: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(Number(v || 0));

function normalizeArray<T>(val: any): T[] {
  if (Array.isArray(val)) return val as T[];
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed as T[];
    } catch {}
  }
  return [];
}

/* =========================
   Página principal
========================= */

export default function HyundaiVehicleSlugPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const slug = useMemo(() => {
    const raw = (params as any)?.slug;

    if (Array.isArray(raw)) return raw[0] ? String(raw[0]) : "";
    if (raw) return String(raw);

    const q = searchParams?.get("slug");
    if (q) return String(q);

    const parts = String(pathname || "").split("/").filter(Boolean);
    const last = parts[parts.length - 1] || "";
    if (last && last !== "veiculos" && last !== "monte-o-seu" && last !== "hyundai") return last;

    return "";
  }, [params, pathname, searchParams]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [vehicle, setVehicle] = useState<VehicleRow | null>(null);

  // ✅ 1: versão | 2: cor | 3: acessórios | 4: OrderSummary existente
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const [selectedVersionId, setSelectedVersionId] = useState<string>("");
  const [selectedColorId, setSelectedColorId] = useState<string>("");
  const [openSpecId, setOpenSpecId] = useState<string | null>(null);

  // animações
  const [imgKey, setImgKey] = useState(0);
  const [bgKey, setBgKey] = useState(0);
  const [colorChangedOnce, setColorChangedOnce] = useState(false);

  // user (vendedor)
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!mounted) return;
        setUser(data?.user || null);
      } catch {
        if (!mounted) return;
        setUser(null);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    if (!slug) {
      setErr("Veículo não encontrado (slug ausente na URL).");
      setVehicle(null);
      setLoading(false);
      return () => {
        mounted = false;
      };
    }

    const timeoutId = window.setTimeout(() => {
      if (!mounted) return;
      setErr("Demorou demais para carregar. Tente novamente.");
      setLoading(false);
    }, 12000);

    (async () => {
      setLoading(true);
      setErr(null);
      setVehicle(null);

      try {
        const { data, error } = await supabase
          .from("vehicles")
          .select(
            "id, model_name, slug, image_url, brand, is_visible, price_start, versions, colors, spec_groups, highlights"
          )
          .eq("brand", "hyundai")
          .eq("slug", slug)
          .maybeSingle();

        if (error) throw error;
        if (!mounted) return;

        if (!data) {
          setErr("Veículo não encontrado.");
          return;
        }

        if ((data as any).is_visible === false) {
          setErr("Este veículo está oculto.");
          return;
        }

        const v = data as VehicleRow;
        const safeVersions = normalizeArray<VersionItem>(v.versions);

        setVehicle(v);

        const firstV = safeVersions[0];
        setSelectedVersionId(firstV?.id || "");

        const firstVColors = normalizeArray<ColorVariant>((firstV as any)?.colors);
        const legacyColors = normalizeArray<ColorVariant>(v.colors);
        const firstColor = firstVColors[0] || legacyColors[0] || null;

        setSelectedColorId(firstColor?.id || "");
        setImgKey((k) => k + 1);
        setBgKey((k) => k + 1);
        setColorChangedOnce(false);
      } catch (e: any) {
        if (!mounted) return;
        setErr(e?.message || "Erro ao carregar veículo.");
      } finally {
        if (!mounted) return;
        window.clearTimeout(timeoutId);
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
      window.clearTimeout(timeoutId);
    };
  }, [slug]);

  const versions = useMemo<VersionItem[]>(() => normalizeArray<VersionItem>(vehicle?.versions), [vehicle]);

  const selectedVersion = useMemo(() => {
    return versions.find((v) => v.id === selectedVersionId) || versions[0] || null;
  }, [versions, selectedVersionId]);

  const colorVariants = useMemo<ColorVariant[]>(() => {
    const fromVersion = normalizeArray<ColorVariant>((selectedVersion as any)?.colors);
    if (fromVersion.length) return fromVersion;
    return normalizeArray<ColorVariant>(vehicle?.colors);
  }, [selectedVersion, vehicle]);

  const selectedColor = useMemo(() => {
    return colorVariants.find((c) => c.id === selectedColorId) || colorVariants[0] || null;
  }, [colorVariants, selectedColorId]);

  useEffect(() => {
    const first = colorVariants[0] || null;
    setSelectedColorId(first?.id || "");
    setImgKey((k) => k + 1);
    setBgKey((k) => k + 1);
    setOpenSpecId(null);
  }, [selectedVersionId]); // intencional

  const specGroups = useMemo<SpecGroup[]>(() => {
    const fromVersion = normalizeArray<SpecGroup>((selectedVersion as any)?.spec_groups);
    if (fromVersion.length) return fromVersion;
    return normalizeArray<SpecGroup>(vehicle?.spec_groups);
  }, [selectedVersion, vehicle]);

  const highlights = useMemo<string[]>(() => {
    const fromVersion = normalizeArray<string>((selectedVersion as any)?.highlights);
    if (fromVersion.length) return fromVersion;
    return normalizeArray<string>(vehicle?.highlights);
  }, [selectedVersion, vehicle]);

  // ✅ herdado do que já existe no carro/versão
  const accessoriesContent = useMemo(() => {
    return (specGroups || [])
      .map((g) => ({
        title: String(g?.title || "").trim(),
        description: String(g?.description || "").trim() || undefined,
      }))
      .filter((x) => !!x.title);
  }, [specGroups]);

  const highlightsContent = useMemo(
    () => (highlights || []).map((h) => String(h || "").trim()).filter(Boolean),
    [highlights]
  );

  const currentImageUrl = useMemo(() => {
    if (step >= 2 && selectedColor?.image_url) return selectedColor.image_url;
    const cover = (selectedVersion as any)?.cover_image_url;
    return cover || vehicle?.image_url || null;
  }, [step, selectedColor?.image_url, selectedVersion, vehicle?.image_url]);

  const heroTint = useMemo(() => {
    if (step >= 2) {
      const c = selectedColor?.bg_swatch || selectedColor?.swatch;
      return c || HERO_BASE_TINT;
    }
    return HERO_BASE_TINT;
  }, [step, selectedColor?.bg_swatch, selectedColor?.swatch]);

  useEffect(() => {
    setImgKey((k) => k + 1);
    if (step >= 2) {
      setBgKey((k) => k + 1);
      setColorChangedOnce(true);
    }
  }, [selectedColorId, step]);

  const totalPrice = useMemo(() => {
    const base = selectedVersion?.price ?? vehicle?.price_start ?? 0;
    const extra = selectedColor?.extraPrice || 0;
    return base + extra;
  }, [selectedVersion?.price, vehicle?.price_start, selectedColor?.extraPrice]);

  const Title = vehicle?.model_name || "Hyundai";

  const queryBaseParams = useMemo(() => {
    const params = new URLSearchParams();

    params.set("tipo", "ANALISE_CREDITO");
    params.set("modelo", vehicle?.model_name || "");
    params.set("valor", String(totalPrice || 0));
    params.set("imagem", (selectedColor?.image_url || vehicle?.image_url || "") as string);

    if (selectedVersion?.title) params.set("versao", selectedVersion.title);
    if (selectedColor?.name) params.set("cor", selectedColor.name);

    return params;
  }, [vehicle?.model_name, vehicle?.image_url, selectedColor?.image_url, selectedColor?.name, selectedVersion?.title, totalPrice]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white pt-24 px-6 text-sm font-bold text-gray-500 flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (err) {
    return (
      <div className="min-h-screen bg-white pt-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-sm font-bold text-red-600">{err}</div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold hover:bg-gray-50"
            >
              Voltar
            </button>
            <Link
              href="/hyundai/veiculos"
              className="px-4 py-2 rounded-lg bg-black text-white text-sm font-semibold hover:bg-gray-800"
            >
              Ver catálogo
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!vehicle) return null;

  const basePriceDisplay = selectedVersion?.price ?? vehicle.price_start ?? 0;

  // ✅ agora usa o OrderSummary já existente por import
  if (step === 4) {
    return (
      <OrderSummary
        currentCar={vehicle}
        selectedVersion={selectedVersion}
        selectedColor={selectedColor}
        totalPrice={totalPrice}
        user={user}
        onEdit={() => setStep(1)}
        queryBaseParams={queryBaseParams}
        accessoriesContent={accessoriesContent}
        highlightsContent={highlightsContent}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f2ef]">
      <style>{`
        @keyframes hyVeh_fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes hyVeh_imgIn {
          from { opacity: 0; transform: translateY(8px) scale(0.99); filter: blur(0.3px); }
          to   { opacity: 1; transform: translateY(0) scale(1); filter: blur(0px); }
        }

        @keyframes hyVeh_bgPulse {
          from { opacity: 0.55; transform: scale(1.01); }
          to   { opacity: 1; transform: scale(1); }
        }

        .hyVeh_animFadeUp { animation: hyVeh_fadeUp 260ms ease-out both; }
        .hyVeh_animImg { animation: hyVeh_imgIn 320ms cubic-bezier(.2,.8,.2,1) both; }
        .hyVeh_bgPulse { animation: hyVeh_bgPulse 420ms cubic-bezier(.2,.8,.2,1) both; }

        .hyVeh_heroBg {
          position: relative;
          overflow: hidden;
          background: var(--tint);
          transition: background-color 420ms cubic-bezier(.2,.8,.2,1);
        }

        .hyVeh_heroBg::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image: var(--bg-url);
          background-size: cover;
          background-position: center;
          opacity: 0.26;
          filter: saturate(1.05) contrast(1.02);
          pointer-events: none;
          transform: translateZ(0);
        }

        .hyVeh_heroBg::after {
          content: "";
          position: absolute;
          inset: 0;
          background:
            radial-gradient(120% 90% at 15% 25%, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.07) 55%, rgba(0,0,0,0.10) 100%),
            radial-gradient(90% 70% at 80% 35%, rgba(0,0,0,0.14) 0%, rgba(0,0,0,0.03) 55%, rgba(255,255,255,0.00) 100%),
            repeating-linear-gradient(
              45deg,
              rgba(255,255,255,0.08) 0px,
              rgba(255,255,255,0.08) 2px,
              rgba(255,255,255,0.00) 2px,
              rgba(255,255,255,0.00) 7px
            );
          opacity: 0.7;
          mix-blend-mode: overlay;
          pointer-events: none;
          transform: translateZ(0);
        }
      `}</style>

      <div className="bg-white border-b border-black/5">
        <div className="max-w-[1200px] mx-auto px-6 pt-6 pb-3">
          <div className="text-[12px] text-gray-500">
            <span className="mr-1">🏠</span>
            <span className="hover:underline cursor-pointer" onClick={() => router.push("/hyundai")}>
              Início
            </span>{" "}
            · <span className="font-medium text-gray-700">Monte o seu</span>
          </div>

          <div className="mt-4">
            <div className="grid grid-cols-3 gap-8 items-end">
              <div>
                <div className="text-[11px] font-semibold text-gray-500">Passo 1</div>
                <div className="mt-1 flex items-center gap-3">
                  <button onClick={() => setStep(1)} className="text-[12px] font-semibold text-gray-700 hover:underline">
                    Selecione a versão
                  </button>
                  <button className="text-[12px] text-gray-500 hover:underline" onClick={() => setStep(1)}>
                    Alterar
                  </button>
                </div>
                <div className="mt-2 h-[3px] w-full bg-black/10">
                  <div className="h-[3px] w-[25%]" style={{ background: HY_BLUE }} />
                </div>
              </div>

              <div>
                <div className="text-[11px] font-semibold text-gray-500">Passo 2</div>
                <div className="mt-1 flex items-center gap-3">
                  <button onClick={() => setStep(2)} className="text-[12px] font-semibold text-gray-700 hover:underline">
                    Selecione a cor
                  </button>
                </div>
                <div className="mt-2 h-[3px] w-full bg-black/10">
                  <div
                    className="h-[3px] transition-all duration-300"
                    style={{ width: step === 1 ? "0%" : "100%", background: HY_BLUE }}
                  />
                </div>
              </div>

              <div>
                <div className="text-[11px] font-semibold text-gray-500">Passo 3</div>
                <div className="mt-1 flex items-center gap-3">
                  <button onClick={() => setStep(3)} className="text-[12px] font-semibold text-gray-700 hover:underline">
                    Acessórios & Especificações
                  </button>
                </div>
                <div className="mt-2 h-[3px] w-full bg-black/10">
                  <div
                    className="h-[3px] transition-all duration-300"
                    style={{ width: step === 3 ? "100%" : "0%", background: HY_BLUE }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-8 items-start">
          <div className="col-span-12 lg:col-span-4 hyVeh_animFadeUp">
            {step === 1 ? (
              <>
                <div className="text-[12px] text-gray-700 font-semibold mb-4">
                  {versions.length} versão(ões) cadastrada(s)
                </div>

                {versions.length === 0 ? (
                  <div className="text-sm text-gray-600 bg-white border border-black/10 rounded-md p-4">
                    Nenhuma versão cadastrada no builder.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {versions.map((v) => {
                      const active = v.id === selectedVersionId;
                      const cover = (v as any)?.cover_image_url || "";

                      return (
                        <button
                          key={v.id}
                          onClick={() => setSelectedVersionId(v.id)}
                          className={`w-full text-left border rounded-md bg-white px-4 py-3 transition-all duration-200 ${
                            active ? "border-black/30" : "border-black/10 hover:border-black/20"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-1 h-3 w-3 rounded-full border border-black/30 flex items-center justify-center">
                              {active ? <div className="h-2 w-2 rounded-full bg-black" /> : null}
                            </div>

                            <div className="w-14 h-10 bg-gray-50 border border-black/10 rounded overflow-hidden flex items-center justify-center">
                              {cover ? (
                                <img src={cover} alt={v.title} />
                              ) : (
                                <div className="text-[10px] text-gray-400">SEM CAPA</div>
                              )}
                            </div>

                            <div className="flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <div className="text-[13px] font-semibold text-gray-900">{v.title}</div>
                                <div className="text-[12px] font-semibold text-gray-900">{money(v.price)}</div>
                              </div>

                              {v.subtitle ? <div className="mt-1 text-[11px] text-gray-600">{v.subtitle}</div> : null}
                              {v.note ? (
                                <div className="mt-2 text-[11px] text-gray-600 leading-snug">{v.note}</div>
                              ) : null}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            ) : step === 2 ? (
              <>
                <div className="text-[12px] text-gray-700 font-semibold mb-4">{colorVariants.length} cores disponíveis</div>

                {colorVariants.length === 0 ? (
                  <div className="text-sm text-gray-600 bg-white border border-black/10 rounded-md p-4">
                    Nenhuma cor cadastrada no builder.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {colorVariants.map((c) => {
                      const active = c.id === selectedColorId;
                      return (
                        <button
                          key={c.id}
                          onClick={() => {
                            setSelectedColorId(c.id);
                          }}
                          className={`text-left bg-white border transition-all duration-200 ${
                            active ? "border-[#0F3C66] ring-2 ring-[#0F3C66]/10" : "border-black/10 hover:border-black/20"
                          }`}
                          style={{ borderRadius: 0 }}
                          title={c.image_url ? "Trocar cor (troca imagem e fundo)" : "Cor sem imagem"}
                        >
                          <div className="p-3">
                            <div className="text-[11px] font-semibold text-gray-900">{c.name}</div>
                            <div className="text-[10px] text-gray-600">
                              {c.internal ? `Cor interna: ${c.internal}` : "\u00A0"}
                            </div>
                            <div className="mt-2 text-[11px] font-semibold text-gray-900">
                              {c.extraPrice ? `+ ${money(c.extraPrice)}` : "+ R$ 0,00"}
                            </div>
                          </div>

                          <div className="h-[86px] border-t border-black/10" style={{ background: c.swatch || "#ddd" }} />
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="text-[12px] text-gray-700 font-semibold mb-4">
                  Conteúdo herdado para <span className="font-bold">Acessórios</span> e{" "}
                  <span className="font-bold">Especificações</span>
                </div>

                <div className="bg-white border border-black/10 rounded-md p-4">
                  <div className="text-[12px] font-semibold text-gray-900">Especificações (Destaques)</div>
                  <div className="mt-3">
                    {highlightsContent.length ? (
                      <div className="space-y-2">
                        {highlightsContent.map((h, idx) => (
                          <div key={idx} className="flex gap-2 text-[12px] text-gray-700">
                            <span className="text-gray-400">•</span>
                            <span>{h}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[12px] text-gray-500">(Sem destaques cadastrados.)</div>
                    )}
                  </div>

                  <div className="mt-6 border-t border-black/10 pt-4">
                    <div className="text-[12px] font-semibold text-gray-900">Acessórios</div>
                    <div className="mt-3 space-y-3">
                      {accessoriesContent.length ? (
                        accessoriesContent.map((a, idx) => (
                          <div key={idx} className="border border-black/10 rounded p-3">
                            <div className="text-[12px] font-semibold text-gray-900">{a.title}</div>
                            <div className="text-[11px] text-gray-600 mt-1 leading-relaxed">
                              {a.description ? a.description : "(Sem descrição)"}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-[12px] text-gray-500">(Sem itens de série para herdar.)</div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="col-span-12 lg:col-span-8 hyVeh_animFadeUp">
            <div className="text-[14px] text-gray-700">
              <span className="font-semibold">{Title}</span>
              {selectedVersion?.title ? (
                <>
                  <span className="mx-2">•</span>
                  <span className="font-semibold">{selectedVersion.title}</span>
                </>
              ) : null}
              {step >= 2 && selectedColor?.name ? (
                <>
                  <span className="mx-2">•</span>
                  <span className="font-semibold">{selectedColor.name}</span>
                  <span className="mx-4 font-bold text-gray-900">{money(totalPrice)}</span>
                </>
              ) : (
                <span className="mx-4 font-bold text-gray-900">{money(basePriceDisplay)}</span>
              )}
            </div>

            <div className="mt-3 bg-white border border-black/10 rounded-md overflow-hidden">
              <div
                className={[
                  "h-[280px] hyVeh_heroBg relative",
                  step >= 2 && colorChangedOnce ? "hyVeh_bgPulse" : "",
                ].join(" ")}
                key={bgKey}
                style={{
                  ["--tint" as any]: heroTint,
                  ["--bg-url" as any]: `url("${HERO_BG_IMAGE_URL}")`,
                }}
              >
                <div className="absolute top-3 left-3 z-[2]">
                  <span className="inline-flex items-center px-2 py-1 text-[11px] font-semibold bg-white/85 border border-black/10 rounded">
                    {selectedVersion?.heroLabel || "Exterior"}
                  </span>
                </div>

                <div className="h-full flex items-center justify-center relative z-[2]">
                  {currentImageUrl ? (
                    <img
                      key={imgKey}
                      src={currentImageUrl}
                      alt={vehicle.model_name}
                      className="w-[86%] h-[86%] object-contain hyVeh_animImg drop-shadow-[0_18px_26px_rgba(0,0,0,0.18)]"
                      draggable={false}
                    />
                  ) : (
                    <div className="text-xs font-bold text-gray-500">Sem imagem</div>
                  )}
                </div>
              </div>

              <div className="p-6">
                <h2 className="text-[22px] font-semibold text-gray-900">Especificações do seu Hyundai</h2>

                {highlights.length > 0 ? (
                  <div className="mt-4 space-y-3 text-[12px] text-gray-700">
                    {highlights.map((txt, idx) => (
                      <div key={idx} className="flex gap-2">
                        <span>•</span>
                        <span>{txt}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 text-[12px] text-gray-500">(Sem destaques cadastrados no builder.)</div>
                )}

                <h3 className="mt-8 text-[18px] font-semibold text-gray-900">Itens de série</h3>

                <div className="mt-3 border border-black/10 rounded-md overflow-hidden bg-white">
                  {specGroups.length === 0 ? (
                    <div className="px-4 py-4 text-sm text-gray-500">
                      Nenhuma seção cadastrada no builder.
                      <div className="mt-1 text-[11px] text-gray-400">
                        Dica: salve em <span className="font-mono">versions[].spec_groups</span> (por versão) ou em{" "}
                        <span className="font-mono">vehicle.spec_groups</span> (global).
                      </div>
                    </div>
                  ) : (
                    specGroups.map((g) => {
                      const opened = openSpecId === g.id;
                      const items = Array.isArray(g.items) ? g.items : [];

                      return (
                        <div key={g.id} className="border-b border-black/10 last:border-b-0">
                          <button
                            type="button"
                            onClick={() => setOpenSpecId((prev) => (prev === g.id ? null : g.id))}
                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-black/[0.02] transition"
                          >
                            <span className="text-[11px] font-semibold text-gray-800">{g.title}</span>
                            <span
                              className={`text-[16px] font-semibold text-gray-600 transition-transform duration-200 ${
                                opened ? "rotate-45" : "rotate-0"
                              }`}
                            >
                              +
                            </span>
                          </button>

                          <div className={`grid transition-all duration-300 ease-out ${opened ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                            <div className="overflow-hidden">
                              <div className="px-4 pb-4 text-[12px] text-gray-700">
                                {g.description ? (
                                  <div className="text-gray-600 mb-3 leading-relaxed">{g.description}</div>
                                ) : null}

                                {items.length > 0 ? (
                                  <div className="space-y-2">
                                    {items.map((it, idx) => (
                                      <div key={idx} className="flex gap-2">
                                        <span className="text-gray-400">•</span>
                                        <span>{it}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-gray-500">(Sem itens nesta seção.)</div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-black/10">
        <div className="max-w-[1200px] mx-auto px-6 py-3 flex items-center justify-between">
          <button
            onClick={() => {
              if (step === 1) router.push("/hyundai/veiculos");
              else if (step === 2) setStep(1);
              else if (step === 3) setStep(2);
            }}
            className="text-[12px] font-semibold text-gray-700 hover:underline"
          >
            ‹ {step === 1 ? "Alterar modelo" : step === 2 ? "Alterar versão" : "Alterar cor"}
          </button>

          <button
            onClick={() => {
              if (step === 1) setStep(2);
              else if (step === 2) setStep(3);
              else if (step === 3) setStep(4);
            }}
            className="px-4 py-2 text-[12px] font-semibold text-white rounded transition-transform active:scale-[0.99] disabled:opacity-60"
            style={{ background: "#0F3C66" }}
            disabled={(step === 1 && versions.length === 0) || (step === 2 && colorVariants.length === 0)}
            title={
              step === 1 && versions.length === 0
                ? "Cadastre versões no builder"
                : step === 2 && colorVariants.length === 0
                ? "Cadastre cores no builder"
                : ""
            }
          >
            {step === 1 ? "Escolha a cor" : step === 2 ? "Concluir" : step === 3 ? "Continuar" : "Avançar"}
          </button>
        </div>
      </div>
    </div>
  );
}