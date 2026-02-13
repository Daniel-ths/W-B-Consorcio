"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

// =========================
// ✅ CARDS FIXOS (LPs)
// =========================
type FixedCard = {
  title: string;
  href: string;
  coverImage: string;
  priceStart?: number;
};

// Elétricos (LPs)
const ELECTRIC_LP_CARDS: FixedCard[] = [
  {
    title: "Captiva EV",
    href: "/eletricos/captiva-ev",
    coverImage: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/eletricos/222.png",
  },
  {
    title: "Equinox EV",
    href: "/eletricos/equinox-ev",
    coverImage: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/eletricos/Screenshot_1.png",
  },
  {
    title: "Blazer EV RS",
    href: "/eletricos/blazer-ev-rs",
    coverImage: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/eletricos/22/branco.png",
  },
];

// SUVs (LPs) — NOVOS
const SUV_LP_CARDS: FixedCard[] = [
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

// Picapes (LPs) — NOVOS
const PICKUP_LP_CARDS: FixedCard[] = [
  {
    title: "S10",
    href: "/picapes/s10",
    coverImage: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/s10/Branco%20Summit.png",
  },
  {
    title: "Silverado",
    href: "/picapes/silverado",
    coverImage:
      "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/caminhonete/silverado/ver.png",
  },
];

// Esportivos (LPs)
const SPORT_LP_CARDS: FixedCard[] = [
  {
    title: "Camaro SS Collection",
    href: "/premium/camaro",
    coverImage:
      "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/esportivos/camaro-ss/capa/1769189507758_kvtuh.avif",
  },
];

// =========================
// helpers
// =========================
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

// =========================
// CARROSSEL TOPO (VISUAL)
// + ABAS (agora com SUVs e Hatch/Sedan separado)
// =========================
const CATEGORIES = [
  {
    id: "eletricos",
    label: "Elétricos",
    carImage:
      "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/captiva-desk.avif",
    link: "/eletricos",
    dbKeywords: ["eletrico", "eletrico", "ev", "bolt", "equinox ev", "blazer ev", "captiva ev", "blazer", "captiva"],
  },
  {
    id: "suvs",
    label: "SUVs",
    carImage:
      "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/spin.avif",
    link: "/suvs",
    dbKeywords: ["suv", "tracker", "equinox turbo", "equinox", "trailblazer", "spin"],
  },
  {
    id: "picapes",
    label: "Picapes",
    carImage:
      "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/carrocel-card.avif",
    link: "/picapes",
    dbKeywords: ["picape", "pickup", "montana", "s10", "silverado"],
  },
  {
    id: "hatches",
    label: "Hatches",
    carImage:
      "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/spin.avif",
    link: "/hatches",
    dbKeywords: ["hatch", "onix hatch", "onix", "hb"],
  },
  {
    id: "sedans",
    label: "Sedans",
    carImage:
      "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/eletricos/onix%20(1).avif",
    link: "/sedans",
    dbKeywords: ["sedan", "onix plus", "cruze", "cruze sedan", "plus"],
  },
  {
    id: "esportivos",
    label: "Esportivos",
    carImage:
      "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/camaro%20(1).avif",
    link: "/esportivos",
    dbKeywords: ["esportivo", "camaro", "corvette", "ss"],
  },
] as const;

type TabLabel = (typeof CATEGORIES)[number]["label"];

type DbVehicle = {
  id: string | number;
  model_name: string;
  image_url: string;
  price_start: number;
  category_id: string | number;
  categories?: { name?: string | null } | null;
};

export default function VehicleDiscovery() {
  const [activeTab, setActiveTab] = useState<TabLabel>("Elétricos");
  const [isAnimating, setIsAnimating] = useState(false);

  const [dbVehicles, setDbVehicles] = useState<DbVehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // ✅ agora puxamos categories(name) junto pra filtrar por keywords sem depender do category_id
        const { data: vecs } = await supabase
          .from("vehicles")
          .select("id, model_name, image_url, price_start, category_id, categories(name)")
          .eq("is_visible", true);

        if (vecs) setDbVehicles(vecs as any);
      } catch (err) {
        console.error("Erro ao buscar veículos", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const currentCategory = useMemo(() => {
    return CATEGORIES.find((c) => c.label === activeTab) || CATEGORIES[0];
  }, [activeTab]);

  const handleTabChange = (label: TabLabel) => {
    if (label === activeTab) return;
    setIsAnimating(true);
    setActiveTab(label);
    setTimeout(() => setIsAnimating(false), 600);
  };

  // ✅ LPs por aba
  const fixedCardsForTab: FixedCard[] = useMemo(() => {
    if (activeTab === "Elétricos") return ELECTRIC_LP_CARDS;
    if (activeTab === "SUVs") return SUV_LP_CARDS;
    if (activeTab === "Picapes") return PICKUP_LP_CARDS;
    if (activeTab === "Esportivos") return SPORT_LP_CARDS;
    return [];
  }, [activeTab]);

  // ✅ Filtra DB por keywords (category name + model)
  const filteredDbVehicles = useMemo(() => {
    const keywords = currentCategory.dbKeywords || [];
    if (!keywords.length) return [];

    return dbVehicles.filter((v) => {
      const search = norm(`${v.categories?.name || ""} ${v.model_name || ""}`);
      return keywords.some((k) => search.includes(norm(k)));
    });
  }, [dbVehicles, currentCategory]);

  // ✅ Dedup DB vs LPs (remove duplicados)
  const dedupedDbVehicles = useMemo(() => {
    if (!filteredDbVehicles.length) return [];
    if (!fixedCardsForTab.length) return filteredDbVehicles;

    const fixedSet = new Set(fixedCardsForTab.map((c) => norm(c.title)));

    return filteredDbVehicles.filter((v) => {
      const name = norm(v.model_name);

      // igual
      if (fixedSet.has(name)) return false;

      // heurística: contém (ex: "Trailblazer High Country" vs "Trailblazer")
      for (const fx of fixedSet) {
        if (fx && (name.includes(fx) || fx.includes(name))) return false;
      }

      // extra (Camaro)
      if (activeTab === "Esportivos" && name.includes("camaro")) return false;

      return true;
    });
  }, [filteredDbVehicles, fixedCardsForTab, activeTab]);

  return (
    <section className="py-20 md:py-32 bg-white overflow-hidden font-sans">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* CABEÇALHO */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-4xl md:text-5xl font-light text-gray-900 mb-10 tracking-tight">
            Sua viagem começa aqui
          </h2>

          {/* MENU DE ABAS */}
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 border-b border-gray-200 w-full max-w-5xl mx-auto px-4">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleTabChange(cat.label)}
                className={`pb-5 text-sm md:text-base font-bold uppercase tracking-widest transition-all duration-300 border-b-[4px]
                  ${
                    activeTab === cat.label
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-400 hover:text-gray-900 hover:border-gray-300"
                  }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* VISUAL PRINCIPAL */}
        <div className="relative w-full flex flex-col items-center justify-center mt-4">
          <div
            className={`relative z-20 w-full flex justify-center items-center transition-all duration-700 ease-out transform ${
              isAnimating ? "translate-x-20 opacity-0 blur-md" : "translate-x-0 opacity-100 blur-0"
            }`}
          >
            <div className="relative w-full md:w-[95%] lg:w-[92%] aspect-[16/9] lg:aspect-[21/9] xl:aspect-[24/9]">
              <img
                src={currentCategory.carImage}
                alt={currentCategory.label}
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          <div className="z-30 transition-all duration-700 delay-100 transform translate-y-0 -mt-8 md:-mt-12 lg:-mt-16" />
        </div>

        {/* MINI CARDS */}
        <div className="mt-24 border-t border-gray-100 pt-16">
          <h3 className="text-2xl font-light text-gray-800 mb-8 text-center uppercase tracking-wide">
            Modelos {activeTab} Disponíveis
          </h3>

          {loading ? (
            <div className="flex justify-center p-10">
              <Loader2 className="animate-spin text-gray-300" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 px-4">
              {/* 1) Cards fixos (LPs) primeiro */}
              {fixedCardsForTab.map((card) => (
                <Link
                  key={card.href}
                  href={card.href}
                  className="group bg-white rounded-2xl p-6 border border-gray-100 hover:border-blue-100 hover:shadow-xl transition-all duration-300 flex flex-col items-center"
                >
                  <div className="w-full h-32 mb-4 flex items-center justify-center overflow-hidden">
                    <img
                      src={(card.coverImage || "").trim()}
                      alt={card.title}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  <h4 className="text-lg font-black uppercase text-gray-900 mb-1 text-center group-hover:text-blue-600 transition-colors">
                    {card.title}
                  </h4>

                  <p className="text-xs text-gray-500 font-bold mb-6">
                    {typeof card.priceStart === "number" && card.priceStart > 0 ? (
                      <>
                        A partir de <span className="text-gray-900">{formatBRL0(card.priceStart)}</span>
                      </>
                    ) : (
                      "Saiba mais sobre o modelo"
                    )}
                  </p>

                  <span className="mt-auto text-xs font-bold uppercase tracking-widest text-blue-600 border border-blue-600 px-6 py-3 rounded-full hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2">
                    Saiba Mais
                    <ArrowRight size={14} />
                  </span>
                </Link>
              ))}

              {/* 2) Cards do banco (dedupados) */}
              {dedupedDbVehicles.length > 0 ? (
                dedupedDbVehicles.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className="group bg-white rounded-2xl p-6 border border-gray-100 hover:border-blue-100 hover:shadow-xl transition-all duration-300 flex flex-col items-center"
                  >
                    <div className="w-full h-32 mb-4 flex items-center justify-center overflow-hidden">
                      <img
                        src={(vehicle.image_url || "").trim()}
                        alt={vehicle.model_name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>

                    <h4 className="text-lg font-black uppercase text-gray-900 mb-1 text-center">
                      {vehicle.model_name}
                    </h4>

                    <p className="text-xs text-gray-500 font-bold mb-6">
                      A partir de <span className="text-gray-900">{formatBRL0(vehicle.price_start)}</span>
                    </p>

                    <Link
                      href={`/configurador?id=${vehicle.id}`}
                      className="mt-auto text-xs font-bold uppercase tracking-widest text-blue-600 border border-blue-600 px-6 py-3 rounded-full hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2"
                    >
                      Saiba Mais
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                ))
              ) : fixedCardsForTab.length > 0 ? null : (
                <div className="col-span-full text-center py-10 text-gray-400">
                  <p>Nenhum veículo cadastrado nesta categoria ainda.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}