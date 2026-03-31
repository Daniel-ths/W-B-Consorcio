import { NextResponse } from "next/server";

function onlyDigits(v: unknown) {
  return String(v || "").replace(/\D/g, "");
}

function safeStr(v: unknown) {
  if (v === null || v === undefined) return "";
  return String(v);
}

function toISODateBR(v: unknown) {
  const s = safeStr(v).trim();
  if (!s) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s;

  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return s;

  const [, dd, mm, yyyy] = m;
  return `${yyyy}-${mm}-${dd}`;
}

function toBRDate(v: unknown) {
  const s = safeStr(v).trim();
  if (!s) return "--/--/----";

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s;

  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const [, yyyy, mm, dd] = iso;
    return `${dd}/${mm}/${yyyy}`;
  }

  return s;
}

function jsonError(message: string, status = 400, original?: unknown) {
  return NextResponse.json(
    {
      error: true,
      message,
      ...(original !== undefined ? { original } : {}),
    },
    { status }
  );
}

const lastQueryByKey = new Map<string, number>();
const SAME_CPF_COOLDOWN_MS = 60_000;

async function fetchWithTimeout(url: string, timeoutMs = 60_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      signal: controller.signal,
    });

    return res;
  } finally {
    clearTimeout(timer);
  }
}

type VeiculoFipeBody = {
  codigoFipe?: string;
  marca?: string;
  modelo?: string;
  ano?: string;
  valor?: string;
  combustivel?: string;
};

type RequestBody = {
  cpf?: string;
  tipoVeiculo?: "zero" | "seminovo";
  nomeCarro?: string;
  vendedor?: string;
  veiculoFipe?: VeiculoFipeBody;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as RequestBody;

    const cpfLimpo = onlyDigits(body?.cpf);
    const tipoVeiculo = body?.tipoVeiculo === "seminovo" ? "seminovo" : "zero";
    const nomeCarro = safeStr(body?.nomeCarro).trim();
    const vendedor = safeStr(body?.vendedor).trim();
    const veiculoFipe = body?.veiculoFipe || {};

    if (!cpfLimpo || cpfLimpo.length !== 11) {
      return jsonError("CPF inválido", 400);
    }

    if (!veiculoFipe?.codigoFipe) {
      return jsonError("Selecione um veículo pela tabela FIPE.", 400);
    }

    const mode = (process.env.CONSULTA_CPF_MODE || "test").toLowerCase();

    if (mode !== "live") {
      const dataNascimentoMock = "15/08/1992";
      const probabilidadeAprovacao = 88;

      return NextResponse.json({
        error: false,
        nome: "Cliente localizado",
        cpf: cpfLimpo,
        dataNascimento: dataNascimentoMock,
        nascimento: toISODateBR(dataNascimentoMock),
        nomeMae: "Não informado",
        mae: "Não informado",
        genero: "",
        situacao: "Regular",
        uf: "",

        probabilidadeAprovacao,
        riscoCredito:
          probabilidadeAprovacao >= 90
            ? "Baixo"
            : probabilidadeAprovacao >= 80
            ? "Médio"
            : "Alto",
        status:
          probabilidadeAprovacao >= 90
            ? "Aprovável"
            : probabilidadeAprovacao >= 80
            ? "Em análise"
            : "Restrito",

        consulta: {
          vendedor,
          tipoVeiculo,
          nomeCarro,
          veiculoFipe: {
            codigoFipe: safeStr(veiculoFipe.codigoFipe),
            marca: safeStr(veiculoFipe.marca),
            modelo: safeStr(veiculoFipe.modelo),
            ano: safeStr(veiculoFipe.ano),
            valor: safeStr(veiculoFipe.valor),
            combustivel: safeStr(veiculoFipe.combustivel),
          },
          dataConsulta: new Date().toISOString(),
        },
      });
    }

    const token = (process.env.CPFCNPJ_TOKEN || "").trim();
    if (!token) {
      return jsonError("CPFCNPJ_TOKEN não configurado no servidor.", 500);
    }

    const pacoteId = (process.env.CPFCNPJ_PACOTE_ID || "2").trim();

    const key = `${pacoteId}:${cpfLimpo}`;
    const now = Date.now();

    const last = lastQueryByKey.get(key) || 0;
    if (now - last < SAME_CPF_COOLDOWN_MS) {
      const waitMs = SAME_CPF_COOLDOWN_MS - (now - last);
      return jsonError(
        `Aguarde ${Math.ceil(waitMs / 1000)}s para consultar o mesmo CPF novamente.`,
        429
      );
    }

    lastQueryByKey.set(key, now);

    const url = `https://api.cpfcnpj.com.br/${token}/${pacoteId}/${cpfLimpo}`;
    const response = await fetchWithTimeout(url, 60_000);
    const raw = await response.json().catch(() => ({}));

    const apiStatus = raw?.status;
    const erroCodigo = raw?.erroCodigo;
    const erroMsg = raw?.erro;

    if (!response.ok || apiStatus === 0 || erroCodigo || erroMsg) {
      const msg =
        erroMsg ||
        raw?.message ||
        raw?.msg ||
        `Erro ao consultar CPF (HTTP ${response.status})`;

      const isRate =
        erroCodigo === 1007 ||
        /limite de requisições/i.test(msg) ||
        response.status === 429;

      return jsonError(
        msg,
        isRate ? 429 : response.status && response.status >= 400 ? response.status : 400,
        raw
      );
    }

    const dataNascimentoBr = toBRDate(raw?.nascimento);
    const dataNascimentoIso = toISODateBR(raw?.nascimento);

    const probabilidadeAprovacao = 88;
    const riscoCredito =
      probabilidadeAprovacao >= 90
        ? "Baixo"
        : probabilidadeAprovacao >= 80
        ? "Médio"
        : "Alto";

    const status =
      probabilidadeAprovacao >= 90
        ? "Aprovável"
        : probabilidadeAprovacao >= 80
        ? "Em análise"
        : "Restrito";

    return NextResponse.json({
      error: false,

      nome: safeStr(raw?.nome),
      cpf: cpfLimpo,

      dataNascimento: dataNascimentoBr,
      nascimento: dataNascimentoIso,

      nomeMae: safeStr(raw?.mae),
      mae: safeStr(raw?.mae),

      genero: safeStr(raw?.genero),
      situacao: safeStr(raw?.situacao),
      uf: safeStr(raw?.uf),

      probabilidadeAprovacao,
      riscoCredito,
      status,

      consulta: {
        vendedor,
        tipoVeiculo,
        nomeCarro,
        veiculoFipe: {
          codigoFipe: safeStr(veiculoFipe.codigoFipe),
          marca: safeStr(veiculoFipe.marca),
          modelo: safeStr(veiculoFipe.modelo),
          ano: safeStr(veiculoFipe.ano),
          valor: safeStr(veiculoFipe.valor),
          combustivel: safeStr(veiculoFipe.combustivel),
        },
        dataConsulta: new Date().toISOString(),
      },

      original: raw,
    });
  } catch (error: any) {
    const msg = String(error?.name || "").includes("AbortError")
      ? "Timeout ao consultar a API (60s). Tente novamente."
      : "Erro interno no servidor";

    console.error("[consultar-cpf] ERRO SERVIDOR:", error);
    return NextResponse.json({ error: true, message: msg }, { status: 500 });
  }
}