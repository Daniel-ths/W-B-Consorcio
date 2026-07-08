type SendVonageSmsParams = {
  to: string;
  text: string;
  from: string;
  timeoutMs?: number;
};

type VonageApiMessage = {
  to?: string;
  "message-id"?: string;
  status?: string;
  "error-text"?: string;
  "remaining-balance"?: string;
  "message-price"?: string;
  network?: string;
  "client-ref"?: string;
  "account-ref"?: string;
};

type VonageApiResponse = {
  "message-count"?: string;
  messages?: VonageApiMessage[];
};

export async function sendSmsViaVonage({
  to,
  text,
  from,
  timeoutMs = 15000,
}: SendVonageSmsParams) {
  const apiKey = process.env.VONAGE_API_KEY?.trim();
  const apiSecret = process.env.VONAGE_API_SECRET?.trim();

  if (!apiKey || !apiSecret) {
    const error = new Error("Credenciais da Vonage não configuradas");
    (error as any).provider = "vonage";
    (error as any).status = 500;
    throw error;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const body = new URLSearchParams({
      api_key: apiKey,
      api_secret: apiSecret,
      to,
      from,
      text,
      type: "text",
    });

    const response = await fetch("https://rest.nexmo.com/sms/json", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: body.toString(),
      signal: controller.signal,
      cache: "no-store",
    });

    const data = (await response.json().catch(() => null)) as VonageApiResponse | null;

    if (!response.ok) {
      const error = new Error("Erro ao enviar SMS pela Vonage");
      (error as any).provider = "vonage";
      (error as any).status = response.status;
      (error as any).data = data;
      throw error;
    }

    const message = data?.messages?.[0];

    if (!message) {
      const error = new Error("Resposta inválida da Vonage");
      (error as any).provider = "vonage";
      (error as any).status = 502;
      (error as any).data = data;
      throw error;
    }

    // status "0" = aceito pela Vonage
    if (message.status !== "0") {
      const error = new Error(message["error-text"] || "Vonage recusou o envio");
      (error as any).provider = "vonage";
      (error as any).status = 400;
      (error as any).data = data;
      throw error;
    }

    return {
      ok: true,
      messageId: message["message-id"] || null,
      status: message.status || "0",
      errorText: message["error-text"] || null,
      response: data,
    };
  } finally {
    clearTimeout(timeout);
  }
}