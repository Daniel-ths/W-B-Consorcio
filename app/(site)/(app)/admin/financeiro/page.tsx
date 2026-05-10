"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import {
  AlertTriangle,
  Check,
  ClipboardList,
  FileSpreadsheet,
  Pencil,
  PieChart,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";

type FinanceType =
  | "RECEBIVEL"
  | "ANTECIPACAO"
  | "ADM"
  | "PCL"
  | "COMISSAO"
  | "OUTRO";

type FinanceStatus =
  | "PAGO"
  | "A_VENCER"
  | "VENCE_HOJE"
  | "ATRASADO"
  | "PENDENTE"
  | "CANCELADO"
  | "ANTECIPADO";

type ExpenseStatus = "PAGO" | "PENDENTE";

type FinanceRecord = {
  id: string;
  type: FinanceType;
  status: FinanceStatus;

  clientName: string;
  cpfCnpj: string;
  phone: string;

  contractNumber: string;
  groupCode: string;
  creditValue: number;

  installmentLabel: string;
  installmentNumber: string;
  dueDate: string;
  paymentDate: string;

  amount: number;
  paidAmount: number;

  sellerName: string;
  teamName: string;
  admName: string;
  supervisorName: string;

  pdv: string;
  paymentMethod: string;
  administrativeStatus: string;
  admCheck: string;

  notes: string;
  createdAt: string;
  updatedAt: string;
};

type ExpenseRecord = {
  id: string;
  category: string;
  description: string;
  value: number;
  date: string;
  responsible: string;
  status: ExpenseStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

type TabKey =
  | "hoje"
  | "lancamentos"
  | "clientes"
  | "antecipacoes"
  | "adm"
  | "equipes"
  | "despesas"
  | "fechamento"
  | "relatorios";

const todayISO = () => new Date().toISOString().slice(0, 10);

const tabs: { key: TabKey; label: string }[] = [
  { key: "hoje", label: "Hoje" },
  { key: "lancamentos", label: "Lançamentos" },
  { key: "clientes", label: "Clientes" },
  { key: "antecipacoes", label: "Antecipações" },
  { key: "adm", label: "ADM / PCL" },
  { key: "equipes", label: "Equipes" },
  { key: "despesas", label: "Despesas" },
  { key: "fechamento", label: "Fechamento" },
  { key: "relatorios", label: "Relatórios" },
];

const emptyFinanceForm = {
  type: "RECEBIVEL" as FinanceType,
  status: "A_VENCER" as FinanceStatus,
  clientName: "",
  cpfCnpj: "",
  phone: "",
  contractNumber: "",
  groupCode: "",
  creditValue: "",
  installmentLabel: "",
  installmentNumber: "",
  dueDate: "",
  paymentDate: "",
  amount: "",
  paidAmount: "",
  sellerName: "",
  teamName: "",
  admName: "",
  supervisorName: "",
  pdv: "",
  paymentMethod: "PIX",
  administrativeStatus: "",
  admCheck: "",
  notes: "",
};

const emptyExpenseForm = {
  category: "Operacional",
  description: "",
  value: "",
  date: todayISO(),
  responsible: "",
  status: "PENDENTE" as ExpenseStatus,
  notes: "",
};

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(value) ? value : 0);
}

function dateBR(date?: string) {
  if (!date) return "-";

  const [y, m, d] = date.split("-");
  if (!y || !m || !d) return "-";

  return `${d}/${m}/${y}`;
}

function parseNumber(value: string | number) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;

  const normalized = String(value || "")
    .replace(/R\$/g, "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function statusLabel(status: FinanceStatus | ExpenseStatus) {
  const labels: Record<string, string> = {
    PAGO: "Pago",
    A_VENCER: "A vencer",
    VENCE_HOJE: "Vence hoje",
    ATRASADO: "Atrasado",
    PENDENTE: "Pendente",
    CANCELADO: "Cancelado",
    ANTECIPADO: "Antecipado",
  };

  return labels[status] || status;
}

function typeLabel(type: FinanceType) {
  const labels: Record<FinanceType, string> = {
    RECEBIVEL: "Recebível",
    ANTECIPACAO: "Antecipação",
    ADM: "ADM",
    PCL: "PCL",
    COMISSAO: "Comissão",
    OUTRO: "Outro",
  };

  return labels[type];
}

function statusClass(status: FinanceStatus | ExpenseStatus) {
  const classes: Record<string, string> = {
    PAGO: "border-emerald-200 bg-emerald-50 text-emerald-700",
    A_VENCER: "border-amber-200 bg-amber-50 text-amber-700",
    VENCE_HOJE: "border-blue-200 bg-blue-50 text-blue-700",
    ATRASADO: "border-red-200 bg-red-50 text-red-700",
    PENDENTE: "border-slate-200 bg-slate-100 text-slate-700",
    CANCELADO: "border-slate-200 bg-slate-100 text-slate-500",
    ANTECIPADO: "border-violet-200 bg-violet-50 text-violet-700",
  };

  return classes[status] || classes.PENDENTE;
}

function sum<T>(rows: T[], getter: (row: T) => number) {
  return rows.reduce((acc, row) => acc + getter(row), 0);
}

function groupSum<T>(
  rows: T[],
  keyGetter: (row: T) => string,
  valueGetter: (row: T) => number
) {
  return rows.reduce<Record<string, number>>((acc, row) => {
    const key = keyGetter(row) || "Não informado";
    acc[key] = (acc[key] || 0) + valueGetter(row);
    return acc;
  }, {});
}

function dbToFinanceRecord(row: any): FinanceRecord {
  return {
    id: row.id,
    type: row.type,
    status: row.status,

    clientName: row.client_name || "",
    cpfCnpj: row.cpf_cnpj || "",
    phone: row.phone || "",

    contractNumber: row.contract_number || "",
    groupCode: row.group_code || "",
    creditValue: Number(row.credit_value || 0),

    installmentLabel: row.installment_label || "",
    installmentNumber: row.installment_number || "",
    dueDate: row.due_date || "",
    paymentDate: row.payment_date || "",

    amount: Number(row.amount || 0),
    paidAmount: Number(row.paid_amount || 0),

    sellerName: row.seller_name || "",
    teamName: row.team_name || "",
    admName: row.adm_name || "",
    supervisorName: row.supervisor_name || "",

    pdv: row.pdv || "",
    paymentMethod: row.payment_method || "",
    administrativeStatus: row.administrative_status || "",
    admCheck: row.adm_check || "",

    notes: row.notes || "",
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || "",
  };
}

function financeRecordToDb(
  record: Omit<FinanceRecord, "id" | "createdAt" | "updatedAt">
) {
  return {
    type: record.type,
    status: record.status,

    client_name: record.clientName,
    cpf_cnpj: record.cpfCnpj,
    phone: record.phone,

    contract_number: record.contractNumber,
    group_code: record.groupCode,
    credit_value: record.creditValue,

    installment_label: record.installmentLabel,
    installment_number: record.installmentNumber,
    due_date: record.dueDate || null,
    payment_date: record.paymentDate || null,

    amount: record.amount,
    paid_amount: record.paidAmount,

    seller_name: record.sellerName,
    team_name: record.teamName,
    adm_name: record.admName,
    supervisor_name: record.supervisorName,

    pdv: record.pdv,
    payment_method: record.paymentMethod,
    administrative_status: record.administrativeStatus,
    adm_check: record.admCheck,

    notes: record.notes,
  };
}

