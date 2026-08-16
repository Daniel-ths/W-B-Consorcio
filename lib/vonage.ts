// lib/vonage.ts

type SendWhatsAppParams = {
  to: string; // 5511999999999
  text?: string; // só dentro da janela de 24h
  templateName?: string;
  templateLocale?: string;
  templateParams?: string[]; // variáveis do template {{1}}, {{2}}...
  timeoutMs?: number;
};

function onlyDigits(v: string) {
  return String(v || "").replace(/\D/g, "");
}

/** Normaliza celular BR para E.164 sem + */
export function normalizeBrazilNumber(value: string) {
  let digits = onlyDigits(value);
  if (!digits) return "";
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
  if (!digits.startsWith("55")) return "";
  if (digits.length < 12 || digits.length > 13) return "";
  return digits;
}

async function getVonageJwt() {
  // Opção A: usar @vonage/jwt se instalar
  // Opção B: chamar via fetch com JWT gerado
  // Abaixo: implementação via REST com JWT gerado por pacote
  const { tokenGenerate } = await import("@vonage/jwt");
  const applicationId = process.env.VONAGE_APPLICATION_ID!;
  const privateKey = process.env.VONAGE_PRIVATE_KEY!.replace(/\\n/g, "\n");
  return tokenGenerate(applicationId, privateKey, { application_id: applicationId });
}

/**
 * Envia WhatsApp via Vonage Messages API.
 * - Se templateName for passado → envia TEMPLATE (recomendado no fechamento do pedido)
 * - Se só text → envia texto livre (só funciona dentro da janela de 24h)
 */
export async function sendWhatsAppViaVonage({
  to,
  text,
  templateName,
  templateLocale = process.env.VONAGE_WA_TEMPLATE_LOCALE || "pt_BR",
  templateParams = [],
  timeoutMs = 15000,
}: SendWhatsAppParams) {
  const from = onlyDigits(process.env.VONAGE_WHATSAPP_NUMBER || "");
  const toNorm = normalizeBrazilNumber(to);

  if (!from) throw Object.assign(new Error("VONAGE_WHATSAPP_NUMBER não configurado"), { status: 500 });
  if (!toNorm) throw Object.assign(new Error("Número inválido"), { status: 400 });
  if (!process.env.VONAGE_APPLICATION_ID || !process.env.VONAGE_PRIVATE_KEY) {
    throw Object.assign(new Error("VONAGE_APPLICATION_ID / VONAGE_PRIVATE_KEY não configurados"), {
      status: 500,
    });
  }

  const jwt = await getVonageJwt();

  const body: any = {
    to: toNorm,
    from,
    channel: "whatsapp",
  };

  if (templateName) {
    // Template (obrigatório no 1º contato / fora da janela 24h)
    body.message_type = "template";
    body.whatsapp = { policy: "deterministic", locale: templateLocale };
    body.template = {
      name: templateName,
      parameters: templateParams,
    };
  } else if (text) {
    body.message_type = "text";
    body.text = text;
  } else {
    throw Object.assign(new Error("Informe text ou templateName"), { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch("https://api.nexmo.com/v1/messages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store",
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const err = new Error(data?.title || data?.detail || "Erro ao enviar WhatsApp");
      (err as any).status = res.status;
      (err as any).data = data;
      (err as any).provider = "vonage-whatsapp";
      throw err;
    }

    return {
      ok: true,
      messageId: data?.message_uuid || data?.messageUUID || null,
      response: data,
    };
  } finally {
    clearTimeout(timeout);
  }
}

// Mantém a função antiga se ainda precisar de SMS em algum lugar
export async function sendSmsViaVonage(..._args: any[]) {
  throw new Error("SMS via Vonage não implementado neste módulo");
}