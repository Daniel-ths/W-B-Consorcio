import { NextRequest, NextResponse } from "next/server";

type Modelo = {
  codigo: string | number;
  nome: string;
};

export async function GET(request: NextRequest) {
  try {
    const marca = request.nextUrl.searchParams.get("marca");

    if (!marca) {
      return NextResponse.json(
        { error: "Parâmetro 'marca' é obrigatório." },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://parallelum.com.br/fipe/api/v1/carros/marcas/${marca}/modelos`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      throw new Error("Erro ao buscar modelos");
    }

    const data = await response.json();

    const modelos = (data?.modelos || []).map((item: Modelo) => ({
      codigo: String(item.codigo),
      nome: item.nome,
    }));

    return NextResponse.json({ modelos });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Não foi possível carregar os modelos.",
      },
      { status: 500 }
    );
  }
}