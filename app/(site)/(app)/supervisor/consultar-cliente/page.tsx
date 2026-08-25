"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Car,
  Check,
  ChevronDown,
  ClipboardCheck,
  CreditCard,
  FileSearch,
  History,
  Loader2,
  Search,
  ShieldCheck,
  User,
  UserCheck,
  UserRound,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

type HistoricoConsulta = {
  data: string;
  descricao: string;
};

type ClienteConsulta = {
  nome: string;
  cpf: string;
  dataNascimento: string;
  idade: number;
  nomeMae: string;
  probabilidadeAprovacao: number;
  riscoCredito: "Baixo" | "Médio";
  status: "Aprovado";
  historico: HistoricoConsulta[];
};

type TipoVeiculo = "zero" | "seminovo";

type PreAnaliseVeiculo = {
  tipoVeiculo: TipoVeiculo;
  nomeCarro: string;
  vendedor: string;
  perfilEntrada: string;
  observacaoComercial: string;
  proximoPasso: string;
};

type FipeMarca = {
  codigo: string;
  nome: string;
};

type FipeModelo = {
  codigo: string;
  nome: string;
};

type FipeAno = {
  codigo: string;
  nome: string;
};

type FipeDetalhe = {
  codigoFipe: string;
  marca: string;
  modelo: string;
  ano: string;
  valor?: string;
  combustivel?: string;
};

/* =========================================================
   HELPERS
========================================================= */

function maskCpf(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function calcularIdade(dataNascimento?: string) {
  if (!dataNascimento) return 0;

  const partes = dataNascimento.split("/");

  if (partes.length !== 3) return 0;

  const [dia, mes, ano] = partes.map(Number);

  if (!dia || !mes || !ano) return 0;

  const nascimento = new Date(ano, mes - 1, dia);
  const hoje = new Date();

  let idade = hoje.getFullYear() - nascimento.getFullYear();

  const mesDiff = hoje.getMonth() - nascimento.getMonth();

  if (
    mesDiff < 0 ||
    (mesDiff === 0 && hoje.getDate() < nascimento.getDate())
  ) {
    idade--;
  }

  return idade;
}

function gerarProbabilidadeBase(cpf: string) {
  const numeros = cpf.split("").map(Number);

  const soma = numeros.reduce(
    (acc, n, index) => acc + n * (index + 1),
    0
  );

  return 80 + (soma % 21);
}

function gerarRisco(probabilidade: number): "Baixo" | "Médio" {
  return probabilidade >= 90 ? "Baixo" : "Médio";
}

function gerarStatus(): "Aprovado" {
  return "Aprovado";
}

function getTipoVeiculoLabel(tipo: TipoVeiculo) {
  return tipo === "zero" ? "0 km" : "Seminovo";
}

function gerarPreAnalise(
  _cliente: ClienteConsulta,
  tipoVeiculo: TipoVeiculo,
  nomeCarro: string,
  vendedor: string
): PreAnaliseVeiculo {
  const carro = nomeCarro.trim() || "Veículo não informado";
  const nomeVendedor = vendedor.trim() || "Vendedor não informado";

  return {
    tipoVeiculo,
    nomeCarro: carro,
    vendedor: nomeVendedor,

    perfilEntrada:
      tipoVeiculo === "zero"
        ? "Perfil favorável para entrada reduzida (simulação)."
        : "Perfil favorável para negociação comercial (simulação).",

    observacaoComercial: `Veículo ${carro} · ${getTipoVeiculoLabel(
      tipoVeiculo
    )} · Vendedor: ${nomeVendedor}.`,

    proximoPasso:
      "Favorável para negociação. Encaminhar para o time de vendas.",
  };
}

function normalizarRespostaCpf(
  payload: Record<string, any>,
  cpfConsultado: string
): ClienteConsulta {
  const nome =
    payload.nome ||
    payload.name ||
    payload.nome_completo ||
    payload.fullName ||
    payload.cliente?.nome ||
    "Cliente localizado";

  const dataNascimento =
    payload.dataNascimento ||
    payload.birth_date ||
    payload.data_nascimento ||
    payload.nascimento ||
    payload.cliente?.dataNascimento ||
    "--/--/----";

  const nomeMae =
    payload.nomeMae ||
    payload.mother_name ||
    payload.nome_mae ||
    payload.motherName ||
    payload.cliente?.nomeMae ||
    "Não informado";

  const probabilidadeBase = Number(
    payload.probabilidadeAprovacao ??
      payload.approval_probability ??
      gerarProbabilidadeBase(cpfConsultado)
  );

  const probabilidadeAprovacao = Math.max(
    80,
    Math.min(
      100,
      Number.isNaN(probabilidadeBase)
        ? gerarProbabilidadeBase(cpfConsultado)
        : probabilidadeBase
    )
  );

  return {
    nome,
    cpf: cpfConsultado,
    dataNascimento,
    idade: calcularIdade(dataNascimento),
    nomeMae,
    probabilidadeAprovacao,
    riscoCredito: gerarRisco(probabilidadeAprovacao),
    status: gerarStatus(),

    historico: [
      {
        data: new Date().toLocaleString("pt-BR"),
        descricao: "Consulta realizada",
      },
    ],
  };
}

async function fetchJson<T>(url: string) {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
    },
    cache: "no-store",
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.error || "Não foi possível carregar os dados da FIPE."
    );
  }

  return data as T;
}

