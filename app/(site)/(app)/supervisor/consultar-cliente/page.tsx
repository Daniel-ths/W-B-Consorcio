"use client";

import { useEffect, useMemo, useState } from "react";

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

type FipeMarca = { codigo: string; nome: string };
type FipeModelo = { codigo: string; nome: string };
type FipeAno = { codigo: string; nome: string };

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
  if (mesDiff < 0 || (mesDiff === 0 && hoje.getDate() < nascimento.getDate())) idade--;
  return idade;
}

function gerarProbabilidadeBase(cpf: string) {
  const numeros = cpf.split("").map(Number);
  const soma = numeros.reduce((acc, n, index) => acc + n * (index + 1), 0);
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
    throw new Error(data?.error || "Não foi possível carregar os dados da FIPE.");
  }

  return data as T;
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
      <span className="mb-1.5 block text-[13px] font-medium text-zinc-600">
        {label}
      </span>
      {children}
    </label>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5 border-b border-zinc-100 last:border-0">
      <span className="shrink-0 text-[13px] text-zinc-500">{label}</span>
      <span className="text-right text-[14px] font-medium text-zinc-900">
        {value}
      </span>
    </div>
  );
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
    if (marcaCodigo) carregarModelos();
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
    if (marcaCodigo && modeloCodigo) carregarAnos();
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
    if (marcaCodigo && modeloCodigo && anoCodigo) carregarDetalhe();
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
      setErro("Selecione o carro pela tabela FIPE.");
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

  const input =
    "h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-[14px] text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200 disabled:bg-zinc-50 disabled:text-zinc-400";

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-10">
        {/* header */}
        <div className="mb-8">
          <p className="text-[12px] font-medium text-zinc-500">Supervisor</p>
          <h1 className="mt-1 text-xl font-semibold text-zinc-900">
            Consulta de cliente
          </h1>
          <p className="mt-1 text-[13px] text-zinc-500">
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_260px]">
          {/* formulário */}
          <div className="bg-white">
            <div className="border-b border-zinc-200 px-5 py-4">
              <h2 className="text-[15px] font-semibold text-zinc-900">
                Dados da consulta
              </h2>
            </div>

            <div className="space-y-4 p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="CPF do cliente">
                  <input
                    value={cpf}
                    onChange={(e) => setCpf(maskCpf(e.target.value))}
                    placeholder="000.000.000-00"
                    className={input}
                  />
                </Field>

                <Field label="Nome do vendedor">
                  <input
                    value={vendedor}
                    onChange={(e) => setVendedor(e.target.value)}
                    placeholder="Nome do vendedor"
                    className={input}
                  />
                </Field>

                <Field label="Tipo do veículo">
                  <select
                    value={tipoVeiculo}
                    onChange={(e) => setTipoVeiculo(e.target.value as TipoVeiculo)}
                    className={input}
                  >
                    <option value="zero">Carro 0 km</option>
                    <option value="seminovo">Carro seminovo</option>
                  </select>
                </Field>

                <Field label="Marca">
                  <select
                    value={marcaCodigo}
                    onChange={(e) => setMarcaCodigo(e.target.value)}
                    className={input}
                  >
                    <option value="">Selecione</option>
                    {marcas.map((m) => (
                      <option key={m.codigo} value={m.codigo}>
                        {m.nome}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Modelo">
                  <select
                    value={modeloCodigo}
                    onChange={(e) => setModeloCodigo(e.target.value)}
                    disabled={!marcaCodigo}
                    className={input}
                  >
                    <option value="">Selecione</option>
                    {modelos.map((m) => (
                      <option key={m.codigo} value={m.codigo}>
                        {m.nome}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Ano">
                  <select
                    value={anoCodigo}
                    onChange={(e) => setAnoCodigo(e.target.value)}
                    disabled={!modeloCodigo}
                    className={input}
                  >
                    <option value="">Selecione</option>
                    {anos.map((a) => (
                      <option key={a.codigo} value={a.codigo}>
                        {a.nome}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              {/* FIPE resumo */}
              <div className="bg-zinc-50 px-4 py-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-[11px] text-zinc-500">Veículo</p>
                    <p className="mt-0.5 text-[13px] font-medium text-zinc-900">
                      {nomeCarro || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-zinc-500">Código FIPE</p>
                    <p className="mt-0.5 text-[13px] font-medium text-zinc-900">
                      {fipeSelecionada?.codigoFipe || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-zinc-500">Valor FIPE</p>
                    <p className="mt-0.5 text-[13px] font-medium text-zinc-900">
                      {fipeSelecionada?.valor || "—"}
                    </p>
                  </div>
                </div>
                {loadingFipe && (
                  <p className="mt-2 text-[12px] text-zinc-500">Carregando FIPE…</p>
                )}
              </div>

              {erro && (
                <div className="bg-red-50 px-3 py-2.5 text-[13px] text-red-700">
                  {erro}
                </div>
              )}

              <div className="flex flex-col gap-3 border-t border-zinc-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[12px] text-zinc-500">
                  Consulta vinculada ao veículo selecionado
                </p>

                <button
                  type="button"
                  onClick={handleConsultar}
                  disabled={loading}
                  className="inline-flex h-10 items-center justify-center rounded-md bg-zinc-900 px-5 text-[14px] font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Consultando…" : "Fazer pré-análise"}
                </button>
              </div>
            </div>
          </div>

          {/* lateral */}
          <div className="space-y-4">
            <div className="bg-white px-4 py-4">
              <p className="text-[12px] font-medium text-zinc-500">Resumo</p>
              <dl className="mt-3 space-y-3 text-[13px]">
                <div>
                  <dt className="text-zinc-500">Tipo</dt>
                  <dd className="mt-0.5 font-medium text-zinc-900">
                    {getTipoVeiculoLabel(tipoVeiculo)}
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Vendedor</dt>
                  <dd className="mt-0.5 font-medium text-zinc-900">
                    {vendedor || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Veículo</dt>
                  <dd className="mt-0.5 font-medium leading-snug text-zinc-900">
                    {nomeCarro || "Aguardando seleção"}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="bg-zinc-900 px-4 py-4 text-white">
              <p className="text-[13px] font-medium">FIPE integrada</p>
              <p className="mt-2 text-[12px] leading-relaxed text-zinc-400">
                Veículo escolhido na tabela oficial. Menos erro de digitação e
                dados mais consistentes.
              </p>
            </div>
          </div>
        </div>

        {/* resultado */}
        {cliente && preAnalise ? (
          <div className="mt-6 space-y-6">
            {/* métricas */}
            <div className="grid grid-cols-2 gap-px bg-zinc-200 md:grid-cols-4">
              {[
                {
                  label: "Probabilidade",
                  value: `${cliente.probabilidadeAprovacao}%`,
                },
                { label: "Risco", value: cliente.riscoCredito },
                { label: "Status", value: cliente.status },
                {
                  label: "Valor FIPE",
                  value: fipeSelecionada?.valor || "—",
                },
              ].map((m) => (
                <div key={m.label} className="bg-white px-4 py-3">
                  <p className="text-[12px] text-zinc-500">{m.label}</p>
                  <p className="mt-1 text-lg font-semibold text-zinc-900">
                    {m.value}
                  </p>
                  {m.label === "Probabilidade" && (
                    <div className="mt-2 h-1 overflow-hidden bg-zinc-100">
                      <div
                        className="h-full bg-zinc-900"
                        style={{
                          width: `${Math.min(100, cliente.probabilidadeAprovacao)}%`,
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* cliente */}
              <div className="bg-white">
                <div className="border-b border-zinc-200 px-5 py-3.5">
                  <h2 className="text-[15px] font-semibold text-zinc-900">
                    Dados do cliente
                  </h2>
                </div>
                <div className="px-5 py-2">
                  <DataRow label="Nome" value={cliente.nome} />
                  <DataRow label="CPF" value={maskCpf(cliente.cpf)} />
                  <DataRow
                    label="Nascimento"
                    value={
                      cliente.idade > 0
                        ? `${cliente.dataNascimento} · ${cliente.idade} anos`
                        : cliente.dataNascimento
                    }
                  />
                  <DataRow label="Nome da mãe" value={cliente.nomeMae} />
                </div>
              </div>

              {/* pré-análise */}
              <div className="bg-white">
                <div className="border-b border-zinc-200 px-5 py-3.5">
                  <h2 className="text-[15px] font-semibold text-zinc-900">
                    Pré-análise
                  </h2>
                </div>

                <div className="space-y-4 p-5">
                  <div>
                    <p className="text-[12px] text-zinc-500">Veículo</p>
                    <p className="mt-1 text-[15px] font-semibold text-zinc-900">
                      {preAnalise.nomeCarro}
                    </p>
                    <p className="mt-0.5 text-[13px] text-zinc-500">
                      {getTipoVeiculoLabel(preAnalise.tipoVeiculo)} ·{" "}
                      {preAnalise.vendedor}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 text-[12px]">
                    <span className="bg-emerald-50 px-2 py-1 font-medium text-emerald-700">
                      {cliente.status}
                    </span>
                    <span className="bg-zinc-100 px-2 py-1 font-medium text-zinc-700">
                      Risco {cliente.riscoCredito}
                    </span>
                    <span className="bg-zinc-100 px-2 py-1 font-medium text-zinc-700">
                      {cliente.probabilidadeAprovacao}%
                    </span>
                  </div>

                  <div className="bg-emerald-50 px-3 py-3">
                    <p className="text-[13px] font-medium text-emerald-800">
                      Próximo passo
                    </p>
                    <p className="mt-1 text-[13px] leading-relaxed text-emerald-700">
                      {preAnalise.proximoPasso}
                    </p>
                  </div>

                  <div className="space-y-3 border-t border-zinc-100 pt-3">
                    <div>
                      <p className="text-[12px] font-medium text-zinc-500">
                        Perfil de entrada
                      </p>
                      <p className="mt-1 text-[13px] leading-relaxed text-zinc-700">
                        {preAnalise.perfilEntrada}
                      </p>
                    </div>
                    <div>
                      <p className="text-[12px] font-medium text-zinc-500">
                        Observação
                      </p>
                      <p className="mt-1 text-[13px] leading-relaxed text-zinc-700">
                        {preAnalise.observacaoComercial}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* histórico */}
            <div className="bg-white">
              <div className="border-b border-zinc-200 px-5 py-3.5">
                <h2 className="text-[15px] font-semibold text-zinc-900">
                  Histórico desta consulta
                </h2>
              </div>
              <div className="divide-y divide-zinc-100 px-5">
                {cliente.historico.map((item) => (
                  <div key={`${item.data}-${item.descricao}`} className="py-3">
                    <p className="text-[13px] font-medium text-zinc-900">
                      {item.data}
                    </p>
                    <p className="mt-0.5 text-[13px] text-zinc-500">
                      {item.descricao}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}