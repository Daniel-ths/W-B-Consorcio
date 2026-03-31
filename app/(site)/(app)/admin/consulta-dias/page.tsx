"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  LayoutDashboard,
  CalendarRange,
  Loader2,
  ArrowLeft,
  RefreshCw,
  Users,
  UserRound,
  BadgeCheck,
  CarFront,
  Clock3,
  FileText,
  ChevronDown,
  ChevronRight,
  Search,
  AlertTriangle,
} from "lucide-react";

const SUPERVISOR_EMAILS = [
  "glauco@wbcnac.com",
  "rafael@wbcnac.com",
  "alexandre@wbcnac.com",
  "marcelo@wbcnac.com",
  "felipe@wbcnac.com",
  "marcos@wbcnac.com",
  "eder@wbcnac.com",
].map((s) => s.toLowerCase().trim());

const cleanText = (v: any) => String(v || "").trim();
const lowerText = (v: any) => cleanText(v).toLowerCase();
const onlyDigits = (v: any) => String(v || "").replace(/\D/g, "");
const isEmailLike = (value: any) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanText(value));

const isSupervisorEmail = (email?: string | null) =>
  !!email && SUPERVISOR_EMAILS.includes(lowerText(email));

const supervisorLabel = (email: string) => {
  const value = lowerText(email);
  if (!value.includes("@")) return value.toUpperCase();
  return value.split("@")[0].toUpperCase();
};

const normalizeLooseName = (v: any) =>
  lowerText(v)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

const SUPERVISOR_NAME_MAP = SUPERVISOR_EMAILS.map((email) => {
  const baseName = email.split("@")[0];
  return {
    email,
    baseName,
    normalized: normalizeLooseName(baseName),
  };
});

const getISODateToday = () => {
  const now = new Date();
  return new Intl.DateTimeFormat("en-CA").format(now);
};

const formatInputDateToBR = (value: string) => {
  if (!value) return "—";
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
};

const formatMoney = (val: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(val || 0));

