// app/api/consultar-cpf/route.ts
import { NextResponse } from "next/server";

type ApiRawResponse = {
  status?: number | string;
  erro?: string;
  erroCodigo?: number | string;
  message?: string;
  msg?: string;
  nome?: string;
  nascimento?: string;
  genero?: string;
  mae?: string;
  situacao?: string;
  uf?: string;
  [key: string]: any;
};

function onlyDigits(value: unknown) {
  return String(value ?? "").replace(/\D/g, "");
}

function safeStr(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function toISODateBR(value: unknown) {
  const s = safeStr(value).trim();
  if (!s) return "";

  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s;

  const match = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return s;

  const [, dd, mm, yyyy] = match;
  return `${yyyy}-${mm}-${dd}`;
}

function normalizeApiStatus(status: unknown) {
  if (status === 1 || status === "1") return 1;
  if (status === 0 || status === "0") return 0;
  return null;
}

function makeJson(
  payload: Record<string, any>,
  status = 200
) {
  return NextResponse.json(payload, {
    status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}

function buildErrorResponse(
  message: string,
  statusCode = 400,
  original?: any
) {
  return makeJson(
    {
      // formato novo
      error: true,
      success: false,
      ok: false,
      message,

      // compatibilidade legado
      status: 0,
      sucesso: false,
      resultado: null,

      ...(original !== undefined ? { original } : {}),
    },
    statusCode
  );
}

const lastQueryByKey = new Map<string, number>();
const SAME_CPF_COOLDOWN_MS = 60_000;

async function fetchWithTimeout(url: string, timeoutMs = 60_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      cache: "no-store",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    // aceita vários formatos de entrada para não quebrar telas antigas
    const cpfLimpo = onlyDigits(
      body?.cpf ??
      body?.documento ??
      body?.cpfCnpj ??
      body?.cpfcnpj ??
      body?.value
    );

    if (!cpfLimpo || cpfLimpo.length !== 11) {
      return buildErrorResponse("CPF inválido", 400);
    }

    const mode = safeStr(process.env.CONSULTA_CPF_MODE || "test").toLowerCase();
    if (mode !== "live") {
      return buildErrorResponse(
        "Consulta CPF está desativada. Configure CONSULTA_CPF_MODE=live no .env/hospedagem.",
        400
      );
    }

    const token = safeStr(process.env.CPFCNPJ_TOKEN).trim();
    if (!token) {
      return buildErrorResponse("CPFCNPJ_TOKEN não configurado no servidor.", 500);
    }

    const pacoteId = safeStr(process.env.CPFCNPJ_PACOTE_ID || "2").trim();
    const key = `${pacoteId}:${cpfLimpo}`;
    const now = Date.now();

    const last = lastQueryByKey.get(key) || 0;
    if (now - last < SAME_CPF_COOLDOWN_MS) {
      const waitMs = SAME_CPF_COOLDOWN_MS - (now - last);
      return buildErrorResponse(
        `Aguarde ${Math.ceil(waitMs / 1000)}s para consultar o mesmo CPF novamente (proteção anti-bloqueio).`,
        429
      );
    }

    lastQueryByKey.set(key, now);

    const url = `https://api.cpfcnpj.com.br/${token}/${pacoteId}/${cpfLimpo}`;
    console.log(`[consultar-cpf] LIVE — CPF.CNPJ: pacote=${pacoteId} cpf=${cpfLimpo}`);

    const response = await fetchWithTimeout(url, 60_000);
    const raw: ApiRawResponse = await response.json().catch(() => ({}));

    const apiStatus = normalizeApiStatus(raw?.status);
    const erroCodigo = raw?.erroCodigo;
    const erroMsg = raw?.erro;

    if (!response.ok || apiStatus === 0 || erroCodigo || erroMsg) {
      const msg =
        safeStr(erroMsg) ||
        safeStr(raw?.message) ||
        safeStr(raw?.msg) ||
        `Erro ao consultar CPF (HTTP ${response.status})`;

      const isRate =
        erroCodigo === 1007 ||
        erroCodigo === "1007" ||
        /limite de requisições/i.test(msg) ||
        response.status === 429;

      return buildErrorResponse(
        msg,
        isRate ? 429 : response.status >= 400 ? response.status : 400,
        raw
      );
    }

    const nome = safeStr(raw?.nome);
    const nascimento = toISODateBR(raw?.nascimento);
    const genero = safeStr(raw?.genero);
    const mae = safeStr(raw?.mae);
    const situacao = safeStr(raw?.situacao);
    const uf = safeStr(raw?.uf);

    return makeJson({
      // formato novo
      error: false,
      success: true,
      ok: true,
      message: "Consulta realizada com sucesso.",

      nome,
      cpf: cpfLimpo,
      nascimento,
      genero,
      mae,
      situacao,
      uf,

      // compatibilidade com telas/fluxos antigos
      status: 1,
      sucesso: true,
      resultado: {
        nome,
        cpf: cpfLimpo,
        nascimento,
        genero,
        mae,
        situacao,
        uf,
      },

      // espelho bruto
      original: raw,
    });
  } catch (error: any) {
    const isAbort = String(error?.name || "").includes("AbortError");
    const msg = isAbort
      ? "Timeout ao consultar a API (60s). Tente novamente."
      : "Erro interno no servidor";

    console.error("[consultar-cpf] ERRO SERVIDOR:", error);

    return buildErrorResponse(msg, 500);
  }
}