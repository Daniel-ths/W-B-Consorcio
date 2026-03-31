import { NextRequest, NextResponse } from "next/server";

type Ano = {
  codigo: string;
  nome: string;
};

export async function GET(request: NextRequest) {
  try {
    const marca = request.nextUrl.searchParams.get("marca");
    const modelo = request.nextUrl.searchParams.get("modelo");

    if (!marca || !modelo) {
      return NextResponse.json(
        { error: "Parâmetros 'marca' e 'modelo' são obrigatórios." },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://parallelum.com.br/fipe/api/v1/carros/marcas/${marca}/modelos/${modelo}/anos`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      throw new Error("Erro ao buscar anos");
    }

    const data = await response.json();

    const anos = (Array.isArray(data) ? data : []).map((item: Ano) => ({
      codigo: item.codigo,
      nome: item.nome,
    }));

    return NextResponse.json(anos);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Não foi possível carregar os anos.",
      },
      { status: 500 }
    );
  }
}