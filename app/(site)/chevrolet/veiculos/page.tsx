"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type VehicleCard = {
  id: number;
  model_name: string;
  slug: string;
  image_url?: string | null;
  price_start?: number | null;
  is_visible?: boolean | null;
};

const money = (v: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(Number(v || 0));

export default function ChevroletCatalogPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [cars, setCars] = useState<VehicleCard[]>([]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      setErr(null);

      try {
        const { data, error } = await supabase
          .from("vehicles")
          .select("id, model_name, slug, image_url, price_start, is_visible")
          .eq("brand", "chevrolet")
          .neq("is_visible", false)
          .order("model_name", { ascending: true });

        if (error) throw error;
        if (!mounted) return;

        setCars(Array.isArray(data) ? (data as VehicleCard[]) : []);
      } catch (e: any) {
        if (!mounted) return;
        setErr(e?.message || "Erro ao carregar catálogo.");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white pt-24 px-6 text-sm font-bold text-gray-500">
        
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
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto pt-10 sm:pt-14 px-6 pb-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-[0.18em]">
              Catálogo
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-semibold text-gray-900">
              Chevrolet
            </h1>
            <p className="mt-2 text-sm text-gray-600">{cars.length} veículo(s)</p>
          </div>

          <Link href="/chevrolet" className="text-sm font-semibold text-gray-700 hover:underline">
            Voltar para Home
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {cars.map((v) => (
            <Link
              key={v.id}
              href={`/chevrolet/veiculos/${v.slug}`}
              className="group rounded-2xl border border-black/10 bg-white overflow-hidden hover:shadow-sm transition"
            >
              <div className="h-44 bg-gray-50 flex items-center justify-center">
                {v.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={v.image_url}
                    alt={v.model_name}
                    className="h-full w-full object-contain p-4"
                    draggable={false}
                  />
                ) : (
                  <div className="text-xs font-bold text-gray-400">Sem imagem</div>
                )}
              </div>

              <div className="p-4">
                <div className="text-sm font-semibold text-gray-900">{v.model_name}</div>
                <div className="mt-1 text-xs text-gray-600">
                  A partir de{" "}
                  <span className="font-semibold text-gray-900">
                    {money(v.price_start || 0)}
                  </span>
                </div>
                <div className="mt-3 text-xs font-semibold text-gray-700 group-hover:underline">
                  Ver detalhes →
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}