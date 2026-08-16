"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  ChevronLeft,
  Search,
  Loader2,
  ArrowUpDown,
  Eye,
  MessageCircle,
  Phone,
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

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(val || 0));

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

const pickBetterName = (a?: string, b?: string) =>
  nameScore(b) > nameScore(a) ? b || a || "—" : a || b || "—";

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

    const mergedOrigens = Array.from(
      new Set([...(current.origens || []), ...(row.origens || [])])
    );

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

function OrigemBadge({ origem }: { origem: Origem }) {
  if (origem === "PROPOSTA") {
    return (
      <span className="bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
        Proposta
      </span>
    );
  }
  return (
    <span className="bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
      Consulta
    </span>
  );
}

function OrigemBadgeList({ origens }: { origens: Origem[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {origens.includes("PROPOSTA") && <OrigemBadge origem="PROPOSTA" />}
      {origens.includes("CONSULTA_CLIENTE") && (
        <OrigemBadge origem="CONSULTA_CLIENTE" />
      )}
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
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto bg-white">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-200 px-5 py-4">
          <div className="min-w-0">
            <p className="text-[12px] text-zinc-500">Cliente</p>
            <h2 className="truncate text-lg font-semibold text-zinc-900">
              {client.nome}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <OrigemBadgeList origens={client.origens} />
              <span className="font-mono text-[12px] text-zinc-500">{client.cpf}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[13px] font-medium text-zinc-500 hover:text-zinc-900"
          >
            Fechar
          </button>
        </div>

        <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-[12px] font-medium text-zinc-500">Identificação</p>
            <div className="space-y-2 text-[14px]">
              <div>
                <p className="text-[12px] text-zinc-500">Nome</p>
                <p className="font-medium text-zinc-900">{client.nome}</p>
              </div>
              <div>
                <p className="text-[12px] text-zinc-500">CPF</p>
                <p className="font-mono text-zinc-700">{client.cpf}</p>
              </div>
              <div>
                <p className="text-[12px] text-zinc-500">Telefone</p>
                <p className="text-zinc-700">
                  {formatPhoneDisplay(client.telefone || "")}
                </p>
              </div>
              <div>
                <p className="text-[12px] text-zinc-500">Registro</p>
                <p className="text-zinc-700">
                  {new Date(client.created_at).toLocaleDateString("pt-BR")}{" "}
                  {new Date(client.created_at).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </div>

          <div>
            <p className="mb-2 text-[12px] font-medium text-zinc-500">Atendimento</p>
            <div className="space-y-2 text-[14px]">
              <div>
                <p className="text-[12px] text-zinc-500">Vendedor</p>
                <p className="font-medium text-zinc-900">
                  {client.vendedor || "Não informado"}
                </p>
              </div>
              <div>
                <p className="text-[12px] text-zinc-500">Status</p>
                <p className="text-zinc-700">{client.status || "—"}</p>
              </div>
              <div>
                <p className="text-[12px] text-zinc-500">Veículo</p>
                <p className="text-zinc-700">{client.veiculo || "—"}</p>
              </div>
              <div>
                <p className="text-[12px] text-zinc-500">Valor</p>
                <p className="font-medium text-zinc-900">
                  {Number(client.valor || 0) > 0
                    ? formatCurrency(Number(client.valor || 0))
                    : "—"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-zinc-200 bg-zinc-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12px] text-zinc-500">Consolidado por CPF único</p>
          <div className="flex gap-2">
            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center gap-1.5 bg-emerald-600 px-4 text-[12px] font-medium text-white hover:bg-emerald-700"
              >
                <MessageCircle size={14} />
                WhatsApp
              </a>
            )}
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

/* =========================
   PAGE
========================= */
export default function ClientesConsultadosPage() {
  const [loading, setLoading] = useState(true);
  const [clientes, setClientes] = useState<ClienteGeral[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [origemFilter, setOrigemFilter] = useState<
    "TODOS" | "PROPOSTA" | "CONSULTA_CLIENTE"
  >("TODOS");
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

      const salesRows = (salesResult.data || []).map(
        (sale: any): ClienteGeral => ({
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
        })
      );

      const clientsRows = (clientsResult.data || []).map(
        (client: any): ClienteGeral => ({
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
        })
      );

      setClientes(mergeClientesByCpf([...salesRows, ...clientsRows]));
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
          return (
            (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir
          );
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
    const propostas = filteredClientes.filter((c) =>
      c.origens.includes("PROPOSTA")
    ).length;
    const consultas = filteredClientes.filter((c) =>
      c.origens.includes("CONSULTA_CLIENTE")
    ).length;
    const valorTotal = filteredClientes.reduce(
      (acc, item) => acc + Number(item.valor || 0),
      0
    );
    return { total, propostas, consultas, valorTotal };
  }, [filteredClientes]);

  return (
    <div className="min-h-screen bg-zinc-50">
      {selectedClient && (
        <ClientModal client={selectedClient} onClose={() => setSelectedClient(null)} />
      )}

      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/dashboard"
              className="inline-flex h-9 w-9 items-center justify-center border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
            >
              <ChevronLeft size={18} />
            </Link>
            <div>
              <p className="text-[12px] text-zinc-500">Administração</p>
              <h1 className="text-lg font-semibold text-zinc-900">Clientes gerais</h1>
            </div>
          </div>

          <button
            onClick={fetchClientes}
            className="inline-flex h-9 items-center gap-1.5 border border-zinc-200 bg-white px-3 text-[12px] font-medium text-zinc-700 hover:bg-zinc-50"
          >
            <Loader2 size={14} className={loading ? "animate-spin" : ""} />
            Atualizar
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:px-6">
        <div>
          <p className="text-[13px] text-zinc-600">
            Base unificada por CPF. Quando o mesmo CPF aparece em proposta e consulta, fica um
            único registro com o nome mais completo.
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-px bg-zinc-200 md:grid-cols-4">
          {[
            { label: "Total", value: String(kpis.total) },
            { label: "Com proposta", value: String(kpis.propostas) },
            { label: "Com consulta", value: String(kpis.consultas) },
            { label: "Valor em propostas", value: formatCurrency(kpis.valorTotal) },
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
                placeholder="Buscar nome, CPF, telefone, vendedor ou veículo…"
                className="h-10 w-full border border-zinc-200 bg-white pl-9 pr-3 text-[14px] outline-none focus:border-zinc-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "Todos", value: "TODOS" },
                  { label: "Proposta", value: "PROPOSTA" },
                  { label: "Consulta", value: "CONSULTA_CLIENTE" },
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setOrigemFilter(item.value as any)}
                    className={`h-9 px-3 text-[12px] font-medium ${
                      origemFilter === item.value
                        ? "bg-zinc-900 text-white"
                        : "border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                {(["created_at", "nome", "cpf", "valor"] as const).map((key) => {
                  const labels = {
                    created_at: "Data",
                    nome: "Nome",
                    cpf: "CPF",
                    valor: "Valor",
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
          </div>
        </div>

        {/* lista */}
        <div className="bg-white">
          <div className="border-b border-zinc-200 px-4 py-3">
            <h2 className="text-[14px] font-semibold text-zinc-900">Clientes</h2>
            <p className="text-[12px] text-zinc-500">
              {filteredClientes.length} resultado(s) · página {page} de {totalPages}
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 px-4 py-10 text-[13px] text-zinc-400">
              <Loader2 size={18} className="animate-spin" />
              Carregando…
            </div>
          ) : paginatedClientes.length === 0 ? (
            <p className="px-4 py-10 text-center text-[13px] text-zinc-400">
              Nenhum cliente encontrado.
            </p>
          ) : (
            <>
              {/* desktop */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full text-left text-[13px]">
                  <thead className="border-b border-zinc-200 bg-zinc-50 text-[11px] text-zinc-500">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">Origem</th>
                      <th className="px-4 py-2.5 font-medium">Cliente</th>
                      <th className="px-4 py-2.5 font-medium">Contato</th>
                      <th className="px-4 py-2.5 font-medium">Atendimento</th>
                      <th className="px-4 py-2.5 text-right font-medium">Data</th>
                      <th className="px-4 py-2.5 text-right font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {paginatedClientes.map((item) => (
                      <tr key={item.id} className="hover:bg-zinc-50">
                        <td className="px-4 py-2.5">
                          <OrigemBadgeList origens={item.origens} />
                        </td>
                        <td className="px-4 py-2.5">
                          <p className="font-medium text-zinc-900">{item.nome}</p>
                          <p className="mt-0.5 font-mono text-[11px] text-zinc-400">
                            {item.cpf}
                          </p>
                        </td>
                        <td className="px-4 py-2.5 text-zinc-600">
                          <span className="inline-flex items-center gap-1">
                            <Phone size={12} className="text-zinc-400" />
                            {formatPhoneDisplay(item.telefone || "")}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <p className="font-medium text-zinc-800">
                            {item.vendedor || "—"}
                          </p>
                          {item.veiculo && item.veiculo !== "—" && (
                            <p className="text-[11px] text-zinc-400">{item.veiculo}</p>
                          )}
                          {Number(item.valor || 0) > 0 && (
                            <p className="text-[11px] text-zinc-500">
                              {formatCurrency(Number(item.valor || 0))}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right text-zinc-600">
                          {new Date(item.created_at).toLocaleDateString("pt-BR")}
                          <br />
                          <span className="text-[11px] text-zinc-400">
                            {new Date(item.created_at).toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {toWhatsDigits(item.telefone || "") && (
                              <a
                                href={`https://wa.me/${toWhatsDigits(item.telefone || "")}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50"
                              >
                                <MessageCircle size={13} />
                                WhatsApp
                              </a>
                            )}
                            <button
                              onClick={() => setSelectedClient(item)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-zinc-600 hover:bg-zinc-100"
                            >
                              <Eye size={13} />
                              Ver
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* mobile */}
              <div className="space-y-3 p-4 lg:hidden">
                {paginatedClientes.map((item) => (
                  <div key={item.id} className="border border-zinc-200 bg-white p-4">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-zinc-900">{item.nome}</p>
                        <p className="mt-0.5 font-mono text-[11px] text-zinc-400">
                          {item.cpf}
                        </p>
                      </div>
                      <OrigemBadgeList origens={item.origens} />
                    </div>

                    <div className="space-y-1 text-[13px] text-zinc-600">
                      <p>{formatPhoneDisplay(item.telefone || "")}</p>
                      <p className="font-medium text-zinc-800">
                        Vendedor: {item.vendedor || "—"}
                      </p>
                      {item.veiculo && item.veiculo !== "—" && <p>{item.veiculo}</p>}
                      {Number(item.valor || 0) > 0 && (
                        <p>{formatCurrency(Number(item.valor || 0))}</p>
                      )}
                      <p className="text-[12px] text-zinc-400">
                        {new Date(item.created_at).toLocaleDateString("pt-BR")}{" "}
                        {new Date(item.created_at).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    <div className="mt-3 flex gap-2">
                      {toWhatsDigits(item.telefone || "") && (
                        <a
                          href={`https://wa.me/${toWhatsDigits(item.telefone || "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex flex-1 items-center justify-center gap-1 border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] font-medium text-emerald-700"
                        >
                          <MessageCircle size={14} />
                          WhatsApp
                        </a>
                      )}
                      <button
                        onClick={() => setSelectedClient(item)}
                        className="inline-flex flex-1 items-center justify-center gap-1 border border-zinc-200 bg-white px-3 py-2 text-[12px] font-medium text-zinc-700"
                      >
                        <Eye size={14} />
                        Ver
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* paginação */}
              <div className="flex flex-col items-center justify-between gap-3 border-t border-zinc-200 px-4 py-3 sm:flex-row">
                <p className="text-[12px] text-zinc-500">
                  {(page - 1) * PAGE_SIZE + 1}–
                  {Math.min(page * PAGE_SIZE, filteredClientes.length)} de{" "}
                  {filteredClientes.length}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="h-8 border border-zinc-200 px-3 text-[12px] font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-40"
                  >
                    Anterior
                  </button>
                  {visiblePages.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`h-8 px-3 text-[12px] font-medium ${
                        page === p
                          ? "bg-zinc-900 text-white"
                          : "border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="h-8 border border-zinc-200 px-3 text-[12px] font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-40"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}