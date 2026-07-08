import { NextResponse } from "next/server";
import { sendSmsViaVonage } from "../../../../lib/vonage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SmsRequestBody = {
  number?: string;
  message?: string;
  messageType?: string;
  optIn?: boolean;
  smsOptIn?: boolean;
  consent?: boolean;
  purpose?: string;
  applicationId?: string;
  protocolNumber?: string;
};

const TIMEZONE = process.env.SMS_TIMEZONE || "America/Belem";
const QUIET_HOUR_START = Number(process.env.SMS_QUIET_HOUR_START ?? 0);
const QUIET_HOUR_END = Number(process.env.SMS_QUIET_HOUR_END ?? 24);
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

function onlyDigits(value: string) {
  return String(value || "").replace(/\D/g, "");
}

function normalizeBrazilNumber(value: string) {
  let digits = onlyDigits(value);

  if (!digits) return "";

  if (digits.length === 10 || digits.length === 11) {
    digits = `55${digits}`;
  }

  if (!digits.startsWith("55")) return "";
  if (digits.length < 12 || digits.length > 13) return "";

  return digits;
}

function sanitizeSenderId(value: string) {
  return String(value || "")
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .trim()
    .slice(0, 11);
}

function isGenericSenderId(value: string) {
  return GENERIC_SENDER_IDS.has(String(value || "").toUpperCase());
}

function hasUrl(text: string) {
  return /(https?:\/\/|www\.|bit\.ly|tinyurl\.com|wa\.me|t\.me)/i.test(text);
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

  // se estiver 0-24, libera o dia inteiro
  if (QUIET_HOUR_START === 0 && QUIET_HOUR_END === 24) return true;

  return hour >= QUIET_HOUR_START && hour < QUIET_HOUR_END;
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

function normalizePurpose(value: string) {
  return String(value || "").trim().toLowerCase();
}

export async function POST(request: Request) {
  const reqId = `sms_${Math.random().toString(16).slice(2)}_${Date.now()}`;

  try {
    const body: SmsRequestBody = await request.json().catch(() => ({}));

    const rawNumber = String(body?.number || "");
    const rawMessage = sanitizeMessage(String(body?.message || ""));
    const messageType = normalizeMessageType(String(body?.messageType || "transactional"));
    const optIn = resolveOptIn(body);
    const purpose = normalizePurpose(String(body?.purpose || ""));
    const applicationId = String(body?.applicationId || body?.protocolNumber || "").trim();

    const isTransactionalApproval =
      messageType === "transactional" &&
      purpose === "application_status" &&
      applicationId.length > 0;

    const brandName = sanitizeSenderId(process.env.VONAGE_BRAND_NAME || "");

    if (!process.env.VONAGE_API_KEY || !process.env.VONAGE_API_SECRET) {
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

    if (!optIn && !isTransactionalApproval) {
      return NextResponse.json(
        {
          error: true,
          message:
            "Envio bloqueado: sem permissão registrada, só são aceitas atualizações transacionais com purpose='application_status' e applicationId.",
          reqId,
        },
        { status: 400 }
      );
    }

    if (REQUIRE_OPT_IN && !optIn && !isTransactionalApproval) {
      return NextResponse.json(
        {
          error: true,
          message:
            "Envio bloqueado: é necessário registrar permissão ou enviar uma atualização transacional válida.",
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

    if (!isInsideAllowedWindow(TIMEZONE)) {
      return NextResponse.json(
        {
          error: true,
          message: "Envio bloqueado fora da janela configurada. Tente novamente no horário permitido.",
          reqId,
        },
        { status: 429 }
      );
    }

    const result = await sendSmsViaVonage({
      to: number,
      text: rawMessage,
      from: brandName,
      timeoutMs: PROVIDER_TIMEOUT_MS,
    });

    return NextResponse.json({
      error: false,
      message: "SMS aceito pela Vonage e encaminhado para entrega.",
      detail:
        "O aceite na fila não confirma que o SMS chegou ao aparelho; a confirmação depende do recibo da operadora.",
      provider: "vonage",
      to: number,
      from: brandName,
      purpose,
      applicationId,
      messageId: result.messageId,
      resultStatus: result.status,
      resultStatusDescription: result.errorText || null,
      data: result.response,
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
          : err?.message || "Erro interno",
        provider: err?.provider || "vonage",
        status: err?.status || 500,
        apiResponse: err?.data || null,
        reqId,
      },
      { status: isAbortError ? 504 : err?.status || 500 }
    );
  }
}