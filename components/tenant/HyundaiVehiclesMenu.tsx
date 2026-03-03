"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Props = {
  onClose?: () => void;
};

type VehicleRow = {
  id: string | number;
  model_name: string;
  slug: string;
  image_url?: string | null;
  is_visible?: boolean | null;
  brand?: string | null;
};

const HY_BLUE = "#00A3C8";

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

type Tab = "TODOS" | "SUV" | "HATCHBACK" | "SEDAN" | "UTILITARIO";

export default function HyundaiVehiclesMenu({ onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<VehicleRow[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<Tab>("TODOS");

  const PAGE_SIZE = 6;
  const [page, setPage] = useState(0);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      setErrorMsg(null);

      try {
        const BRAND = "hyundai";

        const { data, error } = await supabase
          .from("vehicles")
          .select("id, model_name, slug, image_url, brand, is_visible")
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

  useEffect(() => {
    setPage(0);
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

  // ✅ destaque sempre pega o primeiro da LISTA FILTRADA (fica mais coerente com a aba)
  const featured = useMemo(() => filteredAll[0] || null, [filteredAll]);

  const totalPages = useMemo(() => {
    const n = filteredAll.length;
    return Math.max(1, Math.ceil(n / PAGE_SIZE));
  }, [filteredAll.length]);

  const safePage = Math.min(page, totalPages - 1);

  const gridItems = useMemo(() => {
    const start = safePage * PAGE_SIZE;
    return filteredAll.slice(start, start + PAGE_SIZE);
  }, [filteredAll, safePage]);

  const goPrev = () => setPage((p) => (p <= 0 ? totalPages - 1 : p - 1));
  const goNext = () => setPage((p) => (p >= totalPages - 1 ? 0 : p + 1));

  const renderPager = () => {
    const dots = Math.min(3, totalPages);
    const activeIndex = Math.min(safePage, dots - 1);

    return (
      <div className="mt-9 flex items-center justify-center gap-3">
        {Array.from({ length: dots }).map((_, i) => {
          const active = i === activeIndex;
          if (active) {
            return (
              <span
                key={i}
                className="h-[7px] w-[68px] rounded-full bg-gray-600"
                aria-hidden="true"
              />
            );
          }
          return (
            <span
              key={i}
              className="h-[7px] w-[7px] rounded-full bg-gray-400"
              aria-hidden="true"
            />
          );
        })}
      </div>
    );
  };

  if (loading) return <div className="p-4 text-xs font-bold text-slate-500">Carregando...</div>;
  if (errorMsg) return <div className="p-4 text-xs font-bold text-red-600">{errorMsg}</div>;

  if (list.length === 0)
    return (
      <div className="p-4 text-xs font-bold text-slate-500">
        Nenhum veículo visível no banco.
        <div className="mt-1 text-[11px] font-medium text-slate-400">
          Verifique se está com <b>brand="hyundai"</b> e <b>is_visible=true</b>.
        </div>
      </div>
    );

  return (
    <div className="bg-white">
      {/* ✅ Container fixo e centralizado (faz ficar “igual print”) */}
      <div className="mx-auto w-full max-w-[1400px] px-10 py-8">
        <div className="flex items-start">
          {/* ===================== ESQUERDA (destaque) ===================== */}
          <div className="w-[62%] pr-10">
            {featured && (
              <Link
                href={`/admin/hyundai/veiculos/${featured.slug}`} // ✅ rota nova
                onClick={() => onClose?.()}
                className="block select-none"
              >
                {/* título grande */}
                <div className="text-[46px] leading-none font-medium text-gray-900 tracking-tight mt-1">
                  {featured.model_name}
                </div>

                {/* carro grande */}
                <div className="mt-6 w-full h-[395px] flex items-center">
                  {featured.image_url ? (
                    <img
                      src={featured.image_url}
                      alt={featured.model_name}
                      className="w-[92%] h-full object-contain"
                      draggable={false}
                    />
                  ) : null}
                </div>

                {/* specs (você preenche depois) */}
                <div className="mt-10 grid grid-cols-4 gap-14">
                  <div>
                    <div className="text-[11px] text-gray-500">Motor</div>
                    <div className="mt-2 text-[15px] font-semibold text-gray-900 leading-snug">—</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-500">Transmissão</div>
                    <div className="mt-2 text-[15px] font-semibold text-gray-900 leading-snug">—</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-500">Potência máxima</div>
                    <div className="mt-2 text-[15px] font-semibold text-gray-900 leading-snug">—</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-500">Torque máximo</div>
                    <div className="mt-2 text-[15px] font-semibold text-gray-900 leading-snug">—</div>
                  </div>
                </div>
              </Link>
            )}
          </div>

          {/* ===================== DIREITA (tabs + grid) ===================== */}
          <div className="w-[38%] pl-2">
            {/* Tabs: mais “secas”, com underline fino */}
            <div className="flex items-center gap-12 text-[12px] uppercase tracking-wide text-gray-800 mt-2">
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
                      <span
                        className="absolute left-0 right-0 -bottom-[2px] h-[2px]"
                        style={{ backgroundColor: HY_BLUE }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Grid + setas (setas agora ficam no MEIO do bloco) */}
            <div className="relative mt-10">
              <button
                type="button"
                onClick={goPrev}
                className="absolute -left-12 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"
                aria-label="Anterior"
              >
                <span className="text-4xl leading-none">‹</span>
              </button>

              <button
                type="button"
                onClick={goNext}
                className="absolute -right-12 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"
                aria-label="Próximo"
              >
                <span className="text-4xl leading-none">›</span>
              </button>

              {/* cards 3x2 com espaçamento mais parecido */}
              <div className="grid grid-cols-3 gap-x-14 gap-y-16">
                {gridItems.map((v) => (
<Link
  key={String(v.id)}
  href={`/hyundai/veiculos/${v.slug}`}
  onClick={() => onClose?.()}
  className="group text-center"
>
                    <div className="h-[112px] flex items-center justify-center">
                      {v.image_url ? (
                        <img
                          src={v.image_url}
                          alt={v.model_name}
                          className="w-full h-full object-contain"
                          draggable={false}
                        />
                      ) : null}
                    </div>

                    <div className="mt-4 text-[15px] font-medium text-gray-900 group-hover:opacity-80">
                      {v.model_name}
                    </div>
                  </Link>
                ))}
              </div>

              {renderPager()}
            </div>

            {/* se quiser “igual print”, pode REMOVER esse link abaixo */}
            <div className="mt-8">
              <Link
                href="/hyundai/veiculos"
                onClick={() => onClose?.()}
                className="text-sm font-semibold"
                style={{ color: HY_BLUE }}
              >
                Ver todos os veículos →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}