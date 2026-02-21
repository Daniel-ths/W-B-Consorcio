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
  Filter,
  ArrowUpDown,
  AlertTriangle,
  Timer,
  BadgeCheck,
  ShieldCheck,
} from "lucide-react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// =========================
// MODAL (ADMIN) — com auditoria + ações completas
// =========================
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
  if (!sale) return null;

  const [isProcessing, setIsProcessing] = useState(false);

  const handleAction = async (status: string) => {
    setIsProcessing(true);
    await onUpdateStatus(sale.id, status);
    setIsProcessing(false);
  };

  const formatMoney = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
      Number(val || 0)
    );

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("pt-BR") +
    " às " +
    new Date(date).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const statusColor =
    sale.status === "Aprovado"
      ? "bg-green-50 text-green-800"
      : sale.status === "Recusado"
      ? "bg-red-50 text-red-800"
      : "bg-yellow-50 text-yellow-800";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex justify-between items-center z-10">
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
              Detalhes da Proposta
            </h2>
            <p className="text-xs text-slate-500 font-bold">ID: {sale.id.slice(0, 8)}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-8">
          {/* Status + ações */}
          <div
            className={`p-4 rounded-xl flex flex-col md:flex-row md:items-center md:justify-between gap-3 ${statusColor}`}
          >
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">
                Status Atual
              </span>
              <span className="font-black text-sm uppercase flex items-center gap-2 mt-1">
                {sale.status === "Aprovado" && <CheckCircle2 size={18} />}
                {sale.status === "Recusado" && <XCircle size={18} />}
                {sale.status === "Aguardando Aprovação" && <Clock size={18} />}
                {sale.status}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleAction("Aguardando Aprovação")}
                disabled={isProcessing}
                className="bg-white/70 hover:bg-white px-3 py-2 rounded-lg text-[10px] font-black uppercase border border-white/70"
              >
                Reabrir
              </button>

              <button
                onClick={() => handleAction("Aprovado")}
                disabled={isProcessing}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase hover:bg-green-700 flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                {isProcessing ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : (
                  <Check size={14} />
                )}{" "}
                Aprovar
              </button>

              <button
                onClick={() => handleAction("Recusado")}
                disabled={isProcessing}
                className="bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase hover:bg-red-700 flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                {isProcessing ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : (
                  <X size={14} />
                )}{" "}
                Recusar
              </button>

              <button
                onClick={async () => {
                  if (!confirm("Excluir permanentemente esta transação?")) return;
                  await onDelete(sale.id);
                  onClose();
                }}
                disabled={isDeleting}
                className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase hover:bg-black flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                {isDeleting ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : (
                  <Trash2 size={14} />
                )}{" "}
                Excluir
              </button>
            </div>
          </div>

          {/* Grid: Cliente + Venda */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cliente */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-200 pb-2 flex items-center gap-2">
                <Users size={14} /> Cliente
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Nome</p>
                  <p className="text-sm font-bold text-slate-900">{sale.client_name}</p>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">CPF</p>
                  <p className="text-sm font-mono text-slate-700">{sale.client_cpf}</p>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Telefone</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-mono text-slate-700">{sale.client_phone || "--"}</p>
                    {sale.client_phone && (
                      <a
                        href={`https://wa.me/55${sale.client_phone.replace(/\D/g, "")}`}
                        target="_blank"
                        className="text-green-700 hover:text-green-900 bg-green-100 px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1"
                      >
                        <Phone size={10} /> WhatsApp
                      </a>
                    )}
                  </div>
                </div>

                <div className="col-span-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Criado em</p>
                  <p className="text-sm font-medium text-slate-700">{formatDate(sale.created_at)}</p>
                </div>
              </div>
            </div>

            {/* Venda */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-200 pb-2 flex items-center gap-2">
                <CarFront size={14} /> Proposta
              </h3>

              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Veículo</p>
                  <p className="text-lg font-black text-slate-900">{sale.car_name}</p>
                </div>

                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Tipo</p>
                  <span className="bg-black text-white text-[10px] font-bold px-2 py-1 rounded uppercase">
                    {sale.interest_type}
                  </span>
                </div>
              </div>

              <div className="mt-4 border-t border-slate-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Valor Total</span>
                  <span className="font-black text-slate-900">{formatMoney(sale.total_price)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Responsável + Auditoria */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Vendedor */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
                <CheckCircle2 size={14} /> Vendedor
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {sale.seller_name ? sale.seller_name.substring(0, 2).toUpperCase() : "VD"}
                </div>
                <div className="leading-tight">
                  <p className="text-sm font-bold text-slate-900">{sale.seller_name || "—"}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{sale.profiles?.email || "—"}</p>
                </div>
              </div>
            </div>

            {/* Auditoria */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
                <ShieldCheck size={14} /> Auditoria
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Aprovador</p>
                  <p className="text-sm font-bold text-slate-900">{sale.approved_by_name || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Data</p>
                  <p className="text-sm font-medium text-slate-700">
                    {sale.approved_at ? new Date(sale.approved_at).toLocaleString("pt-BR") : "—"}
                  </p>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 font-bold mt-3">
                * Auditoria só aparece se você estiver salvando approved_by_* e approved_at.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-6 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-white border border-gray-200 text-slate-700 font-bold text-xs uppercase rounded-lg hover:bg-gray-100 transition-colors"
          >
            Fechar
          </button>
          <button
            onClick={() => window.print()}
            className="px-6 py-2.5 bg-black text-white font-bold text-xs uppercase rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2"
          >
            <FileText size={14} /> Imprimir
          </button>
        </div>
      </div>
    </div>
  );
}

// =========================
// ADMIN DASHBOARD — “torre de controle”
// =========================
export default function AdminDashboard() {
  const router = useRouter();

  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // filtros
  const [filterStatus, setFilterStatus] = useState("TODOS");
  const [searchTerm, setSearchTerm] = useState("");

  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  // ordenação + paginação
  const [sortKey, setSortKey] = useState<"created_at" | "total_price" | "status" | "client_name">(
    "created_at"
  );
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // modal
  const [selectedSale, setSelectedSale] = useState<any>(null);

  // ações
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // seleção (lote)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(val || 0));

  const todayLabel = useMemo(() => new Date().toLocaleDateString("pt-BR"), []);

  // helpers
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

  const hoursSince = (iso: string) => (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60);

  const priorityLabel = (sale: any) => {
    if (sale.status !== "Aguardando Aprovação") return null;
    const h = hoursSince(sale.created_at);
    if (h >= 48)
      return {
        label: "Crítico",
        cls: "bg-red-100 text-red-700 border-red-200",
        icon: <AlertTriangle size={12} />,
      };
    if (h >= 24)
      return {
        label: "Atenção",
        cls: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: <Timer size={12} />,
      };
    return {
      label: "Normal",
      cls: "bg-slate-100 text-slate-600 border-slate-200",
      icon: <Clock size={12} />,
    };
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

  const resolveSellerKey = (sale: any) =>
    sale?.seller_name || sale?.profiles?.email || sale?.seller_id || "Desconhecido";

  const setFilterToToday = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const iso = `${y}-${m}-${d}`;
    setDateFrom(iso);
    setDateTo(iso);
  };

  // fetch
  const fetchSales = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("sales")
        .select(`*, profiles:seller_id (email)`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSales(data || []);
    } catch (err) {
      console.error("Erro ao buscar vendas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  // =========================
  // Status Badge
  // =========================
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
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border ${styles}`}
      >
        {icon} {status}
      </span>
    );
  };

  // =========================
  // Filtragem + ordenação
  // =========================
  const filteredBase = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return sales
      .filter((sale) => {
        const matchesStatus = filterStatus === "TODOS" || sale.status === filterStatus;
        const matchesDate = isWithinDateRange(sale.created_at);

        const matchesSearch =
          !term ||
          sale.client_name?.toLowerCase().includes(term) ||
          sale.car_name?.toLowerCase().includes(term) ||
          sale.seller_name?.toLowerCase().includes(term) ||
          sale.profiles?.email?.toLowerCase().includes(term) ||
          sale.client_cpf?.toLowerCase().includes(term);

        return matchesStatus && matchesDate && matchesSearch;
      })
      .sort((a, b) => {
        const dir = sortDir === "asc" ? 1 : -1;

        if (sortKey === "created_at") {
          return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir;
        }
        if (sortKey === "total_price") {
          return ((Number(a.total_price) || 0) - (Number(b.total_price) || 0)) * dir;
        }
        if (sortKey === "status") {
          return String(a.status || "").localeCompare(String(b.status || ""), "pt-BR") * dir;
        }
        // client_name
        return String(a.client_name || "").localeCompare(String(b.client_name || ""), "pt-BR") * dir;
      });
  }, [sales, filterStatus, searchTerm, dateFrom, dateTo, sortKey, sortDir]);

  useEffect(() => {
    setPage(1);
  }, [filterStatus, searchTerm, dateFrom, dateTo, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredBase.length / pageSize));

  const filteredSales = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredBase.slice(start, start + pageSize);
  }, [filteredBase, page]);

  // =========================
  // KPIs “executivos”
  // =========================
  const kpis = useMemo(() => {
    const rows = filteredBase;

    const total = rows.length;
    const pending = rows.filter((s) => s.status === "Aguardando Aprovação");
    const approved = rows.filter((s) => s.status === "Aprovado");
    const refused = rows.filter((s) => s.status === "Recusado");

    const revenue = rows.reduce((acc, s) => acc + (Number(s.total_price) || 0), 0);
    const ticket = total ? revenue / total : 0;

    const decided = rows.filter(
      (s) => (s.status === "Aprovado" || s.status === "Recusado") && s.approved_at
    );
    const avgDecisionHours = decided.length
      ? decided.reduce((acc, s) => {
          const h =
            (new Date(s.approved_at).getTime() - new Date(s.created_at).getTime()) /
            (1000 * 60 * 60);
          return acc + (h > 0 ? h : 0);
        }, 0) / decided.length
      : 0;

    const pendingOver24 = pending.filter((s) => hoursSince(s.created_at) >= 24).length;
    const pendingOver48 = pending.filter((s) => hoursSince(s.created_at) >= 48).length;

    const conversion = total ? (approved.length / total) * 100 : 0;

    // hoje (no recorte)
    const { startISO, endISO } = getTodayRangeISO();
    const todaySales = rows.filter((s) => {
      const created = new Date(s.created_at).toISOString();
      return created >= startISO && created <= endISO;
    });
    const todayValue = todaySales.reduce((acc, s) => acc + (Number(s.total_price) || 0), 0);
    const approvedToday = todaySales.filter((s) => s.status === "Aprovado").length;

    return {
      total,
      pending: pending.length,
      approved: approved.length,
      refused: refused.length,
      revenue,
      ticket,
      avgDecisionHours,
      pendingOver24,
      pendingOver48,
      conversion,
      todayCount: todaySales.length,
      todayValue,
      approvedToday,
    };
  }, [filteredBase]);

  // =========================
  // Pedidos de Hoje (sempre do TOTAL, independente de filtro)
  // =========================
  const todaySection = useMemo(() => {
    const { startISO, endISO } = getTodayRangeISO();
    const todayAll = sales
      .filter((s) => {
        const created = new Date(s.created_at).toISOString();
        return created >= startISO && created <= endISO;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const totalToday = todayAll.length;
    const pendingToday = todayAll.filter((s) => s.status === "Aguardando Aprovação").length;
    const approvedToday = todayAll.filter((s) => s.status === "Aprovado").length;
    const refusedToday = todayAll.filter((s) => s.status === "Recusado").length;

    const valueToday = todayAll.reduce((acc, s) => acc + (Number(s.total_price) || 0), 0);

    return {
      list: todayAll,
      totalToday,
      pendingToday,
      approvedToday,
      refusedToday,
      valueToday,
    };
  }, [sales]);

  // =========================
  // Gráficos (30 dias) — sem funil
  // =========================
  const charts = useMemo(() => {
    const days = 30;
    const pad2 = (n: number) => String(n).padStart(2, "0");
    const keyOf = (dt: Date) => `${pad2(dt.getDate())}/${pad2(dt.getMonth() + 1)}`;

    const map = new Map<
      string,
      { date: string; total: number; approved: number; refused: number; pending: number; value: number }
    >();

    for (let i = days - 1; i >= 0; i--) {
      const dt = new Date();
      dt.setDate(dt.getDate() - i);
      const k = keyOf(dt);
      map.set(k, { date: k, total: 0, approved: 0, refused: 0, pending: 0, value: 0 });
    }

    sales.forEach((s) => {
      const dt = new Date(s.created_at);
      const k = keyOf(dt);
      const bucket = map.get(k);
      if (!bucket) return;

      bucket.total += 1;
      bucket.value += Number(s.total_price) || 0;

      if (s.status === "Aprovado") bucket.approved += 1;
      else if (s.status === "Recusado") bucket.refused += 1;
      else bucket.pending += 1;
    });

    const lineData = Array.from(map.values());

    const pieData = [
      { name: "Pendentes", value: kpis.pending },
      { name: "Aprovadas", value: kpis.approved },
      { name: "Recusadas", value: kpis.refused },
    ];

    return { lineData, pieData };
  }, [sales, kpis.pending, kpis.approved, kpis.refused]);

  const PIE_COLORS = ["#f59e0b", "#22c55e", "#ef4444"];

  // =========================
  // Ranking: Top vendedores (valor)
  // =========================
  const topSellersByValue = useMemo(() => {
    const map = new Map<string, { name: string; totalValue: number; count: number; approved: number }>();
    filteredBase.forEach((s) => {
      const key = resolveSellerKey(s);
      const curr = map.get(key) || { name: key, totalValue: 0, count: 0, approved: 0 };
      curr.count += 1;
      curr.totalValue += Number(s.total_price) || 0;
      if (s.status === "Aprovado") curr.approved += 1;
      map.set(key, curr);
    });

    return Array.from(map.values())
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 6);
  }, [filteredBase]);

  // =========================
  // Ações (status/delete) — Admin
  // =========================
  const updateStatus = async (saleId: string, newStatus: string) => {
    try {
      setIsUpdating(saleId);

      // (Admin) registra auditoria quando decide e limpa quando reabre
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;

      const payload: any = { status: newStatus };

      if (newStatus === "Aprovado" || newStatus === "Recusado") {
        payload.approved_at = new Date().toISOString();

        // tenta pegar nome/email do admin
        if (user?.id) {
          const { data: me } = await supabase
            .from("profiles")
            .select("email, name, full_name")
            .eq("id", user.id)
            .single();

          const displayName =
            (me as any)?.name || (me as any)?.full_name || (me as any)?.email || user.email || "Admin";

          payload.approved_by_id = user.id;
          payload.approved_by_name = displayName;
        }
      }

      if (newStatus === "Aguardando Aprovação") {
        payload.approved_at = null;
        payload.approved_by_id = null;
        payload.approved_by_name = null;
      }

      const { error } = await supabase.from("sales").update(payload).eq("id", saleId);
      if (error) throw error;

      setSales((prev) => prev.map((s) => (s.id === saleId ? { ...s, ...payload } : s)));

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

  // =========================
  // Lote (seleção)
  // =========================
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

  const bulkUpdate = async (status: "Aprovado" | "Recusado" | "Aguardando Aprovação") => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return alert("Selecione ao menos 1 item.");
    if (!confirm(`Aplicar status "${status}" em ${ids.length} propostas?`)) return;

    for (const id of ids) {
      await updateStatus(id, status);
    }
    clearSelection();
  };

  const bulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return alert("Selecione ao menos 1 item.");
    if (!confirm(`Excluir permanentemente ${ids.length} propostas?`)) return;

    for (const id of ids) {
      await deleteSale(id);
    }
    clearSelection();
  };

  // logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.replace("/login");
  };

  // =========================
  // UI
  // =========================
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {selectedSale && (
        <ModalDetalhes
          sale={selectedSale}
          onClose={() => setSelectedSale(null)}
          onUpdateStatus={updateStatus}
          onDelete={deleteSale}
          isDeleting={isDeleting === selectedSale.id}
        />
      )}

      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-black p-2 rounded-lg text-[#f2e14c]">
              <LayoutDashboard size={20} />
            </div>
            <div>
              <h1 className="text-lg font-black uppercase tracking-tight">Admin Dashboard</h1>
              <p className="text-xs text-gray-400 font-bold">WBCNAC • Torre de Controle • {todayLabel}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/vendedor/dashboard")}
              className="hidden md:flex text-xs font-medium text-slate-600 hover:text-black items-center gap-2 border border-slate-200 bg-slate-50 hover:bg-white px-3 py-2 rounded-md transition-all"
            >
              <ArrowRight size={14} /> Visão Vendedor
            </button>
            <div className="h-6 w-px bg-slate-200 mx-1"></div>
            <button
              onClick={handleLogout}
              className="text-red-600 hover:text-red-700 text-xs font-bold flex items-center gap-2 px-2"
            >
              <LogOut size={16} /> Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* TOP KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-green-50 rounded-lg text-green-600">
                <Wallet size={18} />
              </div>
              <span className="text-[10px] font-black uppercase text-slate-400">Receita</span>
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase mt-2">Total (recorte)</p>
            <h3 className="text-xl font-black text-slate-900">
              {new Intl.NumberFormat("pt-BR", {
                notation: "compact",
                style: "currency",
                currency: "BRL",
              }).format(kpis.revenue)}
            </h3>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <Users size={18} />
              </div>
              <span className="text-[10px] font-black uppercase text-slate-400">Volume</span>
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase mt-2">Propostas</p>
            <h3 className="text-2xl font-black text-slate-900">{kpis.total}</h3>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                <TrendingUp size={18} />
              </div>
              <span className="text-[10px] font-black uppercase text-slate-400">Eficiência</span>
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase mt-2">Conversão</p>
            <h3 className="text-2xl font-black text-slate-900">{kpis.conversion.toFixed(0)}%</h3>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-yellow-50 rounded-lg text-yellow-700">
                <Clock size={18} />
              </div>
              <span className="text-[10px] font-black uppercase text-slate-400">SLA</span>
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase mt-2">Pendentes</p>
            <h3 className="text-2xl font-black text-slate-900">{kpis.pending}</h3>
            <p className="text-[11px] font-bold text-slate-500 mt-1">
              +24h:{" "}
              <span className={kpis.pendingOver24 ? "text-yellow-800" : "text-slate-400"}>
                {kpis.pendingOver24}
              </span>{" "}
              • +48h:{" "}
              <span className={kpis.pendingOver48 ? "text-red-700" : "text-slate-400"}>
                {kpis.pendingOver48}
              </span>
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-slate-100 rounded-lg text-slate-700">
                <BadgeCheck size={18} />
              </div>
              <span className="text-[10px] font-black uppercase text-slate-400">Hoje</span>
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase mt-2">Aprovadas</p>
            <h3 className="text-2xl font-black text-slate-900">{kpis.approvedToday}</h3>
            <p className="text-[11px] font-bold text-slate-500 mt-1">
              Valor:{" "}
              <span className="text-slate-900">
                {new Intl.NumberFormat("pt-BR", {
                  notation: "compact",
                  style: "currency",
                  currency: "BRL",
                }).format(kpis.todayValue)}
              </span>
            </p>
          </div>
        </div>

        {/* ✅ NOVO: PEDIDOS DO DIA */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-8">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-black text-slate-900 uppercase tracking-tight">Pedidos do Dia</h3>
              <p className="text-xs text-slate-400 font-bold">Resumo e lista das propostas criadas hoje</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={setFilterToToday}
                className="text-xs bg-white text-slate-700 px-3 py-2 rounded-lg font-bold hover:bg-slate-50 flex items-center gap-2 border border-slate-200"
                title="Aplicar filtro de hoje"
              >
                <CalendarRange size={14} /> Filtrar Hoje
              </button>

              <button
                onClick={fetchSales}
                className="text-xs bg-slate-50 text-slate-600 px-3 py-2 rounded-lg font-bold hover:bg-slate-100 flex items-center gap-2 border border-slate-200"
                title="Atualizar"
              >
                <Loader2 size={14} className={loading ? "animate-spin" : ""} />
                Atualizar
              </button>
            </div>
          </div>

          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="text-[10px] font-bold uppercase text-slate-500">Total Hoje</p>
                <p className="text-2xl font-black text-slate-900">{todaySection.totalToday}</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="text-[10px] font-bold uppercase text-slate-500">Pendentes</p>
                <p className="text-2xl font-black text-slate-900">{todaySection.pendingToday}</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="text-[10px] font-bold uppercase text-slate-500">Aprovadas</p>
                <p className="text-2xl font-black text-slate-900">{todaySection.approvedToday}</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="text-[10px] font-bold uppercase text-slate-500">Recusadas</p>
                <p className="text-2xl font-black text-slate-900">{todaySection.refusedToday}</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="text-[10px] font-bold uppercase text-slate-500">Valor Hoje</p>
                <p className="text-xl font-black text-slate-900">
                  {new Intl.NumberFormat("pt-BR", {
                    notation: "compact",
                    style: "currency",
                    currency: "BRL",
                  }).format(todaySection.valueToday)}
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                    Últimos pedidos de hoje
                  </h4>
                  <p className="text-[11px] text-slate-400 font-bold">
                    Clique para abrir detalhes e decidir rápido
                  </p>
                </div>
                <span className="text-[10px] font-black uppercase text-slate-400">
                  mostrando {Math.min(10, todaySection.list.length)}
                </span>
              </div>

              {todaySection.list.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm font-medium">
                  Sem propostas criadas hoje.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 min-w-[180px]">Cliente</th>
                        <th className="px-4 py-3 min-w-[220px]">Veículo</th>
                        <th className="px-4 py-3 text-center">Status</th>
                        <th className="px-4 py-3 text-right">Valor</th>
                        <th className="px-4 py-3 text-right">Hora</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {todaySection.list.slice(0, 10).map((sale: any) => (
                        <tr
                          key={sale.id}
                          onClick={() => setSelectedSale(sale)}
                          className="hover:bg-slate-50 cursor-pointer"
                        >
                          <td className="px-4 py-3">
                            <p className="text-xs font-bold text-slate-900 uppercase truncate max-w-[260px]">
                              {sale.client_name}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono truncate max-w-[260px]">
                              {sale.client_cpf}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-xs font-bold text-slate-800 truncate max-w-[320px]">
                              {sale.car_name}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              Vendedor: {sale.seller_name || sale.profiles?.email || "—"}
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
        </div>

        {/* CHARTS + RANKING */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* Charts */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-black uppercase text-slate-500 tracking-widest">Volume (30 dias)</p>
                <span className="text-[10px] font-bold text-slate-400">Total/dia</span>
              </div>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={charts.lineData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="total" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[11px] text-slate-400 font-bold mt-2">Use filtros para “auditar” períodos.</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-black uppercase text-slate-500 tracking-widest">Distribuição (recorte)</p>
                <span className="text-[10px] font-bold text-slate-400">Status</span>
              </div>
              <div className="h-44 flex items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts.pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={4}
                    >
                      {charts.pieData.map((_, idx) => (
                        <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px] font-bold text-slate-500 mt-2">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-center">
                  Pendentes
                  <br />
                  <span className="text-slate-900 text-sm">{kpis.pending}</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-center">
                  Aprovadas
                  <br />
                  <span className="text-slate-900 text-sm">{kpis.approved}</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-center">
                  Recusadas
                  <br />
                  <span className="text-slate-900 text-sm">{kpis.refused}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Ranking (sem Top Aprovadores) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
              <p className="text-xs font-black uppercase text-slate-500 tracking-widest">Top Vendedores (valor)</p>
              <div className="mt-4 space-y-3">
                {topSellersByValue.length === 0 ? (
                  <p className="text-sm text-slate-400 font-medium">Sem dados.</p>
                ) : (
                  topSellersByValue.map((s, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-900 truncate">
                          {String(s.name).includes("@") ? String(s.name).split("@")[0] : s.name}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold">
                          Propostas: {s.count} • Aprovadas: {s.approved}
                        </p>
                      </div>
                      <p className="text-sm font-black text-slate-900">{formatCurrency(s.totalValue)}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-blue-600 rounded-2xl p-5 text-white shadow-lg">
              <h3 className="font-bold mb-2">Suporte</h3>
              <p className="text-blue-100 text-xs mb-4 leading-relaxed">
                Dúvidas ou problemas técnicos? Fale conosco.
              </p>
              <a
                href="https://wa.me/5591999246801?text=Olá,%20preciso%20de%20ajuda%20com%20o%20Painel%20Admin."
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white text-blue-600 px-4 py-2.5 rounded-lg text-xs font-bold w-full hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
              >
                Contatar via WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* FILTROS */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Buscar por cliente, cpf, carro, vendedor ou e-mail..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:border-black transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
              {["TODOS", "Aguardando Aprovação", "Aprovado", "Recusado"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase whitespace-nowrap transition-all ${
                    filterStatus === status ? "bg-black text-white" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {status === "Aguardando Aprovação" ? "Pendentes" : status}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
            {/* datas + ordenação */}
            <div className="flex flex-col md:flex-row items-center gap-2 w-full">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 w-full md:w-auto">
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
                  className="text-xs font-bold text-slate-500 hover:text-black underline decoration-dotted underline-offset-4"
                >
                  Limpar datas
                </button>
              )}

              <button
                onClick={() => toggleSort("created_at")}
                className={`px-3 py-2 rounded-lg text-xs font-bold uppercase border flex items-center gap-2 w-full md:w-auto justify-center ${
                  sortKey === "created_at"
                    ? "bg-black text-white border-black"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <ArrowUpDown size={14} /> Data {sortKey === "created_at" ? `(${sortDir})` : ""}
              </button>

              <button
                onClick={() => toggleSort("total_price")}
                className={`px-3 py-2 rounded-lg text-xs font-bold uppercase border flex items-center gap-2 w-full md:w-auto justify-center ${
                  sortKey === "total_price"
                    ? "bg-black text-white border-black"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <ArrowUpDown size={14} /> Valor {sortKey === "total_price" ? `(${sortDir})` : ""}
              </button>

              <button
                onClick={() => toggleSort("client_name")}
                className={`px-3 py-2 rounded-lg text-xs font-bold uppercase border flex items-center gap-2 w-full md:w-auto justify-center ${
                  sortKey === "client_name"
                    ? "bg-black text-white border-black"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <ArrowUpDown size={14} /> Cliente {sortKey === "client_name" ? `(${sortDir})` : ""}
              </button>

              <button
                onClick={() => {
                  setSortKey("created_at");
                  setSortDir("desc");
                  setFilterStatus("TODOS");
                  setSearchTerm("");
                  setDateFrom("");
                  setDateTo("");
                  clearSelection();
                }}
                className="px-3 py-2 rounded-lg text-xs font-bold uppercase border border-slate-200 bg-slate-50 text-slate-600 hover:bg-white flex items-center gap-2 w-full md:w-auto justify-center"
              >
                <Filter size={14} /> Reset
              </button>
            </div>

            {/* atalhos */}
            <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
              <button
                onClick={fetchSales}
                className="text-xs bg-slate-50 text-slate-600 px-3 py-2 rounded-lg font-bold hover:bg-slate-100 flex items-center gap-2 border border-slate-200 w-full lg:w-auto justify-center"
                title="Atualizar"
              >
                <Loader2 size={14} className={loading ? "animate-spin" : ""} />
                Atualizar
              </button>

              <Link
                href="/admin/cars/new"
                className="text-xs bg-blue-50 text-blue-600 px-3 py-2 rounded-lg font-bold hover:bg-blue-100 flex items-center gap-2 border border-blue-100 w-full lg:w-auto justify-center"
              >
                <Plus size={14} /> Add Veículo
              </Link>

              <Link
                href="/admin/reports"
                className="text-xs bg-white text-slate-700 px-3 py-2 rounded-lg font-bold hover:bg-slate-50 flex items-center gap-2 border border-slate-200 w-full lg:w-auto justify-center"
              >
                <FileText size={14} /> Relatórios
              </Link>
            </div>
          </div>

          {/* barra de lote */}
          {selectedIds.size > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="text-xs font-black uppercase text-slate-600">
                Selecionados: <span className="text-slate-900">{selectedIds.size}</span>
              </div>

              <div className="flex flex-wrap gap-2 justify-end">
                <button
                  onClick={selectAllOnPage}
                  className="px-3 py-2 rounded-lg text-xs font-bold uppercase border border-slate-200 bg-white hover:bg-slate-50"
                >
                  Selecionar página
                </button>

                <button
                  onClick={() => bulkUpdate("Aprovado")}
                  className="px-3 py-2 rounded-lg text-xs font-bold uppercase bg-green-600 text-white hover:bg-green-700"
                >
                  Aprovar lote
                </button>

                <button
                  onClick={() => bulkUpdate("Recusado")}
                  className="px-3 py-2 rounded-lg text-xs font-bold uppercase bg-red-600 text-white hover:bg-red-700"
                >
                  Recusar lote
                </button>

                <button
                  onClick={() => bulkUpdate("Aguardando Aprovação")}
                  className="px-3 py-2 rounded-lg text-xs font-bold uppercase bg-white border border-slate-200 hover:bg-slate-100"
                >
                  Reabrir lote
                </button>

                <button
                  onClick={bulkDelete}
                  className="px-3 py-2 rounded-lg text-xs font-bold uppercase bg-slate-900 text-white hover:bg-black"
                >
                  Excluir lote
                </button>

                <button
                  onClick={clearSelection}
                  className="px-3 py-2 rounded-lg text-xs font-bold uppercase text-slate-600 hover:text-black underline decoration-dotted underline-offset-4"
                >
                  Limpar seleção
                </button>
              </div>
            </div>
          )}
        </div>

        {/* TABELA PRINCIPAL */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="font-bold text-slate-800">Transações</h3>
              <span className="text-[10px] font-black uppercase text-slate-400">
                Página {page}/{totalPages}
              </span>
            </div>

            <div className="text-[10px] font-bold text-slate-400">
              Mostrando <span className="text-slate-800">{filteredBase.length}</span> no recorte
            </div>
          </div>

          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="animate-spin mb-2" size={32} />
              <p className="text-xs font-bold uppercase">Carregando...</p>
            </div>
          ) : filteredBase.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <p className="text-sm font-medium">Nenhuma proposta encontrada.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 w-[40px] text-center">Sel.</th>
                    <th className="px-6 py-4 min-w-[200px]">Cliente</th>
                    <th className="px-6 py-4 min-w-[220px]">Veículo</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-center min-w-[120px]">Prioridade</th>
                    <th className="px-6 py-4 text-right">Valor</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredSales.map((sale) => {
                    const pr = priorityLabel(sale);
                    const checked = selectedIds.has(sale.id);

                    return (
                      <tr
                        key={sale.id}
                        onClick={() => setSelectedSale(sale)}
                        className="hover:bg-slate-50 transition-colors group cursor-pointer"
                      >
                        <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSelect(sale.id)}
                            className="w-4 h-4 accent-black"
                          />
                        </td>

                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-slate-900 uppercase">{sale.client_name}</p>
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                            <span className="font-mono">{sale.client_cpf}</span>
                            {sale.client_phone && (
                              <a
                                href={`https://wa.me/55${sale.client_phone.replace(/\D/g, "")}`}
                                target="_blank"
                                onClick={(e) => e.stopPropagation()}
                                className="text-green-600 hover:text-green-800 ml-2"
                                title="WhatsApp"
                              >
                                <Phone size={12} />
                              </a>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4 text-slate-600 text-xs font-medium">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800">{sale.car_name}</span>
                            <span className="text-[9px] text-slate-400">
                              Vendedor: {sale.seller_name || sale.profiles?.email || "---"}
                            </span>
                            <span className="text-[9px] text-slate-400">
                              Criado: {new Date(sale.created_at).toLocaleDateString("pt-BR")}{" "}
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

                        <td className="px-6 py-4 text-center">
                          {pr ? (
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border ${pr.cls}`}
                            >
                              {pr.icon} {pr.label}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-300 uppercase">—</span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-right font-bold text-slate-800 text-sm">
                          {formatCurrency(Number(sale.total_price) || 0)}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSale(sale);
                              }}
                              className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all border border-blue-100"
                              title="Ver Detalhes"
                            >
                              <Eye size={14} />
                            </button>

                            {sale.status === "Aguardando Aprovação" && (
                              <>
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (!confirm("Aprovar este crédito?")) return;
                                    await updateStatus(sale.id, "Aprovado");
                                  }}
                                  disabled={isUpdating === sale.id}
                                  className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 hover:scale-110 transition-all border border-green-100"
                                  title="Aprovar"
                                >
                                  {isUpdating === sale.id ? (
                                    <Loader2 size={14} className="animate-spin" />
                                  ) : (
                                    <Check size={14} />
                                  )}
                                </button>

                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (!confirm("Recusar esta proposta?")) return;
                                    await updateStatus(sale.id, "Recusado");
                                  }}
                                  disabled={isUpdating === sale.id}
                                  className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 hover:scale-110 transition-all border border-red-100"
                                  title="Recusar"
                                >
                                  {isUpdating === sale.id ? (
                                    <Loader2 size={14} className="animate-spin" />
                                  ) : (
                                    <XCircle size={14} />
                                  )}
                                </button>
                              </>
                            )}

                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (!confirm("Excluir esta transação permanentemente?")) return;
                                await deleteSale(sale.id);
                              }}
                              disabled={isDeleting === sale.id}
                              className="p-2 bg-slate-100 text-slate-400 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors"
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

          {/* Paginação */}
          {!loading && filteredBase.length > 0 && (
            <div className="p-4 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="text-[11px] text-slate-400 font-bold">
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
                  className="px-3 py-2 rounded-lg text-xs font-bold uppercase border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  Anterior
                </button>

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-2 rounded-lg text-xs font-bold uppercase border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 text-[11px] text-slate-400 font-bold">
          * Admin: pode ver tudo, decidir, reabrir, excluir e operar em lote.
        </div>
      </main>
    </div>
  );
}