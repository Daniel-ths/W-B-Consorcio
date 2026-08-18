import { Vonage } from "@vonage/server-sdk";
import { Auth } from "@vonage/auth";
import { Channels } from "@vonage/messages";
import fs from "fs";
import path from "path";

function getPrivateKey(): string {
  if (process.env.VONAGE_PRIVATE_KEY_PATH) {
    return fs.readFileSync(
      path.resolve(process.env.VONAGE_PRIVATE_KEY_PATH),
      "utf8"
    );
  }

  return (process.env.VONAGE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
}

function getVonage() {
  const applicationId = process.env.VONAGE_APPLICATION_ID;
  const privateKey = getPrivateKey();

  if (!applicationId) {
    throw new Error("VONAGE_APPLICATION_ID ausente");
  }
  if (!privateKey || !privateKey.includes("BEGIN")) {
    throw new Error("VONAGE private key inválida ou ausente");
  }

  return new Vonage(
    new Auth({
      applicationId,
      privateKey,
    })
  );
}

/** 55 + DDD + número, só dígitos */
export function normalizePhoneBR(phone: string): string {
  let d = String(phone || "").replace(/\D/g, "");
  if (d.startsWith("0")) d = d.slice(1);
  if (!d.startsWith("55") && (d.length === 10 || d.length === 11)) {
    d = `55${d}`;
  }
  return d;
}

/**
 * Template no Meta: aprovacao_consorcio_2 / pt_BR
 * - HEADER: imagem (obrigatório)
 * - BODY:
 *   {{1}} nome
 *   {{2}} veículo
 *   {{3}} valor da adesão
 *   {{4}} protocolo
 *
 * Env:
 *   VONAGE_WA_TEMPLATE_NAME=aprovacao_consorcio_2
 *   VONAGE_WA_TEMPLATE_LOCALE=pt_BR
 *   VONAGE_WA_HEADER_IMAGE_URL=https://...jpg  (URL pública da imagem do header)
 */
export async function sendWhatsAppTemplate(opts: {
  to: string;
  templateName?: string;
  locale?: string;
  variables?: string[];
  headerImageUrl?: string;
}) {
  const from = process.env.VONAGE_WHATSAPP_NUMBER;

  if (!from) {
    throw new Error("VONAGE_WHATSAPP_NUMBER ausente");
  }

  const name =
    opts.templateName ||
    process.env.VONAGE_WA_TEMPLATE_NAME ||
    "aprovacao_consorcio_2";

  const locale =
    opts.locale ||
    process.env.VONAGE_WA_TEMPLATE_LOCALE ||
    "pt_BR";

  const headerImage =
    opts.headerImageUrl ||
    process.env.VONAGE_WA_HEADER_IMAGE_URL ||
    "";

  console.log("[vonage-whatsapp] configuração:", {
    applicationId: process.env.VONAGE_APPLICATION_ID,
    whatsappFrom: from,
    template: name,
    locale,
  });

  if (!headerImage) {
    throw new Error(
      "VONAGE_WA_HEADER_IMAGE_URL ausente. Este template exige header com imagem."
    );
  }

  // restante do código...

  // 4 strings não vazias (Meta rejeita empty / null)
  const raw = (opts.variables || []).map((v) => String(v ?? "").trim());
  const variables = [
    raw[0] || "Cliente",
    raw[1] || "Veiculo",
    raw[2] || "0",
    raw[3] || "000000",
  ].map((t) =>
    t
      .replace(/[\r\n\t]+/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim()
      .slice(0, 1024)
  );

  if (raw.length > 0 && raw.length !== 4) {
    console.warn(
      `[vonage-whatsapp] Esperado 4 variáveis no body, recebido ${raw.length}:`,
      raw
    );
  }

  const components: any[] = [
    // HEADER com imagem (obrigatório neste template)
    {
      type: "header",
      parameters: [
        {
          type: "image",
          image: {
            link: headerImage,
          },
        },
      ],
    },
    // BODY com 4 textos
    {
      type: "body",
      parameters: variables.map((text) => ({
        type: "text",
        text,
      })),
    },
  ];

  const custom: any = {
    type: "template",
    template: {
      name,
      language: {
        policy: "deterministic",
        code: locale,
      },
      components,
    },
  };

  const vonage = getVonage();

  const result = await vonage.messages.send({
    channel: Channels.WHATSAPP,
    messageType: "custom",
    from,
    to: normalizePhoneBR(opts.to),
    custom,
  } as any);

  return {
    messageUUID:
      (result as any)?.messageUUID || (result as any)?.message_uuid || null,
    to: normalizePhoneBR(opts.to),
    from,
    template: name,
    locale,
    variables,
    headerImage,
    raw: result,
  };
}

