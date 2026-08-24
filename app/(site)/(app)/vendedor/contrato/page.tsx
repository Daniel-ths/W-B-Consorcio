"use client";

import { useState, Suspense, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Check,
  Loader2,
  ArrowLeft,
  Printer,
  Send,
  QrCode,
  MessageSquare,
  AlertTriangle,
  User,
  Car,
  CreditCard,
  FileText,
} from "lucide-react";

const PHONE_PREFIX_DISPLAY = "+55 ";
const DEFAULT_DDD = "91";

const TAXA_ADM_TOTAL_FALLBACK = 0.4346;
const REDUZIDA_PERCENT_CATEGORIA = 0.7665;

const maskPhoneBRNumber = (digitsOnly: string) => {
  const digits = String(digitsOnly || "").replace(/\D/g, "").slice(0, 9);
  if (!digits) return "";
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

const formatPhoneForDisplay = (digitsE164: string) => {
  const digits = String(digitsE164 || "").replace(/\D/g, "");
  if (!digits.startsWith("55")) return "---";
  const national = digits.slice(2);
  if (national.length !== 10 && national.length !== 11) return "---";
  const ddd = national.slice(0, 2);
  const number = national.slice(2);
  return `${PHONE_PREFIX_DISPLAY}${ddd} ${maskPhoneBRNumber(number)}`;
};

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

const cleanCpf = (cpf: string) => String(cpf || "").replace(/\D/g, "");

const isValidCpf = (cpf: string) => {
  const digits = cleanCpf(cpf);
  if (digits.length !== 11) return false;
  if (/(\d)\1{10}/.test(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(digits[i]) * (10 - i);
  let check = 11 - (sum % 11);
  if (check >= 10) check = 0;
  if (check !== Number(digits[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += Number(digits[i]) * (11 - i);
  check = 11 - (sum % 11);
  if (check >= 10) check = 0;
  return check === Number(digits[10]);
};

const CPF_INVALID_MESSAGE =
  "CPF inválido. Confira os números informados e tente novamente.";

const roundVolkswagenCreditUp = (credit: number) => {
  const value = safeNumber(credit);
  if (!value || value <= 0) return 0;
  if (value >= 100000) return Math.ceil(value / 20000) * 20000;
  return value;
};

type BuilderOrderPayload = {
  source?: string;
  status?: string;
  brand?: string;
  vehicle_slug?: string;
  vehicle_name?: string;
  vehicle_title?: string;
  vehicle_description?: string;
  vehicle_image?: string;
  version?: {
    id?: string;
    name?: string;
    description?: string;
    price?: number;
    image?: string;
  };
  color?: {
    id?: string;
    name?: string;
    description?: string;
    category?: string;
    price?: number;
    image?: string;
    hex?: string;
    versionId?: string;
  } | null;
  kits?: any[];
  accessories?: any[];
  totals?: {
    vehicle?: number;
    color?: number;
    kits?: number;
    accessories?: number;
    total?: number;
    monthly_108?: number;
  };
};

function builderOrderToContractData(order: BuilderOrderPayload | null) {
  if (!order) return null;

  const modelo =
    order.version?.name ||
    [order.vehicle_name, order.color?.name].filter(Boolean).join(" - ") ||
    "Veículo Selecionado";

  const valor =
    safeNumber(order.totals?.total) ||
    safeNumber(order.version?.price) + safeNumber(order.color?.price) ||
    0;

  const imagem =
    order.vehicle_image || order.color?.image || order.version?.image || "";

  return {
    modelo,
    valor,
    imagem,
    vehicleSlug: order.vehicle_slug || "",
    vehicleName: order.vehicle_name || "",
    versionName: order.version?.name || "",
    colorName: order.color?.name || "",
  };
}

const BEST_BID_TEXT =
  "Melhor momento para ofertar lance: entre a 7ª e a 8ª parcela.";

/** {{1}} nome | {{2}} veículo | {{3}} adesão | {{4}} protocolo */
function buildWhatsAppTemplateParams(
  nomeCliente: string,
  veiculo: string,
  valorAdesao: string,
  protocolo: string
) {
  return [
    nomeCliente || "Cliente",
    veiculo || "Veículo",
    valorAdesao || "0,00",
    protocolo || "------",
  ];
}

function PedidoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const pedidoId = searchParams.get("pedido") || "";
  const [builderOrder, setBuilderOrder] = useState<BuilderOrderPayload | null>(
    null
  );

  const builderContractData = useMemo(
    () => builderOrderToContractData(builderOrder),
    [builderOrder]
  );

  useEffect(() => {
    let active = true;

    async function loadBuilderOrder() {
      try {
        const cached =
          localStorage.getItem("wb_contract_order") ||
          localStorage.getItem("wb_analysis_order") ||
          localStorage.getItem("wb_builder_order");

        if (cached && active) setBuilderOrder(JSON.parse(cached));
      } catch {}

      if (!pedidoId) return;

      try {
        const { data, error } = await supabase
          .from("contract_orders")
          .select(
            "payload, vehicle_name, version_name, color_name, vehicle_image, total_value"
          )
          .eq("id", pedidoId)
          .maybeSingle();

        if (!active) return;

        if (!error && data) {
          const payload = (data as any).payload || {
            vehicle_name: (data as any).vehicle_name,
            vehicle_image: (data as any).vehicle_image,
            version: {
              name: (data as any).version_name,
              price: safeNumber((data as any).total_value),
              image: (data as any).vehicle_image,
            },
            color: {
              name: (data as any).color_name,
              image: (data as any).vehicle_image,
              price: 0,
            },
            totals: { total: safeNumber((data as any).total_value) },
          };

          setBuilderOrder(payload);
          localStorage.setItem("wb_contract_order", JSON.stringify(payload));
        }
      } catch (e) {
        console.warn("Não foi possível carregar pedido no contrato:", e);
      }
    }

    loadBuilderOrder();
    return () => {
      active = false;
    };
  }, [pedidoId]);

  const dados = useMemo(
    () => ({
      tipo: searchParams.get("tipo") || "CONSORCIO",
      cpf: searchParams.get("cpf") || "",
      modelo:
        searchParams.get("modelo") ||
        builderContractData?.modelo ||
        "Veículo Selecionado",
      valor:
        safeNumber(searchParams.get("valor")) ||
        builderContractData?.valor ||
        0,
      entrada: safeNumber(searchParams.get("entrada")),
      parcela: safeNumber(searchParams.get("parcela_escolhida")),
      prazo: searchParams.get("prazo_escolhido") || "0",
      total: safeNumber(searchParams.get("total_final")),
      totalFinalBase: safeNumber(searchParams.get("total_final_base")),
      totalFinalComCupom: safeNumber(searchParams.get("total_final_com_cupom")),
      descontoTotalValor: safeNumber(searchParams.get("desconto_total_valor")),
      modoParcela: searchParams.get("modo_parcela") || "",
      percentualCategoria: safeNumber(searchParams.get("percentual_categoria")),
      codigoTabela: searchParams.get("codigo_tabela") || "",
      creditoTabela: safeNumber(searchParams.get("credito_tabela")),
      primeiraParcelaIntegral: safeNumber(
        searchParams.get("primeira_parcela_integral")
      ),
      demaisParcelasReduzidas: safeNumber(
        searchParams.get("demais_parcelas_reduzidas")
      ),
      quantidadeReduzidas: safeNumber(searchParams.get("quantidade_reduzidas")),
      imagem: searchParams.get("imagem") || builderContractData?.imagem || "",
      nome: searchParams.get("nome") || "",
      telefone: searchParams.get("telefone") || "",
      taxaAdmTotal:
        safeNumber(searchParams.get("taxa_adm_total")) ||
        TAXA_ADM_TOTAL_FALLBACK,
      pedidoId,
      origem: searchParams.get("origem") || "",
      vehicleSlug:
        searchParams.get("vehicle_slug") ||
        builderContractData?.vehicleSlug ||
        "",
      vehicleName:
        searchParams.get("vehicle_name") ||
        builderContractData?.vehicleName ||
        "",
      versionName:
        searchParams.get("versao") || builderContractData?.versionName || "",
      colorName:
        searchParams.get("cor") || builderContractData?.colorName || "",
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchParams.toString(), builderContractData, pedidoId]
  );

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

  const promo = useMemo(() => {
    const codigo = (searchParams.get("cupom_codigo") || "").trim();
    const label = (searchParams.get("cupom_label") || "").trim();
    const obs = (searchParams.get("cupom_obs") || "").trim();
    const accessoriesFree = searchParams.get("cupom_acessorios_gratis") === "1";
    const platingFree = searchParams.get("cupom_emplacamento_gratis") === "1";
    const freteFree = searchParams.get("cupom_frete_gratis") === "1";
    const discountPercent = safeNumber(
      searchParams.get("cupom_desconto_percent")
    );
    const discountValue = safeNumber(searchParams.get("cupom_desconto_valor"));

    const hasPromo =
      !!codigo ||
      !!label ||
      accessoriesFree ||
      platingFree ||
      freteFree ||
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
      freteFree,
      discountPercent: discountPercent > 0 ? discountPercent : 0,
      discountValue: discountValue > 0 ? discountValue : 0,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  const calculoConsorcio = useMemo(() => {
    const prazoBase = parseInt(dados.prazo || "0", 10) || 0;
    const prazoUsado =
      lanceInfo.hasLance && lanceInfo.prazoFinal > 0
        ? lanceInfo.prazoFinal
        : prazoBase;

    const creditoBase = Math.max(0, dados.valor - dados.entrada);
    const creditoContrato =
      dados.creditoTabela > 0
        ? dados.creditoTabela
        : roundVolkswagenCreditUp(creditoBase);

    const creditoUsadoParaFallback =
      lanceInfo.hasLance && lanceInfo.creditoAposLance > 0
        ? roundVolkswagenCreditUp(lanceInfo.creditoAposLance)
        : creditoContrato;

    const valorCategoria = creditoUsadoParaFallback * (1 + dados.taxaAdmTotal);
    const parcelaIntegralFallback =
      prazoUsado > 0 ? valorCategoria / prazoUsado : 0;
    const parcelaReduzidaFallback =
      prazoUsado > 0
        ? (valorCategoria * REDUZIDA_PERCENT_CATEGORIA) / prazoUsado
        : 0;

    const parcelaIntegral =
      dados.primeiraParcelaIntegral > 0
        ? dados.primeiraParcelaIntegral
        : parcelaIntegralFallback;

    const parcelaReduzida =
      dados.demaisParcelasReduzidas > 0
        ? dados.demaisParcelasReduzidas
        : parcelaReduzidaFallback;

    const parcelaEscolhida =
      dados.parcela > 0
        ? dados.parcela
        : dados.modoParcela === "integral"
        ? parcelaIntegral
        : parcelaReduzida;

    const parcelaContrato =
      lanceInfo.hasLance && lanceInfo.parcelaFinal > 0
        ? lanceInfo.parcelaFinal
        : dados.modoParcela === "integral"
        ? parcelaEscolhida
        : parcelaReduzida || parcelaEscolhida;

    let desconto = 0;
    if (promo.hasPromo) {
      if (dados.descontoTotalValor > 0) {
        desconto = dados.descontoTotalValor;
      } else {
        const base =
          dados.totalFinalBase ||
          dados.total ||
          creditoContrato ||
          dados.valor ||
          0;
        if (promo.discountPercent > 0) {
          desconto = (base * promo.discountPercent) / 100;
        } else if (promo.discountValue > 0) {
          desconto = promo.discountValue;
        }
        desconto = Math.max(0, Math.min(desconto, base));
      }
    }

    return {
      prazoUsado,
      creditoContrato,
      parcelaIntegral,
      parcelaReduzida,
      parcelaEscolhida,
      parcelaContrato,
      desconto,
    };
  }, [dados, lanceInfo, promo]);

  const atoEntrada = useMemo(
    () => safeNumber(calculoConsorcio.parcelaIntegral),
    [calculoConsorcio.parcelaIntegral]
  );

  const parcelaReduzidaExibida = useMemo(
    () => safeNumber(calculoConsorcio.parcelaContrato),
    [calculoConsorcio.parcelaContrato]
  );

  const valorVeiculo = safeNumber(dados.valor);
  const entradaCliente = safeNumber(dados.entrada);

  const [, setLoadingValidacao] = useState(false);
  const [, setVerificando] = useState(false);

  const [loadingEnviar, setLoadingEnviar] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [waStatus, setWaStatus] = useState<"idle" | "success" | "failed">(
    "idle"
  );

  const [apiData, setApiData] = useState<any>(null);
  const [cpfErro, setCpfErro] = useState("");
  const [nomeManual, setNomeManual] = useState(dados.nome || "");
  const [dataAtual, setDataAtual] = useState("");

  const telefoneDigits = sanitizePhoneFromOtherPage(dados.telefone);
  const telefoneTela = telefoneDigits
    ? formatPhoneForDisplay(telefoneDigits)
    : "---";

  const cpfFormatoValido = isValidCpf(dados.cpf);

  useEffect(() => {
    if (!dados.cpf) {
      setCpfErro("");
      return;
    }
    if (!cpfFormatoValido) {
      setCpfErro(CPF_INVALID_MESSAGE);
      return;
    }
    setCpfErro("");
  }, [dados.cpf, cpfFormatoValido]);

  const formatMoney = (val: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);

  const formatMoneyPlain = (val: number) =>
    new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(safeNumber(val));

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
      const msg = "Informe o CPF do cliente para continuar.";
      setCpfErro(msg);
      if (!silent) alert(msg);
      return { ok: false as const, data: null };
    }

    if (!isValidCpf(dados.cpf)) {
      setCpfErro(CPF_INVALID_MESSAGE);
      if (!silent) alert(CPF_INVALID_MESSAGE);
      return { ok: false as const, data: null };
    }

    setCpfErro("");
    setVerificando(true);
    setLoadingValidacao(true);

    try {
      const response = await fetch("/api/consultar-cpf", {
        method: "POST",
        body: JSON.stringify({ cpf: dados.cpf }),
        headers: { "Content-Type": "application/json" },
      });

      if (response.status === 429) {
        console.warn("[cpf] 429 — seguindo sem API");
        return { ok: false as const, data: null };
      }

      const data = await response.json().catch(() => ({}));

      if (response.ok && data && !data.error) {
        setCpfErro("");
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

      const msg =
        data?.error ||
        data?.message ||
        "Não foi possível validar esse CPF.";

      setCpfErro(String(msg));
      if (!silent) alert(`❌ ${msg}`);
      return { ok: false as const, data: null };
    } catch {
      if (!silent) alert("Erro ao consultar CPF. Segindo mesmo assim.");
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

  const dataNascimento =
    apiData?.nascimento || apiData?.data_nascimento || "---";
  const nomeMae = apiData?.mae || apiData?.nome_mae || "---";

  const cpfIsRegular =
    cpfFormatoValido &&
    String(situacaoReceita || "PENDENTE").toUpperCase() === "REGULAR";

  async function enviarWhatsApp(nomeCliente: string) {
    if (!telefoneDigits) {
      console.warn("[whatsapp] telefone ausente");
      return false;
    }

    const protocolo = numeroPedido || "------";
    const veiculo = dados.modelo || dados.vehicleName || "Veículo";
    const valorAdesao = formatMoneyPlain(atoEntrada);

    try {
      const resp = await fetch("/api/whatsapp/enviar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          number: telefoneDigits,
          customerName: nomeCliente || "Cliente",
          protocolNumber: protocolo,
          vehicleName: veiculo,
          templateParams: buildWhatsAppTemplateParams(
            nomeCliente || "Cliente",
            veiculo,
            valorAdesao,
            protocolo
          ),
        }),
      });

      const text = await resp.text();
      let json: any = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {}

      if (!resp.ok || json?.error) {
        console.warn("[whatsapp] HTTP:", resp.status, json ?? text);
        return false;
      }

      console.log("[whatsapp] ok:", json ?? text);
      return true;
    } catch (err) {
      console.warn("[whatsapp] erro de rede:", err);
      return false;
    }
  }

  const handleEnviarParaAnalise = async () => {
    if (loadingEnviar || enviado) return;

    setLoadingEnviar(true);
    setWaStatus("idle");

    try {
      if (!nomeManual && !dados.nome) {
        alert("Informe o nome do cliente.");
        return;
      }

      if (!telefoneDigits) {
        alert("Telefone inválido. Volte e informe o celular com DDD.");
        return;
      }

      // CPF opcional — 429 não trava
      if (!apiData && isValidCpf(dados.cpf)) {
        await consultarCpf({ silent: true });
      }

      const nomeFinal = nomeManual || dados.nome || "Cliente";
      const waOk = await enviarWhatsApp(nomeFinal);

      setWaStatus(waOk ? "success" : "failed");
      setEnviado(true);

      if (waOk) {
        alert("✅ WhatsApp enviado com sucesso!");
      } else {
        alert(
          "⚠️ Não foi possível enviar o WhatsApp.\nConfira o console (F12) e se o número está no sandbox."
        );
      }
    } finally {
      setLoadingEnviar(false);
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") window.print();
  };

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-[#1a2332]">
      <div className="print:hidden sticky top-0 z-30 border-b border-[#e4ebf3] bg-white/90 backdrop-blur">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm text-[#5a6d80] hover:text-[#10233f]"
          >
            <ArrowLeft size={16} />
            Voltar
          </button>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
        <div className="bg-white border border-[#e4ebf3] rounded-3xl shadow-sm overflow-hidden relative">
          <div className="relative z-10 px-5 sm:px-8 pt-6 pb-4 border-b border-[#eef2f7]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-[#8a9aab]">
                  Nacional Consórcios
                </p>
                <h1 className="text-xl sm:text-2xl font-semibold text-[#10233f] mt-1">
                  Proposta de consórcio
                </h1>
                <p className="text-xs text-[#6b7c8f] mt-1">
                  Protocolo{" "}
                  <span className="font-mono font-semibold text-[#10233f]">
                    #{numeroPedido || "------"}
                  </span>
                </p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold px-2.5 py-1">
                  Aprovado
                </span>
                <p className="text-[11px] text-[#8a9aab] mt-2">{dataAtual}</p>
              </div>
            </div>
          </div>

          <div className="relative z-10 px-5 sm:px-8 py-6 space-y-8">
            <section>
              <div className="flex items-center gap-2 mb-3.5">
                <User size={15} className="text-[#0072bc]" strokeWidth={1.75} />
                <h2 className="text-sm font-semibold text-[#10233f]">
                  Dados do cliente
                </h2>
              </div>

              {!enviado ? (
                <button
                  onClick={handleEnviarParaAnalise}
                  disabled={loadingEnviar}
                  className="print:hidden w-full mb-4 rounded-2xl border border-[#e4ebf3] bg-[#fafbfc] hover:bg-white hover:border-[#0072bc]/35 p-4 transition-all disabled:opacity-70 text-left group"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#0072bc] text-white flex items-center justify-center flex-shrink-0">
                        {loadingEnviar ? (
                          <Loader2 className="animate-spin" size={16} />
                        ) : (
                          <Send size={16} strokeWidth={1.75} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#1a2332]">
                          Enviar WhatsApp ao cliente
                        </p>
                        <p className="text-[11px] text-[#7a8b9e] mt-0.5">
                          Dispara a mensagem de aprovação (template Vonage)
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          <span
                            className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                              cpfIsRegular
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-red-50 text-red-600"
                            }`}
                          >
                            CPF{" "}
                            {cpfErro
                              ? "inválido"
                              : String(situacaoReceita).toUpperCase()}
                          </span>
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#f0f4f8] text-[#6b7c8f] flex items-center gap-1">
                            <MessageSquare size={10} /> WhatsApp
                          </span>
                          {aprovadorNome ? (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#f0f4f8] text-[#6b7c8f]">
                              {aprovadorNome}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#1a2332] text-white flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      <ArrowLeft className="rotate-180" size={14} />
                    </div>
                  </div>
                </button>
              ) : (
                <div className="print:hidden mb-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
                  <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold">
                    <Check size={15} /> Processo concluído
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        waStatus === "failed"
                          ? "bg-amber-100 text-amber-700"
                          : waStatus === "success"
                          ? "bg-emerald-600 text-white"
                          : "bg-white text-[#6b7c8f] border border-[#e4ebf3]"
                      }`}
                    >
                      {waStatus === "failed"
                        ? "WhatsApp não enviado"
                        : waStatus === "success"
                        ? "WhatsApp enviado"
                        : "Processado"}
                    </span>
                  </div>
                </div>
              )}

              {cpfErro ? (
                <div className="print:hidden mb-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-600 flex items-start gap-2">
                  <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                  <span>{cpfErro}</span>
                </div>
              ) : null}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-4 text-sm">
                <div className="sm:col-span-2">
                  <p className="text-[10px] text-[#8a9aab] uppercase tracking-wider mb-0.5">
                    Nome completo
                  </p>
                  <p className="font-semibold text-[#1a2332] uppercase truncate border-b border-dotted border-[#d0dae6] pb-1">
                    {nomeManual || "---"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-[#8a9aab] uppercase tracking-wider mb-0.5">
                    CPF
                  </p>
                  <p className="font-mono font-medium text-[#1a2332] border-b border-dotted border-[#d0dae6] pb-1 flex items-center gap-1.5">
                    {dados.cpf || "---"}
                    {cpfIsRegular && (
                      <Check size={12} className="text-emerald-600 print:hidden" />
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-[#8a9aab] uppercase tracking-wider mb-0.5">
                    Telefone
                  </p>
                  <p className="font-mono font-medium text-[#1a2332] border-b border-dotted border-[#d0dae6] pb-1">
                    {telefoneTela}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-[#8a9aab] uppercase tracking-wider mb-0.5">
                    Nascimento
                  </p>
                  <p className="text-[#5a6d80]">{dataNascimento}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-[10px] text-[#8a9aab] uppercase tracking-wider mb-0.5">
                    Nome da mãe
                  </p>
                  <p className="text-[#5a6d80] uppercase truncate">{nomeMae}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#8a9aab] uppercase tracking-wider mb-0.5">
                    Situação na Receita
                  </p>
                  <span
                    className={`inline-block text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                      cpfIsRegular
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-red-50 text-red-600"
                    }`}
                  >
                    {cpfErro ? "Inválido" : String(situacaoReceita).toUpperCase()}
                  </span>
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-3.5">
                <Car size={15} className="text-[#0072bc]" strokeWidth={1.75} />
                <h2 className="text-sm font-semibold text-[#10233f]">
                  Bem / veículo
                </h2>
              </div>

              <div className="rounded-2xl border border-[#e4ebf3] bg-[#fafbfc] p-4">
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  {dados.imagem ? (
                    <div className="w-full sm:w-32 h-28 sm:h-24 bg-white rounded-xl border border-[#e4ebf3] flex items-center justify-center overflow-hidden print:hidden flex-shrink-0">
                      <img
                        src={dados.imagem}
                        alt=""
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : null}

                  <div className="flex-1 w-full space-y-3">
                    <div>
                      <p className="text-[10px] text-[#8a9aab] uppercase tracking-wider">
                        Modelo
                      </p>
                      <p className="text-base sm:text-lg font-semibold text-[#10233f] uppercase leading-snug mt-0.5">
                        {dados.modelo}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1 border-t border-[#e8eef5]">
                      <div>
                        <p className="text-[10px] text-[#8a9aab] uppercase tracking-wider">
                          Valor do bem
                        </p>
                        <p className="text-sm font-semibold text-[#1a2332] mt-0.5">
                          {formatMoney(valorVeiculo)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-[#8a9aab] uppercase tracking-wider">
                          Entrada
                        </p>
                        <p className="text-sm font-semibold text-[#1a2332] mt-0.5">
                          {formatMoney(entradaCliente)}
                        </p>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <p className="text-[10px] text-[#8a9aab] uppercase tracking-wider">
                          Crédito contratado
                        </p>
                        <p className="text-sm font-semibold text-[#0072bc] mt-0.5">
                          {formatMoney(
                            calculoConsorcio.creditoContrato || valorVeiculo
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-3.5">
                <CreditCard
                  size={15}
                  className="text-[#0072bc]"
                  strokeWidth={1.75}
                />
                <h2 className="text-sm font-semibold text-[#10233f]">
                  Condições de pagamento
                </h2>
              </div>

              <div className="rounded-2xl border border-[#e4ebf3] overflow-hidden">
                <div className="flex justify-between items-center px-4 py-3 border-b border-[#eef2f7]">
                  <div>
                    <span className="text-xs text-[#6b7c8f]">Ato / 1ª parcela</span>
                  </div>
                  <span className="font-mono font-semibold text-[#1a2332]">
                    {formatMoney(atoEntrada)}
                  </span>
                </div>

                <div className="flex justify-between items-center px-4 py-4 bg-[#eef6fc]">
                  <div>
                    <p className="text-xs font-semibold text-[#10233f]">
                      Parcelas seguintes
                    </p>
                    <p className="text-[11px] text-[#6b7c8f]">
                      Plano em {calculoConsorcio.prazoUsado} meses
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-semibold text-[#10233f] tracking-tight">
                      {formatMoney(parcelaReduzidaExibida)}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-3.5">
                <FileText
                  size={15}
                  className="text-[#0072bc]"
                  strokeWidth={1.75}
                />
                <h2 className="text-sm font-semibold text-[#10233f]">
                  Observações
                </h2>
              </div>
              <div className="rounded-2xl border border-dashed border-[#d0dae6] bg-[#fafbfc] p-4">
                <p className="text-[11px] text-[#8a9aab]">• {BEST_BID_TEXT}</p>
              </div>
            </section>
          </div>

          <div className="relative z-10 px-5 sm:px-8 pb-6 pt-2">
            <div className="border-t border-[#eef2f7] pt-7 grid grid-cols-1 sm:grid-cols-2 gap-10">
              <div className="text-center">
                <div className="border-b border-[#c5d0dc] w-4/5 mx-auto mb-2 h-8" />
                <p className="text-xs font-semibold text-[#10233f]">
                  Nacional Consórcio
                </p>
                <p className="text-[10px] text-[#8a9aab] font-mono mt-0.5">
                  CNPJ 59.041.030/0001-99
                </p>
              </div>
              <div className="text-center">
                <div className="border-b border-[#1a2332] w-4/5 mx-auto mb-2 h-8" />
                <p className="text-xs font-semibold text-[#10233f] uppercase">
                  {nomeManual || "Cliente proponente"}
                </p>
                <p className="text-[10px] text-[#8a9aab] font-mono mt-0.5">
                  CPF {dados.cpf || "---"}
                </p>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between gap-4">
              <p className="text-[10px] text-[#a0aec0]">
                Belém (PA), {dataAtual}
              </p>
              <div className="opacity-35 grayscale">
                <QrCode size={28} strokeWidth={1.25} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PedidoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f7f9fc]" />}>
      <PedidoContent />
    </Suspense>
  );
}