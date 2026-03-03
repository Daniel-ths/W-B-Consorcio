"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ChevronRight } from "lucide-react";

/**
 * Página HUB: /eletricos
 * - Layout inspirado em https://www.chevrolet.com.br/eletrico
 * - Hero grande (pode trocar a imagem)
 * - Grid de cards com os elétricos + preço "a partir de"
 * - CTA leva pro seu fluxo (/vendedor/analise?...)
 *
 * Observação:
 * - Os preços abaixo foram pegos do menu de elétricos do site da Chevrolet. :contentReference[oaicite:1]{index=1}
 * - A imagem de hero usada é oficial (Captiva EV). :contentReference[oaicite:2]{index=2}
 */

const CONFIG = {
  pageTitle: "Elétricos Chevrolet",
  pageSubtitle: "Consórcio ou financiamento • Simule em minutos",
  ctaTop: "Simular agora",
  ctaCard: "Solicitar contato",

  // Hero (troque se quiser)
  hero: {
    titleSmall: "Linha Elétrica",
    titleBig: "Elétricos Chevrolet",
    subtitle: "Tecnologia, conforto e eficiência para a sua próxima escolha.",
    image:
      "https://www.chevrolet.com.br/content/dam/chevrolet/south-america/brazil/portuguese/index/visid/electric/electric-subcontent/universo-ev-captiva-desk.jpg?imwidth=1920", // :contentReference[oaicite:3]{index=3}
  },

  // Cards (preços do menu de elétricos do site) :contentReference[oaicite:4]{index=4}
  // Você pode trocar imagens por assets seus (Supabase).
  cars: [
    {
      name: "Spark EUV",
      year: "2026",
      priceFrom: "R$ 169.990*",
      // deixe uma imagem sua aqui se quiser
      image:
        "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/eletricos/imagem-01%20(1).avif",
      hrefOfficial: "https://www.chevrolet.com.br/eletrico/spark-euv",
      slug: "spark-euv",
    },
    {
      name: "Captiva EV",
      year: "2026",
      priceFrom: "R$ 199.990*",
      image:
        "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/eletricos/imagem-02.avif",
      hrefOfficial: "https://www.chevrolet.com.br/eletrico/captiva-ev",
      slug: "captiva-ev",
    },
    {
      name: "Equinox EV",
      year: "2026",
      priceFrom: "R$ 349.990*",
      image:
        "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/eletricos/imagem-06.avif",
      hrefOfficial: "https://www.chevrolet.com.br/eletrico/equinox-ev",
      slug: "equinox-ev",
    },
    {
      name: "Blazer EV RS",
      year: "2026",
      priceFrom: "R$ 503.190*",
      image:
        "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/eletricos/22/capa/imagem-balzer-ev.avif",
      hrefOfficial: "https://www.chevrolet.com.br/eletrico/blazer-ev",
      slug: "blazer-ev-rs",
    },
  ],
};

function buildAnaliseUrl(modelo: string, imagem: string) {
  const params = new URLSearchParams({
    modelo,
    valor: "0",
    entrada: "0",
    imagem,
  });
  return `/vendedor/analise?${params.toString()}`;
}

