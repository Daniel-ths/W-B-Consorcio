"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Menu,
  User,
  ChevronRight,
  ChevronDown,
  MessageCircle,
  ChevronUp,
  Facebook,
  Instagram,
  Youtube,
} from "lucide-react";

type FiatCategory =
  | "TODOS"
  | "PASSEIO"
  | "SUV"
  | "ESPORTIVOS"
  | "PICAPES"
  | "HÍBRIDOS"
  | "UTILITÁRIOS"
  | "ELÉTRICOS";

type Vehicle = {
  slug: string;
  name: string;
  image: string;
  categories: FiatCategory[];
};

type VehicleRow = {
  model_name: string;
  slug: string;
  catalog_cover_url?: string | null;
  image_url?: string | null;
  is_visible?: boolean | null;
};

const FIAT_IMAGES = {
  logo: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/avatars/logo_header_hub_fiat_02.svg",
  heroBg: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/avatars/BANNERS%20FIAT/Screenshot_24.svg",
  heroMain: "COLE_AQUI_IMAGEM_PRINCIPAL_HERO",
  promoLeft:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/avatars/BANNERS%20FIAT/banner-mini-home-fiat-dia-d@2x.webp",
  promoRight:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/avatars/BANNERS%20FIAT/fiat-por-assinatura-fastback-home.webp",
  carPulse: "COLE_AQUI_PULSE_HYBRID",
  carFastback: "COLE_AQUI_FASTBACK_HYBRID",
  carTitano: "COLE_AQUI_TITANO",
  carToro: "COLE_AQUI_TORO",
  carStrada: "COLE_AQUI_STRADA",
  abarthBanner:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/avatars/BANNERS%20FIAT/02_destaque_home_abarth_desk.webp",
  fastbackCard:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/avatars/BANNERS%20FIAT/minibanner_home_fastbackMY26.webp",
  connectMeCard:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/avatars/BANNERS%20FIAT/minibanner-destaque-home-connectme.webp",
  optPcd:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/avatars/BANNERS%20FIAT/pcd-novo-banner-home.webp",
  optFinanciamento:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/avatars/BANNERS%20FIAT/financiamento.webp",
  optConsorcio:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/avatars/BANNERS%20FIAT/consorcio.webp",
  optVendasDiretas:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/avatars/BANNERS%20FIAT/banner-vendas-diretas-novo-home.webp",
  optPlanoFazendeiro:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/avatars/BANNERS%20FIAT/1-plano-fazendeiro-home.webp",
  optSeminovos:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/avatars/BANNERS%20FIAT/seminovos.webp",
  footerLogo:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/avatars/BANNERS%20FIAT/logo_footer_hub_fiat.svg",
};

const fiatCategories: FiatCategory[] = [
  "TODOS",
  "PASSEIO",
  "SUV",
  "ESPORTIVOS",
  "PICAPES",
  "HÍBRIDOS",
  "UTILITÁRIOS",
  "ELÉTRICOS",
];

const fallbackVehicles: Vehicle[] = [
  {
    slug: "pulse-hybrid",
    name: "Pulse Hybrid",
    image: FIAT_IMAGES.carPulse,
    categories: ["TODOS", "SUV", "HÍBRIDOS"],
  },
  {
    slug: "fastback-hybrid",
    name: "Fastback Hybrid",
    image: FIAT_IMAGES.carFastback,
    categories: ["TODOS", "SUV", "HÍBRIDOS"],
  },
  {
    slug: "titano",
    name: "Titano",
    image: FIAT_IMAGES.carTitano,
    categories: ["TODOS", "PICAPES", "UTILITÁRIOS"],
  },
  {
    slug: "toro",
    name: "Toro",
    image: FIAT_IMAGES.carToro,
    categories: ["TODOS", "PICAPES"],
  },
  {
    slug: "strada",
    name: "Strada",
    image: FIAT_IMAGES.carStrada,
    categories: ["TODOS", "PICAPES", "UTILITÁRIOS"],
  },
];

