"use client";

import { useState, Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  CheckCircle2, Loader2, ArrowLeft, Printer, Send, RefreshCw, QrCode, ShieldCheck
} from "lucide-react";

// --- CACHE GLOBAL (Anti-bloqueio API) ---
const cacheConsultasGlobal = new Map<string, number>();

// --- TELEFONE FIXO +55 (91) ---
const PHONE_PREFIX_DISPLAY = "+55 (91) ";

// Formata SOMENTE os 9 dígitos após o prefixo: 9XXXX-XXXX
const maskPhoneAfterPrefix = (digitsOnlyAfterPrefix: string) => {
  const digits = String(digitsOnlyAfterPrefix || "").replace(/\D/g, "").slice(0, 9);
  if (!digits) return "";
  if (digits.length <= 1) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 1)}${digits.slice(1)}`;
  return `${digits.slice(0, 1)}${digits.slice(1, 5)}-${digits.slice(5)}`;
};

// ✅ recebe telefone vindo como "+5591..." (ou "5591...") e normaliza para SOMENTE DÍGITOS "5591..."
function sanitizePhoneFromOtherPage(input: string): string | null {
  if (!input) return null;

  const digits = String(input).replace(/\D/g, ""); // remove "+", espaços, etc.
  if (!digits.startsWith("55")) return null;
  if (digits.length < 12 || digits.length > 13) return null;

  return digits; // ex: "5591999999999"
}

function PedidoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // --- DADOS DO PEDIDO ---
  const dados = {
    tipo: searchParams.get("tipo") || "CONSORCIO",
    cpf: searchParams.get("cpf") || "",
    modelo: searchParams.get("modelo") || "Veículo Selecionado",
    valor: parseFloat(searchParams.get("valor") || "0"),
    entrada: parseFloat(searchParams.get("entrada") || "0"),
    parcela: parseFloat(searchParams.get("parcela_escolhida") || "0"),
    prazo: searchParams.get("prazo_escolhido") || "0",
    total: parseFloat(searchParams.get("total_final") || "0"),
    imagem: searchParams.get("imagem") || "",

    // ✅ VINDO DA OUTRA PÁGINA
    nome: searchParams.get("nome") || "",
    telefone: searchParams.get("telefone") || "", // ex: +5591...
  };

  const [loadingValidacao, setLoadingValidacao] = useState(true);
  const [verificando, setVerificando] = useState(false);
  const [loadingSalvar, setLoadingSalvar] = useState(false);
  const [pedidoSalvo, setPedidoSalvo] = useState(false);

  const [apiData, setApiData] = useState<any>(null);

  // ✅ começa com o nome vindo da outra página (fallback)
  const [nomeManual, setNomeManual] = useState(dados.nome || "");

  const [dataAtual, setDataAtual] = useState("");

  // ✅ telefone do cliente vindo da outra página (digits p/ SMS e DB)
  const telefoneDigits = sanitizePhoneFromOtherPage(dados.telefone); // "5591..."

  // ✅ telefone formatado p/ exibir no layout antigo: "+55 (91) 9XXXX-XXXX"
  const telefoneTela =
    telefoneDigits
      ? `${PHONE_PREFIX_DISPLAY}${maskPhoneAfterPrefix(telefoneDigits.slice(4))}` // tira "5591" e formata os 9
      : "---";

  // ✅ mensagem do SMS (mantida)
  const SMS_TESTE = (nome: string, protocolo: string) =>
    `Parabéns ${nome}! Seu CPF foi aprovado para a compra do seu carro novo. Seja bem vindo. Nossa equipe segue com você nos próximos passos.`;

  useEffect(() => {
    setDataAtual(
      new Date().toLocaleDateString("pt-BR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    );

    // ✅ se o nome chegar pela URL e ainda estiver vazio, preenche
    if (!nomeManual && dados.nome) {
      setNomeManual(dados.nome);
    }

    if (dados.cpf) {
      const ultimaConsulta = cacheConsultasGlobal.get(dados.cpf);
      const agora = Date.now();
      const recente = ultimaConsulta && agora - ultimaConsulta < 120000;

      if (!recente) {
        cacheConsultasGlobal.set(dados.cpf, agora);
        validarReceita(false);
      } else {
        setLoadingValidacao(false);
      }
    } else {
      setLoadingValidacao(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatMoney = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  const numeroPedido = Math.floor(Math.random() * 1000000).toString().padStart(6, "0");

  // ✅ SMS: envia usando o telefone VINDO DA OUTRA PÁGINA (sem input manual)
  async function enviarSmsAposAtualizar(nomeCliente: string) {
    if (!telefoneDigits) {
      alert("📵 Telefone inválido/ausente. Ele deve vir da página anterior como +5591XXXXXXXXX.");
      return;
    }

    const message = SMS_TESTE(nomeCliente || "cliente", numeroPedido);

    try {
      const resp = await fetch("/api/sms/enviar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          number: telefoneDigits, // ✅ "5591..."
          message,
          user_reply: true,
        }),
      });

      const json = await resp.json().catch(() => null);

      if (!resp.ok || json?.error) {
        alert(`❌ SMS falhou: ${json?.message || "erro"}`);
        console.warn("[sms] falhou ao enviar:", json || resp.status);
        return;
      }

      alert("📩 SMS enviado!");
      console.log("[sms] enviado com sucesso:", json);
    } catch (err) {
      alert("❌ Erro de rede no envio do SMS");
      console.warn("[sms] erro de rede:", err);
    }
  }

  // ✅ mantém seu "Atualizar" com a função de SMS (ao clicar)
  const validarReceita = async (isManual = true) => {
    let nomeEncontrado = (nomeManual || "").trim();
    let sucessoConsulta = false;

    if (isManual) {
      setVerificando(true);
      if (dados.cpf) cacheConsultasGlobal.set(dados.cpf, Date.now());
    }

    try {
      const response = await fetch("/api/consultar-cpf", {
        method: "POST",
        body: JSON.stringify({ cpf: dados.cpf }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data && !data.error) {
        sucessoConsulta = true;
        setApiData(data);

        const nomeApi =
          data.nome ||
          data.nomeCompleto ||
          data.response?.content?.nome?.conteudo?.nome ||
          "";

        if (nomeApi) {
          nomeEncontrado = nomeApi;
          setNomeManual(nomeApi);
        } else if (!nomeEncontrado && dados.nome) {
          nomeEncontrado = dados.nome;
          setNomeManual(dados.nome);
        }

        if (isManual) alert("✅ Dados atualizados com sucesso!");
      } else {
        if (response.status === 429) {
          if (isManual) alert("⏳ Muitas consultas seguidas. Aguarde alguns segundos.");
        } else {
          if (isManual) alert(`❌ ${data?.error || data?.message || "Erro ao buscar dados"}`);
        }
      }
    } catch (error) {
      if (isManual) alert("Erro de conexão.");
    } finally {
      setLoadingValidacao(false);
      setVerificando(false);

      // ✅ manda SMS ao clicar "Atualizar" (mesmo se a consulta falhar)
      if (isManual) {
        const nomeParaSms = nomeEncontrado || dados.nome || "cliente";
        await enviarSmsAposAtualizar(nomeParaSms);

        if (sucessoConsulta) {
          // ok
        }
      }
    }
  };

  // Atalhos de Dados
  const situacaoReceita =
    apiData?.situacao || apiData?.response?.content?.nome?.conteudo?.situacao_receita || "PENDENTE";
  const dataNascimento = apiData?.nascimento || apiData?.data_nascimento || "---";
  const nomeMae = apiData?.mae || apiData?.nome_mae || "---";

  const enderecoComplexo = apiData?.response?.content?.pesquisa_enderecos?.conteudo?.[0];
  const enderecoSimples = apiData?.uf ? { estado: apiData.uf } : null;
  const endereco = enderecoComplexo || enderecoSimples || {};

  // --- SALVAR PROPOSTA ---
  const handleFinalizarSolicitacao = async () => {
    if (!nomeManual) return alert("Aguarde o carregamento ou preencha os dados do cliente.");

    if (!telefoneDigits) {
      alert("📵 Telefone inválido/ausente. Ele deve vir da página anterior como +5591XXXXXXXXX.");
      return;
    }

    setLoadingSalvar(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert("Sessão expirada. Faça login novamente.");
        return;
      }

      let nomeVendedor = user.email;
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      if (profile && profile.full_name) {
        nomeVendedor = profile.full_name;
      }

      const payload = {
        seller_id: user.id,
        seller_name: nomeVendedor,
        car_name: dados.modelo,
        client_name: nomeManual.toUpperCase(),
        client_cpf: dados.cpf,
        status: "Aguardando Aprovação",
        total_price: dados.valor,
        interest_type: dados.tipo,
        client_phone: telefoneDigits, // ✅ salva "5591..."
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("sales").insert([payload]);
      if (error) throw error;

      setPedidoSalvo(true);
      alert(`✅ Proposta salva com sucesso por: ${nomeVendedor}`);
    } catch (error: any) {
      console.error(error);
      alert("Erro ao salvar: " + error.message);
    } finally {
      setLoadingSalvar(false);
    }
  };

  if (loadingValidacao) {
    return (
      <div className="min-h-screen bg-zinc-900 flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-[#f2e14c] w-12 h-12" />
        <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs animate-pulse">
          Gerando Documento...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 font-sans text-zinc-900 pb-32 md:pb-20 print:bg-white print:p-0">
      {/* HEADER DO APP */}
      <header className="px-4 md:px-6 py-4 bg-zinc-900 border-b border-zinc-800 sticky top-0 z-50 print:hidden shadow-xl safe-area-top">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors font-bold text-xs uppercase tracking-widest"
          >
            <ArrowLeft size={18} /> <span className="hidden md:inline">Voltar</span>
          </button>
          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={() => window.print()}
              className="bg-zinc-800 border border-zinc-700 text-zinc-300 p-2 md:px-4 md:py-2 rounded-lg text-xs font-bold uppercase hover:bg-zinc-700 hover:text-white flex items-center gap-2 shadow-sm transition-all"
            >
              <Printer size={18} /> <span className="hidden md:inline">Imprimir</span>
            </button>

            {!pedidoSalvo ? (
              <button
                onClick={handleFinalizarSolicitacao}
                disabled={loadingSalvar}
                className="bg-[#f2e14c] text-black px-4 py-2.5 rounded-lg text-xs font-black uppercase hover:bg-[#ffe600] flex items-center gap-2 shadow-lg shadow-yellow-400/20 transition-all hover:scale-105 active:scale-95"
              >
                {loadingSalvar ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                <span className="md:inline">{loadingSalvar ? "Salvando..." : "Salvar Proposta"}</span>
              </button>
            ) : (
              <div className="bg-green-500/10 text-green-500 px-4 py-2.5 rounded-lg text-xs font-black uppercase flex items-center gap-2 border border-green-500/20 animate-in fade-in zoom-in">
                <CheckCircle2 size={16} /> Salvo
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ÁREA DA FOLHA DE PAPEL */}
      <main className="w-full md:max-w-[210mm] mx-auto py-4 md:py-8 px-4 md:px-0 print:max-w-full print:p-0 print:m-0">
        <div className="bg-white shadow-lg md:shadow-2xl rounded-2xl md:rounded-none overflow-hidden w-full min-h-[80vh] md:min-h-[297mm] flex flex-col relative print:shadow-none print:w-full">
          {/* MARCA D'ÁGUA DE FUNDO */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none overflow-hidden">
            <h1 className="text-[80px] md:text-[150px] font-black -rotate-45 text-black whitespace-nowrap">WBCNAC</h1>
          </div>

          {/* --- HEADER DO DOCUMENTO --- */}
          <div className="p-6 md:p-10 pb-4 md:pb-6 border-b-4 border-black flex flex-col md:flex-row justify-between items-start md:items-start gap-6 md:gap-0 relative z-10 bg-white">
            <div className="flex flex-col gap-1 w-full md:w-auto">
              <div className="flex justify-between items-center md:block">
                <div className="bg-black text-white px-3 py-1 text-xl md:text-2xl font-black tracking-tighter w-fit inline-block mb-1 md:mb-2">
                  WBCNAC
                </div>
                <div className="md:hidden">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase mr-2">Prot:</span>
                  <span className="text-sm font-mono font-black text-zinc-900 bg-zinc-100 px-2 py-1 rounded">
                    #{numeroPedido}
                  </span>
                </div>
              </div>
              <h1 className="text-lg md:text-xl font-bold uppercase tracking-tight text-zinc-900">Proposta Comercial</h1>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium">Consórcios & Veículos Multimarcas</p>
            </div>

            <div className="text-right hidden md:block">
              <div className="flex flex-col items-end">
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Número do Protocolo</p>
                <p className="text-xl font-mono font-black text-zinc-900 bg-zinc-100 px-3 py-1 rounded">#{numeroPedido}</p>
              </div>
              <div className="mt-3 flex items-center justify-end gap-2">
                <span className="text-[10px] font-bold uppercase text-zinc-400">Modalidade:</span>
                <span className="bg-[#f2e14c] text-black text-[10px] font-black uppercase px-2 py-0.5 rounded-sm">
                  {dados.tipo}
                </span>
              </div>
            </div>
          </div>

          {/* --- CORPO DO DOCUMENTO --- */}
          <div className="p-6 md:p-10 space-y-8 flex-1 relative z-10">
            {/* 1. DADOS DO CLIENTE */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-black pb-2">
                <h3 className="text-sm font-black uppercase flex items-center gap-2">
                  <span className="bg-black text-white w-5 h-5 flex items-center justify-center text-[10px] rounded-full">1</span>
                  Identificação do Cliente
                </h3>
                <button
                  onClick={() => validarReceita(true)}
                  disabled={verificando}
                  className="print:hidden text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 uppercase bg-blue-50 px-2 py-1 rounded-full"
                >
                  {verificando ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} />}
                  {verificando ? "..." : "Enviar Pedido"}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-4 text-xs">
                <div className="md:col-span-2">
                  <label className="block text-[9px] font-bold text-zinc-400 uppercase mb-1">Nome Completo</label>
                  <div className="font-mono font-bold text-base md:text-lg uppercase truncate border-b border-dotted border-zinc-300 pb-1 w-full">
                    {nomeManual || "---"}
                  </div>
                </div>

                <div className="md:col-span-1">
                  <label className="block text-[9px] font-bold text-zinc-400 uppercase mb-1">CPF</label>
                  <div className="font-mono font-bold text-base md:text-lg border-b border-dotted border-zinc-300 pb-1 flex items-center gap-2">
                    {dados.cpf}
                    {situacaoReceita === "REGULAR" && (
                      <ShieldCheck size={14} className="text-green-600 print:hidden flex-shrink-0" />
                    )}
                  </div>
                </div>

                <div className="md:col-span-1">
                  <label className="block text-[9px] font-bold text-zinc-400 uppercase mb-1">Telefone</label>
                  <div className="font-mono font-bold text-base md:text-lg border-b border-dotted border-zinc-300 pb-1">
                    {telefoneTela}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:contents gap-4">
                  <div className="md:col-span-1">
                    <label className="block text-[9px] font-bold text-zinc-400 uppercase mb-1">Nascimento</label>
                    <div className="font-mono font-medium text-zinc-800 uppercase">{dataNascimento}</div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[9px] font-bold text-zinc-400 uppercase mb-1">Filiação (Mãe)</label>
                    <div className="font-mono font-medium text-zinc-800 uppercase truncate">{nomeMae}</div>
                  </div>
                </div>

                <div className="md:col-span-1">
                  <label className="block text-[9px] font-bold text-zinc-400 uppercase mb-1">Situação CPF</label>
                  <div
                    className={`font-black uppercase text-[10px] px-2 py-0.5 rounded w-fit ${
                      situacaoReceita === "REGULAR" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}
                  >
                    {situacaoReceita}
                  </div>
                </div>

                <div className="md:col-span-4">
                  <label className="block text-[9px] font-bold text-zinc-400 uppercase mb-1">Endereço Residencial</label>
                  <div className="font-mono text-zinc-600 uppercase text-[10px] border border-zinc-200 p-2 rounded bg-zinc-50 print:bg-white print:border-none print:p-0 leading-tight">
                    {endereco.logradouro
                      ? `${endereco.logradouro}, ${endereco.numero || "S/N"} - ${endereco.bairro} - ${endereco.cidade}/${endereco.estado}`
                      : "Endereço não localizado na base de dados."}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. OBJETO DO CONTRATO */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-black pb-2">
                <h3 className="text-sm font-black uppercase flex items-center gap-2">
                  <span className="bg-black text-white w-5 h-5 flex items-center justify-center text-[10px] rounded-full">2</span>
                  Objeto do Contrato
                </h3>
              </div>

              <div className="flex flex-col md:flex-row gap-6 items-start border border-zinc-200 rounded-xl p-4 bg-zinc-50 print:bg-white print:border-zinc-300">
                {dados.imagem && (
                  <div className="w-full md:w-32 h-32 md:h-20 bg-white rounded-lg border border-zinc-200 flex items-center justify-center p-2 print:hidden overflow-hidden">
                    <img src={dados.imagem} className="w-full h-full object-contain mix-blend-multiply" />
                  </div>
                )}
                <div className="flex-1 grid grid-cols-2 gap-4 w-full">
                  <div>
                    <p className="text-[9px] font-bold text-zinc-400 uppercase">Modelo / Bem</p>
                    <p className="text-lg md:text-xl font-black text-zinc-900 uppercase leading-tight mt-1">{dados.modelo}</p>
                    <p className="text-[10px] text-zinc-500 font-medium mt-1">CÓDIGO FIPE: REF-2026</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-bold text-zinc-400 uppercase">Valor da Carta</p>
                    <p className="text-lg md:text-xl font-black text-zinc-900 mt-1">{formatMoney(dados.valor)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. FLUXO DE PAGAMENTO */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-black pb-2">
                <h3 className="text-sm font-black uppercase flex items-center gap-2">
                  <span className="bg-black text-white w-5 h-5 flex items-center justify-center text-[10px] rounded-full">3</span>
                  Fluxo de Pagamento
                </h3>
              </div>

              <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
                <div className="flex justify-between items-center p-3 border-b border-zinc-100">
                  <span className="text-xs font-bold text-zinc-500 uppercase">Ato / Entrada</span>
                  <div className="flex-1 border-b border-dotted border-zinc-300 mx-4 relative top-1 hidden md:block"></div>
                  <span className="font-mono font-bold text-zinc-900">{formatMoney(dados.entrada)}</span>
                </div>

                <div className="flex justify-between items-center p-4 bg-[#f2e14c]/20 print:bg-gray-100">
                  <div className="flex flex-col">
                    <span className="text-xs font-black uppercase text-zinc-900">Parcelamento</span>
                    <span className="text-[10px] font-bold text-zinc-500">Plano em {dados.prazo} meses</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-xl md:text-2xl font-black text-zinc-900">{formatMoney(dados.parcela)}</span>
                    <span className="text-[9px] font-bold text-zinc-500 uppercase">Valor da Parcela</span>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 bg-zinc-50 print:bg-white">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">Custo Efetivo Total (Estimado)</span>
                  <span className="font-mono font-bold text-zinc-500 text-xs">{formatMoney(dados.total)}</span>
                </div>
              </div>
            </div>

            {/* CAMPO DE OBSERVAÇÕES */}
            <div className="border-2 border-dashed border-zinc-300 rounded-lg p-4 min-h-[100px] md:min-h-[120px] bg-zinc-50/50 print:bg-white relative">
              <p className="absolute top-2 left-3 text-[9px] font-bold text-zinc-400 uppercase bg-white px-1">
                Observações / Acessórios
              </p>
            </div>
          </div>

          {/* --- FOOTER DO DOCUMENTO --- */}
          <div className="mt-auto p-6 md:p-10 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-end mb-8 pt-8 border-t border-black">
              <div className="text-center order-2 md:order-1">
                <p className="font-black text-xs uppercase mb-1">WBCNAC Veículos</p>
                <p className="text-[9px] text-zinc-500 font-mono">CNPJ: 00.000.000/0001-00</p>
              </div>
              <div className="text-center order-1 md:order-2">
                <div className="border-b border-black mb-2 w-full md:w-3/4 mx-auto"></div>
                <p className="font-bold text-xs uppercase mb-1">{nomeManual || "Cliente Proponente"}</p>
                <p className="text-[9px] text-zinc-500 font-mono">CPF: {dados.cpf}</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
              <div className="text-[9px] text-zinc-400 leading-tight max-w-md text-justify">
                Este documento representa uma simulação comercial e não possui valor de contrato definitivo até a aprovação de crédito e assinatura digital.
              </div>

              <div className="flex items-center gap-2 opacity-50 grayscale">
                <div className="text-right hidden md:block">
                  <p className="text-[8px] font-bold uppercase">Autenticação</p>
                  <p className="text-[8px] font-mono">{numeroPedido}-X</p>
                </div>
                <div className="bg-white p-1 border border-zinc-200">
                  <QrCode size={32} />
                </div>
              </div>
            </div>

            <div className="text-center mt-4 pt-2 border-t border-zinc-100">
              <p className="text-[9px] font-bold text-zinc-300 uppercase tracking-widest">
                Belém, {dataAtual} • WBCNAC.com
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PedidoPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <PedidoContent />
    </Suspense>
  );
}