"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Vehicle = {
  id: number;
  model_name: string;
  slug: string;
  image_url?: string | null;
  price_start?: number | null;
};

const money = (v: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(Number(v || 0));

export default function HyundaiCatalogPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Vehicle[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const { data, error } = await supabase
          .from("vehicles")
          .select("id, model_name, slug, image_url, price_start, is_visible")
          .eq("brand", "hyundai")
          .eq("is_visible", true)
          .order("model_name", { ascending: true });

        if (error) throw error;
        setItems((data as any[]) || []);
      } catch (e: any) {
        setErr(e?.message || "Erro ao carregar catálogo.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white pt-24 px-6 text-sm font-bold text-gray-500">
        Carregando…
      </div>
    );
  }

  if (err) {
    return (
      <div className="min-h-screen bg-white pt-24 px-6">
        <div className="max-w-6xl mx-auto text-sm font-bold text-red-600">{err}</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white pt-24 px-6 pb-16">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl md:text-4xl font-black text-gray-900">Hyundai — Catálogo</h1>
        <p className="mt-2 text-sm text-gray-600">Selecione um modelo para montar o seu.</p>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((v) => (
            <Link
              key={v.id}
              href={`/hyundai/veiculos/${v.slug}`}
              className="rounded-2xl border border-black/10 hover:border-black/20 transition bg-white overflow-hidden"
            >
              <div className="h-44 bg-black/5 flex items-center justify-center">
                {v.image_url ? (
                  <img src={v.image_url} alt={v.model_name} className="h-full w-full object-cover" />
                ) : (
                  <div className="text-xs font-bold text-gray-500">Sem imagem</div>
                )}
              </div>
              <div className="p-4">
                <div className="font-extrabold text-gray-900">{v.model_name}</div>
                <div className="mt-1 text-sm text-gray-700">
                  {v.price_start ? money(v.price_start) : "Consulte preço"}
                </div>
                <div className="mt-3 text-xs font-bold text-[#00A3C8]">Montar o seu →</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}