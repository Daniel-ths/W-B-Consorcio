import { NextResponse } from "next/server";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function onlyDigits(v: any) {
  return String(v || "").replace(/\D/g, "");
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const cpfLimpo = onlyDigits(body?.cpf);

    if (!cpfLimpo || cpfLimpo.length !== 11) {
      return NextResponse.json({ error: true, message: "CPF inválido" }, { status: 400 });
    }

    /**
     * ============================================================
     *  ✅ MODO TESTE (DEFAULT)
     *  - Não chama API externa
     *  - Mantém o formato que seu front espera
     *  - Para ativar consulta real depois: CONSULTA_CPF_MODE=live
     * ============================================================
     */
    const mode = (process.env.CONSULTA_CPF_MODE || "test").toLowerCase();

    if (mode !== "live") {
      console.warn(`[consultar-cpf] MODO TESTE ativo. Retornando mock para ${cpfLimpo}`);
      await sleep(500);

      // ✅ MOCK (você pode editar os campos como quiser)
      return NextResponse.json({
        error: false,
        nome: "CLIENTE TESTE (MODO MOCK)",
        cpf: cpfLimpo,
        nascimento: "1988-03-20",
        genero: "MASCULINO",
        mae: "MÃE EXEMPLO DE TESTE",
        situacao: "REGULAR",
        uf: "PA",
        original: { origem: "mock_test_mode" },
      });
    }

    /**
     * ============================================================
     *  🔥 MODO LIVE (guardado, mas DESLIGADO por padrão)
     *  - Ative colocando CONSULTA_CPF_MODE=live no .env.local
     * ============================================================
     *
     *  ✅ CPFCNPJ.COM.BR
     *  URL: https://api.cpfcnpj.com.br/TOKEN/PACOTE/CPF
     */
    const token = (process.env.CPFCNPJ_TOKEN || "").trim();
    const pacoteId = (process.env.CPFCNPJ_PACOTE_ID || "2").trim();

    if (!token) {
      // se ativou live mas esqueceu token, cai em mock pra não travar dev
      console.warn(`[consultar-cpf] LIVE ativo, mas CPFCNPJ_TOKEN não configurado. Voltando para mock.`);
      await sleep(300);

      return NextResponse.json({
        error: false,
        nome: "CLIENTE TESTE (FALLBACK SEM TOKEN)",
        cpf: cpfLimpo,
        nascimento: "1988-03-20",
        genero: "MASCULINO",
        mae: "MÃE EXEMPLO DE TESTE",
        situacao: "REGULAR",
        uf: "PA",
        original: { origem: "mock_fallback_sem_token" },
      });
    }

    console.log(`[consultar-cpf] Consultando CPFCNPJ.COM.BR: ${cpfLimpo}`);

    const url = `https://api.cpfcnpj.com.br/${token}/${pacoteId}/${cpfLimpo}`;

    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data?.status === 0) {
      console.error("[consultar-cpf] Erro CPFCNPJ:", data);
      return NextResponse.json(
        { error: true, message: data?.erro || data?.msg || "Erro ao consultar API", original: data },
        { status: response.status || 400 }
      );
    }

    // ✅ ADAPTADOR (padroniza para seu front)
    return NextResponse.json({
      error: false,
      nome: data?.nome || "",
      cpf: cpfLimpo,
      nascimento: data?.nascimento || "",
      genero: data?.genero || "",
      mae: data?.mae || "",
      situacao: data?.situacao || "",
      uf: data?.uf || "",
      original: data,
    });
  } catch (error: any) {
    console.error("[consultar-cpf] ERRO SERVIDOR:", error);
    return NextResponse.json({ error: true, message: "Erro interno no servidor" }, { status: 500 });
  }
}