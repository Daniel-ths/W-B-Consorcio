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
} from "lucide-react";

import { ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from "recharts";

const onlyDigits = (v: any) => String(v || "").replace(/\D/g, "");
const cleanText = (v: any) => String(v || "").trim();
const lowerText = (v: any) => cleanText(v).toLowerCase();

const isEmailLike = (value: any) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanText(value));

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

const getSellerRawValue = (sale: any) => {
  const detailsSeller = cleanText(sale?.details?.vendedor_digitado);
  const rootSeller = cleanText(sale?.seller_name);
  return detailsSeller || rootSeller || "";
};

const buildSaleIdentityKey = (sale: any) => {
  const clientCpf = onlyDigits(sale?.client_cpf || "");
  const clientPhone = onlyDigits(sale?.client_phone || "");
  const clientName = lowerText(sale?.client_name || "");
  const carName = lowerText(sale?.car_name || "");
  const total = Number(sale?.total_price || 0).toFixed(2);

  const created = sale?.created_at ? new Date(sale.created_at) : null;
  const minuteKey = created && !Number.isNaN(created.getTime())
    ? created.toISOString().slice(0, 16)
    : "";

  return [
    clientCpf || clientPhone || clientName,
    clientName,
    carName,
    total,
    minuteKey,
  ].join("|");
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
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
      Number(val || 0)
    );

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
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          .print-modal-root {
            position: static !important;
            inset: auto !important;
            padding: 0 !important;
          }
          .print-modal-overlay {
            display: none !important;
          }
          .print-modal-card {
            box-shadow: none !important;
            border-radius: 0 !important;
            overflow: visible !important;
            max-width: none !important;
            width: 100% !important;
            border: 1px solid #e2e8f0 !important;
          }
          .print-area {
            padding: 10mm !important;
          }
          .print-area * {
            line-height: 1.25 !important;
          }
          .print-h2 {
            font-size: 14px !important;
          }
          .print-label {
            font-size: 9px !important;
          }
          .print-value {
            font-size: 11px !important;
          }
          .print-card {
            border-radius: 10px !important;
            padding: 10px !important;
          }
          .print-grid {
            gap: 10px !important;
          }
          .print-badge {
            font-size: 9px !important;
            padding: 4px 8px !important;
          }
        }
      `}</style>

      <div
        className="absolute inset-0 bg-black/50 print-modal-overlay no-print"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden print-modal-card print-modal-root">
        <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4 no-print">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Detalhes da Proposta
            </p>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <CarFront size={18} />
              {sale.car_name || "—"}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase border ${statusColor}`}
              >
                {sale.status}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase border border-slate-200 bg-slate-50 text-slate-700">
                Tipo: {sale.interest_type || "—"}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase border border-slate-200 bg-white text-slate-700">
                Total: {formatMoney(Number(sale.total_price) || 0)}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
            title="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="hidden print-only border-b border-slate-200 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                Proposta
              </p>
              <h2 className="print-h2 text-[14px] font-black text-slate-900 truncate">
                {sale.car_name || "—"}
              </h2>
              <p className="text-[10px] font-bold text-slate-500">
                {new Date(sale.created_at).toLocaleDateString("pt-BR")} •{" "}
                {new Date(sale.created_at).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div className="text-right">
              <span
                className={`print-badge inline-flex items-center rounded-full border ${statusColor}`}
              >
                {sale.status}
              </span>
              <div className="text-[10px] font-black text-slate-900 mt-1">
                {formatMoney(Number(sale.total_price) || 0)}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4 print-area print-grid" id="print-area">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 print-grid">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 print-card">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-200 pb-2 flex items-center gap-2">
                <Users size={14} /> Cliente
              </h3>

              <div className="grid grid-cols-2 gap-3 print-grid">
                <div className="col-span-2 min-w-0">
                  <p className="print-label text-[10px] font-bold text-slate-400 uppercase">
                    Nome
                  </p>
                  <p className="print-value text-sm font-bold text-slate-900 truncate">
                    {sale.client_name || "—"}
                  </p>
                </div>

                <div className="min-w-0">
                  <p className="print-label text-[10px] font-bold text-slate-400 uppercase">
                    CPF
                  </p>
                  <p className="print-value text-sm font-mono text-slate-700 truncate">
                    {sale.client_cpf || "—"}
                  </p>
                </div>

                <div className="min-w-0">
                  <p className="print-label text-[10px] font-bold text-slate-400 uppercase">
                    Telefone
                  </p>
                  <p className="print-value text-sm font-mono text-slate-700 truncate">
                    {sale.client_phone || "--"}
                  </p>
                  <div className="no-print">
                    {waDigits && (
                      <a
                        href={`https://wa.me/${waDigits}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 mt-1 text-green-700 hover:text-green-900 bg-green-100 px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                      >
                        <Phone size={10} /> WhatsApp
                      </a>
                    )}
                  </div>
                </div>

                <div className="col-span-2">
                  <p className="print-label text-[10px] font-bold text-slate-400 uppercase">
                    Criado em
                  </p>
                  <p className="print-value text-sm font-medium text-slate-700">
                    {new Date(sale.created_at).toLocaleDateString("pt-BR")} às{" "}
                    {new Date(sale.created_at).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 print-card">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-200 pb-2 flex items-center gap-2">
                <CarFront size={14} /> Proposta
              </h3>

              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="print-label text-[10px] font-bold text-slate-400 uppercase">
                    Veículo
                  </p>
                  <p className="print-value text-lg font-black text-slate-900 truncate">
                    {sale.car_name || "—"}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <p className="print-label text-[10px] font-bold text-slate-400 uppercase">
                    Tipo
                  </p>
                  <span className="bg-black text-white text-[10px] font-bold px-2 py-1 rounded uppercase">
                    {sale.interest_type || "—"}
                  </span>
                </div>
              </div>

              <div className="mt-3 border-t border-slate-200 pt-3 space-y-2">
                <div className="flex justify-between text-sm gap-3">
                  <span className="text-slate-500 font-medium">Valor Total</span>
                  <span className="font-black text-slate-900">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(Number(sale.total_price) || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 print-grid">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 print-card">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2 flex items-center gap-2">
                <CheckCircle2 size={14} /> Vendedor
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {sellerDisplayName !== "—" ? sellerDisplayName.substring(0, 2) : "VD"}
                </div>
                <div className="leading-tight min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{sellerDisplayName}</p>
                  <p className="text-[10px] text-slate-500 font-mono truncate">
                    {sellerEmailLabel}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 print-card">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2 flex items-center gap-2">
                <BadgeCheck size={14} /> Processamento
              </h3>

              <div className="grid grid-cols-2 gap-3 print-grid">
                <div className="min-w-0">
                  <p className="print-label text-[10px] font-bold text-slate-400 uppercase">
                    Processado por
                  </p>
                  <p className="print-value text-sm font-bold text-slate-900 truncate">
                    {sale.approved_by_name || "Sistema"}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="print-label text-[10px] font-bold text-slate-400 uppercase">
                    Data
                  </p>
                  <p className="print-value text-sm font-medium text-slate-700 truncate">
                    {sale.approved_at
                      ? new Date(sale.approved_at).toLocaleString("pt-BR")
                      : "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-6 border-t border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3 sticky bottom-0 no-print">
          <div className="flex items-center gap-2">
            {sale.status !== "Aprovado" && (
              <button
                onClick={() => handleAction("Aprovado")}
                disabled={isProcessing}
                className="px-4 py-2.5 bg-green-600 text-white font-bold text-xs uppercase rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-60"
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
                className="px-4 py-2.5 bg-red-600 text-white font-bold text-xs uppercase rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-60"
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
              className="px-4 py-2.5 bg-white border border-red-200 text-red-600 font-bold text-xs uppercase rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2 disabled:opacity-60"
            >
              {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Excluir
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-white border border-gray-200 text-slate-700 font-bold text-xs uppercase rounded-lg hover:bg-gray-100 transition-colors"
            >
              Fechar
            </button>

            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 bg-black text-white font-bold text-xs uppercase rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2"
            >
              <FileText size={14} /> Imprimir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();

  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterStatus, setFilterStatus] = useState("TODOS");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const [sortKey, setSortKey] = useState<"created_at" | "total_price" | "status" | "client_name">(
    "created_at"
  );
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const [selectedSale, setSelectedSale] = useState<any>(null);

  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(val || 0));

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
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border ${styles}`}
      >
        {icon} {status}
      </span>
    );
  };

  const filteredBase = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return sales
      .filter((sale) => {
        const matchesStatus = filterStatus === "TODOS" || sale.status === filterStatus;
        const matchesDate = isWithinDateRange(sale.created_at);

        const sellerDisplay = normalizeSellerDisplayName(sale).toLowerCase();

        const matchesSearch =
          !term ||
          sale.client_name?.toLowerCase().includes(term) ||
          sale.car_name?.toLowerCase().includes(term) ||
          sellerDisplay.includes(term) ||
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

    const todayValue = todaySales.reduce((acc, s) => acc + (Number(s.total_price) || 0), 0);
    const approvedToday = todaySales.filter((s) => s.status === "Aprovado").length;
    const refusedToday = todaySales.filter((s) => s.status === "Recusado").length;

    const conversion = total ? (approved.length / total) * 100 : 0;

    return {
      total,
      approved: approved.length,
      refused: refused.length,
      revenue,
      conversion,
      todayValue,
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
    const refusedToday = todayAll.filter((s) => s.status === "Recusado").length;

    const valueToday = todayAll.reduce((acc, s) => acc + (Number(s.total_price) || 0), 0);

    return { list: todayAll, totalToday, approvedToday, refusedToday, valueToday };
  }, [sales]);

  const charts = useMemo(() => {
    const pieData = [
      { name: "Aprovadas", value: kpis.approved },
      { name: "Recusadas", value: kpis.refused },
    ];
    return { pieData };
  }, [kpis.approved, kpis.refused]);

  const PIE_COLORS = ["#22c55e", "#ef4444"];

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

      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-black p-2 rounded-lg text-[#f2e14c]">
              <LayoutDashboard size={20} />
            </div>
            <div>
              <h1 className="text-lg font-black uppercase tracking-tight">Admin Dashboard</h1>
              <p className="text-xs text-gray-400 font-bold">
                WBCNAC • Torre de Controle • {todayLabel}
              </p>
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
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm md:col-span-1">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-green-50 rounded-lg text-green-600">
                <Wallet size={18} />
              </div>
              <span className="text-[10px] font-black uppercase text-slate-400">Receita</span>
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase mt-2">Total</p>
            <h3 className="text-xl font-black text-slate-900">
              {new Intl.NumberFormat("pt-BR", {
                notation: "compact",
                style: "currency",
                currency: "BRL",
              }).format(kpis.revenue)}
            </h3>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm md:col-span-1">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <Users size={18} />
              </div>
              <span className="text-[10px] font-black uppercase text-slate-400">Propostas</span>
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase mt-2">Total</p>
            <h3 className="text-2xl font-black text-slate-900">{kpis.total}</h3>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm md:col-span-1">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                <TrendingUp size={18} />
              </div>
              <span className="text-[10px] font-black uppercase text-slate-400">Conversão</span>
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase mt-2">Aprovadas</p>
            <h3 className="text-2xl font-black text-slate-900">{kpis.conversion.toFixed(0)}%</h3>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm md:col-span-1">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-700">
                <CheckCircle2 size={18} />
              </div>
              <span className="text-[10px] font-black uppercase text-slate-400">Aprovadas</span>
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase mt-2">Total</p>
            <h3 className="text-2xl font-black text-slate-900">{kpis.approved}</h3>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm md:col-span-1">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-red-50 rounded-lg text-red-700">
                <XCircle size={18} />
              </div>
              <span className="text-[10px] font-black uppercase text-slate-400">Hoje</span>
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase mt-2">Aprovadas</p>
            <h3 className="text-2xl font-black text-slate-900">{kpis.approvedToday}</h3>
            <p className="text-[11px] font-bold text-slate-500 mt-1">
              Recusadas: <span className="text-slate-900">{kpis.refusedToday}</span>
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm md:col-span-1">
            <p className="text-[10px] font-black uppercase text-slate-400">Distribuição</p>
            <div className="h-[110px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip />
                  <Pie
                    data={charts.pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={28}
                    outerRadius={44}
                    paddingAngle={2}
                  >
                    {charts.pieData.map((_, idx) => (
                      <Cell key={`cell-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-600">
              <span>Aprov: {kpis.approved}</span>
              <span>Rec: {kpis.refused}</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-8">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-black text-slate-900 uppercase tracking-tight">Pedidos do Dia</h3>
              <p className="text-xs text-slate-400 font-bold">
                Exibindo somente um pedido por venda, priorizando o nome do vendedor digitado
              </p>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="text-[10px] font-bold uppercase text-slate-500">Total Hoje</p>
                <p className="text-2xl font-black text-slate-900">{todaySection.totalToday}</p>
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
                </div>
              </div>

              {todaySection.list.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm font-medium">
                  Sem propostas por enquanto.
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
                          onClick={() => openSale(sale)}
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
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Buscar por..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:border-black transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
              {["TODOS", "Aprovado", "Recusado"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase whitespace-nowrap transition-all ${
                    filterStatus === status
                      ? "bg-black text-white"
                      : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
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
            </div>

            <div className="flex items-center gap-2 w-full lg:w-auto justify-end flex-wrap">
              <button
                onClick={fetchSales}
                className="text-xs bg-slate-50 text-slate-600 px-3 py-2 rounded-lg font-bold hover:bg-slate-100 flex items-center gap-2 border border-slate-200 w-full lg:w-auto justify-center"
                title="Atualizar"
              >
                <Loader2 size={14} className={loading ? "animate-spin" : ""} />
                Atualizar
              </button>

              <Link
                href="/admin/consulta-dias"
                className="text-xs bg-indigo-50 text-indigo-700 px-3 py-2 rounded-lg font-bold hover:bg-indigo-100 flex items-center gap-2 border border-indigo-100 w-full lg:w-auto justify-center"
              >
                <CalendarRange size={14} /> Consulta Dias
              </Link>

              <Link
                href="/admin/alterarvalor"
                className="text-xs bg-amber-50 text-amber-700 px-3 py-2 rounded-lg font-bold hover:bg-amber-100 flex items-center gap-2 border border-amber-100 w-full lg:w-auto justify-center"
              >
                <Wallet size={14} /> Valores
              </Link>

              <Link
                href="/admin/cars/choose-brand"
                className="text-xs bg-blue-50 text-blue-600 px-3 py-2 rounded-lg font-bold hover:bg-blue-100 flex items-center gap-2 border border-blue-100 w-full lg:w-auto justify-center"
              >
                <Plus size={14} /> Veículo
              </Link>

              <Link
                href="/admin/reports"
                className="text-xs bg-white text-slate-700 px-3 py-2 rounded-lg font-bold hover:bg-slate-50 flex items-center gap-2 border border-slate-200 w-full lg:w-auto justify-center"
              >
                <FileText size={14} /> Relatórios
              </Link>
            </div>
          </div>

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

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="font-bold text-slate-800">Transações</h3>
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
                            {waDigits && (
                              <a
                                href={`https://wa.me/${waDigits}`}
                                target="_blank"
                                rel="noreferrer"
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
                              Vendedor: {sellerDisplayName}
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

                        <td className="px-6 py-4 text-right font-bold text-slate-800 text-sm">
                          {formatCurrency(Number(sale.total_price) || 0)}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openSale(sale);
                              }}
                              className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all border border-blue-100"
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
                                className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 hover:scale-110 transition-all border border-green-100"
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
                                className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 hover:scale-110 transition-all border border-red-100"
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
      </main>
    </div>
  );
}