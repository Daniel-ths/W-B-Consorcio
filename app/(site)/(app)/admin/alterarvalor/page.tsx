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
  CarFront,
  BadgeCheck,
  AlertTriangle,
  Layers3,
} from "lucide-react";

type Tab = "VEICULOS" | "VERSOES_VEICULOS";
type BrandFilter = "TODOS" | "CHEVROLET" | "HYUNDAI";

type VersionItem = {
  id?: string | number;
  title?: string;
  subtitle?: string;
  price?: number | null;
  note?: string;
  heroLabel?: string;
};

type VehicleRow = {
  id: number;
  model_name: string;
  slug?: string | null;
  brand?: string | null;
  price_start: number | null;
  versions?: VersionItem[] | null;
};

const brl = (n: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(n || 0));

const moneyToInput = (value: number | string | null | undefined) => {
  const num = Number(value || 0);
  return brl(num);
};

const formatMoneyInput = (raw: string) => {
  const digits = String(raw || "").replace(/\D/g, "");
  const cents = Number(digits || "0") / 100;
  return brl(cents);
};

const parseMoney = (val: string) => {
  const digits = String(val || "").replace(/\D/g, "");
  return Number(digits || "0") / 100;
};

const safeNum = (v: any) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

function applyOp(
  current: number,
  op: "SOMAR" | "SUBTRAIR" | "MULTIPLICAR",
  value: number
) {
  if (op === "SOMAR") return current + value;
  if (op === "SUBTRAIR") return Math.max(0, current - value);
  return Math.max(0, current * value);
}

function normalizeVersions(input: any): VersionItem[] {
  if (!Array.isArray(input)) return [];
  return input.map((v, index) => ({
    id: v?.id ?? `version-${index}`,
    title: v?.title ?? `Versão ${index + 1}`,
    subtitle: v?.subtitle ?? "",
    price: safeNum(v?.price),
    note: v?.note ?? "",
    heroLabel: v?.heroLabel ?? "",
  }));
}

function getBrandLabel(brand?: string | null) {
  const b = String(brand || "").toLowerCase();
  if (b.includes("hyundai")) return "HYUNDAI";
  if (b.includes("chevrolet")) return "CHEVROLET";
  return "OUTROS";
}

function getVehicleBadgeColor(brand?: string | null) {
  const b = String(brand || "").toLowerCase();
  if (b.includes("hyundai")) return "bg-sky-50 text-sky-700 border-sky-200";
  if (b.includes("chevrolet")) return "bg-yellow-50 text-yellow-700 border-yellow-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
}

function matchesBrand(vehicle: VehicleRow, filter: BrandFilter) {
  if (filter === "TODOS") return true;
  const label = getBrandLabel(vehicle.brand);
  return label === filter;
}

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
  const [local, setLocal] = useState(moneyToInput(safeNum(v.price_start)));

  useEffect(() => {
    setLocal(moneyToInput(safeNum(v.price_start)));
  }, [v.price_start]);

  return (
    <tr>
      <td className="px-4 py-3 text-xs font-black text-slate-700">{v.id}</td>

      <td className="px-4 py-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="text-sm font-black text-slate-900">{v.model_name}</div>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-black uppercase ${getVehicleBadgeColor(
              v.brand
            )}`}
          >
            {getBrandLabel(v.brand)}
          </span>
        </div>

        <div className="text-[11px] text-slate-500 font-bold mt-1">
          Atual: {brl(safeNum(v.price_start))}
        </div>

        {v.slug ? (
          <div className="text-[10px] text-slate-400 font-bold mt-1">{v.slug}</div>
        ) : null}
      </td>

      <td className="px-4 py-3">
        <input
          value={local}
          onChange={(e) => setLocal(formatMoneyInput(e.target.value))}
          inputMode="numeric"
          className="w-full md:w-64 h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-black"
        />
      </td>

      <td className="px-4 py-3 text-right">
        <button
          onClick={() => onSave(v.id, local)}
          disabled={savingKey === key}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-black text-white text-xs font-black uppercase hover:bg-slate-800 disabled:opacity-60"
        >
          {savingKey === key ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Save size={14} />
          )}
          Salvar
        </button>
      </td>
    </tr>
  );
}

function VehicleVersionsCard({
  vehicle,
  savingKey,
  onSaveVersion,
}: {
  vehicle: VehicleRow;
  savingKey: string | null;
  onSaveVersion: (
    vehicle: VehicleRow,
    versionIndex: number,
    priceFormatted: string
  ) => Promise<void>;
}) {
  const versions = useMemo(() => normalizeVersions(vehicle.versions), [vehicle.versions]);

  if (versions.length === 0) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-black uppercase text-slate-900">
              {vehicle.model_name}
            </h3>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-black uppercase ${getVehicleBadgeColor(
                vehicle.brand
              )}`}
            >
              {getBrandLabel(vehicle.brand)}
            </span>
          </div>

          <div className="text-[11px] text-slate-500 font-bold mt-1">
            ID {vehicle.id}
            {vehicle.slug ? ` • ${vehicle.slug}` : ""}
          </div>
        </div>

        <div className="text-[11px] font-black text-slate-500">
          {versions.length} versão(ões)
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {versions.map((ver, idx) => (
          <VehicleVersionRow
            key={`${vehicle.id}:${String(ver.id ?? idx)}`}
            vehicle={vehicle}
            version={ver}
            versionIndex={idx}
            savingKey={savingKey}
            onSaveVersion={onSaveVersion}
          />
        ))}
      </div>
    </div>
  );
}

