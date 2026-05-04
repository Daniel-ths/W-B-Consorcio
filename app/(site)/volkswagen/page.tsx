"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Car,
  ChevronRight,
  ChevronLeft,
  MessageCircle,
} from "lucide-react";

type HeroSlide = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
};

type Vehicle = {
  slug: string;
  name: string;
  image: string;
  hoverImage?: string;
  badge?: string;
};

type VehicleRow = {
  model_name: string;
  slug: string;
  catalog_cover_url?: string | null;
  image_url?: string | null;
  hover_image_url?: string | null;
  is_visible?: boolean | null;
};

const VW_IMAGES = {
  logo: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/avatars/Volkswagen_logo_2019.svg%20(1).png",

  hero1:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/avatars/Volkswagen/t-cross-selecao_banner_desk%20(1).webp",
  hero2:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/avatars/Volkswagen/Teste-e-Comprove-Desktop.webp",
  hero3:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/avatars/Volkswagen/tiguan2026_externa_entardecer.webp",

  tera: "COLE_AQUI_CARRO_TERA",
  tcross: "COLE_AQUI_CARRO_T_CROSS",
  taos: "COLE_AQUI_CARRO_TAOS",
  nivus: "COLE_AQUI_CARRO_NIVUS",
  polo: "COLE_AQUI_CARRO_POLO",
  virtus: "COLE_AQUI_CARRO_VIRTUS",
  amarok: "COLE_AQUI_CARRO_AMAROK",
  jetta: "COLE_AQUI_CARRO_JETTA",

  tiguanBanner:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/avatars/Volkswagen/tiguan2026_externa_entardecer.webp",
  teraBanner:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/avatars/Volkswagen/Tera-Banner-Frente-1920x1080.webp",
  golfBanner:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/avatars/Volkswagen/Golf-Banner-desktop.webp",
};

const heroSlides: HeroSlide[] = [
  {
    id: "tcross-selecao",
    title: "T-Cross Seleção",
    subtitle: "Seu novo craque está escalado",
    image: VW_IMAGES.hero1,
  },
  {
    id: "volks-vale-mais",
    title: "Teste e Comprove Volks Vale+",
    subtitle: "Teste um Volks, teste a concorrência e comprove que a Volks Vale+",
    image: VW_IMAGES.hero2,
  },
  {
    id: "tiguan-r-line",
    title: "Novo Tiguan R-Line",
    subtitle: "O SUV à altura da sua história",
    image: VW_IMAGES.hero3,
  },
];

const fallbackVehicles: Vehicle[] = [
  { slug: "tera", name: "Tera", image: VW_IMAGES.tera },
  { slug: "t-cross", name: "T-Cross", image: VW_IMAGES.tcross },
  { slug: "taos", name: "Taos", image: VW_IMAGES.taos, badge: "Lançamento" },
  { slug: "nivus", name: "Nivus", image: VW_IMAGES.nivus },
  { slug: "polo", name: "Polo", image: VW_IMAGES.polo },
  { slug: "virtus", name: "Virtus", image: VW_IMAGES.virtus },
  { slug: "amarok", name: "Amarok", image: VW_IMAGES.amarok },
  { slug: "jetta-gli", name: "Jetta GLI", image: VW_IMAGES.jetta },
];

const footerColumns = [
  {
    title: "Sobre a Volkswagen",
    links: [
      "Volkswagen do Brasil",
      "Fundação Grupo Volkswagen",
      "Loja da Fundação",
      "Recursos Humanos",
      "Diversidade e Inclusão",
      "Sustentabilidade",
      "Volkswagen Collection",
      "Certificado Clássicos Volkswagen",
      "Sala de Imprensa Volkswagen",
      "Canal de Denúncia",
      "Fale Conosco",
      "App Meu VW",
    ],
  },
  {
    title: "Comprar",
    links: [
      "Modelos 0 km",
      "Ofertas 0 km",
      "Monte o Seu",
      "SUVW",
      "Volks Agro",
      "Esportivos VW Legends",
      "Blindagem",
      "Vendas Diretas",
      "Serviços Financeiros",
      "Concessionárias",
    ],
  },
  {
    title: "Para seu VW",
    links: [
      "App Meu VW",
      "Agendamento de Serviços",
      "Revisões",
      "Peças Originais",
      "Acessórios Originais",
      "Reparador Volkswagen",
      "Manuais e Garantia",
      "Fichas de Resgate",
      "Recall",
      "Recall airbag Takata",
    ],
  },
  {
    title: "Redes Sociais",
    links: ["Instagram", "YouTube", "TikTok", "Facebook", "LinkedIn", "X"],
  },
];