const formatTimeBR = (isoLike: string) => {
  if (!isoLike) return "—";
  return new Date(isoLike).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getSupervisorBySimilarName = (sale: any) => {
  const candidates = [
    sale?.approved_by_name,
    sale?.approved_by_email,
    sale?.details?.approved_by_name,
    sale?.details?.approved_by_email,

    sale?.seller_name,
    sale?.details?.seller_name,
    sale?.details?.vendedor_digitado,
    sale?.details?.vendedor_nome,
    sale?.details?.approved_by,
    sale?.details?.supervisor_name,
    sale?.details?.supervisor_email,

    sale?.profiles?.email,
    sale?.details?.seller_email,
    sale?.details?.vendedor_email,
    sale?.details?.email_supervisor,
  ]
    .map((v) => cleanText(v))
    .filter(Boolean);

  for (const raw of candidates) {
    const value = lowerText(raw);

    if (isSupervisorEmail(value)) return value;

    const localPart = value.includes("@") ? value.split("@")[0] : value;
    const normalizedCandidate = normalizeLooseName(localPart);

    if (!normalizedCandidate) continue;

    const exact = SUPERVISOR_NAME_MAP.find(
      (s) => s.normalized === normalizedCandidate
    );
    if (exact) return exact.email;

    const partial = SUPERVISOR_NAME_MAP.find(
      (s) =>
        normalizedCandidate.includes(s.normalized) ||
        s.normalized.includes(normalizedCandidate)
    );
    if (partial) return partial.email;
  }

  return "";
};

const getSupervisorEmail = (sale: any) => {
  const candidates = [
    sale?.approved_by_name,
    sale?.approved_by_email,
    sale?.details?.approved_by_name,
    sale?.details?.approved_by_email,

    sale?.details?.supervisor_email,
    sale?.details?.email_supervisor,
    sale?.details?.approved_email,

    sale?.profiles?.email,
    isEmailLike(sale?.seller_name) ? sale?.seller_name : "",
    sale?.details?.seller_email,
    sale?.details?.vendedor_email,
  ]
    .map((v) => lowerText(v))
    .filter(Boolean);

  const foundByEmail = candidates.find((email) => isSupervisorEmail(email));
  if (foundByEmail) return foundByEmail;

  return getSupervisorBySimilarName(sale);
};

const getSellerDisplayName = (sale: any) => {
  const candidates = [
    sale?.details?.vendedor_digitado,
    sale?.details?.vendedor_nome,
    sale?.details?.seller_name,
    sale?.seller_name,
    sale?.details?.nome_vendedor,
  ]
    .map((v) => cleanText(v))
    .filter(Boolean);

  for (const candidate of candidates) {
    if (candidate && !isEmailLike(candidate)) return candidate.toUpperCase();
  }

  const emailCandidates = [
    sale?.profiles?.email,
    sale?.details?.seller_email,
    sale?.details?.vendedor_email,
    sale?.client_email,
  ]
    .map((v) => cleanText(v))
    .filter(Boolean);

  for (const email of emailCandidates) {
    if (email.includes("@")) return email.split("@")[0].toUpperCase();
  }

  return "—";
};

const getClientName = (sale: any) =>
  cleanText(sale?.client_name) ||
  cleanText(sale?.details?.client_name) ||
  cleanText(sale?.details?.nome_cliente) ||
  cleanText(sale?.details?.customer_name) ||
  "—";

const getCarName = (sale: any) =>
  cleanText(sale?.car_name) ||
  cleanText(sale?.details?.car_name) ||
  cleanText(sale?.details?.modelo) ||
  cleanText(sale?.details?.vehicle_name) ||
  "—";

const getReferenceDate = (sale: any) =>
  sale?.created_at ||
  sale?.approved_at ||
  sale?.updated_at ||
  sale?.details?.created_at ||
  sale?.details?.approved_at ||
  null;

const isSameSelectedDay = (isoLike: string, selectedDay: string) => {
  if (!isoLike) return false;

  const reference = new Date(isoLike);
  const selected = new Date(`${selectedDay}T00:00:00`);

  return (
    reference.getFullYear() === selected.getFullYear() &&
    reference.getMonth() === selected.getMonth() &&
    reference.getDate() === selected.getDate()
  );
};

const buildSaleIdentityKey = (sale: any) => {
  const clientCpf = onlyDigits(sale?.client_cpf || sale?.details?.client_cpf || sale?.details?.cpf || "");
  const clientPhone = onlyDigits(
    sale?.client_phone || sale?.details?.client_phone || sale?.details?.telefone || ""
  );
  const clientName = lowerText(getClientName(sale));
  const carName = lowerText(getCarName(sale));
  const total = Number(sale?.total_price || 0).toFixed(2);

  const created = getReferenceDate(sale) ? new Date(getReferenceDate(sale)) : null;
  const minuteKey =
    created && !Number.isNaN(created.getTime()) ? created.toISOString().slice(0, 16) : "";

  return [clientCpf || clientPhone || clientName, clientName, carName, total, minuteKey].join("|");
};

const saleScore = (sale: any) => {
  let score = 0;

  if (cleanText(sale?.details?.vendedor_digitado)) score += 100;
  if (cleanText(sale?.details?.vendedor_nome)) score += 95;
  if (cleanText(sale?.details?.seller_name)) score += 90;
  if (cleanText(sale?.seller_name) && !isEmailLike(sale?.seller_name)) score += 50;
  if (cleanText(sale?.client_name)) score += 20;
  if (cleanText(sale?.car_name)) score += 20;
  if (cleanText(sale?.client_email)) score += 10;
  if (cleanText(sale?.approved_at)) score += 5;
  if (cleanText(getSupervisorEmail(sale))) score += 5;
  if (cleanText(sale?.profiles?.email)) score += 2;

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
      const currentCreated = new Date(getReferenceDate(current) || 0).getTime();
      const rowCreated = new Date(getReferenceDate(row) || 0).getTime();

      if (rowCreated > currentCreated) {
        map.set(key, row);
      }
    }
  }

  return Array.from(map.values()).sort(
    (a, b) =>
      new Date(getReferenceDate(b) || 0).getTime() -
      new Date(getReferenceDate(a) || 0).getTime()
  );
};

