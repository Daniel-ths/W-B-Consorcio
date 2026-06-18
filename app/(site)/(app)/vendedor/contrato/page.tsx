

"use client"

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

  if (value >= 100000) {
    return Math.ceil(value / 20000) * 20000;
  }

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
    order.vehicle_image ||
    order.color?.image ||
    order.version?.image ||
    "";

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
    `Saudações ${nomeCliente}! Seu plano foi aceito e seu carro esta mais perto do que nunca! Agora e hora de avançar e garantir sua conquista.`,
    150
  );
}

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-4">

      {!compact ? (
        <div className="leading-none">
          <div className="text-[18px] sm:text-[22px] font-black tracking-[0.24em] text-[#10233f]">
            NACIONAL
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SectionTitle({
  number,
  title,
}: {
  number: string;
  title: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-[#d9e6f2] pb-3">
      <h3 className="text-sm font-black uppercase flex items-center gap-2 text-[#10233f] tracking-tight">
        <span className="bg-[#0072bc] text-white w-6 h-6 flex items-center justify-center text-[10px] rounded-full shadow-sm">
          {number}
        </span>
        {title}
      </h3>
    </div>
  );
}

function InfoLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[9px] font-black text-[#8792a1] uppercase mb-1 tracking-widest">
      {children}
    </label>
  );
}

function PedidoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const pedidoId = searchParams.get("pedido") || "";
  const [builderOrder, setBuilderOrder] = useState<BuilderOrderPayload | null>(null);

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

        if (cached && active) {
          setBuilderOrder(JSON.parse(cached));
        }
      } catch {}

      if (!pedidoId) return;

      try {
        const { data, error } = await supabase
          .from("contract_orders")
          .select("payload, vehicle_name, version_name, color_name, vehicle_image, total_value")
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
            totals: {
              total: safeNumber((data as any).total_value),
            },
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
      primeiraParcelaIntegral: safeNumber(searchParams.get("primeira_parcela_integral")),
      demaisParcelasReduzidas: safeNumber(searchParams.get("demais_parcelas_reduzidas")),
      quantidadeReduzidas: safeNumber(searchParams.get("quantidade_reduzidas")),
      imagem:
        searchParams.get("imagem") ||
        builderContractData?.imagem ||
        "",
      nome: searchParams.get("nome") || "",
      telefone: searchParams.get("telefone") || "",
      taxaAdmTotal:
        safeNumber(searchParams.get("taxa_adm_total")) ||
        TAXA_ADM_TOTAL_FALLBACK,
      pedidoId,
      origem: searchParams.get("origem") || "",
      vehicleSlug: searchParams.get("vehicle_slug") || builderContractData?.vehicleSlug || "",
      vehicleName: searchParams.get("vehicle_name") || builderContractData?.vehicleName || "",
      versionName: searchParams.get("versao") || builderContractData?.versionName || "",
      colorName: searchParams.get("cor") || builderContractData?.colorName || "",
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

    const parcelaIntegralFallback = prazoUsado > 0 ? valorCategoria / prazoUsado : 0;

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
        const base = dados.totalFinalBase || dados.total || creditoContrato || dados.valor || 0;

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

  const atoEntrada = useMemo(() => {
    return safeNumber(calculoConsorcio.parcelaIntegral);
  }, [calculoConsorcio.parcelaIntegral]);

  const parcelaReduzidaExibida = useMemo(() => {
    return safeNumber(calculoConsorcio.parcelaContrato);
  }, [calculoConsorcio.parcelaContrato]);

  const [, setLoadingValidacao] = useState(false);
  const [, setVerificando] = useState(false);

  const [loadingEnviar, setLoadingEnviar] = useState(false);
  const [pedidoSalvo, setPedidoSalvo] = useState(false);
  const [smsStatus, setSmsStatus] = useState<"idle" | "success" | "failed">(
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
        "Não foi possível validar esse CPF. Confira os dados e tente novamente.";

      setCpfErro(String(msg));

      if (!silent) {
        alert(`❌ ${msg}`);
      }

      return { ok: false as const, data: null };
    } catch {
      const msg =
        "Não foi possível validar o CPF agora. Verifique sua conexão e tente novamente.";

      setCpfErro(msg);

      if (!silent) alert(msg);

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

  const enderecoComplexo =
    apiData?.response?.content?.pesquisa_enderecos?.conteudo?.[0];

  const enderecoSimples = apiData?.uf ? { estado: apiData.uf } : null;

  const endereco = enderecoComplexo || enderecoSimples || {};

  const cpfIsRegular =
    cpfFormatoValido &&
    String(situacaoReceita || "PENDENTE").toUpperCase() === "REGULAR";

  async function enviarSms(nomeCliente: string) {
    if (!telefoneDigits) return false;

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
          optIn: true,
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
        total_price: calculoConsorcio.creditoContrato || dados.valor,
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

    if (!isValidCpf(dados.cpf)) {
      setCpfErro(CPF_INVALID_MESSAGE);
      alert(CPF_INVALID_MESSAGE);
      setLoadingEnviar(false);
      return;
    }

    setCpfErro("");

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

      if (cpfConsultado.ok && okSms) {
        alert(
          `✅ Análise concluída. CPF consultado, pedido aprovado e SMS enviado! (${saved.vendedor || "vendedor"})`
        );
      } else if (cpfConsultado.ok && !okSms) {
        alert(
          `✅ Análise concluída. CPF consultado e pedido aprovado no painel. SMS não foi enviado, mas a aprovação segue normalmente. (${saved.vendedor || "vendedor"})`
        );
      } else if (!cpfConsultado.ok && okSms) {
        alert(
          `✅ Análise concluída. Pedido aprovado no painel e SMS enviado! Dados do CPF não puderam ser atualizados agora. (${saved.vendedor || "vendedor"})`
        );
      } else {
        alert(
          `✅ Análise concluída. Pedido aprovado no painel. SMS não foi enviado e os dados do CPF não puderam ser atualizados agora. (${saved.vendedor || "vendedor"})`
        );
      }
    } finally {
      setLoadingEnviar(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f8fb] font-sans text-[#172033] pb-32 md:pb-20 print:bg-white print:p-0">
      <header className="px-4 md:px-6 py-4 bg-white/95 backdrop-blur border-b border-[#d9e6f2] sticky top-0 z-50 print:hidden shadow-[0_10px_35px_rgba(16,35,63,0.08)] safe-area-top">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[#566173] hover:text-[#0072bc] transition-colors font-black text-xs uppercase tracking-widest"
          >
            <ArrowLeft size={18} />
            <span className="hidden md:inline">Voltar</span>
          </button>

          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={() => window.print()}
              className="bg-white border border-[#d9e6f2] text-[#43546a] p-2 md:px-4 md:py-2 rounded-xl text-xs font-black uppercase hover:border-[#0072bc] hover:text-[#0072bc] flex items-center gap-2 shadow-sm transition-all"
            >
              <Printer size={18} />
              <span className="hidden md:inline">Imprimir</span>
            </button>

            {!pedidoSalvo ? (
              <button
                onClick={handleEnviarParaAnalise}
                disabled={loadingEnviar}
                className="bg-[#0072bc] text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase hover:bg-[#005d99] flex items-center gap-2 shadow-lg shadow-[#0072bc]/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-70"
                title="Salva no painel como APROVADO e tenta enviar SMS."
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
                <div className="bg-emerald-50 text-emerald-700 px-4 py-2.5 rounded-xl text-xs font-black uppercase flex items-center gap-2 border border-emerald-200">
                  <CheckCircle2 size={16} /> Enviado
                </div>

                {smsStatus === "failed" ? (
                  <div className="text-[10px] font-black uppercase px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-700">
                    Aprovado sem SMS
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="w-full md:max-w-[210mm] mx-auto py-4 md:py-8 px-4 md:px-0 print:max-w-full print:p-0 print:m-0">
        <div className="bg-white shadow-[0_25px_80px_rgba(16,35,63,0.12)] rounded-[28px] md:rounded-[32px] overflow-hidden w-full min-h-[80vh] md:min-h-[297mm] flex flex-col relative print:shadow-none print:w-full print:rounded-none">
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.035] pointer-events-none select-none overflow-hidden">
            <h1 className="text-[72px] md:text-[135px] font-black -rotate-45 text-[#10233f] whitespace-nowrap tracking-widest">
              NACIONAL CONSÓRCIO
            </h1>
          </div>

          <div className="p-6 md:p-10 pb-4 md:pb-6 border-b-4 border-[#0072bc] flex flex-col md:flex-row justify-between items-start md:items-start gap-6 md:gap-0 relative z-10 bg-white">
            <div className="flex flex-col gap-1 w-full md:w-auto">
              <div className="flex justify-between items-center md:block">
                <div className="mb-2">
                  <BrandMark compact={false} />
                </div>

                <div className="md:hidden">
                  <span className="text-[10px] text-[#8792a1] font-bold uppercase mr-2">
                    Prot:
                  </span>
                  <span className="text-sm font-mono font-black text-[#10233f] bg-[#f4f8fb] px-2 py-1 rounded-lg border border-[#d9e6f2]">
                    #{numeroPedido || "------"}
                  </span>
                </div>
              </div>

              <h1 className="text-lg md:text-xl font-black uppercase tracking-tight text-[#10233f] mt-3">
                Proposta Comercial
              </h1>

              <p className="text-[10px] text-[#566173] uppercase tracking-widest font-bold">
                Consórcio, veículos e soluções comerciais
              </p>

              {(promo.hasPromo || lanceInfo.hasLance) && (
                <div className="mt-3 flex flex-wrap gap-2 print:hidden">
                  {lanceInfo.hasLance ? (
                    <span className="text-[10px] font-black uppercase px-2 py-1 rounded-full bg-[#10233f] text-white">
                      Lance: {formatMoney(lanceInfo.lanceValor)}
                    </span>
                  ) : null}

                  {promo.hasPromo ? (
                    <>
                      <span className="text-[10px] font-black uppercase px-2 py-1 rounded-full bg-[#dff0fb] text-[#0072bc] border border-[#b8dcf1]">
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
                        <span className="text-[10px] font-black uppercase px-2 py-1 rounded-full bg-[#f4f8fb] text-[#43546a] border border-[#d9e6f2]">
                          {promo.discountPercent}% OFF
                        </span>
                      ) : null}

                      {promo.discountValue ? (
                        <span className="text-[10px] font-black uppercase px-2 py-1 rounded-full bg-[#f4f8fb] text-[#43546a] border border-[#d9e6f2]">
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
                <p className="text-[9px] font-black text-[#8792a1] uppercase tracking-widest mb-1">
                  Número do Protocolo
                </p>
                <p className="text-xl font-mono font-black text-[#10233f] bg-[#f4f8fb] border border-[#d9e6f2] px-3 py-1 rounded-xl">
                  #{numeroPedido || "------"}
                </p>
              </div>

              <div className="mt-3 flex items-center justify-end gap-2">
                <span className="text-[10px] font-black uppercase text-[#8792a1]">
                  Modalidade:
                </span>
                <span className="bg-[#0072bc] text-white text-[10px] font-black uppercase px-3 py-1 rounded-full">
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
                    ? "border-[#b8dcf1] bg-gradient-to-br from-[#dff0fb] via-white to-[#f4f8fb]"
                    : "border-emerald-300 bg-gradient-to-br from-emerald-50 via-white to-emerald-100"
                }`}
              >
                <div
                  className={`absolute -right-10 -top-10 rounded-full ${
                    loadingEnviar
                      ? "w-40 h-40 bg-[#0072bc]/10"
                      : "w-40 h-40 bg-green-500/10"
                  }`}
                />

                <div
                  className={`absolute -left-10 -bottom-10 rounded-full ${
                    loadingEnviar
                      ? "w-32 h-32 bg-[#0072bc]/10"
                      : "w-32 h-32 bg-emerald-500/10"
                  }`}
                />

                <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white text-[11px] font-black uppercase shadow-sm ${
                        loadingEnviar
                          ? "border border-[#b8dcf1] text-[#0072bc]"
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
                        loadingEnviar ? "text-[#0072bc]" : "text-green-700"
                      }`}
                    >
                      {loadingEnviar ? "Analisando..." : "Aprovado"}
                    </h2>

                    <p className="mt-3 text-sm md:text-base font-bold uppercase tracking-wide text-[#43546a]">
                      {loadingEnviar
                        ? "Aguarde enquanto finalizamos a análise comercial."
                        : "Análise concluída com sucesso e proposta aprovada."}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span
                        className={`text-[11px] font-black uppercase px-3 py-1.5 rounded-full ${
                          loadingEnviar
                            ? "bg-[#0072bc] text-white"
                            : "bg-green-600 text-white"
                        }`}
                      >
                        {loadingEnviar ? "Status: analisando" : "Status: aprovado"}
                      </span>

                      {!loadingEnviar ? (
                        <span
                          className={`text-[11px] font-black uppercase px-3 py-1.5 rounded-full border ${
                            smsStatus === "failed"
                              ? "border-amber-200 bg-amber-50 text-amber-700"
                              : smsStatus === "success"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-[#d9e6f2] bg-[#f4f8fb] text-[#43546a]"
                          }`}
                        >
                          {smsStatus === "failed"
                            ? "SMS indisponível"
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
                        loadingEnviar ? "bg-[#0072bc]" : "bg-green-600"
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
              <SectionTitle number="1" title="Identificação do Cliente" />

              {!pedidoSalvo ? (
                <button
                  onClick={handleEnviarParaAnalise}
                  disabled={loadingEnviar}
                  className="print:hidden w-full group relative overflow-hidden rounded-2xl border border-[#d9e6f2] bg-white shadow-sm hover:shadow-lg transition-all disabled:opacity-70"
                  title="Salva no painel como APROVADO e tenta enviar SMS."
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#0072bc]/0 via-[#0072bc]/10 to-[#0072bc]/0 opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="relative p-4 md:p-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-[#0072bc] text-white flex items-center justify-center shadow-sm">
                        {loadingEnviar ? (
                          <Loader2 className="animate-spin" size={18} />
                        ) : (
                          <Send size={18} />
                        )}
                      </div>

                      <div className="text-left">
                        <p className="text-xs md:text-sm font-black uppercase leading-tight text-[#10233f]">
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
                            CPF: {cpfErro ? "INVÁLIDO" : String(situacaoReceita).toUpperCase()}
                          </span>

                          <span className="text-[10px] font-black uppercase px-2 py-1 rounded-full border bg-[#f4f8fb] text-[#43546a] border-[#d9e6f2] flex items-center gap-1">
                            <MessageSquare size={12} /> SMS
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-black uppercase px-2 py-1 rounded-full border bg-[#f4f8fb] text-[#43546a] border-[#d9e6f2]">
                            Aprovador: {aprovadorNome || "—"}
                          </span>

                          <span className="text-[10px] font-black uppercase px-2 py-1 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                            Probabilidades altas
                          </span>

                          <span className="text-[10px] font-black uppercase px-2 py-1 rounded-full border bg-[#dff0fb] text-[#0072bc] border-[#b8dcf1]">
                            {BEST_BID_TEXT}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="hidden md:inline text-[10px] font-black uppercase text-[#8792a1]">
                        #{numeroPedido || "------"}
                      </span>

                      <div className="w-9 h-9 rounded-full bg-[#10233f] text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
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
                      Aprovado
                    </div>

                    <div
                      className={`rounded-xl px-3 py-2 text-[11px] font-black uppercase text-center border ${
                        smsStatus === "failed"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : smsStatus === "success"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-[#f4f8fb] text-[#43546a] border-[#d9e6f2]"
                      }`}
                    >
                      {smsStatus === "failed"
                        ? "SMS caiu, mas segue aprovado"
                        : smsStatus === "success"
                        ? "SMS enviado"
                        : "Em processamento"}
                    </div>
                  </div>
                </div>
              )}

              {cpfErro ? (
                <div className="print:hidden rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700 flex items-start gap-2">
                  <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                  <span>{cpfErro}</span>
                </div>
              ) : null}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-4 text-xs">
                <div className="md:col-span-2">
                  <InfoLabel>Nome Completo</InfoLabel>
                  <div className="font-mono font-bold text-base md:text-lg uppercase truncate border-b border-dotted border-[#b8c7d9] pb-1 w-full text-[#172033]">
                    {nomeManual || "---"}
                  </div>
                </div>

                <div className="md:col-span-1">
                  <InfoLabel>CPF</InfoLabel>
                  <div className="font-mono font-bold text-base md:text-lg border-b border-dotted border-[#b8c7d9] pb-1 flex items-center gap-2 text-[#172033]">
                    {dados.cpf}

                    {cpfIsRegular && (
                      <ShieldCheck
                        size={14}
                        className="text-green-600 print:hidden flex-shrink-0"
                      />
                    )}

                    {cpfErro && (
                      <AlertTriangle
                        size={14}
                        className="text-red-600 print:hidden flex-shrink-0"
                      />
                    )}
                  </div>
                </div>

                <div className="md:col-span-1">
                  <InfoLabel>Telefone</InfoLabel>
                  <div className="font-mono font-bold text-base md:text-lg border-b border-dotted border-[#b8c7d9] pb-1 text-[#172033]">
                    {telefoneTela}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:contents gap-4">
                  <div className="md:col-span-1">
                    <InfoLabel>Nascimento</InfoLabel>
                    <div className="font-mono font-medium text-[#43546a] uppercase">
                      {dataNascimento}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <InfoLabel>Filiação</InfoLabel>
                    <div className="font-mono font-medium text-[#43546a] uppercase truncate">
                      {nomeMae}
                    </div>
                  </div>
                </div>

                <div className="md:col-span-1">
                  <InfoLabel>Situação CPF</InfoLabel>
                  <div
                    className={`font-black uppercase text-[10px] px-2 py-0.5 rounded w-fit ${
                      cpfIsRegular
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {cpfErro ? "CPF INVÁLIDO" : String(situacaoReceita).toUpperCase()}
                  </div>
                </div>

                <div className="md:col-span-4">
                  <InfoLabel>Endereço Residencial</InfoLabel>
                  <div className="font-mono text-[#566173] uppercase text-[10px] border border-[#d9e6f2] p-2 rounded-xl bg-[#f4f8fb] print:bg-white print:border-none print:p-0 leading-tight">
                    {endereco.logradouro
                      ? `${endereco.logradouro}, ${
                          endereco.numero || "S/N"
                        } - ${endereco.bairro} - ${endereco.cidade}/${
                          endereco.estado
                        }`
                      : "Endereço não localizado."}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <SectionTitle number="2" title="Objeto do Contrato" />

              <div className="flex flex-col md:flex-row gap-6 items-start border border-[#d9e6f2] rounded-2xl p-4 bg-[#f4f8fb] print:bg-white print:border-[#d9e6f2]">
                {dados.imagem && (
                  <div className="w-full md:w-32 h-32 md:h-20 bg-white rounded-xl border border-[#d9e6f2] flex items-center justify-center p-2 print:hidden overflow-hidden">
                    <img
                      src={dados.imagem}
                      alt="Imagem do veículo"
                      className="w-full h-full object-contain mix-blend-multiply"
                    />
                  </div>
                )}

                <div className="flex-1 grid grid-cols-2 gap-4 w-full">
                  <div>
                    <p className="text-[9px] font-black text-[#8792a1] uppercase tracking-widest">
                      Modelo / Bem
                    </p>

                    <p className="text-lg md:text-xl font-black text-[#10233f] uppercase leading-tight mt-1">
                      {dados.modelo}
                    </p>

                    <p className="text-[10px] text-[#566173] font-medium mt-1">
                      CÓDIGO FIPE: REF-2026
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-[9px] font-black text-[#8792a1] uppercase tracking-widest">
                      Crédito
                    </p>

                    <p className="text-lg md:text-xl font-black text-[#10233f] mt-1">
                      {formatMoney(calculoConsorcio.creditoContrato || dados.valor)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <SectionTitle number="3" title="Fluxo de Pagamento" />

              <div className="bg-white border border-[#d9e6f2] rounded-2xl overflow-hidden">
                <div className="flex justify-between items-center p-3 border-b border-[#e8f0f7]">
                  <span className="text-xs font-bold text-[#566173] uppercase">
                    Ato / Entrada
                  </span>

                  <div className="flex-1 border-b border-dotted border-[#b8c7d9] mx-4 relative top-1 hidden md:block"></div>

                  <span className="font-mono font-bold text-[#10233f]">
                    {formatMoney(atoEntrada)}
                  </span>
                </div>

                {lanceInfo.hasLance ? (
                  <div className="flex justify-between items-center p-3 border-b border-[#e8f0f7]">
                    <span className="text-xs font-bold text-[#566173] uppercase">
                      Lance{" "}
                      {lanceInfo.modo
                        ? `(${
                            lanceInfo.modo === "reduzir_parcela"
                              ? "Reduzir Parcela"
                              : "Reduzir Meses"
                          })`
                        : ""}
                    </span>

                    <div className="flex-1 border-b border-dotted border-[#b8c7d9] mx-4 relative top-1 hidden md:block"></div>

                    <span className="font-mono font-bold text-[#10233f]">
                      {formatMoney(lanceInfo.lanceValor)}
                    </span>
                  </div>
                ) : null}

                <div className="flex justify-between items-center p-4 bg-[#dff0fb] print:bg-gray-100">
                  <div className="flex flex-col">
                    <span className="text-xs font-black uppercase text-[#10233f]">
                      Parcelamento
                    </span>

                    <span className="text-[10px] font-bold text-[#566173]">
                      Plano em {calculoConsorcio.prazoUsado} meses
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="block text-xl md:text-2xl font-black text-[#10233f]">
                      {formatMoney(parcelaReduzidaExibida)}
                    </span>

                    <span className="text-[9px] font-bold text-[#566173] uppercase">
                      {dados.modoParcela === "integral"
                        ? "Valor da Parcela Integral"
                        : "Valor da Parcela Reduzida"}
                    </span>
                  </div>
                </div>

                {promo.hasPromo && calculoConsorcio.desconto > 0 ? (
                  <div className="flex justify-between items-center p-3 bg-white border-t border-[#e8f0f7]">
                    <span className="text-[10px] font-bold text-[#8792a1] uppercase">
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
                <div className="border border-[#d9e6f2] rounded-2xl p-3 bg-[#f4f8fb] print:bg-white">
                  <p className="text-[9px] font-black text-[#8792a1] uppercase tracking-widest">
                    Promoção aplicada
                  </p>

                  <p className="text-xs font-black text-[#10233f] uppercase mt-1">
                    {(promo.label || promo.codigo || "Promoção").trim()}
                  </p>

                  {(promo.codigo || promo.obs) && (
                    <p className="text-[10px] text-[#566173] mt-1">
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
                      <span className="px-2 py-1 rounded-full bg-white text-[#43546a] border border-[#d9e6f2] text-[10px] font-black uppercase">
                        {promo.discountPercent}% off
                      </span>
                    ) : null}

                    {promo.discountValue ? (
                      <span className="px-2 py-1 rounded-full bg-white text-[#43546a] border border-[#d9e6f2] text-[10px] font-black uppercase">
                        {formatMoney(promo.discountValue)} off
                      </span>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="border-2 border-dashed border-[#b8c7d9] rounded-2xl p-4 min-h-[100px] md:min-h-[120px] bg-[#f4f8fb]/70 print:bg-white relative">
              <p className="absolute top-2 left-3 text-[9px] font-black text-[#8792a1] uppercase bg-white px-1 tracking-widest">
                Observações / Acessórios
              </p>

              {(promo.hasPromo || lanceInfo.hasLance) && (
                <div className="pt-4 text-[10px] text-[#43546a] leading-relaxed">
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

          <div className="mt-auto p-6 md:p-10 pt-0 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-end mb-8 pt-8 border-t border-[#d9e6f2]">
              <div className="text-center order-2 md:order-1">
                <p className="font-black text-xs uppercase mb-1 text-[#10233f]">
                  Nacional Consórcio
                </p>

                <p className="text-[9px] text-[#566173] font-mono">
                  CNPJ: 59.041.030/0001-99
                </p>
              </div>

              <div className="text-center order-1 md:order-2">
                <div className="border-b border-[#10233f] mb-2 w-full md:w-3/4 mx-auto"></div>

                <p className="font-bold text-xs uppercase mb-1 text-[#10233f]">
                  {nomeManual || "Cliente Proponente"}
                </p>

                <p className="text-[9px] text-[#566173] font-mono">
                  CPF: {dados.cpf}
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
              <div className="text-[9px] text-[#8792a1] leading-tight max-w-md text-justify">
                Este documento representa uma simulação comercial e não possui
                valor de contrato definitivo até a aprovação de crédito e
                assinatura digital.
              </div>

              <div className="flex items-center gap-2 opacity-60 grayscale">
                <div className="bg-white p-1 border border-[#d9e6f2] rounded-lg">
                  <QrCode size={32} />
                </div>
              </div>
            </div>

            <div className="text-center mt-4 pt-2 border-t border-[#edf3f8]">
              <p className="text-[9px] font-bold text-[#8792a1] uppercase tracking-widest">
                Belém, {dataAtual} • Nacional Consórcio
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
    <Suspense fallback={<div className="min-h-screen bg-[#f4f8fb]" />}>
      <PedidoContent />
    </Suspense>
  );
}