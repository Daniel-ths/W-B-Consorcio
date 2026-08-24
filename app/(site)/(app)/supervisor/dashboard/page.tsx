"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  LayoutDashboard,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  CarFront,
  Loader2,
  Users,
  LogOut,
  ArrowRight,
  FileText,
  Check,
  Phone,
  Eye,
  X,
  ShieldCheck,
  CalendarRange,
  Filter,
  ArrowUpDown,
  AlertTriangle,
  Trophy,
  Timer,
  BadgeCheck,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
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
// MODAL DETALHES
// =========================
function ModalDetalhes({
  sale,
  onClose,
  onUpdateStatus,
}: {
  sale: any;
  onClose: () => void;
  onUpdateStatus: (id: string, status: string) => void;
}) {
  if (!sale) return null;

  const [isProcessing, setIsProcessing] = useState(false);

  const handleAction = async (status: string) => {
    setIsProcessing(true);
    await onUpdateStatus(sale.id, status);
    setIsProcessing(false);
    onClose();
  };

  const formatMoney = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
      Number(val || 0)
    );

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("pt-BR") +
    " às " +
    new Date(date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  const statusStyles: Record<string, string> = {
    Aprovado: "bg-emerald-50 text-emerald-800 border-emerald-100",
    Recusado: "bg-rose-50 text-rose-800 border-rose-100",
    "Aguardando Aprovação": "bg-amber-50 text-amber-800 border-amber-100",
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto relative border border-slate-100">
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-slate-100 px-6 py-5 flex justify-between items-center z-10 rounded-t-3xl">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">
              Proposta
            </p>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Detalhes do Pedido
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              #{sale.id.slice(0, 8)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
          >
            <X size={18} className="text-slate-600" />
          </button>
        </div>

        <div className="p-6 space-y-7">
          {/* Status + Ações */}
          <div
            className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              statusStyles[sale.status] || "bg-slate-50 text-slate-700 border-slate-100"
            }`}
          >
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                Status atual
              </span>
              <div className="font-bold text-sm uppercase flex items-center gap-2 mt-1">
                {sale.status === "Aprovado" && <CheckCircle2 size={18} />}
                {sale.status === "Recusado" && <XCircle size={18} />}
                {sale.status === "Aguardando Aprovação" && <Clock size={18} />}
                {sale.status}
              </div>
            </div>

            {sale.status === "Aguardando Aprovação" ? (
              <div className="flex gap-2">
                <button
                  onClick={() => handleAction("Aprovado")}
                  disabled={isProcessing}
                  className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase hover:bg-emerald-700 flex items-center gap-2 shadow-sm disabled:opacity-50 transition"
                >
                  {isProcessing ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
                  Aprovar
                </button>
                <button
                  onClick={() => handleAction("Recusado")}
                  disabled={isProcessing}
                  className="bg-rose-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase hover:bg-rose-700 flex items-center gap-2 shadow-sm disabled:opacity-50 transition"
                >
                  {isProcessing ? <Loader2 className="animate-spin" size={14} /> : <X size={14} />}
                  Recusar
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  if (confirm("Deseja reabrir este pedido para análise?"))
                    handleAction("Aguardando Aprovação");
                }}
                className="text-xs font-bold text-slate-500 hover:text-slate-900 underline decoration-dotted underline-offset-4"
              >
                Reabrir para análise
              </button>
            )}
          </div>

          {/* Cliente */}
          <section>
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.18em] mb-4 flex items-center gap-2">
              <Users size={14} /> Dados do Cliente
            </h3>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Nome</p>
                <p className="text-sm font-semibold text-slate-900">{sale.client_name}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">CPF</p>
                <p className="text-sm font-mono text-slate-700">{sale.client_cpf}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Telefone</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-mono text-slate-700">{sale.client_phone || "—"}</p>
                  {sale.client_phone && (
                    <a
                      href={`https://wa.me/55${sale.client_phone.replace(/\D/g, "")}`}
                      target="_blank"
                      className="text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1 border border-emerald-100"
                    >
                      <Phone size={10} /> WhatsApp
                    </a>
                  )}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Data do pedido</p>
                <p className="text-sm font-medium text-slate-700">{formatDate(sale.created_at)}</p>
              </div>
            </div>
          </section>

          {/* Venda */}
          <section>
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.18em] mb-4 flex items-center gap-2">
              <CarFront size={14} /> Detalhes da Venda
            </h3>
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <div className="flex justify-between items-start gap-4 mb-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Veículo</p>
                  <p className="text-lg font-bold text-slate-900">{sale.car_name}</p>
                </div>
                <span className="bg-slate-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase shrink-0">
                  {sale.interest_type}
                </span>
              </div>
              <div className="border-t border-slate-200 pt-4 flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Valor total</span>
                <span className="font-bold text-slate-900">{formatMoney(sale.total_price)}</span>
              </div>
            </div>
          </section>

          {/* Vendedor */}
          <section>
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.18em] mb-4 flex items-center gap-2">
              <ShieldCheck size={14} /> Vendedor
            </h3>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {sale.seller_name ? sale.seller_name.substring(0, 2).toUpperCase() : "VD"}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{sale.seller_name || "—"}</p>
                <p className="text-[11px] text-slate-400 font-mono">{sale.profiles?.email}</p>
              </div>
            </div>
          </section>

          {/* Auditoria */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
            <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-3">
              Auditoria
            </p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Aprovador</p>
                <p className="font-semibold text-slate-800">{sale.approved_by_name || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Data</p>
                <p className="font-medium text-slate-700">
                  {sale.approved_at
                    ? new Date(sale.approved_at).toLocaleString("pt-BR")
                    : "—"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end gap-3 sticky bottom-0 rounded-b-3xl">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold text-xs uppercase rounded-xl hover:bg-slate-100 transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

// =========================
// DASHBOARD
// =========================
export default function SupervisorDashboard() {
  const router = useRouter();

  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("Aguardando Aprovação");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortKey, setSortKey] = useState<
    "created_at" | "total_price" | "client_name" | "seller_name" | "status"
  >("created_at");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val || 0);

  const ensureSupervisor = async () => {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    if (!user) {
      router.replace("/login");
      return false;
    }
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (error || !profile?.role || !["supervisor", "admin"].includes(profile.role)) {
      router.replace("/vendedor/dashboard");
      return false;
    }
    return true;
  };

  const fetchSales = async () => {
    setLoading(true);
    try {
      const ok = await ensureSupervisor();
      if (!ok) return;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateStatus = async (saleId: string, newStatus: string) => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) {
        alert("Sessão expirada. Faça login novamente.");
        router.replace("/login");
        return;
      }

      const { data: me } = await supabase
        .from("profiles")
        .select("email, name, full_name")
        .eq("id", user.id)
        .single();

      const displayName =
        (me as any)?.name ||
        (me as any)?.full_name ||
        (me as any)?.email ||
        user.email ||
        "Supervisor";

      const payload: any = { status: newStatus };

      if (newStatus === "Aprovado" || newStatus === "Recusado") {
        payload.approved_by_id = user.id;
        payload.approved_by_name = displayName;
        payload.approved_at = new Date().toISOString();
      }
      if (newStatus === "Aguardando Aprovação") {
        payload.approved_by_id = null;
        payload.approved_by_name = null;
        payload.approved_at = null;
      }

      const { error } = await supabase.from("sales").update(payload).eq("id", saleId);
      if (error) throw error;

      setSales((prev) => prev.map((s) => (s.id === saleId ? { ...s, ...payload } : s)));
      if (selectedSale?.id === saleId) {
        setSelectedSale((prev: any) => ({ ...prev, ...payload }));
      }
    } catch (error: any) {
      alert("Erro: " + (error?.message || "falha ao atualizar"));
    }
  };

  const handleApproveSale = async (e: any, saleId: string) => {
    e?.stopPropagation();
    if (!confirm("Aprovar este crédito?")) return;
    setIsUpdating(saleId);
    await updateStatus(saleId, "Aprovado");
    setIsUpdating(null);
  };

  const handleRejectSale = async (e: any, saleId: string) => {
    e?.stopPropagation();
    if (!confirm("Recusar esta proposta?")) return;
    setIsUpdating(saleId);
    await updateStatus(saleId, "Recusado");
    setIsUpdating(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.replace("/login");
  };

  const isWithinDateRange = (createdAt: string) => {
    const d = new Date(createdAt);
    if (dateFrom && d < new Date(dateFrom + "T00:00:00")) return false;
    if (dateTo && d > new Date(dateTo + "T23:59:59")) return false;
    return true;
  };

  const getHoursSince = (iso: string) =>
    (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60);

  const priorityLabel = (sale: any) => {
    if (sale.status !== "Aguardando Aprovação") return null;
    const h = getHoursSince(sale.created_at);
    if (h >= 48)
      return {
        label: "Crítico",
        cls: "bg-rose-50 text-rose-700 border-rose-100",
        icon: <AlertTriangle size={12} />,
      };
    if (h >= 24)
      return {
        label: "Atenção",
        cls: "bg-amber-50 text-amber-800 border-amber-100",
        icon: <Timer size={12} />,
      };
    return {
      label: "Normal",
      cls: "bg-slate-50 text-slate-600 border-slate-200",
      icon: <Clock size={12} />,
    };
  };

  const filteredSalesBase = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return sales
      .filter((sale) => {
        const matchesStatus = filterStatus === "TODOS" || sale.status === filterStatus;
        const matchesSearch =
          !term ||
          sale.client_name?.toLowerCase().includes(term) ||
          sale.car_name?.toLowerCase().includes(term) ||
          sale.seller_name?.toLowerCase().includes(term) ||
          sale.profiles?.email?.toLowerCase().includes(term);
        return matchesStatus && matchesSearch && isWithinDateRange(sale.created_at);
      })
      .sort((a, b) => {
        const dir = sortDir === "asc" ? 1 : -1;
        if (sortKey === "created_at")
          return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir;
        if (sortKey === "total_price")
          return ((Number(a.total_price) || 0) - (Number(b.total_price) || 0)) * dir;
        return String(a?.[sortKey] || "").localeCompare(String(b?.[sortKey] || ""), "pt-BR") * dir;
      });
  }, [sales, filterStatus, searchTerm, dateFrom, dateTo, sortKey, sortDir]);

  useEffect(() => {
    setPage(1);
  }, [filterStatus, searchTerm, dateFrom, dateTo, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredSalesBase.length / pageSize));
  const filteredSales = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredSalesBase.slice(start, start + pageSize);
  }, [filteredSalesBase, page]);

  const deepStats = useMemo(() => {
    const rows = filteredSalesBase;
    const total = rows.length;
    const pending = rows.filter((s) => s.status === "Aguardando Aprovação");
    const approved = rows.filter((s) => s.status === "Aprovado");
    const refused = rows.filter((s) => s.status === "Recusado");
    const sum = rows.reduce((acc, s) => acc + (Number(s.total_price) || 0), 0);
    const avgTicket = total ? sum / total : 0;

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

    const pendingOver24 = pending.filter((s) => getHoursSince(s.created_at) >= 24).length;
    const today = new Date();
    const isToday = (iso: string) => {
      const dt = new Date(iso);
      return (
        dt.getFullYear() === today.getFullYear() &&
        dt.getMonth() === today.getMonth() &&
        dt.getDate() === today.getDate()
      );
    };
    const approvalsToday = rows.filter(
      (s) => s.status === "Aprovado" && s.approved_at && isToday(s.approved_at)
    ).length;
    const conversion = total ? (approved.length / total) * 100 : 0;

    return {
      total,
      pending: pending.length,
      approved: approved.length,
      refused: refused.length,
      avgTicket,
      avgDecisionHours,
      pendingOver24,
      approvalsToday,
      conversion,
    };
  }, [filteredSalesBase]);

  const charts = useMemo(() => {
    const days = 14;
    const map = new Map<
      string,
      { date: string; total: number; pending: number; approved: number; refused: number }
    >();
    const pad2 = (n: number) => String(n).padStart(2, "0");
    const keyOf = (dt: Date) => `${pad2(dt.getDate())}/${pad2(dt.getMonth() + 1)}`;

    for (let i = days - 1; i >= 0; i--) {
      const dt = new Date();
      dt.setDate(dt.getDate() - i);
      const k = keyOf(dt);
      map.set(k, { date: k, total: 0, pending: 0, approved: 0, refused: 0 });
    }

    sales.forEach((s) => {
      const k = keyOf(new Date(s.created_at));
      const bucket = map.get(k);
      if (!bucket) return;
      bucket.total += 1;
      if (s.status === "Aguardando Aprovação") bucket.pending += 1;
      if (s.status === "Aprovado") bucket.approved += 1;
      if (s.status === "Recusado") bucket.refused += 1;
    });

    return {
      lineData: Array.from(map.values()),
      pieData: [
        { name: "Pendentes", value: deepStats.pending },
        { name: "Aprovadas", value: deepStats.approved },
        { name: "Recusadas", value: deepStats.refused },
      ],
    };
  }, [sales, deepStats.pending, deepStats.approved, deepStats.refused]);

  const sellerRanking = useMemo(() => {
    const map = new Map<string, { name: string; email: string; approved: number; total: number }>();
    filteredSalesBase.forEach((s) => {
      const key = (s.seller_name || s.profiles?.email || "—").toString();
      const curr = map.get(key) || {
        name: s.seller_name || "—",
        email: s.profiles?.email || "",
        approved: 0,
        total: 0,
      };
      curr.total += 1;
      if (s.status === "Aprovado") curr.approved += 1;
      map.set(key, curr);
    });
    return Array.from(map.values())
      .sort((a, b) => b.approved - a.approved || b.total - a.total)
      .slice(0, 5);
  }, [filteredSalesBase]);

  const StatusBadge = ({ status }: { status: string }) => {
    const map: Record<string, { styles: string; icon: React.ReactNode }> = {
      Aprovado: {
        styles: "bg-emerald-50 text-emerald-700 border-emerald-100",
        icon: <CheckCircle2 size={12} />,
      },
      Recusado: {
        styles: "bg-rose-50 text-rose-700 border-rose-100",
        icon: <XCircle size={12} />,
      },
      "Aguardando Aprovação": {
        styles: "bg-amber-50 text-amber-800 border-amber-100",
        icon: <Clock size={12} />,
      },
    };
    const cfg = map[status] || {
      styles: "bg-slate-100 text-slate-600 border-slate-200",
      icon: <Clock size={12} />,
    };
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${cfg.styles}`}
      >
        {cfg.icon} {status === "Aguardando Aprovação" ? "Pendente" : status}
      </span>
    );
  };

  const todayLabel = useMemo(() => new Date().toLocaleDateString("pt-BR"), []);

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir("desc");
  };

  const PIE_COLORS = ["#f59e0b", "#10b981", "#f43f5e"];

  const kpis = [
    {
      label: "Total",
      value: deepStats.total,
      sub: "no recorte atual",
      icon: <TrendingUp size={16} />,
      accent: "text-slate-900",
    },
    {
      label: "Pendentes",
      value: deepStats.pending,
      sub: deepStats.pendingOver24
        ? `${deepStats.pendingOver24} com +24h`
        : "em análise",
      icon: <Clock size={16} />,
      accent: deepStats.pendingOver24 ? "text-amber-600" : "text-slate-900",
    },
    {
      label: "Conversão",
      value: `${deepStats.conversion.toFixed(0)}%`,
      sub: `${deepStats.approved} aprovadas`,
      icon: <BadgeCheck size={16} />,
      accent: "text-emerald-600",
    },
    {
      label: "Ticket médio",
      value: formatCurrency(deepStats.avgTicket),
      sub: deepStats.avgDecisionHours
        ? `decisão em ~${deepStats.avgDecisionHours.toFixed(1)}h`
        : "—",
      icon: <CarFront size={16} />,
      accent: "text-slate-900",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f6f7f9] font-sans text-slate-900">
      {selectedSale && (
        <ModalDetalhes
          sale={selectedSale}
          onClose={() => setSelectedSale(null)}
          onUpdateStatus={updateStatus}
        />
      )}

      {/* HEADER */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-5 sm:px-6 py-3.5 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="bg-slate-900 p-2 rounded-xl text-[#f2e14c] shrink-0">
              <LayoutDashboard size={18} />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold tracking-tight truncate">
                Painel Supervisor
              </h1>
              <p className="text-[11px] text-slate-400 font-medium truncate">
                WBCN Consórcios · {todayLabel}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => router.push("/vendedor/dashboard")}
              className="hidden sm:inline-flex text-xs font-semibold text-slate-600 hover:text-slate-900 items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 rounded-xl transition"
            >
              <ArrowRight size={14} /> Visão vendedor
            </button>
            <div className="hidden sm:block h-6 w-px bg-slate-200" />
            <button
              onClick={handleLogout}
              className="text-rose-600 hover:text-rose-700 text-xs font-bold flex items-center gap-1.5 px-2 py-2 rounded-lg hover:bg-rose-50 transition"
            >
              <LogOut size={15} />
              <span className="hidden xs:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-5 sm:px-6 py-7 pb-16">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {kpi.label}
                </p>
                <span className="text-slate-300">{kpi.icon}</span>
              </div>
              <p className={`text-xl sm:text-2xl font-bold tracking-tight ${kpi.accent}`}>
                {kpi.value}
              </p>
              <p className="text-[11px] text-slate-400 font-medium mt-1">{kpi.sub}</p>
            </div>
          ))}
        </div>

        {/* Charts + Ranking */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Line */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">
                  Volume · 14 dias
                </p>
                <span className="text-[10px] font-semibold text-slate-400">propostas/dia</span>
              </div>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={charts.lineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                    <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #e2e8f0",
                        fontSize: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke="#0f172a"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">
                  Distribuição
                </p>
              </div>
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts.pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={42}
                      outerRadius={64}
                      paddingAngle={3}
                    >
                      {charts.pieData.map((_, idx) => (
                        <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #e2e8f0",
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {[
                  { label: "Pend.", value: deepStats.pending, color: "bg-amber-400" },
                  { label: "Aprov.", value: deepStats.approved, color: "bg-emerald-400" },
                  { label: "Recus.", value: deepStats.refused, color: "bg-rose-400" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="bg-slate-50 border border-slate-100 rounded-xl p-2 text-center"
                  >
                    <div className="flex items-center justify-center gap-1.5 mb-0.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${item.color}`} />
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        {item.label}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-slate-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Ranking */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm h-full">
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 flex items-center gap-2 mb-4">
                <Trophy size={14} className="text-amber-500" /> Top vendedores
              </p>
              <div className="space-y-2.5">
                {sellerRanking.length === 0 ? (
                  <p className="text-sm text-slate-400 py-6 text-center">Sem dados no filtro</p>
                ) : (
                  sellerRanking.map((s, idx) => (
                    <div
                      key={`${s.name}-${idx}`}
                      className="flex items-center justify-between gap-3 bg-slate-50/80 border border-slate-100 rounded-xl p-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                          {(s.name || "VD").substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate uppercase">
                            {s.name || "—"}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">{s.email || "—"}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold text-slate-900 leading-none">
                          {s.approved}
                        </p>
                        <p className="text-[10px] font-medium text-slate-400 mt-0.5">
                          de {s.total}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 mb-5 space-y-3">
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-sm">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Buscar cliente, carro, vendedor..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 transition"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-0.5">
              {["Aguardando Aprovação", "Aprovado", "Recusado", "TODOS"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3.5 py-2 rounded-xl text-[11px] font-bold uppercase whitespace-nowrap transition ${
                    filterStatus === status
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-slate-50 text-slate-500 hover:bg-slate-100 border border-transparent"
                  }`}
                >
                  {status === "Aguardando Aprovação" ? "Pendentes" : status}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-2 md:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                <CalendarRange size={15} className="text-slate-400 shrink-0" />
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-700 outline-none w-[110px]"
                />
                <span className="text-slate-300">—</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-700 outline-none w-[110px]"
                />
              </div>
              {(dateFrom || dateTo) && (
                <button
                  onClick={() => {
                    setDateFrom("");
                    setDateTo("");
                  }}
                  className="text-[11px] font-bold text-slate-500 hover:text-slate-900 underline decoration-dotted underline-offset-4"
                >
                  Limpar
                </button>
              )}

              <button
                onClick={() => toggleSort("created_at")}
                className={`px-3 py-2 rounded-xl text-[11px] font-bold uppercase border flex items-center gap-1.5 transition ${
                  sortKey === "created_at"
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <ArrowUpDown size={13} /> Data
              </button>
              <button
                onClick={() => toggleSort("total_price")}
                className={`px-3 py-2 rounded-xl text-[11px] font-bold uppercase border flex items-center gap-1.5 transition ${
                  sortKey === "total_price"
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <ArrowUpDown size={13} /> Valor
              </button>
              <button
                onClick={() => {
                  setSortKey("created_at");
                  setSortDir("desc");
                  setFilterStatus("Aguardando Aprovação");
                  setSearchTerm("");
                  setDateFrom("");
                  setDateTo("");
                }}
                className="px-3 py-2 rounded-xl text-[11px] font-bold uppercase border border-slate-200 bg-slate-50 text-slate-600 hover:bg-white flex items-center gap-1.5"
              >
                <Filter size={13} /> Reset
              </button>
            </div>

            <button
              onClick={fetchSales}
              className="text-[11px] bg-slate-50 text-slate-600 px-3.5 py-2 rounded-xl font-bold hover:bg-slate-100 flex items-center justify-center gap-2 border border-slate-200"
            >
              <Loader2 size={13} className={loading ? "animate-spin" : ""} />
              Atualizar
            </button>
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <h3 className="font-bold text-slate-800">Propostas</h3>
              <span className="text-[10px] font-bold uppercase text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                {page}/{totalPages}
              </span>
            </div>
            <p className="text-[11px] font-semibold text-slate-400">
              Aprovadas hoje:{" "}
              <span className="text-slate-800 font-bold">{deepStats.approvalsToday}</span>
            </p>
          </div>

          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="animate-spin mb-3" size={28} />
              <p className="text-xs font-bold uppercase tracking-wider">Carregando...</p>
            </div>
          ) : filteredSalesBase.length === 0 ? (
            <div className="p-16 text-center">
              <p className="text-sm font-medium text-slate-400">Nenhuma proposta encontrada.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/80 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3.5 min-w-[180px]">
                      <button
                        onClick={() => toggleSort("client_name")}
                        className="flex items-center gap-1.5 hover:text-slate-700"
                      >
                        Cliente <ArrowUpDown size={11} />
                      </button>
                    </th>
                    <th className="px-5 py-3.5 min-w-[200px]">Veículo</th>
                    <th className="px-5 py-3.5 text-center">Status</th>
                    <th className="px-5 py-3.5 text-center min-w-[100px]">Prioridade</th>
                    <th className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => toggleSort("total_price")}
                        className="ml-auto flex items-center gap-1.5 hover:text-slate-700"
                      >
                        Valor <ArrowUpDown size={11} />
                      </button>
                    </th>
                    <th className="px-5 py-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredSales.map((sale) => {
                    const pr = priorityLabel(sale);
                    return (
                      <tr
                        key={sale.id}
                        onClick={() => setSelectedSale(sale)}
                        className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                      >
                        <td className="px-5 py-4">
                          <p className="text-sm font-bold text-slate-900 uppercase leading-tight">
                            {sale.client_name}
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1">
                            <span className="font-mono">{sale.client_cpf}</span>
                            {sale.client_phone && (
                              <a
                                href={`https://wa.me/55${sale.client_phone.replace(/\D/g, "")}`}
                                target="_blank"
                                onClick={(e) => e.stopPropagation()}
                                className="text-emerald-600 hover:text-emerald-800 ml-1"
                              >
                                <Phone size={11} />
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-slate-800">{sale.car_name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {sale.seller_name || sale.profiles?.email || "—"} ·{" "}
                            {new Date(sale.created_at).toLocaleDateString("pt-BR")}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <StatusBadge status={sale.status} />
                        </td>
                        <td className="px-5 py-4 text-center">
                          {pr ? (
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase border ${pr.cls}`}
                            >
                              {pr.icon} {pr.label}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right font-bold text-slate-800 text-sm">
                          {formatCurrency(Number(sale.total_price) || 0)}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSale(sale);
                              }}
                              className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition"
                              title="Ver"
                            >
                              <Eye size={14} />
                            </button>
                            {sale.status === "Aguardando Aprovação" && (
                              <>
                                <button
                                  onClick={(e) => handleApproveSale(e, sale.id)}
                                  disabled={isUpdating === sale.id}
                                  className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition border border-emerald-100"
                                  title="Aprovar"
                                >
                                  {isUpdating === sale.id ? (
                                    <Loader2 size={14} className="animate-spin" />
                                  ) : (
                                    <Check size={14} />
                                  )}
                                </button>
                                <button
                                  onClick={(e) => handleRejectSale(e, sale.id)}
                                  disabled={isUpdating === sale.id}
                                  className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition border border-rose-100"
                                  title="Recusar"
                                >
                                  <XCircle size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && filteredSalesBase.length > 0 && (
            <div className="px-5 py-3.5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-[11px] text-slate-400 font-medium">
                {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filteredSalesBase.length)} de{" "}
                {filteredSalesBase.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}