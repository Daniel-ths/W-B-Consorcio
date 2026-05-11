"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import {
  AlertTriangle,
  BarChart3,
  Check,
  ClipboardList,
  FileSpreadsheet,
  LayoutDashboard,
  Pencil,
  PieChart,
  Plus,
  RefreshCcw,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";

type AnyRow = Record<string, any>;

type TabKey =
  | "visao"
  | "producao"
  | "clientes"
  | "antecipacoes"
  | "pcl"
  | "equipes"
  | "cadastros"
  | "simpala"
  | "despesas"
  | "relatorios";

type TableKey =
  | "nac_teams"
  | "nac_supervisors"
  | "nac_sellers"
  | "nac_adms"
  | "nac_pdv"
  | "nac_goals"
  | "nac_sales"
  | "nac_client_installments"
  | "nac_pcl_records"
  | "nac_general_expenses"
  | "nac_simpala_entries"
  | "nac_simpala_balances";

type FieldType = "text" | "number" | "date" | "select" | "textarea" | "checkbox";

type FieldConfig = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  dynamicOptions?: "teams" | "sellers" | "supervisors" | "adms" | "pdvs";
  colSpan?: 1 | 2 | 3;
};

type TableConfig = {
  key: TableKey;
  title: string;
  description: string;
  fields: FieldConfig[];
  columns: { key: string; label: string; format?: "money" | "date" | "bool" | "lookup" }[];
};

const tabs: { key: TabKey; label: string; icon: any }[] = [
  { key: "visao", label: "Visão geral", icon: LayoutDashboard },
  { key: "producao", label: "Produção", icon: BarChart3 },
  { key: "clientes", label: "Clientes / Parcelas", icon: ClipboardList },
  { key: "antecipacoes", label: "Antecipações", icon: Check },
  { key: "pcl", label: "PCL / ADM", icon: ShieldCheck },
  { key: "equipes", label: "Equipes", icon: Users },
  { key: "cadastros", label: "Cadastros", icon: UserRound },
  { key: "simpala", label: "Simpala", icon: PieChart },
  { key: "despesas", label: "Despesas gerais", icon: AlertTriangle },
  { key: "relatorios", label: "Relatórios", icon: FileSpreadsheet },
];

const todayISO = () => new Date().toISOString().slice(0, 10);
const currentMonthISO = () => `${new Date().toISOString().slice(0, 7)}-01`;

function money(value: any) {
  const n = Number(value || 0);
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number.isFinite(n) ? n : 0);
}

function numberBR(value: any) {
  const n = Number(value || 0);
  return new Intl.NumberFormat("pt-BR").format(Number.isFinite(n) ? n : 0);
}

function dateBR(value?: string) {
  if (!value) return "-";
  const [y, m, d] = String(value).split("-");
  if (!y || !m || !d) return "-";
  return `${d}/${m}/${y}`;
}

function parseNumber(value: any) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const normalized = String(value || "").replace(/R\$/g, "").replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

