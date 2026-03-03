"use client";

import Link from "next/link";
import { ArrowRight, Building2, CarFront, ChevronLeft } from "lucide-react";

type BrandKey = "chevrolet" | "hyundai";

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
    href: "/admin/cars/new", // mantém seu admin principal
  },
  hyundai: {
    title: "Hyundai",
    subtitle: "Cadastrar veículos e acessórios somente da Hyundai",
    accent: "from-sky-500 to-cyan-500",
    icon: Building2,
    tag: "Site Hyundai",
    href: "/admin/hyundai", // ✅ AGORA APONTA PRA SUA NOVA PÁGINA
  },
};

export default function ChooseBrandToCreateCar() {
  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-24 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase text-slate-600 hover:text-black"
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

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(Object.keys(BRAND_UI) as BrandKey[]).map((brand) => {
              const b = BRAND_UI[brand];
              const Icon = b.icon;

              return (
                <Link
                  key={brand}
                  href={b.href} // ✅ AGORA USA O HREF DEFINIDO
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-md transition-all"
                >
                  <div
                    className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-br ${b.accent}`}
                  />
                  <div className="relative flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase border border-slate-200 bg-slate-50 text-slate-700">
                        {b.tag}
                      </span>

                      <h2 className="mt-3 text-lg font-black text-slate-900 flex items-center gap-2">
                        <Icon size={18} />
                        {b.title}
                      </h2>

                      <p className="text-sm text-slate-500 mt-1">
                        {b.subtitle}
                      </p>
                    </div>

                    <div className="shrink-0 w-10 h-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-700 group-hover:bg-black group-hover:text-white group-hover:border-black transition-all">
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

          <div className="mt-6 text-[12px] text-slate-500 font-medium">
            Dica: se existir conteúdo antigo sem marca, ele é tratado como{" "}
            <span className="font-black text-slate-900">Chevrolet</span>.
          </div>
        </div>
      </div>
    </div>
  );
}