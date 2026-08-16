"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  CalendarRange,
  Loader2,
  ArrowLeft,
  RefreshCw,
  ChevronDown,
  ChevronRight,
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
const isEmailLike = (value: any) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanText(value));

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
  const clientCpf = onlyDigits(
    sale?.client_cpf || sale?.details?.client_cpf || sale?.details?.cpf || ""
  );
  const clientPhone = onlyDigits(
    sale?.client_phone || sale?.details?.client_phone || sale?.details?.telefone || ""
  );
  const clientName = lowerText(getClientName(sale));
  const carName = lowerText(getCarName(sale));
  const total = Number(sale?.total_price || 0).toFixed(2);

  const created = getReferenceDate(sale) ? new Date(getReferenceDate(sale)) : null;
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
      if (rowCreated > currentCreated) map.set(key, row);
    }
  }

  return Array.from(map.values()).sort(
    (a, b) =>
      new Date(getReferenceDate(b) || 0).getTime() -
      new Date(getReferenceDate(a) || 0).getTime()
  );
};

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
        .select(`*, profiles:seller_id (email)`)
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
          supervisor_name: hasSupervisor
            ? supervisorLabel(supervisorEmail)
            : "NÃO IDENTIFICADO",
          raw_sale: sale,
        };
      })
      .sort(
        (a, b) => new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime()
      );
  }, [salesOfSelectedDay]);

  const identifiedRequests = useMemo(
    () => allRequestsOfDay.filter((item) => !!item.supervisor_email),
    [allRequestsOfDay]
  );

  const unidentifiedRequests = useMemo(
    () => allRequestsOfDay.filter((item) => !item.supervisor_email),
    [allRequestsOfDay]
  );

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
      (a, b) =>
        b.total - a.total || a.supervisorName.localeCompare(b.supervisorName, "pt-BR")
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
  }, [
    groupedBySupervisor,
    allRequestsOfDay,
    unidentifiedRequests,
    identifiedRequests,
  ]);

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const renderRequestCard = (item: any, highlightUnidentified = false) => (
    <div
      key={item.id}
      className={`border p-4 ${
        highlightUnidentified
          ? "border-red-200 bg-red-50"
          : "border-zinc-200 bg-white"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[14px] font-medium text-zinc-900">{item.seller_name}</p>
          <p className="mt-1 text-[13px] text-zinc-600">
            Cliente: <span className="font-medium text-zinc-900">{item.client_name}</span>
          </p>
          <div className="mt-2 space-y-0.5 text-[12px] text-zinc-500">
            <p>{item.car_name}</p>
            <p>{formatTimeBR(item.time)}</p>
            <p>
              Supervisor:{" "}
              <span
                className={
                  item.supervisor_email ? "text-emerald-700" : "font-medium text-red-600"
                }
              >
                {item.supervisor_name}
              </span>
            </p>
          </div>
        </div>

        <div className="shrink-0 sm:text-right">
          <StatusBadge status={item.status} />
          <p className="mt-2 text-[14px] font-semibold text-zinc-900">
            {formatMoney(item.total_price)}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          <div>
            <p className="text-[12px] text-zinc-500">Administração</p>
            <h1 className="text-lg font-semibold text-zinc-900">
              Consulta de supervisores por dia
            </h1>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              onClick={() => router.push("/admin")}
              className="inline-flex h-9 items-center gap-1.5 border border-zinc-200 bg-white px-3 text-[12px] font-medium text-zinc-700 hover:bg-zinc-50"
            >
              <ArrowLeft size={14} />
              Voltar
            </button>
            <button
              onClick={fetchSales}
              className="inline-flex h-9 items-center gap-1.5 border border-zinc-200 bg-white px-3 text-[12px] font-medium text-zinc-700 hover:bg-zinc-50"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Atualizar
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:px-6">
        {/* seletor de dia */}
        <div className="bg-white p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[14px] font-medium text-zinc-900">Dia da consulta</p>
              <p className="text-[12px] text-zinc-500">
                Supervisores, pedidos identificados e não identificados
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 border border-zinc-200 px-3 py-2">
                <CalendarRange size={14} className="text-zinc-400" />
                <input
                  type="date"
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className="bg-transparent text-[12px] text-zinc-700 outline-none"
                />
              </div>
              <button
                onClick={() => setSelectedDay(getISODateToday())}
                className="h-9 border border-zinc-200 px-3 text-[12px] font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Hoje
              </button>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-px bg-zinc-200 md:grid-cols-5">
          {[
            { label: "Supervisores", value: String(resumo.totalSupervisores) },
            { label: "Ativos no dia", value: String(resumo.comAtendimento) },
            { label: "Por supervisor", value: String(resumo.totalAtendimentos) },
            { label: "Identificados", value: String(resumo.identificados) },
            { label: "Não identificados", value: String(resumo.semSupervisor) },
          ].map((k) => (
            <div key={k.label} className="bg-white px-4 py-3">
              <p className="text-[12px] text-zinc-500">{k.label}</p>
              <p className="mt-1 text-lg font-semibold text-zinc-900">{k.value}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 bg-white px-4 py-16 text-[13px] text-zinc-400">
            <Loader2 size={18} className="animate-spin" />
            Carregando consulta diária…
          </div>
        ) : (
          <>
            {/* por supervisor */}
            <div className="space-y-3">
              <div>
                <h2 className="text-[14px] font-semibold text-zinc-900">
                  Por supervisor
                </h2>
                <p className="text-[12px] text-zinc-500">
                  Dia: {formatInputDateToBR(selectedDay)}
                </p>
              </div>

              {groupedBySupervisor.map((group) => {
                const isOpen = !!expandedGroups[group.supervisorEmail];

                return (
                  <div key={group.supervisorEmail} className="bg-white">
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.supervisorEmail)}
                      className="flex w-full items-start justify-between gap-4 border-b border-zinc-200 px-4 py-3 text-left hover:bg-zinc-50"
                    >
                      <div className="flex min-w-0 items-start gap-2">
                        <span className="mt-0.5 text-zinc-400">
                          {isOpen ? (
                            <ChevronDown size={16} />
                          ) : (
                            <ChevronRight size={16} />
                          )}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[14px] font-medium text-zinc-900">
                            {group.supervisorName}
                          </p>
                          <p className="truncate text-[12px] text-zinc-500">
                            {group.supervisorEmail}
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 bg-zinc-900 px-2.5 py-1 text-[11px] font-medium text-white">
                        {group.total} atendimento{group.total === 1 ? "" : "s"}
                      </span>
                    </button>

                    {isOpen && (
                      <div className="space-y-2 p-4">
                        {group.total === 0 ? (
                          <p className="text-[13px] text-zinc-500">
                            Nenhum atendimento neste dia.
                          </p>
                        ) : (
                          group.atendimentos.map((item: any) =>
                            renderRequestCard(item, false)
                          )
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* identificados */}
            <div>
              <div className="mb-3 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-[14px] font-semibold text-zinc-900">
                    Pedidos identificados
                  </h2>
                  <p className="text-[12px] text-zinc-500">
                    Pedidos do dia com supervisor reconhecido
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGeneralIdentified((prev) => !prev)}
                  className="inline-flex h-9 items-center gap-1.5 border border-zinc-200 px-3 text-[12px] font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  {showGeneralIdentified ? (
                    <ChevronDown size={14} />
                  ) : (
                    <ChevronRight size={14} />
                  )}
                  {showGeneralIdentified ? "Ocultar" : "Mostrar"}
                </button>
              </div>

              {showGeneralIdentified && (
                <div className="bg-white">
                  <div className="border-b border-zinc-200 px-4 py-2.5 text-[12px] text-zinc-500">
                    {formatInputDateToBR(selectedDay)}
                  </div>
                  <div className="space-y-2 p-4">
                    {identifiedRequests.length === 0 ? (
                      <p className="text-[13px] text-zinc-500">
                        Nenhum pedido identificado neste dia.
                      </p>
                    ) : (
                      identifiedRequests.map((item) => renderRequestCard(item, false))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* não identificados */}
            <div>
              <div className="mb-3 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-[14px] font-semibold text-red-700">
                    Pedidos não identificados
                  </h2>
                  <p className="text-[12px] text-zinc-500">
                    Existem no dia, mas sem supervisor identificado
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowUnidentified((prev) => !prev)}
                  className="inline-flex h-9 items-center gap-1.5 border border-red-200 px-3 text-[12px] font-medium text-red-700 hover:bg-red-50"
                >
                  {showUnidentified ? (
                    <ChevronDown size={14} />
                  ) : (
                    <ChevronRight size={14} />
                  )}
                  {showUnidentified ? "Ocultar" : "Mostrar"}
                </button>
              </div>

              {showUnidentified && (
                <div className="border border-red-200 bg-white">
                  <div className="border-b border-red-100 bg-red-50 px-4 py-2.5 text-[12px] text-red-700">
                    {formatInputDateToBR(selectedDay)}
                  </div>
                  <div className="space-y-2 p-4">
                    {unidentifiedRequests.length === 0 ? (
                      <p className="text-[13px] text-emerald-700">
                        Nenhum pedido não identificado neste dia.
                      </p>
                    ) : (
                      unidentifiedRequests.map((item) => renderRequestCard(item, true))
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        <div>
          <Link
            href="/admin"
            className="inline-flex h-9 items-center gap-1.5 border border-zinc-200 bg-white px-3 text-[12px] font-medium text-zinc-700 hover:bg-zinc-50"
          >
            <ArrowLeft size={14} />
            Voltar ao painel admin
          </Link>
        </div>
      </main>
    </div>
  );
}