"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type Props = { onClose?: () => void };

type Tab = "TODOS" | "SUV" | "HATCHBACK" | "SEDAN" | "UTILITARIO";

type VehicleRow = {
  id: string | number;
  model_name: string;
  slug: string;

  image_url?: string | null;
  catalog_cover_url?: string | null;

  motor?: string | null;
  transmissao?: string | null;
  potencia_maxima?: string | null;
  torque_maximo?: string | null;

  is_visible?: boolean | null;
  brand?: string | null;
};

const HY_BLUE = "#00A3C8";
const HY_VEHICLE_PUBLIC_BASE = "/hyundai/veiculos";

/* ====== helpers ====== */
function norm(s: string) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function guessCategory(modelName: string): "SUV" | "HATCHBACK" | "SEDAN" | "UTILITARIO" {
  const m = norm(modelName);

  if (m.includes("hb20s")) return "SEDAN";
  if (m.includes("hb20")) return "HATCHBACK";
  if (m.includes("hr")) return "UTILITARIO";

  if (
    m.includes("tucson") ||
    m.includes("creta") ||
    m.includes("kona") ||
    m.includes("palisade") ||
    m.includes("ioniq")
  ) {
    return "SUV";
  }
  return "SUV";
}

/** ✅ garante URL “usável” (remove espaços, encode e trim) */
function safeImgUrl(url: string | null | undefined) {
  const u = String(url || "").trim();
  if (!u) return "";
  const noSpaces = u.replace(/\s/g, "%20");
  try {
    return encodeURI(noSpaces);
  } catch {
    return noSpaces;
  }
}

function SpecItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div className="text-[11px] text-gray-500">{label}</div>
      <div className="mt-2 text-[15px] font-semibold text-gray-900 leading-snug">
        {value && String(value).trim().length > 0 ? value : "—"}
      </div>
    </div>
  );
}

