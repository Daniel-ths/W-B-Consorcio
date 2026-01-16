import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { cpf } = await request.json();
    if (!cpf) {
      return NextResponse.json({ error: "CPF vazio" }, { status: 400 });
    }

    const cleanCPF = cpf.replace(/\D/g, "");

    const DEVICE_TOKEN = "ed0dbc79-88e9-4526-9ed7-897dd7fd0609";
    const BEARER_TOKEN = "SEU_TOKEN_AQUI"; // ⚠️ ideal mover para env

    const url =
      `https://gateway.apibrasil.io/api/v2/receita-federal/cpf?cpf=${cleanCPF}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${BEARER_TOKEN}`,
        "DeviceToken": DEVICE_TOKEN,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const erro = await response.text();
      console.error("Erro APIBrasil:", response.status, erro);
      return NextResponse.json(
        { error: "Erro na consulta da Receita Federal" },
        { status: response.status }
      );
    }

    const data = await response.json();

    // 🔎 Normalização segura
    const base = data?.dados || data;

    return NextResponse.json({
      nome: base.nome || "",
      situacaoCadastral: base.situacao_cadastral || base.situacao || "ATIVO",
      dataNascimento: base.data_nascimento || "",
    });

  } catch (error) {
    console.error("Erro interno:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