function VehicleVersionRow({
  vehicle,
  version,
  versionIndex,
  savingKey,
  onSaveVersion,
}: {
  vehicle: VehicleRow;
  version: VersionItem;
  versionIndex: number;
  savingKey: string | null;
  onSaveVersion: (
    vehicle: VehicleRow,
    versionIndex: number,
    priceFormatted: string
  ) => Promise<void>;
}) {
  const rowKey = `vehver:${vehicle.id}:${versionIndex}`;
  const [local, setLocal] = useState(moneyToInput(safeNum(version.price)));

  useEffect(() => {
    setLocal(moneyToInput(safeNum(version.price)));
  }, [version.price]);

  return (
    <div className="p-4 flex flex-col lg:flex-row lg:items-center gap-4">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-black text-slate-900">
          {version.title || `Versão ${versionIndex + 1}`}
        </div>

        {version.subtitle ? (
          <div className="text-xs text-slate-500 font-bold mt-1">{version.subtitle}</div>
        ) : null}

        <div className="text-[11px] text-slate-500 font-bold mt-2">
          Atual: {brl(safeNum(version.price))}
        </div>
      </div>

      <div className="w-full lg:w-auto">
        <input
          value={local}
          onChange={(e) => setLocal(formatMoneyInput(e.target.value))}
          inputMode="numeric"
          className="w-full lg:w-64 h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-black"
        />
      </div>

      <div className="lg:min-w-[120px] lg:flex lg:justify-end">
        <button
          onClick={() => onSaveVersion(vehicle, versionIndex, local)}
          disabled={savingKey === rowKey}
          className="w-full lg:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-black text-white text-xs font-black uppercase hover:bg-slate-800 disabled:opacity-60"
        >
          {savingKey === rowKey ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Save size={14} />
          )}
          Salvar
        </button>
      </div>
    </div>
  );
}

