import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cpf } = body;
    
    // 1. Limpa o CPF
    const cpfLimpo = cpf?.replace(/\D/g, '') || '';

    if (!cpfLimpo || cpfLimpo.length !== 11) {
      return NextResponse.json({ error: 'CPF inválido' }, { status: 400 });
    }

    // --- CONFIGURAÇÃO CPFCNPJ.COM.BR ---
    // 1. Cadastre-se em www.cpfcnpj.com.br
    // 2. Pegue seu TOKEN no painel
    // 3. Veja qual o número do "Pacote de CPF" (Geralmente é 1)
    
    const token = "3010f09bce6b19f5786c9bcb7fb7920a".trim(); 
    const pacoteId = "2"; // Confirme no painel se o pacote de CPF é 1, 2 ou outro.

    // Verifica se o token está configurado
    const usarModoMock = token === "SEU_TOKEN_AQUI" || !token;

    if (usarModoMock) {
        console.warn(`--- MODO TESTE (SEM TOKEN): Retornando dados simulados para ${cpfLimpo} ---`);
        
        await new Promise(resolve => setTimeout(resolve, 1000));

        // RETORNA DADOS MOCK (Para você não travar o desenvolvimento)
        return NextResponse.json({
            nome: "CLIENTE TESTE (CPFCNPJ.COM.BR)",
            cpf: cpfLimpo,
            nascimento: "1988-03-20",
            genero: "MASCULINO",
            mae: "MÃE EXEMPLO DE TESTE",
            situacao: "REGULAR",
            uf: "SP",
            original: { origem: "mock_sem_token" }
        });
    }

    console.log(`--- CONSULTANDO CPFCNPJ.COM.BR: ${cpfLimpo} ---`);

    // A URL deles é: https://api.cpfcnpj.com.br/TOKEN/PACOTE/CPF
    const url = `https://api.cpfcnpj.com.br/${token}/${pacoteId}/${cpfLimpo}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();

    if (!response.ok || data.status === 0) { // Eles as vezes retornam status: 0 no JSON para erro
       console.error("Erro CPFCNPJ:", data);
       return NextResponse.json(
         { error: data.erro || data.msg || "Erro ao consultar API" },
         { status: response.status || 400 }
       );
    }

    // --- ADAPTADOR (Padroniza para seu Frontend) ---
    // A resposta deles varia, mas geralmente é data.nome, data.nascimento, etc.
    return NextResponse.json({
        nome: data.nome,
        cpf: cpfLimpo,
        nascimento: data.nascimento, // Pode vir como "DD/MM/AAAA"
        genero: data.genero,
        mae: data.mae,
        situacao: data.situacao,
        uf: data.uf, 
        original: data
    });

  } catch (error: any) {
    console.error("ERRO SERVIDOR:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}