const opportunities = [
  {
    title: "DESCONTO PARA PCD",
    image: FIAT_IMAGES.optPcd,
    description:
      "Vá além com a Fiat! Conheça os benefícios exclusivos para pessoas com deficiência.",
  },
  {
    title: "FINANCIAMENTO",
    image: FIAT_IMAGES.optFinanciamento,
    description:
      "Com ou sem entrada, aqui você encontra o financiamento ideal para realizar o sonho do carro novo.",
  },
  {
    title: "CONSÓRCIO",
    image: FIAT_IMAGES.optConsorcio,
    description:
      "No consórcio Fiat você investe e conquista um carro novinho em folha. Parcelas sem entrada e sem juros.",
  },
  {
    title: "VENDAS DIRETAS",
    image: FIAT_IMAGES.optVendasDiretas,
    description:
      "Um programa feito para empresas, com condições e ofertas exclusivas.",
  },
  {
    title: "PLANO FAZENDEIRO",
    image: FIAT_IMAGES.optPlanoFazendeiro,
    description: "O financiamento pensado para você que vive na terra.",
  },
  {
    title: "FIAT SEMINOVOS",
    image: FIAT_IMAGES.optSeminovos,
    description:
      "Mais tranquilidade e segurança na compra de usados com Spoticar, nossa parceira oficial.",
  },
];

const footerColumns = [
  [
    "Carros",
    "Fiat Professional",
    "Conheça Abarth",
    "Institucional",
    "Fiat Connect////Me",
    "Política de Qualidade",
  ],
  [
    "Ofertas Fiat",
    "Vendas Diretas",
    "Serviços Financeiros",
    "Fale Conosco",
    "Fiat Comuniità",
    "Política de Privacidade",
  ],
  [
    "Programa Acesse Fiat",
    "Fiat Seminovos",
    "Todos os Serviços",
    "Reparador Fiat",
    "Comunicado de Fraude",
  ],
  [
    "Serviços Fiat",
    "Manuais",
    "Recall",
    "Recall Airbag Takata",
    "Concessionárias",
    "Fiat Lovers",
    "Giro Fiat",
    "Fiatwear",
    "Proconve - Ruído e Opacidade",
    "Fichas de Resgate",
  ],
];

function mapVehicleFromDb(row: VehicleRow): Vehicle {
  return {
    slug: row.slug,
    name: row.model_name,
    image: row.catalog_cover_url || row.image_url || "",
    categories: ["TODOS"],
  };
}

