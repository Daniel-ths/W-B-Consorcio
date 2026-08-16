import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { telefone, nomeCompleto, modeloVeiculo, valorAdesao } = body;

    if (!telefone || !nomeCompleto || !modeloVeiculo || !valorAdesao) {
      return NextResponse.json(
        { error: "Campos obrigatórios: telefone, nomeCompleto, modeloVeiculo, valorAdesao" },
        { status: 400 }
      );
    }

    const result = await sendAprovacaoConsorcio({
      telefone,
      nomeCompleto,
      modeloVeiculo,
      valorAdesao: String(valorAdesao),
    });

    return NextResponse.json({ ok: true, result });
  } catch (err: any) {
    console.error("[whatsapp/aprovacao]", err);
    return NextResponse.json(
      { error: err?.message || "Falha ao enviar WhatsApp" },
      { status: 500 }
    );
  }
}