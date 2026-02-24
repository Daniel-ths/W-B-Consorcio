"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Save,
  Search,
  Percent,
  Wrench,
  CarFront,
  BadgeCheck,
  AlertTriangle,
} from "lucide-react";

type Tab = "VEICULOS" | "ITENS_DOS_VEICULOS" | "ACESSORIOS_TABELA" | "RODAS_TABELA";

type VehicleRow = {
  id: number;
  model_name: string;
  price_start: number | null;
  exterior_colors?: any[] | null;
  wheels?: any[] | null;
  seat_types?: any[] | null;
  accessories?: any[] | null;
};

type SimpleItemRow = {
  id: any;
  name?: string | null;
  price?: number | null;
  type?: string | null;
  image?: string | null;
};

const brl = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(n || 0));

const formatMoneyInput = (val: string) => {
  const numbers = String(val || "").replace(/\D/g, "");
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(numbers) / 100);
};

const parseMoney = (val: string) => {
  if (!val) return 0;
  return Number(String(val).replace(/[^0-9,-]+/g, "").replace(",", "."));
};

const safeNum = (v: any) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

function applyOp(current: number, op: "SOMAR" | "SUBTRAIR" | "MULTIPLICAR", value: number) {
  if (op === "SOMAR") return current + value;
  if (op === "SUBTRAIR") return Math.max(0, current - value);
  return Math.max(0, current * value);
}