export default function FiatPage() {
  const [activeCategory, setActiveCategory] = useState<FiatCategory>("TODOS");
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [catalogMotionKey, setCatalogMotionKey] = useState(0);
  const [catalogDirection, setCatalogDirection] = useState<"category" | "next">(
    "category"
  );
  const [dbVehicles, setDbVehicles] = useState<Vehicle[]>([]);

  useEffect(() => {
    async function loadFiatVehicles() {
      const { data, error } = await supabase
        .from("vehicles")
        .select("model_name, slug, catalog_cover_url, image_url, is_visible")
        .eq("brand", "fiat")
        .eq("is_visible", true)
        .order("id", { ascending: false });

      if (error) {
        console.error("Erro ao carregar veículos Fiat:", error.message);
        return;
      }

      const mapped = ((data || []) as VehicleRow[])
        .filter((vehicle) => vehicle.slug && vehicle.model_name)
        .map(mapVehicleFromDb);

      setDbVehicles(mapped);
    }

    loadFiatVehicles();
  }, []);

  useEffect(() => {
    const updateViewport = () => setIsMobile(window.innerWidth < 768);
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  const catalogVehicles = dbVehicles.length > 0 ? dbVehicles : fallbackVehicles;

  const filteredVehicles = useMemo(() => {
    if (activeCategory === "TODOS") return catalogVehicles;
    return catalogVehicles.filter((vehicle) =>
      vehicle.categories.includes(activeCategory)
    );
  }, [activeCategory, catalogVehicles]);

  const itemsPerPage = isMobile ? 2 : 5;
  const totalPages = Math.max(1, Math.ceil(filteredVehicles.length / itemsPerPage));

  const visibleVehicles = useMemo(() => {
    const start = page * itemsPerPage;
    return filteredVehicles.slice(start, start + itemsPerPage);
  }, [filteredVehicles, page, itemsPerPage]);

  useEffect(() => {
    setPage(0);
  }, [activeCategory]);

  useEffect(() => {
    if (filteredVehicles.length === 0) {
      setSelectedVehicle(null);
      return;
    }

    const exists = filteredVehicles.some(
      (vehicle) => vehicle.slug === selectedVehicle
    );

    if (!exists) {
      setSelectedVehicle(filteredVehicles[0].slug);
    }
  }, [filteredVehicles, selectedVehicle]);

  const handleCategoryClick = (category: FiatCategory) => {
    if (category === activeCategory) return;
    setCatalogDirection("category");
    setCatalogMotionKey((prev) => prev + 1);
    setActiveCategory(category);
  };

  const handleNextPage = () => {
    if (totalPages <= 1) return;
    setCatalogDirection("next");
    setCatalogMotionKey((prev) => prev + 1);
    setPage((prev) => (prev + 1) % totalPages);
  };

  return (
    <main id="top" className="min-h-screen bg-[#f1f0e8] text-black">
      <header className="sticky top-0 z-50 h-[56px] border-b border-white/5 bg-black">
        <div className="mx-auto flex h-full w-full items-center justify-between px-4 md:px-6">
          <div className="flex items-center">
            <img
              src={FIAT_IMAGES.logo}
              alt="Fiat"
              className="h-[28px] w-auto object-contain md:h-[32px]"
            />
          </div>

          <div className="flex h-full items-center">
            <button
              type="button"
              className="flex h-full min-w-[64px] flex-col items-center justify-center border-l border-white/20 px-3 text-white"
            >
              <User className="h-[15px] w-[15px]" />
              <span className="mt-1 text-[9px] font-bold uppercase tracking-wide">
                Fiat ID
              </span>
            </button>

            <button
              type="button"
              className="flex h-full min-w-[64px] flex-col items-center justify-center border-l border-white/20 px-3 text-white"
            >
              <Menu className="h-[16px] w-[16px]" />
              <span className="mt-1 text-[9px] font-bold uppercase tracking-wide">
                Menu
              </span>
            </button>
          </div>
        </div>
      </header>

      <section className="relative min-h-[690px] w-full overflow-hidden bg-[#006b16] md:min-h-[760px]">
        <div className="absolute inset-0">
          <img
            src={FIAT_IMAGES.heroBg}
            alt="Hero background"
            className="h-full w-full object-cover"
          />
        </div>

        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.18),rgba(0,0,0,0.04))]" />

        <div className="relative mx-auto flex min-h-[690px] max-w-[1720px] flex-col justify-center px-6 md:min-h-[760px] md:px-12">
          <div className="grid items-center gap-8 md:grid-cols-[410px_1fr] md:gap-0">
            <div className="z-10 max-w-[360px] pt-10 md:pt-0">
              <h1 className="text-[44px] font-black leading-[1.05] text-white md:text-[64px]">
                Fiat Pulse
                <br />
                Edição Especial
                <br />
                LollaBR
              </h1>

              <p className="mt-6 max-w-[260px] text-[22px] font-medium leading-[1.2] text-white md:text-[18px]">
                Fiat: há 50 anos dançando conforme a sua música.
              </p>

              <button
                className="mt-10 inline-flex h-[52px] min-w-[155px] items-center justify-center bg-[#ff1435] px-8 text-[17px] font-extrabold uppercase text-white [clip-path:polygon(12%_0,100%_0,88%_100%,0_100%)]"
                type="button"
              >
                Conheça
              </button>
            </div>

            <div className="relative flex items-center justify-center md:justify-end">
              <img
                src={FIAT_IMAGES.heroMain}
                alt=""
                className="relative z-10 w-full max-w-[860px] object-contain md:max-w-[940px] md:translate-x-[-10px] md:translate-y-[10px]"
              />
            </div>
          </div>

          <div className="absolute bottom-[18px] left-1/2 flex -translate-x-1/2 items-center gap-2 text-white">
            <span className="text-[18px] font-medium md:text-[20px]">
              Conheça as novidades Fiat
            </span>
            <ChevronDown className="h-5 w-5" />
          </div>
        </div>
      </section>

      <section className="relative z-20 -mt-[24px] bg-[#f1f0e8] px-5 pb-8 pt-0 md:-mt-[86px] md:px-8 md:pb-10">
        <div className="mx-auto grid max-w-[1660px] gap-7 md:grid-cols-2">
          <a className="block overflow-hidden shadow-none" href="#">
            <img
              src={FIAT_IMAGES.promoLeft}
              alt="Promoção esquerda"
              className="block w-full object-cover"
            />
          </a>

          <a className="block overflow-hidden shadow-none" href="#">
            <img
              src={FIAT_IMAGES.promoRight}
              alt="Promoção direita"
              className="block w-full object-cover"
            />
          </a>
        </div>
      </section>

      <section
        id="fiat-catalogo"
        className="bg-[#f1f0e8] px-5 pb-8 pt-2 md:px-8 md:pb-12"
      >
        <div className="mx-auto max-w-[1660px]">
          <div className="mb-8 flex flex-wrap items-center justify-center gap-x-2 gap-y-3 md:mb-10 md:gap-x-3">
            {fiatCategories.map((category) => {
              const isActive = activeCategory === category;

              return (
                <button
                  key={category}
                  onClick={() => handleCategoryClick(category)}
                  className={`group relative h-[44px] border-b border-black px-4 text-[18px] font-extrabold uppercase tracking-tight transition-all duration-300 md:px-6 ${
                    isActive
                      ? "border-black bg-black text-white shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
                      : "bg-transparent text-black hover:bg-black hover:text-white"
                  }`}
                  type="button"
                >
                  <span className="relative z-10">{category}</span>
                </button>
              );
            })}
          </div>

          <div className="relative overflow-hidden">
            {filteredVehicles.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-[22px] font-black uppercase text-[#0a1230]">
                  Nenhum veículo encontrado nesta categoria
                </p>
              </div>
            ) : (
              <>
                <div
                  key={`${activeCategory}-${page}-${catalogMotionKey}`}
                  className={`grid grid-cols-1 gap-y-12 md:grid-cols-5 md:gap-x-6 ${
                    catalogDirection === "next"
                      ? "catalog-enter-side"
                      : "catalog-enter-category"
                  }`}
                >
                  {visibleVehicles.map((vehicle, index) => {
                    const isSelected = selectedVehicle === vehicle.slug;

                    return (
                      <div
                        key={vehicle.slug}
                        className={`min-w-0 transition-all duration-300 catalog-card-item ${
                          isSelected ? "scale-[1.01]" : ""
                        }`}
                        style={{ animationDelay: `${index * 70}ms` }}
                      >
                        <div className="flex h-[280px] items-end justify-center md:h-[250px]">
                          {vehicle.image ? (
                            <img
                              src={vehicle.image}
                              alt={vehicle.name}
                              className="max-h-full w-full object-contain transition-transform duration-500 hover:scale-[1.03]"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center rounded-xl bg-white/60 text-xs font-black uppercase text-black/40">
                              Sem imagem
                            </div>
                          )}
                        </div>

                        <div className="mt-5 text-center md:text-left">
                          <h3 className="text-[38px] font-black leading-none tracking-tight text-[#0a1230] md:text-[30px]">
                            {vehicle.name}
                          </h3>

                          <div className="mt-5 flex items-center justify-center gap-8 md:justify-start">
                            <button
                              type="button"
                              onClick={() => setSelectedVehicle(vehicle.slug)}
                              className={`inline-flex items-center gap-1 text-[19px] font-black uppercase tracking-tight transition-colors duration-300 ${
                                isSelected ? "text-[#ff1435]" : "text-[#0a1230]"
                              }`}
                            >
                              Conheça <ChevronRight className="h-4 w-4" />
                            </button>

                            <Link
                              href={`/fiat/builder?vehicle=${vehicle.slug}`}
                              className="inline-flex items-center gap-1 text-[19px] font-black uppercase tracking-tight text-[#0a1230] transition-all duration-300 hover:text-[#ff1435]"
                            >
                              Monte <ChevronRight className="h-4 w-4" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {totalPages > 1 && (
                  <button
                    type="button"
                    onClick={handleNextPage}
                    className="absolute right-0 top-[120px] hidden h-[72px] w-[56px] items-center justify-center bg-[#ff1435] text-white transition-all duration-300 hover:scale-105 hover:bg-[#e80f30] active:scale-95 md:flex"
                  >
                    <ChevronRight className="h-8 w-8 transition-transform duration-300" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      <section className="bg-[#f1f0e8] px-5 py-4 md:px-8 md:py-6">
        <div className="mx-auto max-w-[1660px]">
          <a href="#" className="block overflow-hidden">
            <img
              src={FIAT_IMAGES.abarthBanner}
              alt="Abarth"
              className="block w-full object-cover"
            />
          </a>
        </div>
      </section>

      <section className="bg-[#f1f0e8] px-5 py-4 md:px-8 md:py-6">
        <div className="mx-auto grid max-w-[1660px] gap-7 md:grid-cols-2">
          <a href="#" className="block overflow-hidden">
            <img
              src={FIAT_IMAGES.fastbackCard}
              alt="Novo Fiat Fastback"
              className="block w-full object-cover"
            />
          </a>

          <a href="#" className="block overflow-hidden">
            <img
              src={FIAT_IMAGES.connectMeCard}
              alt="Fiat Connect Me"
              className="block w-full object-cover"
            />
          </a>
        </div>
      </section>

      <section className="bg-[#f1f0e8] px-5 pb-14 pt-8 md:px-8 md:pt-10">
        <div className="mx-auto flex max-w-[1660px] items-start gap-6 md:gap-14">
          <div className="pt-1">
            <div className="text-[74px] font-black italic leading-none text-[#ff1435] md:text-[86px]">
              ////
            </div>
          </div>

          <div className="max-w-[1100px]">
            <h2 className="text-[24px] font-black uppercase leading-[1.08] tracking-tight text-black md:text-[34px]">
              As melhores oportunidades e condições você encontra na Fiat.
            </h2>
          </div>
        </div>
      </section>

      <section className="bg-[#f1f0e8] px-5 pb-24 md:px-8">
        <div className="mx-auto max-w-[1060px]">
          <div className="grid grid-cols-1 gap-x-[18px] gap-y-[40px] md:grid-cols-3">
            {opportunities.map((item) => (
              <div key={item.title}>
                <div className="mb-2 text-[11px] font-extrabold uppercase tracking-tight text-black">
                  {item.title}
                </div>

                <a href="#" className="block overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="block h-auto w-full object-cover"
                  />
                </a>

                <p className="mt-3 text-[11px] leading-[1.35] text-black">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-[#120b1d] px-5 pb-16 pt-10 text-white md:px-8 md:pb-24 md:pt-12">
        <div className="mx-auto max-w-[1240px]">
          <div className="mb-14 flex justify-center">
            <a
              href="#top"
              className="inline-flex items-center gap-2 text-[13px] font-medium text-white/95"
            >
              <ChevronUp className="h-4 w-4" />
              Voltar para o topo
            </a>
          </div>

          <div className="grid grid-cols-1 gap-y-10 md:grid-cols-4 md:gap-x-12">
            {footerColumns.map((column, index) => (
              <div key={index} className="space-y-3">
                {column.map((item) => (
                  <a
                    key={item}
                    href="#"
                    className="block text-[14px] leading-[1.35] text-white/95 transition hover:text-white"
                  >
                    {item}
                  </a>
                ))}
              </div>
            ))}
          </div>

          <div className="mt-20 flex flex-col items-center justify-center">
            <img
              src={FIAT_IMAGES.footerLogo}
              alt="Fiat"
              className="h-[86px] w-auto object-contain md:h-[96px]"
            />

            <div className="mt-10 flex items-center gap-8 text-white">
              <a href="#" aria-label="Facebook">
                <Facebook className="h-9 w-9 fill-current stroke-0" />
              </a>
              <a href="#" aria-label="YouTube">
                <Youtube className="h-10 w-10 fill-current stroke-0" />
              </a>
              <a href="#" aria-label="Instagram">
                <Instagram className="h-9 w-9" />
              </a>
              <a href="#" aria-label="X" className="text-[52px] leading-none text-white">
                𝕏
              </a>
            </div>
          </div>
        </div>
      </footer>

      <a
        href="#"
        className="fixed bottom-6 right-6 z-50 flex h-[64px] w-[64px] items-center justify-center rounded-full bg-[#2bd15c] text-white shadow-[0_10px_30px_rgba(0,0,0,0.25)] transition-transform duration-300 hover:scale-105"
      >
        <MessageCircle className="h-8 w-8" />
      </a>

      <div className="fixed right-0 top-[240px] z-40 hidden flex-col md:flex">
        <button className="flex h-[60px] w-[50px] items-center justify-center rounded-l-[10px] border border-white/20 bg-[#003da6] text-white">
          <span className="text-[26px] font-bold">♿</span>
        </button>
        <button className="mt-[2px] flex h-[60px] w-[50px] items-center justify-center rounded-l-[10px] border border-white/20 bg-[#003da6] text-white">
          <span className="text-[22px] font-bold">🤚</span>
        </button>
      </div>

      <style jsx global>{`
        .catalog-enter-category {
          animation: catalogFadeUp 0.45s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .catalog-enter-side {
          animation: catalogSlideLeft 0.42s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .catalog-card-item {
          opacity: 0;
          animation: catalogCardIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        @keyframes catalogFadeUp {
          0% {
            opacity: 0;
            transform: translateY(18px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes catalogSlideLeft {
          0% {
            opacity: 0;
            transform: translateX(26px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes catalogCardIn {
          0% {
            opacity: 0;
            transform: translateY(24px) scale(0.985);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </main>
  );
}