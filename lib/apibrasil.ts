// src/lib/apibrasil.ts
type ApiBrasilFetchOpts = {
  url: string;
  method?: "GET" | "POST";
  body?: any;
  timeoutMs?: number;
  deviceToken?: string;
};

export async function apibrasilFetch<T = any>({
  url,
  method = "POST",
  body,
  timeoutMs = 120000,
  deviceToken,
}: ApiBrasilFetchOpts): Promise<{ ok: boolean; status: number; data: T; rawText: string }> {
  const bearerToken = process.env.APIBRASIL_BEARER_TOKEN;
  const defaultDeviceToken = process.env.APIBRASIL_DEVICE_TOKEN;
  const dt = deviceToken || defaultDeviceToken;

  if (!bearerToken) throw new Error("APIBRASIL_BEARER_TOKEN ausente");
  if (!dt) throw new Error("APIBRASIL_DEVICE_TOKEN ausente (ou deviceToken não informado)");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort("Timeout excedido"), timeoutMs);

  try {
    const resp = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${bearerToken}`,
        DeviceToken: dt,
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
      signal: controller.signal,
    });

    const rawText = await resp.text();
    let parsed: any = null;
    try {
      parsed = rawText ? JSON.parse(rawText) : null;
    } catch {
      parsed = { raw: rawText };
    }

    return { ok: resp.ok, status: resp.status, data: parsed, rawText };
  } finally {
    clearTimeout(timeoutId);
  }
}