// ======================
// COMPONENTES DE LINHA
// ======================
function VehiclePriceRow({
  v,
  savingKey,
  onSave,
}: {
  v: VehicleRow;
  savingKey: string | null;
  onSave: (id: number, priceFormatted: string) => Promise<void>;
}) {
  const key = `veh:${v.id}`;
  const [local, setLocal] = useState(formatMoneyInput(String(safeNum(v.price_start)) + "00"));

  useEffect(() => {
    setLocal(formatMoneyInput(String(safeNum(v.price_start)) + "00"));
  }, [v.price_start]);

  return (
    <tr>
      <td className="px-4 py-3 text-xs font-black text-slate-700">{v.id}</td>
      <td className="px-4 py-3">
        <div className="text-sm font-black text-slate-900">{v.model_name}</div>
        <div className="text-[11px] text-slate-500 font-bold">{brl(safeNum(v.price_start))}</div>
      </td>
      <td className="px-4 py-3">
        <input
          value={local}
          onChange={(e) => setLocal(formatMoneyInput(e.target.value))}
          className="w-full md:w-64 h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-black"
        />
      </td>
      <td className="px-4 py-3 text-right">
        <button
          onClick={() => onSave(v.id, local)}
          disabled={savingKey === key}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-black text-white text-xs font-black uppercase hover:bg-slate-800 disabled:opacity-60"
        >
          {savingKey === key ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Salvar
        </button>
      </td>
    </tr>
  );
}

function TableItemRow({
  row,
  table,
  savingKey,
  onSave,
}: {
  row: SimpleItemRow;
  table: "accessories" | "wheels";
  savingKey: string | null;
  onSave: (table: "accessories" | "wheels", row: SimpleItemRow, priceFormatted: string) => Promise<void>;
}) {
  const key = `${table}:${row.id}`;
  const [local, setLocal] = useState(formatMoneyInput(String(safeNum(row.price)) + "00"));

  useEffect(() => {
    setLocal(formatMoneyInput(String(safeNum(row.price)) + "00"));
  }, [row.price]);

  return (
    <tr>
      <td className="px-4 py-3 text-xs font-black text-slate-700">{String(row.id)}</td>
      <td className="px-4 py-3">
        <div className="text-sm font-black text-slate-900">{row.name || "—"}</div>
        <div className="text-[11px] text-slate-500 font-bold">{brl(safeNum(row.price))}</div>
      </td>
      <td className="px-4 py-3">
        <input
          value={local}
          onChange={(e) => setLocal(formatMoneyInput(e.target.value))}
          className="w-full md:w-64 h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-black"
        />
      </td>
      <td className="px-4 py-3 text-right">
        <button
          onClick={() => onSave(table, row, local)}
          disabled={savingKey === key}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-black text-white text-xs font-black uppercase hover:bg-slate-800 disabled:opacity-60"
        >
          {savingKey === key ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Salvar
        </button>
      </td>
    </tr>
  );
}

// ======================
// PÁGINA
// ======================
export default function AlterarValorPage() {
  const [tab, setTab] = useState<Tab>("VEICULOS");

  const [vehicles, setVehicles] = useState<VehicleRow[]>([]);
  const [accessoriesTable, setAccessoriesTable] = useState<SimpleItemRow[]>([]);
  const [wheelsTable, setWheelsTable] = useState<SimpleItemRow[]>([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  const [q, setQ] = useState("");

  // MASS UPDATE (VEÍCULOS)
  const [massMode, setMassMode] = useState<"VALOR" | "PERCENT">("PERCENT");
  const [massOp, setMassOp] = useState<"SOMAR" | "SUBTRAIR" | "MULTIPLICAR">("MULTIPLICAR");
  const [massValue, setMassValue] = useState("10"); // percent ou valor

  // MASS UPDATE (ITENS JSON DOS VEÍCULOS)
  const [jsonMode, setJsonMode] = useState<"VALOR" | "PERCENT">("PERCENT");
  const [jsonOp, setJsonOp] = useState<"SOMAR" | "SUBTRAIR" | "MULTIPLICAR">("MULTIPLICAR");
  const [jsonValue, setJsonValue] = useState("10");

  const fetchAll = async () => {
    setLoading(true);
    try {
      const { data: vData, error: vErr } = await supabase
        .from("vehicles")
        .select("id, model_name, price_start, exterior_colors, wheels, seat_types, accessories")
        .order("created_at", { ascending: false });

      if (vErr) throw vErr;
      setVehicles((vData as any[]) || []);

      // tabelas globais (se existirem)
      const { data: aData, error: aErr } = await supabase.from("accessories").select("*").order("created_at", { ascending: false });
      if (!aErr) setAccessoriesTable((aData as any[]) || []);

      const { data: wData, error: wErr } = await supabase.from("wheels").select("*").order("created_at", { ascending: false });
      if (!wErr) setWheelsTable((wData as any[]) || []);
    } catch (e: any) {
      alert("Erro ao carregar dados: " + (e?.message || "desconhecido"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const filteredVehicles = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return vehicles;
    return vehicles.filter((v) => String(v.model_name || "").toLowerCase().includes(term) || String(v.id).includes(term));
  }, [vehicles, q]);

  const filteredAccessories = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return accessoriesTable;
    return accessoriesTable.filter((a) => String(a.name || "").toLowerCase().includes(term) || String(a.id).includes(term));
  }, [accessoriesTable, q]);

  const filteredWheels = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return wheelsTable;
    return wheelsTable.filter((w) => String(w.name || "").toLowerCase().includes(term) || String(w.id).includes(term));
  }, [wheelsTable, q]);

  const updateVehiclePrice = async (id: number, priceFormatted: string) => {
    setSaving(`veh:${id}`);
    try {
      const newPrice = parseMoney(priceFormatted);
      const { error } = await supabase.from("vehicles").update({ price_start: newPrice }).eq("id", id);
      if (error) throw error;
      setVehicles((prev) => prev.map((v) => (v.id === id ? { ...v, price_start: newPrice } : v)));
    } catch (e: any) {
      alert("Erro ao salvar veículo: " + (e?.message || "desconhecido"));
    } finally {
      setSaving(null);
    }
  };

  const massUpdateVehicles = async () => {
    if (!confirm("Aplicar ajuste em massa no PREÇO BASE de TODOS os veículos filtrados?")) return;

    const raw = String(massValue || "").replace(",", ".");
    const base = Number(raw);
    if (!Number.isFinite(base)) return alert("Valor inválido.");

    const factor =
      massMode === "PERCENT"
        ? massOp === "MULTIPLICAR"
          ? 1 + base / 100
          : base / 100
        : base;

    setLoading(true);
    try {
      for (const v of filteredVehicles) {
        const current = safeNum(v.price_start);
        let next = current;

        if (massMode === "PERCENT") {
          if (massOp === "MULTIPLICAR") next = applyOp(current, "MULTIPLICAR", factor);
          else if (massOp === "SOMAR") next = applyOp(current, "SOMAR", current * factor);
          else next = applyOp(current, "SUBTRAIR", current * factor);
        } else {
          next = applyOp(current, massOp, factor);
        }

        const { error } = await supabase.from("vehicles").update({ price_start: next }).eq("id", v.id);
        if (error) throw error;

        setVehicles((prev) => prev.map((x) => (x.id === v.id ? { ...x, price_start: next } : x)));
      }

      alert("Ajuste em massa concluído!");
    } catch (e: any) {
      alert("Erro no ajuste em massa: " + (e?.message || "desconhecido"));
    } finally {
      setLoading(false);
    }
  };

  const massUpdateVehicleJsonItems = async () => {
    if (!confirm("Aplicar ajuste em massa nos ITENS (cores/rodas/bancos/acessórios) dentro dos veículos filtrados?")) return;

    const raw = String(jsonValue || "").replace(",", ".");
    const base = Number(raw);
    if (!Number.isFinite(base)) return alert("Valor inválido.");

    const factor =
      jsonMode === "PERCENT"
        ? jsonOp === "MULTIPLICAR"
          ? 1 + base / 100
          : base / 100
        : base;

    const patchList = (arr: any[] | null | undefined) => {
      if (!Array.isArray(arr)) return arr;
      return arr.map((it) => {
        const current = safeNum(it?.price);
        let next = current;

        if (jsonMode === "PERCENT") {
          if (jsonOp === "MULTIPLICAR") next = applyOp(current, "MULTIPLICAR", factor);
          else if (jsonOp === "SOMAR") next = applyOp(current, "SOMAR", current * factor);
          else next = applyOp(current, "SUBTRAIR", current * factor);
        } else {
          next = applyOp(current, jsonOp, factor);
        }

        return { ...it, price: next };
      });
    };

    setLoading(true);
    try {
      for (const v of filteredVehicles) {
        const payload: any = {
          exterior_colors: patchList(v.exterior_colors),
          wheels: patchList(v.wheels),
          seat_types: patchList(v.seat_types),
          accessories: patchList(v.accessories),
        };

        const { error } = await supabase.from("vehicles").update(payload).eq("id", v.id);
        if (error) throw error;

        setVehicles((prev) => prev.map((x) => (x.id === v.id ? { ...x, ...payload } : x)));
      }

      alert("Ajuste em massa nos itens concluído!");
    } catch (e: any) {
      alert("Erro no ajuste em massa dos itens: " + (e?.message || "desconhecido"));
    } finally {
      setLoading(false);
    }
  };

  const updateTableItemPrice = async (table: "accessories" | "wheels", row: SimpleItemRow, priceFormatted: string) => {
    setSaving(`${table}:${row.id}`);
    try {
      const next = parseMoney(priceFormatted);

      const { error } = await supabase.from(table).update({ price: next }).eq("id", row.id);
      if (error) {
        alert(`Não consegui atualizar "${table}". Confirma se existe coluna "price" (number) e se UPDATE está liberado.`);
        return;
      }

      if (table === "accessories") setAccessoriesTable((prev) => prev.map((x) => (x.id === row.id ? { ...x, price: next } : x)));
      else setWheelsTable((prev) => prev.map((x) => (x.id === row.id ? { ...x, price: next } : x)));
    } catch (e: any) {
      alert("Erro ao salvar: " + (e?.message || "desconhecido"));
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/dashboard"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
            >
              <ArrowLeft size={14} /> Voltar
            </Link>
            <div>
              <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">Alterar Valores</h1>
              <p className="text-xs text-slate-500 font-bold">Ajuste preços base e itens em massa</p>
            </div>
          </div>

          <button
            onClick={fetchAll}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
          >
            <Loader2 size={14} className={loading ? "animate-spin" : ""} /> Atualizar
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setTab("VEICULOS")}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase border ${
                  tab === "VEICULOS" ? "bg-black text-white border-black" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <CarFront size={14} className="inline mr-2" /> Veículos (Preço Base)
              </button>
            </div>

            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por nome ou ID..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium outline-none focus:border-black"
              />
            </div>
          </div>
        </div>

        {tab === "VEICULOS" && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-black uppercase text-slate-900 flex items-center gap-2">
                    <Percent size={16} /> Ajuste em massa (Preço Base)
                  </h2>
                  <p className="text-xs text-slate-500 font-bold mt-1">Aplica no preço base dos veículos filtrados pela busca.</p>
                </div>

                <button
                  onClick={massUpdateVehicles}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-black text-white text-xs font-black uppercase hover:bg-slate-800 disabled:opacity-60 flex items-center gap-2"
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <BadgeCheck size={14} />}
                  Aplicar
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500">Modo</label>
                  <select
                    value={massMode}
                    onChange={(e) => setMassMode(e.target.value as any)}
                    className="w-full mt-1 h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold"
                  >
                    <option value="PERCENT">Percentual (%)</option>
                    <option value="VALOR">Valor (R$)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500">Operação</label>
                  <select
                    value={massOp}
                    onChange={(e) => setMassOp(e.target.value as any)}
                    className="w-full mt-1 h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold"
                  >
                    <option value="MULTIPLICAR">{massMode === "PERCENT" ? "Aumentar/Diminuir (%)" : "Multiplicar"}</option>
                    <option value="SOMAR">Somar</option>
                    <option value="SUBTRAIR">Subtrair</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500">Valor</label>
                  <input
                    value={massValue}
                    onChange={(e) => setMassValue(e.target.value)}
                    placeholder={massMode === "PERCENT" ? "Ex: 10" : "Ex: 5000"}
                    className="w-full mt-1 h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-black"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-sm font-black uppercase text-slate-900">Lista de Veículos</h2>
                <div className="text-xs font-bold text-slate-500">{filteredVehicles.length} item(ns)</div>
              </div>

              {loading ? (
                <div className="p-10 text-center text-slate-500 font-bold">
                  <Loader2 className="animate-spin inline mr-2" size={18} />
                  Carregando...
                </div>
              ) : filteredVehicles.length === 0 ? (
                <div className="p-10 text-center text-slate-500 font-bold">Nada encontrado.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 min-w-[90px]">ID</th>
                        <th className="px-4 py-3 min-w-[280px]">Modelo</th>
                        <th className="px-4 py-3 min-w-[220px]">Preço Base</th>
                        <th className="px-4 py-3 text-right min-w-[140px]">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredVehicles.map((v) => (
                        <VehiclePriceRow key={v.id} v={v} savingKey={saving} onSave={updateVehiclePrice} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "ITENS_DOS_VEICULOS" && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-black uppercase text-slate-900 flex items-center gap-2">
                    <Wrench size={16} /> Ajuste em massa (Itens dentro dos veículos)
                  </h2>
                  <p className="text-xs text-slate-500 font-bold mt-1">
                    Atualiza preços em <b>cores</b>, <b>rodas</b>, <b>bancos</b> e <b>acessórios</b> dentro do JSON do veículo.
                  </p>
                </div>

                <button
                  onClick={massUpdateVehicleJsonItems}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-black text-white text-xs font-black uppercase hover:bg-slate-800 disabled:opacity-60 flex items-center gap-2"
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <BadgeCheck size={14} />}
                  Aplicar
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500">Modo</label>
                  <select
                    value={jsonMode}
                    onChange={(e) => setJsonMode(e.target.value as any)}
                    className="w-full mt-1 h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold"
                  >
                    <option value="PERCENT">Percentual (%)</option>
                    <option value="VALOR">Valor (R$)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500">Operação</label>
                  <select
                    value={jsonOp}
                    onChange={(e) => setJsonOp(e.target.value as any)}
                    className="w-full mt-1 h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold"
                  >
                    <option value="MULTIPLICAR">{jsonMode === "PERCENT" ? "Aumentar/Diminuir (%)" : "Multiplicar"}</option>
                    <option value="SOMAR">Somar</option>
                    <option value="SUBTRAIR">Subtrair</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500">Valor</label>
                  <input
                    value={jsonValue}
                    onChange={(e) => setJsonValue(e.target.value)}
                    placeholder={jsonMode === "PERCENT" ? "Ex: 10" : "Ex: 300"}
                    className="w-full mt-1 h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-black"
                  />
                </div>
              </div>

              <div className="mt-3 flex items-start gap-2 text-[11px] text-slate-500 font-bold">
                <AlertTriangle size={14} className="mt-0.5" />
                Isso atualiza muitos registros. Use com cuidado (de preferência com backup).
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-sm font-black uppercase text-slate-900">Veículos afetados</h2>
                <div className="text-xs font-bold text-slate-500">{filteredVehicles.length} item(ns)</div>
              </div>

              <div className="p-4 text-sm text-slate-700">
                Este modo aplica ajuste no JSON:
                <div className="mt-2 text-[12px] font-mono bg-slate-50 border border-slate-200 rounded-xl p-3">
                  exterior_colors[].price • wheels[].price • seat_types[].price • accessories[].price
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "ACESSORIOS_TABELA" && (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-black uppercase text-slate-900">Acessórios (Tabela accessories)</h2>
              <div className="text-xs font-bold text-slate-500">{filteredAccessories.length} item(ns)</div>
            </div>

            {loading ? (
              <div className="p-10 text-center text-slate-500 font-bold">
                <Loader2 className="animate-spin inline mr-2" size={18} />
                Carregando...
              </div>
            ) : filteredAccessories.length === 0 ? (
              <div className="p-10 text-center text-slate-500 font-bold">Nada encontrado.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 min-w-[90px]">ID</th>
                      <th className="px-4 py-3 min-w-[320px]">Nome</th>
                      <th className="px-4 py-3 min-w-[220px]">Preço</th>
                      <th className="px-4 py-3 text-right min-w-[140px]">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAccessories.map((a) => (
                      <TableItemRow key={String(a.id)} row={a} table="accessories" savingKey={saving} onSave={updateTableItemPrice} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === "RODAS_TABELA" && (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-black uppercase text-slate-900">Rodas (Tabela wheels)</h2>
              <div className="text-xs font-bold text-slate-500">{filteredWheels.length} item(ns)</div>
            </div>

            {loading ? (
              <div className="p-10 text-center text-slate-500 font-bold">
                <Loader2 className="animate-spin inline mr-2" size={18} />
                Carregando...
              </div>
            ) : filteredWheels.length === 0 ? (
              <div className="p-10 text-center text-slate-500 font-bold">Nada encontrado.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 min-w-[90px]">ID</th>
                      <th className="px-4 py-3 min-w-[320px]">Nome</th>
                      <th className="px-4 py-3 min-w-[220px]">Preço</th>
                      <th className="px-4 py-3 text-right min-w-[140px]">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredWheels.map((w) => (
                      <TableItemRow key={String(w.id)} row={w} table="wheels" savingKey={saving} onSave={updateTableItemPrice} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <div className="mt-10 text-center text-xs text-slate-400 font-bold">
          
        </div>
      </div>
    </div>
  );
}