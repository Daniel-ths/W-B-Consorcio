import Link from "next/link";
import { ArrowRight } from "lucide-react";

const BRANDS = [
  {
    name: "Chevrolet",
    slug: "chevrolet",
    description: "Acesse o site já existente da Chevrolet com catálogo completo.",
    image:
      "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=1600&auto=format&fit=crop",
  },
  {
    name: "Hyundai",
    slug: "hyundai",
    description: "Conheça a nova estrutura da Hyundai dentro do portal multimarca.",
    image:
      "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?q=80&w=1600&auto=format&fit=crop",
  },
];

export default function BrandSelectorPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white pt-28 pb-16 px-6">
      <div className="max-w-6xl mx-auto">
        <p className="text-sm uppercase tracking-[0.25em] text-zinc-400 mb-3">WB Consórcio</p>
        <h1 className="text-4xl md:text-6xl font-black uppercase">Escolha uma marca</h1>
        <p className="text-zinc-300 mt-4 max-w-2xl">
          O portal agora é multimarca. Selecione abaixo para navegar no site da montadora desejada.
        </p>

        <div className="grid md:grid-cols-2 gap-8 mt-12">
          {BRANDS.map((brand) => (
            <Link
              key={brand.slug}
              href={`/${brand.slug}`}
              className="group relative overflow-hidden rounded-3xl border border-zinc-700 min-h-[360px]"
            >
              <img
                src={brand.image}
                alt={brand.name}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />

              <div className="absolute bottom-0 p-8 z-10">
                <h2 className="text-3xl font-extrabold uppercase mb-3">{brand.name}</h2>
                <p className="text-zinc-200 mb-5">{brand.description}</p>
                <span className="inline-flex items-center gap-2 text-sm uppercase tracking-widest font-bold">
                  Entrar <ArrowRight size={16} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
