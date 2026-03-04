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
  Download,
  Filter,
  ArrowUpDown,
  AlertTriangle,
  Trophy,
  Timer,
  BadgeCheck,
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
// MODAL (mesmo visual) — supervisor pode aprovar/recusar
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

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex justify-between items-center z-10">
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
              Detalhes do Pedido
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

        {/* Corpo */}
        <div className="p-6 space-y-8">
          {/* Status */}
          <div
            className={`p-4 rounded-xl flex items-center justify-between ${
              sale.status === "Aprovado"
                ? "bg-green-50 text-green-800"
                : sale.status === "Recusado"
                ? "bg-red-50 text-red-800"
                : "bg-yellow-50 text-yellow-800"
            }`}
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

            {/* Ações (supervisor) */}
            {sale.status === "Aguardando Aprovação" && (
              <div className="flex gap-2">
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
                  {isProcessing ? <Loader2 className="animate-spin" size={14} /> : <X size={14} />}{" "}
                  Recusar
                </button>
              </div>
            )}

            {sale.status !== "Aguardando Aprovação" && (
              <button
                onClick={() => {
                  if (confirm("Deseja reabrir este pedido para análise?"))
                    handleAction("Aguardando Aprovação");
                }}
                className="text-xs font-bold text-slate-500 hover:text-black underline decoration-dotted underline-offset-4"
              >
                Reabrir para análise
              </button>
            )}
          </div>

          {/* Cliente */}
          <div>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 border-b border-gray-100 pb-2 flex items-center gap-2">
              <Users size={14} /> Dados do Cliente
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Nome Completo</p>
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
                      className="text-green-600 hover:text-green-800 bg-green-50 px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1"
                    >
                      <Phone size={10} /> WhatsApp
                    </a>
                  )}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Data do Pedido</p>
                <p className="text-sm font-medium text-slate-700">{formatDate(sale.created_at)}</p>
              </div>
            </div>
          </div>

          {/* Venda */}
          <div>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 border-b border-gray-100 pb-2 flex items-center gap-2">
              <CarFront size={14} /> Detalhes da Venda
            </h3>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Veículo / Modelo</p>
                  <p className="text-lg font-black text-slate-900">{sale.car_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Tipo</p>
                  <span className="bg-black text-white text-[10px] font-bold px-2 py-1 rounded uppercase">
                    {sale.interest_type}
                  </span>
                </div>
              </div>

              <div className="space-y-2 border-t border-slate-200 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Valor Total</span>
                  <span className="font-bold text-slate-900">{formatMoney(sale.total_price)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Vendedor */}
          <div>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 border-b border-gray-100 pb-2 flex items-center gap-2">
              <ShieldCheck size={14} /> Vendedor
            </h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {sale.seller_name ? sale.seller_name.substring(0, 2).toUpperCase() : "VD"}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{sale.seller_name || "—"}</p>
                <p className="text-[10px] text-slate-500 font-mono">{sale.profiles?.email}</p>
              </div>
            </div>
          </div>

          {/* Auditoria (quem aprovou) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-[10px] font-bold uppercase text-slate-500">Auditoria</p>
            <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Aprovador</p>
                <p className="font-bold text-slate-800">{sale.approved_by_name || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Data</p>
                <p className="font-medium text-slate-700">
                  {sale.approved_at ? new Date(sale.approved_at).toLocaleString("pt-BR") : "—"}
                </p>
              </div>
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
            <FileText size={14} /> Imprimir Ficha
          </button>
        </div>
      </div>
    </div>
  );
}

// =========================
// DASHBOARD SUPERVISOR (turbinado)
// =========================
export default function SupervisorDashboard() {
  const router = useRouter();

  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterStatus, setFilterStatus] = useState("Aguardando Aprovação");
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedSale, setSelectedSale] = useState<any>(null);

  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, refused: 0 });

  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // Novo: range de data + ordenação + paginação (client-side)
  const [dateFrom, setDateFrom] = useState<string>(""); // YYYY-MM-DD
  const [dateTo, setDateTo] = useState<string>(""); // YYYY-MM-DD

  const [sortKey, setSortKey] = useState<
    "created_at" | "total_price" | "client_name" | "seller_name" | "status"
  >("created_at");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  const [page, setPage] = useState(1);
  const pageSize = 12;

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val || 0);

  // ====== Gate: só supervisor/admin entra ======
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

      const rows = data || [];
      setSales(rows);

      const total = rows.length;
      const pending = rows.filter((s: any) => s.status === "Aguardando Aprovação").length;
      const approved = rows.filter((s: any) => s.status === "Aprovado").length;
      const refused = rows.filter((s: any) => s.status === "Recusado").length;

      setStats({ total, pending, approved, refused });
    } catch (err) {
      console.error("Erro ao buscar vendas (supervisor):", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ====== Atualizar status + auditoria (approved_by_*) ======
  const updateStatus = async (saleId: string, newStatus: string) => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) {
        alert("Sessão expirada. Faça login novamente.");
        router.replace("/login");
        return;
      }

      // Busca nome do supervisor (se não tiver coluna name, usa email)
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

      if (selectedSale && selectedSale.id === saleId) {
        setSelectedSale((prev: any) => ({ ...prev, ...payload }));
      }

      alert(`Status atualizado para: ${newStatus}`);
    } catch (error: any) {
      alert("Erro: " + (error?.message || "falha ao atualizar"));
    }
  };

  const handleApproveSale = async (e: any, saleId: string) => {
    if (e) e.stopPropagation();
    if (!confirm("Aprovar este crédito?")) return;
    setIsUpdating(saleId);
    await updateStatus(saleId, "Aprovado");
    setIsUpdating(null);
  };

  const handleRejectSale = async (e: any, saleId: string) => {
    if (e) e.stopPropagation();
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

  // =========================
  // Helpers “mais profundos”
  // =========================
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

  const getHoursSince = (iso: string) => {
    const ms = Date.now() - new Date(iso).getTime();
    return ms / (1000 * 60 * 60);
  };

  const priorityLabel = (sale: any) => {
    // só faz sentido para pendentes
    if (sale.status !== "Aguardando Aprovação") return null;
    const h = getHoursSince(sale.created_at);
    if (h >= 48) return { label: "Crítico", cls: "bg-red-100 text-red-700 border-red-200", icon: <AlertTriangle size={12} /> };
    if (h >= 24) return { label: "Atenção", cls: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: <Timer size={12} /> };
    return { label: "Normal", cls: "bg-slate-100 text-slate-600 border-slate-200", icon: <Clock size={12} /> };
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

        const matchesDate = isWithinDateRange(sale.created_at);

        return matchesStatus && matchesSearch && matchesDate;
      })
      .sort((a, b) => {
        const dir = sortDir === "asc" ? 1 : -1;

        const av = a?.[sortKey];
        const bv = b?.[sortKey];

        // Datas
        if (sortKey === "created_at") {
          return (new Date(av).getTime() - new Date(bv).getTime()) * dir;
        }

        // Números
        if (sortKey === "total_price") {
          return ((Number(av) || 0) - (Number(bv) || 0)) * dir;
        }

        // Strings
        return String(av || "").localeCompare(String(bv || ""), "pt-BR") * dir;
      });
  }, [sales, filterStatus, searchTerm, dateFrom, dateTo, sortKey, sortDir]);

  useEffect(() => {
    setPage(1);
  }, [filterStatus, searchTerm, dateFrom, dateTo, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredSalesBase.length / pageSize));

  const filteredSales = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return filteredSalesBase.slice(start, end);
  }, [filteredSalesBase, page]);

  // Métricas “de verdade”
  const deepStats = useMemo(() => {
    const rows = filteredSalesBase; // aplica filtros atuais nas métricas
    const total = rows.length;

    const pending = rows.filter((s) => s.status === "Aguardando Aprovação");
    const approved = rows.filter((s) => s.status === "Aprovado");
    const refused = rows.filter((s) => s.status === "Recusado");

    const sum = rows.reduce((acc, s) => acc + (Number(s.total_price) || 0), 0);
    const avgTicket = total ? sum / total : 0;

    // Tempo médio de decisão (aprovado/recusado)
    const decided = rows.filter((s) => (s.status === "Aprovado" || s.status === "Recusado") && s.approved_at);
    const avgDecisionHours = decided.length
      ? decided.reduce((acc, s) => {
          const h = (new Date(s.approved_at).getTime() - new Date(s.created_at).getTime()) / (1000 * 60 * 60);
          return acc + (h > 0 ? h : 0);
        }, 0) / decided.length
      : 0;

    const pendingOver24 = pending.filter((s) => getHoursSince(s.created_at) >= 24).length;

    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth();
    const d = today.getDate();
    const isToday = (iso: string) => {
      const dt = new Date(iso);
      return dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === d;
    };

    const approvalsToday = rows.filter((s) => s.status === "Aprovado" && s.approved_at && isToday(s.approved_at)).length;

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

  // Gráficos: últimos 14 dias
  const charts = useMemo(() => {
    const days = 14;
    const map = new Map<string, { date: string; total: number; pending: number; approved: number; refused: number }>();

    const pad2 = (n: number) => String(n).padStart(2, "0");
    const keyOf = (dt: Date) => `${pad2(dt.getDate())}/${pad2(dt.getMonth() + 1)}`;

    for (let i = days - 1; i >= 0; i--) {
      const dt = new Date();
      dt.setDate(dt.getDate() - i);
      const k = keyOf(dt);
      map.set(k, { date: k, total: 0, pending: 0, approved: 0, refused: 0 });
    }

    sales.forEach((s) => {
      const dt = new Date(s.created_at);
      const k = keyOf(dt);
      const bucket = map.get(k);
      if (!bucket) return;
      bucket.total += 1;
      if (s.status === "Aguardando Aprovação") bucket.pending += 1;
      if (s.status === "Aprovado") bucket.approved += 1;
      if (s.status === "Recusado") bucket.refused += 1;
    });

    const lineData = Array.from(map.values());

    const pieData = [
      { name: "Pendentes", value: deepStats.pending },
      { name: "Aprovadas", value: deepStats.approved },
      { name: "Recusadas", value: deepStats.refused },
    ];

    return { lineData, pieData };
  }, [sales, deepStats.pending, deepStats.approved, deepStats.refused]);

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

  const todayLabel = useMemo(() => new Date().toLocaleDateString("pt-BR"), []);

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir("desc");
  };

  const exportCSV = () => {
    // Exporta o que estiver filtrado/ordenado (base)
    const rows = filteredSalesBase;

    const headers = [
      "id",
      "status",
      "created_at",
      "approved_at",
      "approved_by_name",
      "client_name",
      "client_cpf",
      "client_phone",
      "car_name",
      "interest_type",
      "total_price",
      "seller_name",
      "seller_email",
    ];

    const escape = (v: any) => {
      const s = String(v ?? "");
      if (s.includes('"') || s.includes(",") || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };

    const lines = [
      headers.join(","),
      ...rows.map((s) =>
        [
          s.id,
          s.status,
          s.created_at,
          s.approved_at,
          s.approved_by_name,
          s.client_name,
          s.client_cpf,
          s.client_phone,
          s.car_name,
          s.interest_type,
          s.total_price,
          s.seller_name,
          s.profiles?.email,
        ]
          .map(escape)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([lines], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `propostas_supervisor_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // Ranking vendedores (aprovados por vendedor no recorte filtrado)
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

  const PIE_COLORS = ["#f59e0b", "#22c55e", "#ef4444"]; // só para o pie (não afeta seu tema geral)

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {selectedSale && (
        <ModalDetalhes
          sale={selectedSale}
          onClose={() => setSelectedSale(null)}
          onUpdateStatus={updateStatus}
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
              <h1 className="text-lg font-black uppercase tracking-tight">Painel Supervisor</h1>
              <p className="text-xs text-gray-400 font-bold">WBCNAC Consórcios • {todayLabel}</p>
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
        {/* TOP: KPIs + gráficos + ranking */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* KPIs */}
          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-slate-500 text-xs font-bold uppercase">Total (recorte)</p>
                <h3 className="text-2xl font-black text-slate-900">{deepStats.total}</h3>
                <p className="text-[11px] text-slate-400 font-bold mt-1">
                  Filtros aplicados impactam aqui
                </p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-slate-500 text-xs font-bold uppercase flex items-center gap-2">
                  Pendentes <Clock size={14} />
                </p>
                <h3 className="text-2xl font-black text-slate-900">{deepStats.pending}</h3>
                <p className="text-[11px] font-bold mt-1 text-slate-500">
                  +24h:{" "}
                  <span className={deepStats.pendingOver24 ? "text-yellow-700" : "text-slate-400"}>
                    {deepStats.pendingOver24}
                  </span>
                </p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-slate-500 text-xs font-bold uppercase flex items-center gap-2">
                  Conversão <BadgeCheck size={14} />
                </p>
                <h3 className="text-2xl font-black text-slate-900">
                  {deepStats.conversion.toFixed(0)}%
                </h3>
                <p className="text-[11px] text-slate-400 font-bold mt-1">
                  Aprovadas / total no recorte
                </p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-slate-500 text-xs font-bold uppercase flex items-center gap-2">
                  Ticket Médio <CarFront size={14} />
                </p>
                <h3 className="text-xl md:text-2xl font-black text-slate-900">
                  {formatCurrency(deepStats.avgTicket)}
                </h3>
                <p className="text-[11px] text-slate-400 font-bold mt-1">
                  Decisão média:{" "}
                  <span className="text-slate-700">
                    {deepStats.avgDecisionHours ? `${deepStats.avgDecisionHours.toFixed(1)}h` : "—"}
                  </span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Linha */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-black uppercase text-slate-500 tracking-widest">
                    Volume (últimos 14 dias)
                  </p>
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

                <div className="mt-3 text-[11px] text-slate-400 font-bold">
                  
                </div>
              </div>

              {/* Pizza */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-black uppercase text-slate-500 tracking-widest">
                    Distribuição (recorte)
                  </p>
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

                <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] font-bold text-slate-500">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-center">
                    Pendentes<br />
                    <span className="text-slate-900 text-sm">{deepStats.pending}</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-center">
                    Aprovadas<br />
                    <span className="text-slate-900 text-sm">{deepStats.approved}</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-center">
                    Recusadas<br />
                    <span className="text-slate-900 text-sm">{deepStats.refused}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Ranking */}
          <div className="lg:col-span-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm h-full">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                  <Trophy size={14} /> Top Vendedores
                </p>
                <span className="text-[10px] font-bold text-slate-400">no recorte</span>
              </div>

              <div className="mt-4 space-y-3">
                {sellerRanking.length === 0 ? (
                  <div className="text-sm text-slate-400 font-medium">Sem dados no recorte.</div>
                ) : (
                  sellerRanking.map((s, idx) => (
                    <div
                      key={`${s.name}-${idx}`}
                      className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black">
                          {(s.name || "VD").substring(0, 2).toUpperCase()}
                        </div>
                        <div className="leading-tight">
                          <p className="text-sm font-black text-slate-900 uppercase">
                            {s.name || "—"}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold">
                            {s.email || "—"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Aprovadas</p>
                        <p className="text-lg font-black text-slate-900">{s.approved}</p>
                        <p className="text-[10px] font-bold text-slate-400">
                          Total: {s.total}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-4 text-[11px] text-slate-400 font-bold">
                * Ranking é por aprovações no recorte atual.
              </div>
            </div>
          </div>
        </div>

        {/* FILTROS E BUSCA */}
        <div className="flex flex-col gap-4 mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full md:w-96">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Buscar por cliente, carro, vendedor ou e-mail..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:border-black transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
              {["Aguardando Aprovação", "Aprovado", "Recusado", "TODOS"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase whitespace-nowrap transition-all ${
                    filterStatus === status
                      ? "bg-black text-white"
                      : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {status === "Aguardando Aprovação" ? "Pendentes" : status}
                </button>
              ))}
            </div>
          </div>

          {/* Linha 2: datas + ordenação + export */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
            <div className="flex flex-col md:flex-row items-center gap-2 w-full">
              <div className="flex items-center gap-2 w-full md:w-auto">
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
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
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
                  onClick={() => {
                    setSortKey("created_at");
                    setSortDir("desc");
                    setFilterStatus("Aguardando Aprovação");
                    setSearchTerm("");
                    setDateFrom("");
                    setDateTo("");
                  }}
                  className="px-3 py-2 rounded-lg text-xs font-bold uppercase border border-slate-200 bg-slate-50 text-slate-600 hover:bg-white flex items-center gap-2 w-full md:w-auto justify-center"
                  title="Reset"
                >
                  <Filter size={14} /> Reset
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full lg:w-auto justify-end">


              <button
                onClick={fetchSales}
                className="text-xs bg-slate-50 text-slate-600 px-3 py-2 rounded-lg font-bold hover:bg-slate-100 flex items-center gap-2 border border-slate-200 w-full lg:w-auto justify-center"
                title="Atualizar"
              >
                <Loader2 size={14} className={loading ? "animate-spin" : ""} />
                Atualizar
              </button>
            </div>
          </div>
        </div>

        {/* TABELA */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h3 className="font-bold text-slate-800">Propostas</h3>
              <span className="text-[10px] font-black uppercase text-slate-400">
                Página {page}/{totalPages}
              </span>
            </div>

            <div className="text-[10px] font-bold text-slate-400">
              Aprovadas hoje:{" "}
              <span className="text-slate-800 font-black">{deepStats.approvalsToday}</span>
            </div>
          </div>

          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="animate-spin mb-2" size={32} />
              <p className="text-xs font-bold uppercase"></p>
            </div>
          ) : filteredSalesBase.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <p className="text-sm font-medium">Nenhuma proposta encontrada.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 min-w-[200px]">
                      <button
                        onClick={() => toggleSort("client_name")}
                        className="flex items-center gap-2 hover:text-black"
                        title="Ordenar por cliente"
                      >
                        Cliente <ArrowUpDown size={12} />
                      </button>
                    </th>
                    <th className="px-6 py-4 min-w-[220px]">Veículo</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-center min-w-[120px]">Prioridade</th>
                    <th className="px-6 py-4 text-right">
                      <button
                        onClick={() => toggleSort("total_price")}
                        className="ml-auto flex items-center gap-2 hover:text-black"
                        title="Ordenar por valor"
                      >
                        Valor <ArrowUpDown size={12} />
                      </button>
                    </th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredSales.map((sale) => {
                    const pr = priorityLabel(sale);

                    return (
                      <tr
                        key={sale.id}
                        onClick={() => setSelectedSale(sale)}
                        className="hover:bg-slate-50 transition-colors group cursor-pointer"
                      >
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-slate-900 uppercase">
                            {sale.client_name}
                          </p>
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                            <span className="font-mono">{sale.client_cpf}</span>
                            {sale.client_phone && (
                              <a
                                href={`https://wa.me/55${sale.client_phone.replace(/\D/g, "")}`}
                                target="_blank"
                                onClick={(e) => e.stopPropagation()}
                                className="text-green-600 hover:text-green-800 ml-2"
                                title="Chamar no WhatsApp"
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
                              Criado:{" "}
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

                        <td className="px-6 py-4 text-center">
                          {pr ? (
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border ${pr.cls}`}
                              title="Baseado no tempo de espera"
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
                                  onClick={(e) => handleApproveSale(e, sale.id)}
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
                                  onClick={(e) => handleRejectSale(e, sale.id)}
                                  disabled={isUpdating === sale.id}
                                  className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 hover:scale-110 transition-all border border-red-100"
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

          {/* Paginação */}
          {!loading && filteredSalesBase.length > 0 && (
            <div className="p-4 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="text-[11px] text-slate-400 font-bold">
                Mostrando{" "}
                <span className="text-slate-800">
                  {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filteredSalesBase.length)}
                </span>{" "}
                de <span className="text-slate-800">{filteredSalesBase.length}</span>
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

        {/* Observação */}
        <div className="mt-4 text-[11px] text-slate-400 font-bold">
          * O supervisor não pode excluir propostas nem acessar cadastros/relatórios do Admin.
        </div>
      </main>
    </div>
  );
}