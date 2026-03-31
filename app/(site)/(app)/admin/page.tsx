"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

import {
  LayoutDashboard,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  CarFront,
  Loader2,
  TrendingUp,
  Users,
  Wallet,
  LogOut,
  ArrowRight,
  Plus,
  FileText,
  Trash2,
  Check,
  Phone,
  Eye,
  X,
  CalendarRange,
  ArrowUpDown,
  BadgeCheck,
  ChevronDown,
  ChevronUp,
  UserSearch,
  Database,
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

const buildSaleIdentityKey = (sale: any) => {
  const clientCpf = onlyDigits(sale?.client_cpf || "");
  const clientPhone = onlyDigits(sale?.client_phone || "");
  const clientName = lowerText(sale?.client_name || "");
  const carName = lowerText(sale?.car_name || "");
  const total = Number(sale?.total_price || 0).toFixed(2);

  const created = sale?.created_at ? new Date(sale.created_at) : null;
  const minuteKey =
    created && !Number.isNaN(created.getTime())
      ? created.toISOString().slice(0, 16)
      : "";

  return [clientCpf || clientPhone || clientName, clientName, carName, total, minuteKey].join(
    "|"
  );
};

const saleScore = (sale: any) => {
  let score = 0;

  const detailsSeller = cleanText(sale?.details?.vendedor_digitado);
  const rootSeller = cleanText(sale?.seller_name);

  if (detailsSeller) score += 100;
  if (rootSeller && !isEmailLike(rootSeller)) score += 50;
  if (sale?.client_email) score += 10;
  if (sale?.approved_at) score += 5;
  if (sale?.approved_by_name) score += 2;

  return score;
};

const dedupeSales = (rows: any[]) => {
  const map = new Map<string, any>();

  for (const row of rows) {
    const key = buildSaleIdentityKey(row);
    const current = map.get(key);

    if (!current) {
      map.set(key, row);
      continue;
    }

    const currentScore = saleScore(current);
    const rowScore = saleScore(row);

    if (rowScore > currentScore) {
      map.set(key, row);
      continue;
    }

    if (rowScore === currentScore) {
      const currentCreated = new Date(current?.created_at || 0).getTime();
      const rowCreated = new Date(row?.created_at || 0).getTime();

      if (rowCreated > currentCreated) {
        map.set(key, row);
      }
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(b?.created_at || 0).getTime() - new Date(a?.created_at || 0).getTime()
  );
};

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

  const formatMoney = (val: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(val || 0));

  const statusColor =
    sale?.status === "Aprovado"
      ? "bg-green-50 text-green-800 border-green-200"
      : sale?.status === "Recusado"
      ? "bg-red-50 text-red-800 border-red-200"
      : "bg-yellow-50 text-yellow-800 border-yellow-200";

  const sellerEmailLabel = useMemo(() => {
    const email = String(sale?.profiles?.email || "").trim();
    if (!email || !email.includes("@")) return "—";
    return email.split("@")[0].toUpperCase();
  }, [sale]);

  const sellerDisplayName = useMemo(() => normalizeSellerDisplayName(sale), [sale]);

  if (!sale) return null;

  const waDigits = toWhatsDigits(sale.client_phone);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:p-0">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Detalhes da Proposta
            </p>
            <h2 className="flex items-center gap-2 text-lg font-black text-slate-900">
              <CarFront size={18} />
              {sale.car_name || "—"}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase ${statusColor}`}
              >
                {sale.status}
              </span>
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase text-slate-700">
                Tipo: {sale.interest_type || "—"}
              </span>
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-black uppercase text-slate-700">
                Total: {formatMoney(Number(sale.total_price) || 0)}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50"
            title="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="mb-3 flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-black uppercase tracking-widest text-slate-400">
                <Users size={14} /> Cliente
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 min-w-0">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Nome</p>
                  <p className="truncate text-sm font-bold text-slate-900">
                    {sale.client_name || "—"}
                  </p>
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase text-slate-400">CPF</p>
                  <p className="truncate font-mono text-sm text-slate-700">
                    {sale.client_cpf || "—"}
                  </p>
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Telefone</p>
                  <p className="truncate font-mono text-sm text-slate-700">
                    {sale.client_phone || "—"}
                  </p>
                  {waDigits && (
                    <a
                      href={`https://wa.me/${waDigits}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1 rounded bg-green-100 px-2 py-0.5 text-[10px] font-bold uppercase text-green-700 hover:text-green-900"
                    >
                      <Phone size={10} /> WhatsApp
                    </a>
                  )}
                </div>

                <div className="col-span-2">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Criado em</p>
                  <p className="text-sm font-medium text-slate-700">
                    {new Date(sale.created_at).toLocaleDateString("pt-BR")} às{" "}
                    {new Date(sale.created_at).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="mb-3 flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-black uppercase tracking-widest text-slate-400">
                <CarFront size={14} /> Proposta
              </h3>

              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400">Veículo</p>
                  <p className="text-lg font-black text-slate-900">{sale.car_name || "—"}</p>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-400">Tipo</p>
                    <span className="rounded bg-black px-2 py-1 text-[10px] font-bold uppercase text-white">
                      {sale.interest_type || "—"}
                    </span>
                  </div>

                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase text-slate-400">Valor</p>
                    <p className="text-sm font-black text-slate-900">
                      {formatMoney(Number(sale.total_price) || 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-2 text-xs font-black uppercase tracking-widest text-slate-400">
                <CheckCircle2 size={14} /> Vendedor
              </h3>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                  {sellerDisplayName !== "—" ? sellerDisplayName.substring(0, 2) : "VD"}
                </div>
                <div className="min-w-0 leading-tight">
                  <p className="truncate text-sm font-bold text-slate-900">
                    {sellerDisplayName}
                  </p>
                  <p className="truncate font-mono text-[10px] text-slate-500">
                    {sellerEmailLabel}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-2 text-xs font-black uppercase tracking-widest text-slate-400">
                <BadgeCheck size={14} /> Processamento
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400">Processado por</p>
                  <p className="text-sm font-bold text-slate-900">
                    {sale.approved_by_name || "Sistema"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400">Data</p>
                  <p className="text-sm font-medium text-slate-700">
                    {sale.approved_at
                      ? new Date(sale.approved_at).toLocaleString("pt-BR")
                      : "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 flex flex-col gap-3 border-t border-gray-100 bg-gray-50 p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            {sale.status !== "Aprovado" && (
              <button
                onClick={() => handleAction("Aprovado")}
                disabled={isProcessing}
                className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-xs font-bold uppercase text-white transition-colors hover:bg-green-700 disabled:opacity-60"
              >
                {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Aprovar
              </button>
            )}

            {sale.status !== "Recusado" && (
              <button
                onClick={() => handleAction("Recusado")}
                disabled={isProcessing}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-xs font-bold uppercase text-white transition-colors hover:bg-red-700 disabled:opacity-60"
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

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={async () => {
                if (!confirm("Excluir esta proposta permanentemente?")) return;
                await onDelete(sale.id);
                onClose();
              }}
              disabled={isDeleting}
              className="flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-xs font-bold uppercase text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
            >
              {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Excluir
            </button>

            <button
              onClick={onClose}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold uppercase text-slate-700 transition-colors hover:bg-gray-100"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
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
    slate: "border-slate-200 bg-white hover:bg-slate-50 text-slate-900",
    blue: "border-blue-100 bg-blue-50 hover:bg-blue-100 text-blue-800",
    emerald: "border-emerald-100 bg-emerald-50 hover:bg-emerald-100 text-emerald-800",
    amber: "border-amber-100 bg-amber-50 hover:bg-amber-100 text-amber-800",
    indigo: "border-indigo-100 bg-indigo-50 hover:bg-indigo-100 text-indigo-800",
  };

  return (
    <Link
      href={href}
      className={`rounded-2xl border p-4 transition-all ${toneMap[tone]}`}
    >
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white/70 shadow-sm">
        {icon}
      </div>
      <h3 className="text-sm font-black uppercase">{title}</h3>
      <p className="mt-1 text-xs font-medium opacity-80">{description}</p>
    </Link>
  );
}

export default function AdminDashboard() {
  const router = useRouter();

  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

const [transactionsExpanded, setTransactionsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const [sortKey, setSortKey] = useState<
    "created_at" | "total_price" | "status" | "client_name"
  >("created_at");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const [selectedSale, setSelectedSale] = useState<any>(null);

  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(val || 0));

  const todayLabel = useMemo(() => new Date().toLocaleDateString("pt-BR"), []);

  const isWithinDateRange = (createdAt: string) => {
    const d = new Date(createdAt);
    if (dateFrom) {
      const from = new Date(dateFrom + "T00:00:00");
      if (d < from) return false;
    }
    if (dateTo) {
      const to = new Date(dateTo + "T23:59:59");
      if (d > to) return false;
    }
    return true;
  };

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir("desc");
  };

  const getTodayRangeISO = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
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
  };

  const fetchSales = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("sales")
        .select(`*, profiles:seller_id (email)`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const rows = (data || []).map((r: any) => ({
        ...r,
        status: cleanText(r?.status) || "Aprovado",
      }));

      setSales(dedupeSales(rows));
    } catch (err) {
      console.error("Erro ao buscar vendas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const openSale = async (sale: any) => {
    setSelectedSale(sale);
  };

  const StatusBadge = ({ status }: { status: string }) => {
    let styles = "bg-gray-100 text-gray-600";
    let icon = <Clock size={12} />;

    if (status === "Aprovado") {
      styles = "bg-green-100 text-green-700 border-green-200";
      icon = <CheckCircle2 size={12} />;
    } else if (status === "Recusado") {
      styles = "bg-red-100 text-red-700 border-red-200";
      icon = <XCircle size={12} />;
    } else if (status === "Aguardando Aprovação") {
      styles = "bg-yellow-100 text-yellow-800 border-yellow-200";
      icon = <Clock size={12} />;
    }

    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${styles}`}
      >
        {icon} {status}
      </span>
    );
  };

const filteredBase = useMemo(() => {
  const term = searchTerm.trim().toLowerCase();

  return sales
    .filter((sale) => {
      const matchesDate = isWithinDateRange(sale.created_at);
      const sellerDisplay = normalizeSellerDisplayName(sale).toLowerCase();

      const matchesSearch =
        !term ||
        sale.client_name?.toLowerCase().includes(term) ||
        sale.car_name?.toLowerCase().includes(term) ||
        sellerDisplay.includes(term) ||
        sale.profiles?.email?.toLowerCase().includes(term) ||
        sale.client_cpf?.toLowerCase().includes(term);

      return matchesDate && matchesSearch;
    })
    .sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;

      if (sortKey === "created_at") {
        return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir;
      }
      if (sortKey === "total_price") {
        return ((Number(a.total_price) || 0) - (Number(b.total_price) || 0)) * dir;
      }
      return String(a.client_name || "").localeCompare(
        String(b.client_name || ""),
        "pt-BR"
      ) * dir;
    });
}, [sales, searchTerm, dateFrom, dateTo, sortKey, sortDir]);

useEffect(() => {
  setPage(1);
}, [searchTerm, dateFrom, dateTo, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredBase.length / pageSize));

  const filteredSales = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredBase.slice(start, start + pageSize);
  }, [filteredBase, page]);

  const kpis = useMemo(() => {
    const rows = filteredBase;

    const total = rows.length;
    const approved = rows.filter((s) => s.status === "Aprovado");
    const refused = rows.filter((s) => s.status === "Recusado");
    const revenue = rows.reduce((acc, s) => acc + (Number(s.total_price) || 0), 0);

    const { startISO, endISO } = getTodayRangeISO();
    const todaySales = rows.filter((s) => {
      const created = new Date(s.created_at).toISOString();
      return created >= startISO && created <= endISO;
    });

    const approvedToday = todaySales.filter((s) => s.status === "Aprovado").length;
    const refusedToday = todaySales.filter((s) => s.status === "Recusado").length;
    const conversion = total ? (approved.length / total) * 100 : 0;

    return {
      total,
      approved: approved.length,
      refused: refused.length,
      revenue,
      conversion,
      approvedToday,
      refusedToday,
    };
  }, [filteredBase]);

  const todaySection = useMemo(() => {
    const { startISO, endISO } = getTodayRangeISO();
    const todayAll = sales
      .filter((s) => {
        const created = new Date(s.created_at).toISOString();
        return created >= startISO && created <= endISO;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const totalToday = todayAll.length;
    const approvedToday = todayAll.filter((s) => s.status === "Aprovado").length;

    return { list: todayAll, totalToday, approvedToday };
  }, [sales]);

  const updateStatus = async (saleId: string, newStatus: string) => {
    try {
      setIsUpdating(saleId);

      const payload: any = { status: newStatus };

      if (newStatus === "Aprovado") {
        payload.approved_at = new Date().toISOString();
        payload.approved_by_name = cleanText(payload.approved_by_name) || "Sistema";
      }

      if (newStatus === "Recusado") {
        payload.approved_at = new Date().toISOString();
        payload.approved_by_name = "Admin";
      }

      const { error } = await supabase.from("sales").update(payload).eq("id", saleId);
      if (error) throw error;

      setSales((prev) => dedupeSales(prev.map((s) => (s.id === saleId ? { ...s, ...payload } : s))));
      if (selectedSale?.id === saleId) setSelectedSale((prev: any) => ({ ...prev, ...payload }));
      alert(`Status atualizado para: ${newStatus}`);
    } catch (error: any) {
      alert("Erro: " + (error?.message || "falha ao atualizar"));
    } finally {
      setIsUpdating(null);
    }
  };

  const deleteSale = async (saleId: string) => {
    setIsDeleting(saleId);
    try {
      const { error } = await supabase.from("sales").delete().eq("id", saleId);
      if (error) throw error;

      setSales((prev) => prev.filter((s) => s.id !== saleId));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(saleId);
        return next;
      });
    } catch (error: any) {
      alert("Erro: " + (error?.message || "falha ao excluir"));
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
      filteredSales.forEach((s) => next.add(s.id));
      return next;
    });
  };

  const bulkUpdate = async (status: "Aprovado" | "Recusado") => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return alert("Selecione ao menos 1 item.");
    if (!confirm(`Aplicar status "${status}" em ${ids.length} propostas?`)) return;

    for (const id of ids) await updateStatus(id as any, status);
    clearSelection();
  };

  const bulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return alert("Selecione ao menos 1 item.");
    if (!confirm(`Excluir permanentemente ${ids.length} propostas?`)) return;

    for (const id of ids) await deleteSale(id as any);
    clearSelection();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans text-slate-900">
      {selectedSale && (
        <ModalDetalhes
          sale={selectedSale}
          onClose={() => setSelectedSale(null)}
          onUpdateStatus={updateStatus}
          onDelete={deleteSale}
          isDeleting={isDeleting === selectedSale.id}
        />
      )}

      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-black p-2 text-[#f2e14c]">
              <LayoutDashboard size={20} />
            </div>
            <div>
              <h1 className="text-lg font-black uppercase tracking-tight">Admin Dashboard</h1>
              <p className="text-xs font-bold text-gray-400">
                WBCNAC • {todayLabel}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/vendedor/dashboard")}
              className="hidden items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 transition-all hover:bg-white hover:text-black md:flex"
            >
              <ArrowRight size={14} /> Visão Vendedor
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-2 text-xs font-bold text-red-600 hover:text-red-700"
            >
              <LogOut size={16} /> Sair
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-green-50 p-2 text-green-600">
                <Wallet size={18} />
              </div>
              <span className="text-[10px] font-black uppercase text-slate-400">Receita</span>
            </div>
            <p className="mt-2 text-xs font-bold uppercase text-slate-500">Total</p>
            <h3 className="text-xl font-black text-slate-900">
              {new Intl.NumberFormat("pt-BR", {
                notation: "compact",
                style: "currency",
                currency: "BRL",
              }).format(kpis.revenue)}
            </h3>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                <Users size={18} />
              </div>
              <span className="text-[10px] font-black uppercase text-slate-400">Propostas</span>
            </div>
            <p className="mt-2 text-xs font-bold uppercase text-slate-500">Total</p>
            <h3 className="text-2xl font-black text-slate-900">{kpis.total}</h3>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-purple-50 p-2 text-purple-600">
                <TrendingUp size={18} />
              </div>
              <span className="text-[10px] font-black uppercase text-slate-400">Conversão</span>
            </div>
            <p className="mt-2 text-xs font-bold uppercase text-slate-500">Aprovadas</p>
            <h3 className="text-2xl font-black text-slate-900">{kpis.conversion.toFixed(0)}%</h3>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700">
                <CheckCircle2 size={18} />
              </div>
              <span className="text-[10px] font-black uppercase text-slate-400">Aprovadas</span>
            </div>
            <p className="mt-2 text-xs font-bold uppercase text-slate-500">Total</p>
            <h3 className="text-2xl font-black text-slate-900">{kpis.approved}</h3>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-amber-50 p-2 text-amber-700">
                <CalendarRange size={18} />
              </div>
              <span className="text-[10px] font-black uppercase text-slate-400">Hoje</span>
            </div>
            <p className="mt-2 text-xs font-bold uppercase text-slate-500">Pedidos</p>
            <h3 className="text-2xl font-black text-slate-900">{todaySection.totalToday}</h3>
            <p className="mt-1 text-[11px] font-bold text-slate-500">
              Aprovadas: <span className="text-slate-900">{todaySection.approvedToday}</span>
            </p>
          </div>
        </div>

        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wide text-slate-900">
                Ações rápidas
              </h2>
              <p className="text-xs font-medium text-slate-500">
                Atalhos principais do painel administrativo
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={setFilterToToday}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                <CalendarRange size={14} /> Filtrar Hoje
              </button>

              <button
                onClick={fetchSales}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                <Loader2 size={14} className={loading ? "animate-spin" : ""} />
                Atualizar
              </button>
            </div>
          </div>

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
          </div>
        </div>

        <div className="mb-6 space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
<div className="flex flex-col gap-3">
  <div className="relative w-full">
    <Search
      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
      size={18}
    />
    <input
      type="text"
      placeholder="Buscar cliente, veículo, vendedor ou CPF..."
      className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm font-medium transition-all focus:border-black focus:outline-none"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />
  </div>

  <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
    <div className="flex w-full flex-col gap-2 md:flex-row md:flex-wrap md:items-center">
      <div className="flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 md:w-auto">
        <CalendarRange size={16} className="text-slate-400" />
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="bg-transparent text-xs font-bold text-slate-700 outline-none"
          title="Data inicial"
        />
        <span className="text-slate-300">—</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="bg-transparent text-xs font-bold text-slate-700 outline-none"
          title="Data final"
        />
      </div>

      {(dateFrom || dateTo) && (
        <button
          onClick={() => {
            setDateFrom("");
            setDateTo("");
          }}
          className="text-xs font-bold text-slate-500 underline decoration-dotted underline-offset-4 hover:text-black"
        >
          Limpar datas
        </button>
      )}

      <button
        onClick={() => toggleSort("created_at")}
        className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold uppercase ${
          sortKey === "created_at"
            ? "border-black bg-black text-white"
            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
        }`}
      >
        <ArrowUpDown size={14} /> Data {sortKey === "created_at" ? `(${sortDir})` : ""}
      </button>

      <button
        onClick={() => toggleSort("total_price")}
        className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold uppercase ${
          sortKey === "total_price"
            ? "border-black bg-black text-white"
            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
        }`}
      >
        <ArrowUpDown size={14} /> Valor {sortKey === "total_price" ? `(${sortDir})` : ""}
      </button>

      <button
        onClick={() => toggleSort("client_name")}
        className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold uppercase ${
          sortKey === "client_name"
            ? "border-black bg-black text-white"
            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
        }`}
      >
        <ArrowUpDown size={14} /> Cliente {sortKey === "client_name" ? `(${sortDir})` : ""}
      </button>
    </div>
  </div>
</div>

          {selectedIds.size > 0 && (
            <div className="flex flex-col items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 md:flex-row">
              <div className="text-xs font-black uppercase text-slate-600">
                Selecionados: <span className="text-slate-900">{selectedIds.size}</span>
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <button
                  onClick={selectAllOnPage}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold uppercase hover:bg-slate-50"
                >
                  Selecionar página
                </button>

                <button
                  onClick={() => bulkUpdate("Aprovado")}
                  className="rounded-lg bg-green-600 px-3 py-2 text-xs font-bold uppercase text-white hover:bg-green-700"
                >
                  Aprovar lote
                </button>

                <button
                  onClick={() => bulkUpdate("Recusado")}
                  className="rounded-lg bg-red-600 px-3 py-2 text-xs font-bold uppercase text-white hover:bg-red-700"
                >
                  Recusar lote
                </button>

                <button
                  onClick={bulkDelete}
                  className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold uppercase text-white hover:bg-black"
                >
                  Excluir lote
                </button>

                <button
                  onClick={clearSelection}
                  className="text-xs font-bold uppercase text-slate-600 underline decoration-dotted underline-offset-4 hover:text-black"
                >
                  Limpar seleção
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mb-8 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 p-4">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wide text-slate-900">
                Pedidos do Dia
              </h3>
              <p className="text-xs text-slate-500">
                {todaySection.totalToday} pedidos hoje
              </p>
            </div>
          </div>

          <div className="p-4">
            <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] font-bold uppercase text-slate-500">Total Hoje</p>
                <p className="text-2xl font-black text-slate-900">{todaySection.totalToday}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] font-bold uppercase text-slate-500">Aprovadas</p>
                <p className="text-2xl font-black text-slate-900">{todaySection.approvedToday}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] font-bold uppercase text-slate-500">Receita Filtrada</p>
                <p className="text-xl font-black text-slate-900">
                  {new Intl.NumberFormat("pt-BR", {
                    notation: "compact",
                    style: "currency",
                    currency: "BRL",
                  }).format(kpis.revenue)}
                </p>
              </div>
            </div>

            {todaySection.list.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-sm font-medium text-slate-400">
                Sem propostas por enquanto.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left">
                  <thead className="border-b border-slate-200 bg-slate-50 text-[10px] font-semibold uppercase text-slate-500">
                    <tr>
                      <th className="min-w-[180px] px-4 py-3">Cliente</th>
                      <th className="min-w-[220px] px-4 py-3">Veículo</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-right">Valor</th>
                      <th className="px-4 py-3 text-right">Hora</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {todaySection.list.slice(0, 10).map((sale: any) => (
                      <tr
                        key={sale.id}
                        onClick={() => openSale(sale)}
                        className="cursor-pointer hover:bg-slate-50"
                      >
                        <td className="px-4 py-3">
                          <p className="max-w-[260px] truncate text-xs font-bold uppercase text-slate-900">
                            {sale.client_name}
                          </p>
                          <p className="max-w-[260px] truncate font-mono text-[10px] text-slate-400">
                            {sale.client_cpf}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="max-w-[320px] truncate text-xs font-bold text-slate-800">
                            {sale.car_name}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            Vendedor: {normalizeSellerDisplayName(sale)}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <StatusBadge status={sale.status} />
                        </td>
                        <td className="px-4 py-3 text-right text-xs font-black text-slate-900">
                          {formatCurrency(Number(sale.total_price) || 0)}
                        </td>
                        <td className="px-4 py-3 text-right text-xs font-bold text-slate-600">
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
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <button
            onClick={() => setTransactionsExpanded((v) => !v)}
            className="flex w-full items-center justify-between border-b border-slate-100 p-4 text-left"
          >
            <div>
              <h3 className="font-bold text-slate-800">Transações</h3>
              <p className="text-xs text-slate-500">
                {filteredBase.length} resultado(s)
              </p>
            </div>

            <div className="flex items-center gap-2 text-slate-500">
              <span className="text-xs font-bold uppercase">
                {transactionsExpanded ? "Recolher" : "Expandir"}
              </span>
              {transactionsExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
          </button>

          {transactionsExpanded && (
            <>
              {loading ? (
                <div className="flex flex-col items-center justify-center p-12 text-slate-400">
                  <Loader2 className="mb-2 animate-spin" size={32} />
                  <p className="text-xs font-bold uppercase">Carregando...</p>
                </div>
              ) : filteredBase.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <p className="text-sm font-medium">Nenhuma proposta encontrada.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                      <tr>
                        <th className="w-[40px] px-6 py-4 text-center">Sel.</th>
                        <th className="min-w-[200px] px-6 py-4">Cliente</th>
                        <th className="min-w-[220px] px-6 py-4">Veículo</th>
                        <th className="px-6 py-4 text-center">Status</th>
                        <th className="px-6 py-4 text-right">Valor</th>
                        <th className="px-6 py-4 text-right">Ações</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {filteredSales.map((sale) => {
                        const checked = selectedIds.has(sale.id);
                        const waDigits = toWhatsDigits(sale.client_phone);
                        const sellerDisplayName = normalizeSellerDisplayName(sale);

                        return (
                          <tr
                            key={sale.id}
                            onClick={() => openSale(sale)}
                            className="group cursor-pointer transition-colors hover:bg-slate-50"
                          >
                            <td
                              className="px-6 py-4 text-center"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleSelect(sale.id)}
                                className="h-4 w-4 accent-black"
                              />
                            </td>

                            <td className="px-6 py-4">
                              <p className="text-sm font-bold uppercase text-slate-900">
                                {sale.client_name}
                              </p>
                              <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-400">
                                <span className="font-mono">{sale.client_cpf}</span>
                                {waDigits && (
                                  <a
                                    href={`https://wa.me/${waDigits}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="ml-2 text-green-600 hover:text-green-800"
                                    title="WhatsApp"
                                  >
                                    <Phone size={12} />
                                  </a>
                                )}
                              </div>
                            </td>

                            <td className="px-6 py-4 text-xs font-medium text-slate-600">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-800">{sale.car_name}</span>
                                <span className="text-[9px] text-slate-400">
                                  Vendedor: {sellerDisplayName}
                                </span>
                                <span className="text-[9px] text-slate-400">
                                  {new Date(sale.created_at).toLocaleDateString("pt-BR")}{" "}
                                  {new Date(sale.created_at).toLocaleTimeString("pt-BR", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                            </td>

                            <td className="px-6 py-4 text-center">
                              <StatusBadge status={sale.status} />
                            </td>

                            <td className="px-6 py-4 text-right text-sm font-bold text-slate-800">
                              {formatCurrency(Number(sale.total_price) || 0)}
                            </td>

                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2 opacity-100 transition-opacity md:opacity-0 group-hover:opacity-100">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openSale(sale);
                                  }}
                                  className="rounded-lg border border-blue-100 bg-blue-50 p-2 text-blue-600 transition-all hover:bg-blue-100"
                                  title="Ver Detalhes"
                                >
                                  <Eye size={14} />
                                </button>

                                {sale.status !== "Aprovado" && (
                                  <button
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      if (!confirm("Aprovar esta proposta?")) return;
                                      await updateStatus(sale.id, "Aprovado");
                                    }}
                                    disabled={isUpdating === sale.id}
                                    className="rounded-lg border border-green-100 bg-green-50 p-2 text-green-600 transition-all hover:bg-green-100"
                                    title="Aprovar"
                                  >
                                    {isUpdating === sale.id ? (
                                      <Loader2 size={14} className="animate-spin" />
                                    ) : (
                                      <Check size={14} />
                                    )}
                                  </button>
                                )}

                                {sale.status !== "Recusado" && (
                                  <button
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      if (!confirm("Recusar esta proposta?")) return;
                                      await updateStatus(sale.id, "Recusado");
                                    }}
                                    disabled={isUpdating === sale.id}
                                    className="rounded-lg border border-red-100 bg-red-50 p-2 text-red-600 transition-all hover:bg-red-100"
                                    title="Recusar"
                                  >
                                    {isUpdating === sale.id ? (
                                      <Loader2 size={14} className="animate-spin" />
                                    ) : (
                                      <XCircle size={14} />
                                    )}
                                  </button>
                                )}

                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (!confirm("Excluir esta transação permanentemente?")) return;
                                    await deleteSale(sale.id);
                                  }}
                                  disabled={isDeleting === sale.id}
                                  className="rounded-lg bg-slate-100 p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                                  title="Excluir"
                                >
                                  {isDeleting === sale.id ? (
                                    <Loader2 size={14} className="animate-spin" />
                                  ) : (
                                    <Trash2 size={14} />
                                  )}
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

              {!loading && filteredBase.length > 0 && (
                <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 p-4 md:flex-row">
                  <div className="text-[11px] font-bold text-slate-400">
                    Mostrando{" "}
                    <span className="text-slate-800">
                      {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filteredBase.length)}
                    </span>{" "}
                    de <span className="text-slate-800">{filteredBase.length}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold uppercase text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                    >
                      Anterior
                    </button>

                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold uppercase text-slate-600 hover:bg-slate-50 disabled:opacity-40"
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
    </div>
  );
}