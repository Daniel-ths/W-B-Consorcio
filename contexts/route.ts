// app/api/sms/enviar/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SmsRequestBody = {
  number?: string;
  message?: string;
  messageType?: string;
  optIn?: boolean;
  smsOptIn?: boolean;
  consent?: boolean;
};

const TIMEZONE = process.env.SMS_TIMEZONE || "America/Belem";
const QUIET_HOUR_START = Number(process.env.SMS_QUIET_HOUR_START ?? 8); // 08:00
const QUIET_HOUR_END = Number(process.env.SMS_QUIET_HOUR_END ?? 20); // 20:00
const REQUIRE_OPT_IN = process.env.SMS_REQUIRE_OPT_IN !== "false";
const ALLOW_MARKETING = process.env.SMS_ALLOW_MARKETING === "true";
const ALLOW_URLS = process.env.SMS_ALLOW_URLS === "true";
const MAX_TEXT_LENGTH = Number(process.env.SMS_MAX_TEXT_LENGTH ?? 320);
const PROVIDER_TIMEOUT_MS = Number(process.env.SMS_PROVIDER_TIMEOUT_MS ?? 15000);

const GENERIC_SENDER_IDS = new Set([
  "INFO",
  "SMS",
  "NOTICE",
  "SYSTEM",
  "SISTEMA",
  "ADMIN",
]);

const BLOCKED_PATTERNS: RegExp[] = [
  /\bparab[eé]ns?\b/i,
  /\baprovad[oa]s?\b/i,
  /\bcr[eé]dito\s+aprovado\b/i,
  /\bpr[eé]-?aprovad[oa]\b/i,
  /\bgarantid[oa]s?\b/i,
  /\bganhou\b/i,
  /\boferta\b/i,
  /\bpromo[cç][aã]o\b/i,
  /\bclique\s+aqui\b/i,
  /\bcarro\s+novo\b/i,
  /\bsem\s+burocracia\b/i,
  /\bsem\s+consulta\b/i,
];

function onlyDigits(value: string) {
  return String(value || "").replace(/\D/g, "");
}

function normalizeBrazilNumber(value: string) {
  let digits = onlyDigits(value);

  if (!digits) return "";

  // Ex.: 91999999999 -> 5591999999999
  if (digits.length === 10 || digits.length === 11) {
    digits = `55${digits}`;
  }

  // Aceita somente Brasil em formato internacional sem "+"
  if (!digits.startsWith("55")) return "";

  // 55 + DDD + número (12 ou 13 dígitos no total)
  if (digits.length < 12 || digits.length > 13) return "";

  return digits;
}

