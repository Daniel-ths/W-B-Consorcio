"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

// --- CONFIGURAÇÃO DA ORDEM DO MENU ---
const MENU_ORDER = [
  { label: "Elétricos", dbKeywords: ["eletrico", "elétrico", "ev", "bolt"] },
  { label: "SUVs", dbKeywords: ["suv", "tracker", "equinox", "trailblazer", "spin"] },
  { label: "Picapes", dbKeywords: ["picape", "pickup", "montana", "s10", "silverado"] },
  { label: "Hatches e Sedans", dbKeywords: ["hatch", "sedan", "onix", "cruze", "compacto"] },
  { label: "Esportivos", dbKeywords: ["esportivo", "camaro", "corvette", "ss"] },
  { label: "Seminovos", dbKeywords: [] },
];

// =========================
// ✅ CARDS FIXOS (LANDING PAGES) — CAPA SELECIONÁVEL
// =========================
const ELECTRIC_LP_CARDS: Array<{
  title: string;
  href: string;
  coverImage: string;
  priceStart?: number;
}> = [
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

// ✅ Esportivos (LPs)
const SPORT_LP_CARDS: Array<{
  title: string;
  href: string;
  coverImage: string;
  priceStart?: number;
}> = [
  {
    title: "Camaro SS Collection",
    href: "/premium/camaro",
    coverImage:
      "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/esportivos/camaro-ss/capa/1769189507758_kvtuh.avif",
  },
];

// ✅ SUVs (LPs) — NOVOS QUE VOCÊ FEZ
const SUV_LP_CARDS: Array<{
  title: string;
  href: string;
  coverImage: string;
  priceStart?: number;
}> = [
  {
    title: "Equinox Turbo",
    href: "/suvs/equinox-turbo", // ajuste se sua rota for outra
    coverImage:
      "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/suv/Equinox-turbo/Verde%20Cacti.png",
  },
  {
    title: "Trailblazer",
    href: "/suvs/trailblazer", // ajuste se sua rota for outra
    coverImage:
      "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/suv/Trailblazer/Preto%20Ouro%20Negro.png",
  },
  {
    title: "Spin",
    href: "/suvs/spin", // ajuste se sua rota for outra
    coverImage:
      "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/suv/spin/Branco%20Summit.png",
  },
];

// ✅ Picapes (LPs) — NOVAS (S10 e Silverado)
const PICKUP_LP_CARDS: Array<{
  title: string;
  href: string;
  coverImage: string;
  priceStart?: number;
}> = [
  {
    title: "S10",
    href: "/picapes/s10", // ajuste se sua rota for outra
    coverImage:
      "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/s10/Branco%20Summit.png",
    // priceStart: 0,
  },
  {
    title: "Silverado",
    href: "/picapes/silverado", // ajuste se sua rota for outra
    coverImage:
      "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/caminhonete/silverado/ver.png",
    // priceStart: 0,
  },
];

interface VehiclesMenuProps {
  onClose: () => void;
}

const formatBRL0 = (val: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(val);

// Normaliza string pra comparar (remove acento/pontuação e baixa)
const norm = (s: string) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim();

function FixedCardsGrid({
  cards,
  onClose,
}: {
  cards: Array<{ title: string; href: string; coverImage: string; priceStart?: number }>;
  onClose: () => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
      {cards.map((card) => (
        <Link key={card.href} href={card.href} onClick={onClose} className="group block text-center relative">
          <div className="h-32 bg-gray-50 rounded-lg mb-4 flex items-center justify-center overflow-hidden mix-blend-multiply group-hover:bg-gray-100 transition-colors">
            <img
              src={(card.coverImage || "").trim()}
              alt={card.title}
              className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500"
            />
          </div>

          <h4 className="text-sm font-bold text-gray-900 uppercase group-hover:text-blue-600 transition-colors">
            {card.title}
          </h4>

          <p className="text-xs text-gray-500 mt-1 font-semibold">
            {typeof card.priceStart === "number" && card.priceStart > 0
              ? `A partir de ${formatBRL0(card.priceStart)}`
              : "Saiba mais sobre o modelo"}
          </p>

          <span className="text-[10px] text-blue-600 font-bold uppercase mt-2 inline-block border-b border-transparent group-hover:border-blue-600">
            Saiba mais
          </span>
        </Link>
      ))}
    </div>
  );
}

export default function VehiclesMenu({ onClose }: VehiclesMenuProps) {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedLabel, setSelectedLabel] = useState("Elétricos");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: vecs } = await supabase
          .from("vehicles")
          .select("*, categories(name)")
          .eq("is_visible", true)
          .order("price_start", { ascending: true });

        if (vecs) setVehicles(vecs);
      } catch (error) {
        console.error("Erro ao buscar menu:", error);
      } finally {
        setTimeout(() => setLoading(false), 500);
      }
    }
    fetchData();
  }, []);

  // nomes das LPs pra remover duplicados no grid do DB
  const fixedNames = useMemo(() => {
    const byLabel: Record<string, string[]> = {
      "Elétricos": ELECTRIC_LP_CARDS.map((c) => norm(c.title)),
      "Esportivos": SPORT_LP_CARDS.map((c) => norm(c.title)),
      "SUVs": SUV_LP_CARDS.map((c) => norm(c.title)),
      "Picapes": PICKUP_LP_CARDS.map((c) => norm(c.title)), // ✅ ADICIONADO
    };
    return byLabel;
  }, []);

  const filteredVehicles = useMemo(() => {
    if (selectedLabel === "Seminovos") return [];

    const config = MENU_ORDER.find((c) => c.label === selectedLabel);
    if (!config) return [];

    const fixedSet = new Set(fixedNames[selectedLabel] || []);

    return vehicles
      .filter((v) => {
        const searchString = `${v.categories?.name || ""} ${v.model_name}`.toLowerCase();
        return config.dbKeywords.some((keyword) => searchString.includes(keyword));
      })
      .filter((v) => {
        // remove duplicados (se já existe LP)
        const name = norm(v.model_name);
        if (fixedSet.has(name)) return false;
        for (const fx of fixedSet) {
          if (fx && (name.includes(fx) || fx.includes(name))) return false;
        }
        return true;
      });
  }, [selectedLabel, vehicles, fixedNames]);

  // --- SKELETON LOADING ---
  if (loading)
    return (
      <div className="w-full bg-white border-t border-gray-200 shadow-xl pt-16">
        <div className="max-w-[1400px] mx-auto p-10 min-h-[450px] flex">
          <div className="w-1/4 border-r border-gray-100 pr-8 space-y-2 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-lg w-full"></div>
            ))}
          </div>
          <div className="w-3/4 pl-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col items-center space-y-3">
                  <div className="h-32 bg-gray-100 rounded-lg w-full"></div>
                  <div className="h-4 bg-gray-100 rounded w-2/3"></div>
                  <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );

  return (
    <div
      className="w-full bg-white border-t border-gray-200 shadow-xl pt-16 animate-in fade-in slide-in-from-top-2 duration-500"
      onMouseLeave={onClose}
    >
      <div className="max-w-[1400px] mx-auto p-10 min-h-[450px] flex">
        {/* ESQUERDA: CATEGORIAS */}
        <div className="w-1/4 border-r border-gray-100 pr-8 space-y-1">
          {MENU_ORDER.map((item) => (
            <div
              key={item.label}
              onMouseEnter={() => setSelectedLabel(item.label)}
              className={`cursor-pointer px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-wide flex items-center justify-between transition-all 
                ${
                  selectedLabel === item.label
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-500 hover:bg-gray-50"
                }`}
            >
              <span className={item.label === "Seminovos" ? "border-l-4 border-transparent pl-0" : ""}>
                {item.label}
              </span>
              {selectedLabel === item.label && <ArrowRight size={16} />}
            </div>
          ))}
        </div>

        {/* DIREITA: CONTEÚDO */}
        <div className="w-3/4 pl-12 flex items-center justify-center">
          {selectedLabel === "Seminovos" ? (
            // BANNER SEMINOVOS
            <div className="animate-in fade-in slide-in-from-left-4 duration-300 w-full flex justify-center">
              <div className="w-full max-w-2xl bg-gray-50 p-12 text-center rounded-sm">
                <img
                  src="https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/chevrolet-logo.svg"
                  className="h-8 mx-auto mb-6 opacity-80"
                  alt="Logo"
                />
                <h3 className="text-4xl font-extrabold text-gray-800 uppercase tracking-tighter mb-2">
                  Seminovos
                </h3>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-8">
                  Qualidade Certificada Chevrolet
                </p>
                <div className="flex justify-center gap-4">
                  <Link
                    href="/vendedor/seminovos"
                    onClick={onClose}
                    className="px-6 py-3 bg-blue-600 text-white text-xs font-bold uppercase tracking-wide hover:bg-blue-700 transition-colors"
                  >
                    Consultar
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full animate-in fade-in slide-in-from-left-4 duration-300">
              {/* ✅ FIXOS POR CATEGORIA */}
              {selectedLabel === "Elétricos" ? (
                <div className="mb-10">
                  <FixedCardsGrid cards={ELECTRIC_LP_CARDS} onClose={onClose} />
                </div>
              ) : null}

              {selectedLabel === "SUVs" ? (
                <div className="mb-10">
                  <FixedCardsGrid cards={SUV_LP_CARDS} onClose={onClose} />
                </div>
              ) : null}

              {selectedLabel === "Picapes" ? (
                <div className="mb-10">
                  <FixedCardsGrid cards={PICKUP_LP_CARDS} onClose={onClose} />
                </div>
              ) : null}

              {selectedLabel === "Esportivos" ? (
                <div className="mb-10">
                  <FixedCardsGrid cards={SPORT_LP_CARDS} onClose={onClose} />
                </div>
              ) : null}

              {/* GRID NORMAL DO BANCO (sem duplicados) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
                {filteredVehicles.length > 0 ? (
                  filteredVehicles.map((car) => (
                    <Link
                      key={car.id}
                      href={`/configurador?id=${car.id}`}
                      onClick={onClose}
                      className="group block text-center relative"
                    >
                      <div className="h-32 bg-gray-50 rounded-lg mb-4 flex items-center justify-center overflow-hidden mix-blend-multiply group-hover:bg-gray-100 transition-colors">
                        <img
                          src={(car.image_url || "").trim()}
                          alt={car.model_name}
                          className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>

                      <h4 className="text-sm font-bold text-gray-900 uppercase group-hover:text-blue-600 transition-colors">
                        {car.model_name}
                      </h4>

                      <p className="text-xs text-gray-500 mt-1 font-semibold">
                        A partir de {formatBRL0(car.price_start)}
                      </p>

                      <span className="text-[10px] text-blue-600 font-bold uppercase mt-2 inline-block border-b border-transparent group-hover:border-blue-600">
                        Saiba mais
                      </span>
                    </Link>
                  ))
                ) : (
                  <div className="col-span-full text-center py-20 text-gray-400"></div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}