function normalize(value: string) {
  return String(value || "").toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

function sum(rows: AnyRow[], key: string) {
  return rows.reduce((acc, row) => acc + Number(row[key] || 0), 0);
}

function groupSum(rows: AnyRow[], key: string, valueKey: string) {
  return rows.reduce<Record<string, number>>((acc, row) => {
    const group = String(row[key] || "Não informado");
    acc[group] = (acc[group] || 0) + Number(row[valueKey] || 0);
    return acc;
  }, {});
}

function monthOf(value?: string) {
  if (!value) return "";
  return String(value).slice(0, 7);
}

const staticOptions = {
  active: [
    { value: "true", label: "Ativo" },
    { value: "false", label: "Inativo" },
  ],
  goalScope: [
    { value: "GERAL", label: "Geral" },
    { value: "EQUIPE", label: "Equipe" },
  ],
  saleSituation: [
    { value: "PAGO", label: "Pago" },
    { value: "PAGA", label: "Paga" },
    { value: "PENDENTE", label: "Pendente" },
    { value: "NAO PAGA", label: "Não paga" },
    { value: "CANCELADA", label: "Cancelada" },
  ],
  installmentType: [
    { value: "CLIENTE", label: "Cliente" },
    { value: "ANTECIPACAO", label: "Antecipação" },
  ],
  installmentStatus: [
    { value: "PAGO", label: "Pago" },
    { value: "A VENCER", label: "A vencer" },
    { value: "ATRASADO", label: "Atrasado" },
    { value: "AT1", label: "AT1" },
    { value: "AT2", label: "AT2" },
    { value: "REC 1", label: "REC 1" },
    { value: "REC 2", label: "REC 2" },
    { value: "PENDENTE", label: "Pendente" },
    { value: "CANCELADO", label: "Cancelado" },
  ],
  pclGroup: [
    { value: "PARCELA 02", label: "Parcela 02" },
    { value: "PARCELA 03", label: "Parcela 03" },
    { value: "PARCELA 04", label: "Parcela 04" },
    { value: "PARCELA 05", label: "Parcela 05" },
    { value: "PARCELA 06", label: "Parcela 06" },
    { value: "ANTECIPACAO", label: "Antecipação" },
    { value: "PARCELA 02-04", label: "Parcela 02-04" },
  ],
  expenseType: [
    { value: "APORTE", label: "Aporte" },
    { value: "RETIRADA", label: "Retirada" },
    { value: "OPERACIONAL", label: "Operacional" },
    { value: "MARKETING", label: "Marketing" },
    { value: "COMISSAO", label: "Comissão" },
    { value: "OUTRO", label: "Outro" },
  ],
  simpalaSection: [
    { value: "ADESOES", label: "Adesões" },
    { value: "PRIMEIRA_QUINZENA", label: "Primeira quinzena" },
    { value: "RECEBIMENTO_GERAL", label: "Recebimento geral" },
  ],
  simpalaBucket: [
    { value: "P2", label: "P2" },
    { value: "P3-P5", label: "P3-P5" },
    { value: "P6", label: "P6" },
    { value: "ANTECIPACOES_P3-P5", label: "Antecipações P3-P5" },
    { value: "NAO_PAGO", label: "Não pago" },
    { value: "CANCELADAS", label: "Canceladas" },
  ],
};

const tableConfigs: Record<TableKey, TableConfig> = {
  nac_teams: {
    key: "nac_teams",
    title: "Equipes",
    description: "Cadastro das equipes EQ01 até EQ08 e novas equipes.",
    fields: [
      { name: "code", label: "Código", type: "text", required: true, placeholder: "EQ01" },
      { name: "name", label: "Nome", type: "text", required: true, placeholder: "Equipe 01" },
      { name: "active", label: "Ativo", type: "checkbox" },
    ],
    columns: [
      { key: "code", label: "Código" },
      { key: "name", label: "Equipe" },
      { key: "active", label: "Ativo", format: "bool" },
    ],
  },
  nac_supervisors: {
    key: "nac_supervisors",
    title: "Supervisores",
    description: "Supervisores, equipe vinculada e percentual de comissão.",
    fields: [
      { name: "name", label: "Nome", type: "text", required: true },
      { name: "team_id", label: "Equipe", type: "select", dynamicOptions: "teams" },
      { name: "commission_percent", label: "% comissão", type: "number" },
      { name: "active", label: "Ativo", type: "checkbox" },
    ],
    columns: [
      { key: "name", label: "Supervisor" },
      { key: "team_id", label: "Equipe", format: "lookup" },
      { key: "commission_percent", label: "% comissão" },
      { key: "active", label: "Ativo", format: "bool" },
    ],
  },
  nac_sellers: {
    key: "nac_sellers",
    title: "Vendedores",
    description: "Vendedores vinculados à equipe e supervisor.",
    fields: [
      { name: "name", label: "Nome", type: "text", required: true },
      { name: "team_id", label: "Equipe", type: "select", dynamicOptions: "teams" },
      { name: "supervisor_id", label: "Supervisor", type: "select", dynamicOptions: "supervisors" },
      { name: "commission_percent", label: "% comissão", type: "number" },
      { name: "active", label: "Ativo", type: "checkbox" },
    ],
    columns: [
      { key: "name", label: "Vendedor" },
      { key: "team_id", label: "Equipe", format: "lookup" },
      { key: "supervisor_id", label: "Supervisor", format: "lookup" },
      { key: "commission_percent", label: "% comissão" },
      { key: "active", label: "Ativo", format: "bool" },
    ],
  },
  nac_adms: {
    key: "nac_adms",
    title: "ADMs",
    description: "Responsáveis administrativos da operação.",
    fields: [
      { name: "name", label: "Nome", type: "text", required: true },
      { name: "active", label: "Ativo", type: "checkbox" },
    ],
    columns: [
      { key: "name", label: "ADM" },
      { key: "active", label: "Ativo", format: "bool" },
    ],
  },
  nac_pdv: {
    key: "nac_pdv",
    title: "PDVs",
    description: "Pontos de venda e origens dos contratos.",
    fields: [
      { name: "name", label: "Nome", type: "text", required: true },
      { name: "active", label: "Ativo", type: "checkbox" },
    ],
    columns: [
      { key: "name", label: "PDV" },
      { key: "active", label: "Ativo", format: "bool" },
    ],
  },
  nac_goals: {
    key: "nac_goals",
    title: "Metas",
    description: "Metas gerais e por equipe: cotas e crédito.",
    fields: [
      { name: "scope", label: "Tipo de meta", type: "select", options: staticOptions.goalScope, required: true },
      { name: "team_id", label: "Equipe", type: "select", dynamicOptions: "teams" },
      { name: "reference_month", label: "Mês referência", type: "date", required: true },
      { name: "week_number", label: "Semana", type: "number" },
      { name: "target_quotas", label: "Meta de cotas", type: "number" },
      { name: "target_credit", label: "Meta de crédito", type: "number" },
      { name: "notes", label: "Observações", type: "textarea", colSpan: 3 },
    ],
    columns: [
      { key: "scope", label: "Tipo" },
      { key: "team_id", label: "Equipe", format: "lookup" },
      { key: "reference_month", label: "Mês", format: "date" },
      { key: "target_quotas", label: "Cotas" },
      { key: "target_credit", label: "Crédito", format: "money" },
    ],
  },
  nac_sales: {
    key: "nac_sales",
    title: "Produção / Vendas",
    description: "DADOS EQ 01 até EQ 08: cliente, CPF, crédito, vendedor, data, forma, PDV e ADM.",
    fields: [
      { name: "team_id", label: "Equipe", type: "select", dynamicOptions: "teams" },
      { name: "seller_id", label: "Vendedor", type: "select", dynamicOptions: "sellers" },
      { name: "supervisor_id", label: "Supervisor", type: "select", dynamicOptions: "supervisors" },
      { name: "client_name", label: "Cliente", type: "text", required: true },
      { name: "cpf_cnpj", label: "CPF/CNPJ", type: "text" },
      { name: "credit_value", label: "Crédito", type: "number" },
      { name: "sale_date", label: "Data / mês", type: "date" },
      { name: "situation", label: "Situação", type: "select", options: staticOptions.saleSituation },
      { name: "payment_method", label: "Forma", type: "text", placeholder: "PIX, boleto, cartão..." },
      { name: "pdv_id", label: "PDV", type: "select", dynamicOptions: "pdvs" },
      { name: "adm_checked", label: "Visto ADM", type: "text" },
      { name: "adm_observation", label: "Observação ADM", type: "textarea", colSpan: 3 },
    ],
    columns: [
      { key: "client_name", label: "Cliente" },
      { key: "cpf_cnpj", label: "CPF/CNPJ" },
      { key: "team_id", label: "Equipe", format: "lookup" },
      { key: "seller_id", label: "Vendedor", format: "lookup" },
      { key: "credit_value", label: "Crédito", format: "money" },
      { key: "sale_date", label: "Data", format: "date" },
      { key: "situation", label: "Situação" },
      { key: "pdv_id", label: "PDV", format: "lookup" },
    ],
  },
  nac_client_installments: {
    key: "nac_client_installments",
    title: "Clientes / Parcelas",
    description: "Clientes, contratos, grupos, parcelas, vencimento, assembleia, vendedor, gerente e pagamento.",
    fields: [
      { name: "record_type", label: "Tipo", type: "select", options: staticOptions.installmentType, required: true },
      { name: "adm_id", label: "ADM", type: "select", dynamicOptions: "adms" },
      { name: "installment_label", label: "Parcela / AT", type: "text", placeholder: "2ª parcela, AT1, AT2..." },
      { name: "status", label: "Status", type: "select", options: staticOptions.installmentStatus },
      { name: "cpf_cnpj", label: "CPF/CNPJ", type: "text" },
      { name: "contract_number", label: "Contrato", type: "text" },
      { name: "group_code", label: "Grupo", type: "text" },
      { name: "client_name", label: "Cliente", type: "text", required: true },
      { name: "phone", label: "Telefone", type: "text" },
      { name: "credit_value", label: "Crédito", type: "number" },
      { name: "due_date", label: "Vencimento", type: "date" },
      { name: "assembly_date", label: "Assembleia", type: "date" },
      { name: "seller_id", label: "Vendedor", type: "select", dynamicOptions: "sellers" },
      { name: "manager_name", label: "Gerente", type: "text" },
      { name: "payment_date", label: "Data pagamento", type: "date" },
    ],
    columns: [
      { key: "record_type", label: "Tipo" },
      { key: "client_name", label: "Cliente" },
      { key: "contract_number", label: "Contrato" },
      { key: "group_code", label: "Grupo" },
      { key: "installment_label", label: "Parcela" },
      { key: "status", label: "Status" },
      { key: "credit_value", label: "Crédito", format: "money" },
      { key: "due_date", label: "Vencimento", format: "date" },
      { key: "adm_id", label: "ADM", format: "lookup" },
      { key: "seller_id", label: "Vendedor", format: "lookup" },
    ],
  },
  nac_pcl_records: {
    key: "nac_pcl_records",
    title: "PCL / ADM",
    description: "PCL total, pago, não pago, crédito total, pago, não pago e percentuais por ADM/equipe.",
    fields: [
      { name: "adm_id", label: "ADM", type: "select", dynamicOptions: "adms" },
      { name: "team_id", label: "Equipe", type: "select", dynamicOptions: "teams" },
      { name: "installment_group", label: "Grupo parcela", type: "select", options: staticOptions.pclGroup, required: true },
      { name: "pcl_total", label: "PCL total", type: "number" },
      { name: "pcl_paid", label: "PCL pago", type: "number" },
      { name: "pcl_unpaid", label: "PCL não pago", type: "number" },
      { name: "credit_total", label: "Crédito total", type: "number" },
      { name: "credit_paid", label: "Crédito pago", type: "number" },
      { name: "credit_unpaid", label: "Crédito não pago", type: "number" },
      { name: "reference_month", label: "Mês referência", type: "date", required: true },
    ],
    columns: [
      { key: "adm_id", label: "ADM", format: "lookup" },
      { key: "team_id", label: "Equipe", format: "lookup" },
      { key: "installment_group", label: "Parcela" },
      { key: "pcl_total", label: "PCL total" },
      { key: "pcl_paid", label: "PCL pago" },
      { key: "pcl_unpaid", label: "PCL não pago" },
      { key: "credit_total", label: "Crédito total", format: "money" },
      { key: "credit_paid", label: "Crédito pago", format: "money" },
      { key: "credit_unpaid", label: "Crédito não pago", format: "money" },
    ],
  },
  nac_general_expenses: {
    key: "nac_general_expenses",
    title: "Despesas gerais",
    description: "Aporte, retirada, despesas operacionais, marketing, comissão e outros.",
    fields: [
      { name: "expense_type", label: "Tipo", type: "select", options: staticOptions.expenseType, required: true },
      { name: "amount", label: "Valor", type: "number", required: true },
      { name: "expense_date", label: "Data", type: "date" },
      { name: "withdrawal", label: "Retirada?", type: "checkbox" },
      { name: "responsible", label: "Responsável", type: "text" },
      { name: "description", label: "Descrição", type: "textarea", colSpan: 3 },
    ],
    columns: [
      { key: "expense_type", label: "Tipo" },
      { key: "amount", label: "Valor", format: "money" },
      { key: "expense_date", label: "Data", format: "date" },
      { key: "withdrawal", label: "Retirada", format: "bool" },
      { key: "responsible", label: "Responsável" },
    ],
  },
  nac_simpala_entries: {
    key: "nac_simpala_entries",
    title: "Simpala - Lançamentos",
    description: "Adesões, primeira quinzena, recebimento geral, P2, P3-P5, P6, antecipações, não pago e canceladas.",
    fields: [
      { name: "section", label: "Seção", type: "select", options: staticOptions.simpalaSection, required: true },
      { name: "bucket", label: "Grupo", type: "select", options: staticOptions.simpalaBucket, required: true },
      { name: "credit_value", label: "Crédito", type: "number" },
      { name: "commission_or_reversal", label: "Comissão / Estorno", type: "number" },
      { name: "extra_value", label: "Valor extra", type: "number" },
      { name: "reference_month", label: "Mês referência", type: "date" },
      { name: "notes", label: "Observações", type: "textarea", colSpan: 3 },
    ],
    columns: [
      { key: "section", label: "Seção" },
      { key: "bucket", label: "Grupo" },
      { key: "credit_value", label: "Crédito", format: "money" },
      { key: "commission_or_reversal", label: "Comissão/Estorno", format: "money" },
      { key: "extra_value", label: "Valor extra", format: "money" },
      { key: "reference_month", label: "Mês", format: "date" },
    ],
  },
  nac_simpala_balances: {
    key: "nac_simpala_balances",
    title: "Simpala - Balanço",
    description: "Estorno, recebimento, balanço, saldo e saldo final.",
    fields: [
      { name: "reference_month", label: "Mês referência", type: "date", required: true },
      { name: "reversal_value", label: "Estorno", type: "number" },
      { name: "receipt_value", label: "Recebimento", type: "number" },
      { name: "balance_value", label: "Balanço", type: "number" },
      { name: "final_balance", label: "Saldo final", type: "number" },
    ],
    columns: [
      { key: "reference_month", label: "Mês", format: "date" },
      { key: "reversal_value", label: "Estorno", format: "money" },
      { key: "receipt_value", label: "Recebimento", format: "money" },
      { key: "balance_value", label: "Balanço", format: "money" },
      { key: "final_balance", label: "Saldo final", format: "money" },
    ],
  },
};

const emptyByTable: Record<TableKey, AnyRow> = {
  nac_teams: { code: "", name: "", active: true },
  nac_supervisors: { name: "", team_id: "", commission_percent: "", active: true },
  nac_sellers: { name: "", team_id: "", supervisor_id: "", commission_percent: "", active: true },
  nac_adms: { name: "", active: true },
  nac_pdv: { name: "", active: true },
  nac_goals: { scope: "GERAL", team_id: "", reference_month: currentMonthISO(), week_number: "", target_quotas: "", target_credit: "", notes: "" },
  nac_sales: { team_id: "", seller_id: "", supervisor_id: "", client_name: "", cpf_cnpj: "", credit_value: "", sale_date: todayISO(), situation: "PENDENTE", payment_method: "", pdv_id: "", adm_checked: "", adm_observation: "" },
  nac_client_installments: { record_type: "CLIENTE", adm_id: "", installment_label: "", status: "PENDENTE", cpf_cnpj: "", contract_number: "", group_code: "", client_name: "", phone: "", credit_value: "", due_date: "", assembly_date: "", seller_id: "", manager_name: "", payment_date: "" },
  nac_pcl_records: { adm_id: "", team_id: "", installment_group: "PARCELA 02", pcl_total: "", pcl_paid: "", pcl_unpaid: "", credit_total: "", credit_paid: "", credit_unpaid: "", reference_month: currentMonthISO() },
  nac_general_expenses: { expense_type: "OPERACIONAL", amount: "", expense_date: todayISO(), withdrawal: false, description: "", responsible: "" },
  nac_simpala_entries: { section: "ADESOES", bucket: "P2", credit_value: "", commission_or_reversal: "", extra_value: "", reference_month: currentMonthISO(), notes: "" },
  nac_simpala_balances: { reference_month: currentMonthISO(), reversal_value: "", receipt_value: "", balance_value: "", final_balance: "" },
};

const numberFields = new Set(["credit_value", "commission_percent", "target_quotas", "target_credit", "week_number", "pcl_total", "pcl_paid", "pcl_unpaid", "credit_total", "credit_paid", "credit_unpaid", "amount", "commission_or_reversal", "extra_value", "reversal_value", "receipt_value", "balance_value", "final_balance"]);
const boolFields = new Set(["active", "withdrawal"]);

export default function NacFinancialFullPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("visao");
  const [activeRegister, setActiveRegister] = useState<TableKey>("nac_teams");
  const [monthFilter, setMonthFilter] = useState(() => todayISO().slice(0, 7));
  const [query, setQuery] = useState("");

  const [rows, setRows] = useState<Record<TableKey, AnyRow[]>>({
    nac_teams: [],
    nac_supervisors: [],
    nac_sellers: [],
    nac_adms: [],
    nac_pdv: [],
    nac_goals: [],
    nac_sales: [],
    nac_client_installments: [],
    nac_pcl_records: [],
    nac_general_expenses: [],
    nac_simpala_entries: [],
    nac_simpala_balances: [],
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState("");
  const [pageSuccess, setPageSuccess] = useState("");

  const [modalTable, setModalTable] = useState<TableKey | null>(null);
  const [modalForm, setModalForm] = useState<AnyRow>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    setPageError("");

    try {
      const tableKeys = Object.keys(tableConfigs) as TableKey[];
      const results = await Promise.all(
        tableKeys.map((table) =>
          supabase.from(table).select("*").order("created_at", { ascending: false })
        )
      );

      const next = { ...rows };

      results.forEach((result, index) => {
        if (result.error) throw result.error;
        next[tableKeys[index]] = result.data || [];
      });

      setRows(next);
    } catch (error: any) {
      console.error("[NAC] erro ao carregar:", error);
      setPageError(error?.message || "Não foi possível carregar os dados. Confira as tabelas no Supabase.");
    } finally {
      setLoading(false);
    }
  }

  const lookupMaps = useMemo(() => {
    const makeMap = (table: TableKey) =>
      rows[table].reduce<Record<string, string>>((acc, row) => {
        acc[row.id] = row.name || row.code || row.client_name || row.id;
        return acc;
      }, {});

    return {
      teams: makeMap("nac_teams"),
      sellers: makeMap("nac_sellers"),
      supervisors: makeMap("nac_supervisors"),
      adms: makeMap("nac_adms"),
      pdvs: makeMap("nac_pdv"),
    };
  }, [rows]);

  const dynamicOptions = useMemo(() => {
    const toOptions = (table: TableKey, labelKey = "name") =>
      rows[table]
        .filter((row) => row.active !== false)
        .map((row) => ({
          value: row.id,
          label: row[labelKey] || row.name || row.code || row.id,
        }));

    return {
      teams: toOptions("nac_teams", "name"),
      sellers: toOptions("nac_sellers", "name"),
      supervisors: toOptions("nac_supervisors", "name"),
      adms: toOptions("nac_adms", "name"),
      pdvs: toOptions("nac_pdv", "name"),
    };
  }, [rows]);

  const monthSales = useMemo(() => rows.nac_sales.filter((row) => !monthFilter || monthOf(row.sale_date) === monthFilter), [rows.nac_sales, monthFilter]);
  const monthInstallments = useMemo(() => rows.nac_client_installments.filter((row) => !monthFilter || monthOf(row.due_date || row.payment_date || row.created_at) === monthFilter), [rows.nac_client_installments, monthFilter]);
  const monthPcl = useMemo(() => rows.nac_pcl_records.filter((row) => !monthFilter || monthOf(row.reference_month) === monthFilter), [rows.nac_pcl_records, monthFilter]);
  const monthExpenses = useMemo(() => rows.nac_general_expenses.filter((row) => !monthFilter || monthOf(row.expense_date) === monthFilter), [rows.nac_general_expenses, monthFilter]);
  const monthSimpalaEntries = useMemo(() => rows.nac_simpala_entries.filter((row) => !monthFilter || monthOf(row.reference_month) === monthFilter), [rows.nac_simpala_entries, monthFilter]);
  const monthSimpalaBalances = useMemo(() => rows.nac_simpala_balances.filter((row) => !monthFilter || monthOf(row.reference_month) === monthFilter), [rows.nac_simpala_balances, monthFilter]);

  const salesCredit = sum(monthSales, "credit_value");
  const salesQuotas = monthSales.length;
  const salesTicket = salesQuotas ? salesCredit / salesQuotas : 0;

  const goalsThisMonth = rows.nac_goals.filter((row) => !monthFilter || monthOf(row.reference_month) === monthFilter);
  const goalCredit = sum(goalsThisMonth, "target_credit");
  const goalQuotas = sum(goalsThisMonth, "target_quotas");

  const openCredit = sum(monthInstallments.filter((r) => r.status !== "PAGO"), "credit_value");
  const paidCredit = sum(monthInstallments.filter((r) => r.status === "PAGO"), "credit_value");
  const expensesTotal = sum(monthExpenses, "amount");
  const pclTotal = sum(monthPcl, "pcl_total");
  const pclPaid = sum(monthPcl, "pcl_paid");
  const pclUnpaid = sum(monthPcl, "pcl_unpaid");

  const salesByTeam = useMemo(() => {
    const withNames = monthSales.map((row) => ({ ...row, teamName: lookupMaps.teams[row.team_id] || "Não informado" }));
    const grouped = groupSum(withNames, "teamName", "credit_value");

    return Object.entries(grouped)
      .map(([label, value]) => ({
        label,
        value,
        quotas: withNames.filter((row) => row.teamName === label).length,
      }))
      .sort((a, b) => b.value - a.value);
  }, [monthSales, lookupMaps.teams]);

  const salesBySeller = useMemo(() => {
    const withNames = monthSales.map((row) => ({ ...row, sellerName: lookupMaps.sellers[row.seller_id] || "Não informado" }));
    const grouped = groupSum(withNames, "sellerName", "credit_value");

    return Object.entries(grouped)
      .map(([label, value]) => ({
        label,
        value,
        quotas: withNames.filter((row) => row.sellerName === label).length,
      }))
      .sort((a, b) => b.value - a.value);
  }, [monthSales, lookupMaps.sellers]);

  const filteredTableRows = (table: TableKey, baseRows?: AnyRow[]) => {
    const search = normalize(query);
    const source = baseRows || rows[table];
    if (!search) return source;
    return source.filter((row) => normalize(Object.values(row).join(" ")).includes(search));
  };

  function openCreate(table: TableKey) {
    setModalTable(table);
    setEditingId(null);
    setModalForm({ ...emptyByTable[table] });
    setPageError("");
    setPageSuccess("");
  }

  function openEdit(table: TableKey, row: AnyRow) {
    setModalTable(table);
    setEditingId(row.id);
    setModalForm({ ...row });
    setPageError("");
    setPageSuccess("");
  }

  function closeModal() {
    setModalTable(null);
    setEditingId(null);
    setModalForm({});
  }

  function serializePayload(table: TableKey, form: AnyRow) {
    const config = tableConfigs[table];
    const payload: AnyRow = {};

    config.fields.forEach((field) => {
      const raw = form[field.name];

      if (numberFields.has(field.name)) {
        payload[field.name] = parseNumber(raw);
      } else if (boolFields.has(field.name)) {
        payload[field.name] = Boolean(raw);
      } else if (field.type === "date") {
        payload[field.name] = raw || null;
      } else if (field.type === "select" && field.dynamicOptions) {
        payload[field.name] = raw || null;
      } else {
        payload[field.name] = raw ?? "";
      }
    });

    return payload;
  }

  async function saveModal(event: FormEvent) {
    event.preventDefault();
    if (!modalTable) return;

    const config = tableConfigs[modalTable];

    for (const field of config.fields) {
      if (field.required && !String(modalForm[field.name] || "").trim()) {
        setPageError(`Preencha o campo obrigatório: ${field.label}`);
        return;
      }
    }

    setSaving(true);
    setPageError("");
    setPageSuccess("");

    try {
      const payload = serializePayload(modalTable, modalForm);

      if (editingId) {
        const { error } = await supabase.from(modalTable).update(payload).eq("id", editingId);
        if (error) throw error;
        setPageSuccess(`${config.title} atualizado com sucesso.`);
      } else {
        const { error } = await supabase.from(modalTable).insert(payload);
        if (error) throw error;
        setPageSuccess(`${config.title} cadastrado com sucesso.`);
      }

      closeModal();
      await loadAll();
    } catch (error: any) {
      console.error("[NAC] erro ao salvar:", error);
      setPageError(error?.message || `Erro ao salvar em ${config.title}.`);
    } finally {
      setSaving(false);
    }
  }

  async function removeRow(table: TableKey, id: string) {
    const ok = confirm("Deseja excluir este registro?");
    if (!ok) return;

    setPageError("");
    setPageSuccess("");

    try {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
      setPageSuccess("Registro excluído com sucesso.");
      await loadAll();
    } catch (error: any) {
      console.error("[NAC] erro ao excluir:", error);
      setPageError(error?.message || "Erro ao excluir registro.");
    }
  }

  function formatCell(row: AnyRow, column: TableConfig["columns"][number]) {
    const value = row[column.key];

    if (column.format === "money") return money(value);
    if (column.format === "date") return dateBR(value);
    if (column.format === "bool") return value ? "Sim" : "Não";

    if (column.format === "lookup") {
      if (column.key.includes("team")) return lookupMaps.teams[value] || "-";
      if (column.key.includes("seller")) return lookupMaps.sellers[value] || "-";
      if (column.key.includes("supervisor")) return lookupMaps.supervisors[value] || "-";
      if (column.key.includes("adm")) return lookupMaps.adms[value] || "-";
      if (column.key.includes("pdv")) return lookupMaps.pdvs[value] || "-";
    }

    return value || "-";
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1500px] px-4 py-7 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-500">
                <FileSpreadsheet size={14} />
                Sistema completo baseado na planilha
              </div>

              <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950">
                NAC Operacional
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                Produção, clientes, antecipações, PCL/ADM, equipes, vendedores, supervisores, PDVs, Simpala, despesas gerais e relatórios.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="month"
                value={monthFilter}
                onChange={(event) => setMonthFilter(event.target.value)}
                className={inputClass}
              />

              <button
                onClick={loadAll}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 transition hover:border-slate-300 hover:text-slate-950"
              >
                <RefreshCcw size={15} />
                Atualizar
              </button>
            </div>
          </div>

          <div className="mt-7 flex gap-2 overflow-x-auto pb-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.key;

              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={[
                    "inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border px-3 text-xs font-bold transition",
                    active
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-950",
                  ].join(" ")}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-4 py-7 sm:px-6 lg:px-8">
        {pageError ? (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {pageError}
          </div>
        ) : null}

        {pageSuccess ? (
          <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
            {pageSuccess}
          </div>
        ) : null}

        {loading ? (
          <div className="mb-5 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-500 shadow-sm">
            Carregando dados da operação...
          </div>
        ) : null}

        <div className="mb-5">
          <Panel className="p-4">
            <div className="flex items-center gap-3">
              <Search size={17} className="text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por cliente, CPF, vendedor, equipe, contrato, ADM, PDV..."
                className="w-full border-none bg-transparent text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
              />
            </div>
          </Panel>
        </div>

        {activeTab === "visao" && (
          <div className="space-y-6">
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard title="Crédito vendido" value={money(salesCredit)} subtitle={`${salesQuotas} cotas no período`} />
              <MetricCard title="Meta de crédito" value={money(goalCredit)} subtitle={`Meta de ${numberBR(goalQuotas)} cotas`} />
              <MetricCard title="Ticket médio" value={money(salesTicket)} subtitle="Crédito / cotas" />
              <MetricCard title="Falta para meta" value={money(Math.max(goalCredit - salesCredit, 0))} subtitle="Considerando o mês filtrado" />
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <Panel className="p-5 xl:col-span-2">
                <h2 className="text-lg font-black text-slate-950">Produção por equipe</h2>
                <p className="mt-1 text-sm text-slate-500">Equipes com crédito, cotas e ticket no período.</p>
                <div className="mt-5 space-y-3">
                  {salesByTeam.length ? salesByTeam.map((item) => (
                    <ProgressRow key={item.label} label={`${item.label} • ${item.quotas} cotas`} value={item.value} max={Math.max(...salesByTeam.map((i) => i.value), 1)} />
                  )) : <EmptyText text="Nenhuma produção cadastrada no período." />}
                </div>
              </Panel>

              <Panel className="p-5">
                <h2 className="text-lg font-black text-slate-950">Resumo financeiro</h2>
                <div className="mt-5 space-y-4">
                  <Line label="Crédito pago" value={money(paidCredit)} />
                  <Line label="Crédito em aberto" value={money(openCredit)} />
                  <Line label="PCL total" value={numberBR(pclTotal)} />
                  <Line label="PCL pago" value={numberBR(pclPaid)} />
                  <Line label="PCL não pago" value={numberBR(pclUnpaid)} />
                  <Line label="Despesas gerais" value={money(expensesTotal)} strong />
                </div>
              </Panel>
            </section>
          </div>
        )}

        {activeTab === "producao" && <CrudSection table="nac_sales" rows={filteredTableRows("nac_sales", monthSales)} onCreate={openCreate} onEdit={openEdit} onDelete={removeRow} formatCell={formatCell} />}

        {activeTab === "clientes" && (
          <CrudSection table="nac_client_installments" rows={filteredTableRows("nac_client_installments", monthInstallments.filter((row) => row.record_type !== "ANTECIPACAO"))} onCreate={openCreate} onEdit={openEdit} onDelete={removeRow} formatCell={formatCell} />
        )}

        {activeTab === "antecipacoes" && (
          <CrudSection
            table="nac_client_installments"
            rows={filteredTableRows("nac_client_installments", monthInstallments.filter((row) => row.record_type === "ANTECIPACAO"))}
            onCreate={(table) => {
              openCreate(table);
              setModalForm((current) => ({ ...current, record_type: "ANTECIPACAO" }));
            }}
            onEdit={openEdit}
            onDelete={removeRow}
            formatCell={formatCell}
          />
        )}

        {activeTab === "pcl" && <CrudSection table="nac_pcl_records" rows={filteredTableRows("nac_pcl_records", monthPcl)} onCreate={openCreate} onEdit={openEdit} onDelete={removeRow} formatCell={formatCell} />}

        {activeTab === "equipes" && (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Panel className="p-5">
              <h2 className="text-lg font-black text-slate-950">Ranking por equipe</h2>
              <div className="mt-5 space-y-4">
                {salesByTeam.length ? salesByTeam.map((item) => (
                  <ProgressRow key={item.label} label={`${item.label} • ${item.quotas} cotas`} value={item.value} max={Math.max(...salesByTeam.map((i) => i.value), 1)} />
                )) : <EmptyText text="Nenhuma equipe com produção no período." />}
              </div>
            </Panel>

            <Panel className="p-5">
              <h2 className="text-lg font-black text-slate-950">Ranking por vendedor</h2>
              <div className="mt-5 space-y-4">
                {salesBySeller.length ? salesBySeller.map((item) => (
                  <ProgressRow key={item.label} label={`${item.label} • ${item.quotas} cotas`} value={item.value} max={Math.max(...salesBySeller.map((i) => i.value), 1)} />
                )) : <EmptyText text="Nenhum vendedor com produção no período." />}
              </div>
            </Panel>

            <CrudSection table="nac_goals" rows={filteredTableRows("nac_goals")} onCreate={openCreate} onEdit={openEdit} onDelete={removeRow} formatCell={formatCell} embedded />
          </div>
        )}

        {activeTab === "cadastros" && (
          <div className="space-y-5">
            <Panel className="p-2">
              <div className="flex gap-2 overflow-x-auto">
                {(["nac_teams", "nac_sellers", "nac_supervisors", "nac_adms", "nac_pdv"] as TableKey[]).map((table) => (
                  <button
                    key={table}
                    onClick={() => setActiveRegister(table)}
                    className={[
                      "h-9 shrink-0 rounded-xl px-3 text-xs font-bold transition",
                      activeRegister === table
                        ? "bg-slate-950 text-white"
                        : "bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                    ].join(" ")}
                  >
                    {tableConfigs[table].title}
                  </button>
                ))}
              </div>
            </Panel>

            <CrudSection table={activeRegister} rows={filteredTableRows(activeRegister)} onCreate={openCreate} onEdit={openEdit} onDelete={removeRow} formatCell={formatCell} />
          </div>
        )}

        {activeTab === "simpala" && (
          <div className="space-y-6">
            <CrudSection table="nac_simpala_entries" rows={filteredTableRows("nac_simpala_entries", monthSimpalaEntries)} onCreate={openCreate} onEdit={openEdit} onDelete={removeRow} formatCell={formatCell} />
            <CrudSection table="nac_simpala_balances" rows={filteredTableRows("nac_simpala_balances", monthSimpalaBalances)} onCreate={openCreate} onEdit={openEdit} onDelete={removeRow} formatCell={formatCell} />
          </div>
        )}

        {activeTab === "despesas" && <CrudSection table="nac_general_expenses" rows={filteredTableRows("nac_general_expenses", monthExpenses)} onCreate={openCreate} onEdit={openEdit} onDelete={removeRow} formatCell={formatCell} />}

        {activeTab === "relatorios" && (
          <div className="space-y-6">
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard title="Produção" value={money(salesCredit)} subtitle={`${salesQuotas} cotas`} />
              <MetricCard title="Pago" value={money(paidCredit)} subtitle="Crédito pago em clientes/parcelas" />
              <MetricCard title="Em aberto" value={money(openCredit)} subtitle="Crédito não pago" />
              <MetricCard title="Despesas" value={money(expensesTotal)} subtitle="Saídas gerais" />
            </section>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <Panel className="p-5">
                <h2 className="text-lg font-black text-slate-950">Status de clientes/parcelas</h2>
                <SimpleReport rows={Object.entries(groupSum(monthInstallments, "status", "credit_value")).map(([label, value]) => ({ label, value }))} />
              </Panel>

              <Panel className="p-5">
                <h2 className="text-lg font-black text-slate-950">Simpala por grupo</h2>
                <SimpleReport rows={Object.entries(groupSum(monthSimpalaEntries, "bucket", "credit_value")).map(([label, value]) => ({ label, value }))} />
              </Panel>

              <Panel className="p-5">
                <h2 className="text-lg font-black text-slate-950">PCL por parcela</h2>
                <SimpleReport rows={Object.entries(groupSum(monthPcl, "installment_group", "pcl_total")).map(([label, value]) => ({ label, value, number: true }))} />
              </Panel>

              <Panel className="p-5">
                <h2 className="text-lg font-black text-slate-950">Despesas por tipo</h2>
                <SimpleReport rows={Object.entries(groupSum(monthExpenses, "expense_type", "amount")).map(([label, value]) => ({ label, value }))} />
              </Panel>
            </div>
          </div>
        )}
      </main>

      {modalTable ? (
        <Modal title={editingId ? `Editar ${tableConfigs[modalTable].title}` : `Novo cadastro - ${tableConfigs[modalTable].title}`} onClose={closeModal}>
          <form onSubmit={saveModal}>
            <div className="grid max-h-[70vh] grid-cols-1 gap-4 overflow-y-auto p-5 md:grid-cols-3">
              {tableConfigs[modalTable].fields.map((field) => (
                <div key={field.name} className={field.colSpan === 3 ? "md:col-span-3" : field.colSpan === 2 ? "md:col-span-2" : ""}>
                  <Field label={`${field.label}${field.required ? " *" : ""}`}>
                    <RenderInput field={field} value={modalForm[field.name]} dynamicOptions={dynamicOptions} onChange={(value) => setModalForm((current) => ({ ...current, [field.name]: value }))} />
                  </Field>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 p-5">
              <button type="button" onClick={closeModal} className="h-10 rounded-xl border border-slate-200 px-4 text-xs font-bold text-slate-600">
                Cancelar
              </button>

              <button type="submit" disabled={saving} className="h-10 rounded-xl bg-slate-950 px-4 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-60">
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}

function RenderInput({ field, value, dynamicOptions, onChange }: { field: FieldConfig; value: any; dynamicOptions: Record<string, { value: string; label: string }[]>; onChange: (value: any) => void }) {
  if (field.type === "textarea") {
    return <textarea className={textareaClass} value={value || ""} placeholder={field.placeholder} onChange={(event) => onChange(event.target.value)} />;
  }

  if (field.type === "select") {
    const options = field.dynamicOptions ? dynamicOptions[field.dynamicOptions] || [] : field.options || [];

    return (
      <select className={inputClass} value={value || ""} onChange={(event) => onChange(event.target.value)}>
        <option value="">Selecione</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    );
  }

  if (field.type === "checkbox") {
    return (
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={[
          "inline-flex h-10 w-full items-center justify-between rounded-xl border px-3 text-sm font-bold",
          value ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-500",
        ].join(" ")}
      >
        <span>{value ? "Sim" : "Não"}</span>
        <span className="h-5 w-5 rounded-full border border-current" />
      </button>
    );
  }

  return <input className={inputClass} type={field.type === "number" ? "text" : field.type} value={value || ""} placeholder={field.placeholder} onChange={(event) => onChange(event.target.value)} />;
}

function CrudSection({ table, rows, embedded, onCreate, onEdit, onDelete, formatCell }: { table: TableKey; rows: AnyRow[]; embedded?: boolean; onCreate: (table: TableKey) => void; onEdit: (table: TableKey, row: AnyRow) => void; onDelete: (table: TableKey, id: string) => void; formatCell: (row: AnyRow, column: TableConfig["columns"][number]) => any }) {
  const config = tableConfigs[table];

  return (
    <Panel className={embedded ? "xl:col-span-2" : ""}>
      <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-950">{config.title}</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">{config.description}</p>
        </div>

        <button onClick={() => onCreate(table)} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-xs font-black text-white">
          <Plus size={14} />
          Novo
        </button>
      </div>

      <DataTable rows={rows} config={config} onEdit={(row) => onEdit(table, row)} onDelete={(id) => onDelete(table, id)} formatCell={formatCell} />
    </Panel>
  );
}

function DataTable({ rows, config, onEdit, onDelete, formatCell }: { rows: AnyRow[]; config: TableConfig; onEdit: (row: AnyRow) => void; onDelete: (id: string) => void; formatCell: (row: AnyRow, column: TableConfig["columns"][number]) => any }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] text-left">
        <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-400">
          <tr>
            {config.columns.map((column) => <th key={column.key} className="px-5 py-3">{column.label}</th>)}
            <th className="px-5 py-3 text-right">Ações</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {rows.length ? (
            rows.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50">
                {config.columns.map((column) => (
                  <td key={column.key} className="max-w-[260px] truncate px-5 py-4 text-sm text-slate-600">{formatCell(row, column)}</td>
                ))}
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => onEdit(row)} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50" title="Editar">
                      <Pencil size={14} />
                    </button>

                    <button onClick={() => onDelete(row.id)} className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50" title="Excluir">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={config.columns.length + 1} className="px-5 py-12 text-center text-sm text-slate-400">
                Nenhum registro encontrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function MetricCard({ title, value, subtitle }: { title: string; value: string; subtitle: string }) {
  return (
    <Panel className="p-5">
      <p className="text-xs font-bold text-slate-500">{title}</p>
      <p className="mt-2 truncate text-2xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
    </Panel>
  );
}

function ProgressRow({ label, value, max }: { label: string; value: number; max: number }) {
  const width = max > 0 ? Math.max(4, Math.min(100, (value / max) * 100)) : 0;

  return (
    <div>
      <div className="mb-1 flex justify-between gap-3 text-sm">
        <span className="truncate font-bold text-slate-700">{label}</span>
        <span className="shrink-0 font-bold text-slate-950">{money(value)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-slate-950" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function SimpleReport({ rows }: { rows: { label: string; value: number; number?: boolean }[] }) {
  return (
    <div className="mt-5 overflow-x-auto">
      <table className="w-full min-w-[480px] text-left">
        <thead className="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-400">
          <tr>
            <th className="py-3">Indicador</th>
            <th className="py-3 text-right">Valor</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length ? rows.map((row) => (
            <tr key={row.label}>
              <td className="py-3 text-sm font-bold text-slate-700">{row.label || "Não informado"}</td>
              <td className="py-3 text-right text-sm font-black text-slate-950">{row.number ? numberBR(row.value) : money(row.value)}</td>
            </tr>
          )) : (
            <tr>
              <td colSpan={2} className="py-10 text-center text-sm text-slate-400">Sem dados para este relatório.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function EmptyText({ text }: { text: string }) {
  return <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-sm font-semibold text-slate-400">{text}</div>;
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={strong ? "font-black text-slate-950" : "text-slate-500"}>{label}</span>
      <span className={strong ? "font-black text-slate-950" : "font-bold text-slate-800"}>{value}</span>
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <h3 className="truncate text-xl font-black text-slate-950">{title}</h3>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-950">
            <X size={17} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const inputClass =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/5";

const textareaClass =
  "min-h-24 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/5";
