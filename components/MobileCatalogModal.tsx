"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, X, ChevronRight, Search } from "lucide-react";

// --- CONFIG DA ORDEM / CATEGORIAS ---
const MENU_ORDER = [
  { label: "Elétricos", dbKeywords: ["eletrico", "elétrico", "ev", "bolt"] },
  { label: "SUVs", dbKeywords: ["suv", "tracker", "equinox", "trailblazer", "spin"] },
  { label: "Picapes", dbKeywords: ["picape", "pickup", "montana", "s10", "silverado"] },
  { label: "Hatches e Sedans", dbKeywords: ["hatch", "sedan", "onix", "cruze", "compacto"] },
  { label: "Esportivos", dbKeywords: ["esportivo", "camaro", "corvette", "ss"] },
  { label: "Seminovos", dbKeywords: [] },
];

// =========================
// (mesmos FIXOS que você já usa)
// =========================
const ELECTRIC_LP_CARDS = [
  {
    title: "Captiva EV",
    href: "/eletricos/captiva-ev",
    coverImage:
      "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/eletricos/222.png",
  },
  {
    title: "Equinox EV",
    href: "/eletricos/equinox-ev",
    coverImage:
      "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/eletricos/Screenshot_1.png",
  },
  {
    title: "Blazer EV RS",
    href: "/eletricos/blazer-ev-rs",
    coverImage:
      "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/eletricos/22/branco.png",
  },
];

const SPORT_LP_CARDS = [
  {
    title: "Camaro SS Collection",
    href: "/premium/camaro",
    coverImage:
      "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/esportivos/camaro-ss/capa/1769189507758_kvtuh.avif",
  },
];

const SUV_LP_CARDS = [
  {
    title: "Equinox Turbo",
    href: "/suvs/equinox-turbo",
    coverImage:
      "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/suv/Equinox-turbo/Verde%20Cacti.png",
  },
  {
    title: "Trailblazer",
    href: "/suvs/trailblazer",
    coverImage:
      "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/suv/Trailblazer/Preto%20Ouro%20Negro.png",
  },
  {
    title: "Spin",
    href: "/suvs/spin",
    coverImage:
      "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/suv/spin/Branco%20Summit.png",
  },
];

const PICKUP_LP_CARDS = [
  {
    title: "S10",
    href: "/picapes/s10",
    coverImage:
      "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/s10/Branco%20Summit.png",
  },
  {
    title: "Silverado",
    href: "/picapes/silverado",
    coverImage:
      "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/caminhonete/silverado/ver.png",
  },
];

type Step = "categories" | "cars";

interface Props {
  open: boolean;
  onClose: () => void;
}

