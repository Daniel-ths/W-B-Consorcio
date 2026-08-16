"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import {
  Check,
  XCircle,
  Trash2,
  Eye,
  Loader2,
  Phone,
  LogOut,
  Search,
  CalendarRange,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Plus,
  Database,
  Wallet,
  FileText,
} from "lucide-react";

const onlyDigits = (v: any) => String(v || "").replace(/\D/g, "");
const cleanText = (v: any) => String(v || "").trim();
const lowerText = (v: any) => cleanText(v).toLowerCase();

const isEmailLike = (value: any) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanText(value));

const toWhatsDigits = (phoneLike: any) => {
  const d = onlyDigits(phoneLike);
  if (!d) return "";
  return d.startsWith("55") ? d : `55${d}`;
};

const normalizeSellerDisplayName = (sale: any) => {
  const detailsSeller = cleanText(sale?.details?.vendedor_digitado);
  const rootSeller = cleanText(sale?.seller_name);
  if (detailsSeller) return detailsSeller.toUpperCase();
  if (rootSeller && !isEmailLike(rootSeller)) return rootSeller.toUpperCase();
  return "—";
};

function formatMoney(val: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(val || 0));
}

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === "Aprovado"
      ? "bg-emerald-50 text-emerald-700"
      : status === "Recusado"
      ? "bg-red-50 text-red-700"
      : "bg-amber-50 text-amber-800";

  return (
    <span className={`inline-block px-2 py-0.5 text-[11px] font-medium ${styles}`}>
      {status}
    </span>
  );
}

function ActionCard({
  href,
  icon,
  title,
  description,
  tone = "slate",
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  tone?: "slate" | "blue" | "emerald" | "amber" | "indigo";
}) {
  const toneMap = {
    slate: "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-900",
    blue: "border-blue-100 bg-blue-50 hover:bg-blue-100 text-blue-900",
    emerald: "border-emerald-100 bg-emerald-50 hover:bg-emerald-100 text-emerald-900",
    amber: "border-amber-100 bg-amber-50 hover:bg-amber-100 text-amber-900",
    indigo: "border-indigo-100 bg-indigo-50 hover:bg-indigo-100 text-indigo-900",
  };

  return (
    <Link
      href={href}
      className={`rounded-xl border p-4 transition ${toneMap[tone]}`}
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-white/80">
        {icon}
      </div>
      <h3 className="text-[13px] font-semibold">{title}</h3>
      <p className="mt-1 text-[12px] opacity-80">{description}</p>
    </Link>
  );
}