export default function AlterarValorPage() {
  const [tab, setTab] = useState<Tab>("VEICULOS");
  const [brandFilter, setBrandFilter] = useState<BrandFilter>("TODOS");

  const [vehicles, setVehicles] = useState<VehicleRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const [massMode, setMassMode] = useState<"VALOR" | "PERCENT">("PERCENT");
  const [massOp, setMassOp] = useState<"SOMAR" | "SUBTRAIR" | "MULTIPLICAR">(
    "MULTIPLICAR"
  );
  const [massValue, setMassValue] = useState("10");

  const [versionMode, setVersionMode] = useState<"VALOR" | "PERCENT">("PERCENT");
  const [versionOp, setVersionOp] = useState<
    "SOMAR" | "SUBTRAIR" | "MULTIPLICAR"
  >("MULTIPLICAR");
  const [versionValue, setVersionValue] = useState("10");

  const fetchAll = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, model_name, slug, brand, price_start, versions")
        .order("brand", { ascending: true })
        .order("model_name", { ascending: true });

      if (error) throw error;
      setVehicles((data as VehicleRow[]) || []);
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

    return vehicles.filter((v) => {
      if (!matchesBrand(v, brandFilter)) return false;

      if (!term) return true;

      const versions = normalizeVersions(v.versions);
      const hitVersion = versions.some(
        (ver) =>
          String(ver.title || "").toLowerCase().includes(term) ||
          String(ver.subtitle || "").toLowerCase().includes(term) ||
          String(ver.id || "").toLowerCase().includes(term)
      );

      return (
        String(v.model_name || "").toLowerCase().includes(term) ||
        String(v.id).includes(term) ||
        String(v.slug || "").toLowerCase().includes(term) ||
        String(v.brand || "").toLowerCase().includes(term) ||
        hitVersion
      );
    });
  }, [vehicles, q, brandFilter]);

  const filteredVehiclesWithVersions = useMemo(() => {
    return filteredVehicles.filter((v) => normalizeVersions(v.versions).length > 0);
  }, [filteredVehicles]);

  const totalVersionsFound = useMemo(() => {
    return filteredVehiclesWithVersions.reduce(
      (acc, v) => acc + normalizeVersions(v.versions).length,
      0
    );
  }, [filteredVehiclesWithVersions]);

  const chevroletVehiclesCount = useMemo(
    () => vehicles.filter((v) => getBrandLabel(v.brand) === "CHEVROLET").length,
    [vehicles]
  );

  const hyundaiVehiclesCount = useMemo(
    () => vehicles.filter((v) => getBrandLabel(v.brand) === "HYUNDAI").length,
    [vehicles]
  );

  const updateVehiclePrice = async (id: number, priceFormatted: string) => {
    setSaving(`veh:${id}`);
    try {
      const newPrice = parseMoney(priceFormatted);

      const { error } = await supabase
        .from("vehicles")
        .update({ price_start: newPrice })
        .eq("id", id);

      if (error) throw error;

      setVehicles((prev) =>
        prev.map((v) => (v.id === id ? { ...v, price_start: newPrice } : v))
      );
    } catch (e: any) {
      alert("Erro ao salvar veículo: " + (e?.message || "desconhecido"));
    } finally {
      setSaving(null);
    }
  };

  const updateVehicleVersionPrice = async (
    vehicle: VehicleRow,
    versionIndex: number,
    priceFormatted: string
  ) => {
    setSaving(`vehver:${vehicle.id}:${versionIndex}`);

    try {
      const nextPrice = parseMoney(priceFormatted);
      const versions = normalizeVersions(vehicle.versions);

      if (!versions[versionIndex]) {
        alert("Versão não encontrada.");
        return;
      }

      const nextVersions = versions.map((ver, idx) =>
        idx === versionIndex ? { ...ver, price: nextPrice } : ver
      );

      const { error } = await supabase
        .from("vehicles")
        .update({ versions: nextVersions })
        .eq("id", vehicle.id);

      if (error) throw error;

      setVehicles((prev) =>
        prev.map((v) => (v.id === vehicle.id ? { ...v, versions: nextVersions } : v))
      );
    } catch (e: any) {
      alert("Erro ao salvar versão: " + (e?.message || "desconhecido"));
    } finally {
      setSaving(null);
    }
  };

  const massUpdateVehicles = async () => {
    if (!confirm("Aplicar ajuste em massa no PREÇO BASE de todos os veículos filtrados?")) {
      return;
    }

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

        const { error } = await supabase
          .from("vehicles")
          .update({ price_start: next })
          .eq("id", v.id);

        if (error) throw error;

        setVehicles((prev) =>
          prev.map((x) => (x.id === v.id ? { ...x, price_start: next } : x))
        );
      }

      alert("Ajuste em massa do preço base concluído!");
    } catch (e: any) {
      alert("Erro no ajuste em massa: " + (e?.message || "desconhecido"));
    } finally {
      setLoading(false);
    }
  };

  const massUpdateVehicleVersions = async () => {
    if (
      !confirm(
        "Aplicar ajuste em massa nas versões alternativas (vehicles.versions[]) dos veículos filtrados?"
      )
    ) {
      return;
    }

    const raw = String(versionValue || "").replace(",", ".");
    const base = Number(raw);
    if (!Number.isFinite(base)) return alert("Valor inválido.");

    const factor =
      versionMode === "PERCENT"
        ? versionOp === "MULTIPLICAR"
          ? 1 + base / 100
          : base / 100
        : base;

    setLoading(true);

    try {
      for (const v of filteredVehiclesWithVersions) {
        const versions = normalizeVersions(v.versions);

        const nextVersions = versions.map((ver) => {
          const current = safeNum(ver.price);
          let next = current;

          if (versionMode === "PERCENT") {
            if (versionOp === "MULTIPLICAR") next = applyOp(current, "MULTIPLICAR", factor);
            else if (versionOp === "SOMAR") next = applyOp(current, "SOMAR", current * factor);
            else next = applyOp(current, "SUBTRAIR", current * factor);
          } else {
            next = applyOp(current, versionOp, factor);
          }

          return { ...ver, price: next };
        });

        const { error } = await supabase
          .from("vehicles")
          .update({ versions: nextVersions })
          .eq("id", v.id);

        if (error) throw error;

        setVehicles((prev) =>
          prev.map((x) => (x.id === v.id ? { ...x, versions: nextVersions } : x))
        );
      }

      alert("Ajuste em massa das versões concluído!");
    } catch (e: any) {
      alert("Erro no ajuste em massa das versões: " + (e?.message || "desconhecido"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-24 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/dashboard"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
            >
              <ArrowLeft size={14} /> Voltar
            </Link>

            <div>
              <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                Alterar Valores
              </h1>
              <p className="text-xs text-slate-500 font-bold">
                Corrigido o bug dos milhões • separado Chevrolet e Hyundai
              </p>
            </div>
          </div>

          <button
            onClick={fetchAll}
            className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
          >
            <Loader2 size={14} className={loading ? "animate-spin" : ""} /> Atualizar
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <div className="text-[11px] font-black uppercase text-slate-500">Total</div>
            <div className="mt-2 text-2xl font-black text-slate-900">{vehicles.length}</div>
            <div className="text-xs font-bold text-slate-500 mt-1">Todos os veículos</div>
          </div>

          <div className="bg-white border border-yellow-200 rounded-2xl p-4">
            <div className="text-[11px] font-black uppercase text-yellow-700">Chevrolet</div>
            <div className="mt-2 text-2xl font-black text-slate-900">
              {chevroletVehiclesCount}
            </div>
            <div className="text-xs font-bold text-slate-500 mt-1">Veículos Chevrolet</div>
          </div>

          <div className="bg-white border border-sky-200 rounded-2xl p-4">
            <div className="text-[11px] font-black uppercase text-sky-700">Hyundai</div>
            <div className="mt-2 text-2xl font-black text-slate-900">
              {hyundaiVehiclesCount}
            </div>
            <div className="text-xs font-bold text-slate-500 mt-1">Veículos Hyundai</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setTab("VEICULOS")}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase border ${
                  tab === "VEICULOS"
                    ? "bg-black text-white border-black"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <CarFront size={14} className="inline mr-2" />
                Veículos
              </button>

              <button
                onClick={() => setTab("VERSOES_VEICULOS")}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase border ${
                  tab === "VERSOES_VEICULOS"
                    ? "bg-black text-white border-black"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <Layers3 size={14} className="inline mr-2" />
                Versões dos Veículos
              </button>
            </div>

            <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setBrandFilter("TODOS")}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase border ${
                    brandFilter === "TODOS"
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  Todos
                </button>

                <button
                  onClick={() => setBrandFilter("CHEVROLET")}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase border ${
                    brandFilter === "CHEVROLET"
                      ? "bg-yellow-500 text-black border-yellow-500"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  Chevrolet
                </button>

                <button
                  onClick={() => setBrandFilter("HYUNDAI")}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase border ${
                    brandFilter === "HYUNDAI"
                      ? "bg-sky-500 text-white border-sky-500"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  Hyundai
                </button>
              </div>

              <div className="relative w-full xl:w-96">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={16}
                />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar por nome, marca, slug, ID ou versão..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium outline-none focus:border-black"
                />
              </div>
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
                  <p className="text-xs text-slate-500 font-bold mt-1">
                    Aplica no preço base dos veículos filtrados pela busca e pela marca.
                  </p>
                </div>

                <button
                  onClick={massUpdateVehicles}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-black text-white text-xs font-black uppercase hover:bg-slate-800 disabled:opacity-60 flex items-center gap-2"
                >
                  {loading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <BadgeCheck size={14} />
                  )}
                  Aplicar
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500">
                    Modo
                  </label>
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
                  <label className="text-[10px] font-black uppercase text-slate-500">
                    Operação
                  </label>
                  <select
                    value={massOp}
                    onChange={(e) => setMassOp(e.target.value as any)}
                    className="w-full mt-1 h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold"
                  >
                    <option value="MULTIPLICAR">
                      {massMode === "PERCENT" ? "Aumentar/Diminuir (%)" : "Multiplicar"}
                    </option>
                    <option value="SOMAR">Somar</option>
                    <option value="SUBTRAIR">Subtrair</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500">
                    Valor
                  </label>
                  <input
                    value={massValue}
                    onChange={(e) => setMassValue(e.target.value)}
                    placeholder={massMode === "PERCENT" ? "Ex: 10" : "Ex: 5000"}
                    className="w-full mt-1 h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-black"
                  />
                </div>
              </div>

              <div className="mt-3 flex items-start gap-2 text-[11px] text-slate-500 font-bold">
                <AlertTriangle size={14} className="mt-0.5" />
                O bug dos milhões foi corrigido separando valor exibido do valor digitado.
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-sm font-black uppercase text-slate-900">
                  Lista de Veículos
                </h2>
                <div className="text-xs font-bold text-slate-500">
                  {filteredVehicles.length} item(ns)
                </div>
              </div>

              {loading ? (
                <div className="p-10 text-center text-slate-500 font-bold">
                  <Loader2 className="animate-spin inline mr-2" size={18} />
                </div>
              ) : filteredVehicles.length === 0 ? (
                <div className="p-10 text-center text-slate-500 font-bold">
                  Nada encontrado.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 min-w-[90px]">ID</th>
                        <th className="px-4 py-3 min-w-[320px]">Modelo</th>
                        <th className="px-4 py-3 min-w-[220px]">Preço Base</th>
                        <th className="px-4 py-3 text-right min-w-[140px]">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredVehicles.map((v) => (
                        <VehiclePriceRow
                          key={v.id}
                          v={v}
                          savingKey={saving}
                          onSave={updateVehiclePrice}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "VERSOES_VEICULOS" && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-black uppercase text-slate-900 flex items-center gap-2">
                    <Layers3 size={16} /> Ajuste em massa (Versões Alternativas)
                  </h2>
                  <p className="text-xs text-slate-500 font-bold mt-1">
                    Atualiza os preços em <b>vehicles.versions[].price</b>, incluindo as
                    versões alternativas da Hyundai e Chevrolet.
                  </p>
                </div>

                <button
                  onClick={massUpdateVehicleVersions}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-black text-white text-xs font-black uppercase hover:bg-slate-800 disabled:opacity-60 flex items-center gap-2"
                >
                  {loading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <BadgeCheck size={14} />
                  )}
                  Aplicar
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500">
                    Modo
                  </label>
                  <select
                    value={versionMode}
                    onChange={(e) => setVersionMode(e.target.value as any)}
                    className="w-full mt-1 h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold"
                  >
                    <option value="PERCENT">Percentual (%)</option>
                    <option value="VALOR">Valor (R$)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500">
                    Operação
                  </label>
                  <select
                    value={versionOp}
                    onChange={(e) => setVersionOp(e.target.value as any)}
                    className="w-full mt-1 h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold"
                  >
                    <option value="MULTIPLICAR">
                      {versionMode === "PERCENT"
                        ? "Aumentar/Diminuir (%)"
                        : "Multiplicar"}
                    </option>
                    <option value="SOMAR">Somar</option>
                    <option value="SUBTRAIR">Subtrair</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500">
                    Valor
                  </label>
                  <input
                    value={versionValue}
                    onChange={(e) => setVersionValue(e.target.value)}
                    placeholder={versionMode === "PERCENT" ? "Ex: 10" : "Ex: 3000"}
                    className="w-full mt-1 h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-black"
                  />
                </div>
              </div>

              <div className="mt-3 flex items-start gap-2 text-[11px] text-slate-500 font-bold">
                <AlertTriangle size={14} className="mt-0.5" />
                Esse ajuste mexe no JSON de versões dentro do veículo. Use com cuidado.
              </div>
            </div>

            {loading ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-500 font-bold">
                <Loader2 className="animate-spin inline mr-2" size={18} />
              </div>
            ) : filteredVehiclesWithVersions.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-500 font-bold">
                Nenhum veículo com versões encontrado.
              </div>
            ) : (
              <>
                <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
                  <div className="text-sm font-black text-slate-900 uppercase">
                    Veículos com versões
                  </div>
                  <div className="text-xs font-bold text-slate-500">
                    {filteredVehiclesWithVersions.length} veículo(s) • {totalVersionsFound} versão(ões)
                  </div>
                </div>

                <div className="space-y-4">
                  {filteredVehiclesWithVersions.map((vehicle) => (
                    <VehicleVersionsCard
                      key={vehicle.id}
                      vehicle={vehicle}
                      savingKey={saving}
                      onSaveVersion={updateVehicleVersionPrice}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}