/* =========================================================
   COMPONENTES
========================================================= */

function Field({
  label,
  hint,
  required = false,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-[12px] font-semibold tracking-wide text-zinc-700">
          {label}

          {required && (
            <span className="ml-1 text-red-500">*</span>
          )}
        </span>

        {hint && (
          <span className="text-[10px] text-zinc-400">
            {hint}
          </span>
        )}
      </div>

      {children}
    </label>
  );
}

function SectionTitle({
  icon: Icon,
  eyebrow,
  title,
  description,
}: {
  icon: React.ElementType;
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">
          {eyebrow}
        </p>

        <h2 className="mt-1 text-[16px] font-bold tracking-tight text-zinc-950">
          {title}
        </h2>

        {description && (
          <p className="mt-1 text-[12px] leading-relaxed text-zinc-500">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

function DataRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: React.ElementType;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-zinc-100 py-3 last:border-0">
      <div className="flex min-w-0 items-center gap-2">
        {Icon && (
          <Icon className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
        )}

        <span className="shrink-0 text-[12px] text-zinc-500">
          {label}
        </span>
      </div>

      <span className="truncate text-right text-[13px] font-semibold text-zinc-900">
        {value}
      </span>
    </div>
  );
}

function SelectArrow() {
  return (
    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
  );
}

function MetricCard({
  label,
  value,
  description,
  tone = "neutral",
  progress,
}: {
  label: string;
  value: string;
  description?: string;
  tone?: "neutral" | "green" | "amber";
  progress?: number;
}) {
  const toneClasses = {
    neutral: "bg-white border-zinc-200",
    green: "bg-emerald-50/60 border-emerald-100",
    amber: "bg-amber-50/60 border-amber-100",
  };

  return (
    <div
      className={`rounded-2xl border p-4 ${toneClasses[tone]}`}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400">
        {label}
      </p>

      <p className="mt-2 text-[22px] font-bold tracking-tight text-zinc-950">
        {value}
      </p>

      {description && (
        <p className="mt-1 text-[11px] text-zinc-500">
          {description}
        </p>
      )}

      {typeof progress === "number" && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-200">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progress, 100)}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full bg-emerald-500"
          />
        </div>
      )}
    </div>
  );
}

/* =========================================================
   PÁGINA
========================================================= */

export default function ConsultaClientePage() {
  const [cpf, setCpf] = useState("");
  const [cliente, setCliente] = useState<ClienteConsulta | null>(null);

  const [loading, setLoading] = useState(false);
  const [loadingFipe, setLoadingFipe] = useState(false);
  const [erro, setErro] = useState("");

  const [tipoVeiculo, setTipoVeiculo] =
    useState<TipoVeiculo>("zero");

  const [vendedor, setVendedor] = useState("");

  const [marcas, setMarcas] = useState<FipeMarca[]>([]);
  const [modelos, setModelos] = useState<FipeModelo[]>([]);
  const [anos, setAnos] = useState<FipeAno[]>([]);

  const [marcaCodigo, setMarcaCodigo] = useState("");
  const [modeloCodigo, setModeloCodigo] = useState("");
  const [anoCodigo, setAnoCodigo] = useState("");

  const [fipeSelecionada, setFipeSelecionada] =
    useState<FipeDetalhe | null>(null);

  const nomeCarro = useMemo(() => {
    if (!fipeSelecionada) return "";

    return `${fipeSelecionada.marca} ${fipeSelecionada.modelo} ${fipeSelecionada.ano}`.trim();
  }, [fipeSelecionada]);

  const preAnalise = useMemo(() => {
    if (!cliente) return null;

    return gerarPreAnalise(
      cliente,
      tipoVeiculo,
      nomeCarro,
      vendedor
    );
  }, [cliente, tipoVeiculo, nomeCarro, vendedor]);

  const progresso = useMemo(() => {
    let total = 0;

    if (onlyDigits(cpf).length === 11) total++;
    if (vendedor.trim()) total++;
    if (tipoVeiculo) total++;
    if (marcaCodigo) total++;
    if (modeloCodigo) total++;
    if (anoCodigo) total++;

    return Math.round((total / 6) * 100);
  }, [
    cpf,
    vendedor,
    tipoVeiculo,
    marcaCodigo,
    modeloCodigo,
    anoCodigo,
  ]);

  /* =========================================================
     FIPE - MARCAS
  ========================================================= */

  useEffect(() => {
    async function carregarMarcas() {
      try {
        setLoadingFipe(true);
        setErro("");

        const data = await fetchJson<FipeMarca[]>(
          "/api/fipe/marcas"
        );

        setMarcas(Array.isArray(data) ? data : []);
      } catch (error) {
        setMarcas([]);

        setErro(
          error instanceof Error
            ? error.message
            : "Erro ao carregar marcas."
        );
      } finally {
        setLoadingFipe(false);
      }
    }

    carregarMarcas();
  }, []);

  /* =========================================================
     FIPE - MODELOS
  ========================================================= */

  useEffect(() => {
    async function carregarModelos() {
      if (!marcaCodigo) return;

      try {
        setLoadingFipe(true);
        setErro("");

        const data = await fetchJson<
          { modelos?: FipeModelo[] } | FipeModelo[]
        >(
          `/api/fipe/modelos?marca=${encodeURIComponent(
            marcaCodigo
          )}`
        );

        const lista = Array.isArray(data)
          ? data
          : data?.modelos || [];

        setModelos(lista);
      } catch (error) {
        setModelos([]);

        setErro(
          error instanceof Error
            ? error.message
            : "Erro ao carregar modelos."
        );
      } finally {
        setLoadingFipe(false);
      }
    }

    setModeloCodigo("");
    setAnoCodigo("");
    setModelos([]);
    setAnos([]);
    setFipeSelecionada(null);

    if (marcaCodigo) carregarModelos();
  }, [marcaCodigo]);

  /* =========================================================
     FIPE - ANOS
  ========================================================= */

  useEffect(() => {
    async function carregarAnos() {
      if (!marcaCodigo || !modeloCodigo) return;

      try {
        setLoadingFipe(true);
        setErro("");

        const data = await fetchJson<FipeAno[]>(
          `/api/fipe/anos?marca=${encodeURIComponent(
            marcaCodigo
          )}&modelo=${encodeURIComponent(modeloCodigo)}`
        );

        setAnos(Array.isArray(data) ? data : []);
      } catch (error) {
        setAnos([]);

        setErro(
          error instanceof Error
            ? error.message
            : "Erro ao carregar anos."
        );
      } finally {
        setLoadingFipe(false);
      }
    }

    setAnoCodigo("");
    setAnos([]);
    setFipeSelecionada(null);

    if (marcaCodigo && modeloCodigo) carregarAnos();
  }, [marcaCodigo, modeloCodigo]);

  /* =========================================================
     FIPE - DETALHE
  ========================================================= */

  useEffect(() => {
    async function carregarDetalhe() {
      if (!marcaCodigo || !modeloCodigo || !anoCodigo) return;

      try {
        setLoadingFipe(true);
        setErro("");

        const detalhe = await fetchJson<Record<string, any>>(
          `/api/fipe/detalhe?marca=${encodeURIComponent(
            marcaCodigo
          )}&modelo=${encodeURIComponent(
            modeloCodigo
          )}&ano=${encodeURIComponent(anoCodigo)}`
        );

        setFipeSelecionada({
          codigoFipe:
            detalhe.codigoFipe ||
            detalhe.codigo_fipe ||
            detalhe.codigo ||
            "",

          marca: detalhe.marca || "",

          modelo: detalhe.modelo || "",

          ano:
            detalhe.anoModelo?.toString?.() ||
            detalhe.ano ||
            detalhe.ano_modelo ||
            "",

          valor:
            detalhe.valor ||
            detalhe.preco ||
            "",

          combustivel:
            detalhe.combustivel ||
            "",
        });
      } catch (error) {
        setFipeSelecionada(null);

        setErro(
          error instanceof Error
            ? error.message
            : "Erro ao carregar veículo."
        );
      } finally {
        setLoadingFipe(false);
      }
    }

    setFipeSelecionada(null);

    if (
      marcaCodigo &&
      modeloCodigo &&
      anoCodigo
    ) {
      carregarDetalhe();
    }
  }, [
    marcaCodigo,
    modeloCodigo,
    anoCodigo,
  ]);

  /* =========================================================
     CONSULTA
  ========================================================= */

  async function handleConsultar() {
    const cpfLimpo = onlyDigits(cpf);

    setErro("");

    if (cpfLimpo.length !== 11) {
      setCliente(null);
      setErro(
        "Digite um CPF válido com 11 números."
      );
      return;
    }

    if (!vendedor.trim()) {
      setErro(
        "Informe o nome do vendedor."
      );
      return;
    }

    if (!fipeSelecionada?.codigoFipe) {
      setErro(
        "Selecione o carro pela tabela FIPE."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `/api/consultar-cpf?ts=${Date.now()}`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
          },

          body: JSON.stringify({
            cpf: cpfLimpo,

            tipoVeiculo,

            nomeCarro,

            vendedor: vendedor.trim(),

            veiculoFipe: {
              codigoFipe:
                fipeSelecionada.codigoFipe,

              marca:
                fipeSelecionada.marca,

              modelo:
                fipeSelecionada.modelo,

              ano:
                fipeSelecionada.ano,

              valor:
                fipeSelecionada.valor,

              combustivel:
                fipeSelecionada.combustivel,
            },
          }),

          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Não foi possível consultar o CPF."
        );
      }

      setCliente(
        normalizarRespostaCpf(
          data,
          cpfLimpo
        )
      );
    } catch (error) {
      setCliente(null);

      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao consultar CPF."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     ESTILOS
  ========================================================= */

  const input =
    "h-11 w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-[13px] font-medium text-zinc-900 outline-none transition-all placeholder:text-zinc-400 hover:border-zinc-300 focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/5 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400";

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <main className="min-h-screen bg-[#f6f7f9] text-zinc-900">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/90 backdrop-blur-xl">

        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-950 text-white shadow-sm">
              <ShieldCheck className="h-5 w-5" />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                Nacional Consórcios
              </p>

              <h1 className="text-[14px] font-bold text-zinc-950">
                Central de análise
              </h1>
            </div>

          </div>

          <div className="hidden items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 sm:flex">

            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

            <span className="text-[11px] font-medium text-zinc-500">
              Sistema operacional
            </span>

          </div>

        </div>

      </header>

      {/* =====================================================
          CONTEÚDO
      ===================================================== */}

      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8 lg:py-10">

        {/* breadcrumb */}

        <div className="mb-6 flex items-center gap-2 text-[11px] text-zinc-400">
          <span>Supervisor</span>
          <span>/</span>
          <span className="font-semibold text-zinc-600">
            Consulta de cliente
          </span>
        </div>

        {/* título */}

        <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">

          <div>

            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 shadow-sm">

              <FileSearch className="h-3.5 w-3.5 text-zinc-500" />

              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                Pré-análise de crédito
              </span>

            </div>

            <h2 className="text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
              Consulta de cliente
            </h2>

            <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-zinc-500">
              Consulte os dados do cliente, selecione o veículo
              pela FIPE e gere uma pré-análise comercial.
            </p>

          </div>

          {/* progresso */}

          <div className="w-full max-w-xs">

            <div className="mb-2 flex items-center justify-between">

              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400">
                Dados preenchidos
              </span>

              <span className="text-[11px] font-bold text-zinc-700">
                {progresso}%
              </span>

            </div>

            <div className="h-1.5 overflow-hidden rounded-full bg-zinc-200">

              <motion.div
                className="h-full rounded-full bg-zinc-950"
                initial={{ width: 0 }}
                animate={{
                  width: `${progresso}%`,
                }}
                transition={{
                  duration: 0.3,
                }}
              />

            </div>

          </div>

        </div>

        {/* ===================================================
            GRID PRINCIPAL
        =================================================== */}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_310px]">

          {/* =================================================
              FORMULÁRIO
          ================================================= */}

          <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">

            {/* topo */}

            <div className="border-b border-zinc-100 px-5 py-5 sm:px-7">

              <SectionTitle
                icon={UserRound}
                eyebrow="Etapa 01"
                title="Dados da consulta"
                description="Informe os dados necessários para iniciar a análise."
              />

            </div>

            <div className="space-y-7 p-5 sm:p-7">

              {/* cliente */}

              <div>

                <div className="mb-4 flex items-center gap-2">

                  <div className="h-1 w-1 rounded-full bg-zinc-950" />

                  <h3 className="text-[12px] font-bold uppercase tracking-[0.12em] text-zinc-600">
                    Cliente e vendedor
                  </h3>

                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                  <Field
                    label="CPF do cliente"
                    required
                    hint="11 números"
                  >

                    <div className="relative">

                      <CreditCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

                      <input
                        value={cpf}
                        onChange={(e) =>
                          setCpf(
                            maskCpf(
                              e.target.value
                            )
                          )
                        }
                        placeholder="000.000.000-00"
                        className={`${input} pl-10`}
                      />

                    </div>

                  </Field>

                  <Field
                    label="Nome do vendedor"
                    required
                  >

                    <div className="relative">

                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

                      <input
                        value={vendedor}
                        onChange={(e) =>
                          setVendedor(
                            e.target.value
                          )
                        }
                        placeholder="Nome do vendedor"
                        className={`${input} pl-10`}
                      />

                    </div>

                  </Field>

                </div>

              </div>

              {/* veículo */}

              <div>

                <div className="mb-4 flex items-center gap-2">

                  <div className="h-1 w-1 rounded-full bg-zinc-950" />

                  <h3 className="text-[12px] font-bold uppercase tracking-[0.12em] text-zinc-600">
                    Veículo
                  </h3>

                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                  <Field
                    label="Tipo do veículo"
                    required
                  >

                    <div className="relative">

                      <Car className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

                      <select
                        value={tipoVeiculo}
                        onChange={(e) =>
                          setTipoVeiculo(
                            e.target.value as TipoVeiculo
                          )
                        }
                        className={`${input} appearance-none pl-10 pr-10`}
                      >

                        <option value="zero">
                          Carro 0 km
                        </option>

                        <option value="seminovo">
                          Carro seminovo
                        </option>

                      </select>

                      <SelectArrow />

                    </div>

                  </Field>

                  <Field
                    label="Marca"
                    required
                  >

                    <div className="relative">

                      <select
                        value={marcaCodigo}
                        onChange={(e) =>
                          setMarcaCodigo(
                            e.target.value
                          )
                        }
                        className={`${input} appearance-none pr-10`}
                      >

                        <option value="">
                          Selecione a marca
                        </option>

                        {marcas.map((m) => (
                          <option
                            key={m.codigo}
                            value={m.codigo}
                          >
                            {m.nome}
                          </option>
                        ))}

                      </select>

                      <SelectArrow />

                    </div>

                  </Field>

                  <Field
                    label="Modelo"
                    required
                  >

                    <div className="relative">

                      <select
                        value={modeloCodigo}
                        onChange={(e) =>
                          setModeloCodigo(
                            e.target.value
                          )
                        }
                        disabled={!marcaCodigo}
                        className={`${input} appearance-none pr-10`}
                      >

                        <option value="">
                          {marcaCodigo
                            ? "Selecione o modelo"
                            : "Escolha a marca primeiro"}
                        </option>

                        {modelos.map((m) => (
                          <option
                            key={m.codigo}
                            value={m.codigo}
                          >
                            {m.nome}
                          </option>
                        ))}

                      </select>

                      <SelectArrow />

                    </div>

                  </Field>

                  <Field
                    label="Ano"
                    required
                  >

                    <div className="relative">

                      <select
                        value={anoCodigo}
                        onChange={(e) =>
                          setAnoCodigo(
                            e.target.value
                          )
                        }
                        disabled={!modeloCodigo}
                        className={`${input} appearance-none pr-10`}
                      >

                        <option value="">
                          {modeloCodigo
                            ? "Selecione o ano"
                            : "Escolha o modelo primeiro"}
                        </option>

                        {anos.map((a) => (
                          <option
                            key={a.codigo}
                            value={a.codigo}
                          >
                            {a.nome}
                          </option>
                        ))}

                      </select>

                      <SelectArrow />

                    </div>

                  </Field>

                </div>

              </div>

              {/* FIPE */}

              <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50">

                <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">

                  <div className="flex items-center gap-2">

                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm">
                      <Car className="h-4 w-4 text-zinc-600" />
                    </div>

                    <div>

                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">
                        Tabela FIPE
                      </p>

                      <p className="text-[12px] font-semibold text-zinc-800">
                        Veículo selecionado
                      </p>

                    </div>

                  </div>

                  {loadingFipe && (
                    <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                  )}

                </div>

                <div className="grid grid-cols-1 divide-y divide-zinc-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0">

                  <div className="p-4">

                    <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                      Veículo
                    </p>

                    <p className="mt-1.5 text-[13px] font-bold leading-snug text-zinc-900">
                      {nomeCarro || "Aguardando seleção"}
                    </p>

                  </div>

                  <div className="p-4">

                    <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                      Código FIPE
                    </p>

                    <p className="mt-1.5 text-[13px] font-bold text-zinc-900">
                      {fipeSelecionada?.codigoFipe || "—"}
                    </p>

                  </div>

                  <div className="p-4">

                    <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                      Valor FIPE
                    </p>

                    <p className="mt-1.5 text-[13px] font-bold text-zinc-900">
                      {fipeSelecionada?.valor || "—"}
                    </p>

                  </div>

                </div>

                {fipeSelecionada?.combustivel && (
                  <div className="border-t border-zinc-200 px-4 py-2.5">

                    <span className="text-[11px] text-zinc-500">
                      Combustível:{" "}
                    </span>

                    <span className="text-[11px] font-semibold text-zinc-700">
                      {fipeSelecionada.combustivel}
                    </span>

                  </div>
                )}

              </div>

              {/* erro */}

              <AnimatePresence>
                {erro && (
                  <motion.div
                    initial={{
                      opacity: 0,
                      y: -5,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    exit={{
                      opacity: 0,
                      y: -5,
                    }}
                    className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-3.5"
                  >

                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />

                    <div>

                      <p className="text-[12px] font-bold text-red-800">
                        Não foi possível continuar
                      </p>

                      <p className="mt-0.5 text-[12px] leading-relaxed text-red-700">
                        {erro}
                      </p>

                    </div>

                  </motion.div>
                )}
              </AnimatePresence>

              {/* botão */}

              <div className="flex flex-col gap-4 border-t border-zinc-100 pt-5 sm:flex-row sm:items-center sm:justify-between">

                <div className="flex items-center gap-2 text-[11px] text-zinc-400">

                  <ShieldCheck className="h-4 w-4" />

                  <span>
                    Dados utilizados somente nesta análise.
                  </span>

                </div>

                <button
                  type="button"
                  onClick={handleConsultar}
                  disabled={loading}
                  className="group inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-zinc-950 px-6 text-[13px] font-bold text-white shadow-lg shadow-zinc-950/10 transition-all hover:-translate-y-0.5 hover:bg-zinc-800 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                >

                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Consultando...
                    </>
                  ) : (
                    <>
                      Fazer pré-análise

                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}

                </button>

              </div>

            </div>

          </section>

          {/* =================================================
              SIDEBAR
          ================================================= */}

          <aside className="space-y-4">

            {/* resumo */}

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">

              <div className="mb-5 flex items-center gap-2">

                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100">
                  <ClipboardCheck className="h-4 w-4 text-zinc-600" />
                </div>

                <div>

                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400">
                    Resumo
                  </p>

                  <p className="text-[13px] font-bold text-zinc-900">
                    Dados atuais
                  </p>

                </div>

              </div>

              <div className="space-y-4">

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                    Tipo de veículo
                  </p>

                  <p className="mt-1 text-[13px] font-semibold text-zinc-900">
                    {getTipoVeiculoLabel(
                      tipoVeiculo
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                    Vendedor
                  </p>

                  <p className="mt-1 truncate text-[13px] font-semibold text-zinc-900">
                    {vendedor || "Aguardando informação"}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                    Veículo
                  </p>

                  <p className="mt-1 text-[13px] font-semibold leading-snug text-zinc-900">
                    {nomeCarro ||
                      "Aguardando seleção"}
                  </p>
                </div>

              </div>

            </div>

            {/* FIPE */}

            <div className="relative overflow-hidden rounded-2xl bg-zinc-950 p-5 text-white shadow-xl">

              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-3xl" />

              <div className="relative">

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                  <Car className="h-4 w-4" />
                </div>

                <p className="mt-4 text-[13px] font-bold">
                  FIPE integrada
                </p>

                <p className="mt-2 text-[12px] leading-relaxed text-zinc-400">
                  O veículo é selecionado diretamente
                  pela base FIPE, reduzindo erros de
                  cadastro e tornando a análise mais
                  consistente.
                </p>

                <div className="mt-5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">

                  <Check className="h-3.5 w-3.5 text-emerald-400" />

                  Dados estruturados

                </div>

              </div>

            </div>

            {/* segurança */}

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5">

              <div className="flex items-start gap-3">

                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <ShieldCheck className="h-4 w-4" />
                </div>

                <div>

                  <p className="text-[12px] font-bold text-emerald-900">
                    Análise protegida
                  </p>

                  <p className="mt-1 text-[11px] leading-relaxed text-emerald-700">
                    A consulta é vinculada ao vendedor
                    e ao veículo selecionado.
                  </p>

                </div>

              </div>

            </div>

          </aside>

        </div>

        {/* ===================================================
            RESULTADO
        =================================================== */}

        <AnimatePresence>

          {cliente && preAnalise && (
            <motion.section
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.45,
              }}
              className="mt-8 space-y-6"
            >

              {/* cabeçalho resultado */}

              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">

                <div>

                  <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5">

                    <Check className="h-3.5 w-3.5 text-emerald-600" />

                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">
                      Análise concluída
                    </span>

                  </div>

                  <h2 className="text-xl font-bold tracking-tight text-zinc-950 sm:text-2xl">
                    Resultado da pré-análise
                  </h2>

                  <p className="mt-1 text-[12px] text-zinc-500">
                    Resultado calculado para{" "}
                    <span className="font-semibold text-zinc-700">
                      {cliente.nome}
                    </span>
                  </p>

                </div>

                <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 shadow-sm">

                  <UserCheck className="h-4 w-4 text-zinc-400" />

                  <span className="text-[11px] text-zinc-500">
                    CPF
                  </span>

                  <span className="text-[12px] font-bold text-zinc-800">
                    {maskCpf(cliente.cpf)}
                  </span>

                </div>

              </div>

              {/* métricas */}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">

                <MetricCard
                  label="Probabilidade"
                  value={`${cliente.probabilidadeAprovacao}%`}
                  description="Indicador de aprovação"
                  tone="green"
                  progress={
                    cliente.probabilidadeAprovacao
                  }
                />

                <MetricCard
                  label="Risco de crédito"
                  value={cliente.riscoCredito}
                  description="Classificação atual"
                  tone={
                    cliente.riscoCredito ===
                    "Baixo"
                      ? "green"
                      : "amber"
                  }
                />

                <MetricCard
                  label="Status"
                  value={cliente.status}
                  description="Resultado da consulta"
                  tone="green"
                />

                <MetricCard
                  label="Valor FIPE"
                  value={
                    fipeSelecionada?.valor ||
                    "—"
                  }
                  description="Referência do veículo"
                />

              </div>

              {/* dados */}

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

                {/* cliente */}

                <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">

                  <div className="border-b border-zinc-100 px-5 py-4">

                    <SectionTitle
                      icon={Users}
                      eyebrow="Cliente"
                      title="Dados pessoais"
                      description="Informações retornadas na consulta."
                    />

                  </div>

                  <div className="px-5 py-2">

                    <DataRow
                      label="Nome"
                      value={cliente.nome}
                      icon={User}
                    />

                    <DataRow
                      label="CPF"
                      value={maskCpf(
                        cliente.cpf
                      )}
                      icon={CreditCard}
                    />

                    <DataRow
                      label="Nascimento"
                      value={
                        cliente.idade > 0
                          ? `${cliente.dataNascimento} · ${cliente.idade} anos`
                          : cliente.dataNascimento
                      }
                    />

                    <DataRow
                      label="Nome da mãe"
                      value={
                        cliente.nomeMae
                      }
                    />

                  </div>

                </div>

                {/* pré-análise */}

                <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">

                  <div className="border-b border-zinc-100 px-5 py-4">

                    <SectionTitle
                      icon={ClipboardCheck}
                      eyebrow="Comercial"
                      title="Pré-análise"
                      description="Resumo para continuidade da negociação."
                    />

                  </div>

                  <div className="space-y-5 p-5">

                    {/* veículo */}

                    <div className="flex items-start gap-3">

                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-100">
                        <Car className="h-5 w-5 text-zinc-600" />
                      </div>

                      <div className="min-w-0">

                        <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-zinc-400">
                          Veículo
                        </p>

                        <p className="mt-1 truncate text-[14px] font-bold text-zinc-950">
                          {preAnalise.nomeCarro}
                        </p>

                        <p className="mt-1 text-[11px] text-zinc-500">
                          {getTipoVeiculoLabel(
                            preAnalise.tipoVeiculo
                          )}{" "}
                          ·{" "}
                          {preAnalise.vendedor}
                        </p>

                      </div>

                    </div>

                    {/* badges */}

                    <div className="flex flex-wrap gap-2">

                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-bold text-emerald-700">

                        <Check className="h-3 w-3" />

                        {cliente.status}

                      </span>

                      <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-[10px] font-bold text-zinc-700">

                        Risco{" "}
                        {cliente.riscoCredito}

                      </span>

                      <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-[10px] font-bold text-zinc-700">

                        {cliente.probabilidadeAprovacao}%

                      </span>

                    </div>

                    {/* próximo passo */}

                    <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">

                      <div className="flex items-start gap-3">

                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100">

                          <ArrowRight className="h-4 w-4 text-emerald-700" />

                        </div>

                        <div>

                          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-emerald-700">
                            Próximo passo
                          </p>

                          <p className="mt-1 text-[12px] leading-relaxed text-emerald-800">
                            {preAnalise.proximoPasso}
                          </p>

                        </div>

                      </div>

                    </div>

                    {/* detalhes */}

                    <div className="grid grid-cols-1 gap-4 border-t border-zinc-100 pt-4 sm:grid-cols-2">

                      <div>

                        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-400">
                          Perfil de entrada
                        </p>

                        <p className="mt-1.5 text-[12px] leading-relaxed text-zinc-600">
                          {preAnalise.perfilEntrada}
                        </p>

                      </div>

                      <div>

                        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-400">
                          Observação
                        </p>

                        <p className="mt-1.5 text-[12px] leading-relaxed text-zinc-600">
                          {preAnalise.observacaoComercial}
                        </p>

                      </div>

                    </div>

                  </div>

                </div>

              </div>

              {/* histórico */}

              <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">

                <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">

                  <SectionTitle
                    icon={History}
                    eyebrow="Auditoria"
                    title="Histórico da consulta"
                    description="Registro das movimentações realizadas."
                  />

                  <span className="hidden rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-bold text-zinc-500 sm:inline-flex">
                    {cliente.historico.length} registro
                    {cliente.historico.length !== 1
                      ? "s"
                      : ""}
                  </span>

                </div>

                <div className="divide-y divide-zinc-100">

                  {cliente.historico.map(
                    (item, index) => (
                      <div
                        key={`${item.data}-${item.descricao}`}
                        className="flex gap-4 px-5 py-4"
                      >

                        <div className="flex flex-col items-center">

                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100">

                            <History className="h-3.5 w-3.5 text-zinc-500" />

                          </div>

                          {index <
                            cliente.historico.length -
                              1 && (
                            <div className="mt-2 h-full w-px bg-zinc-100" />
                          )}

                        </div>

                        <div className="pt-0.5">

                          <p className="text-[12px] font-bold text-zinc-900">
                            {item.descricao}
                          </p>

                          <p className="mt-1 text-[11px] text-zinc-400">
                            {item.data}
                          </p>

                        </div>

                      </div>
                    )
                  )}

                </div>

              </div>

            </motion.section>
          )}

        </AnimatePresence>

      </div>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="mx-auto max-w-7xl px-4 pb-8 pt-2 sm:px-6 lg:px-8">

        <div className="flex flex-col items-center justify-between gap-2 border-t border-zinc-200 pt-5 text-center sm:flex-row sm:text-left">

          <p className="text-[10px] text-zinc-400">
            Central de análise · Nacional Consórcios
          </p>

          <p className="text-[10px] text-zinc-400">
            Pré-análise comercial
          </p>

        </div>

      </footer>

    </main>
  );
}
