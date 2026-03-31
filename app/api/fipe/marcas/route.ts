import { NextResponse } from "next/server";

type Marca = {
  codigo: string | number;
  nome: string;
};

export async function GET() {
  try {
    const response = await fetch("https://parallelum.com.br/fipe/api/v1/carros/marcas", {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Erro ao buscar marcas");
    }

    const data = await response.json();

    const marcas = (Array.isArray(data) ? data : []).map((item: Marca) => ({
      codigo: String(item.codigo),
      nome: item.nome,
    }));

    return NextResponse.json(marcas);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Não foi possível carregar as marcas.",
      },
      { status: 500 }
    );
  }
}