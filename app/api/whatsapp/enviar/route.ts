import { NextRequest, NextResponse } from "next/server";
import {
  sendWhatsAppTemplateGupshup,
  normalizePhoneBR,
} from "@/lib/gupshup-whatsapp";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const number = body.number || body.telefone;

    if (!number) {
      return NextResponse.json(
        { error: "number obrigatório" },
        { status: 400 }
      );
    }

    let templateParams: string[] = Array.isArray(body.templateParams)
      ? body.templateParams.map(String)
      : [];

    if (templateParams.length === 0) {
      templateParams = [
        body.customerName || body.nome || "Cliente",
        body.vehicleName || body.modeloVeiculo || "Veículo",
        String(body.valorAdesao || body.valor || "0,00").replace(
          /^R\$\s?/i,
          ""
        ),
        body.protocolNumber || body.protocolo || "------",
      ];
    }

    while (templateParams.length < 4) templateParams.push("—");
    templateParams = templateParams.slice(0, 4);

    const result = await sendWhatsAppTemplateGupshup({
      to: normalizePhoneBR(number),
      params: templateParams,
    });

    return NextResponse.json({
      ok: true,
      provider: "gupshup",
      to: normalizePhoneBR(number),
      templateParams,
      result,
    });
  } catch (err: any) {
    console.error("[whatsapp/enviar][gupshup]", err?.data || err);
    return NextResponse.json(
      {
        error: err?.message || "Falha WhatsApp Gupshup",
        details: err?.data || null,
      },
      { status: err?.status || 500 }
    );
  }
}