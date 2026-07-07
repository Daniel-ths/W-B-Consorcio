"use client";

import { useState, Suspense, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Printer,
  Send,
  QrCode,
  ShieldCheck,
  MessageSquare,
  AlertTriangle,
} from "lucide-react";

// --- TELEFONE FIXO +55 ---
const PHONE_PREFIX_DISPLAY = "+55 ";

// fallback caso algum fluxo ainda envie sem DDD (apenas 8/9 dígitos)
const DEFAULT_DDD = "91";

// regra do consórcio
const TAXA_ADM_TOTAL_FALLBACK = 0.4346; // 43,46%
const REDUZIDA_PERCENT_CATEGORIA = 0.7665; // 76,65%

// Formata SOMENTE o número (8/9) para: 9XXXX-XXXX
const maskPhoneBRNumber = (digitsOnly: string) => {
  const digits = String(digitsOnly || "").replace(/\D/g, "").slice(0, 9);
  if (!digits) return "";
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

// Formata para tela com DDD: "+55 DDD 9XXXX-XXXX"
const formatPhoneForDisplay = (digitsE164: string) => {
  const digits = String(digitsE164 || "").replace(/\D/g, "");

  if (!digits.startsWith("55")) return "---";

  const national = digits.slice(2);
  if (national.length !== 10 && national.length !== 11) return "---";

  const ddd = national.slice(0, 2);
  const number = national.slice(2);

  return `${PHONE_PREFIX_DISPLAY}${ddd} ${maskPhoneBRNumber(number)}`;
};

// recebe telefone vindo como "+55..." / "55..." / "DDD+numero" / "numero" e normaliza para "55DDDNÚMERO"
function sanitizePhoneFromOtherPage(input: string): string | null {
  if (!input) return null;

  const digits = String(input).replace(/\D/g, "");

  if (digits.startsWith("55")) {
    const national = digits.slice(2);

    if (national.length === 10 || national.length === 11) return `55${national}`;

    if ((national.length === 8 || national.length === 9) && DEFAULT_DDD) {
      const ddd = String(DEFAULT_DDD).replace(/\D/g, "").slice(0, 2);
      if (ddd.length === 2) return `55${ddd}${national}`;
    }

    return null;
  }

  if (digits.length === 10 || digits.length === 11) return `55${digits}`;

  if ((digits.length === 8 || digits.length === 9) && DEFAULT_DDD) {
    const ddd = String(DEFAULT_DDD).replace(/\D/g, "").slice(0, 2);
    if (ddd.length === 2) return `55${ddd}${digits}`;
  }

  return null;
}

const safeNumber = (v: any) => {
  const n = typeof v === "number" ? v : parseFloat(String(v || "0"));
  return Number.isFinite(n) ? n : 0;
};

const BEST_BID_TEXT =
  "MELHOR MOMENTO PARA OFERTAR LANCE: ENTRE 7X E 8X PARCELA.";

function makeSmsSafe(raw: string, maxLen = 150) {
  const ascii = String(raw || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "");

  const clean = ascii
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return clean.length > maxLen ? clean.slice(0, maxLen) : clean;
}

function buildSmsMessage(nomeCliente: string, protocolo: string) {
  return makeSmsSafe(
    `Parabéns! Seu plano foi aprovado e seu carro está mais perto do que nunca! Seja bem-vindo! Agora é hora de avançar e garantir sua conquista. Conte com a gente em cada etapa!`,
    150
  );
}

function PedidoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // --- DADOS DO PEDIDO ---
  const dados = useMemo(
    () => ({
      tipo: searchParams.get("tipo") || "CONSORCIO",
      cpf: searchParams.get("cpf") || "",
      modelo: searchParams.get("modelo") || "Veículo Selecionado",
      valor: safeNumber(searchParams.get("valor")),
      entrada: safeNumber(searchParams.get("entrada")),
      parcela: safeNumber(searchParams.get("parcela_escolhida")),
      prazo: searchParams.get("prazo_escolhido") || "0",
      total: safeNumber(searchParams.get("total_final")),
      imagem: searchParams.get("imagem") || "",
      nome: searchParams.get("nome") || "",
      telefone: searchParams.get("telefone") || "",
      taxaAdmTotal:
        safeNumber(searchParams.get("taxa_adm_total")) ||
        TAXA_ADM_TOTAL_FALLBACK,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchParams.toString()]
  );

  const smsOptIn = useMemo(
    () => searchParams.get("sms_opt_in") === "1",
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchParams.toString()]
  );

  // =========================
  // LANCE (vindo da página anterior)
  // =========================
  const lanceInfo = useMemo(() => {
    const lanceValor = safeNumber(searchParams.get("lance_valor"));
    const prazoFinalStr = searchParams.get("prazo_final");
    const parcelaFinal = safeNumber(searchParams.get("parcela_final"));

    const prazoFinal = prazoFinalStr ? parseInt(prazoFinalStr, 10) : 0;
    const hasLance = Number.isFinite(lanceValor) && lanceValor > 0;

    return {
      hasLance,
      lanceValor: hasLance ? lanceValor : 0,
      prazoFinal: Number.isFinite(prazoFinal) && prazoFinal > 0 ? prazoFinal : 0,
      parcelaFinal:
        Number.isFinite(parcelaFinal) && parcelaFinal > 0 ? parcelaFinal : 0,
      modo: searchParams.get("lance_modo") || "",
      creditoAposLance: safeNumber(searchParams.get("credito_apos_lance")),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  // =========================
  // PROMO DO VENDEDOR
  // =========================
  const promo = useMemo(() => {
    const codigo = (searchParams.get("cupom_codigo") || "").trim();
    const label = (searchParams.get("cupom_label") || "").trim();
    const obs = (searchParams.get("cupom_obs") || "").trim();

    const accessoriesFree = searchParams.get("cupom_acessorios_gratis") === "1";
    const platingFree = searchParams.get("cupom_emplacamento_gratis") === "1";

    const discountPercent = safeNumber(
      searchParams.get("cupom_desconto_percent")
    );
    const discountValue = safeNumber(searchParams.get("cupom_desconto_valor"));

    const hasPromo =
      !!codigo ||
      !!label ||
      accessoriesFree ||
      platingFree ||
      (Number.isFinite(discountPercent) && discountPercent > 0) ||
      (Number.isFinite(discountValue) && discountValue > 0) ||
      !!obs;

    return {
      hasPromo,
      codigo,
      label,
      obs,
      accessoriesFree,
      platingFree,
      discountPercent: discountPercent > 0 ? discountPercent : 0,
      discountValue: discountValue > 0 ? discountValue : 0,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  // =========================
  // RECALCULA INTEGRAL E REDUZIDA SEMPRE
  // =========================
  const calculoConsorcio = useMemo(() => {
    const prazoBase = parseInt(dados.prazo || "0", 10) || 0;
    const prazoUsado =
      lanceInfo.hasLance && lanceInfo.prazoFinal > 0
        ? lanceInfo.prazoFinal
        : prazoBase;

    const creditoBase = Math.max(0, dados.valor - dados.entrada);
    const creditoUsado =
      lanceInfo.hasLance && lanceInfo.creditoAposLance > 0
        ? lanceInfo.creditoAposLance
        : creditoBase;

    const valorCategoria = creditoUsado * (1 + dados.taxaAdmTotal);

    const parcelaIntegral = prazoUsado > 0 ? valorCategoria / prazoUsado : 0;

    const parcelaReduzida =
      prazoUsado > 0
        ? (valorCategoria * REDUZIDA_PERCENT_CATEGORIA) / prazoUsado
        : 0;

    let desconto = 0;
    if (promo.hasPromo) {
      const base = dados.valor || 0;
      if (promo.discountPercent > 0)
        desconto = (base * promo.discountPercent) / 100;
      else if (promo.discountValue > 0) desconto = promo.discountValue;
      desconto = Math.max(0, Math.min(desconto, base));
    }

    return {
      prazoUsado,
      parcelaIntegral,
      parcelaReduzida,
      desconto,
    };
  }, [dados, lanceInfo, promo]);

  // ATO = integral
  const atoEntrada = useMemo(() => {
    return safeNumber(calculoConsorcio.parcelaIntegral);
  }, [calculoConsorcio.parcelaIntegral]);

  // PARCELAMENTO = reduzida
  const parcelaReduzidaExibida = useMemo(() => {
    return safeNumber(calculoConsorcio.parcelaReduzida);
  }, [calculoConsorcio.parcelaReduzida]);

  const [, setLoadingValidacao] = useState(false);
  const [, setVerificando] = useState(false);

  const [loadingEnviar, setLoadingEnviar] = useState(false);
  const [pedidoSalvo, setPedidoSalvo] = useState(false);
  const [smsStatus, setSmsStatus] = useState<"idle" | "success" | "failed">(
    "idle"
  );

  const [apiData, setApiData] = useState<any>(null);
  const [nomeManual, setNomeManual] = useState(dados.nome || "");
  const [dataAtual, setDataAtual] = useState("");

  const telefoneDigits = sanitizePhoneFromOtherPage(dados.telefone);
  const telefoneTela = telefoneDigits
    ? formatPhoneForDisplay(telefoneDigits)
    : "---";

  const formatMoney = (val: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);

  const [numeroPedido, setNumeroPedido] = useState<string>("");
  const [aprovadorNome, setAprovadorNome] = useState<string>("");

  useEffect(() => {
    setDataAtual(
      new Date().toLocaleDateString("pt-BR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    );

    if (!nomeManual && dados.nome) setNomeManual(dados.nome);

    setNumeroPedido((prev) => {
      if (prev) return prev;
      return Math.floor(Math.random() * 1000000)
        .toString()
        .padStart(6, "0");
    });

    (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        let nome = user.email || "";
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();

        if (profile?.full_name) nome = profile.full_name;

        if (!nome || nome === user.email) {
          const beforeAt = String(user.email || "").split("@")[0] || "";
          nome = beforeAt ? beforeAt.toUpperCase() : String(user.email || "");
        }

        setAprovadorNome(String(nome || "").toUpperCase());
      } catch {}
    })();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const consultarCpf = async (options?: { silent?: boolean }) => {
    const silent = !!options?.silent;

    if (!dados.cpf) {
      if (!silent) alert("Informe/Envie um CPF para consultar.");
      return { ok: false as const, data: null };
    }

    setVerificando(true);
    setLoadingValidacao(true);

    try {
      const response = await fetch("/api/consultar-cpf", {
        method: "POST",
        body: JSON.stringify({ cpf: dados.cpf }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data && !data.error) {
        setApiData(data);

        const nomeApi =
          data.nome ||
          data.nomeCompleto ||
          data.response?.content?.nome?.conteudo?.nome ||
          "";

        if (nomeApi) setNomeManual(nomeApi);
        else if (!nomeManual && dados.nome) setNomeManual(dados.nome);

        if (!silent) alert("✅ CPF consultado e dados preenchidos!");
        return { ok: true as const, data };
      }

      if (!silent) {
        alert(`❌ ${data?.error || data?.message || "Erro ao buscar dados"}`);
      }
      return { ok: false as const, data: null };
    } catch (error) {
      if (!silent) alert("Erro de conexão.");
      return { ok: false as const, data: null };
    } finally {
      setLoadingValidacao(false);
      setVerificando(false);
    }
  };

  const situacaoReceita =
    apiData?.situacao ||
    apiData?.response?.content?.nome?.conteudo?.situacao_receita ||
    "PENDENTE";
  const dataNascimento = apiData?.nascimento || apiData?.data_nascimento || "---";
  const nomeMae = apiData?.mae || apiData?.nome_mae || "---";

  const enderecoComplexo =
    apiData?.response?.content?.pesquisa_enderecos?.conteudo?.[0];
  const enderecoSimples = apiData?.uf ? { estado: apiData.uf } : null;
  const endereco = enderecoComplexo || enderecoSimples || {};

  const cpfIsRegular =
    String(situacaoReceita || "PENDENTE").toUpperCase() === "REGULAR";

  async function enviarSms(nomeCliente: string) {
    if (!telefoneDigits) return false;

    if (!smsOptIn) {
      console.warn("[sms] não enviado: cliente sem consentimento registrado");
      return false;
    }

    const protocolo = numeroPedido || "------";
    const message = buildSmsMessage(nomeCliente || "cliente", protocolo);

    try {
      const resp = await fetch("/api/sms/enviar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          number: telefoneDigits,
          message,
          messageType: "transactional",
          optIn: smsOptIn,
        }),
      });

      const text = await resp.text();
      let json: any = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {}

      if (!resp.ok || json?.error) {
        console.warn("[sms] HTTP:", resp.status);
        console.warn("[sms] body:", json ?? text);
        return false;
      }

      console.log("[sms] ok:", json ?? text);
      return true;
    } catch (err) {
      console.warn("[sms] erro de rede:", err);
      return false;
    }
  }

  const salvarNoBanco = async () => {
    if (!nomeManual) {
      alert("Preencha/consulte os dados do cliente antes de enviar.");
      return { ok: false as const };
    }

    if (!telefoneDigits) {
      alert(
        "📵 Telefone inválido/ausente. Ele deve vir da página anterior como +55DDDNÚMERO (ex: +5591999999999)."
      );
      return { ok: false as const };
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("Sessão expirada. Faça login novamente.");
        return { ok: false as const };
      }

      let nomeVendedor = user.email || "";
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      if (profile && profile.full_name) {
        nomeVendedor = profile.full_name;
      } else {
        const beforeAt = String(user.email || "").split("@")[0] || "";
        if (beforeAt) nomeVendedor = beforeAt.toUpperCase();
      }

      const payload = {
        seller_id: user.id,
        seller_name: nomeVendedor,
        car_name: dados.modelo,
        client_name: nomeManual.toUpperCase(),
        client_cpf: dados.cpf,
        status: "Aprovado",
        total_price: dados.valor,
        interest_type: dados.tipo,
        client_phone: telefoneDigits,
        created_at: new Date().toISOString(),
        protocol_number: numeroPedido,
        cpf_status: String(situacaoReceita || "PENDENTE").toUpperCase(),
        promo_code: promo.codigo || null,
        promo_label: promo.label || null,
        promo_discount_percent: promo.discountPercent || 0,
        promo_discount_value: promo.discountValue || 0,
        promo_plating_free: promo.platingFree ? true : false,
        promo_accessories_free: promo.accessoriesFree ? true : false,
        promo_note: promo.obs || null,
        lance_value: lanceInfo.hasLance ? lanceInfo.lanceValor : 0,
        prazo_final: calculoConsorcio.prazoUsado || 0,
        parcela_final: parcelaReduzidaExibida || 0,
      };

      const { error } = await supabase.from("sales").insert([payload]);
      if (error) throw error;

      return { ok: true as const, vendedor: nomeVendedor };
    } catch (error: any) {
      console.error(error);
      alert("Erro ao salvar: " + error.message);
      return { ok: false as const };
    }
  };

  const handleEnviarParaAnalise = async () => {
    if (pedidoSalvo) return;

    setLoadingEnviar(true);
    setSmsStatus("idle");

    try {
      const cpfConsultado = await consultarCpf({ silent: true });

      if (!cpfConsultado.ok && !nomeManual && !dados.nome) {
        alert(
          "Não foi possível consultar o CPF e também não há nome disponível para concluir a análise."
        );
        return;
      }

      const saved = await salvarNoBanco();
      if (!saved.ok) return;

      const nomeCliente = (nomeManual || dados.nome || "cliente").trim();
      const okSms = await enviarSms(nomeCliente);
      setSmsStatus(okSms ? "success" : "failed");
      setPedidoSalvo(true);

      const smsFalhaTexto = smsOptIn
        ? "SMS não foi enviado, mas a aprovação segue normalmente."
        : "SMS não foi enviado porque não há consentimento registrado, mas a aprovação segue normalmente.";

      if (cpfConsultado.ok && okSms) {
        alert(
          `✅ Análise concluída. CPF consultado, pedido aprovado e SMS enviado! (${saved.vendedor || "vendedor"})`
        );
      } else if (cpfConsultado.ok && !okSms) {
        alert(
          `✅ Análise concluída. CPF consultado e pedido aprovado no painel. ${smsFalhaTexto} (${saved.vendedor || "vendedor"})`
        );
      } else if (!cpfConsultado.ok && okSms) {
        alert(
          `✅ Análise concluída. Pedido aprovado no painel e SMS enviado! Dados do CPF não puderam ser atualizados agora. (${saved.vendedor || "vendedor"})`
        );
      } else {
        alert(
          `✅ Análise concluída. Pedido aprovado no painel. ${smsFalhaTexto} Dados do CPF não puderam ser atualizados agora. (${saved.vendedor || "vendedor"})`
        );
      }
    } finally {
      setLoadingEnviar(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 font-sans text-zinc-900 pb-32 md:pb-20 print:bg-white print:p-0">
      <header className="px-4 md:px-6 py-4 bg-zinc-900 border-b border-zinc-800 sticky top-0 z-50 print:hidden shadow-xl safe-area-top">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors font-bold text-xs uppercase tracking-widest"
          >
            <ArrowLeft size={18} />{" "}
            <span className="hidden md:inline">Voltar</span>
          </button>

          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={() => window.print()}
              className="bg-zinc-800 border border-zinc-700 text-zinc-300 p-2 md:px-4 md:py-2 rounded-lg text-xs font-bold uppercase hover:bg-zinc-700 hover:text-white flex items-center gap-2 shadow-sm transition-all"
            >
              <Printer size={18} />{" "}
              <span className="hidden md:inline">Imprimir</span>
            </button>

            {!pedidoSalvo ? (
              <button
                onClick={handleEnviarParaAnalise}
                disabled={loadingEnviar}
                className="bg-[#f2e14c] text-black px-4 py-2.5 rounded-lg text-xs font-black uppercase hover:bg-[#ffe600] flex items-center gap-2 shadow-lg shadow-yellow-400/20 transition-all hover:scale-105 active:scale-95"
                title="Salva no painel como APROVADO. Envia SMS se houver consentimento."
              >
                {loadingEnviar ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Send size={16} />
                )}
                <span className="md:inline">
                  {loadingEnviar ? "Analisando..." : "Enviar p/ análise"}
                </span>
              </button>
            ) : (
              <div className="flex flex-col items-end gap-2 animate-in fade-in zoom-in">
                <div className="bg-green-500/10 text-green-500 px-4 py-2.5 rounded-lg text-xs font-black uppercase flex items-center gap-2 border border-green-500/20">
                  <CheckCircle2 size={16} /> Enviado
                </div>
                {smsStatus === "failed" ? (
                  <div className="text-[10px] font-black uppercase px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700">
                    APROVADO MESMO SEM SMS
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="w-full md:max-w-[210mm] mx-auto py-4 md:py-8 px-4 md:px-0 print:max-w-full print:p-0 print:m-0">
        <div className="bg-white shadow-lg md:shadow-2xl rounded-2xl md:rounded-none overflow-hidden w-full min-h-[80vh] md:min-h-[297mm] flex flex-col relative print:shadow-none print:w-full">
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none overflow-hidden">
            <h1 className="text-[80px] md:text-[150px] font-black -rotate-45 text-black whitespace-nowrap">
              NACIONAL CONSÓRCIOS
            </h1>
          </div>

          <div className="p-6 md:p-10 pb-4 md:pb-6 border-b-4 border-black flex flex-col md:flex-row justify-between items-start md:items-start gap-6 md:gap-0 relative z-10 bg-white">
            <div className="flex flex-col gap-1 w-full md:w-auto">
              <div className="flex justify-between items-center md:block">
                <div className="bg-black text-white px-3 py-1 text-xl md:text-2xl font-black tracking-tighter w-fit inline-block mb-1 md:mb-2">
                  NACIONAL CONSÓRCIOS
                </div>
                <div className="md:hidden">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase mr-2">
                    Prot:
                  </span>
                  <span className="text-sm font-mono font-black text-zinc-900 bg-zinc-100 px-2 py-1 rounded">
                    #{numeroPedido || "------"}
                  </span>
                </div>
              </div>
              <h1 className="text-lg md:text-xl font-bold uppercase tracking-tight text-zinc-900">
                Proposta Comercial
              </h1>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium">
                Consórcios & Veículos Multimarcas
              </p>

              {(promo.hasPromo || lanceInfo.hasLance) && (
                <div className="mt-3 flex flex-wrap gap-2 print:hidden">
                  {lanceInfo.hasLance ? (
                    <span className="text-[10px] font-black uppercase px-2 py-1 rounded-full bg-zinc-900 text-white">
                      Lance: {formatMoney(lanceInfo.lanceValor)}
                    </span>
                  ) : null}

                  {promo.hasPromo ? (
                    <>
                      <span className="text-[10px] font-black uppercase px-2 py-1 rounded-full bg-[#f2e14c] text-black">
                        Promo:{" "}
                        {(promo.codigo || promo.label || "Aplicada").toUpperCase()}
                      </span>
                      {promo.platingFree ? (
                        <span className="text-[10px] font-black uppercase px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
                          Emplacamento grátis
                        </span>
                      ) : null}
                      {promo.accessoriesFree ? (
                        <span className="text-[10px] font-black uppercase px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
                          Acessórios grátis
                        </span>
                      ) : null}
                      {promo.discountPercent ? (
                        <span className="text-[10px] font-black uppercase px-2 py-1 rounded-full bg-zinc-100 text-zinc-700">
                          {promo.discountPercent}% OFF
                        </span>
                      ) : null}
                      {promo.discountValue ? (
                        <span className="text-[10px] font-black uppercase px-2 py-1 rounded-full bg-zinc-100 text-zinc-700">
                          {formatMoney(promo.discountValue)} OFF
                        </span>
                      ) : null}
                    </>
                  ) : null}
                </div>
              )}
            </div>

            <div className="text-right hidden md:block">
              <div className="flex flex-col items-end">
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
                  Número do Protocolo
                </p>
                <p className="text-xl font-mono font-black text-zinc-900 bg-zinc-100 px-3 py-1 rounded">
                  #{numeroPedido || "------"}
                </p>
              </div>
              <div className="mt-3 flex items-center justify-end gap-2">
                <span className="text-[10px] font-bold uppercase text-zinc-400">
                  Modalidade:
                </span>
                <span className="bg-[#f2e14c] text-black text-[10px] font-black uppercase px-2 py-0.5 rounded-sm">
                  {dados.tipo}
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-10 space-y-8 flex-1 relative z-10">
            {(loadingEnviar || pedidoSalvo) && (
              <div
                className={`print:hidden relative overflow-hidden rounded-3xl border-2 p-6 md:p-8 shadow-lg ${
                  loadingEnviar
                    ? "border-amber-300 bg-gradient-to-br from-amber-50 via-white to-yellow-100"
                    : "border-green-300 bg-gradient-to-br from-green-50 via-white to-emerald-100"
                }`}
              >
                <div
                  className={`absolute -right-10 -top-10 rounded-full ${
                    loadingEnviar
                      ? "w-40 h-40 bg-amber-500/10"
                      : "w-40 h-40 bg-green-500/10"
                  }`}
                />
                <div
                  className={`absolute -left-10 -bottom-10 rounded-full ${
                    loadingEnviar
                      ? "w-32 h-32 bg-yellow-500/10"
                      : "w-32 h-32 bg-emerald-500/10"
                  }`}
                />

                <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white text-[11px] font-black uppercase shadow-sm ${
                        loadingEnviar
                          ? "border border-amber-200 text-amber-700"
                          : "border border-green-200 text-green-700"
                      }`}
                    >
                      {loadingEnviar ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={14} />
                      )}
                      {loadingEnviar
                        ? "Análise em andamento"
                        : "Resultado da análise"}
                    </div>

                    <h2
                      className={`mt-4 text-3xl md:text-5xl font-black uppercase tracking-tight leading-none ${
                        loadingEnviar ? "text-amber-700" : "text-green-700"
                      }`}
                    >
                      {loadingEnviar ? "Analisando..." : "Aprovado"}
                    </h2>

                    <p className="mt-3 text-sm md:text-base font-bold uppercase tracking-wide text-zinc-700">
                      {loadingEnviar
                        ? "Aguarde só um instante enquanto finalizamos a análise."
                        : "Análise concluída com sucesso e proposta aprovada."}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span
                        className={`text-[11px] font-black uppercase px-3 py-1.5 rounded-full ${
                          loadingEnviar
                            ? "bg-amber-600 text-white"
                            : "bg-green-600 text-white"
                        }`}
                      >
                        {loadingEnviar ? "Status: analisando" : "Status: aprovado"}
                      </span>
                      <span className="text-[11px] font-black uppercase px-3 py-1.5 rounded-full border border-zinc-200 bg-white text-zinc-700">
                        Protocolo #{numeroPedido || "------"}
                      </span>
                      {!loadingEnviar ? (
                        <span
                          className={`text-[11px] font-black uppercase px-3 py-1.5 rounded-full border ${
                            smsStatus === "failed"
                              ? "border-amber-200 bg-amber-50 text-amber-700"
                              : smsStatus === "success"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-zinc-200 bg-zinc-50 text-zinc-700"
                          }`}
                        >
                          {smsStatus === "failed"
                            ? smsOptIn
                              ? "SMS indisponível"
                              : "SMS não enviado"
                            : smsStatus === "success"
                            ? "SMS enviado"
                            : "Processado"}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="md:text-right">
                    <div
                      className={`inline-flex items-center justify-center w-20 h-20 rounded-full text-white shadow-xl ${
                        loadingEnviar ? "bg-amber-500" : "bg-green-600"
                      }`}
                    >
                      {loadingEnviar ? (
                        <Loader2 className="animate-spin" size={36} />
                      ) : (
                        <CheckCircle2 size={40} />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-black pb-2">
                <h3 className="text-sm font-black uppercase flex items-center gap-2">
                  <span className="bg-black text-white w-5 h-5 flex items-center justify-center text-[10px] rounded-full">
                    1
                  </span>
                  Identificação do Cliente
                </h3>
              </div>

              {!pedidoSalvo ? (
                <button
                  onClick={handleEnviarParaAnalise}
                  disabled={loadingEnviar}
                  className="print:hidden w-full group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm hover:shadow-lg transition-all"
                  title="Salva no painel como APROVADO. Envia SMS se houver consentimento."
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#f2e14c]/0 via-[#f2e14c]/25 to-[#f2e14c]/0 opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="relative p-4 md:p-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-zinc-900 text-white flex items-center justify-center shadow-sm">
                        {loadingEnviar ? (
                          <Loader2 className="animate-spin" size={18} />
                        ) : (
                          <Send size={18} />
                        )}
                      </div>

                      <div className="text-left">
                        <p className="text-xs md:text-sm font-black uppercase leading-tight text-zinc-900">
                          Enviar para análise
                        </p>

                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-1 rounded-full border ${
                              cpfIsRegular
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-red-50 text-red-700 border-red-200"
                            }`}
                          >
                            CPF: {String(situacaoReceita).toUpperCase()}
                          </span>

                          <span className="text-[10px] font-black uppercase px-2 py-1 rounded-full border bg-zinc-50 text-zinc-700 border-zinc-200 flex items-center gap-1">
                            <MessageSquare size={12} /> SMS
                          </span>

                          <span
                            className={`text-[10px] font-black uppercase px-2 py-1 rounded-full border ${
                              smsOptIn
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                          >
                            {smsOptIn
                              ? "Consentimento SMS"
                              : "Sem consentimento SMS"}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-black uppercase px-2 py-1 rounded-full border bg-zinc-50 text-zinc-700 border-zinc-200">
                            Aprovador: {aprovadorNome || "—"}
                          </span>

                          <span className="text-[10px] font-black uppercase px-2 py-1 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                            Probabilidades altas
                          </span>

                          <span className="text-[10px] font-black uppercase px-2 py-1 rounded-full border bg-zinc-50 text-zinc-700 border-zinc-200">
                            {BEST_BID_TEXT}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="hidden md:inline text-[10px] font-black uppercase text-zinc-500">
                        #{numeroPedido || "------"}
                      </span>
                      <div className="w-9 h-9 rounded-full bg-[#f2e14c] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                        <ArrowLeft className="rotate-180" size={18} />
                      </div>
                    </div>
                  </div>
                </button>
              ) : (
                <div className="print:hidden w-full rounded-2xl border border-green-500/20 bg-green-500/10 p-4">
                  <div className="flex items-center gap-2 font-black uppercase text-xs text-green-600">
                    <CheckCircle2 size={18} /> Enviado para análise
                  </div>

                  <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className="rounded-xl bg-white/80 border border-green-200 px-3 py-2 text-[11px] font-black uppercase text-green-700 text-center">
                      APROVADO
                    </div>
                    <div className="rounded-xl bg-white/80 border border-zinc-200 px-3 py-2 text-[11px] font-black uppercase text-zinc-700 text-center">
                      Protocolo #{numeroPedido || "------"}
                    </div>
                    <div
                      className={`rounded-xl px-3 py-2 text-[11px] font-black uppercase text-center border ${
                        smsStatus === "failed"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : smsStatus === "success"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-zinc-50 text-zinc-700 border-zinc-200"
                      }`}
                    >
                      {smsStatus === "failed"
                        ? smsOptIn
                          ? "SMS caiu, mas segue aprovado"
                          : "Sem consentimento para SMS"
                        : smsStatus === "success"
                        ? "SMS enviado"
                        : "Em processamento"}
                    </div>
                  </div>
                </div>
              )}

              {!cpfIsRegular && (
                <div className="print:hidden flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100">
                  <AlertTriangle size={16} className="text-amber-700 mt-0.5" />
                  <p className="text-[11px] font-bold text-amber-800 uppercase leading-snug">
                    CPF com pendência ou situação diferente de regular.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-4 text-xs">
                <div className="md:col-span-2">
                  <label className="block text-[9px] font-bold text-zinc-400 uppercase mb-1">
                    Nome Completo
                  </label>
                  <div className="font-mono font-bold text-base md:text-lg uppercase truncate border-b border-dotted border-zinc-300 pb-1 w-full">
                    {nomeManual || "---"}
                  </div>
                </div>

                <div className="md:col-span-1">
                  <label className="block text-[9px] font-bold text-zinc-400 uppercase mb-1">
                    CPF
                  </label>
                  <div className="font-mono font-bold text-base md:text-lg border-b border-dotted border-zinc-300 pb-1 flex items-center gap-2">
                    {dados.cpf}
                    {cpfIsRegular && (
                      <ShieldCheck
                        size={14}
                        className="text-green-600 print:hidden flex-shrink-0"
                      />
                    )}
                  </div>
                </div>

                <div className="md:col-span-1">
                  <label className="block text-[9px] font-bold text-zinc-400 uppercase mb-1">
                    Telefone
                  </label>
                  <div className="font-mono font-bold text-base md:text-lg border-b border-dotted border-zinc-300 pb-1">
                    {telefoneTela}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:contents gap-4">
                  <div className="md:col-span-1">
                    <label className="block text-[9px] font-bold text-zinc-400 uppercase mb-1">
                      Nascimento
                    </label>
                    <div className="font-mono font-medium text-zinc-800 uppercase">
                      {dataNascimento}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[9px] font-bold text-zinc-400 uppercase mb-1">
                      Filiação (Mãe)
                    </label>
                    <div className="font-mono font-medium text-zinc-800 uppercase truncate">
                      {nomeMae}
                    </div>
                  </div>
                </div>

                <div className="md:col-span-1">
                  <label className="block text-[9px] font-bold text-zinc-400 uppercase mb-1">
                    Situação CPF
                  </label>
                  <div
                    className={`font-black uppercase text-[10px] px-2 py-0.5 rounded w-fit ${
                      cpfIsRegular
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {String(situacaoReceita).toUpperCase()}
                  </div>
                </div>

                <div className="md:col-span-4">
                  <label className="block text-[9px] font-bold text-zinc-400 uppercase mb-1">
                    Endereço Residencial
                  </label>
                  <div className="font-mono text-zinc-600 uppercase text-[10px] border border-zinc-200 p-2 rounded bg-zinc-50 print:bg-white print:border-none print:p-0 leading-tight">
                    {endereco.logradouro
                      ? `${endereco.logradouro}, ${
                          endereco.numero || "S/N"
                        } - ${endereco.bairro} - ${endereco.cidade}/${
                          endereco.estado
                        }`
                      : "Endereço não localizado na base de dados."}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-black pb-2">
                <h3 className="text-sm font-black uppercase flex items-center gap-2">
                  <span className="bg-black text-white w-5 h-5 flex items-center justify-center text-[10px] rounded-full">
                    2
                  </span>
                  Objeto do Contrato
                </h3>
              </div>

              <div className="flex flex-col md:flex-row gap-6 items-start border border-zinc-200 rounded-xl p-4 bg-zinc-50 print:bg-white print:border-zinc-300">
                {dados.imagem && (
                  <div className="w-full md:w-32 h-32 md:h-20 bg-white rounded-lg border border-zinc-200 flex items-center justify-center p-2 print:hidden overflow-hidden">
                    <img
                      src={dados.imagem}
                      className="w-full h-full object-contain mix-blend-multiply"
                      alt="Veículo"
                    />
                  </div>
                )}
                <div className="flex-1 grid grid-cols-2 gap-4 w-full">
                  <div>
                    <p className="text-[9px] font-bold text-zinc-400 uppercase">
                      Modelo / Bem
                    </p>
                    <p className="text-lg md:text-xl font-black text-zinc-900 uppercase leading-tight mt-1">
                      {dados.modelo}
                    </p>
                    <p className="text-[10px] text-zinc-500 font-medium mt-1">
                      CÓDIGO FIPE: REF-2026
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-bold text-zinc-400 uppercase">
                      Crédito (com acessórios)
                    </p>
                    <p className="text-lg md:text-xl font-black text-zinc-900 mt-1">
                      {formatMoney(dados.valor)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-black pb-2">
                <h3 className="text-sm font-black uppercase flex items-center gap-2">
                  <span className="bg-black text-white w-5 h-5 flex items-center justify-center text-[10px] rounded-full">
                    3
                  </span>
                  Fluxo de Pagamento
                </h3>
              </div>

              <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
                <div className="flex justify-between items-center p-3 border-b border-zinc-100">
                  <span className="text-xs font-bold text-zinc-500 uppercase">
                    Ato / Entrada
                  </span>
                  <div className="flex-1 border-b border-dotted border-zinc-300 mx-4 relative top-1 hidden md:block"></div>
                  <span className="font-mono font-bold text-zinc-900">
                    {formatMoney(atoEntrada)}
                  </span>
                </div>

                {lanceInfo.hasLance ? (
                  <div className="flex justify-between items-center p-3 border-b border-zinc-100">
                    <span className="text-xs font-bold text-zinc-500 uppercase">
                      Lance{" "}
                      {lanceInfo.modo
                        ? `(${
                            lanceInfo.modo === "reduzir_parcela"
                              ? "Reduzir Parcela"
                              : "Reduzir Meses"
                          })`
                        : ""}
                    </span>
                    <div className="flex-1 border-b border-dotted border-zinc-300 mx-4 relative top-1 hidden md:block"></div>
                    <span className="font-mono font-bold text-zinc-900">
                      {formatMoney(lanceInfo.lanceValor)}
                    </span>
                  </div>
                ) : null}

                <div className="flex justify-between items-center p-4 bg-[#f2e14c]/20 print:bg-gray-100">
                  <div className="flex flex-col">
                    <span className="text-xs font-black uppercase text-zinc-900">
                      Parcelamento
                    </span>
                    <span className="text-[10px] font-bold text-zinc-500">
                      Plano em {calculoConsorcio.prazoUsado} meses
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block text-xl md:text-2xl font-black text-zinc-900">
                      {formatMoney(parcelaReduzidaExibida)}
                    </span>
                    <span className="text-[9px] font-bold text-zinc-500 uppercase">
                      Valor da Parcela Reduzida
                    </span>
                  </div>
                </div>

                {promo.hasPromo && calculoConsorcio.desconto > 0 ? (
                  <div className="flex justify-between items-center p-3 bg-white border-t border-zinc-100">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">
                      Desconto aplicado{" "}
                      {promo.discountPercent
                        ? `(${promo.discountPercent}%)`
                        : ""}
                    </span>
                    <span className="font-mono font-bold text-emerald-700 text-xs">
                      - {formatMoney(calculoConsorcio.desconto)}
                    </span>
                  </div>
                ) : null}
              </div>

              {promo.hasPromo ? (
                <div className="border border-zinc-200 rounded-lg p-3 bg-zinc-50 print:bg-white">
                  <p className="text-[9px] font-bold text-zinc-400 uppercase">
                    Promoção aplicada
                  </p>
                  <p className="text-xs font-black text-zinc-900 uppercase mt-1">
                    {(promo.label || promo.codigo || "Promoção").trim()}
                  </p>
                  {(promo.codigo || promo.obs) && (
                    <p className="text-[10px] text-zinc-600 mt-1">
                      {promo.codigo ? (
                        <span className="font-mono font-bold">
                          {promo.codigo.toUpperCase()}
                        </span>
                      ) : null}
                      {promo.codigo && promo.obs ? " • " : null}
                      {promo.obs}
                    </p>
                  )}

                  <div className="mt-2 flex flex-wrap gap-2">
                    {promo.platingFree ? (
                      <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase">
                        Emplacamento grátis
                      </span>
                    ) : null}
                    {promo.accessoriesFree ? (
                      <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase">
                        Acessórios grátis
                      </span>
                    ) : null}
                    {promo.discountPercent ? (
                      <span className="px-2 py-1 rounded-full bg-zinc-200 text-zinc-800 text-[10px] font-black uppercase">
                        {promo.discountPercent}% off
                      </span>
                    ) : null}
                    {promo.discountValue ? (
                      <span className="px-2 py-1 rounded-full bg-zinc-200 text-zinc-800 text-[10px] font-black uppercase">
                        {formatMoney(promo.discountValue)} off
                      </span>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="border-2 border-dashed border-zinc-300 rounded-lg p-4 min-h-[100px] md:min-h-[120px] bg-zinc-50/50 print:bg-white relative">
              <p className="absolute top-2 left-3 text-[9px] font-bold text-zinc-400 uppercase bg-white px-1">
                Observações / Acessórios
              </p>

              {(promo.hasPromo || lanceInfo.hasLance) && (
                <div className="pt-4 text-[10px] text-zinc-700 leading-relaxed">
                  {lanceInfo.hasLance ? (
                    <p>
                      • Lance aplicado:{" "}
                      <span className="font-mono font-bold">
                        {formatMoney(lanceInfo.lanceValor)}
                      </span>{" "}
                      | Prazo:{" "}
                      <span className="font-mono font-bold">
                        {calculoConsorcio.prazoUsado}x
                      </span>{" "}
                      | Parcela reduzida:{" "}
                      <span className="font-mono font-bold">
                        {formatMoney(parcelaReduzidaExibida)}
                      </span>
                    </p>
                  ) : null}

                  {promo.hasPromo ? (
                    <p className="mt-1">
                      • Promoção:{" "}
                      <span className="font-mono font-bold">
                        {(promo.codigo || promo.label || "APLICADA").toUpperCase()}
                      </span>
                      {promo.platingFree ? " | Emplacamento grátis" : ""}
                      {promo.accessoriesFree ? " | Acessórios grátis" : ""}
                      {promo.discountPercent
                        ? ` | ${promo.discountPercent}% OFF`
                        : ""}
                      {promo.discountValue
                        ? ` | ${formatMoney(promo.discountValue)} OFF`
                        : ""}
                    </p>
                  ) : null}

                  <p className="mt-1">• {BEST_BID_TEXT}</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-auto p-6 md:p-10 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-end mb-8 pt-8 border-t border-black">
              <div className="text-center order-2 md:order-1">
                <p className="font-black text-xs uppercase mb-1">
                  NACIONAL CONSORCIOS
                </p>
                <p className="text-[9px] text-zinc-500 font-mono">
                  CNPJ:59.041.030/0001-99
                </p>
              </div>
              <div className="text-center order-1 md:order-2">
                <div className="border-b border-black mb-2 w-full md:w-3/4 mx-auto"></div>
                <p className="font-bold text-xs uppercase mb-1">
                  {nomeManual || "Cliente Proponente"}
                </p>
                <p className="text-[9px] text-zinc-500 font-mono">
                  CPF: {dados.cpf}
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
              <div className="text-[9px] text-zinc-400 leading-tight max-w-md text-justify">
                Este documento representa uma simulação comercial e não possui
                valor de contrato definitivo até a aprovação de crédito e
                assinatura digital.
              </div>

              <div className="flex items-center gap-2 opacity-50 grayscale">
                <div className="text-right hidden md:block">
                  <p className="text-[8px] font-bold uppercase">Autenticação</p>
                  <p className="text-[8px] font-mono">
                    {numeroPedido || "------"}-X
                  </p>
                </div>
                <div className="bg-white p-1 border border-zinc-200">
                  <QrCode size={32} />
                </div>
              </div>
            </div>

            <div className="text-center mt-4 pt-2 border-t border-zinc-100">
              <p className="text-[9px] font-bold text-zinc-300 uppercase tracking-widest">
                Belém, {dataAtual} • NACIONAL CONSORCIOS
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
    <Suspense fallback={<div></div>}>
      <PedidoContent />
    </Suspense>
  );
}