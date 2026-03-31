"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  ChevronLeft,
  Search,
  Loader2,
  Users,
  CreditCard,
  Phone,
  CarFront,
  Wallet,
  CalendarDays,
  BadgeCheck,
  Database,
  UserSearch,
  ArrowUpDown,
  Eye,
  MessageCircle,
  X,
  ShieldCheck,
  ClipboardList,
  CheckCircle2,
} from "lucide-react";

/* =========================
   HELPERS
========================= */
const onlyDigits = (v: any) => String(v || "").replace(/\D/g, "");
const cleanText = (v: any) => String(v || "").trim();

const maskCPF = (value: string) => {
  const digits = onlyDigits(value).slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})/, "$1-$2")
    .replace(/(-\d{2})\d+?$/, "$1");
};

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(val || 0));
};

const formatPhoneDisplay = (phoneLike: string) => {
  const digits = onlyDigits(phoneLike);

  if (!digits) return "—";

  let national = digits;
  if (national.startsWith("55")) national = national.slice(2);

  if (national.length === 11) {
    return `(${national.slice(0, 2)}) ${national.slice(2, 7)}-${national.slice(7)}`;
  }

  if (national.length === 10) {
    return `(${national.slice(0, 2)}) ${national.slice(2, 6)}-${national.slice(6)}`;
  }

  return phoneLike || "—";
};

const toWhatsDigits = (phoneLike: string) => {
  const digits = onlyDigits(phoneLike);
  if (!digits) return "";

  if (digits.startsWith("55")) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;

  return digits;
};

const normalizeSellerDisplayName = (sale: any) => {
  const detailsSeller = cleanText(sale?.details?.vendedor_digitado);
  const rootSeller = cleanText(sale?.seller_name);

  if (detailsSeller) return detailsSeller.toUpperCase();
  if (rootSeller) return rootSeller.toUpperCase();

  return "—";
};

const isPlaceholderName = (name?: string) => {
  const value = cleanText(name);
  if (!value) return true;

  const placeholders = [
    "—",
    "-",
    "cliente localizado",
    "não informado",
    "nao informado",
    "sem nome",
  ];

  return placeholders.includes(value);
};

const nameScore = (name?: string) => {
  const value = cleanText(name);
  if (!value || isPlaceholderName(value)) return 0;
  return value.length;
};

const pickBetterName = (a?: string, b?: string) => {
  return nameScore(b) > nameScore(a) ? b || a || "—" : a || b || "—";
};

const pickBetterText = (current?: string, incoming?: string) => {
  const c = cleanText(current);
  const i = cleanText(incoming);

  if (!c && i) return incoming || current || "—";
  if (!i && c) return current || incoming || "—";

  return (current && current !== "—" ? current : incoming) || "—";
};

const pickBetterPhone = (current?: string, incoming?: string) => {
  const c = onlyDigits(current || "");
  const i = onlyDigits(incoming || "");

  if (!c && i) return incoming || "—";
  if (!i && c) return current || "—";

  return i.length > c.length ? incoming || current || "—" : current || incoming || "—";
};

const pickBetterNumber = (current?: number, incoming?: number) => {
  if (!current && incoming) return incoming;
  if (!incoming && current) return current;
  return Math.max(Number(current || 0), Number(incoming || 0));
};

type Origem = "PROPOSTA" | "CONSULTA_CLIENTE";

type ClienteGeral = {
  id: string;
  nome: string;
  cpf: string;
  email?: string;
  telefone?: string;
  vendedor?: string;
  veiculo?: string;
  valor?: number;
  score?: number;
  status?: string;
  created_at: string;
  origemPrincipal: Origem;
  origens: Origem[];
};

type SortKey = "created_at" | "nome" | "cpf" | "valor";

const PAGE_SIZE = 20;

