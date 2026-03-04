"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import HyundaiBuilder, { VehicleRow } from "@/components/hyundai/HyundaiBuilder";

export default function HyundaiMonteOSueSlugPage() {
  const params = useParams();
  const router = useRouter();

  const slug = useMemo(() => {
    const raw = (params as any)?.slug;
    if (Array.isArray(raw)) return raw[0] ? String(raw[0]) : "";
    return raw ? String(raw) : "";
  }, [params]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [vehicle, setVehicle] = useState<VehicleRow | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      setErr(null);
      setVehicle(null);

      if (!slug) {
        setErr("Slug inválido.");
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("vehicles")
          .select(
            "id, model_name, slug, image_url, is_visible, price_start, versions, colors, spec_groups, highlights"
          )
          .eq("brand", "hyundai")
          .eq("slug", slug)
          .maybeSingle();

        if (error) throw error;
        if (!mounted) return;

        if (!data) {
          setErr("Veículo não encontrado.");
          return;
        }
        if ((data as any).is_visible === false) {
          setErr("Este veículo está oculto.");
          return;
        }

        setVehicle(data as any);
      } catch (e: any) {
        if (!mounted) return;
        setErr(e?.message || "Erro ao carregar veículo.");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white pt-24 px-6 text-sm font-bold text-gray-500">
      
      </div>
    );
  }

  if (err) {
    return (
      <div className="min-h-screen bg-white pt-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-sm font-bold text-red-600">{err}</div>
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold hover:bg-gray-50"
            >
              Voltar
            </button>
            <Link
              href="/hyundai/monte-o-seu"
              className="px-4 py-2 rounded-lg bg-black text-white text-sm font-semibold hover:bg-gray-800"
            >
              Ver modelos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!vehicle) return null;

  return (
    <HyundaiBuilder
      vehicle={vehicle}
      onFinish={(payload) => {
        // Próximo passo: mandar pra /hyundai/monte-o-seu/finalizar (se você quiser)
        console.log("Hyundai builder selection:", payload);
      }}
    />
  );
}