function ModalDetalhes({
  sale,
  onClose,
  onUpdateStatus,
  onDelete,
  isDeleting,
}: {
  sale: any;
  onClose: () => void;
  onUpdateStatus: (id: string, status: string) => void;
  onDelete: (id: string) => Promise<void>;
  isDeleting: boolean;
}) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAction = async (status: string) => {
    setIsProcessing(true);
    try {
      await onUpdateStatus(sale.id, status);
    } finally {
      setIsProcessing(false);
    }
  };

  const sellerDisplayName = useMemo(() => normalizeSellerDisplayName(sale), [sale]);
  const sellerEmailLabel = useMemo(() => {
    const email = String(sale?.profiles?.email || "").trim();
    if (!email || !email.includes("@")) return "—";
    return email.split("@")[0].toUpperCase();
  }, [sale]);

  if (!sale) return null;

  const waDigits = toWhatsDigits(sale.client_phone);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto bg-white">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-200 px-5 py-4">
          <div>
            <p className="text-[12px] text-zinc-500">Proposta</p>
            <h2 className="mt-0.5 text-lg font-semibold text-zinc-900">
              {sale.car_name || "—"}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={sale.status} />
              <span className="text-[12px] text-zinc-500">
                {sale.interest_type || "—"} · {formatMoney(Number(sale.total_price) || 0)}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[13px] font-medium text-zinc-500 hover:text-zinc-900"
          >
            Fechar
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-[12px] font-medium text-zinc-500">Cliente</p>
              <div className="space-y-2 text-[14px]">
                <div>
                  <p className="text-[12px] text-zinc-500">Nome</p>
                  <p className="font-medium text-zinc-900">{sale.client_name || "—"}</p>
                </div>
                <div>
                  <p className="text-[12px] text-zinc-500">CPF</p>
                  <p className="font-mono text-zinc-700">{sale.client_cpf || "—"}</p>
                </div>
                <div>
                  <p className="text-[12px] text-zinc-500">Telefone</p>
                  <p className="font-mono text-zinc-700">{sale.client_phone || "—"}</p>
                  {waDigits && (
                    <a
                      href={`https://wa.me/${waDigits}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-[12px] font-medium text-emerald-700 hover:underline"
                    >
                      <Phone size={12} />
                      Abrir WhatsApp
                    </a>
                  )}
                </div>
                <div>
                  <p className="text-[12px] text-zinc-500">Criado em</p>
                  <p className="text-zinc-700">
                    {new Date(sale.created_at).toLocaleDateString("pt-BR")}{" "}
                    {new Date(sale.created_at).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <p className="mb-2 text-[12px] font-medium text-zinc-500">Proposta</p>
              <div className="space-y-2 text-[14px]">
                <div>
                  <p className="text-[12px] text-zinc-500">Veículo</p>
                  <p className="font-medium text-zinc-900">{sale.car_name || "—"}</p>
                </div>
                <div>
                  <p className="text-[12px] text-zinc-500">Tipo</p>
                  <p className="text-zinc-700">{sale.interest_type || "—"}</p>
                </div>
                <div>
                  <p className="text-[12px] text-zinc-500">Valor</p>
                  <p className="font-medium text-zinc-900">
                    {formatMoney(Number(sale.total_price) || 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 border-t border-zinc-100 pt-5 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-[12px] font-medium text-zinc-500">Vendedor</p>
              <p className="text-[14px] font-medium text-zinc-900">{sellerDisplayName}</p>
              <p className="text-[12px] text-zinc-500">{sellerEmailLabel}</p>
            </div>
            <div>
              <p className="mb-2 text-[12px] font-medium text-zinc-500">Processamento</p>
              <p className="text-[14px] font-medium text-zinc-900">
                {sale.approved_by_name || "Sistema"}
              </p>
              <p className="text-[12px] text-zinc-500">
                {sale.approved_at
                  ? new Date(sale.approved_at).toLocaleString("pt-BR")
                  : "—"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-zinc-200 bg-zinc-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {sale.status !== "Aprovado" && (
              <button
                onClick={() => handleAction("Aprovado")}
                disabled={isProcessing}
                className="inline-flex h-9 items-center gap-1.5 bg-emerald-600 px-4 text-[12px] font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {isProcessing ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Check size={14} />
                )}
                Aprovar
              </button>
            )}
            {sale.status !== "Recusado" && (
              <button
                onClick={() => handleAction("Recusado")}
                disabled={isProcessing}
                className="inline-flex h-9 items-center gap-1.5 bg-red-600 px-4 text-[12px] font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isProcessing ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <XCircle size={14} />
                )}
                Recusar
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={async () => {
                if (!confirm("Excluir esta proposta permanentemente?")) return;
                await onDelete(sale.id);
                onClose();
              }}
              disabled={isDeleting}
              className="inline-flex h-9 items-center gap-1.5 border border-red-200 bg-white px-4 text-[12px] font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              {isDeleting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Trash2 size={14} />
              )}
              Excluir
            </button>
            <button
              onClick={onClose}
              className="h-9 border border-zinc-200 bg-white px-4 text-[12px] font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

type SortKey = "created_at" | "total_price" | "client_name";

export default function AdminDashboard() {
  const router = useRouter();

  const [sales, setSales] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [todayList, setTodayList] = useState<any[]>([]);
  const [kpis, setKpis] = useState({
    total: 0,
    approved: 0,
    refused: 0,
    revenue: 0,
  });

  const [transactionsExpanded, setTransactionsExpanded] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const todayLabel = useMemo(() => new Date().toLocaleDateString("pt-BR"), []);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const getTodayRangeISO = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const end = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999
    );
    return { startISO: start.toISOString(), endISO: end.toISOString() };
  };

  const setFilterToToday = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const iso = `${y}-${m}-${d}`;
    setDateFrom(iso);
    setDateTo(iso);
    setPage(1);
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(1);
  };

  const applyFilters = (query: any) => {
    if (dateFrom) query = query.gte("created_at", `${dateFrom}T00:00:00`);
    if (dateTo) query = query.lte("created_at", `${dateTo}T23:59:59.999`);

    const term = searchTerm.trim();
    if (term) {
      const t = term.replace(/,/g, "");
      query = query.or(
        `client_name.ilike.%${t}%,car_name.ilike.%${t}%,client_cpf.ilike.%${t}%,seller_name.ilike.%${t}%`
      );
    }

    return query;
  };

  const fetchSalesPage = useCallback(async () => {
    setLoading(true);
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from("sales")
        .select(`*, profiles:seller_id (email)`, { count: "exact" });

      query = applyFilters(query);

      const orderColumn =
        sortKey === "total_price"
          ? "total_price"
          : sortKey === "client_name"
          ? "client_name"
          : "created_at";

      query = query
        .order(orderColumn, { ascending: sortDir === "asc", nullsFirst: false })
        .range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;

      const rows = (data || []).map((r: any) => ({
        ...r,
        status: cleanText(r?.status) || "Aprovado",
      }));

      setSales(rows);
      setTotalCount(count ?? 0);
    } catch (err) {
      console.error("Erro ao buscar vendas:", err);
      setSales([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchTerm, dateFrom, dateTo, sortKey, sortDir]);

  const fetchSummary = useCallback(async () => {
    try {
      const { startISO, endISO } = getTodayRangeISO();

      let kpiQuery = supabase
        .from("sales")
        .select("status, total_price, created_at", { count: "exact" });

      kpiQuery = applyFilters(kpiQuery);

      const { data: kpiRows, error: kpiError, count } = await kpiQuery;
      if (kpiError) throw kpiError;

      const rows = kpiRows || [];
      const approved = rows.filter((s) => cleanText(s.status) === "Aprovado").length;
      const refused = rows.filter((s) => cleanText(s.status) === "Recusado").length;
      const revenue = rows.reduce((acc, s) => acc + (Number(s.total_price) || 0), 0);

      setKpis({
        total: count ?? rows.length,
        approved,
        refused,
        revenue,
      });

      const { data: todayData, error: todayError } = await supabase
        .from("sales")
        .select(`*, profiles:seller_id (email)`)
        .gte("created_at", startISO)
        .lte("created_at", endISO)
        .order("created_at", { ascending: false })
        .limit(10);

      if (todayError) throw todayError;

      setTodayList(
        (todayData || []).map((r: any) => ({
          ...r,
          status: cleanText(r?.status) || "Aprovado",
        }))
      );
    } catch (err) {
      console.error("Erro ao buscar resumo:", err);
    }
  }, [searchTerm, dateFrom, dateTo]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setSearchTerm(searchInput);
      setPage(1);
    }, 350);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    fetchSalesPage();
  }, [fetchSalesPage]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const refreshAll = async () => {
    await Promise.all([fetchSalesPage(), fetchSummary()]);
  };

  const updateStatus = async (id: string, status: string) => {
    setIsUpdating(id);
    try {
      const { error } = await supabase
        .from("sales")
        .update({
          status,
          approved_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
      await refreshAll();
      setSelectedSale((prev: any) =>
        prev?.id === id ? { ...prev, status, approved_at: new Date().toISOString() } : prev
      );
    } catch (err) {
      console.error(err);
      alert("Erro ao atualizar status.");
    } finally {
      setIsUpdating(null);
    }
  };

  const deleteSale = async (id: string) => {
    setIsDeleting(id);
    try {
      const { error } = await supabase.from("sales").delete().eq("id", id);
      if (error) throw error;
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      await refreshAll();
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir.");
    } finally {
      setIsDeleting(null);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const selectAllOnPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      sales.forEach((s) => next.add(s.id));
      return next;
    });
  };

  const bulkUpdate = async (status: string) => {
    if (selectedIds.size === 0) return;
    if (!confirm(`${status} ${selectedIds.size} proposta(s)?`)) return;

    const ids = Array.from(selectedIds);
    try {
      const { error } = await supabase
        .from("sales")
        .update({ status, approved_at: new Date().toISOString() })
        .in("id", ids);
      if (error) throw error;
      clearSelection();
      await refreshAll();
    } catch (err) {
      console.error(err);
      alert("Erro no lote.");
    }
  };

  const bulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Excluir ${selectedIds.size} proposta(s) permanentemente?`)) return;

    const ids = Array.from(selectedIds);
    try {
      const { error } = await supabase.from("sales").delete().in("id", ids);
      if (error) throw error;
      clearSelection();
      await refreshAll();
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir lote.");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const todayApproved = todayList.filter((s) => s.status === "Aprovado").length;

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          <div>
            <p className="text-[12px] text-zinc-500">Administração</p>
            <h1 className="text-lg font-semibold text-zinc-900">Painel de propostas</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-[12px] text-zinc-500 sm:inline">{todayLabel}</span>
            <button
              onClick={handleLogout}
              className="inline-flex h-9 items-center gap-1.5 border border-zinc-200 bg-white px-3 text-[12px] font-medium text-zinc-700 hover:bg-zinc-50"
            >
              <LogOut size={14} />
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:px-6">
        {/* 6 atalhos */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <ActionCard
            href="/vendedor/clientes-consultados"
            icon={<Database size={18} />}
            title="Clientes"
            description="Ver clientes salvos após consulta de CPF"
            tone="indigo"
          />
          <ActionCard
            href="/admin/consulta-dias"
            icon={<CalendarRange size={18} />}
            title="Pedidos"
            description="Filtrar desempenho por período"
            tone="slate"
          />
          <ActionCard
            href="/admin/alterarvalor"
            icon={<Wallet size={18} />}
            title="Valores"
            description="Ajustar faixas e valores do sistema"
            tone="amber"
          />
          <ActionCard
            href="/admin/cars/choose-brand"
            icon={<Plus size={18} />}
            title="Veículo"
            description="Adicionar ou editar veículos"
            tone="blue"
          />
          <ActionCard
            href="/admin/reports"
            icon={<FileText size={18} />}
            title="Relatórios"
            description="Visualizar relatórios e análises"
            tone="slate"
          />
          <ActionCard
            href="/admin/financeiro"
            icon={<FileText size={18} />}
            title="Financeiro"
            description="Controle"
            tone="slate"
          />
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-px bg-zinc-200 md:grid-cols-4">
          {[
            { label: "Total filtrado", value: String(kpis.total) },
            { label: "Aprovadas", value: String(kpis.approved) },
            { label: "Recusadas", value: String(kpis.refused) },
            { label: "Receita", value: formatMoney(kpis.revenue) },
          ].map((k) => (
            <div key={k.label} className="bg-white px-4 py-3">
              <p className="text-[12px] text-zinc-500">{k.label}</p>
              <p className="mt-1 text-lg font-semibold text-zinc-900">{k.value}</p>
            </div>
          ))}
        </div>

        {/* filtros */}
        <div className="bg-white p-4">
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <input
                type="text"
                placeholder="Buscar cliente, veículo, vendedor ou CPF…"
                className="h-10 w-full border border-zinc-200 bg-white pl-9 pr-3 text-[14px] outline-none focus:border-zinc-400"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="flex items-center gap-2 border border-zinc-200 px-3 py-2">
                <CalendarRange size={14} className="text-zinc-400" />
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setPage(1);
                  }}
                  className="bg-transparent text-[12px] text-zinc-700 outline-none"
                />
                <span className="text-zinc-300">–</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setPage(1);
                  }}
                  className="bg-transparent text-[12px] text-zinc-700 outline-none"
                />
              </div>

              <button
                onClick={setFilterToToday}
                className="h-9 border border-zinc-200 px-3 text-[12px] font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Hoje
              </button>

              {(dateFrom || dateTo) && (
                <button
                  onClick={() => {
                    setDateFrom("");
                    setDateTo("");
                    setPage(1);
                  }}
                  className="text-[12px] text-zinc-500 underline underline-offset-2 hover:text-zinc-900"
                >
                  Limpar datas
                </button>
              )}

              {(["created_at", "total_price", "client_name"] as const).map((key) => {
                const labels = {
                  created_at: "Data",
                  total_price: "Valor",
                  client_name: "Cliente",
                };
                const active = sortKey === key;
                return (
                  <button
                    key={key}
                    onClick={() => toggleSort(key)}
                    className={`inline-flex h-9 items-center gap-1.5 px-3 text-[12px] font-medium ${
                      active
                        ? "bg-zinc-900 text-white"
                        : "border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                    }`}
                  >
                    <ArrowUpDown size={13} />
                    {labels[key]}
                    {active ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedIds.size > 0 && (
            <div className="mt-4 flex flex-col gap-2 border-t border-zinc-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[12px] text-zinc-600">
                Selecionados:{" "}
                <span className="font-medium text-zinc-900">{selectedIds.size}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={selectAllOnPage}
                  className="h-8 border border-zinc-200 px-3 text-[11px] font-medium hover:bg-zinc-50"
                >
                  Selecionar página
                </button>
                <button
                  onClick={() => bulkUpdate("Aprovado")}
                  className="inline-flex h-8 items-center gap-1 bg-emerald-600 px-3 text-[11px] font-medium text-white hover:bg-emerald-700"
                >
                  <Check size={12} />
                  Aprovar lote
                </button>
                <button
                  onClick={() => bulkUpdate("Recusado")}
                  className="inline-flex h-8 items-center gap-1 bg-red-600 px-3 text-[11px] font-medium text-white hover:bg-red-700"
                >
                  <XCircle size={12} />
                  Recusar lote
                </button>
                <button
                  onClick={bulkDelete}
                  className="inline-flex h-8 items-center gap-1 bg-zinc-900 px-3 text-[11px] font-medium text-white hover:bg-black"
                >
                  <Trash2 size={12} />
                  Excluir lote
                </button>
                <button
                  onClick={clearSelection}
                  className="text-[11px] text-zinc-500 underline underline-offset-2"
                >
                  Limpar seleção
                </button>
              </div>
            </div>
          )}
        </div>

        {/* pedidos do dia */}
        <div className="bg-white">
          <div className="border-b border-zinc-200 px-4 py-3">
            <h2 className="text-[14px] font-semibold text-zinc-900">Pedidos de hoje</h2>
            <p className="text-[12px] text-zinc-500">
              {todayList.length} na lista · {todayApproved} aprovado(s)
            </p>
          </div>

          {todayList.length === 0 ? (
            <p className="px-4 py-8 text-center text-[13px] text-zinc-400">
              Sem propostas por enquanto.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead className="border-b border-zinc-200 bg-zinc-50 text-[11px] text-zinc-500">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Cliente</th>
                    <th className="px-4 py-2.5 font-medium">Veículo</th>
                    <th className="px-4 py-2.5 text-center font-medium">Status</th>
                    <th className="px-4 py-2.5 text-right font-medium">Valor</th>
                    <th className="px-4 py-2.5 text-right font-medium">Hora</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {todayList.map((sale: any) => (
                    <tr
                      key={sale.id}
                      onClick={() => setSelectedSale(sale)}
                      className="cursor-pointer hover:bg-zinc-50"
                    >
                      <td className="px-4 py-2.5">
                        <p className="max-w-[200px] truncate font-medium text-zinc-900">
                          {sale.client_name}
                        </p>
                        <p className="font-mono text-[11px] text-zinc-400">
                          {sale.client_cpf}
                        </p>
                      </td>
                      <td className="px-4 py-2.5">
                        <p className="max-w-[220px] truncate text-zinc-800">{sale.car_name}</p>
                        <p className="text-[11px] text-zinc-400">
                          {normalizeSellerDisplayName(sale)}
                        </p>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <StatusBadge status={sale.status} />
                      </td>
                      <td className="px-4 py-2.5 text-right font-medium text-zinc-900">
                        {formatMoney(Number(sale.total_price) || 0)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-zinc-600">
                        {new Date(sale.created_at).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* transações */}
        <div className="bg-white">
          <button
            onClick={() => setTransactionsExpanded((v) => !v)}
            className="flex w-full items-center justify-between border-b border-zinc-200 px-4 py-3 text-left"
          >
            <div>
              <h2 className="text-[14px] font-semibold text-zinc-900">Transações</h2>
              <p className="text-[12px] text-zinc-500">
                {totalCount} resultado(s) · página {page} de {totalPages}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-[12px] text-zinc-500">
              {transactionsExpanded ? "Recolher" : "Expandir"}
              {transactionsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </span>
          </button>

          {transactionsExpanded && (
            <>
              {loading ? (
                <div className="flex items-center justify-center gap-2 px-4 py-10 text-[13px] text-zinc-400">
                  <Loader2 size={18} className="animate-spin" />
                  Carregando…
                </div>
              ) : sales.length === 0 ? (
                <p className="px-4 py-10 text-center text-[13px] text-zinc-400">
                  Nenhuma proposta encontrada.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[13px]">
                    <thead className="border-b border-zinc-200 bg-zinc-50 text-[11px] text-zinc-500">
                      <tr>
                        <th className="w-10 px-4 py-2.5 text-center font-medium">Sel.</th>
                        <th className="px-4 py-2.5 font-medium">Cliente</th>
                        <th className="px-4 py-2.5 font-medium">Veículo</th>
                        <th className="px-4 py-2.5 text-center font-medium">Status</th>
                        <th className="px-4 py-2.5 text-right font-medium">Valor</th>
                        <th className="px-4 py-2.5 text-right font-medium">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {sales.map((sale) => {
                        const checked = selectedIds.has(sale.id);
                        const waDigits = toWhatsDigits(sale.client_phone);
                        const sellerDisplayName = normalizeSellerDisplayName(sale);

                        return (
                          <tr
                            key={sale.id}
                            onClick={() => setSelectedSale(sale)}
                            className="cursor-pointer hover:bg-zinc-50"
                          >
                            <td
                              className="px-4 py-2.5 text-center"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleSelect(sale.id)}
                                className="h-4 w-4 accent-zinc-900"
                              />
                            </td>
                            <td className="px-4 py-2.5">
                              <p className="font-medium text-zinc-900">{sale.client_name}</p>
                              <div className="mt-0.5 flex items-center gap-2 text-[11px] text-zinc-400">
                                <span className="font-mono">{sale.client_cpf}</span>
                                {waDigits && (
                                  <a
                                    href={`https://wa.me/${waDigits}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center gap-0.5 text-emerald-600 hover:underline"
                                  >
                                    <Phone size={11} />
                                    WhatsApp
                                  </a>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-2.5">
                              <p className="font-medium text-zinc-800">{sale.car_name}</p>
                              <p className="text-[11px] text-zinc-400">
                                {sellerDisplayName} ·{" "}
                                {new Date(sale.created_at).toLocaleDateString("pt-BR")}{" "}
                                {new Date(sale.created_at).toLocaleTimeString("pt-BR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              <StatusBadge status={sale.status} />
                            </td>
                            <td className="px-4 py-2.5 text-right font-medium text-zinc-900">
                              {formatMoney(Number(sale.total_price) || 0)}
                            </td>
                            <td
                              className="px-4 py-2.5 text-right"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => setSelectedSale(sale)}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-zinc-600 hover:bg-zinc-100"
                                  title="Ver detalhes"
                                >
                                  <Eye size={13} />
                                  Ver
                                </button>

                                {sale.status !== "Aprovado" && (
                                  <button
                                    onClick={async () => {
                                      if (!confirm("Aprovar esta proposta?")) return;
                                      await updateStatus(sale.id, "Aprovado");
                                    }}
                                    disabled={isUpdating === sale.id}
                                    className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                                    title="Aprovar"
                                  >
                                    {isUpdating === sale.id ? (
                                      <Loader2 size={13} className="animate-spin" />
                                    ) : (
                                      <Check size={13} />
                                    )}
                                    Aprovar
                                  </button>
                                )}

                                {sale.status !== "Recusado" && (
                                  <button
                                    onClick={async () => {
                                      if (!confirm("Recusar esta proposta?")) return;
                                      await updateStatus(sale.id, "Recusado");
                                    }}
                                    disabled={isUpdating === sale.id}
                                    className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                                    title="Recusar"
                                  >
                                    {isUpdating === sale.id ? (
                                      <Loader2 size={13} className="animate-spin" />
                                    ) : (
                                      <XCircle size={13} />
                                    )}
                                    Recusar
                                  </button>
                                )}

                                <button
                                  onClick={async () => {
                                    if (!confirm("Excluir permanentemente?")) return;
                                    await deleteSale(sale.id);
                                  }}
                                  disabled={isDeleting === sale.id}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-zinc-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                  title="Excluir"
                                >
                                  {isDeleting === sale.id ? (
                                    <Loader2 size={13} className="animate-spin" />
                                  ) : (
                                    <Trash2 size={13} />
                                  )}
                                  Excluir
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {!loading && totalCount > 0 && (
                <div className="flex flex-col items-center justify-between gap-3 border-t border-zinc-200 px-4 py-3 sm:flex-row">
                  <p className="text-[12px] text-zinc-500">
                    {(page - 1) * pageSize + 1}–
                    {Math.min(page * pageSize, totalCount)} de {totalCount}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1 || loading}
                      className="h-8 border border-zinc-200 px-3 text-[12px] font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-40"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages || loading}
                      className="h-8 border border-zinc-200 px-3 text-[12px] font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-40"
                    >
                      Próxima
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {selectedSale && (
        <ModalDetalhes
          sale={selectedSale}
          onClose={() => setSelectedSale(null)}
          onUpdateStatus={updateStatus}
          onDelete={deleteSale}
          isDeleting={isDeleting === selectedSale.id}
        />
      )}
    </div>
  );
}