function dbToExpenseRecord(row: any): ExpenseRecord {
  return {
    id: row.id,
    category: row.category || "Operacional",
    description: row.description || "",
    value: Number(row.value || 0),
    date: row.date || "",
    responsible: row.responsible || "",
    status: row.status || "PENDENTE",
    notes: row.notes || "",
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || "",
  };
}

function expenseRecordToDb(
  record: Omit<ExpenseRecord, "id" | "createdAt" | "updatedAt">
) {
  return {
    category: record.category,
    description: record.description,
    value: record.value,
    date: record.date || null,
    responsible: record.responsible,
    status: record.status,
    notes: record.notes,
  };
}

function Badge({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${className}`}
    >
      {children}
    </span>
  );
}

function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/5";

const textareaClass =
  "min-h-24 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/5";

export default function FinanceiroPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("hoje");
  const [financeRows, setFinanceRows] = useState<FinanceRecord[]>([]);
  const [expenseRows, setExpenseRows] = useState<ExpenseRecord[]>([]);

  const [query, setQuery] = useState("");
  const [monthFilter, setMonthFilter] = useState(() => todayISO().slice(0, 7));
  const [statusFilter, setStatusFilter] = useState("TODOS");
  const [typeFilter, setTypeFilter] = useState("TODOS");
  const [teamFilter, setTeamFilter] = useState("TODOS");
  const [admFilter, setAdmFilter] = useState("TODOS");

  const [financeModal, setFinanceModal] = useState(false);
  const [expenseModal, setExpenseModal] = useState(false);
  const [selected, setSelected] = useState<FinanceRecord | null>(null);
  const [editingFinanceId, setEditingFinanceId] = useState<string | null>(null);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);

  const [financeForm, setFinanceForm] = useState(emptyFinanceForm);
  const [expenseForm, setExpenseForm] = useState(emptyExpenseForm);

  const [loadingData, setLoadingData] = useState(true);
  const [savingFinance, setSavingFinance] = useState(false);
  const [savingExpense, setSavingExpense] = useState(false);
  const [pageError, setPageError] = useState("");
  const [pageSuccess, setPageSuccess] = useState("");

  useEffect(() => {
    loadFinancialData();
  }, []);

  async function loadFinancialData() {
    setLoadingData(true);
    setPageError("");

    try {
      const [recordsResult, expensesResult] = await Promise.all([
        supabase
          .from("financial_records")
          .select("*")
          .order("created_at", { ascending: false }),

        supabase
          .from("financial_expenses")
          .select("*")
          .order("created_at", { ascending: false }),
      ]);

      if (recordsResult.error) throw recordsResult.error;
      if (expensesResult.error) throw expensesResult.error;

      setFinanceRows((recordsResult.data || []).map(dbToFinanceRecord));
      setExpenseRows((expensesResult.data || []).map(dbToExpenseRecord));
    } catch (error: any) {
      console.error("[financeiro] erro ao carregar:", error);
      setPageError(
        error?.message ||
          "Não foi possível carregar os dados financeiros. Confira as tabelas no Supabase."
      );
    } finally {
      setLoadingData(false);
    }
  }

  const teams = useMemo(
    () =>
      Array.from(new Set(financeRows.map((r) => r.teamName).filter(Boolean))).sort(),
    [financeRows]
  );

  const adms = useMemo(
    () =>
      Array.from(new Set(financeRows.map((r) => r.admName).filter(Boolean))).sort(),
    [financeRows]
  );

  const filteredRows = useMemo(() => {
    const search = normalize(query.trim());

    return financeRows.filter((row) => {
      const rowDate = row.dueDate || row.paymentDate || row.createdAt.slice(0, 10);
      const rowMonth = rowDate.slice(0, 7);

      const matchesMonth = !monthFilter || rowMonth === monthFilter;
      const matchesStatus = statusFilter === "TODOS" || row.status === statusFilter;
      const matchesType = typeFilter === "TODOS" || row.type === typeFilter;
      const matchesTeam = teamFilter === "TODOS" || row.teamName === teamFilter;
      const matchesAdm = admFilter === "TODOS" || row.admName === admFilter;

      const matchesSearch =
        !search ||
        normalize(
          [
            row.clientName,
            row.cpfCnpj,
            row.phone,
            row.contractNumber,
            row.groupCode,
            row.installmentLabel,
            row.sellerName,
            row.teamName,
            row.admName,
            row.supervisorName,
            row.pdv,
            row.paymentMethod,
            row.administrativeStatus,
            row.admCheck,
            row.notes,
          ].join(" ")
        ).includes(search);

      const matchesTab =
        activeTab === "hoje" ||
        activeTab === "lancamentos" ||
        activeTab === "clientes" ||
        activeTab === "equipes" ||
        activeTab === "fechamento" ||
        activeTab === "relatorios" ||
        (activeTab === "antecipacoes" && row.type === "ANTECIPACAO") ||
        (activeTab === "adm" && ["ADM", "PCL"].includes(row.type));

      return (
        matchesMonth &&
        matchesStatus &&
        matchesType &&
        matchesTeam &&
        matchesAdm &&
        matchesSearch &&
        matchesTab
      );
    });
  }, [
    financeRows,
    query,
    monthFilter,
    statusFilter,
    typeFilter,
    teamFilter,
    admFilter,
    activeTab,
  ]);

  const monthExpenses = useMemo(() => {
    return expenseRows.filter((row) => {
      const month = row.date ? row.date.slice(0, 7) : row.createdAt.slice(0, 7);
      return !monthFilter || month === monthFilter;
    });
  }, [expenseRows, monthFilter]);

  const todayRows = useMemo(
    () =>
      financeRows.filter(
        (row) =>
          row.status === "VENCE_HOJE" ||
          row.dueDate === todayISO() ||
          row.status === "ATRASADO" ||
          row.status === "PENDENTE"
      ),
    [financeRows]
  );

  const totals = useMemo(() => {
    const paid = sum(
      filteredRows.filter((r) => r.status === "PAGO" || r.status === "ANTECIPADO"),
      (r) => r.paidAmount || r.amount
    );

    const open = sum(
      filteredRows.filter((r) =>
        ["A_VENCER", "VENCE_HOJE", "ATRASADO", "PENDENTE"].includes(r.status)
      ),
      (r) => r.amount
    );

    const overdue = sum(
      filteredRows.filter((r) => r.status === "ATRASADO"),
      (r) => r.amount
    );

    const today = sum(
      filteredRows.filter((r) => r.status === "VENCE_HOJE" || r.dueDate === todayISO()),
      (r) => r.amount
    );

    const anticipation = sum(
      filteredRows.filter((r) => r.type === "ANTECIPACAO"),
      (r) => r.paidAmount || r.amount
    );

    const expenses = sum(monthExpenses, (r) => r.value);
    const credit = sum(filteredRows, (r) => r.creditValue);
    const net = paid + today + anticipation - expenses;

    return { paid, open, overdue, today, anticipation, expenses, credit, net };
  }, [filteredRows, monthExpenses]);

  const teamRanking = useMemo(() => {
    return Object.entries(
      groupSum(filteredRows, (r) => r.teamName, (r) => r.creditValue)
    )
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredRows]);

  const sellerRanking = useMemo(() => {
    return Object.entries(
      groupSum(filteredRows, (r) => r.sellerName, (r) => r.creditValue)
    )
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredRows]);

  const admRanking = useMemo(() => {
    return Object.entries(
      groupSum(
        filteredRows.filter((r) => r.status !== "PAGO" && r.status !== "ANTECIPADO"),
        (r) => r.admName,
        (r) => r.amount
      )
    )
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredRows]);

  const clients = useMemo(() => {
    const map = new Map<
      string,
      {
        clientName: string;
        cpfCnpj: string;
        phone: string;
        contracts: number;
        creditValue: number;
        openValue: number;
        paidValue: number;
      }
    >();

    filteredRows.forEach((row) => {
      const key = row.cpfCnpj || row.clientName;

      const existing =
        map.get(key) ||
        {
          clientName: row.clientName,
          cpfCnpj: row.cpfCnpj,
          phone: row.phone,
          contracts: 0,
          creditValue: 0,
          openValue: 0,
          paidValue: 0,
        };

      existing.contracts += row.contractNumber ? 1 : 0;
      existing.creditValue += row.creditValue;
      existing.openValue += ["PAGO", "ANTECIPADO"].includes(row.status)
        ? 0
        : row.amount;
      existing.paidValue += ["PAGO", "ANTECIPADO"].includes(row.status)
        ? row.paidAmount || row.amount
        : 0;

      map.set(key, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.openValue - a.openValue);
  }, [filteredRows]);

  const reportByStatus = useMemo(() => {
    const statuses: FinanceStatus[] = [
      "PAGO",
      "A_VENCER",
      "VENCE_HOJE",
      "ATRASADO",
      "PENDENTE",
      "CANCELADO",
      "ANTECIPADO",
    ];

    return statuses.map((status) => {
      const rows = filteredRows.filter((row) => row.status === status);

      return {
        label: statusLabel(status),
        quantity: rows.length,
        amount: sum(rows, (row) =>
          row.status === "PAGO" || row.status === "ANTECIPADO"
            ? row.paidAmount || row.amount
            : row.amount
        ),
      };
    });
  }, [filteredRows]);

  const reportByType = useMemo(() => {
    const types: FinanceType[] = [
      "RECEBIVEL",
      "ANTECIPACAO",
      "ADM",
      "PCL",
      "COMISSAO",
      "OUTRO",
    ];

    return types.map((type) => {
      const rows = filteredRows.filter((row) => row.type === type);

      return {
        label: typeLabel(type),
        quantity: rows.length,
        amount: sum(rows, (row) => row.amount),
      };
    });
  }, [filteredRows]);

  const reportByPaymentMethod = useMemo(() => {
    return Object.entries(
      groupSum(
        filteredRows,
        (row) => row.paymentMethod || "Não informado",
        (row) => row.amount
      )
    )
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredRows]);

  function resetFinanceForm() {
    setFinanceForm(emptyFinanceForm);
    setEditingFinanceId(null);
  }

  function resetExpenseForm() {
    setExpenseForm(emptyExpenseForm);
    setEditingExpenseId(null);
  }

  function openCreateFinance(type?: FinanceType) {
    resetFinanceForm();

    if (type) {
      setFinanceForm((current) => ({ ...current, type }));
    }

    setPageError("");
    setPageSuccess("");
    setFinanceModal(true);
  }

  function openEditFinance(row: FinanceRecord) {
    setEditingFinanceId(row.id);

    setFinanceForm({
      type: row.type,
      status: row.status,
      clientName: row.clientName,
      cpfCnpj: row.cpfCnpj,
      phone: row.phone,
      contractNumber: row.contractNumber,
      groupCode: row.groupCode,
      creditValue: String(row.creditValue || ""),
      amount: String(row.amount || ""),
      paidAmount: String(row.paidAmount || ""),
      installmentLabel: row.installmentLabel,
      installmentNumber: row.installmentNumber,
      dueDate: row.dueDate,
      paymentDate: row.paymentDate,
      sellerName: row.sellerName,
      teamName: row.teamName,
      admName: row.admName,
      supervisorName: row.supervisorName,
      pdv: row.pdv,
      paymentMethod: row.paymentMethod,
      administrativeStatus: row.administrativeStatus,
      admCheck: row.admCheck,
      notes: row.notes,
    });

    setPageError("");
    setPageSuccess("");
    setFinanceModal(true);
  }

  async function saveFinance(event: FormEvent) {
    event.preventDefault();

    setPageError("");
    setPageSuccess("");

    const amount = parseNumber(financeForm.amount);

    if (!financeForm.clientName.trim()) {
      setPageError("Informe o nome do cliente antes de salvar.");
      return;
    }

    if (!amount || amount <= 0) {
      setPageError("Informe um valor válido para o lançamento.");
      return;
    }

    setSavingFinance(true);

    try {
      const payload = financeRecordToDb({
        type: financeForm.type,
        status: financeForm.status,

        clientName: financeForm.clientName.trim(),
        cpfCnpj: financeForm.cpfCnpj.trim(),
        phone: financeForm.phone.trim(),

        contractNumber: financeForm.contractNumber.trim(),
        groupCode: financeForm.groupCode.trim(),
        creditValue: parseNumber(financeForm.creditValue),

        installmentLabel: financeForm.installmentLabel.trim(),
        installmentNumber: financeForm.installmentNumber.trim(),
        dueDate: financeForm.dueDate,
        paymentDate: financeForm.paymentDate,

        amount,
        paidAmount: parseNumber(financeForm.paidAmount),

        sellerName: financeForm.sellerName.trim(),
        teamName: financeForm.teamName.trim(),
        admName: financeForm.admName.trim(),
        supervisorName: financeForm.supervisorName.trim(),

        pdv: financeForm.pdv.trim(),
        paymentMethod: financeForm.paymentMethod.trim(),
        administrativeStatus: financeForm.administrativeStatus.trim(),
        admCheck: financeForm.admCheck.trim(),

        notes: financeForm.notes.trim(),
      });

      if (editingFinanceId) {
        const { error } = await supabase
          .from("financial_records")
          .update(payload)
          .eq("id", editingFinanceId);

        if (error) throw error;

        setPageSuccess("Lançamento atualizado com sucesso.");
      } else {
        const { error } = await supabase.from("financial_records").insert(payload);

        if (error) throw error;

        setPageSuccess("Lançamento salvo com sucesso.");
      }

      resetFinanceForm();
      setFinanceModal(false);
      await loadFinancialData();
    } catch (error: any) {
      console.error("[financeiro] erro ao salvar lançamento:", error);
      setPageError(
        error?.message ||
          "Erro ao salvar lançamento. Confira se a tabela financial_records existe no Supabase."
      );
    } finally {
      setSavingFinance(false);
    }
  }

  async function deleteFinance(id: string) {
    const ok = confirm("Deseja excluir este lançamento?");
    if (!ok) return;

    setPageError("");
    setPageSuccess("");

    try {
      const { error } = await supabase
        .from("financial_records")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setSelected(null);
      setPageSuccess("Lançamento excluído com sucesso.");
      await loadFinancialData();
    } catch (error: any) {
      console.error("[financeiro] erro ao excluir lançamento:", error);
      setPageError(error?.message || "Erro ao excluir lançamento.");
    }
  }

  async function markAsPaid(row: FinanceRecord) {
    setPageError("");
    setPageSuccess("");

    try {
      const { error } = await supabase
        .from("financial_records")
        .update({
          status: "PAGO",
          paid_amount: row.paidAmount || row.amount,
          payment_date: row.paymentDate || todayISO(),
        })
        .eq("id", row.id);

      if (error) throw error;

      setSelected(null);
      setPageSuccess("Lançamento marcado como pago.");
      await loadFinancialData();
    } catch (error: any) {
      console.error("[financeiro] erro ao marcar como pago:", error);
      setPageError(error?.message || "Erro ao marcar lançamento como pago.");
    }
  }

  function openEditExpense(row: ExpenseRecord) {
    setEditingExpenseId(row.id);

    setExpenseForm({
      category: row.category,
      description: row.description,
      value: String(row.value || ""),
      date: row.date,
      responsible: row.responsible,
      status: row.status,
      notes: row.notes,
    });

    setPageError("");
    setPageSuccess("");
    setExpenseModal(true);
  }

  async function saveExpense(event: FormEvent) {
    event.preventDefault();

    setPageError("");
    setPageSuccess("");

    const value = parseNumber(expenseForm.value);

    if (!expenseForm.description.trim()) {
      setPageError("Informe a descrição da saída antes de salvar.");
      return;
    }

    if (!value || value <= 0) {
      setPageError("Informe um valor válido para a saída.");
      return;
    }

    setSavingExpense(true);

    try {
      const payload = expenseRecordToDb({
        category: expenseForm.category,
        description: expenseForm.description.trim(),
        value,
        date: expenseForm.date,
        responsible: expenseForm.responsible.trim(),
        status: expenseForm.status,
        notes: expenseForm.notes.trim(),
      });

      if (editingExpenseId) {
        const { error } = await supabase
          .from("financial_expenses")
          .update(payload)
          .eq("id", editingExpenseId);

        if (error) throw error;

        setPageSuccess("Saída atualizada com sucesso.");
      } else {
        const { error } = await supabase.from("financial_expenses").insert(payload);

        if (error) throw error;

        setPageSuccess("Saída salva com sucesso.");
      }

      resetExpenseForm();
      setExpenseModal(false);
      await loadFinancialData();
    } catch (error: any) {
      console.error("[financeiro] erro ao salvar saída:", error);
      setPageError(
        error?.message ||
          "Erro ao salvar saída. Confira se a tabela financial_expenses existe no Supabase."
      );
    } finally {
      setSavingExpense(false);
    }
  }

  async function deleteExpense(id: string) {
    const ok = confirm("Deseja excluir esta saída?");
    if (!ok) return;

    setPageError("");
    setPageSuccess("");

    try {
      const { error } = await supabase
        .from("financial_expenses")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setPageSuccess("Saída excluída com sucesso.");
      await loadFinancialData();
    } catch (error: any) {
      console.error("[financeiro] erro ao excluir saída:", error);
      setPageError(error?.message || "Erro ao excluir saída.");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-500">
                <FileSpreadsheet size={14} />
                Financeiro operacional
              </div>

              <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950">
                Financeiro
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Controle de clientes, parcelas, antecipações, ADM, PCL, equipes,
                vendedores, despesas, relatórios e fechamento mensal.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                onClick={() => openCreateFinance()}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-900 bg-white px-4 text-xs font-bold text-slate-950 transition hover:bg-slate-50"
              >
                <Plus size={15} />
                Lançamento
              </button>

              <button
                onClick={() => {
                  resetExpenseForm();
                  setPageError("");
                  setPageSuccess("");
                  setExpenseModal(true);
                }}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-xs font-black text-white transition hover:bg-slate-800"
              >
                <Plus size={15} />
                Saída
              </button>
            </div>
          </div>

          <div className="mt-8 flex gap-2 overflow-x-auto pb-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={[
                  "h-9 shrink-0 rounded-xl border px-3 text-xs font-bold transition",
                  activeTab === tab.key
                    ? "border-slate-950 bg-slate-950 text-white"
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-950",
                ].join(" ")}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
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

        {loadingData ? (
          <div className="mb-5 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-500 shadow-sm">
            Carregando financeiro...
          </div>
        ) : null}

        {activeTab !== "relatorios" && (
          <>
            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Panel className="p-5">
                <p className="text-xs font-bold text-slate-500">A receber hoje</p>
                <p className="mt-2 text-2xl font-black text-slate-950">
                  {money(totals.today)}
                </p>
                <p className="mt-1 text-xs text-slate-400">Vencimentos do dia</p>
              </Panel>

              <Panel className="p-5">
                <p className="text-xs font-bold text-slate-500">Atrasado</p>
                <p className="mt-2 text-2xl font-black text-red-600">
                  {money(totals.overdue)}
                </p>
                <p className="mt-1 text-xs text-slate-400">Cobrança prioritária</p>
              </Panel>

              <Panel className="p-5">
                <p className="text-xs font-bold text-slate-500">Recebido</p>
                <p className="mt-2 text-2xl font-black text-emerald-600">
                  {money(totals.paid)}
                </p>
                <p className="mt-1 text-xs text-slate-400">Pago no período</p>
              </Panel>

              <Panel className="p-5">
                <p className="text-xs font-bold text-slate-500">Saldo estimado</p>
                <p className="mt-2 text-2xl font-black text-slate-950">
                  {money(totals.net)}
                </p>
                <p className="mt-1 text-xs text-slate-400">Recebido - saídas</p>
              </Panel>
            </section>

            <section className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-12">
              <Panel className="p-4 lg:col-span-4">
                <div className="flex items-center gap-3">
                  <Search size={17} className="text-slate-400" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Buscar cliente, contrato, ADM, vendedor..."
                    className="w-full border-none bg-transparent text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
                  />
                </div>
              </Panel>

              <Panel className="p-4 lg:col-span-8">
                <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
                  <input
                    type="month"
                    value={monthFilter}
                    onChange={(event) => setMonthFilter(event.target.value)}
                    className={inputClass}
                  />

                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className={inputClass}
                  >
                    <option value="TODOS">Status</option>
                    <option value="PAGO">Pago</option>
                    <option value="A_VENCER">A vencer</option>
                    <option value="VENCE_HOJE">Vence hoje</option>
                    <option value="ATRASADO">Atrasado</option>
                    <option value="PENDENTE">Pendente</option>
                    <option value="CANCELADO">Cancelado</option>
                    <option value="ANTECIPADO">Antecipado</option>
                  </select>

                  <select
                    value={typeFilter}
                    onChange={(event) => setTypeFilter(event.target.value)}
                    className={inputClass}
                  >
                    <option value="TODOS">Tipo</option>
                    <option value="RECEBIVEL">Recebível</option>
                    <option value="ANTECIPACAO">Antecipação</option>
                    <option value="ADM">ADM</option>
                    <option value="PCL">PCL</option>
                    <option value="COMISSAO">Comissão</option>
                    <option value="OUTRO">Outro</option>
                  </select>

                  <select
                    value={teamFilter}
                    onChange={(event) => setTeamFilter(event.target.value)}
                    className={inputClass}
                  >
                    <option value="TODOS">Equipe</option>
                    {teams.map((team) => (
                      <option key={team}>{team}</option>
                    ))}
                  </select>

                  <select
                    value={admFilter}
                    onChange={(event) => setAdmFilter(event.target.value)}
                    className={inputClass}
                  >
                    <option value="TODOS">ADM</option>
                    {adms.map((adm) => (
                      <option key={adm}>{adm}</option>
                    ))}
                  </select>
                </div>
              </Panel>
            </section>
          </>
        )}

        {activeTab === "hoje" && (
          <section className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-12">
            <Panel className="xl:col-span-8">
              <div className="border-b border-slate-200 p-5">
                <h2 className="text-lg font-black text-slate-950">Operação de hoje</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Vencimentos, atrasados e pendências que precisam de ação.
                </p>
              </div>

              <FinanceTable
                rows={todayRows}
                onOpen={setSelected}
                onEdit={openEditFinance}
                onDelete={deleteFinance}
                onPaid={markAsPaid}
                emptyText="Nenhuma pendência para hoje."
              />
            </Panel>

            <div className="space-y-6 xl:col-span-4">
              <RankingPanel
                title="Pendências por ADM"
                icon={<ShieldCheck size={18} />}
                data={admRanking}
              />

              <RankingPanel
                title="Top vendedores"
                icon={<Users size={18} />}
                data={sellerRanking}
              />
            </div>
          </section>
        )}

        {activeTab === "lancamentos" && (
          <section className="mt-8">
            <Panel>
              <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-950">
                    Todos os lançamentos
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Controle geral das parcelas, contratos, PCL, ADM e antecipações.
                  </p>
                </div>

                <button
                  onClick={() => openCreateFinance()}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 text-xs font-black text-white"
                >
                  <Plus size={14} />
                  Novo
                </button>
              </div>

              <FinanceTable
                rows={filteredRows}
                onOpen={setSelected}
                onEdit={openEditFinance}
                onDelete={deleteFinance}
                onPaid={markAsPaid}
                emptyText="Nenhum lançamento cadastrado."
              />
            </Panel>
          </section>
        )}

        {activeTab === "clientes" && (
          <section className="mt-8">
            <Panel>
              <div className="border-b border-slate-200 p-5">
                <h2 className="text-lg font-black text-slate-950">
                  Clientes e contratos
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Visão agrupada por cliente, com crédito, pago e aberto.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="px-5 py-3">Cliente</th>
                      <th className="px-5 py-3">CPF/CNPJ</th>
                      <th className="px-5 py-3">Telefone</th>
                      <th className="px-5 py-3 text-right">Crédito</th>
                      <th className="px-5 py-3 text-right">Pago</th>
                      <th className="px-5 py-3 text-right">Em aberto</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {clients.length ? (
                      clients.map((client) => (
                        <tr
                          key={client.cpfCnpj || client.clientName}
                          className="hover:bg-slate-50"
                        >
                          <td className="px-5 py-4 text-sm font-bold text-slate-900">
                            {client.clientName}
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-500">
                            {client.cpfCnpj || "-"}
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-500">
                            {client.phone || "-"}
                          </td>
                          <td className="px-5 py-4 text-right text-sm font-bold text-slate-900">
                            {money(client.creditValue)}
                          </td>
                          <td className="px-5 py-4 text-right text-sm font-bold text-emerald-600">
                            {money(client.paidValue)}
                          </td>
                          <td className="px-5 py-4 text-right text-sm font-bold text-amber-600">
                            {money(client.openValue)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-5 py-10 text-center text-sm text-slate-400"
                        >
                          Nenhum cliente encontrado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Panel>
          </section>
        )}

        {activeTab === "antecipacoes" && (
          <section className="mt-8">
            <Panel>
              <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-950">
                    Antecipações
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    AT1, AT2, recuperações e antecipações de parcelas.
                  </p>
                </div>

                <button
                  onClick={() => openCreateFinance("ANTECIPACAO")}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 text-xs font-black text-white"
                >
                  <Plus size={14} />
                  Nova antecipação
                </button>
              </div>

              <FinanceTable
                rows={filteredRows}
                onOpen={setSelected}
                onEdit={openEditFinance}
                onDelete={deleteFinance}
                onPaid={markAsPaid}
                emptyText="Nenhuma antecipação cadastrada."
              />
            </Panel>
          </section>
        )}

        {activeTab === "adm" && (
          <section className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-12">
            <Panel className="xl:col-span-8">
              <div className="border-b border-slate-200 p-5">
                <h2 className="text-lg font-black text-slate-950">ADM / PCL</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Conferência administrativa, PCL pago/não pago e pendências.
                </p>
              </div>

              <FinanceTable
                rows={filteredRows}
                onOpen={setSelected}
                onEdit={openEditFinance}
                onDelete={deleteFinance}
                onPaid={markAsPaid}
                emptyText="Nenhuma pendência ADM/PCL cadastrada."
              />
            </Panel>

            <div className="space-y-6 xl:col-span-4">
              <RankingPanel
                title="Aberto por ADM"
                icon={<ShieldCheck size={18} />}
                data={admRanking}
              />

              <Panel className="p-5">
                <h3 className="font-black text-slate-950">Resumo ADM</h3>

                <div className="mt-4 space-y-3 text-sm">
                  <Line
                    label="Pendente"
                    value={money(
                      sum(
                        filteredRows.filter((r) => r.status === "PENDENTE"),
                        (r) => r.amount
                      )
                    )}
                  />
                  <Line
                    label="Atrasado"
                    value={money(
                      sum(
                        filteredRows.filter((r) => r.status === "ATRASADO"),
                        (r) => r.amount
                      )
                    )}
                  />
                  <Line
                    label="Pago"
                    value={money(
                      sum(
                        filteredRows.filter((r) => r.status === "PAGO"),
                        (r) => r.paidAmount || r.amount
                      )
                    )}
                  />
                </div>
              </Panel>
            </div>
          </section>
        )}

        {activeTab === "equipes" && (
          <section className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
            <RankingPanel
              title="Equipes por crédito"
              icon={<Users size={18} />}
              data={teamRanking}
            />

            <RankingPanel
              title="Vendedores por crédito"
              icon={<UserRound size={18} />}
              data={sellerRanking}
            />
          </section>
        )}

        {activeTab === "despesas" && (
          <section className="mt-8">
            <Panel>
              <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-950">
                    Despesas e saídas
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Marketing, comissões, retiradas, operacional, aportes e outros.
                  </p>
                </div>

                <button
                  onClick={() => {
                    resetExpenseForm();
                    setPageError("");
                    setPageSuccess("");
                    setExpenseModal(true);
                  }}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 text-xs font-black text-white"
                >
                  <Plus size={14} />
                  Nova saída
                </button>
              </div>

              <ExpenseTable
                rows={monthExpenses}
                onEdit={openEditExpense}
                onDelete={deleteExpense}
              />
            </Panel>
          </section>
        )}

        {activeTab === "fechamento" && (
          <section className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-12">
            <Panel className="p-5 xl:col-span-4">
              <h2 className="text-lg font-black text-slate-950">
                Fechamento do período
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Resumo do mês selecionado.
              </p>

              <div className="mt-5 space-y-4">
                <Line label="Crédito total" value={money(totals.credit)} />
                <Line label="Recebido" value={money(totals.paid)} />
                <Line label="Em aberto" value={money(totals.open)} />
                <Line label="Atrasado" value={money(totals.overdue)} />
                <Line label="Antecipações" value={money(totals.anticipation)} />
                <Line label="Despesas" value={money(totals.expenses)} />

                <div className="border-t border-slate-200 pt-4">
                  <Line label="Saldo estimado" value={money(totals.net)} strong />
                </div>
              </div>
            </Panel>

            <Panel className="p-5 xl:col-span-8">
              <h2 className="text-lg font-black text-slate-950">
                Leitura operacional
              </h2>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                <InsightCard
                  title="Cobrança"
                  value={money(totals.overdue)}
                  text="Valor em atraso que precisa de contato ou revisão ADM."
                  icon={<AlertTriangle size={18} />}
                />
                <InsightCard
                  title="Equipe"
                  value={teamRanking[0]?.label || "-"}
                  text="Equipe com maior volume de crédito no filtro atual."
                  icon={<Users size={18} />}
                />
                <InsightCard
                  title="ADM"
                  value={admRanking[0]?.label || "-"}
                  text="ADM com maior volume em aberto ou pendente."
                  icon={<ShieldCheck size={18} />}
                />
              </div>
            </Panel>
          </section>
        )}

        {activeTab === "relatorios" && (
          <section className="space-y-6">
            <Panel className="p-5">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-bold text-slate-500">
                  <PieChart size={14} />
                  Relatório do período
                </div>

                <h2 className="mt-4 text-2xl font-black text-slate-950">
                  Relatório financeiro
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Resumo consolidado dos lançamentos filtrados por período, status,
                  tipo, equipe e ADM. Use esta área para conferência, fechamento e
                  prestação de contas.
                </p>
              </div>
            </Panel>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Panel className="p-5">
                <p className="text-xs font-bold text-slate-500">Crédito total</p>
                <p className="mt-2 text-2xl font-black text-slate-950">
                  {money(totals.credit)}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Soma dos créditos no filtro
                </p>
              </Panel>

              <Panel className="p-5">
                <p className="text-xs font-bold text-slate-500">Recebido</p>
                <p className="mt-2 text-2xl font-black text-emerald-600">
                  {money(totals.paid)}
                </p>
                <p className="mt-1 text-xs text-slate-400">Lançamentos pagos</p>
              </Panel>

              <Panel className="p-5">
                <p className="text-xs font-bold text-slate-500">Em aberto</p>
                <p className="mt-2 text-2xl font-black text-amber-600">
                  {money(totals.open)}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  A vencer, hoje, atrasado e pendente
                </p>
              </Panel>

              <Panel className="p-5">
                <p className="text-xs font-bold text-slate-500">Saldo estimado</p>
                <p className="mt-2 text-2xl font-black text-slate-950">
                  {money(totals.net)}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Recebido + hoje + antecipações - despesas
                </p>
              </Panel>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <Panel className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-slate-950">Resumo por status</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Quantidade e valor por situação financeira.
                    </p>
                  </div>
                  <ClipboardList className="text-slate-500" size={18} />
                </div>

                <ReportTable
                  firstHeader="Status"
                  rows={reportByStatus.map((item) => ({
                    label: item.label,
                    quantity: item.quantity,
                    amount: item.amount,
                  }))}
                />
              </Panel>

              <Panel className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-slate-950">Resumo por tipo</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Recebíveis, antecipações, ADM, PCL e outros.
                    </p>
                  </div>
                  <FileSpreadsheet className="text-slate-500" size={18} />
                </div>

                <ReportTable
                  firstHeader="Tipo"
                  rows={reportByType.map((item) => ({
                    label: item.label,
                    quantity: item.quantity,
                    amount: item.amount,
                  }))}
                />
              </Panel>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <RankingPanel
                title="Ranking por equipe"
                icon={<Users size={18} />}
                data={teamRanking}
              />

              <RankingPanel
                title="Ranking por vendedor"
                icon={<UserRound size={18} />}
                data={sellerRanking}
              />

              <RankingPanel
                title="Pendências por ADM"
                icon={<ShieldCheck size={18} />}
                data={admRanking}
              />
            </div>

            <Panel className="p-5">
              <div className="mb-4">
                <h3 className="font-black text-slate-950">Formas de pagamento</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Total agrupado por forma de pagamento informada nos lançamentos.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left">
                  <thead className="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="py-3">Forma</th>
                      <th className="py-3 text-right">Valor</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {reportByPaymentMethod.length ? (
                      reportByPaymentMethod.map((item) => (
                        <tr key={item.label}>
                          <td className="py-3 text-sm font-bold text-slate-800">
                            {item.label}
                          </td>
                          <td className="py-3 text-right text-sm font-bold text-slate-950">
                            {money(item.value)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={2}
                          className="py-8 text-center text-sm text-slate-400"
                        >
                          Nenhuma forma de pagamento encontrada.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Panel>
          </section>
        )}
      </main>

      {financeModal && (
        <Modal
          title={editingFinanceId ? "Editar lançamento" : "Novo lançamento"}
          onClose={() => setFinanceModal(false)}
        >
          <form onSubmit={saveFinance}>
            <div className="grid max-h-[70vh] grid-cols-1 gap-4 overflow-y-auto p-5 md:grid-cols-3">
              <Field label="Tipo">
                <select
                  className={inputClass}
                  value={financeForm.type}
                  onChange={(e) =>
                    setFinanceForm((f) => ({
                      ...f,
                      type: e.target.value as FinanceType,
                    }))
                  }
                >
                  <option value="RECEBIVEL">Recebível</option>
                  <option value="ANTECIPACAO">Antecipação</option>
                  <option value="ADM">ADM</option>
                  <option value="PCL">PCL</option>
                  <option value="COMISSAO">Comissão</option>
                  <option value="OUTRO">Outro</option>
                </select>
              </Field>

              <Field label="Status">
                <select
                  className={inputClass}
                  value={financeForm.status}
                  onChange={(e) =>
                    setFinanceForm((f) => ({
                      ...f,
                      status: e.target.value as FinanceStatus,
                    }))
                  }
                >
                  <option value="A_VENCER">A vencer</option>
                  <option value="VENCE_HOJE">Vence hoje</option>
                  <option value="ATRASADO">Atrasado</option>
                  <option value="PENDENTE">Pendente</option>
                  <option value="PAGO">Pago</option>
                  <option value="ANTECIPADO">Antecipado</option>
                  <option value="CANCELADO">Cancelado</option>
                </select>
              </Field>

              <Field label="Cliente *">
                <input
                  className={inputClass}
                  value={financeForm.clientName}
                  onChange={(e) =>
                    setFinanceForm((f) => ({ ...f, clientName: e.target.value }))
                  }
                  placeholder="Nome do cliente"
                />
              </Field>

              <Field label="CPF/CNPJ">
                <input
                  className={inputClass}
                  value={financeForm.cpfCnpj}
                  onChange={(e) =>
                    setFinanceForm((f) => ({ ...f, cpfCnpj: e.target.value }))
                  }
                />
              </Field>

              <Field label="Telefone">
                <input
                  className={inputClass}
                  value={financeForm.phone}
                  onChange={(e) =>
                    setFinanceForm((f) => ({ ...f, phone: e.target.value }))
                  }
                />
              </Field>

              <Field label="Contrato">
                <input
                  className={inputClass}
                  value={financeForm.contractNumber}
                  onChange={(e) =>
                    setFinanceForm((f) => ({
                      ...f,
                      contractNumber: e.target.value,
                    }))
                  }
                />
              </Field>

              <Field label="Grupo">
                <input
                  className={inputClass}
                  value={financeForm.groupCode}
                  onChange={(e) =>
                    setFinanceForm((f) => ({ ...f, groupCode: e.target.value }))
                  }
                />
              </Field>

              <Field label="Crédito">
                <input
                  className={inputClass}
                  value={financeForm.creditValue}
                  onChange={(e) =>
                    setFinanceForm((f) => ({
                      ...f,
                      creditValue: e.target.value,
                    }))
                  }
                  placeholder="90000"
                />
              </Field>

              <Field label="Valor *">
                <input
                  className={inputClass}
                  value={financeForm.amount}
                  onChange={(e) =>
                    setFinanceForm((f) => ({ ...f, amount: e.target.value }))
                  }
                  placeholder="1173,39"
                />
              </Field>

              <Field label="Valor pago">
                <input
                  className={inputClass}
                  value={financeForm.paidAmount}
                  onChange={(e) =>
                    setFinanceForm((f) => ({
                      ...f,
                      paidAmount: e.target.value,
                    }))
                  }
                />
              </Field>

              <Field label="Parcela">
                <input
                  className={inputClass}
                  value={financeForm.installmentLabel}
                  onChange={(e) =>
                    setFinanceForm((f) => ({
                      ...f,
                      installmentLabel: e.target.value,
                    }))
                  }
                  placeholder="2ª parcela / AT1 / PCL"
                />
              </Field>

              <Field label="Nº parcela">
                <input
                  className={inputClass}
                  value={financeForm.installmentNumber}
                  onChange={(e) =>
                    setFinanceForm((f) => ({
                      ...f,
                      installmentNumber: e.target.value,
                    }))
                  }
                />
              </Field>

              <Field label="Vencimento">
                <input
                  type="date"
                  className={inputClass}
                  value={financeForm.dueDate}
                  onChange={(e) =>
                    setFinanceForm((f) => ({ ...f, dueDate: e.target.value }))
                  }
                />
              </Field>

              <Field label="Pagamento">
                <input
                  type="date"
                  className={inputClass}
                  value={financeForm.paymentDate}
                  onChange={(e) =>
                    setFinanceForm((f) => ({
                      ...f,
                      paymentDate: e.target.value,
                    }))
                  }
                />
              </Field>

              <Field label="Vendedor">
                <input
                  className={inputClass}
                  value={financeForm.sellerName}
                  onChange={(e) =>
                    setFinanceForm((f) => ({ ...f, sellerName: e.target.value }))
                  }
                />
              </Field>

              <Field label="Equipe">
                <input
                  className={inputClass}
                  value={financeForm.teamName}
                  onChange={(e) =>
                    setFinanceForm((f) => ({ ...f, teamName: e.target.value }))
                  }
                />
              </Field>

              <Field label="ADM">
                <input
                  className={inputClass}
                  value={financeForm.admName}
                  onChange={(e) =>
                    setFinanceForm((f) => ({ ...f, admName: e.target.value }))
                  }
                />
              </Field>

              <Field label="Supervisor">
                <input
                  className={inputClass}
                  value={financeForm.supervisorName}
                  onChange={(e) =>
                    setFinanceForm((f) => ({
                      ...f,
                      supervisorName: e.target.value,
                    }))
                  }
                />
              </Field>

              <Field label="PDV">
                <input
                  className={inputClass}
                  value={financeForm.pdv}
                  onChange={(e) =>
                    setFinanceForm((f) => ({ ...f, pdv: e.target.value }))
                  }
                />
              </Field>

              <Field label="Forma">
                <input
                  className={inputClass}
                  value={financeForm.paymentMethod}
                  onChange={(e) =>
                    setFinanceForm((f) => ({
                      ...f,
                      paymentMethod: e.target.value,
                    }))
                  }
                />
              </Field>

              <Field label="Situação ADM">
                <input
                  className={inputClass}
                  value={financeForm.administrativeStatus}
                  onChange={(e) =>
                    setFinanceForm((f) => ({
                      ...f,
                      administrativeStatus: e.target.value,
                    }))
                  }
                />
              </Field>

              <Field label="Visto ADM">
                <input
                  className={inputClass}
                  value={financeForm.admCheck}
                  onChange={(e) =>
                    setFinanceForm((f) => ({ ...f, admCheck: e.target.value }))
                  }
                />
              </Field>

              <div className="md:col-span-3">
                <Field label="Observação">
                  <textarea
                    className={textareaClass}
                    value={financeForm.notes}
                    onChange={(e) =>
                      setFinanceForm((f) => ({ ...f, notes: e.target.value }))
                    }
                  />
                </Field>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 p-5">
              <button
                type="button"
                onClick={() => setFinanceModal(false)}
                className="h-10 rounded-xl border border-slate-200 px-4 text-xs font-bold text-slate-600"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={savingFinance}
                className="h-10 rounded-xl bg-slate-950 px-4 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingFinance ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {expenseModal && (
        <Modal
          title={editingExpenseId ? "Editar saída" : "Nova saída"}
          onClose={() => setExpenseModal(false)}
        >
          <form onSubmit={saveExpense}>
            <div className="grid gap-4 p-5 md:grid-cols-2">
              <Field label="Descrição *">
                <input
                  className={inputClass}
                  value={expenseForm.description}
                  onChange={(e) =>
                    setExpenseForm((f) => ({
                      ...f,
                      description: e.target.value,
                    }))
                  }
                />
              </Field>

              <Field label="Valor *">
                <input
                  className={inputClass}
                  value={expenseForm.value}
                  onChange={(e) =>
                    setExpenseForm((f) => ({ ...f, value: e.target.value }))
                  }
                />
              </Field>

              <Field label="Categoria">
                <select
                  className={inputClass}
                  value={expenseForm.category}
                  onChange={(e) =>
                    setExpenseForm((f) => ({ ...f, category: e.target.value }))
                  }
                >
                  <option>Marketing</option>
                  <option>Operacional</option>
                  <option>Comissão</option>
                  <option>Retirada</option>
                  <option>Aporte</option>
                  <option>Outros</option>
                </select>
              </Field>

              <Field label="Status">
                <select
                  className={inputClass}
                  value={expenseForm.status}
                  onChange={(e) =>
                    setExpenseForm((f) => ({
                      ...f,
                      status: e.target.value as ExpenseStatus,
                    }))
                  }
                >
                  <option value="PENDENTE">Pendente</option>
                  <option value="PAGO">Pago</option>
                </select>
              </Field>

              <Field label="Data">
                <input
                  type="date"
                  className={inputClass}
                  value={expenseForm.date}
                  onChange={(e) =>
                    setExpenseForm((f) => ({ ...f, date: e.target.value }))
                  }
                />
              </Field>

              <Field label="Responsável">
                <input
                  className={inputClass}
                  value={expenseForm.responsible}
                  onChange={(e) =>
                    setExpenseForm((f) => ({
                      ...f,
                      responsible: e.target.value,
                    }))
                  }
                />
              </Field>

              <div className="md:col-span-2">
                <Field label="Observação">
                  <textarea
                    className={textareaClass}
                    value={expenseForm.notes}
                    onChange={(e) =>
                      setExpenseForm((f) => ({ ...f, notes: e.target.value }))
                    }
                  />
                </Field>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 p-5">
              <button
                type="button"
                onClick={() => setExpenseModal(false)}
                className="h-10 rounded-xl border border-slate-200 px-4 text-xs font-bold text-slate-600"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={savingExpense}
                className="h-10 rounded-xl bg-slate-950 px-4 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingExpense ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {selected && (
        <Modal title={selected.clientName} onClose={() => setSelected(null)}>
          <div className="p-5">
            <div className="grid gap-3 md:grid-cols-3">
              <Info title="Tipo" value={typeLabel(selected.type)} />
              <Info title="Status" value={statusLabel(selected.status)} />
              <Info title="Valor" value={money(selected.amount)} />
              <Info title="Crédito" value={money(selected.creditValue)} />
              <Info title="Contrato" value={selected.contractNumber || "-"} />
              <Info title="Grupo" value={selected.groupCode || "-"} />
              <Info title="Parcela" value={selected.installmentLabel || "-"} />
              <Info title="Vencimento" value={dateBR(selected.dueDate)} />
              <Info title="Pagamento" value={dateBR(selected.paymentDate)} />
              <Info title="Vendedor" value={selected.sellerName || "-"} />
              <Info title="Equipe" value={selected.teamName || "-"} />
              <Info title="ADM" value={selected.admName || "-"} />
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-400">
                Observação
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {selected.notes || "Sem observação cadastrada."}
              </p>
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              {selected.status !== "PAGO" && (
                <button
                  onClick={() => markAsPaid(selected)}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-black text-white"
                >
                  <Check size={14} />
                  Marcar como pago
                </button>
              )}

              <button
                onClick={() => openEditFinance(selected)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-xs font-bold text-slate-700"
              >
                <Pencil size={14} />
                Editar
              </button>

              <button
                onClick={() => deleteFinance(selected.id)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-200 px-4 text-xs font-bold text-red-600"
              >
                <Trash2 size={14} />
                Excluir
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function FinanceTable({
  rows,
  onOpen,
  onEdit,
  onDelete,
  onPaid,
  emptyText,
}: {
  rows: FinanceRecord[];
  onOpen: (row: FinanceRecord) => void;
  onEdit: (row: FinanceRecord) => void;
  onDelete: (id: string) => void;
  onPaid: (row: FinanceRecord) => void;
  emptyText: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1100px] text-left">
        <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-400">
          <tr>
            <th className="px-5 py-3">Cliente</th>
            <th className="px-5 py-3">Tipo</th>
            <th className="px-5 py-3">Status</th>
            <th className="px-5 py-3">Contrato</th>
            <th className="px-5 py-3">Parcela</th>
            <th className="px-5 py-3">Vencimento</th>
            <th className="px-5 py-3">ADM</th>
            <th className="px-5 py-3">Vendedor</th>
            <th className="px-5 py-3 text-right">Valor</th>
            <th className="px-5 py-3 text-right">Ações</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {rows.length ? (
            rows.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50">
                <td className="px-5 py-4">
                  <button onClick={() => onOpen(row)} className="text-left">
                    <p className="text-sm font-bold text-slate-900">
                      {row.clientName}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {row.phone || row.cpfCnpj || "Sem contato"}
                    </p>
                  </button>
                </td>

                <td className="px-5 py-4 text-sm text-slate-500">
                  {typeLabel(row.type)}
                </td>

                <td className="px-5 py-4">
                  <Badge className={statusClass(row.status)}>
                    {statusLabel(row.status)}
                  </Badge>
                </td>

                <td className="px-5 py-4 text-sm text-slate-500">
                  {row.contractNumber || "-"}
                </td>

                <td className="px-5 py-4 text-sm text-slate-500">
                  {row.installmentLabel || "-"}
                </td>

                <td className="px-5 py-4 text-sm text-slate-500">
                  {dateBR(row.dueDate)}
                </td>

                <td className="px-5 py-4 text-sm text-slate-500">
                  {row.admName || "-"}
                </td>

                <td className="px-5 py-4 text-sm text-slate-500">
                  {row.sellerName || "-"}
                </td>

                <td className="px-5 py-4 text-right text-sm font-bold text-slate-900">
                  {money(row.amount)}
                </td>

                <td className="px-5 py-4">
                  <div className="flex justify-end gap-1">
                    {row.status !== "PAGO" && (
                      <button
                        onClick={() => onPaid(row)}
                        className="rounded-lg border border-emerald-200 p-2 text-emerald-600 hover:bg-emerald-50"
                        title="Marcar como pago"
                      >
                        <Check size={14} />
                      </button>
                    )}

                    <button
                      onClick={() => onEdit(row)}
                      className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
                      title="Editar"
                    >
                      <Pencil size={14} />
                    </button>

                    <button
                      onClick={() => onDelete(row.id)}
                      className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
                      title="Excluir"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={10}
                className="px-5 py-12 text-center text-sm text-slate-400"
              >
                {emptyText}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function ExpenseTable({
  rows,
  onEdit,
  onDelete,
}: {
  rows: ExpenseRecord[];
  onEdit: (row: ExpenseRecord) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[850px] text-left">
        <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-400">
          <tr>
            <th className="px-5 py-3">Data</th>
            <th className="px-5 py-3">Categoria</th>
            <th className="px-5 py-3">Descrição</th>
            <th className="px-5 py-3">Responsável</th>
            <th className="px-5 py-3">Status</th>
            <th className="px-5 py-3 text-right">Valor</th>
            <th className="px-5 py-3 text-right">Ações</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {rows.length ? (
            rows.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50">
                <td className="px-5 py-4 text-sm text-slate-500">
                  {dateBR(row.date)}
                </td>
                <td className="px-5 py-4 text-sm font-bold text-slate-900">
                  {row.category}
                </td>
                <td className="px-5 py-4 text-sm text-slate-500">
                  {row.description}
                </td>
                <td className="px-5 py-4 text-sm text-slate-500">
                  {row.responsible || "-"}
                </td>
                <td className="px-5 py-4">
                  <Badge className={statusClass(row.status)}>
                    {statusLabel(row.status)}
                  </Badge>
                </td>
                <td className="px-5 py-4 text-right text-sm font-bold text-slate-900">
                  {money(row.value)}
                </td>
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => onEdit(row)}
                      className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => onDelete(row.id)}
                      className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={7}
                className="px-5 py-12 text-center text-sm text-slate-400"
              >
                Nenhuma saída cadastrada.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function ReportTable({
  firstHeader,
  rows,
}: {
  firstHeader: string;
  rows: { label: string; quantity: number; amount: number }[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-left">
        <thead className="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-400">
          <tr>
            <th className="py-3">{firstHeader}</th>
            <th className="py-3 text-right">Qtd.</th>
            <th className="py-3 text-right">Valor</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {rows.map((item) => (
            <tr key={item.label}>
              <td className="py-3 text-sm font-bold text-slate-800">
                {item.label}
              </td>
              <td className="py-3 text-right text-sm text-slate-500">
                {item.quantity}
              </td>
              <td className="py-3 text-right text-sm font-bold text-slate-950">
                {money(item.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RankingPanel({
  title,
  icon,
  data,
}: {
  title: string;
  icon: React.ReactNode;
  data: { label: string; value: number }[];
}) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <Panel className="p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-slate-950">{title}</h3>
        <div className="text-slate-500">{icon}</div>
      </div>

      <div className="mt-5 space-y-4">
        {data.length ? (
          data.slice(0, 8).map((item) => {
            const width = Math.max(5, Math.min(100, (item.value / max) * 100));

            return (
              <div key={item.label}>
                <div className="mb-1 flex justify-between gap-3 text-sm">
                  <span className="truncate font-bold text-slate-700">
                    {item.label}
                  </span>
                  <span className="shrink-0 font-bold text-slate-950">
                    {money(item.value)}
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-slate-950"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-slate-400">Sem dados no período.</p>
        )}
      </div>
    </Panel>
  );
}

function Line({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={strong ? "font-black text-slate-950" : "text-slate-500"}>
        {label}
      </span>
      <span
        className={strong ? "font-black text-slate-950" : "font-bold text-slate-800"}
      >
        {value}
      </span>
    </div>
  );
}

function Info({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-[11px] font-bold uppercase text-slate-400">{title}</p>
      <p className="mt-1 truncate text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}

function InsightCard({
  title,
  value,
  text,
  icon,
}: {
  title: string;
  value: string;
  text: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-black text-slate-950">{title}</p>
        <div className="text-slate-500">{icon}</div>
      </div>

      <p className="mt-3 text-xl font-black text-slate-950">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <h3 className="truncate text-xl font-black text-slate-950">{title}</h3>

          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-950"
          >
            <X size={17} />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
