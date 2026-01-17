import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let cleanCPF = (body?.cpf || "").replace(/\D/g, "");

    // Validação básica
    if (cleanCPF.length !== 11) {
      return NextResponse.json(
        { error: "CPF inválido" },
        { status: 400 }
      );
    }

    // 🔑 Secret Key da APIBrasil (PRINT ROXO)
    const API_KEY = process.env.APIBRASIL_RECEITA_KEY;

    if (!API_KEY) {
      return NextResponse.json(
        { error: "API key da APIBrasil não configurada" },
        { status: 500 }
      );
    }

    // 🌐 Endpoint correto
    const url = `https://gateway.apibrasil.io/receita-federal/cpf?cpf=${cleanCPF}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      cache: "no-store"
    });

    if (!response.ok) {
      const erroTexto = await response.text();
      return NextResponse.json(
        {
          error: "Erro na APIBrasil",
          status: response.status,
          detalhe: erroTexto
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const base = data.response || data.dados || data;

    return NextResponse.json({
      nome: base.nome || "",
      situacaoCadastral: base.situacao_cadastral || base.situacao || "",
      dataNascimento: base.data_nascimento || ""
    });

  } catch (err) {
    console.error("Erro interno:", err);
    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 }
    );
  }
}