function sanitizeSenderId(value: string) {
  return String(value || "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 11);
}

function isGenericSenderId(value: string) {
  return GENERIC_SENDER_IDS.has(String(value || "").toUpperCase());
}

function hasUrl(text: string) {
  return /(https?:\/\/|www\.|bit\.ly|tinyurl\.com|wa\.me|t\.me)/i.test(text);
}

function hasBlockedContent(text: string) {
  return BLOCKED_PATTERNS.some((pattern) => pattern.test(text));
}

function getHourInTimezone(timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const hourPart = parts.find((part) => part.type === "hour")?.value;
  return Number(hourPart ?? "0");
}

function isInsideAllowedWindow(timeZone: string) {
  const hour = getHourInTimezone(timeZone);
  return hour >= QUIET_HOUR_START && hour < QUIET_HOUR_END;
}

function ensureBrandPrefix(brand: string, text: string) {
  const prefix = `[${brand}]`;
  const trimmed = text.trim();

  if (trimmed.startsWith(prefix)) {
    return trimmed;
  }

  return `${prefix} ${trimmed}`;
}

function sanitizeMessage(raw: string) {
  return String(raw || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function resolveOptIn(body: SmsRequestBody) {
  return body?.optIn === true || body?.smsOptIn === true || body?.consent === true;
}

function normalizeMessageType(value: string) {
  const normalized = String(value || "transactional").trim().toLowerCase();

  if (["transactional", "transacional"].includes(normalized)) {
    return "transactional";
  }

  if (["marketing", "promotional", "promocional"].includes(normalized)) {
    return "marketing";
  }

  return normalized;
}

export async function POST(request: Request) {
  const reqId = `sms_${Math.random().toString(16).slice(2)}_${Date.now()}`;

  try {
    const body: SmsRequestBody = await request.json().catch(() => ({}));

    const rawNumber = String(body?.number || "");
    const rawMessage = sanitizeMessage(String(body?.message || ""));
    const messageType = normalizeMessageType(String(body?.messageType || "transactional"));
    const optIn = resolveOptIn(body);

    const apiKey = process.env.VONAGE_API_KEY;
    const apiSecret = process.env.VONAGE_API_SECRET;
    const brandName = sanitizeSenderId(process.env.VONAGE_BRAND_NAME || "");

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        {
          error: true,
          message: "Credenciais da Vonage não configuradas",
          reqId,
        },
        { status: 500 }
      );
    }

    if (!brandName) {
      return NextResponse.json(
        {
          error: true,
          message: "VONAGE_BRAND_NAME não configurado",
          reqId,
        },
        { status: 500 }
      );
    }

    if (isGenericSenderId(brandName)) {
      return NextResponse.json(
        {
          error: true,
          message: "VONAGE_BRAND_NAME não pode ser genérico. Use o nome da sua marca.",
          reqId,
        },
        { status: 500 }
      );
    }

    const number = normalizeBrazilNumber(rawNumber);

    if (!number) {
      return NextResponse.json(
        {
          error: true,
          message: "Número inválido",
          reqId,
        },
        { status: 400 }
      );
    }

    if (!rawMessage) {
      return NextResponse.json(
        {
          error: true,
          message: "Mensagem vazia",
          reqId,
        },
        { status: 400 }
      );
    }

    if (rawMessage.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        {
          error: true,
          message: `Mensagem muito longa. Limite atual: ${MAX_TEXT_LENGTH} caracteres.`,
          reqId,
        },
        { status: 400 }
      );
    }

    if (messageType !== "transactional" && !ALLOW_MARKETING) {
      return NextResponse.json(
        {
          error: true,
          message: "A rota está configurada para permitir apenas SMS transacional.",
          reqId,
        },
        { status: 403 }
      );
    }

    if (REQUIRE_OPT_IN && !optIn) {
      return NextResponse.json(
        {
          error: true,
          message: "Envio bloqueado: é necessário registrar consentimento (optIn: true).",
          reqId,
        },
        { status: 400 }
      );
    }

    if (!ALLOW_URLS && hasUrl(rawMessage)) {
      return NextResponse.json(
        {
          error: true,
          message: "Envio bloqueado: links/URLs estão desativados para reduzir risco de filtro.",
          reqId,
        },
        { status: 422 }
      );
    }

    if (hasBlockedContent(rawMessage)) {
      return NextResponse.json(
        {
          error: true,
          message: "Envio bloqueado: a mensagem contém termos promocionais ou sensíveis demais para esta rota.",
          reqId,
        },
        { status: 422 }
      );
    }

if (!isInsideAllowedWindow(TIMEZONE)) {
  console.warn("[sms] envio fora da janela configurada, mas liberado para este ambiente");
}

    const safeMessage = ensureBrandPrefix(brandName, rawMessage);
    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");

    const params = new URLSearchParams();
    params.set("from", brandName);
    params.set("to", number); // E.164 sem "+"
    params.set("text", safeMessage);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch("https://rest.nexmo.com/sms/json", {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
        cache: "no-store",
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    const data = await response.json().catch(() => null);
    const result = data?.messages?.[0];
    const resultStatus = result?.status ?? "unknown";

    if (!response.ok || !result || resultStatus !== "0") {
      return NextResponse.json(
        {
          error: true,
          message:
            result?.["error-text"] ||
            data?.message ||
            "Erro ao enviar SMS pela Vonage",
          provider: "vonage",
          status: response.status,
          resultStatus,
          apiResponse: data,
          reqId,
        },
        { status: response.status || 502 }
      );
    }

    return NextResponse.json({
      error: false,
      message: "SMS enviado com segurança",
      provider: "vonage",
      resultStatus,
      to: number,
      from: brandName,
      data,
      reqId,
    });
  } catch (err: any) {
    const isAbortError =
      err?.name === "AbortError" ||
      String(err?.message || "").toLowerCase().includes("aborted");

    return NextResponse.json(
      {
        error: true,
        message: isAbortError
          ? "Tempo limite excedido ao tentar enviar SMS."
          : "Erro interno",
        details: err?.message || String(err),
        reqId,
      },
      { status: isAbortError ? 504 : 500 }
    );
  }
}