export default function AdminConsultaDiasPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string>(getISODateToday());
  const [sales, setSales] = useState<any[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [showGeneralIdentified, setShowGeneralIdentified] = useState(true);
  const [showUnidentified, setShowUnidentified] = useState(true);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("sales")
        .select(`
          *,
          profiles:seller_id (email)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const rows = (data || []).map((r: any) => ({
        ...r,
        status: cleanText(r?.status) || "Aprovado",
      }));

      setSales(dedupeSales(rows));
    } catch (err) {
      console.error("Erro ao buscar consultas por dia:", err);
      alert("Erro ao carregar dados da consulta diária.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const salesOfSelectedDay = useMemo(() => {
    return sales.filter((sale) => {
      const referenceDate = getReferenceDate(sale);
      if (!referenceDate) return false;
      return isSameSelectedDay(referenceDate, selectedDay);
    });
  }, [sales, selectedDay]);

  const allRequestsOfDay = useMemo(() => {
    return salesOfSelectedDay
      .map((sale) => {
        const supervisorEmail = getSupervisorEmail(sale);
        const hasSupervisor = !!supervisorEmail && isSupervisorEmail(supervisorEmail);

        return {
          id: sale.id,
          seller_name: getSellerDisplayName(sale),
          client_name: getClientName(sale),
          car_name: getCarName(sale),
          total_price: Number(sale?.total_price) || 0,
          status: cleanText(sale?.status) || "—",
          time: getReferenceDate(sale),
          supervisor_email: hasSupervisor ? supervisorEmail : "",
          supervisor_name: hasSupervisor ? supervisorLabel(supervisorEmail) : "NÃO IDENTIFICADO",
          raw_sale: sale,
        };
      })
      .sort((a, b) => new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime());
  }, [salesOfSelectedDay]);

  const identifiedRequests = useMemo(() => {
    return allRequestsOfDay.filter((item) => !!item.supervisor_email);
  }, [allRequestsOfDay]);

  const unidentifiedRequests = useMemo(() => {
    return allRequestsOfDay.filter((item) => !item.supervisor_email);
  }, [allRequestsOfDay]);

  const groupedBySupervisor = useMemo(() => {
    const base = SUPERVISOR_EMAILS.map((email) => ({
      supervisorEmail: email,
      supervisorName: supervisorLabel(email),
      atendimentos: [] as any[],
      total: 0,
    }));

    const map = new Map(base.map((item) => [item.supervisorEmail, item]));

    for (const sale of salesOfSelectedDay) {
      const supervisor = getSupervisorEmail(sale);
      if (!supervisor || !isSupervisorEmail(supervisor)) continue;

      const item = map.get(supervisor);
      if (!item) continue;

      item.atendimentos.push({
        id: sale.id,
        seller_name: getSellerDisplayName(sale),
        client_name: getClientName(sale),
        car_name: getCarName(sale),
        total_price: Number(sale?.total_price) || 0,
        status: cleanText(sale?.status) || "—",
        time: getReferenceDate(sale),
        supervisor_email: supervisor,
      });
    }

    const list = Array.from(map.values());

    for (const item of list) {
      item.atendimentos.sort(
        (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
      );
      item.total = item.atendimentos.length;
    }

    list.sort(
      (a, b) => b.total - a.total || a.supervisorName.localeCompare(b.supervisorName, "pt-BR")
    );

    return list;
  }, [salesOfSelectedDay]);

  const resumo = useMemo(() => {
    const totalSupervisores = groupedBySupervisor.length;
    const comAtendimento = groupedBySupervisor.filter((s) => s.total > 0).length;
    const totalAtendimentos = groupedBySupervisor.reduce((acc, s) => acc + s.total, 0);
    const totalPedidosDia = allRequestsOfDay.length;
    const semSupervisor = unidentifiedRequests.length;
    const identificados = identifiedRequests.length;

    return {
      totalSupervisores,
      comAtendimento,
      totalAtendimentos,
      totalPedidosDia,
      semSupervisor,
      identificados,
    };
  }, [groupedBySupervisor, allRequestsOfDay, unidentifiedRequests, identifiedRequests]);

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const renderRequestCard = (item: any, highlightUnidentified = false) => (
    <div
      key={item.id}
      className={`rounded-2xl border p-4 transition-colors ${
        highlightUnidentified
          ? "border-red-200 bg-red-50 hover:bg-red-100/60"
          : "border-slate-200 bg-white hover:bg-slate-50"
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <UserRound size={15} className={highlightUnidentified ? "text-red-400" : "text-slate-400"} />
            <p className="text-sm font-black text-slate-900 uppercase truncate">
              {item.seller_name}
            </p>
          </div>

          <p className="text-sm text-slate-700 font-medium">
            Cliente: <span className="font-black text-slate-900">{item.client_name}</span>
          </p>

          <div className="mt-2 space-y-1">
            <p className="text-[11px] text-slate-500 font-bold flex items-center gap-2">
              <CarFront size={12} />
              {item.car_name}
            </p>

            <p className="text-[11px] text-slate-500 font-bold flex items-center gap-2">
              <Clock3 size={12} />
              {formatTimeBR(item.time)}
            </p>

            <p className="text-[11px] text-slate-500 font-bold">
              Supervisor detectado:{" "}
              <span className={item.supervisor_email ? "text-emerald-700" : "text-red-600"}>
                {item.supervisor_name}
              </span>
            </p>
          </div>
        </div>

        <div className="md:text-right shrink-0">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
              item.status === "Aprovado"
                ? "bg-green-50 text-green-700 border-green-200"
                : item.status === "Recusado"
                ? "bg-red-50 text-red-700 border-red-200"
                : "bg-yellow-50 text-yellow-800 border-yellow-200"
            }`}
          >
            {item.status}
          </span>

          <p className="text-sm font-black text-slate-900 mt-2">
            {formatMoney(item.total_price)}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-black text-[#f2e14c] p-2 rounded-lg">
              <LayoutDashboard size={20} />
            </div>
            <div>
              <h1 className="text-lg font-black uppercase tracking-tight">
                Consulta de Supervisores por Dia
              </h1>
              <p className="text-xs text-slate-400 font-bold">
                Supervisores, pedidos identificados e não identificados
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              onClick={() => router.push("/admin")}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold"
            >
              <ArrowLeft size={14} />
              Voltar
            </button>

            <button
              onClick={fetchSales}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Atualizar
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-base font-black uppercase tracking-tight text-slate-900">
                Selecione o dia da consulta
              </h2>
              <p className="text-xs text-slate-400 font-bold mt-1">
                Agora com mais campos para identificar supervisor e vendedor.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                <CalendarRange size={16} className="text-slate-400" />
                <input
                  type="date"
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-700 outline-none"
                />
              </div>

              <button
                onClick={() => setSelectedDay(getISODateToday())}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold"
              >
                <CalendarRange size={14} />
                Hoje
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <Users size={18} />
              </div>
              <span className="text-[10px] uppercase font-black text-slate-400">Supervisores</span>
            </div>
            <p className="text-xs font-bold text-slate-500 mt-3">Total cadastrados</p>
            <h3 className="text-2xl font-black text-slate-900">{resumo.totalSupervisores}</h3>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <BadgeCheck size={18} />
              </div>
              <span className="text-[10px] uppercase font-black text-slate-400">Ativos no dia</span>
            </div>
            <p className="text-xs font-bold text-slate-500 mt-3">Com pelo menos 1 atendimento</p>
            <h3 className="text-2xl font-black text-slate-900">{resumo.comAtendimento}</h3>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
                <FileText size={18} />
              </div>
              <span className="text-[10px] uppercase font-black text-slate-400">Por supervisor</span>
            </div>
            <p className="text-xs font-bold text-slate-500 mt-3">Atendimentos casados</p>
            <h3 className="text-2xl font-black text-slate-900">{resumo.totalAtendimentos}</h3>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-violet-50 text-violet-700">
                <Search size={18} />
              </div>
              <span className="text-[10px] uppercase font-black text-slate-400">Identificados</span>
            </div>
            <p className="text-xs font-bold text-slate-500 mt-3">Pedidos com supervisor</p>
            <h3 className="text-2xl font-black text-slate-900">{resumo.identificados}</h3>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-red-50 text-red-600">
                <AlertTriangle size={18} />
              </div>
              <span className="text-[10px] uppercase font-black text-slate-400">Não identificados</span>
            </div>
            <p className="text-xs font-bold text-slate-500 mt-3">Sem supervisor identificado</p>
            <h3 className="text-2xl font-black text-slate-900">{resumo.semSupervisor}</h3>
          </div>
        </div>

        {loading ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-16 flex flex-col items-center justify-center text-slate-400 shadow-sm">
            <Loader2 className="animate-spin mb-3" size={32} />
            <p className="text-sm font-bold uppercase">Carregando consulta diária...</p>
          </div>
        ) : (
          <>
            {/* SUPERVISORES EM CIMA */}
            <div className="space-y-4 mb-10">
              {groupedBySupervisor.map((group) => {
                const isOpen = !!expandedGroups[group.supervisorEmail];

                return (
                  <div
                    key={group.supervisorEmail}
                    className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.supervisorEmail)}
                      className="w-full p-5 border-b border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex items-start gap-3">
                          <div className="mt-0.5 text-slate-500">
                            {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                          </div>

                          <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                              Supervisor
                            </p>
                            <h3 className="text-lg font-black text-slate-900 truncate">
                              {group.supervisorName}
                            </h3>
                            <p className="text-xs text-slate-500 font-bold truncate mt-1">
                              {group.supervisorEmail}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0">
                          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-black text-white text-xs font-black">
                            {group.total} atendimento{group.total === 1 ? "" : "s"}
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-400 font-bold mt-3">
                        Dia selecionado:{" "}
                        <span className="text-slate-700">{formatInputDateToBR(selectedDay)}</span>
                      </p>
                    </button>

                    {isOpen && (
                      <div className="p-5">
                        {group.total === 0 ? (
                          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-500">
                            Nenhum atendimento encontrado para este supervisor nesse dia.
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {group.atendimentos.map((item: any) =>
                              renderRequestCard(item, false)
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* GERAIS IDENTIFICADOS */}
            <div className="mb-10">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-base font-black uppercase tracking-tight text-slate-900">
                    Pedidos gerais identificados
                  </h3>
                  <p className="text-xs text-slate-400 font-bold mt-1">
                    Aqui ficam todos os pedidos do dia que conseguiram bater com algum supervisor.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowGeneralIdentified((prev) => !prev)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold"
                >
                  {showGeneralIdentified ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  {showGeneralIdentified ? "Ocultar" : "Mostrar"}
                </button>
              </div>

              {showGeneralIdentified && (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-slate-100 bg-slate-50">
                    <p className="text-xs font-bold text-slate-500">
                      Dia selecionado:{" "}
                      <span className="text-slate-800">{formatInputDateToBR(selectedDay)}</span>
                    </p>
                  </div>

                  <div className="p-5">
                    {identifiedRequests.length === 0 ? (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-500">
                        Nenhum pedido identificado encontrado nesse dia.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {identifiedRequests.map((item) => renderRequestCard(item, false))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* NÃO IDENTIFICADOS POR ÚLTIMO */}
            <div className="mb-10">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-base font-black uppercase tracking-tight text-red-700">
                    Pedidos não identificados
                  </h3>
                  <p className="text-xs text-slate-400 font-bold mt-1">
                    Estes pedidos existem no dia, mas não bateram com nenhum supervisor.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowUnidentified((prev) => !prev)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-red-700 text-xs font-bold"
                >
                  {showUnidentified ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  {showUnidentified ? "Ocultar" : "Mostrar"}
                </button>
              </div>

              {showUnidentified && (
                <div className="bg-white border border-red-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-red-100 bg-red-50">
                    <p className="text-xs font-bold text-red-700">
                      Dia selecionado: <span>{formatInputDateToBR(selectedDay)}</span>
                    </p>
                  </div>

                  <div className="p-5">
                    {unidentifiedRequests.length === 0 ? (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
                        Nenhum pedido não identificado nesse dia.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {unidentifiedRequests.map((item) => renderRequestCard(item, true))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        <div className="mt-8 flex justify-start">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold"
          >
            <ArrowLeft size={14} />
            Voltar ao painel admin
          </Link>
        </div>
      </main>
    </div>
  );
}