function mapVehicleFromDb(row: VehicleRow): Vehicle {
  return {
    slug: row.slug,
    name: row.model_name,
    image: row.catalog_cover_url || row.image_url || "",
    hoverImage: row.hover_image_url || undefined,
  };
}

export default function VolkswagenPage() {
  const [activeHero, setActiveHero] = useState(0);
  const [heroPaused, setHeroPaused] = useState(false);
  const [catalogPage, setCatalogPage] = useState(0);
  const [catalogDirection, setCatalogDirection] = useState<"next" | "prev">(
    "next"
  );
  const [dbVehicles, setDbVehicles] = useState<Vehicle[]>([]);

  useEffect(() => {
    async function loadVolkswagenVehicles() {
      const { data, error } = await supabase
        .from("vehicles")
        .select(
          "model_name, slug, catalog_cover_url, image_url, hover_image_url, is_visible"
        )
        .eq("brand", "volkswagen")
        .eq("is_visible", true)
        .order("id", { ascending: false });

      if (error) {
        console.error("Erro ao carregar veículos Volkswagen:", error.message);
        return;
      }

      const mapped = ((data || []) as VehicleRow[])
        .filter((vehicle) => vehicle.slug && vehicle.model_name)
        .map(mapVehicleFromDb);

      setDbVehicles(mapped);
    }

    loadVolkswagenVehicles();
  }, []);

  const currentHero = heroSlides[activeHero];
  const vehicles = dbVehicles.length > 0 ? dbVehicles : fallbackVehicles;

  const itemsPerPage = 4;
  const totalCatalogPages = Math.max(
    1,
    Math.ceil(vehicles.length / itemsPerPage)
  );

  const visibleVehicles = useMemo(() => {
    const start = catalogPage * itemsPerPage;
    return vehicles.slice(start, start + itemsPerPage);
  }, [vehicles, catalogPage]);

  useEffect(() => {
    setCatalogPage(0);
  }, [dbVehicles.length]);

  const nextHero = () => {
    if (heroPaused) return;
    setActiveHero((current) => (current + 1) % heroSlides.length);
  };

  const nextCatalogPage = () => {
    setCatalogDirection("next");
    setCatalogPage((current) => (current + 1) % totalCatalogPages);
  };

  const prevCatalogPage = () => {
    setCatalogDirection("prev");
    setCatalogPage((current) =>
      current === 0 ? totalCatalogPages - 1 : current - 1
    );
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-white pb-[78px] text-[#001e50] md:pb-[62px]">
      <header className="fixed left-0 top-0 z-[80] h-[58px] w-full bg-black/95 text-white md:h-[46px]">
        <div className="mx-auto flex h-full w-full max-w-[1600px] items-center justify-between px-4 sm:px-6 md:px-10 lg:px-[76px]">
          <div className="flex h-full min-w-0 items-center gap-3 sm:gap-5 md:gap-7">
            <img
              src={VW_IMAGES.logo}
              alt="Volkswagen"
              className="h-[26px] w-auto shrink-0 md:h-[24px]"
            />

            <button className="hidden text-[13px] font-bold transition-all duration-300 hover:scale-[1.04] hover:text-[#7fd8ff] sm:block">
              Menu
            </button>

            <a
              href="#modelos"
              className="hidden text-[14px] font-bold transition-all duration-300 hover:scale-[1.04] hover:text-[#7fd8ff] lg:block"
            >
              Configure seu novo Volkswagen
            </a>

            <a
              href="#modelos"
              className="max-w-[190px] truncate text-[13px] font-bold transition-all duration-300 hover:scale-[1.04] hover:text-[#7fd8ff] sm:max-w-none sm:text-[14px]"
            >
              Monte seu Volkswagen
            </a>
          </div>
        </div>
      </header>

      <section className="relative h-[calc(100svh-58px)] min-h-[560px] overflow-hidden bg-black pt-[58px] md:h-[calc(100vh-46px)] md:min-h-[720px] md:pt-[46px]">
        <button
          type="button"
          onClick={nextHero}
          aria-label="Próximo banner"
          className="absolute inset-0 z-[1]"
        />

        <img
          key={currentHero.id}
          src={currentHero.image}
          alt={currentHero.title}
          className="vw-hero-enter absolute inset-0 h-full w-full object-cover object-center"
        />

        <div className="absolute inset-0 z-[2] bg-black/55 md:bg-black/48" />
        <div className="absolute inset-0 z-[3] bg-[linear-gradient(to_right,rgba(0,0,0,0.40),rgba(0,0,0,0.15),rgba(0,0,0,0.25))]" />
        <div className="absolute inset-x-0 bottom-0 z-[4] h-[360px] bg-gradient-to-t from-black via-black/75 to-transparent" />

        <div
          key={`${currentHero.id}-text`}
          className="vw-hero-text absolute bottom-[115px] left-4 right-4 z-10 text-white sm:left-6 sm:right-auto md:bottom-[110px] md:left-[76px]"
        >
          <h1 className="max-w-[92vw] text-[34px] font-light leading-[0.98] tracking-[-0.04em] sm:text-[40px] md:text-[42px]">
            {currentHero.title}
          </h1>

          <p className="mt-4 max-w-[330px] text-[14px] font-semibold leading-5 sm:max-w-[520px] md:mt-5 md:text-[15px]">
            {currentHero.subtitle}
          </p>

          <a
            href="#modelos"
            className="mt-7 inline-flex rounded-full bg-white px-8 py-3 text-[14px] font-semibold text-[#001e50] transition-all duration-300 hover:translate-y-[-2px] hover:scale-[1.03] hover:bg-[#e8f7ff] md:mt-8 md:px-9"
          >
            Conheça
          </a>
        </div>

        <div className="absolute bottom-[28px] left-4 right-4 z-10 flex items-center justify-between gap-3 sm:left-auto sm:right-6 sm:justify-end md:bottom-[52px] md:right-[90px]">
          <button
            type="button"
            onClick={() => setHeroPaused(!heroPaused)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/55 text-white transition-all duration-300 hover:scale-105"
            aria-label={heroPaused ? "Continuar banner" : "Pausar banner"}
          >
            {heroPaused ? "▶" : "Ⅱ"}
          </button>

          <div className="flex items-center gap-3 rounded-full bg-black/55 px-4 py-2">
            {heroSlides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setActiveHero(index)}
                className={`h-3 rounded-full transition-all duration-300 ${
                  activeHero === index ? "w-10 bg-white md:w-11" : "w-3 bg-white/60"
                }`}
                aria-label={`Ir para ${slide.title}`}
              />
            ))}
          </div>
        </div>
      </section>

      <div className="fixed bottom-0 left-0 z-[90] flex h-[78px] w-full items-center justify-center border-t border-black/10 bg-white px-4 text-[#001e50] md:h-[62px] md:justify-end md:px-[82px]">
        <a
          href="#modelos"
          className="vw-float-build flex h-[48px] w-full max-w-[360px] items-center justify-center gap-3 rounded-full bg-[#48c7ef] px-5 text-center text-[13px] font-bold text-[#001e50] shadow-[0_10px_28px_rgba(72,199,239,0.35)] transition-all duration-300 hover:translate-y-[-2px] hover:scale-[1.02] hover:bg-[#67d8ff] sm:text-[14px] md:w-auto md:px-8"
        >
          <Car className="h-5 w-5 shrink-0" />
          Monte o seu Volkswagen
        </a>
      </div>

      <a
        href="#"
        aria-label="WhatsApp"
        className="fixed bottom-[92px] left-3 z-[100] flex h-[50px] w-[50px] items-center justify-center rounded-full bg-[#22d366] text-white shadow-xl transition-all duration-300 hover:scale-110 md:bottom-[22px] md:h-[52px] md:w-[52px]"
      >
        <MessageCircle className="h-7 w-7" />
      </a>

      <section
        id="modelos"
        className="bg-white px-4 pb-16 pt-16 sm:px-6 md:px-10 md:pb-24 md:pt-24 lg:px-[76px]"
      >
        <div className="mx-auto max-w-[1500px] text-center">
          <h2 className="vw-section-title text-[34px] font-bold leading-[1.05] tracking-[-0.04em] sm:text-[42px] md:text-[50px]">
            Encontre o seu Volkswagen
          </h2>

          <p className="mx-auto mt-6 max-w-[980px] text-[14px] leading-6 text-[#001e50]/80 md:mt-10">
            Conheça os modelos recomendados, modelos em destaque, veículos
            elétricos ou explore todos os modelos para escolher o Volkswagen 0 km
            que mais combina com você.
          </p>

          <h3 className="mt-10 text-[30px] font-bold leading-[1.05] tracking-[-0.04em] sm:text-[38px] md:mt-14 md:text-[48px]">
            Modelos Recomendados
          </h3>

          <button className="mt-4 text-[14px] underline transition-all duration-300 hover:text-[#0057c2]">
            Selecione um dos modelos para configurar
          </button>

          <div className="relative mt-10 overflow-hidden md:mt-14">
            <div
              key={`catalog-${catalogPage}-${dbVehicles.length}`}
              className={`vw-catalog-enter grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6 ${
                catalogDirection === "next"
                  ? "vw-catalog-next"
                  : "vw-catalog-prev"
              }`}
            >
              {visibleVehicles.map((vehicle, index) => (
                <Link
                  key={vehicle.slug}
                  href={`/volkswagen/builder?vehicle=${vehicle.slug}`}
                  className="group block rounded-2xl text-center transition-all duration-300 hover:bg-white"
                  style={{ animationDelay: `${index * 90}ms` }}
                >
                  <div className="flex h-[210px] items-end justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-[#eef2f5] to-white transition-all duration-500 group-hover:shadow-[0_18px_45px_rgba(0,30,80,0.12)] sm:h-[220px]">
                    {vehicle.image ? (
                      <img
                        src={vehicle.image}
                        alt={vehicle.name}
                        className="max-h-[200px] w-full object-contain px-3 transition-all duration-500 group-hover:scale-[1.06] group-hover:opacity-95 sm:max-h-[210px]"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center rounded-xl bg-[#eef2f5] text-xs font-bold uppercase text-[#001e50]/40">
                        Sem imagem
                      </div>
                    )}
                  </div>

                  <h4 className="mt-6 text-[22px] font-bold transition-all duration-300 group-hover:translate-y-[-2px] md:mt-8 md:text-[24px]">
                    {vehicle.name}
                  </h4>

                  {vehicle.badge && (
                    <div className="mx-auto mt-3 w-fit rounded-sm bg-[#19d3d3] px-3 py-1 text-[12px]">
                      ☆ {vehicle.badge}
                    </div>
                  )}

                  <div className="mt-5 flex translate-y-0 flex-col items-center gap-4 opacity-100 transition-all duration-300 md:translate-y-3 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100">
                    <span className="rounded-full bg-[#001e50] px-8 py-3 text-[15px] font-semibold text-white md:px-10 md:text-[16px]">
                      Monte o seu
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {totalCatalogPages > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevCatalogPage}
                  className="absolute left-0 top-[86px] flex h-[44px] w-[44px] items-center justify-center rounded-full bg-[#001e50] text-white shadow-lg transition-all duration-300 hover:scale-110 hover:bg-[#003b8f] md:left-2 md:top-[105px] md:h-[52px] md:w-[52px]"
                  aria-label="Carros anteriores"
                >
                  <ChevronLeft className="h-6 w-6 md:h-7 md:w-7" />
                </button>

                <button
                  type="button"
                  onClick={nextCatalogPage}
                  className="absolute right-0 top-[86px] flex h-[44px] w-[44px] items-center justify-center rounded-full bg-[#001e50] text-white shadow-lg transition-all duration-300 hover:scale-110 hover:bg-[#003b8f] md:right-2 md:top-[105px] md:h-[52px] md:w-[52px]"
                  aria-label="Próximos carros"
                >
                  <ChevronRight className="h-6 w-6 md:h-7 md:w-7" />
                </button>
              </>
            )}

            <div className="mt-10 flex justify-center gap-2">
              {Array.from({ length: totalCatalogPages }).map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    setCatalogDirection(index > catalogPage ? "next" : "prev");
                    setCatalogPage(index);
                  }}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    catalogPage === index
                      ? "w-8 bg-[#001e50]"
                      : "w-2 bg-[#001e50]/30"
                  }`}
                  aria-label={`Ir para página ${index + 1} do catálogo`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="sticky top-[58px] z-[70] h-[45px] overflow-x-auto border-b border-black/20 bg-white md:top-[46px]">
        <div className="mx-auto flex h-full max-w-[1500px] items-center gap-10 px-4 text-[13px] font-semibold sm:px-6 md:px-[76px]">
          <a
            href="#modelos"
            className="whitespace-nowrap border-b-2 border-[#001e50] py-[15px]"
          >
            Modelos
          </a>
        </div>
      </div>

      <section className="bg-white px-4 py-16 sm:px-6 md:px-10 md:py-24 lg:px-[76px]">
        <div className="mx-auto max-w-[1500px]">
          <h2 className="mb-12 text-center text-[28px] font-bold md:mb-28 md:text-[34px]">
            Modelos em Destaque
          </h2>

          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[390px_1fr] lg:gap-16">
            <div className="order-2 lg:order-1">
              <h3 className="text-[30px] font-light md:text-[34px]">
                Novo Tiguan R-Line
              </h3>

              <p className="mt-3 text-[17px] text-[#001e50]/70 md:text-[18px]">
                O SUV à altura da sua história
              </p>

              <p className="mt-8 max-w-[650px] text-[15px] leading-7 text-[#001e50]/80 lg:mt-16 lg:max-w-[430px]">
                O Novo Tiguan R-Line traduz o encontro entre sofisticação,
                performance e tecnologia de ponta. Com design marcante,
                motorização potente e soluções inteligentes de condução e
                segurança, ele eleva cada trajeto a uma experiência premium.
              </p>

              <button className="mt-8 rounded-full bg-[#001e50] px-7 py-3 text-[14px] font-semibold text-white transition-all duration-300 hover:translate-y-[-2px] hover:scale-[1.03] lg:mt-28">
                Conheça o Novo Tiguan R-Line
              </button>
            </div>

            <img
              src={VW_IMAGES.tiguanBanner}
              alt="Novo Tiguan R-Line"
              className="order-1 h-[280px] w-full rounded-2xl object-cover sm:h-[380px] md:h-[520px] lg:order-2 lg:h-[630px] lg:rounded-none"
            />
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-16 sm:px-6 md:px-10 md:py-20 lg:px-[76px]">
        <div className="mx-auto max-w-[1500px]">
          <div className="mx-auto max-w-[980px]">
            <h3 className="text-[30px] font-light md:text-[34px]">VW Tera</h3>

            <p className="mt-3 text-[17px] text-[#001e50]/70 md:text-[18px]">
              Você reconhece um ícone só pela chegada
            </p>

            <p className="mt-8 text-[15px] leading-7 text-[#001e50]/85 md:mt-10">
              Mais que um SUV, o Volkswagen Tera nasceu para se destacar.
              Produzido no Brasil, o veículo reúne design sofisticado, tecnologia
              inteligente e performance equilibrada para transformar cada trajeto
              em uma experiência marcada por presença, conforto e personalidade.
            </p>
          </div>

          <img
            src={VW_IMAGES.teraBanner}
            alt="VW Tera"
            className="mx-auto mt-10 h-[260px] w-full max-w-[1180px] rounded-2xl object-cover sm:h-[380px] md:mt-16 md:h-[520px] lg:h-[620px] lg:rounded-none"
          />
        </div>
      </section>

      <section className="bg-white px-4 py-16 sm:px-6 md:px-10 md:py-20 lg:px-[76px]">
        <div className="mx-auto max-w-[1500px]">
          <div className="relative overflow-hidden rounded-2xl bg-[#002b66] lg:min-h-[650px] lg:rounded-none">
            <div className="relative z-10 max-w-[620px] p-6 text-white sm:p-10 lg:absolute lg:left-[78px] lg:top-[80px] lg:max-w-[430px] lg:p-0">
              <h3 className="text-[32px] font-light md:text-[36px]">
                Golf GTI
              </h3>

              <p className="mt-3 text-[17px] text-white/80 md:text-[18px]">
                A lenda voltou
              </p>

              <p className="mt-8 text-[15px] leading-7 text-white/90 lg:mt-14">
                Com 245 cv de pura adrenalina, o ícone das ruas volta ao Brasil
                mais potente, tecnológico e exclusivo do que nunca. Mas o Golf
                GTI não conquista apenas pelo que entrega na pista. Seu design
                ousado apresenta elementos que reforçam sua personalidade
                inconfundível.
              </p>

              <button className="mt-8 rounded-full bg-white px-7 py-3 text-[14px] font-semibold text-[#001e50] transition-all duration-300 hover:translate-y-[-2px] hover:scale-[1.03] lg:mt-40">
                Conheça os detalhes do Golf GTI
              </button>
            </div>

            <img
              src={VW_IMAGES.golfBanner}
              alt="Golf GTI"
              className="relative z-0 h-[260px] w-full object-cover object-center sm:h-[380px] md:h-[500px] lg:absolute lg:right-[-64px] lg:top-[72px] lg:h-[520px] lg:w-[900px]"
            />
          </div>
        </div>
      </section>

      <footer className="border-t-2 border-[#001e50] bg-white px-4 pb-[120px] pt-14 text-[#001e50] sm:px-6 md:px-10 md:pt-20 lg:px-[76px]">
        <div className="mx-auto max-w-[1500px]">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-20">
            {footerColumns.map((column) => (
              <div key={column.title}>
                <h3 className="mb-5 text-[14px] font-bold md:mb-8">
                  {column.title}
                </h3>

                <div className="space-y-3 md:space-y-4">
                  {column.links.map((link) => (
                    <a
                      key={link}
                      href="#"
                      className="block text-[14px] leading-snug text-[#001e50]/90 hover:underline"
                    >
                      {link}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-wrap gap-3 text-[13px] leading-6 text-[#001e50] md:mt-16 md:gap-4">
            <a href="#">Informações Legais</a>
            <span>|</span>
            <a href="#">Aviso de Privacidade</a>
            <span>|</span>
            <a href="#">Política de Cookies</a>
            <span>|</span>
            <a href="#">Canal da Privacidade e Proteção de Dados</a>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }

        .vw-hero-enter {
          animation: vwHeroEnter 0.75s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .vw-hero-text {
          animation: vwHeroText 0.55s ease-out;
        }

        .vw-section-title {
          animation: vwSectionTitle 0.65s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .vw-float-build {
          animation: vwFloatBuild 0.65s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .vw-catalog-enter > a {
          opacity: 0;
          animation: vwCatalogCard 0.55s cubic-bezier(0.22, 1, 0.36, 1)
            forwards;
        }

        .vw-catalog-next {
          animation: vwCatalogNext 0.5s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .vw-catalog-prev {
          animation: vwCatalogPrev 0.5s cubic-bezier(0.22, 1, 0.36, 1);
        }

        @media (max-width: 767px) {
          .vw-catalog-next,
          .vw-catalog-prev {
            animation-duration: 0.35s;
          }
        }

        @keyframes vwHeroEnter {
          from {
            opacity: 0;
            transform: scale(1.035);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes vwHeroText {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes vwSectionTitle {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes vwFloatBuild {
          from {
            opacity: 0;
            transform: translateY(18px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes vwCatalogCard {
          from {
            opacity: 0;
            transform: translateY(24px) scale(0.975);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes vwCatalogNext {
          from {
            opacity: 0;
            transform: translateX(42px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes vwCatalogPrev {
          from {
            opacity: 0;
            transform: translateX(-42px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </main>
  );
}