export default function HyundaiVehiclesMenu({ onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<VehicleRow[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<Tab>("TODOS");

  const PAGE_SIZE = 6;
  const [page, setPage] = useState(0);

  const [imgFailed, setImgFailed] = useState<Record<string, boolean>>({});
  const [hoverId, setHoverId] = useState<string | number | null>(null);
  const [tabAnimKey, setTabAnimKey] = useState(0);

  // ✅ debounce pequeno pra evitar flicker de hover rápido
  const hoverTRef = useRef<number | null>(null);

  const setHoverSafe = (id: string | number) => {
    if (hoverTRef.current) window.clearTimeout(hoverTRef.current);
    hoverTRef.current = window.setTimeout(() => setHoverId(id), 30);
  };

  useEffect(() => {
    return () => {
      if (hoverTRef.current) window.clearTimeout(hoverTRef.current);
      hoverTRef.current = null;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      setErrorMsg(null);

      try {
        const BRAND = "hyundai";

        const { data, error } = await supabase
          .from("vehicles")
          .select(
            "id, model_name, slug, image_url, catalog_cover_url, motor, transmissao, potencia_maxima, torque_maximo, brand, is_visible"
          )
          .eq("is_visible", true)
          .eq("brand", BRAND)
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (!mounted) return;

        setVehicles((data as VehicleRow[]) || []);
      } catch (e: any) {
        if (!mounted) return;
        setErrorMsg(e?.message || "Falha ao carregar veículos.");
        setVehicles([]);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // ✅ ao trocar tab, reset página e anima
  useEffect(() => {
    setPage(0);
    setTabAnimKey((k) => k + 1);
    setHoverId(null);
  }, [activeTab]);

  const list = useMemo(() => vehicles || [], [vehicles]);

  const counts = useMemo(() => {
    const c = { TODOS: 0, SUV: 0, HATCHBACK: 0, SEDAN: 0, UTILITARIO: 0 };
    for (const v of list) {
      c.TODOS += 1;
      const g = guessCategory(v.model_name);
      c[g] += 1;
    }
    return c;
  }, [list]);

  const filteredAll = useMemo(() => {
    if (activeTab === "TODOS") return list;
    return list.filter((v) => guessCategory(v.model_name) === activeTab);
  }, [list, activeTab]);

  const totalPages = useMemo(() => {
    const n = filteredAll.length;
    return Math.max(1, Math.ceil(n / PAGE_SIZE));
  }, [filteredAll.length]);

  const safePage = Math.min(page, totalPages - 1);

  const gridItems = useMemo(() => {
    const start = safePage * PAGE_SIZE;
    return filteredAll.slice(start, start + PAGE_SIZE);
  }, [filteredAll, safePage]);

  // ✅ setas funcionando bem: sempre usa o totalPages atual
  const goPrev = () => setPage((p) => (p - 1 + totalPages) % totalPages);
  const goNext = () => setPage((p) => (p + 1) % totalPages);

  const renderPager = () => {
    const dots = Math.min(3, totalPages);
    const activeIndex = Math.min(safePage, dots - 1);

    return (
      <div className="mt-8 flex items-center justify-center gap-3">
        {Array.from({ length: dots }).map((_, i) => {
          const active = i === activeIndex;
          return active ? (
            <span key={i} className="h-[7px] w-[64px] rounded-full bg-gray-700" aria-hidden="true" />
          ) : (
            <span key={i} className="h-[7px] w-[7px] rounded-full bg-gray-400" aria-hidden="true" />
          );
        })}
      </div>
    );
  };

  /** ✅ imagem do menu com fallback: catalog_cover_url -> image_url */
  const getMenuImage = (v: VehicleRow) => {
    const key = String(v.id);
    const cover = safeImgUrl(v.catalog_cover_url);
    const main = safeImgUrl(v.image_url);

    if (imgFailed[key]) return main || cover || "";
    return cover || main || "";
  };

  const onImgError = (v: VehicleRow) => {
    const key = String(v.id);
    setImgFailed((prev) => ({ ...prev, [key]: true }));
  };

  // ✅ featured com prioridade SUV:
  // 1) hover (se existir)
  // 2) primeiro SUV (no conjunto filtrado atual)
  // 3) fallback: primeiro item
  const featured = useMemo(() => {
    if (hoverId != null) {
      const found = filteredAll.find((v) => String(v.id) === String(hoverId));
      if (found) return found;
    }

    const firstSUV = filteredAll.find((v) => guessCategory(v.model_name) === "SUV");
    return firstSUV || filteredAll[0] || null;
  }, [filteredAll, hoverId]);

  // ✅ ao trocar página, se o featured atual não estiver mais no filteredAll, mantém a regra de prioridade SUV
  useEffect(() => {
    if (!featured) {
      setHoverId(null);
      return;
    }
    if (hoverId != null) {
      const ok = filteredAll.some((v) => String(v.id) === String(hoverId));
      if (!ok) setHoverId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safePage, filteredAll.length]);

  if (loading) return <div className="p-4 text-xs font-bold text-slate-500"></div>;
  if (errorMsg) return <div className="p-4 text-xs font-bold text-red-600">{errorMsg}</div>;

  if (list.length === 0) {
    return (
      <div className="p-4 text-xs font-bold text-slate-500">
        Nenhum veículo visível no banco.
        <div className="mt-1 text-[11px] font-medium text-slate-400">
          Verifique se está com <b>brand="hyundai"</b> e <b>is_visible=true</b>.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <style jsx global>{`
        @keyframes hyTabIn {
          from {
            opacity: 0;
            transform: translateX(10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .hy-tab-anim {
          animation: hyTabIn 220ms ease-out both;
        }
        .hy-card {
          border-radius: 18px;
          overflow: hidden;
          border: 1px solid rgba(229, 231, 235, 1);
          background: white;
          box-shadow: 0 10px 26px rgba(0, 0, 0, 0.06);
        }
      `}</style>

      <div className="mx-auto w-full max-w-[1280px] px-8 py-8">
        <div className="flex items-start">
          {/* ESQUERDA */}
          <div className="w-[58%] pr-10">
            {featured && (
              <Link
                href={`${HY_VEHICLE_PUBLIC_BASE}/${featured.slug}`}
                onClick={() => onClose?.()}
                className="block select-none"
              >
                <div className="text-[42px] leading-none font-medium text-gray-900 tracking-tight mt-1">
                  {featured.model_name}
                </div>

                <div className="mt-6 w-full h-[360px] flex items-center hy-card bg-gray-50">
                  {/* ✅ removido indicador/placeholder "Sem imagem" */}
                  {getMenuImage(featured) ? (
                    <img
                      src={getMenuImage(featured)}
                      alt={featured.model_name}
                      className="w-full h-full object-contain p-4"
                      draggable={false}
                      onError={() => onImgError(featured)}
                    />
                  ) : (
                    <div className="w-full h-full" />
                  )}
                </div>

                <div className="mt-10 grid grid-cols-4 gap-10">
                  <SpecItem label="Motor" value={featured.motor} />
                  <SpecItem label="Transmissão" value={featured.transmissao} />
                  <SpecItem label="Potência máxima" value={featured.potencia_maxima} />
                  <SpecItem label="Torque máximo" value={featured.torque_maximo} />
                </div>
              </Link>
            )}
          </div>

          {/* DIREITA */}
          <div className="w-[42%] pl-2">
            <div className="flex items-center gap-10 text-[12px] uppercase tracking-wide text-gray-800 mt-2">
              {(["TODOS", "SUV", "HATCHBACK", "SEDAN", "UTILITARIO"] as const).map((t) => {
                const active = activeTab === t;
                return (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    className={`relative pb-2 font-medium ${active ? "text-gray-900" : "text-gray-800"}`}
                  >
                    {t} <span className="text-gray-500 font-normal">({(counts as any)[t] || 0})</span>
                    {active && (
                      <span className="absolute left-0 right-0 -bottom-[2px] h-[2px]" style={{ backgroundColor: HY_BLUE }} />
                    )}
                  </button>
                );
              })}
            </div>

            <div key={tabAnimKey} className="relative mt-9 hy-tab-anim">
              <button
                type="button"
                onClick={goPrev}
                className="absolute -left-11 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 select-none"
                aria-label="Anterior"
              >
                <span className="text-4xl leading-none">‹</span>
              </button>

              <button
                type="button"
                onClick={goNext}
                className="absolute -right-11 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 select-none"
                aria-label="Próximo"
              >
                <span className="text-4xl leading-none">›</span>
              </button>

              <div className="grid grid-cols-3 gap-x-12 gap-y-14">
                {gridItems.map((v) => {
                  const img = getMenuImage(v);
                  const isActive = featured && String(featured.id) === String(v.id);

                  return (
                    <Link
                      key={String(v.id)}
                      href={`${HY_VEHICLE_PUBLIC_BASE}/${v.slug}`}
                      onClick={() => onClose?.()}
                      onMouseEnter={() => setHoverSafe(v.id)}
                      className={`group text-center transition-transform duration-200 ${
                        isActive ? "scale-[1.02]" : "hover:scale-[1.02]"
                      }`}
                    >
                      <div
                        className={`h-[104px] flex items-center justify-center rounded-2xl border transition-colors ${
                          isActive ? "border-cyan-300 bg-cyan-50" : "border-gray-200 bg-white group-hover:bg-gray-50"
                        }`}
                      >
                        {img ? (
                          <img
                            src={img}
                            alt={v.model_name}
                            className="w-full h-full object-contain p-2"
                            draggable={false}
                            onError={() => onImgError(v)}
                          />
                        ) : (
                          <div className="w-full h-full" />
                        )}
                      </div>

                      <div className={`mt-4 text-[14px] font-medium transition-opacity ${isActive ? "text-gray-900" : "text-gray-900 group-hover:opacity-80"}`}>
                        {v.model_name}
                      </div>
                    </Link>
                  );
                })}
              </div>

              {renderPager()}
            </div>

            {/* ✅ removido o “Ver todos os veículos →” / indicador extra (você tinha apagado a seção no final) */}
          </div>
        </div>
      </div>
    </div>
  );
}