export type TipoVeiculoFipe = "cars" | "motorcycles" | "trucks";

export function getTipoFipe(tipoVeiculo?: string): TipoVeiculoFipe {
  if (tipoVeiculo === "seminovo") return "cars";
  if (tipoVeiculo === "zero") return "cars";
  return "cars";
}

export async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Erro ao consultar FIPE: ${response.status} - ${text}`);
  }

  return response.json() as Promise<T>;
}