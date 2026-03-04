"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, X, ChevronRight, Search } from "lucide-react";

/**
 * Hyundai Mobile Catalog Modal
 * - Modal fullscreen para mobile
 * - Step: categories -> cars
 * - Filtra SOMENTE brand="hyundai"
 * - Navega para /hyundai/veiculos/[slug]
 */

const MENU_ORDER = [
  { label: "SUV", key: "SUV" },
  { label: "HATCHBACK", key: "HATCHBACK" },
  { label: "SEDAN", key: "SEDAN" },
  { label: "UTILITARIO", key: "UTILITARIO" },
  { label: "TODOS", key: "TODOS" },
] as const;

type Step = "categories" | "cars";
type Tab = (typeof MENU_ORDER)[number]["key"];

interface Props {
  open: boolean;
  onClose: () => void;
}

type VehicleRow = {
  id: string | number;
  model_name: string;
  slug: string;
  image_url?: string | null;
  catalog_cover_url?: string | null;
  brand?: string | null;
  is_visible?: boolean | null;
};

const BRAND = "hyundai";
const HY_VEHICLE_PUBLIC_BASE = "/hyundai/veiculos";
const HY_BLUE = "#003da5";

const norm = (s: string) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim();

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

export default function MobileCatalogModalHyundai({ open, onClose }: Props) {
  const [step, setStep] = useState<Step>("categories");
  const [selectedTab, setSelectedTab] = useState<Tab>("SUV");

  const [vehicles, setVehicles] = useState<VehicleRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  // ✅ FIX SCROLL JUMP: scroll container + trava scroll do body (iOS/Android)
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // reset quando abre/fecha
  useEffect(() => {
    if (!open) {
      setStep("categories");
      setSelectedTab("SUV"); // ✅ Hyundai: abre já nos SUVs
      setSearch("");
    }
  }, [open]);

  // trava scroll do body quando modal abre
  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.documentElement.style.overflow;
    const prevOverscroll = (document.documentElement.style as any).overscrollBehaviorY;

    document.documentElement.style.overflow = "hidden";
    (document.documentElement.style as any).overscrollBehaviorY = "contain";

    const prevent = (e: TouchEvent) => {
      if (!scrollRef.current) return;
      if (!scrollRef.current.contains(e.target as Node)) e.preventDefault();
    };
    document.addEventListener("touchmove", prevent, { passive: false });

    return () => {
      document.documentElement.style.overflow = prevOverflow;
      (document.documentElement.style as any).overscrollBehaviorY = prevOverscroll || "";
      document.removeEventListener("touchmove", prevent as any);
    };
  }, [open]);

  // sempre que muda step/categoria, força scroll pro topo
  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    });
  }, [open, step, selectedTab]);

  // fetch vehicles Hyundai
  useEffect(() => {
    if (!open) return;

    let mounted = true;

    const fetchData = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("vehicles")
          .select("id, model_name, slug, image_url, catalog_cover_url, brand, is_visible")
          .eq("is_visible", true)
          .eq("brand", BRAND)
          .order("model_name", { ascending: true });

        if (error) throw error;
        if (mounted) setVehicles((data as VehicleRow[]) || []);
      } catch (e) {
        console.error("Erro ao buscar vehicles Hyundai:", e);
        if (mounted) setVehicles([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      mounted = false;
    };
  }, [open]);

  const filteredVehicles = useMemo(() => {
    const q = norm(search);

    const base = vehicles.filter((v) => {
      const catOk = selectedTab === "TODOS" ? true : guessCategory(v.model_name) === selectedTab;
      if (!catOk) return false;
      if (!q) return true;

      const hay = `${norm(v.model_name)} ${norm(v.slug)}`;
      return hay.includes(q);
    });

    // ✅ Hyundai: prioriza SUVs no "TODOS" também (ordem mais agradável)
    if (selectedTab === "TODOS") {
      const suvs = base.filter((v) => guessCategory(v.model_name) === "SUV");
      const rest = base.filter((v) => guessCategory(v.model_name) !== "SUV");
      return [...suvs, ...rest];
    }

    return base;
  }, [vehicles, selectedTab, search]);

  const goCategory = (tab: Tab) => {
    setSelectedTab(tab);
    setStep("cars");
    setSearch("");
  };

  const closeAndNavigate = () => {
    onClose();
  };

  const getCardImage = (v: VehicleRow) => {
    const cover = safeImgUrl(v.catalog_cover_url);
    const main = safeImgUrl(v.image_url);
    return cover || main || "";
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-white" style={{ WebkitOverflowScrolling: "touch" }}>
      {/* Top bar */}
      <div className="h-14 border-b border-slate-100 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          {step === "cars" ? (
            <button
              onClick={() => setStep("categories")}
              className="p-2 rounded-full hover:bg-slate-100"
              aria-label="Voltar"
            >
              <ArrowLeft size={18} />
            </button>
          ) : (
            <div className="w-10" />
          )}

          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Catálogo</p>
            <p className="text-sm font-black text-slate-900 leading-tight">
              {step === "categories" ? "Categorias" : selectedTab}
            </p>
          </div>
        </div>

        <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100" aria-label="Fechar">
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div ref={scrollRef} className="h-[calc(100dvh-56px)] overflow-y-auto overscroll-contain touch-pan-y">
        {step === "categories" ? (
          <div className="p-4">
            <div className="grid grid-cols-1 gap-3">
              {MENU_ORDER.map((item) => (
                <button
                  key={item.key}
                  onClick={() => goCategory(item.key)}
                  className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white transition-colors"
                >
                  <div className="text-left">
                    <p className="text-xs font-black uppercase text-slate-900">{item.label}</p>
                    <p className="text-[11px] text-slate-500 font-bold mt-1">Toque para ver modelos</p>
                  </div>
                  <ChevronRight size={18} className="text-slate-400" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Busca dentro da categoria */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Buscar em ${selectedTab}...`}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium outline-none focus:border-black"
              />
            </div>

            <div className="pt-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Modelos</p>

              {loading ? (
                <div className="grid grid-cols-2 gap-4 animate-pulse">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-28 bg-slate-100 rounded-xl" />
                  ))}
                </div>
              ) : filteredVehicles.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm font-bold">Nenhum modelo encontrado.</div>
              ) : (
                <div className="grid grid-cols-2 gap-4 pb-10">
                  {filteredVehicles.map((car) => (
                    <Link
                      key={String(car.id)}
                      href={`${HY_VEHICLE_PUBLIC_BASE}/${car.slug}`}
                      onClick={closeAndNavigate}
                      className="block text-center"
                    >
                      <div className="h-24 bg-gray-50 rounded-xl mb-2 flex items-center justify-center overflow-hidden">
                        {getCardImage(car) ? (
                          <img
                            src={getCardImage(car)}
                            alt={car.model_name}
                            className="w-full h-full object-contain p-2"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full" />
                        )}
                      </div>

                      <p className="text-[11px] font-black uppercase text-slate-900 leading-tight">
                        {car.model_name}
                      </p>
                      <p className="text-[10px] font-bold mt-1" style={{ color: HY_BLUE }}>
                        Ver detalhes
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}