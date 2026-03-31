export type HistoricoConsulta = {
  data: string;
  descricao: string;
};

export type ClienteConsulta = {
  nome: string;
  cpf: string;
  dataNascimento: string;
  idade: number;
  nomeMae: string;
  score: number;
  probabilidadeAprovacao: number;
  riscoCredito: "Baixo" | "Médio" | "Alto";
  status: "Aprovável" | "Em análise" | "Restrito";
  historico: HistoricoConsulta[];
};