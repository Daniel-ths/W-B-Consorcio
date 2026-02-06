// app/api/consultar-cpf/route.ts

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cpf } = body;

    const cpfLimpo = cpf?.replace(/\D/g, '');
    if (!cpfLimpo || cpfLimpo.length !== 11) {
      return NextResponse.json(
        { error: 'CPF inválido' },
        { status: 400 }
      );
    }

    console.log(`--- MODO MANUTENÇÃO: RETORNANDO DADOS REALISTAS PARA ${cpfLimpo} ---`);

    // SIMULAÇÃO DE DELAY (Para ver o loading na tela)
    await new Promise(resolve => setTimeout(resolve, 1500));

    // --- DADOS MOCK (REALISTAS) ---
    const dadosMock = {
      success: true,
      nome: "MARCOS OLIVEIRA DOS SANTOS", // Fallback simples
      
      // Estrutura complexa da APIBrasil
      response: {
        content: {
          nome: {
            conteudo: {
              nome: "MARCOS OLIVEIRA DOS SANTOS",
              cpf: cpfLimpo, // Retorna o mesmo CPF digitado para parecer real
              data_nascimento: "15/05/1985",
              mae: "MARIA APARECIDA OLIVEIRA",
              situacao_receita: "REGULAR",
              genero: "MASCULINO",
              ano_obito: null
            }
          },
          pesquisa_enderecos: {
            conteudo: [
              {
                logradouro: "RUA DAS LARANJEIRAS",
                numero: "450",
                complemento: "APTO 32 BL A",
                bairro: "JARDIM FLORESTA",
                cidade: "SÃO PAULO",
                estado: "SP",
                cep: "04567-000"
              }
            ]
          },
          contato_preferencial: {
            conteudo: [
              { valor: "(11) 98765-4321" }
            ]
          },
          pesquisa_telefones: {
            conteudo: [
               { numero: "(11) 98765-4321" },
               { numero: "(11) 3344-5566" }
            ]
          }
        }
      }
    };

    return NextResponse.json(dadosMock);

    /* --- CÓDIGO REAL (GUARDADO) ---
    const token = "SEU_TOKEN".trim();
    const deviceToken = "SEU_DEVICE".trim();
    const url = "https://gateway.apibrasil.io/api/v2/dados/cpf";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "DeviceToken": deviceToken,
        "User-Agent": "Mozilla/5.0"
      },
      body: JSON.stringify({ cpf: cpfLimpo })
    });
    // ...resto do código
    */

  } catch (error: any) {
    console.error("ERRO SERVIDOR:", error);
    return NextResponse.json(
      { error: "Erro interno: " + error.message },
      { status: 500 }
    );
  }
}