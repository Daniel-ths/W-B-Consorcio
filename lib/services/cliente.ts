import type { ClienteConsulta } from "types/cliente";

function calcularIdade(dataNascimento: string) {
  const [dia, mes, ano] = dataNascimento.split("/").map(Number);
  const nascimento = new Date(ano, mes - 1, dia);
  const hoje = new Date();

  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const mesAtual = hoje.getMonth() - nascimento.getMonth();

  if (
    mesAtual < 0 ||
    (mesAtual === 0 && hoje.getDate() < nascimento.getDate())
  ) {
    idade--;
  }

  return idade;
}

export function normalizarCpf(cpf: string) {
  return cpf.replace(/\D/g, "");
}

export async function buscarClientePorCpf(cpf: string): Promise<ClienteConsulta | null> {
  const cpfLimpo = normalizarCpf(cpf);

  // MOCK INICIAL
  if (cpfLimpo === "06140812208") {
    return {
      nome: "JISLAYNE FERREIRA DA SILVA",
      cpf: cpfLimpo,
      dataNascimento: "14/07/1994",
      idade: calcularIdade("14/07/1994"),
      nomeMae: "MARIA APARECIDA FERREIRA DA SILVA",
      score: 842,
      probabilidadeAprovacao: 92,
      riscoCredito: "Baixo",
      status: "Aprovável",
      historico: [
        { data: "21/03/2026 às 10:36", descricao: "Proposta HB20 S" },
        { data: "15/03/2026 às 14:22", descricao: "Simulação Tracker" },
        { data: "10/03/2026 às 09:15", descricao: "Consulta inicial" },
      ],
    };
  }

  return null;
}