/* =========================
   DEDUPE POR CPF
========================= */
function mergeClientesByCpf(rows: ClienteGeral[]) {
  const map = new Map<string, ClienteGeral>();

  for (const row of rows) {
    const cpfKey = onlyDigits(row.cpf);

    if (!cpfKey) continue;

    const current = map.get(cpfKey);

    if (!current) {
      map.set(cpfKey, {
        ...row,
        cpf: maskCPF(cpfKey),
        origens: [...new Set(row.origens)],
      });
      continue;
    }

    const mergedOrigens = Array.from(new Set([...(current.origens || []), ...(row.origens || [])]));

    const betterName = pickBetterName(current.nome, row.nome);

    const propostaPriority =
      current.origemPrincipal === "PROPOSTA" || row.origemPrincipal === "PROPOSTA"
        ? "PROPOSTA"
        : "CONSULTA_CLIENTE";

    const currentDate = new Date(current.created_at || 0).getTime();
    const rowDate = new Date(row.created_at || 0).getTime();
    const latestDate = rowDate > currentDate ? row.created_at : current.created_at;

    map.set(cpfKey, {
      ...current,
      id: current.id,
      nome: betterName,
      cpf: maskCPF(cpfKey),
      email: pickBetterText(current.email, row.email),
      telefone: pickBetterPhone(current.telefone, row.telefone),
      vendedor:
        row.origemPrincipal === "PROPOSTA"
          ? pickBetterText(current.vendedor, row.vendedor)
          : pickBetterText(row.vendedor, current.vendedor),
      veiculo:
        row.origemPrincipal === "PROPOSTA"
          ? pickBetterText(current.veiculo, row.veiculo)
          : pickBetterText(current.veiculo, row.veiculo),
      valor: pickBetterNumber(current.valor, row.valor),
      score: pickBetterNumber(current.score, row.score),
      status: pickBetterText(current.status, row.status),
      created_at: latestDate,
      origemPrincipal: propostaPriority,
      origens: mergedOrigens,
    });
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

/* =========================
   PAGE
========================= */
export default function ClientesConsultadosPage() {
  const [loading, setLoading] = useState(true);
  const [clientes, setClientes] = useState<ClienteGeral[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [origemFilter, setOrigemFilter] = useState<"TODOS" | "PROPOSTA" | "CONSULTA_CLIENTE">(
    "TODOS"
  );
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedClient, setSelectedClient] = useState<ClienteGeral | null>(null);
  const [page, setPage] = useState(1);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir("desc");
  };

  async function fetchClientes() {
    setLoading(true);

    try {
      const [salesResult, clientsResult] = await Promise.all([
        supabase.from("sales").select("*").order("created_at", { ascending: false }),
        supabase.from("clients").select("*").order("created_at", { ascending: false }),
      ]);

      if (salesResult.error) throw salesResult.error;
      if (clientsResult.error) throw clientsResult.error;

      const salesRows = (salesResult.data || []).map((sale: any): ClienteGeral => ({
        id: `sale-${sale.id}`,
        nome: sale.client_name || "—",
        cpf: sale.client_cpf || "—",
        email: sale.client_email || "—",
        telefone: sale.client_phone || "—",
        vendedor: normalizeSellerDisplayName(sale),
        veiculo: sale.car_name || "—",
        valor: Number(sale.total_price || 0),
        score: 0,
        status: sale.status || "Aprovado",
        created_at: sale.created_at,
        origemPrincipal: "PROPOSTA",
        origens: ["PROPOSTA"],
      }));

      const clientsRows = (clientsResult.data || []).map((client: any): ClienteGeral => ({
        id: `client-${client.id}`,
        nome: client.name || "—",
        cpf: client.cpf ? maskCPF(client.cpf) : "—",
        email: client.email || "—",
        telefone: client.phone || "—",
        vendedor: client.seller_name || "—",
        veiculo: "—",
        valor: 0,
        score: Number(client.score || 0),
        status: client.status || "Em análise",
        created_at: client.created_at,
        origemPrincipal: "CONSULTA_CLIENTE",
        origens: ["CONSULTA_CLIENTE"],
      }));

      const merged = mergeClientesByCpf([...salesRows, ...clientsRows]);
      setClientes(merged);
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchClientes();
  }, []);

  const filteredClientes = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return clientes
      .filter((item) => {
        const matchesOrigem =
          origemFilter === "TODOS" ? true : item.origens.includes(origemFilter);

        const matchesSearch =
          !term ||
          item.nome?.toLowerCase().includes(term) ||
          item.cpf?.toLowerCase().includes(term) ||
          item.telefone?.toLowerCase().includes(term) ||
          item.vendedor?.toLowerCase().includes(term) ||
          item.veiculo?.toLowerCase().includes(term);

        return matchesOrigem && matchesSearch;
      })
      .sort((a, b) => {
        const dir = sortDir === "asc" ? 1 : -1;

        if (sortKey === "created_at") {
          return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir;
        }

        if (sortKey === "nome") {
          return String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR") * dir;
        }

        if (sortKey === "cpf") {
          return String(a.cpf || "").localeCompare(String(b.cpf || ""), "pt-BR") * dir;
        }

        return (Number(a.valor || 0) - Number(b.valor || 0)) * dir;
      });
  }, [clientes, searchTerm, origemFilter, sortKey, sortDir]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, origemFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredClientes.length / PAGE_SIZE));

  const paginatedClientes = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredClientes.slice(start, start + PAGE_SIZE);
  }, [filteredClientes, page]);

  const visiblePages = useMemo(() => {
    const pages: number[] = [];
    const maxButtons = 5;

    let start = Math.max(1, page - 2);
    let end = Math.min(totalPages, start + maxButtons - 1);

    if (end - start < maxButtons - 1) {
      start = Math.max(1, end - maxButtons + 1);
    }

    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [page, totalPages]);

  const kpis = useMemo(() => {
    const total = filteredClientes.length;
    const propostas = filteredClientes.filter((c) => c.origens.includes("PROPOSTA")).length;
    const consultas = filteredClientes.filter((c) => c.origens.includes("CONSULTA_CLIENTE")).length;
    const valorTotal = filteredClientes.reduce((acc, item) => acc + Number(item.valor || 0), 0);

    return { total, propostas, consultas, valorTotal };
  }, [filteredClientes]);

  return (
    <div className="min-h-screen bg-slate-50">
      {selectedClient && (
        <ClientModal client={selectedClient} onClose={() => setSelectedClient(null)} />
      )}

      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/dashboard"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            >
              <ChevronLeft size={18} />
            </Link>

            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                Painel Administrativo
              </p>
              <h1 className="text-lg font-black text-slate-900 md:text-xl">
                Clientes Gerais
              </h1>
            </div>
          </div>

          <button
            onClick={fetchClientes}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            <Loader2 size={14} className={loading ? "animate-spin" : ""} />
            Atualizar
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-5 md:px-6 md:py-8">
        <section className="mb-5 overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-100 via-white to-slate-100 shadow-sm">
          <div className="grid gap-4 p-4 md:grid-cols-[1.4fr_0.8fr] md:p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg md:h-14 md:w-14">
                <Users className="h-6 w-6 md:h-7 md:w-7" />
              </div>

              <div className="min-w-0">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 md:text-sm">
                  <Database className="h-4 w-4" />
                  Base unificada sem CPF repetido
                </div>

                <h2 className="text-xl font-bold tracking-tight text-slate-950 md:text-3xl">
                  Clientes únicos por CPF
                </h2>

                <p className="mt-2 max-w-2xl text-sm text-slate-600 md:text-base">
                  Quando o mesmo CPF existe em mais de uma origem, o sistema mantém só um cliente e
                  prioriza o nome mais completo.
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-blue-100 bg-blue-50 p-4">
              <div className="flex items-center gap-2 text-blue-700">
                <CheckCircle2 size={16} />
                <p className="text-xs font-black uppercase tracking-wide md:text-sm">
                  Regra aplicada
                </p>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                CPF único, vendedor destacado e prioridade para nome completo.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-5 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <div className="flex flex-col gap-3">
            <div className="relative w-full">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Buscar por nome, CPF, telefone, vendedor ou veículo..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm font-medium transition-all focus:border-black focus:outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "Todos", value: "TODOS" },
                  { label: "Proposta", value: "PROPOSTA" },
                  { label: "Consulta de Cliente", value: "CONSULTA_CLIENTE" },
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setOrigemFilter(item.value as any)}
                    className={`rounded-lg px-4 py-2 text-xs font-bold uppercase transition-all ${
                      origemFilter === item.value
                        ? "bg-black text-white"
                        : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => toggleSort("created_at")}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold uppercase ${
                    sortKey === "created_at"
                      ? "border-black bg-black text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <ArrowUpDown size={14} /> Data {sortKey === "created_at" ? `(${sortDir})` : ""}
                </button>

                <button
                  onClick={() => toggleSort("nome")}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold uppercase ${
                    sortKey === "nome"
                      ? "border-black bg-black text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <ArrowUpDown size={14} /> Nome {sortKey === "nome" ? `(${sortDir})` : ""}
                </button>

                <button
                  onClick={() => toggleSort("cpf")}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold uppercase ${
                    sortKey === "cpf"
                      ? "border-black bg-black text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <ArrowUpDown size={14} /> CPF {sortKey === "cpf" ? `(${sortDir})` : ""}
                </button>

                <button
                  onClick={() => toggleSort("valor")}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold uppercase ${
                    sortKey === "valor"
                      ? "border-black bg-black text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <ArrowUpDown size={14} /> Valor {sortKey === "valor" ? `(${sortDir})` : ""}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard icon={<Users size={18} />} label="Total" value={String(kpis.total)} tone="slate" />
          <KpiCard icon={<BadgeCheck size={18} />} label="Com Proposta" value={String(kpis.propostas)} tone="blue" />
          <KpiCard icon={<UserSearch size={18} />} label="Com Consulta" value={String(kpis.consultas)} tone="emerald" />
          <KpiCard icon={<Wallet size={18} />} label="Valor em Propostas" value={formatCurrency(kpis.valorTotal)} tone="amber" />
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-4">
            <div>
              <h3 className="font-bold text-slate-800">Clientes</h3>
              <p className="text-xs text-slate-500">
                {filteredClientes.length} resultado(s) • exibindo {Math.min(PAGE_SIZE, paginatedClientes.length)} por página
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400">
              <Loader2 className="mb-2 animate-spin" size={32} />
              <p className="text-xs font-bold uppercase">Carregando...</p>
            </div>
          ) : paginatedClientes.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <p className="text-sm font-medium">Nenhum cliente encontrado.</p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full text-left">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                    <tr>
                      <th className="px-6 py-4">Origem</th>
                      <th className="px-6 py-4">Cliente</th>
                      <th className="px-6 py-4">Contato</th>
                      <th className="px-6 py-4">Atendimento</th>
                      <th className="px-6 py-4 text-right">Data</th>
                      <th className="px-6 py-4 text-right">Ações</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {paginatedClientes.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <OrigemBadgeList origens={item.origens} />
                        </td>

                        <td className="px-6 py-4">
                          <p className="text-sm font-bold uppercase text-slate-900">{item.nome}</p>
                          <p className="mt-1 font-mono text-[11px] text-slate-400">{item.cpf}</p>
                        </td>

                        <td className="px-6 py-4">
                          <div className="space-y-1 text-xs text-slate-600">
                            <p className="flex items-center gap-2">
                              <Phone size={12} />
                              <span>{formatPhoneDisplay(item.telefone || "")}</span>
                            </p>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="space-y-1 text-xs text-slate-600">
                            <p className="flex items-center gap-2">
                              <BadgeCheck size={12} />
                              <span className="font-bold text-slate-800">
                                Vendedor: {item.vendedor || "—"}
                              </span>
                            </p>

                            {item.veiculo && item.veiculo !== "—" ? (
                              <p className="flex items-center gap-2">
                                <CarFront size={12} />
                                <span>{item.veiculo}</span>
                              </p>
                            ) : null}

                            {Number(item.valor || 0) > 0 ? (
                              <p className="flex items-center gap-2">
                                <Wallet size={12} />
                                <span>{formatCurrency(Number(item.valor || 0))}</span>
                              </p>
                            ) : null}
                          </div>
                        </td>

                        <td className="px-6 py-4 text-right text-xs font-bold text-slate-600">
                          {new Date(item.created_at).toLocaleDateString("pt-BR")} <br />
                          {new Date(item.created_at).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {toWhatsDigits(item.telefone || "") && (
                              <a
                                href={`https://wa.me/${toWhatsDigits(item.telefone || "")}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-bold text-green-700 hover:bg-green-100"
                              >
                                <MessageCircle size={14} />
                                WhatsApp
                              </a>
                            )}

                            <button
                              onClick={() => setSelectedClient(item)}
                              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                            >
                              <Eye size={14} />
                              Ver
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-1 gap-3 p-4 lg:hidden">
                {paginatedClientes.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold uppercase text-slate-900">
                          {item.nome}
                        </p>
                        <p className="mt-1 font-mono text-[11px] text-slate-400">{item.cpf}</p>
                      </div>
                      <OrigemBadgeList origens={item.origens} />
                    </div>

                    <div className="space-y-2 text-xs text-slate-600">
                      <p className="flex items-center gap-2">
                        <Phone size={12} />
                        <span>{formatPhoneDisplay(item.telefone || "")}</span>
                      </p>

                      <p className="flex items-center gap-2">
                        <BadgeCheck size={12} />
                        <span className="font-bold text-slate-800">
                          Vendedor: {item.vendedor || "—"}
                        </span>
                      </p>

                      {item.veiculo && item.veiculo !== "—" ? (
                        <p className="flex items-center gap-2">
                          <CarFront size={12} />
                          <span>{item.veiculo}</span>
                        </p>
                      ) : null}

                      {Number(item.valor || 0) > 0 ? (
                        <p className="flex items-center gap-2">
                          <Wallet size={12} />
                          <span>{formatCurrency(Number(item.valor || 0))}</span>
                        </p>
                      ) : null}

                      <p className="flex items-center gap-2">
                        <CalendarDays size={12} />
                        <span>
                          {new Date(item.created_at).toLocaleDateString("pt-BR")} às{" "}
                          {new Date(item.created_at).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </p>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {toWhatsDigits(item.telefone || "") && (
                        <a
                          href={`https://wa.me/${toWhatsDigits(item.telefone || "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-bold text-green-700 hover:bg-green-100"
                        >
                          <MessageCircle size={14} />
                          WhatsApp
                        </a>
                      )}

                      <button
                        onClick={() => setSelectedClient(item)}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                      >
                        <Eye size={14} />
                        Ver detalhes
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 p-4 md:flex-row">
                <div className="text-[11px] font-bold text-slate-400">
                  Mostrando{" "}
                  <span className="text-slate-800">
                    {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredClientes.length)}
                  </span>{" "}
                  de <span className="text-slate-800">{filteredClientes.length}</span>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold uppercase text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                  >
                    Anterior
                  </button>

                  {visiblePages.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`rounded-lg px-3 py-2 text-xs font-bold uppercase ${
                        page === p
                          ? "bg-black text-white"
                          : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Página {p}
                    </button>
                  ))}

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold uppercase text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

/* =========================
   COMPONENTS
========================= */
function OrigemBadge({ origem }: { origem: Origem }) {
  if (origem === "PROPOSTA") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-blue-700">
        <BadgeCheck size={12} />
        Proposta
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-700">
      <UserSearch size={12} />
      Consulta Cliente
    </span>
  );
}

function OrigemBadgeList({ origens }: { origens: Origem[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {origens.includes("PROPOSTA") && <OrigemBadge origem="PROPOSTA" />}
      {origens.includes("CONSULTA_CLIENTE") && <OrigemBadge origem="CONSULTA_CLIENTE" />}
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "slate" | "blue" | "emerald" | "amber";
}) {
  const toneMap = {
    slate: "bg-slate-50 text-slate-700",
    blue: "bg-blue-50 text-blue-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className={`rounded-lg p-2 ${toneMap[tone]}`}>{icon}</div>
        <span className="text-[10px] font-black uppercase text-slate-400">{label}</span>
      </div>
      <p className="mt-3 break-words text-2xl font-black text-slate-900">{value}</p>
    </div>
  );
}

function ClientModal({
  client,
  onClose,
}: {
  client: ClienteGeral;
  onClose: () => void;
}) {
  const whatsapp = toWhatsDigits(client.telefone || "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-100 via-white to-slate-100 p-5 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Detalhes do Cliente
              </p>
              <h2 className="truncate text-xl font-black text-slate-900 md:text-2xl">
                {client.nome}
              </h2>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <OrigemBadgeList origens={client.origens} />
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wide text-slate-600">
                  {client.cpf}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-[1.2fr_0.8fr] md:p-6">
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="mb-3 text-xs font-black uppercase tracking-wide text-slate-500">
                Identificação
              </h3>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <ModalInfo label="Nome completo" value={client.nome} highlight />
                <ModalInfo label="CPF" value={client.cpf} />
                <ModalInfo label="Telefone" value={formatPhoneDisplay(client.telefone || "")} />
                <ModalInfo
                  label="Data do registro"
                  value={`${new Date(client.created_at).toLocaleDateString("pt-BR")} às ${new Date(
                    client.created_at
                  ).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="mb-3 text-xs font-black uppercase tracking-wide text-slate-500">
                Atendimento
              </h3>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <ModalInfo
                  label="Vendedor que atendeu"
                  value={client.vendedor || "Não informado"}
                  highlight
                />
                <ModalInfo label="Status" value={client.status || "—"} />
                <ModalInfo label="Veículo" value={client.veiculo || "—"} />
                <ModalInfo label="Valor da proposta" value={Number(client.valor || 0) > 0 ? formatCurrency(Number(client.valor || 0)) : "—"} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <h3 className="mb-2 text-xs font-black uppercase tracking-wide text-emerald-700">
                Ação rápida
              </h3>
              <p className="text-sm text-emerald-800">
                Entre em contato direto com o cliente no WhatsApp.
              </p>

              {whatsapp ? (
                <a
                  href={`https://wa.me/${whatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-bold text-white hover:bg-green-700"
                >
                  <MessageCircle size={16} />
                  Abrir WhatsApp
                </a>
              ) : (
                <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-500">
                  Telefone indisponível
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="mb-3 text-xs font-black uppercase tracking-wide text-slate-500">
                Resumo
              </h3>

              <div className="space-y-3">
                <ResumoLinha label="Cliente" value={client.nome} />
                <ResumoLinha label="CPF" value={client.cpf} />
                <ResumoLinha label="Telefone" value={formatPhoneDisplay(client.telefone || "")} />
                <ResumoLinha label="Vendedor" value={client.vendedor || "—"} />
                <ResumoLinha
                  label="Origens"
                  value={client.origens
                    .map((o) => (o === "PROPOSTA" ? "Proposta" : "Consulta de Cliente"))
                    .join(" + ")}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50 p-5 md:flex-row md:items-center md:justify-between">
          <div className="text-xs font-bold text-slate-500">
            Cliente consolidado por CPF único
          </div>

          <div className="flex items-center gap-2">
            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-xs font-bold text-green-700 hover:bg-green-100"
              >
                <MessageCircle size={14} />
                WhatsApp
              </a>
            )}

            <button
              onClick={onClose}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModalInfo({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-4 ${highlight ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white"}`}>
      <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-2 break-words text-sm font-bold ${highlight ? "text-emerald-800" : "text-slate-900"}`}>
        {value}
      </p>
    </div>
  );
}

function ResumoLinha({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2 last:border-0 last:pb-0">
      <span className="text-xs font-bold uppercase text-slate-400">{label}</span>
      <span className="max-w-[60%] break-words text-right text-sm font-semibold text-slate-900">
        {value}
      </span>
    </div>
  );
}