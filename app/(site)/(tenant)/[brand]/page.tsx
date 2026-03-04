// app/hyundai/veiculos/[slug]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type VersionItem = {
  id: string;
  title: string;
  subtitle: string;
  price: number;
  note?: string;
  heroLabel?: string;
};

type ColorVariant = {
  id: string;
  name: string;
  internal?: string;
  extraPrice?: number; // 0 ou >0
  swatch: string; // hex
  image_url: string; // ✅ PNG do carro nessa cor (fundo transparente)
};

type SpecGroup = {
  id: string;
  title: string; // ex: "ESTILO EXTERIOR"
  description?: string; // aparece ao expandir
  items?: string[];
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
  colors?: ColorVariant[] | null; // ✅ tem que estar como colors
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

export default function HyundaiVehicleSlugPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = useMemo(() => String(params?.slug || ""), [params]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [vehicle, setVehicle] = useState<VehicleRow | null>(null);

  // 1 = versão | 2 = cor
  const [step, setStep] = useState<1 | 2>(1);

  const [selectedVersionId, setSelectedVersionId] = useState<string>("");
  const [selectedColorId, setSelectedColorId] = useState<string>("");

  const [openSpecId, setOpenSpecId] = useState<string | null>(null);

  // animação imagem (troca por key)
  const [imgKey, setImgKey] = useState(0);

  useEffect(() => {
    if (!slug) return;
    let mounted = true;

    (async () => {
      setLoading(true);
      setErr(null);
      setVehicle(null);

      try {
const { data, error } = await supabase
  .from("vehicles")
  .select(`
    id,
    model_name,
    slug,
    image_url,
    brand,
    is_visible,
    price_start,
    versions,
    colors:exterior_colors,
    spec_groups,
    highlights
  `)
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

        const safeVersions = Array.isArray(v.versions) ? v.versions : [];
        const safeColors = Array.isArray(v.colors) ? v.colors : []; // ✅ AQUI: colors

        setVehicle(v);

        setSelectedVersionId(safeVersions[0]?.id || "");
        setSelectedColorId(safeColors[0]?.id || "");
        setImgKey((k) => k + 1);
      } catch (e: any) {
        if (!mounted) return;
        setErr(e?.message || "Erro ao carregar veículo.");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [slug]);

  const versions = useMemo<VersionItem[]>(
    () => (Array.isArray(vehicle?.versions) ? (vehicle!.versions as VersionItem[]) : []),
    [vehicle]
  );

const colorVariants = useMemo<ColorVariant[]>(
  () => (Array.isArray(vehicle?.colors) ? (vehicle?.colors as ColorVariant[]) : []),
  [vehicle?.colors]
);

  const specGroups = useMemo<SpecGroup[]>(
    () => (Array.isArray(vehicle?.spec_groups) ? (vehicle!.spec_groups as SpecGroup[]) : []),
    [vehicle]
  );

  const highlights = useMemo<string[]>(
    () => (Array.isArray(vehicle?.highlights) ? (vehicle!.highlights as string[]) : []),
    [vehicle]
  );

  const selectedVersion = useMemo(
    () => versions.find((v) => v.id === selectedVersionId) || versions[0] || null,
    [versions, selectedVersionId]
  );

  const selectedColor = useMemo(
    () => colorVariants.find((c) => c.id === selectedColorId) || colorVariants[0] || null,
    [colorVariants, selectedColorId]
  );

  // imagem atual (cor -> fallback vehicle.image_url)
  const currentImageUrl = useMemo(() => {
    return selectedColor?.image_url || vehicle?.image_url || null;
  }, [selectedColor?.image_url, vehicle?.image_url]);

  useEffect(() => {
    setImgKey((k) => k + 1);
  }, [selectedColorId]);

  const totalPrice = useMemo(() => {
    const base = selectedVersion?.price ?? vehicle?.price_start ?? 0;
    const extra = selectedColor?.extraPrice || 0;
    return base + extra;
  }, [selectedVersion?.price, vehicle?.price_start, selectedColor?.extraPrice]);

  const Title = vehicle?.model_name || "Hyundai";

  if (loading) {
    return (
      <div className="min-h-screen bg-white pt-24 px-6 text-sm font-bold text-gray-500">
        Carregando…
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

  // ✅ cor do fundo (tint) — se não tiver cor selecionada usa cinza neutro
  const heroTint = selectedColor?.swatch || "#d8d8d8";

  return (
    <div className="min-h-screen bg-[#f5f2ef]">
      <style jsx>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes imgPop {
          from {
            opacity: 0.25;
            transform: translateY(6px) scale(0.995);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .anim-fadeUp {
          animation: fadeUp 260ms ease-out both;
        }
        .anim-img {
          animation: imgPop 260ms ease-out both;
        }
        .hero-bg {
          position: relative;
          background: var(--tint);
          overflow: hidden;
        }
        .hero-bg::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            radial-gradient(120% 90% at 15% 25%, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.05) 55%, rgba(0,0,0,0.08) 100%),
            radial-gradient(90% 70% at 80% 35%, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.02) 55%, rgba(255,255,255,0.00) 100%);
          pointer-events: none;
        }
        .hero-bg::after {
          content: "";
          position: absolute;
          inset: 0;
          background-image:
            repeating-linear-gradient(
              45deg,
              rgba(255,255,255,0.08) 0px,
              rgba(255,255,255,0.08) 2px,
              rgba(255,255,255,0.00) 2px,
              rgba(255,255,255,0.00) 7px
            );
          opacity: 0.35;
          mix-blend-mode: overlay;
          pointer-events: none;
        }
      `}</style>

      {/* topo */}
      <div className="bg-white border-b border-black/5">
        <div className="max-w-[1200px] mx-auto px-6 pt-6 pb-3">
          <div className="text-[12px] text-gray-500">
            <span className="mr-1">🏠</span>
            <span className="hover:underline cursor-pointer" onClick={() => router.push("/hyundai")}>
              Início
            </span>{" "}
            · <span className="font-medium text-gray-700">Monte o seu</span>
          </div>

          {/* stepper */}
          <div className="mt-4">
            <div className="grid grid-cols-3 gap-8 items-end">
              <div>
                <div className="text-[11px] font-semibold text-gray-500">Passo 1</div>
                <div className="mt-1 flex items-center gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className={`text-[12px] font-semibold ${
                      step === 1 ? "text-[var(--hy)]" : "text-gray-700"
                    }`}
                    style={{ ["--hy" as any]: HY_BLUE }}
                  >
                    {Title}
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
                  <button
                    onClick={() => setStep(1)}
                    className="text-[12px] font-semibold text-gray-700 hover:underline"
                  >
                    Selecione a versão
                  </button>
                </div>
                <div className="mt-2 h-[3px] w-full bg-black/10">
                  <div
                    className="h-[3px] transition-all duration-300"
                    style={{
                      width: step === 1 ? "0%" : "100%",
                      background: HY_BLUE,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="text-[11px] font-semibold text-gray-500">Passo 3</div>
                <div className="mt-1 text-[12px] font-semibold text-gray-700">Selecione a cor</div>
                <div className="mt-2 h-[3px] w-full bg-black/10" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* conteúdo */}
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-8 items-start">
          {/* coluna esquerda */}
          <div className="col-span-12 lg:col-span-4 anim-fadeUp">
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
            ) : (
              <>
                <div className="text-[12px] text-gray-700 font-semibold mb-4">
                  {colorVariants.length} cores disponíveis
                </div>

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
                          onClick={() => setSelectedColorId(c.id)}
                          className={`text-left bg-white border transition-all duration-200 ${
                            active
                              ? "border-[#0F3C66] ring-2 ring-[#0F3C66]/10"
                              : "border-black/10 hover:border-black/20"
                          }`}
                          style={{ borderRadius: 0 }}
                          title={c.image_url ? "Trocar cor (troca imagem)" : "Cor sem imagem"}
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

                          <div
                            className="h-[86px] border-t border-black/10"
                            style={{ background: c.swatch || "#ddd" }}
                          />
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          {/* coluna direita */}
          <div className="col-span-12 lg:col-span-8 anim-fadeUp">
            <div className="text-[14px] text-gray-700">
              <span className="font-semibold">{Title}</span>
              {selectedVersion?.title ? (
                <>
                  <span className="mx-2">•</span>
                  <span className="font-semibold">{selectedVersion.title}</span>
                </>
              ) : null}
              {step === 2 && selectedColor?.name ? (
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
              <div className="h-[280px] hero-bg relative" style={{ ["--tint" as any]: heroTint }}>
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
                      className="w-[86%] h-[86%] object-contain anim-img"
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
                    <div className="px-4 py-4 text-sm text-gray-500">Nenhuma seção cadastrada no builder.</div>
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

                          <div
                            className={`grid transition-all duration-300 ease-out ${
                              opened ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                            }`}
                          >
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

      {/* barra inferior */}
      <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-black/10">
        <div className="max-w-[1200px] mx-auto px-6 py-3 flex items-center justify-between">
          <button
            onClick={() => (step === 1 ? router.push("/hyundai/veiculos") : setStep(1))}
            className="text-[12px] font-semibold text-gray-700 hover:underline"
          >
            ‹ {step === 1 ? "Alterar modelo" : "Alterar versão"}
          </button>

          <button
            onClick={() => {
              if (step === 1) setStep(2);
              else window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="px-4 py-2 text-[12px] font-semibold text-white rounded transition-transform active:scale-[0.99] disabled:opacity-60"
            style={{ background: "#0F3C66" }}
            disabled={step === 1 && versions.length === 0}
            title={step === 1 && versions.length === 0 ? "Cadastre versões no builder" : ""}
          >
            {step === 1 ? "Escolha a cor" : "Concluir"}
          </button>
        </div>
      </div>
    </div>
  );
}