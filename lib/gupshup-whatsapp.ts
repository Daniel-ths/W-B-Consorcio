export function normalizePhoneBR(phone: string): string {
  let d = String(phone || "").replace(/\D/g, "");
  if (d.startsWith("0")) d = d.slice(1);
  if (!d.startsWith("55") && (d.length === 10 || d.length === 11)) {
    d = `55${d}`;
  }
  return d;
}

function cleanText(v: unknown, fallback: string) {
  const t = String(v ?? "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 1024);
  return t || fallback;
}

export async function sendWhatsAppTemplateGupshup(opts: {
  to: string;
  /** [nome, veiculo, valorAdesao, protocolo] */
  params?: string[];
  templateId?: string;
  timeoutMs?: number;
}) {
  const apiKey = String(process.env.GUPSHUP_API_KEY || "").trim();
  const source = String(process.env.GUPSHUP_SOURCE || "").replace(/\D/g, "");
  const appName = String(process.env.GUPSHUP_APP_NAME || "").trim();
  const templateId =
    opts.templateId || String(process.env.GUPSHUP_TEMPLATE_ID || "").trim();

  if (!apiKey) throw new Error("GUPSHUP_API_KEY ausente");
  if (!source) throw new Error("GUPSHUP_SOURCE ausente");
  if (!templateId) throw new Error("GUPSHUP_TEMPLATE_ID ausente");

  const destination = normalizePhoneBR(opts.to);
  const raw = opts.params || [];
  const params = [
    cleanText(raw[0], "Cliente"),
    cleanText(raw[1], "Veiculo"),
    cleanText(raw[2], "0,00"),
    cleanText(raw[3], "000000"),
  ];

  const body = new URLSearchParams();
  body.set("source", source);
  body.set("destination", destination);
  body.set(
    "template",
    JSON.stringify({
      id: templateId,
      params,
    })
  );
  if (appName) body.set("src.name", appName);
  body.set("channel", "whatsapp");

  console.log("[gupshup-whatsapp] enviando", {
    source,
    destination,
    templateId,
    params,
    appName,
  });

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    opts.timeoutMs ?? 20000
  );

  try {
    const response = await fetch(
      "https://api.gupshup.io/wa/api/v1/template/msg",
      {
        method: "POST",
        headers: {
          apikey: apiKey,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
        signal: controller.signal,
        cache: "no-store",
      }
    );

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const msg =
        data?.message ||
        data?.error ||
        JSON.stringify(data) ||
        "Erro Gupshup WhatsApp";
      const error = new Error(msg) as Error & { status?: number; data?: any };
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return {
      ok: true as const,
      provider: "gupshup" as const,
      messageId: data?.messageId || null,
      status: data?.status || null,
      to: destination,
      source,
      templateId,
      params,
      raw: data,
    };
  } finally {
    clearTimeout(timeout);
  }
}