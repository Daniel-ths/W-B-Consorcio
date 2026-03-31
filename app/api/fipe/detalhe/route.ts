import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const marca = request.nextUrl.searchParams.get("marca");
    const modelo = request.nextUrl.searchParams.get("modelo");
    const ano = request.nextUrl.searchParams.get("ano");

    if (!marca || !modelo || !ano) {
      return NextResponse.json(
        { error: "Parâmetros 'marca', 'modelo' e 'ano' são obrigatórios." },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://parallelum.com.br/fipe/api/v1/carros/marcas/${marca}/modelos/${modelo}/anos/${ano}`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      throw new Error("Erro ao buscar detalhe do veículo");
    }

    const data = await response.json();

    return NextResponse.json({
      codigoFipe: data?.CodigoFipe || "",
      marca: data?.Marca || "",
      modelo: data?.Modelo || "",
      ano: String(data?.AnoModelo || ""),
      valor: data?.Valor || "",
      combustivel: data?.Combustivel || "",
      referencia: data?.MesReferencia || "",
      tipoVeiculo: data?.TipoVeiculo || "",
      siglaCombustivel: data?.SiglaCombustivel || "",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível carregar o detalhe do veículo.",
      },
      { status: 500 }
    );
  }
}