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
        .select("model_name, slug, catalog_cover_url, image_url, is_visible")
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
    <main className="min-h-screen bg-white text-[#001e50]">
      <header className="fixed left-0 top-0 z-[80] h-[46px] w-full bg-black/95 text-white">
        <div className="flex h-full items-center justify-between px-[76px]">
          <div className="flex h-full items-center gap-7">
            <img
              src={VW_IMAGES.logo}
              alt="Volkswagen"
              className="h-[24px] w-auto"
            />

            <button className="text-[13px] font-bold transition-all duration-300 hover:scale-[1.04] hover:text-[#7fd8ff]">
              Menu
            </button>

            <a
              href="#modelos"
              className="text-[14px] font-bold transition-all duration-300 hover:scale-[1.04] hover:text-[#7fd8ff]"
            >
              Configure seu novo Volkswagen
            </a>

            <a
              href="#modelos"
              className="text-[14px] font-bold transition-all duration-300 hover:scale-[1.04] hover:text-[#7fd8ff]"
            >
              Monte seu Volkswagen
            </a>
          </div>
        </div>
      </header>

      <section className="relative h-[calc(100vh-46px)] min-h-[720px] overflow-hidden bg-black pt-[46px]">
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
          className="vw-hero-enter absolute inset-0 h-full w-full object-cover"
        />

        <div className="absolute inset-0 z-[2] bg-black/48" />
        <div className="absolute inset-0 z-[3] bg-[linear-gradient(to_right,rgba(0,0,0,0.35),rgba(0,0,0,0.10),rgba(0,0,0,0.20))]" />
        <div className="absolute inset-x-0 bottom-0 z-[4] h-[320px] bg-gradient-to-t from-black via-black/75 to-transparent" />

        <div
          key={`${currentHero.id}-text`}
          className="vw-hero-text absolute bottom-[110px] left-[76px] z-10 text-white"
        >
          <h1 className="text-[42px] font-light leading-none">
            {currentHero.title}
          </h1>
          <p className="mt-5 text-[15px] font-semibold">
            {currentHero.subtitle}
          </p>

          <a
            href="#modelos"
            className="mt-8 inline-flex rounded-full bg-white px-9 py-3 text-[14px] font-semibold text-[#001e50] transition-all duration-300 hover:translate-y-[-2px] hover:scale-[1.03] hover:bg-[#e8f7ff]"
          >
            Conheça
          </a>
        </div>

        <div className="absolute bottom-[52px] right-[90px] z-10 flex items-center gap-4">
          <button
            type="button"
            onClick={() => setHeroPaused(!heroPaused)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white transition-all duration-300 hover:scale-105"
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
                  activeHero === index ? "w-11 bg-white" : "w-3 bg-white/60"
                }`}
                aria-label={`Ir para ${slide.title}`}
              />
            ))}
          </div>
        </div>
      </section>

      <div className="fixed bottom-0 left-0 z-[90] flex h-[62px] w-full items-center justify-end gap-8 border-t border-black/10 bg-white px-[82px] text-[#001e50]">
        <a
          href="#modelos"
          className="vw-float-build flex h-[46px] items-center gap-3 rounded-full bg-[#48c7ef] px-8 text-[14px] font-bold text-[#001e50] shadow-[0_10px_28px_rgba(72,199,239,0.35)] transition-all duration-300 hover:translate-y-[-2px] hover:scale-[1.04] hover:bg-[#67d8ff]"
        >
          <Car className="h-5 w-5" />
          Monte o seu Volkswagen
        </a>
      </div>

      <a
        href="#"
        className="fixed bottom-[22px] left-3 z-[100] flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#22d366] text-white shadow-xl transition-all duration-300 hover:scale-110"
      >
        <MessageCircle className="h-7 w-7" />
      </a>

      <section id="modelos" className="bg-white px-[76px] pb-24 pt-24">
        <div className="mx-auto max-w-[1500px] text-center">
          <h2 className="vw-section-title text-[50px] font-bold tracking-[-0.03em]">
            Encontre o seu Volkswagen
          </h2>

          <p className="mx-auto mt-10 max-w-[980px] text-[14px] leading-6 text-[#001e50]/80">
            Conheça os modelos recomendados, modelos em destaque, veículos elétricos ou
            explore todos os modelos para escolher o Volkswagen 0 km que mais combina com você.
          </p>

          <h3 className="mt-14 text-[48px] font-bold tracking-[-0.03em]">
            Modelos Recomendados
          </h3>

          <button className="mt-4 text-[14px] underline transition-all duration-300 hover:text-[#0057c2]">
            Selecione um dos modelos para configurar
          </button>

          <div className="relative mt-14 overflow-hidden">
            <div
              key={`catalog-${catalogPage}-${dbVehicles.length}`}
              className={`vw-catalog-enter grid grid-cols-4 gap-6 ${
                catalogDirection === "next"
                  ? "vw-catalog-next"
                  : "vw-catalog-prev"
              }`}
            >
              {visibleVehicles.map((vehicle, index) => (
                <Link
                  key={vehicle.slug}
                  href={`/volkswagen/builder?vehicle=${vehicle.slug}`}
                  className="group block text-center"
                  style={{ animationDelay: `${index * 90}ms` }}
                >
                  <div className="flex h-[220px] items-end justify-center overflow-hidden bg-gradient-to-b from-[#eef2f5] to-white transition-all duration-500 group-hover:shadow-[0_18px_45px_rgba(0,30,80,0.12)]">
                    {vehicle.image ? (
                      <img
                        src={vehicle.image}
                        alt={vehicle.name}
                        className="max-h-[210px] w-full object-contain transition-all duration-500 group-hover:scale-[1.06] group-hover:opacity-95"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center rounded-xl bg-[#eef2f5] text-xs font-bold uppercase text-[#001e50]/40">
                        Sem imagem
                      </div>
                    )}
                  </div>

                  <h4 className="mt-8 text-[24px] font-bold transition-all duration-300 group-hover:translate-y-[-2px]">
                    {vehicle.name}
                  </h4>

                  {vehicle.badge && (
                    <div className="mx-auto mt-3 w-fit rounded-sm bg-[#19d3d3] px-3 py-1 text-[12px]">
                      ☆ {vehicle.badge}
                    </div>
                  )}

                  <div className="mt-6 flex translate-y-3 flex-col items-center gap-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    <span className="rounded-full bg-[#001e50] px-10 py-3 text-[16px] font-semibold text-white">
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
                  className="absolute left-2 top-[105px] flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#001e50] text-white transition-all duration-300 hover:scale-110 hover:bg-[#003b8f]"
                  aria-label="Carros anteriores"
                >
                  <ChevronLeft className="h-7 w-7" />
                </button>

                <button
                  type="button"
                  onClick={nextCatalogPage}
                  className="absolute right-2 top-[105px] flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#001e50] text-white transition-all duration-300 hover:scale-110 hover:bg-[#003b8f]"
                  aria-label="Próximos carros"
                >
                  <ChevronRight className="h-7 w-7" />
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

      <div className="sticky top-[46px] z-[70] h-[45px] border-b border-black/20 bg-white">
        <div className="mx-auto flex h-full max-w-[1500px] items-center gap-10 px-[76px] text-[13px] font-semibold">
          <a href="#modelos" className="border-b-2 border-[#001e50] py-[15px]">
            Modelos
          </a>
        </div>
      </div>

      <section className="bg-white px-[76px] py-24">
        <div className="mx-auto max-w-[1500px]">
          <h2 className="mb-28 text-center text-[34px] font-bold">
            Modelos em Destaque
          </h2>

          <div className="grid grid-cols-[390px_1fr] items-center gap-16">
            <div>
              <h3 className="text-[34px] font-light">Novo Tiguan R-Line</h3>
              <p className="mt-3 text-[18px] text-[#001e50]/70">
                O SUV à altura da sua história
              </p>

              <p className="mt-16 max-w-[430px] text-[15px] leading-7 text-[#001e50]/80">
                O Novo Tiguan R-Line traduz o encontro entre sofisticação,
                performance e tecnologia de ponta. Com design marcante,
                motorização potente e soluções inteligentes de condução e
                segurança, ele eleva cada trajeto a uma experiência premium.
              </p>

              <button className="mt-28 rounded-full bg-[#001e50] px-8 py-3 text-[14px] font-semibold text-white transition-all duration-300 hover:translate-y-[-2px] hover:scale-[1.03]">
                Conheça o Novo Tiguan R-Line
              </button>
            </div>

            <img
              src={VW_IMAGES.tiguanBanner}
              alt="Novo Tiguan R-Line"
              className="h-[630px] w-full object-cover"
            />
          </div>
        </div>
      </section>

      <section className="bg-white px-[76px] py-20">
        <div className="mx-auto max-w-[1500px]">
          <div className="mx-auto max-w-[980px]">
            <h3 className="text-[34px] font-light">VW Tera</h3>
            <p className="mt-3 text-[18px] text-[#001e50]/70">
              Você reconhece um ícone só pela chegada
            </p>

            <p className="mt-10 text-[15px] leading-7 text-[#001e50]/85">
              Mais que um SUV, o Volkswagen Tera nasceu para se destacar.
              Produzido no Brasil, o veículo reúne design sofisticado, tecnologia
              inteligente e performance equilibrada para transformar cada trajeto
              em uma experiência marcada por presença, conforto e personalidade.
            </p>
          </div>

          <img
            src={VW_IMAGES.teraBanner}
            alt="VW Tera"
            className="mx-auto mt-16 h-[620px] w-[1180px] object-cover"
          />
        </div>
      </section>

      <section className="bg-white px-[76px] py-20">
        <div className="mx-auto max-w-[1500px]">
          <div className="relative min-h-[650px] bg-[#002b66]">
            <div className="absolute left-[78px] top-[80px] z-10 max-w-[430px] text-white">
              <h3 className="text-[36px] font-light">Golf GTI</h3>
              <p className="mt-3 text-[18px] text-white/80">A lenda voltou</p>

              <p className="mt-14 text-[15px] leading-7 text-white/90">
                Com 245 cv de pura adrenalina, o ícone das ruas volta ao Brasil
                mais potente, tecnológico e exclusivo do que nunca. Mas o Golf
                GTI não conquista apenas pelo que entrega na pista. Seu design
                ousado apresenta elementos que reforçam sua personalidade
                inconfundível.
              </p>

              <button className="mt-40 rounded-full bg-white px-8 py-3 text-[14px] font-semibold text-[#001e50] transition-all duration-300 hover:translate-y-[-2px] hover:scale-[1.03]">
                Conheça os detalhes do Golf GTI
              </button>
            </div>

            <img
              src={VW_IMAGES.golfBanner}
              alt="Golf GTI"
              className="absolute right-[-64px] top-[72px] h-[520px] w-[900px] object-cover"
            />
          </div>
        </div>
      </section>

      <footer className="border-t-2 border-[#001e50] bg-white px-[76px] pb-[120px] pt-20 text-[#001e50]">
        <div className="mx-auto max-w-[1500px]">
          <div className="grid grid-cols-4 gap-20">
            {footerColumns.map((column) => (
              <div key={column.title}>
                <h3 className="mb-8 text-[14px] font-bold">{column.title}</h3>

                <div className="space-y-4">
                  {column.links.map((link) => (
                    <a
                      key={link}
                      href="#"
                      className="block text-[14px] leading-none text-[#001e50]/90 hover:underline"
                    >
                      {link}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 flex flex-wrap gap-4 text-[13px] text-[#001e50]">
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