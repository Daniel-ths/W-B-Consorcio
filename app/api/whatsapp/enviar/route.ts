import { NextRequest, NextResponse } from "next/server";
import {
  sendWhatsAppTemplate,
  normalizePhoneBR,
} from "@/lib/vonage-whatsapp";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const number = body.number || body.telefone;

    if (!number) {
      return NextResponse.json({ error: "number obrigatório" }, { status: 400 });
    }

    const templateParams: string[] =
      body.templateParams ||
      [
        body.customerName || "Cliente",
        body.protocolNumber || "------",
        body.vehicleName || "Veículo",
      ];

    const result = await sendWhatsAppTemplate({
      to: normalizePhoneBR(number),
      variables: templateParams.map(String),
    });

    return NextResponse.json({ ok: true, result });
  } catch (err: any) {
    console.error("[whatsapp/enviar]", err);
    return NextResponse.json(
      { error: err?.message || "Falha WhatsApp" },
      { status: 500 }
    );
  }
}