"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  CalendarDays,
  Car,
  CheckCircle2,
  CreditCard,
  Info,
  Lock,
  Search,
  Sparkles,
  TrendingUp,
  User,
  UserRound,
  Users,
  ShieldCheck,
  Gauge,
  ChevronRight,
  FlaskConical,
} from "lucide-react";

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

  if (mesDiff < 0 || (mesDiff === 0 && hoje.getDate() < nascimento.getDate())) {
    idade--;
  }

  return idade;
}

function gerarProbabilidadeBase(cpf: string) {
  const numeros = cpf.split("").map(Number);
  const soma = numeros.reduce((acc, n, index) => acc + n * (index + 1), 0);
  return 80 + (soma % 21); // 80 a 100
}

function gerarRisco(probabilidade: number): "Baixo" | "Médio" {
  return probabilidade >= 90 ? "Baixo" : "Médio";
}

function gerarStatus(): "Aprovado" {
  return "Aprovado";
}

function getStatusConfig(_: ClienteConsulta["status"]) {
  return {
    label: "favorável",
    chip: "Aprovado",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    text: "",
  };
}

function getTipoVeiculoLabel(tipo: TipoVeiculo) {
  return tipo === "zero" ? "Carro 0 km" : "Carro seminovo";
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
        ? "Simulação com perfil favorável para entrada reduzida, apenas para apresentação."
        : "Simulação com perfil favorável para negociação comercial, apenas para apresentação.",
    observacaoComercial: `Resultado para o veículo ${carro}, categoria ${getTipoVeiculoLabel(
      tipoVeiculo
    )}, com atendimento vinculado ao vendedor ${nomeVendedor}.`,
    proximoPasso:
      "Aprovado, Favorável para negociação comercial. Encaminhar para equipe de vendas para contato e fechamento.",
  };
}