const formatBRL0 = (val: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(val);

const norm = (s: string) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim();

function FixedGrid({
  cards,
  onNavigate,
}: {
  cards: Array<{ title: string; href: string; coverImage: string }>;
  onNavigate: () => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {cards.map((c) => (
        <Link
          key={c.href}
          href={c.href}
          onClick={onNavigate}
          className="block text-center"
        >
          <div className="h-24 bg-gray-50 rounded-xl mb-2 flex items-center justify-center overflow-hidden">
            <img src={c.coverImage} alt={c.title} className="w-full h-full object-contain p-2" />
          </div>
          <p className="text-[11px] font-black uppercase text-slate-900 leading-tight">{c.title}</p>
          <p className="text-[10px] font-bold text-blue-600 mt-1">Saiba mais</p>
        </Link>
      ))}
    </div>
  );
}

export default function MobileCatalogModal({ open, onClose }: Props) {
  const [step, setStep] = useState<Step>("categories");
  const [selectedLabel, setSelectedLabel] = useState<string>("Elétricos");

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // busca (opcional) dentro da lista de carros
  const [search, setSearch] = useState("");

  // reset quando abre/fecha
  useEffect(() => {
    if (!open) {
      setStep("categories");
      setSelectedLabel("Elétricos");
      setSearch("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    let mounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: vecs, error } = await supabase
          .from("vehicles")
          .select("*, categories(name)")
          .eq("is_visible", true)
          .order("price_start", { ascending: true });

        if (error) throw error;
        if (mounted) setVehicles(vecs || []);
      } catch (e) {
        console.error("Erro ao buscar vehicles:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      mounted = false;
    };
  }, [open]);

  const fixedNames = useMemo(() => {
    return {
      "Elétricos": ELECTRIC_LP_CARDS.map((c) => norm(c.title)),
      "Esportivos": SPORT_LP_CARDS.map((c) => norm(c.title)),
      "SUVs": SUV_LP_CARDS.map((c) => norm(c.title)),
      "Picapes": PICKUP_LP_CARDS.map((c) => norm(c.title)),
    } as Record<string, string[]>;
  }, []);

  const filteredVehicles = useMemo(() => {
    if (selectedLabel === "Seminovos") return [];

    const config = MENU_ORDER.find((c) => c.label === selectedLabel);
    if (!config) return [];

    const fixedSet = new Set(fixedNames[selectedLabel] || []);
    const term = search.trim().toLowerCase();

    return vehicles
      .filter((v) => {
        const searchString = `${v.categories?.name || ""} ${v.model_name}`.toLowerCase();
        const matchesCategory = config.dbKeywords.some((k) => searchString.includes(k));
        const matchesSearch = !term || v.model_name?.toLowerCase().includes(term);
        return matchesCategory && matchesSearch;
      })
      .filter((v) => {
        const name = norm(v.model_name);
        if (fixedSet.has(name)) return false;
        for (const fx of fixedSet) {
          if (fx && (name.includes(fx) || fx.includes(name))) return false;
        }
        return true;
      });
  }, [vehicles, selectedLabel, fixedNames, search]);

  const fixedCardsForSelected = useMemo(() => {
    if (selectedLabel === "Elétricos") return ELECTRIC_LP_CARDS;
    if (selectedLabel === "SUVs") return SUV_LP_CARDS;
    if (selectedLabel === "Picapes") return PICKUP_LP_CARDS;
    if (selectedLabel === "Esportivos") return SPORT_LP_CARDS;
    return [];
  }, [selectedLabel]);

  const goCategory = (label: string) => {
    setSelectedLabel(label);
    setStep("cars");
    setSearch("");
  };

  const closeAndNavigate = () => {
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-white">
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
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Catálogo
            </p>
            <p className="text-sm font-black text-slate-900 leading-tight">
              {step === "categories" ? "Categorias" : selectedLabel}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-slate-100"
          aria-label="Fechar"
        >
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="h-[calc(100vh-56px)] overflow-y-auto">
        {step === "categories" ? (
          <div className="p-4">
            <div className="grid grid-cols-1 gap-3">
              {MENU_ORDER.map((item) => (
                <button
                  key={item.label}
                  onClick={() => goCategory(item.label)}
                  className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white transition-colors"
                >
                  <div className="text-left">
                    <p className="text-xs font-black uppercase text-slate-900">
                      {item.label}
                    </p>
                    <p className="text-[11px] text-slate-500 font-bold mt-1">
                      Toque para ver modelos
                    </p>
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
                placeholder={`Buscar em ${selectedLabel}...`}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium outline-none focus:border-black"
              />
            </div>

            {selectedLabel === "Seminovos" ? (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center">
                <p className="text-sm font-black uppercase text-slate-900">Seminovos</p>
                <p className="text-xs text-slate-500 font-bold mt-2">
                  Qualidade certificada Chevrolet
                </p>
                <Link
                  href="/vendedor/seminovos"
                  onClick={closeAndNavigate}
                  className="mt-4 inline-flex px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-black uppercase"
                >
                  Consultar
                </Link>
              </div>
            ) : (
              <>
                {/* FIXOS */}
                {fixedCardsForSelected.length > 0 && (
                  <FixedGrid cards={fixedCardsForSelected as any} onNavigate={closeAndNavigate} />
                )}

                {/* DB */}
                <div className="pt-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    Modelos
                  </p>

                  {loading ? (
                    <div className="grid grid-cols-2 gap-4 animate-pulse">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-28 bg-slate-100 rounded-xl" />
                      ))}
                    </div>
                  ) : filteredVehicles.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-sm font-bold">
                      Nenhum modelo encontrado.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {filteredVehicles.map((car) => (
                        <Link
                          key={car.id}
                          href={`/configurador?id=${car.id}`}
                          onClick={closeAndNavigate}
                          className="block text-center"
                        >
                          <div className="h-24 bg-gray-50 rounded-xl mb-2 flex items-center justify-center overflow-hidden">
                            <img
                              src={(car.image_url || "").trim()}
                              alt={car.model_name}
                              className="w-full h-full object-contain p-2"
                            />
                          </div>
                          <p className="text-[11px] font-black uppercase text-slate-900 leading-tight">
                            {car.model_name}
                          </p>
                          <p className="text-[10px] text-slate-500 font-bold mt-1">
                            A partir de {formatBRL0(car.price_start)}
                          </p>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}