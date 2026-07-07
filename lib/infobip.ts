export type InfobipSendSmsParams = {
  to: string;
  text: string;
  sender?: string;
  timeoutMs?: number;
};

export type InfobipSendSmsSuccess = {
  ok: true;
  provider: "infobip";
  response: any;
  messageId?: string;
  status?: {
    groupId?: number;
    groupName?: string;
    id?: number;
    name?: string;
    description?: string;
  };
};

function normalizeBaseUrl(value: string) {
  return String(value || "").trim().replace(/\/+$/, "");
}

export async function sendSmsViaInfobip({
  to,
  text,
  sender,
  timeoutMs = 15000,
}: InfobipSendSmsParams): Promise<InfobipSendSmsSuccess> {
  const baseUrl = normalizeBaseUrl(process.env.INFOBIP_BASE_URL || "");
  const apiKey = String(process.env.INFOBIP_API_KEY || "").trim();
  const finalSender = String(sender || process.env.INFOBIP_SENDER || "").trim();

  if (!baseUrl) {
    throw new Error("INFOBIP_BASE_URL não configurado");
  }

  if (!apiKey) {
    throw new Error("INFOBIP_API_KEY não configurado");
  }

  if (!finalSender) {
    throw new Error("INFOBIP_SENDER não configurado");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}/sms/3/messages`, {
      method: "POST",
      headers: {
        Authorization: `App ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            destinations: [{ to }],
            sender: finalSender,
            content: {
              text,
            },
          },
        ],
      }),
      cache: "no-store",
      signal: controller.signal,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const providerMessage =
        data?.requestError?.serviceException?.text ||
        data?.message ||
        "Erro ao enviar SMS pela Infobip";

      const error = new Error(providerMessage) as Error & {
        status?: number;
        provider?: string;
        data?: any;
      };

      error.status = response.status;
      error.provider = "infobip";
      error.data = data;

      throw error;
    }

    const result = data?.messages?.[0];

    return {
      ok: true,
      provider: "infobip",
      response: data,
      messageId: result?.messageId,
      status: result?.status,
    };
  } finally {
    clearTimeout(timeout);
  }
}