export default function EletricosHubPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* TOP BAR */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto px-4 md:px-10 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-700 hover:text-black"
          >
            <ArrowLeft size={16} /> Voltar
          </Link>

          <button
            onClick={() => router.push(buildAnaliseUrl(CONFIG.pageTitle, CONFIG.hero.image))}
            className="h-9 px-4 rounded-lg bg-[#0b4b9a] text-white text-xs font-black uppercase tracking-widest hover:bg-[#093e80] transition-colors flex items-center gap-2"
          >
            {CONFIG.ctaTop} <ArrowRight size={14} />
          </button>
        </div>
      </header>

      {/* HERO */}
      <section className="relative">
        <div className="relative w-full h-[520px] md:h-[640px] overflow-hidden">
          <img
            src={CONFIG.hero.image}
            alt={CONFIG.hero.titleBig}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 to-transparent" />

          <div className="absolute top-10 left-6 md:left-12 text-white max-w-[720px]">
            <p className="text-xs md:text-sm font-black uppercase tracking-widest opacity-90">
              {CONFIG.hero.titleSmall}
            </p>
            <h1 className="mt-2 text-4xl md:text-6xl font-black tracking-tight">
              {CONFIG.hero.titleBig}
            </h1>
            <p className="mt-3 text-sm md:text-base text-white/85">{CONFIG.hero.subtitle}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={() => router.push(buildAnaliseUrl(CONFIG.pageTitle, CONFIG.hero.image))}
                className="h-11 px-6 rounded-lg bg-[#0b4b9a] text-white text-xs font-black uppercase tracking-widest hover:bg-[#093e80] transition-colors"
              >
                {CONFIG.ctaTop}
              </button>

            </div>
          </div>
        </div>
      </section>

      {/* LISTA / CARDS */}
      <section className="bg-white">
        <div className="max-w-[1400px] mx-auto px-4 md:px-10 py-14">
          <div className="flex items-end justify-between gap-6 flex-wrap">
            <div>
              <p className="text-sm text-gray-500">Modelos</p>
              <h2 className="mt-2 text-3xl md:text-4xl font-black tracking-tight">
                Escolha seu elétrico
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Mesma experiência em todas as páginas individuais: galeria, configurador exterior/interior e
                CTA para simulação.
              </p>
            </div>

            <div className="text-right">
<p className="text-xs text-gray-500">
  *Valores sujeitos a alteração sem aviso prévio.
</p>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {CONFIG.cars.map((car) => (
              <div
                key={car.slug}
                className="group rounded-2xl border border-gray-200 overflow-hidden bg-white hover:shadow-[0_20px_60px_-30px_rgba(0,0,0,0.35)] transition-shadow"
              >
                <div className="relative h-[220px] bg-gray-100 overflow-hidden">
                  <img
                    src={car.image}
                    alt={car.name}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/95 border border-gray-200 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-gray-900">
                      {car.year}
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <p className="text-sm font-black">{car.name}</p>

                  <p className="mt-2 text-xs text-gray-500">A partir de</p>
                  <p className="mt-1 text-lg font-black text-gray-900">{car.priceFrom}</p>

                  <div className="mt-5 flex flex-col gap-2">
                    <button
                      onClick={() => router.push(buildAnaliseUrl(car.name, car.image))}
                      className="h-10 w-full rounded-lg bg-[#0b4b9a] text-white text-xs font-black uppercase tracking-widest hover:bg-[#093e80] transition-colors"
                    >
                      {CONFIG.ctaCard}
                    </button>

                    <a
                      href={car.hrefOfficial}
                      target="_blank"
                      rel="noreferrer"
                      className="h-10 w-full rounded-lg border border-gray-200 text-gray-700 text-xs font-black uppercase tracking-widest hover:border-gray-300 hover:text-gray-900 transition-colors inline-flex items-center justify-center gap-2"
                    >
                      Ver no site Chevrolet <ChevronRight size={16} />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* FOOTER HELP TEXT */}
          <div className="mt-12 rounded-2xl border border-gray-200 bg-white p-6">
            <p className="text-sm font-black text-gray-900">Próximo passo</p>
            <p className="mt-2 text-sm text-gray-600">
              Se você quiser, eu já te entrego também as <span className="font-black">páginas individuais</span>{" "}
              (Spark EUV / Captiva EV / Equinox EV / Blazer EV RS) todas no mesmo padrão do configurador
              que você fez, só mudando os configs e as imagens.
            </p>
          </div>
        </div>
      </section>

      {/* Spacer pro CTA fixo (se você usar um global) */}
      <div className="h-6" />
    </div>
  );
}