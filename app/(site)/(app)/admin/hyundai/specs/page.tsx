"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type VehicleSpecRow = {
  id: string | number;
  model_name: string;
  slug: string;

  motor?: string | null;
  transmissao?: string | null;
  potencia_maxima?: string | null;
  torque_maximo?: string | null;
};

const BRAND = "hyundai";

function clsx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function chunkArray<T>(arr: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export default function HyundaiBulkSpecsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [rows, setRows] = useState<VehicleSpecRow[]>([]);
  const [originalMap, setOriginalMap] = useState<Record<string, VehicleSpecRow>>({});

  const [q, setQ] = useState("");
  const [onlyChanged, setOnlyChanged] = useState(false);

  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      setMsg(null);

      try {
        const { data, error } = await supabase
          .from("vehicles")
          .select("id, model_name, slug, motor, transmissao, potencia_maxima, torque_maximo, brand, is_visible")
          .eq("brand", BRAND)
          // .eq("is_visible", true)
          .order("model_name", { ascending: true });

        if (error) throw error;

        const clean = ((data || []) as any[]).map((v) => ({
          id: v.id,
          model_name: v.model_name ?? "",
          slug: v.slug ?? "",
          motor: v.motor ?? "",
          transmissao: v.transmissao ?? "",
          potencia_maxima: v.potencia_maxima ?? "",
          torque_maximo: v.torque_maximo ?? "",
        })) as VehicleSpecRow[];

        if (!mounted) return;

        setRows(clean);

        const map: Record<string, VehicleSpecRow> = {};
        for (const r of clean) map[String(r.id)] = { ...r };
        setOriginalMap(map);
      } catch (e: any) {
        if (!mounted) return;
        setMsg({ kind: "err", text: e?.message || "Falha ao carregar veículos." });
        setRows([]);
        setOriginalMap({});
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const changedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const r of rows) {
      const o = originalMap[String(r.id)];
      if (!o) continue;

      const norm = (x: any) => String(x ?? "").trim();
      const changed =
        norm(r.motor) !== norm(o.motor) ||
        norm(r.transmissao) !== norm(o.transmissao) ||
        norm(r.potencia_maxima) !== norm(o.potencia_maxima) ||
        norm(r.torque_maximo) !== norm(o.torque_maximo);

      if (changed) ids.add(String(r.id));
    }
    return ids;
  }, [rows, originalMap]);

  const filtered = useMemo(() => {
    const nq = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (onlyChanged && !changedIds.has(String(r.id))) return false;
      if (!nq) return true;
      return (
        r.model_name.toLowerCase().includes(nq) ||
        String(r.slug || "").toLowerCase().includes(nq) ||
        String(r.id).toLowerCase().includes(nq)
      );
    });
  }, [rows, q, onlyChanged, changedIds]);

  const changedCount = changedIds.size;

  const setField = (id: string | number, key: keyof VehicleSpecRow, value: string) => {
    setRows((prev) =>
      prev.map((r) => (String(r.id) === String(id) ? { ...r, [key]: value } : r))
    );
  };

  const resetRow = (id: string | number) => {
    const o = originalMap[String(id)];
    if (!o) return;
    setRows((prev) => prev.map((r) => (String(r.id) === String(id) ? { ...o } : r)));
  };

  const resetAll = () => {
    const list = Object.values(originalMap);
    setRows(list.map((x) => ({ ...x })));
    setMsg(null);
  };

  // ✅ FIX: update por id (não usa upsert, não insere, não quebra NOT NULL)
  const saveAll = async () => {
    setMsg(null);

    const toSave = rows
      .filter((r) => changedIds.has(String(r.id)))
      .map((r) => ({
        id: r.id,
        motor: String(r.motor ?? "").trim() || null,
        transmissao: String(r.transmissao ?? "").trim() || null,
        potencia_maxima: String(r.potencia_maxima ?? "").trim() || null,
        torque_maximo: String(r.torque_maximo ?? "").trim() || null,
      }));

    if (toSave.length === 0) {
      setMsg({ kind: "ok", text: "Nada para salvar (nenhuma alteração detectada)." });
      return;
    }

    setSaving(true);

    try {
      // ✅ salva em lotes (mais rápido e estável)
      const batches = chunkArray(toSave, 25);

      for (const batch of batches) {
        const results = await Promise.all(
          batch.map(async (r) => {
            const { error } = await supabase
              .from("vehicles")
              .update({
                motor: r.motor,
                transmissao: r.transmissao,
                potencia_maxima: r.potencia_maxima,
                torque_maximo: r.torque_maximo,
              })
              .eq("id", r.id);

            return error;
          })
        );

        const firstErr = results.find(Boolean);
        if (firstErr) throw firstErr;
      }

      // ✅ após salvar, atualiza o "originalMap"
      setOriginalMap(() => {
        const next: Record<string, VehicleSpecRow> = {};
        for (const r of rows) next[String(r.id)] = { ...r };
        return next;
      });

      setMsg({ kind: "ok", text: `Salvo com sucesso! Atualizados: ${toSave.length} veículos.` });
    } catch (e: any) {
      setMsg({ kind: "err", text: e?.message || "Falha ao salvar." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-zinc-900">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-extrabold tracking-tight">
            Hyundai — Edição em massa (Motor / Transmissão / Potência / Torque)
          </h1>
          <p className="text-sm text-zinc-600">
            Página temporária para preencher as fichas técnicas dos veículos Hyundai ({BRAND}). Depois de
            salvar tudo, você pode remover este arquivo.
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por nome, slug ou id…"
                className="w-full sm:w-[340px] rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
              />

              <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={onlyChanged}
                  onChange={(e) => setOnlyChanged(e.target.checked)}
                  className="h-4 w-4"
                />
                Mostrar só alterados ({changedCount})
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={resetAll}
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-zinc-100"
                disabled={loading || saving}
              >
                Desfazer tudo
              </button>

              <button
                type="button"
                onClick={saveAll}
                className={clsx(
                  "rounded-xl px-4 py-2 text-sm font-extrabold text-white",
                  saving ? "bg-zinc-400" : "bg-emerald-600 hover:bg-emerald-700"
                )}
                disabled={loading || saving}
              >
                {saving ? "Salvando…" : `Salvar tudo (${changedCount})`}
              </button>
            </div>
          </div>

          {msg && (
            <div
              className={clsx(
                "mt-3 rounded-xl border px-3 py-2 text-sm",
                msg.kind === "ok"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-red-200 bg-red-50 text-red-800"
              )}
            >
              {msg.text}
            </div>
          )}
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="text-sm text-zinc-500">Carregando veículos…</div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-zinc-200">
              <div className="max-h-[70vh] overflow-auto bg-white">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 z-10 bg-white">
                    <tr className="border-b border-zinc-200">
                      <th className="px-3 py-3 text-left text-[12px] font-extrabold uppercase tracking-wider text-zinc-600">
                        Veículo
                      </th>
                      <th className="px-3 py-3 text-left text-[12px] font-extrabold uppercase tracking-wider text-zinc-600">
                        Motor
                      </th>
                      <th className="px-3 py-3 text-left text-[12px] font-extrabold uppercase tracking-wider text-zinc-600">
                        Transmissão
                      </th>
                      <th className="px-3 py-3 text-left text-[12px] font-extrabold uppercase tracking-wider text-zinc-600">
                        Potência máxima
                      </th>
                      <th className="px-3 py-3 text-left text-[12px] font-extrabold uppercase tracking-wider text-zinc-600">
                        Torque máximo
                      </th>
                      <th className="px-3 py-3 text-right text-[12px] font-extrabold uppercase tracking-wider text-zinc-600">
                        Ações
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filtered.map((r) => {
                      const isChanged = changedIds.has(String(r.id));
                      return (
                        <tr
                          key={String(r.id)}
                          className={clsx(
                            "border-b border-zinc-100",
                            isChanged ? "bg-amber-50/60" : "bg-white"
                          )}
                        >
                          <td className="px-3 py-3 align-top">
                            <div className="text-sm font-extrabold text-zinc-900">{r.model_name}</div>
                            <div className="text-xs text-zinc-500">
                              id: {String(r.id)} • slug: {r.slug}
                            </div>
                          </td>

                          <td className="px-3 py-3 align-top">
                            <input
                              value={String(r.motor ?? "")}
                              onChange={(e) => setField(r.id, "motor", e.target.value)}
                              className="w-[240px] max-w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
                              placeholder="Ex: 1.0 TGDI / 2.0..."
                            />
                          </td>

                          <td className="px-3 py-3 align-top">
                            <input
                              value={String(r.transmissao ?? "")}
                              onChange={(e) => setField(r.id, "transmissao", e.target.value)}
                              className="w-[220px] max-w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
                              placeholder="Ex: Automática 6M..."
                            />
                          </td>

                          <td className="px-3 py-3 align-top">
                            <input
                              value={String(r.potencia_maxima ?? "")}
                              onChange={(e) => setField(r.id, "potencia_maxima", e.target.value)}
                              className="w-[240px] max-w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
                              placeholder="Ex: 120 cv (E) / 115 cv (G)..."
                            />
                          </td>

                          <td className="px-3 py-3 align-top">
                            <input
                              value={String(r.torque_maximo ?? "")}
                              onChange={(e) => setField(r.id, "torque_maximo", e.target.value)}
                              className="w-[240px] max-w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
                              placeholder="Ex: 17,5 kgfm..."
                            />
                          </td>

                          <td className="px-3 py-3 align-top text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => resetRow(r.id)}
                                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-bold hover:bg-zinc-100"
                                disabled={saving}
                              >
                                Desfazer
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-3 py-10 text-center text-sm text-zinc-500">
                          Nenhum veículo encontrado com esse filtro.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="bg-zinc-50 px-4 py-3 text-xs text-zinc-600">
                Dica: depois de preencher e salvar, remova este arquivo:
                <span className="font-mono"> app/admin/hyundai/specs/page.tsx</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}