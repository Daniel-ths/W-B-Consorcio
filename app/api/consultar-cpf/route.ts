// app/api/consultar-cpf/route.ts
import { NextResponse } from "next/server";

/**
 * CPF.CNPJ (cpfcnpj.com.br) — LIVE (sem mock)
 * Docs do usuário:
 *   URL: https://api.cpfcnpj.com.br/{token}/{pacote}/{cpfcnpj}
 *   status: 1 sucesso / 0 falha
 *   erros: erro / erroCodigo (além de status=0)
 *
 * Regras importantes (da doc):
 * - 3 consultas seguidas mesmo CPF no mesmo pacote < 1 min => bloqueio 3 min
 * - limite 20 req/s
 */

// --- Helpers ---
function onlyDigits(v: any) {
  return String(v || "").replace(/\D/g, "");
}

function safeStr(v: any) {
  if (v === null || v === undefined) return "";
  return String(v);
}

// Converte "DD/MM/AAAA" => "AAAA-MM-DD" (mantém se já estiver ok)
function toISODateBR(v: any) {
  const s = safeStr(v).trim();
  if (!s) return "";
  // já ISO
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s;
  // DD/MM/AAAA
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return s; // mantém original
  const [, dd, mm, yyyy] = m;
  return `${yyyy}-${mm}-${dd}`;
}

function jsonError(message: string, status = 400, original?: any) {
  return NextResponse.json(
    { error: true, message, ...(original !== undefined ? { original } : {}) },
    { status }
  );
}

// --- Anti-bloqueio (mesmo CPF/pacote dentro de 60s) ---
const lastQueryByKey = new Map<string, number>(); // key = `${pacote}:${cpf}`
const SAME_CPF_COOLDOWN_MS = 60_000;

// --- Fetch com timeout (60s recomendado na doc) ---
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

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const cpfLimpo = onlyDigits(body?.cpf);

    if (!cpfLimpo || cpfLimpo.length !== 11) {
      return jsonError("CPF inválido", 400);
    }

    // --- Modo LIVE (sem mock) ---
    const mode = (process.env.CONSULTA_CPF_MODE || "test").toLowerCase();
    if (mode !== "live") {
      return jsonError(
        "Consulta CPF está desativada. Configure CONSULTA_CPF_MODE=live no .env/hospedagem.",
        400
      );
    }

    const token = (process.env.CPFCNPJ_TOKEN || "").trim();
    if (!token) {
      return jsonError("CPFCNPJ_TOKEN não configurado no servidor.", 500);
    }

    // Você pode escolher o pacote via env; por padrão use o CPF C (2)
    // (Nome + Nascimento + Mãe + Gênero) — conforme doc.
    const pacoteId = (process.env.CPFCNPJ_PACOTE_ID || "2").trim();

    const key = `${pacoteId}:${cpfLimpo}`;
    const now = Date.now();

    // Protege contra bloqueio do provedor (mesmo CPF/pacote repetido rápido)
    const last = lastQueryByKey.get(key) || 0;
    if (now - last < SAME_CPF_COOLDOWN_MS) {
      const waitMs = SAME_CPF_COOLDOWN_MS - (now - last);
      return jsonError(
        `Aguarde ${Math.ceil(waitMs / 1000)}s para consultar o mesmo CPF novamente (proteção anti-bloqueio).`,
        429
      );
    }

    lastQueryByKey.set(key, now);

    const url = `https://api.cpfcnpj.com.br/${token}/${pacoteId}/${cpfLimpo}`;
    console.log(`[consultar-cpf] LIVE — CPF.CNPJ: pacote=${pacoteId} cpf=${cpfLimpo}`);

    const response = await fetchWithTimeout(url, 60_000);

    // Se bater timeout/abort
    // (AbortError cai no catch geral)
    const raw = await response.json().catch(() => ({}));

    /**
     * Erros comuns (doc):
     * - status = 0
     * - erro / erroCodigo
     * - 1007 limite req/s
     * - 1000 token inválido / IP não permitido
     * - 1001 sem créditos
     * - 1003 blacklist temporária
     */
    const apiStatus = raw?.status; // 1 ou 0
    const erroCodigo = raw?.erroCodigo;
    const erroMsg = raw?.erro;

    if (!response.ok || apiStatus === 0 || erroCodigo || erroMsg) {
      // Se token inválido (1000) você pode querer não “queimar” o cooldown local.
      // Mas como já setamos, ok — evita loop de tentativas.
      const msg =
        erroMsg ||
        raw?.message ||
        raw?.msg ||
        `Erro ao consultar CPF (HTTP ${response.status})`;

      // Se for rate limit do provedor ou regra de bloqueio, devolve 429
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

    /**
     * ✅ ADAPTADOR para o formato que seu front já usa
     * (mantive suas chaves: nome, cpf, nascimento, genero, mae, situacao, uf, original)
     *
     * Observação: na doc:
     * - cpf vem formatado (14 dígitos com pontuação), aqui mantemos o cpfLimpo como antes
     * - nascimento vem DD/MM/AAAA — converto para ISO "AAAA-MM-DD" pra ficar consistente
     * - genero pode vir M/F/O
     * - situacao pode vir Regular/Cancelada/etc
     */
    return NextResponse.json({
      error: false,
      nome: safeStr(raw?.nome),
      cpf: cpfLimpo,
      nascimento: toISODateBR(raw?.nascimento),
      genero: safeStr(raw?.genero),
      mae: safeStr(raw?.mae),
      situacao: safeStr(raw?.situacao),
      uf: safeStr(raw?.uf),
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