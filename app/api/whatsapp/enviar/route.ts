import { NextRequest, NextResponse } from "next/server";
import {
  sendWhatsAppTemplate,
  normalizePhoneBR,
} from "@/lib/vonage-whatsapp";

/**
 * Template aprovado:
 * {{1}} nome
 * {{2}} veículo
 * {{3}} valor da adesão  (sem "R$" — o template já tem "R$ {{3}}")
 * {{4}} protocolo
 */
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

    // Preferir array já montado pelo frontend
    let templateParams: string[] = Array.isArray(body.templateParams)
      ? body.templateParams.map(String)
      : [];

    // Fallback se o frontend não mandar templateParams
    if (templateParams.length === 0) {
      const nome =
        body.customerName || body.nome || body.nomeCompleto || "Cliente";
      const veiculo =
        body.vehicleName || body.modeloVeiculo || body.veiculo || "Veículo";
      const valorAdesao = String(
        body.valorAdesao || body.adesao || body.valor || "0,00"
      ).replace(/^R\$\s?/i, ""); // evita "R$ R$"
      const protocolo =
        body.protocolNumber || body.protocolo || body.applicationId || "------";

      templateParams = [nome, veiculo, valorAdesao, protocolo];
    }

    // Segurança: template exige exatamente 4 variáveis
    if (templateParams.length !== 4) {
      return NextResponse.json(
        {
          error:
            "templateParams deve ter 4 itens: [nome, veiculo, valorAdesao, protocolo]",
          received: templateParams.length,
          templateParams,
        },
        { status: 400 }
      );
    }

    const result = await sendWhatsAppTemplate({
      to: normalizePhoneBR(number),
      variables: templateParams,
    });

    return NextResponse.json({
      ok: true,
      to: normalizePhoneBR(number),
      templateParams,
      result,
    });
  } catch (err: any) {
    console.error("[whatsapp/enviar]", err);
    return NextResponse.json(
      { error: err?.message || "Falha WhatsApp" },
      { status: 500 }
    );
  }
}