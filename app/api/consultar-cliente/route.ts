import { NextRequest, NextResponse } from "next/server";
import { buscarClientePorCpf, normalizarCpf } from "@/lib/services/cliente";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const cpf = normalizarCpf(body?.cpf || "");

    if (!cpf || cpf.length !== 11) {
      return NextResponse.json(
        { error: "CPF inválido. Informe um CPF com 11 números." },
        { status: 400 }
      );
    }

    const cliente = await buscarClientePorCpf(cpf);

    if (!cliente) {
      return NextResponse.json(
        { error: "Cliente não encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json(cliente, { status: 200 });
  } catch (error) {
    console.error("Erro ao consultar cliente:", error);

    return NextResponse.json(
      { error: "Erro interno ao consultar cliente." },
      { status: 500 }
    );
  }
}