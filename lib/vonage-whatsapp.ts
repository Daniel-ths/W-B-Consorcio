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

export async function sendWhatsAppTemplate(opts: {
  to: string;
  templateName?: string;
  locale?: string;
  variables?: string[];
}) {
  const from = process.env.VONAGE_WHATSAPP_NUMBER;
  if (!from) throw new Error("VONAGE_WHATSAPP_NUMBER ausente");

  const name =
    opts.templateName ||
    process.env.VONAGE_WA_TEMPLATE_NAME ||
    "aprovacao_consorcio_2";

  const locale =
    opts.locale || process.env.VONAGE_WA_TEMPLATE_LOCALE || "pt_BR";

  const variables = opts.variables || [];

  const custom: any = {
    type: "template",
    template: {
      name,
      language: {
        policy: "deterministic",
        code: locale,
      },
    },
  };

  if (variables.length > 0) {
    custom.template.components = [
      {
        type: "body",
        parameters: variables.map((text) => ({
          type: "text",
          text: String(text),
        })),
      },
    ];
  }

  const vonage = getVonage();

  return vonage.messages.send({
    channel: Channels.WHATSAPP,
    messageType: "custom",
    from,
    to: normalizePhoneBR(opts.to),
    custom,
  } as any);
}