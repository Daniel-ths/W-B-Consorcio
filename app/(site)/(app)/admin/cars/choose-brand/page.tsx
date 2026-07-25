"use client";

import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CarFront,
  ChevronLeft,
} from "lucide-react";

type BrandKey = "chevrolet" | "hyundai" | "fiat" | "volkswagen" | "nissan";

const BRAND_UI: Record<
  BrandKey,
  {
    title: string;
    subtitle: string;
    accent: string;
    icon: any;
    tag: string;
    href: string;
  }
> = {
  chevrolet: {
    title: "Chevrolet",
    subtitle: "Cadastrar veículos e banners somente da Chevrolet",
    accent: "from-yellow-400 to-amber-500",
    icon: CarFront,
    tag: "Site Chevrolet",
    href: "/admin/cars/new",
  },
  hyundai: {
    title: "Hyundai",
    subtitle: "Cadastrar veículos e acessórios somente da Hyundai",
    accent: "from-sky-500 to-cyan-500",
    icon: Building2,
    tag: "Site Hyundai",
    href: "/admin/cars/hyundai/new",
  },
  fiat: {
    title: "Fiat",
    subtitle: "Cadastrar veículos, versões, cores, kits e acessórios da Fiat",
    accent: "from-red-500 to-rose-600",
    icon: CarFront,
    tag: "Site Fiat",
    href: "/admin/cars/fiat/new",
  },
  volkswagen: {
    title: "Volkswagen",
    subtitle:
      "Cadastrar veículos, versões, cores e configurações da Volkswagen",
    accent: "from-blue-800 to-cyan-500",
    icon: Building2,
    tag: "Site Volkswagen",
    href: "/admin/cars/volkswagen/new",
  },

  nissan: {
    title: "Nissan",
    subtitle:
      "Cadastrar veículos, versões, cores e configurações da Nissan",
    accent: "from-orange-500 to-red-500",
    icon: Building2,
    tag: "Site Nissan",
    href: "/admin/cars/nissan/new",
  },

};

export default function ChooseBrandToCreateCar() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 pb-24 pt-24">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between gap-3">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase text-slate-600 transition hover:text-black"
          >
            <ChevronLeft size={16} />
            Voltar
          </Link>

          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Cadastro por marca
            </p>
            <h1 className="text-xl font-black text-slate-900">
              Escolha onde cadastrar
            </h1>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {(Object.keys(BRAND_UI) as BrandKey[]).map((brand) => {
              const b = BRAND_UI[brand];
              const Icon = b.icon;

              return (
                <Link
                  key={brand}
                  href={b.href}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity group-hover:opacity-10 ${b.accent}`}
                  />

                  <div className="relative flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase text-slate-700">
                        {b.tag}
                      </span>

                      <h2 className="mt-3 flex items-center gap-2 text-lg font-black text-slate-900">
                        <Icon size={18} />
                        {b.title}
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        {b.subtitle}
                      </p>
                    </div>

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition-all group-hover:border-black group-hover:bg-black group-hover:text-white">
                      <ArrowRight size={18} />
                    </div>
                  </div>

                  <div className="relative mt-4 text-[11px] font-bold text-slate-500">
                    Você será levado ao painel da{" "}
                    <span className="text-slate-900">{b.title}</span>.
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="mt-6 text-[12px] font-medium text-slate-500">
            Dica: se existir conteúdo antigo sem marca, ele é tratado como{" "}
            <span className="font-black text-slate-900">Chevrolet</span>.
          </div>
        </div>
      </div>
    </div>
  );
}