function normalizarRespostaCpf(payload: Record<string, any>, cpfConsultado: string): ClienteConsulta {
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
    Math.min(100, Number.isNaN(probabilidadeBase) ? gerarProbabilidadeBase(cpfConsultado) : probabilidadeBase)
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

function CardInfo({
  icon,
  label,
  value,
  extra,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <div className="flex gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-1 break-words text-sm font-semibold text-slate-900 md:text-base">
            {value}
          </p>
          {extra ? <div className="mt-2">{extra}</div> : null}
        </div>
      </div>
    </div>
  );
}

function StatusBar({ value }: { value: number }) {
  const width = Math.max(8, Math.min(100, value));

  return (
    <div className="mt-2">
      <div className="mb-1 flex items-center justify-between text-[11px] text-slate-500">
        <span>Probabilidade</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-slate-900 transition-all"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
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
    throw new Error(data?.error || "Não foi possível carregar os dados da FIPE.");
  }

  return data as T;
}

export default function ConsultaClientePage() {
  const [cpf, setCpf] = useState("");
  const [cliente, setCliente] = useState<ClienteConsulta | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingFipe, setLoadingFipe] = useState(false);
  const [erro, setErro] = useState("");

  const [tipoVeiculo, setTipoVeiculo] = useState<TipoVeiculo>("zero");
  const [vendedor, setVendedor] = useState("");

  const [marcas, setMarcas] = useState<FipeMarca[]>([]);
  const [modelos, setModelos] = useState<FipeModelo[]>([]);
  const [anos, setAnos] = useState<FipeAno[]>([]);

  const [marcaCodigo, setMarcaCodigo] = useState("");
  const [modeloCodigo, setModeloCodigo] = useState("");
  const [anoCodigo, setAnoCodigo] = useState("");

  const [fipeSelecionada, setFipeSelecionada] = useState<FipeDetalhe | null>(null);

  const nomeCarro = useMemo(() => {
    if (!fipeSelecionada) return "";
    return `${fipeSelecionada.marca} ${fipeSelecionada.modelo} ${fipeSelecionada.ano}`.trim();
  }, [fipeSelecionada]);

  const statusConfig = useMemo(
    () => (cliente ? getStatusConfig(cliente.status) : null),
    [cliente]
  );

  const preAnalise = useMemo(() => {
    if (!cliente) return null;
    return gerarPreAnalise(cliente, tipoVeiculo, nomeCarro, vendedor);
  }, [cliente, tipoVeiculo, nomeCarro, vendedor]);

  useEffect(() => {
    async function carregarMarcas() {
      try {
        setLoadingFipe(true);
        setErro("");
        const data = await fetchJson<FipeMarca[]>("/api/fipe/marcas");
        setMarcas(Array.isArray(data) ? data : []);
      } catch (error) {
        setMarcas([]);
        setErro(error instanceof Error ? error.message : "Erro ao carregar marcas.");
      } finally {
        setLoadingFipe(false);
      }
    }

    carregarMarcas();
  }, []);

  useEffect(() => {
    async function carregarModelos() {
      if (!marcaCodigo) return;

      try {
        setLoadingFipe(true);
        setErro("");
        const data = await fetchJson<{ modelos?: FipeModelo[] } | FipeModelo[]>(
          `/api/fipe/modelos?marca=${encodeURIComponent(marcaCodigo)}`
        );

        const lista = Array.isArray(data) ? data : data?.modelos || [];
        setModelos(lista);
      } catch (error) {
        setModelos([]);
        setErro(error instanceof Error ? error.message : "Erro ao carregar modelos.");
      } finally {
        setLoadingFipe(false);
      }
    }

    setModeloCodigo("");
    setAnoCodigo("");
    setModelos([]);
    setAnos([]);
    setFipeSelecionada(null);

    if (marcaCodigo) {
      carregarModelos();
    }
  }, [marcaCodigo]);

  useEffect(() => {
    async function carregarAnos() {
      if (!marcaCodigo || !modeloCodigo) return;

      try {
        setLoadingFipe(true);
        setErro("");
        const data = await fetchJson<FipeAno[]>(
          `/api/fipe/anos?marca=${encodeURIComponent(marcaCodigo)}&modelo=${encodeURIComponent(
            modeloCodigo
          )}`
        );
        setAnos(Array.isArray(data) ? data : []);
      } catch (error) {
        setAnos([]);
        setErro(error instanceof Error ? error.message : "Erro ao carregar anos.");
      } finally {
        setLoadingFipe(false);
      }
    }

    setAnoCodigo("");
    setAnos([]);
    setFipeSelecionada(null);

    if (marcaCodigo && modeloCodigo) {
      carregarAnos();
    }
  }, [marcaCodigo, modeloCodigo]);

  useEffect(() => {
    async function carregarDetalhe() {
      if (!marcaCodigo || !modeloCodigo || !anoCodigo) return;

      try {
        setLoadingFipe(true);
        setErro("");
        const detalhe = await fetchJson<Record<string, any>>(
          `/api/fipe/detalhe?marca=${encodeURIComponent(marcaCodigo)}&modelo=${encodeURIComponent(
            modeloCodigo
          )}&ano=${encodeURIComponent(anoCodigo)}`
        );

        setFipeSelecionada({
          codigoFipe: detalhe.codigoFipe || detalhe.codigo_fipe || detalhe.codigo || "",
          marca: detalhe.marca || "",
          modelo: detalhe.modelo || "",
          ano: detalhe.anoModelo?.toString?.() || detalhe.ano || detalhe.ano_modelo || "",
          valor: detalhe.valor || detalhe.preco || "",
          combustivel: detalhe.combustivel || "",
        });
      } catch (error) {
        setFipeSelecionada(null);
        setErro(error instanceof Error ? error.message : "Erro ao carregar veículo.");
      } finally {
        setLoadingFipe(false);
      }
    }

    setFipeSelecionada(null);

    if (marcaCodigo && modeloCodigo && anoCodigo) {
      carregarDetalhe();
    }
  }, [marcaCodigo, modeloCodigo, anoCodigo]);

  async function handleConsultar() {
    const cpfLimpo = onlyDigits(cpf);
    setErro("");

    if (cpfLimpo.length !== 11) {
      setCliente(null);
      setErro("Digite um CPF válido com 11 números.");
      return;
    }

    if (!vendedor.trim()) {
      setErro("Informe o nome do vendedor.");
      return;
    }

    if (!fipeSelecionada?.codigoFipe) {
      setErro("Selecione o carro pela tabela FIPE para fazer a pré-análise.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`/api/consultar-cpf?ts=${Date.now()}`, {
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
            codigoFipe: fipeSelecionada.codigoFipe,
            marca: fipeSelecionada.marca,
            modelo: fipeSelecionada.modelo,
            ano: fipeSelecionada.ano,
            valor: fipeSelecionada.valor,
            combustivel: fipeSelecionada.combustivel,
          },
        }),
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Não foi possível consultar o CPF.");
      }

      setCliente(normalizarRespostaCpf(data, cpfLimpo));
    } catch (error) {
      setCliente(null);
      setErro(error instanceof Error ? error.message : "Erro ao consultar CPF.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-3 py-4 md:px-6 md:py-6">
      <div className="mx-auto mt-16 w-full max-w-7xl space-y-5 md:mt-20">
        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-5 p-5 md:grid-cols-[1.4fr_0.9fr] md:p-7">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm">
                <Search className="h-7 w-7" />
              </div>

              <div className="min-w-0">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <Sparkles className="h-4 w-4" />
                  Pré-análise com FIPE integrada
                </div>

                <h1 className="text-2xl font-bold tracking-tight text-slate-950 md:text-4xl">
                  Consulta de Cliente e Veículo
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
                  Selecione o veículo pela FIPE para evitar erros de digitação e gerar uma
                  pré-análise comercial mais limpa, rápida e precisa.
                </p>
              </div>
            </div>



          </div>
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.5fr_0.85fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-800">
                <Car className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-950 md:text-xl">
                  Dados da Consulta
                </h2>
                <p className="text-sm text-slate-500">
                  Preencha os dados e selecione o veículo pela tabela FIPE
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  CPF do Cliente
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    value={cpf}
                    onChange={(e) => setCpf(maskCpf(e.target.value))}
                    placeholder="Digite o CPF do cliente"
                    className="h-12 w-full rounded-2xl border border-slate-300 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Tipo do Veículo
                </label>
                <select
                  value={tipoVeiculo}
                  onChange={(e) => setTipoVeiculo(e.target.value as TipoVeiculo)}
                  className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                >
                  <option value="zero">Carro 0 km</option>
                  <option value="seminovo">Carro seminovo</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Marca
                </label>
                <select
                  value={marcaCodigo}
                  onChange={(e) => setMarcaCodigo(e.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                >
                  <option value="">Selecione a marca</option>
                  {marcas.map((marca) => (
                    <option key={marca.codigo} value={marca.codigo}>
                      {marca.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Modelo
                </label>
                <select
                  value={modeloCodigo}
                  onChange={(e) => setModeloCodigo(e.target.value)}
                  disabled={!marcaCodigo}
                  className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                >
                  <option value="">Selecione o modelo</option>
                  {modelos.map((modelo) => (
                    <option key={modelo.codigo} value={modelo.codigo}>
                      {modelo.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Ano
                </label>
                <select
                  value={anoCodigo}
                  onChange={(e) => setAnoCodigo(e.target.value)}
                  disabled={!modeloCodigo}
                  className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                >
                  <option value="">Selecione o ano</option>
                  {anos.map((ano) => (
                    <option key={ano.codigo} value={ano.codigo}>
                      {ano.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Nome do Vendedor
                </label>
                <div className="relative">
                  <BadgeCheck className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    value={vendedor}
                    onChange={(e) => setVendedor(e.target.value)}
                    placeholder="Digite o nome do vendedor"
                    className="h-12 w-full rounded-2xl border border-slate-300 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
              <CardInfo
                icon={<Car className="h-5 w-5" />}
                label="Carro selecionado"
                value={nomeCarro || "Nenhum carro selecionado"}
              />
              <CardInfo
                icon={<Info className="h-5 w-5" />}
                label="Código FIPE"
                value={fipeSelecionada?.codigoFipe || "Não informado"}
              />
              <CardInfo
                icon={<Gauge className="h-5 w-5" />}
                label="Valor FIPE"
                value={fipeSelecionada?.valor || "Não informado"}
              />
            </div>

            {loadingFipe ? (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Carregando opções da tabela FIPE...
              </div>
            ) : null}

            <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-500 md:text-sm">
                <Lock className="h-4 w-4" />
                <span>Dados protegidos e consulta associada ao veículo selecionado.</span>
              </div>

              <button
                onClick={handleConsultar}
                disabled={loading}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Search className="h-5 w-5" />
                {loading ? "Consultando..." : "Fazer pré-análise"}
              </button>
            </div>

            {erro ? (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {erro}
              </div>
            ) : null}
          </div>

          <aside className="space-y-5">
            <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-800">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-950">Resumo rápido</h3>
                  <p className="text-sm text-slate-500">Seleção atual da consulta</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Veículo
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {nomeCarro || "Aguardando seleção"}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Tipo
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {getTipoVeiculoLabel(tipoVeiculo)}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Vendedor
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {vendedor || "Não informado"}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
                <Sparkles className="h-4 w-4" />
                Seleção exata pela FIPE
              </div>

              <h3 className="text-lg font-bold">Mais precisão na pré-análise</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                A escolha do carro deixa de ser digitada manualmente e passa a ser
                selecionada diretamente pela tabela FIPE.
              </p>

              <div className="mt-4 space-y-2 text-sm text-slate-300">
                <div className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-emerald-300" />
                  <span>Evita erro de digitação</span>
                </div>
                <div className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-emerald-300" />
                  <span>Padroniza o veículo consultado</span>
                </div>
                <div className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-emerald-300" />
                  <span>Melhora a consistência no banco</span>
                </div>
              </div>
            </section>
          </aside>
        </section>

        {cliente && preAnalise && statusConfig ? (
          <>
            <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <CardInfo
                icon={<TrendingUp className="h-5 w-5" />}
                label="Probabilidade"
                value={`${cliente.probabilidadeAprovacao}%`}
                extra={<StatusBar value={cliente.probabilidadeAprovacao} />}
              />
              <CardInfo
                icon={<ShieldCheck className="h-5 w-5" />}
                label="Risco"
                value={cliente.riscoCredito}
              />
              <CardInfo
                icon={<BadgeCheck className="h-5 w-5" />}
                label="Status"
                value={cliente.status}
              />
              <CardInfo
                icon={<Gauge className="h-5 w-5" />}
                label="Valor FIPE"
                value={fipeSelecionada?.valor || "Não informado"}
              />
            </section>

            <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.35fr_1fr]">
              <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-800">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-950 md:text-xl">
                        Dados do Cliente
                      </h2>
                      <p className="text-sm text-slate-500">Resultado da consulta do CPF</p>
                    </div>
                  </div>

                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Dados
                  </span>
                </div>

                <div className="space-y-3">
                  <CardInfo
                    icon={<UserRound className="h-5 w-5" />}
                    label="Nome completo"
                    value={cliente.nome}
                  />

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <CardInfo
                      icon={<CreditCard className="h-5 w-5" />}
                      label="CPF"
                      value={maskCpf(cliente.cpf)}
                    />
                    <CardInfo
                      icon={<CalendarDays className="h-5 w-5" />}
                      label="Data de nascimento"
                      value={cliente.dataNascimento}
                      extra={
                        cliente.idade > 0 ? (
                          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                            {cliente.idade} anos
                          </span>
                        ) : null
                      }
                    />
                  </div>

                  <CardInfo
                    icon={<BadgeCheck className="h-5 w-5" />}
                    label="Nome da mãe"
                    value={cliente.nomeMae}
                  />
                </div>
              </div>

              <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                <div className="bg-slate-950 p-5 text-white md:p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white">
                      <Car className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold md:text-xl">Pré-análise do Veículo</h2>
                      <p className="text-sm text-slate-300">Resumo do enquadramento comercial</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        Veículo selecionado
                      </p>
                      <p className="mt-2 text-2xl font-bold text-white">
                        {preAnalise.nomeCarro}
                      </p>
                      <p className="mt-2 text-sm text-slate-300">
                        {getTipoVeiculoLabel(preAnalise.tipoVeiculo)}
                      </p>
                    </div>

                    <div
                      className={`inline-flex rounded-full border px-4 py-2 text-xs font-semibold ${statusConfig.badge}`}
                    >
                      {statusConfig.chip}
                    </div>

                    <p className="text-sm leading-6 text-slate-300">
                      {statusConfig.text}
                    </p>
                  </div>
                </div>

                <div className="p-5 md:p-6">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-3xl bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        Probabilidade
                      </p>
                      <p className="mt-2 text-2xl font-bold text-slate-950">
                        {cliente.probabilidadeAprovacao}%
                      </p>
                    </div>

                    <div className="rounded-3xl bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Status</p>
                      <p className="mt-2 text-xl font-bold text-slate-950">
                        {cliente.status}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
                      <div>
                        <p className="text-sm font-semibold text-emerald-800">
                          Próximo passo
                        </p>
                        <p className="mt-1 text-sm leading-6 text-emerald-700">
                          {preAnalise.proximoPasso}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.55fr_0.85fr]">
              <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-800">
                    <Info className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-950 md:text-xl">
                      Resumo da Pré-análise
                    </h2>
                    <p className="text-sm text-slate-500">Detalhamento comercial da consulta</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Veículo</p>
                    <p className="mt-2 text-lg font-bold text-slate-950">
                      {preAnalise.nomeCarro}
                    </p>
                    <span className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                      {getTipoVeiculoLabel(preAnalise.tipoVeiculo)}
                    </span>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Vendedor</p>
                    <p className="mt-2 text-lg font-bold text-slate-950">
                      {preAnalise.vendedor}
                    </p>
                    <span className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                      Atendimento vinculado
                    </span>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Risco</p>
                    <p className="mt-2 text-2xl font-bold text-slate-950">
                      {cliente.riscoCredito}
                    </p>
                    <span className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                      Dados
                    </span>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Status</p>
                    <p className="mt-2 text-2xl font-bold text-slate-950">
                      {cliente.status}
                    </p>
                    <span className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                      Resultado
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">Perfil de entrada</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {preAnalise.perfilEntrada}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">Observação comercial</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {preAnalise.observacaoComercial}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-800">
                    <Info className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-950 md:text-xl">
                      Última Consulta
                    </h2>
                    <p className="text-sm text-slate-500">Histórico desta análise</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {cliente.historico.map((item: HistoricoConsulta) => (
                    <div
                      key={`${item.data}-${item.descricao}`}
                      className="relative rounded-3xl border border-slate-200 bg-slate-50 p-4 pl-6"
                    >
                      <span className="absolute left-3 top-6 h-2.5 w-2.5 rounded-full bg-slate-900" />
                      <p className="text-sm font-semibold text-slate-900">{item.data}</p>
                      <p className="mt-1 text-sm text-slate-500">{item.descricao}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}