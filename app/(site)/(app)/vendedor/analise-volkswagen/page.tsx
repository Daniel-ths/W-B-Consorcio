"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  Loader2,
  Landmark,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  DollarSign,
  X,
  Tag,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

// =====================================================
// VOLKSWAGEN AUTO - SEM TABELA DE CRÉDITOS NA TELA
// =====================================================

const SANTANDER_URL =
  "https://www.cliente.santanderfinanciamentos.com.br/originacaocliente/?mathts=nonpaid#/dados-pessoais";

const CONTRACT_ROUTE = "/vendedor/contrato";

// FINANCIAMENTO
const TAXA_FINANCIAMENTO_MERCADO = 0.022; // 2.2% a.m
const FINANCIAMENTO_PRAZOS = [12, 24, 36, 48, 60];

const VW_ADMIN_TAX_PERCENT = 21;
const VW_FUNDO_RESERVA_PERCENT = 3;
const VW_SEGURO_PERCENT_LABEL = "0,061% a.m";
const VW_GRUPO_LABEL = "Grupo 1130/1131/1132";
const VW_AUTO_PRAZOS = [80, 70, 60, 50, 36, 24] as const;

type VwPrazo = (typeof VW_AUTO_PRAZOS)[number];
type PlanMode = "essencial" | "convencional";
type LanceMode = "reduzir_parcela" | "reduzir_meses";

const VW_PLANO_CODES: Record<PlanMode, string> = {
  convencional: "40000",
  essencial: "40001",
};

type PaymentParams = {
  tipo: "CONSORCIO" | "FINANCIAMENTO";
  entrada: number;
  modelo: string;
  valor: number;
  imagem: string;
  pedido: string;
  origem: string;
  vehicleSlug: string;
  vehicleName: string;
  versionName: string;
  colorName: string;
};

type CouponEffect = {
  accessoriesFree?: boolean;
  platingFree?: boolean;
  freteFree?: boolean;
  discountPercent?: number;
  discountValue?: number;
  note?: string;
};

type Coupon = {
  code: string;
  label: string;
  description: string;
  sellerOnly?: boolean;
  sellerId?: string;
  effects: CouponEffect;
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
  client?: {
    name?: string;
    cpf?: string;
    email?: string;
    phone?: string;
  };
  seller?: {
    name?: string;
    id?: string | null;
    email?: string | null;
  };
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
  motor?: {
    id?: string;
    name?: string;
    description?: string;
    price?: number;
    power?: string;
    fuel?: string;
    transmission?: string;
    traction?: string;
  };
  interior?: any;
  kits?: any[];
  accessories?: any[];
  totals?: {
    vehicle?: number;
    color?: number;
    kits?: number;
    accessories?: number;
    interior?: number;
    total?: number;
    monthly_108?: number;
  };
  payment?: any;
};

const VW_AUTO_PERCENTUAL_PARCELA: Record<PlanMode, Record<VwPrazo, number>> = {
  essencial: {
    80: 1694.89 / 130000,
    70: 1922.97 / 130000,
    60: 2227.06 / 130000,
    50: 2652.83 / 130000,
    36: 3646.26 / 130000,
    24: 5420.21 / 130000,
  },
  convencional: {
    80: 2113.33 / 130000,
    70: 2401.19 / 130000,
    60: 2785.0 / 130000,
    50: 3322.33 / 130000,
    36: 4576.11 / 130000,
    24: 6815.0 / 130000,
  },
};

const COUPONS: Coupon[] = [
  {
    code: "FRETE100",
    label: "Frete grátis",
    description:
      "Libera o frete sem custo na venda. Os acessórios permanecem com preço normal.",
    sellerOnly: true,
    effects: { freteFree: true, note: "Frete 100% grátis." },
  },
  {
    code: "PLACA100",
    label: "Placa grátis",
    description:
      "Libera o emplacamento sem custo na venda. Os acessórios permanecem com preço normal.",
    sellerOnly: true,
    effects: { platingFree: true, note: "Emplacamento 100% grátis." },
  },
  {
    code: "WBCVIP",
    label: "VIP: frete + placa grátis",
    description:
      "Libera frete e emplacamento sem custo na venda. Os acessórios permanecem com preço normal.",
    sellerOnly: true,
    effects: {
      freteFree: true,
      platingFree: true,
      note: "Frete + emplacamento 100% grátis.",
    },
  },
];

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function safeNumber(v: any) {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const normalized = String(v || "0")
    .replace(/R\$/g, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .trim();
  const n = parseFloat(normalized);
  return Number.isFinite(n) ? n : 0;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(safeNumber(value));
}

function formatBRLInput(value: number) {
  return formatMoney(value).replace(/^R\$\s?/, "");
}

function parseDigitsToBRLNumber(raw: string) {
  const digits = (raw || "").replace(/\D/g, "");
  const cents = digits ? parseInt(digits, 10) : 0;
  return cents / 100;
}

function calcVwAutoInstallment(credit: number, months: VwPrazo, mode: PlanMode) {
  const factor = VW_AUTO_PERCENTUAL_PARCELA[mode][months];
  return round2(Math.max(0, credit || 0) * factor);
}

function getFactor(months: VwPrazo, mode: PlanMode) {
  return VW_AUTO_PERCENTUAL_PARCELA[mode][months];
}

function getPlanLabel(mode: PlanMode) {
  return mode === "essencial" ? "Plano Essencial" : "Plano Convencional";
}

function getPlanDescription(mode: PlanMode) {
  return mode === "essencial" ? "" : "";
}

function builderOrderToInitialData(order: BuilderOrderPayload | null) {
  if (!order) return null;

  const modelo =
    order.version?.name ||
    [order.vehicle_name, order.color?.name].filter(Boolean).join(" - ") ||
    "Volkswagen Selecionado";

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
    cliente: order.client?.name || "Cliente",
    cpf: order.client?.cpf || "",
    telefone: order.client?.phone || "",
    email: order.client?.email || "",
    vendedor: order.seller?.name || "",
    vehicleSlug: order.vehicle_slug || "",
    vehicleName: order.vehicle_name || "",
    versionName: order.version?.name || "",
    colorName: order.color?.name || "",
  };
}

function findCoupon(
  codeRaw: string,
  sellerId?: string | null
): { ok: true; coupon: Coupon } | { ok: false; reason: string } {
  const code = (codeRaw || "").trim().toUpperCase();
  if (!code) return { ok: false, reason: "Digite um código." };

  const coupon = COUPONS.find((c) => c.code.toUpperCase() === code);
  if (!coupon) return { ok: false, reason: "Código inválido." };

  if (coupon.sellerId && sellerId && coupon.sellerId !== sellerId) {
    return { ok: false, reason: "Código não pertence a este vendedor." };
  }

  return { ok: true, coupon };
}

function buildBaseParams(data: PaymentParams, searchParams: URLSearchParams) {
  const params = new URLSearchParams(searchParams.toString());

  params.set("tipo", data.tipo);
  params.set("entrada", String(data.entrada || 0));
  params.set("modelo", data.modelo || "Volkswagen Selecionado");
  params.set("valor", String(data.valor || 0));
  params.set("imagem", data.imagem || "");
  params.set("pedido", data.pedido || "");
  params.set("origem", data.origem || "builder");
  params.set("vehicle_slug", data.vehicleSlug || "");
  params.set("vehicle_name", data.vehicleName || "");
  params.set("versao", data.versionName || data.modelo || "");
  params.set("cor", data.colorName || "");

  return params;
}

const Card = ({ className = "", children }: any) => (
  <div className={`bg-white border border-slate-200 rounded-2xl shadow-sm ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ className = "", children }: any) => (
  <div className={`px-6 pt-6 ${className}`}>{children}</div>
);

const CardBody = ({ className = "", children }: any) => (
  <div className={`px-6 pb-6 ${className}`}>{children}</div>
);

const Divider = () => <div className="h-px w-full bg-slate-100" />;

function AnaliseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);

  const pedidoId = searchParams.get("pedido") || "";
  const [builderOrder, setBuilderOrder] = useState<BuilderOrderPayload | null>(null);
  const builderInitialData = useMemo(
    () => builderOrderToInitialData(builderOrder),
    [builderOrder]
  );

  useEffect(() => {
    let active = true;

    async function loadBuilderOrder() {
      try {
        const cached =
          localStorage.getItem("wb_analysis_order") ||
          localStorage.getItem("wb_builder_order") ||
          localStorage.getItem("wb_contract_order");

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
          localStorage.setItem("wb_analysis_order", JSON.stringify(payload));
        }
      } catch (e) {
        console.warn("Não foi possível carregar pedido do builder:", e);
      }
    }

    loadBuilderOrder();

    const timer = window.setTimeout(() => {
      if (active) setLoading(false);
    }, 450);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [pedidoId]);

  const dadosIniciais = useMemo(
    () => ({
      nome: searchParams.get("nome") || builderInitialData?.cliente || "Cliente",
      cpf: searchParams.get("cpf") || builderInitialData?.cpf || "",
      telefone: searchParams.get("telefone") || builderInitialData?.telefone || "",
      email: searchParams.get("email") || builderInitialData?.email || "",
      modelo:
        searchParams.get("modelo") ||
        builderInitialData?.modelo ||
        "Volkswagen Selecionado",
      valor: safeNumber(searchParams.get("valor")) || builderInitialData?.valor || 0,
      entradaUrl: safeNumber(searchParams.get("entrada")) || 0,
      imagem: searchParams.get("imagem") || builderInitialData?.imagem || "",
      vendedorId:
        searchParams.get("vendedor") || searchParams.get("vendedor_id") || null,
      vendedorNome:
        searchParams.get("vendedor") || builderInitialData?.vendedor || "",
      pedidoId,
      origem: searchParams.get("origem") || "builder",
      vehicleSlug: searchParams.get("vehicle_slug") || builderInitialData?.vehicleSlug || "",
      vehicleName: searchParams.get("vehicle_name") || builderInitialData?.vehicleName || "",
      versionName: searchParams.get("versao") || builderInitialData?.versionName || "",
      colorName: searchParams.get("cor") || builderInitialData?.colorName || "",
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchParams.toString(), builderInitialData, pedidoId]
  );

  const [entradaManual, setEntradaManual] = useState<number>(dadosIniciais.entradaUrl);
  const [entradaDisplay, setEntradaDisplay] = useState<string>(
    formatBRLInput(dadosIniciais.entradaUrl)
  );

  const [prazoConsorcio, setPrazoConsorcio] = useState<VwPrazo>(80);
  const [planMode, setPlanMode] = useState<PlanMode>("essencial");
  const [planoSelecionado, setPlanoSelecionado] = useState<any>(null);

  const [isLanceOpen, setIsLanceOpen] = useState(false);
  const [lanceValor, setLanceValor] = useState<number>(0);
  const [lanceDisplay, setLanceDisplay] = useState<string>(formatBRLInput(0));
  const [lanceMode, setLanceMode] = useState<LanceMode>("reduzir_parcela");

  const [couponInput, setCouponInput] = useState<string>("");
  const [couponApplied, setCouponApplied] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState<string>("");

  useEffect(() => {
    setEntradaManual(dadosIniciais.entradaUrl || 0);
    setEntradaDisplay(formatBRLInput(dadosIniciais.entradaUrl || 0));
  }, [dadosIniciais.entradaUrl]);

  const valorCarro = dadosIniciais.valor || 0;

  const entradaSegura = useMemo(() => {
    let entrada = entradaManual || 0;
    if (Number.isNaN(entrada) || entrada < 0) entrada = 0;
    if (entrada >= valorCarro && valorCarro > 0) entrada = valorCarro - 1000;
    return Math.max(0, entrada);
  }, [entradaManual, valorCarro]);

  const credito = useMemo(
    () => Math.max(0, valorCarro - entradaSegura),
    [valorCarro, entradaSegura]
  );

  const parcelaConsorcio = useMemo(
    () => calcVwAutoInstallment(credito, prazoConsorcio, planMode),
    [credito, prazoConsorcio, planMode]
  );

  const totalConsorcioBase = useMemo(
    () => round2(parcelaConsorcio * prazoConsorcio + entradaSegura),
    [parcelaConsorcio, prazoConsorcio, entradaSegura]
  );

  const selectedPlan = useMemo(
    () => ({
      key: planMode,
      label: getPlanLabel(planMode),
      prazo: prazoConsorcio,
      parcela: parcelaConsorcio,
      mode: planMode,
      adminTaxPercent: VW_ADMIN_TAX_PERCENT,
      fundReservePercent: VW_FUNDO_RESERVA_PERCENT,
      insurancePercentLabel: VW_SEGURO_PERCENT_LABEL,
      planCode: VW_PLANO_CODES[planMode],
      factor: getFactor(prazoConsorcio, planMode),
      detalhe: getPlanDescription(planMode),
    }),
    [planMode, prazoConsorcio, parcelaConsorcio]
  );

  useEffect(() => {
    setPlanoSelecionado(selectedPlan);
    setLanceValor(0);
    setLanceDisplay(formatBRLInput(0));
    setLanceMode("reduzir_parcela");
  }, [selectedPlan]);

  const financiamentoDisplay = useMemo(() => {
    const saldo = credito;
    const entrada = entradaSegura;

    return {
      saldo,
      entrada,
      description:
        "Para financiamento, a simulação oficial será continuada no Santander Financiamentos.",
    };
  }, [credito, entradaSegura]);

  const planosFinanciamento = useMemo(() => {
    return FINANCIAMENTO_PRAZOS.map((prazo) => {
      const i = TAXA_FINANCIAMENTO_MERCADO;
      const divisor = 1 - Math.pow(1 + i, -prazo);
      const parcela = divisor !== 0 ? (credito * i) / divisor : 0;

      return {
        prazo,
        parcela: round2(parcela),
        total: round2(parcela * prazo),
      };
    });
  }, [credito]);

  const applyCoupon = () => {
    const res = findCoupon(couponInput, dadosIniciais.vendedorId);
    if (!res.ok) {
      setCouponApplied(null);
      setCouponError(res.reason);
      return;
    }
    setCouponError("");
    setCouponApplied(res.coupon);
  };

  const clearCoupon = () => {
    setCouponInput("");
    setCouponApplied(null);
    setCouponError("");
  };

  const lanceCalc = useMemo(() => {
    const lance = Math.max(0, Math.min(lanceValor || 0, credito));
    const creditoAposLance = Math.max(0, credito - lance);

    const parcelaBase = planoSelecionado?.parcela || parcelaConsorcio;
    const prazoBase = planoSelecionado?.prazo || prazoConsorcio;
    const modeBase = (planoSelecionado?.mode || planMode) as PlanMode;

    const parcelaMesmoPrazo = calcVwAutoInstallment(
      creditoAposLance,
      prazoBase,
      modeBase
    );

    const prazosPossiveis = [...VW_AUTO_PRAZOS]
      .filter((prazo) => prazo <= prazoBase)
      .sort((a, b) => a - b);

    const melhorPrazoMantendoParcela =
      prazosPossiveis.find(
        (prazo) => calcVwAutoInstallment(creditoAposLance, prazo, modeBase) <= parcelaBase
      ) || prazoBase;

    const parcelaNoPrazoReduzido = calcVwAutoInstallment(
      creditoAposLance,
      melhorPrazoMantendoParcela,
      modeBase
    );

    const resultadoFinal =
      lanceMode === "reduzir_parcela"
        ? { prazoFinal: prazoBase, parcelaFinal: parcelaMesmoPrazo }
        : {
            prazoFinal: melhorPrazoMantendoParcela,
            parcelaFinal: parcelaNoPrazoReduzido,
          };

    return {
      valorCarro,
      entrada: entradaSegura,
      credito,
      lance,
      creditoAposLance,
      prazo: prazoBase,
      parcelaBase,
      mode: modeBase,
      parcelaMesmoPrazo,
      melhorPrazoMantendoParcela,
      parcelaNoPrazoReduzido,
      ...resultadoFinal,
    };
  }, [
    valorCarro,
    entradaSegura,
    credito,
    lanceValor,
    planoSelecionado,
    parcelaConsorcio,
    prazoConsorcio,
    planMode,
    lanceMode,
  ]);

  function applyCouponToTotal(base: number) {
    let totalComPromo = round2(base || 0);
    let descontoTotalValor = 0;

    if (!couponApplied) {
      return { totalComPromo, descontoTotalValor };
    }

    const percent = couponApplied.effects.discountPercent || 0;
    const descontoFixo = couponApplied.effects.discountValue || 0;

    if (percent > 0) {
      const d = round2((totalComPromo * percent) / 100);
      descontoTotalValor = round2(descontoTotalValor + d);
      totalComPromo = round2(totalComPromo - d);
    }

    if (descontoFixo > 0) {
      const d = round2(descontoFixo);
      descontoTotalValor = round2(descontoTotalValor + d);
      totalComPromo = round2(totalComPromo - d);
    }

    return {
      totalComPromo: Math.max(0, round2(totalComPromo)),
      descontoTotalValor,
    };
  }

  const avancarParaContrato = (opts?: { withLance?: boolean }) => {
    if (!planoSelecionado) return;

    const usarLance = !!opts?.withLance;
    const prazoFinal = usarLance ? lanceCalc.prazoFinal : planoSelecionado.prazo;
    const parcelaFinal = usarLance ? lanceCalc.parcelaFinal : planoSelecionado.parcela;
    const creditoFinal = usarLance ? lanceCalc.creditoAposLance : credito;

    const totalBase = round2(
      parcelaFinal * prazoFinal + entradaSegura + (usarLance ? lanceCalc.lance : 0)
    );

    const { totalComPromo, descontoTotalValor } = applyCouponToTotal(totalBase);

    const params = buildBaseParams(
      {
        tipo: "CONSORCIO",
        entrada: entradaSegura,
        modelo: dadosIniciais.modelo,
        valor: dadosIniciais.valor,
        imagem: dadosIniciais.imagem,
        pedido: dadosIniciais.pedidoId,
        origem: dadosIniciais.origem,
        vehicleSlug: dadosIniciais.vehicleSlug,
        vehicleName: dadosIniciais.vehicleName,
        versionName: dadosIniciais.versionName,
        colorName: dadosIniciais.colorName,
      },
      searchParams
    );

    params.set("prazo_escolhido", String(prazoFinal));
    params.set("parcela_escolhida", String(parcelaFinal));
    params.set("credito_utilizado", String(creditoFinal));
    params.set("taxa_adm_percentual", String(VW_ADMIN_TAX_PERCENT));
    params.set("fundo_reserva_percentual", String(VW_FUNDO_RESERVA_PERCENT));
    params.set("seguro_percentual", VW_SEGURO_PERCENT_LABEL);
    params.set("modo_parcela", planMode);
    params.set("plano_vw", planMode === "essencial" ? "Essencial" : "Convencional");
    params.set("plano_codigo_vw", VW_PLANO_CODES[planMode]);
    params.set("grupo_vw", VW_GRUPO_LABEL);
    params.set("percentual_tabela", String(getFactor(planoSelecionado.prazo, planMode)));
    params.set("total_final_base", String(totalBase));
    params.set("total_final", String(totalComPromo));
    params.set("desconto_total_valor", String(descontoTotalValor));
    params.set("vw_tabela", "Tabela Normal Auto");
    params.set("vw_tabela_tipo", "auto");

    if (couponApplied) {
      params.set("cupom_codigo", couponApplied.code);
      params.set("cupom_label", couponApplied.label);
      params.set("cupom_acessorios_gratis", couponApplied.effects.accessoriesFree ? "1" : "0");
      params.set("cupom_emplacamento_gratis", couponApplied.effects.platingFree ? "1" : "0");
      params.set("cupom_frete_gratis", couponApplied.effects.freteFree ? "1" : "0");
      params.set("cupom_desconto_percent", String(couponApplied.effects.discountPercent || 0));
      params.set("cupom_desconto_valor", String(couponApplied.effects.discountValue || 0));
      params.set("cupom_obs", couponApplied.effects.note || "");
      params.set("total_final_com_cupom", String(totalComPromo));
    }

    if (usarLance) {
      params.set("lance_valor", String(lanceCalc.lance));
      params.set("lance_modo", String(lanceMode));
      params.set("prazo_final", String(lanceCalc.prazoFinal));
      params.set("parcela_final", String(lanceCalc.parcelaFinal));
      params.set("credito_apos_lance", String(lanceCalc.creditoAposLance));
    }

    try {
      if (builderOrder) {
        const enrichedOrder = {
          ...builderOrder,
          payment: {
            type: "consorcio",
            tableName: "Tabela Normal Auto",
            mode: planMode,
            adminTaxPercent: VW_ADMIN_TAX_PERCENT,
            fundReservePercent: VW_FUNDO_RESERVA_PERCENT,
            insurancePercentLabel: VW_SEGURO_PERCENT_LABEL,
            group: VW_GRUPO_LABEL,
            planCode: VW_PLANO_CODES[planMode],
            vehicleValue: dadosIniciais.valor,
            entryValue: entradaSegura,
            credit: creditoFinal,
            months: prazoFinal,
            installment: parcelaFinal,
            lance: usarLance
              ? {
                  value: lanceCalc.lance,
                  mode: lanceMode,
                  creditAfterBid: lanceCalc.creditoAposLance,
                  finalMonths: lanceCalc.prazoFinal,
                  finalInstallment: lanceCalc.parcelaFinal,
                }
              : null,
          },
        };

        localStorage.setItem("wb_contract_order", JSON.stringify(enrichedOrder));
      }

      localStorage.setItem("wb_contract_params", params.toString());
    } catch {}

    router.push(`${CONTRACT_ROUTE}?${params.toString()}`);
  };

  const irParaSantander = (planoFinanciamento?: any) => {
    const params = buildBaseParams(
      {
        tipo: "FINANCIAMENTO",
        entrada: entradaSegura,
        modelo: dadosIniciais.modelo,
        valor: dadosIniciais.valor,
        imagem: dadosIniciais.imagem,
        pedido: dadosIniciais.pedidoId,
        origem: dadosIniciais.origem,
        vehicleSlug: dadosIniciais.vehicleSlug,
        vehicleName: dadosIniciais.vehicleName,
        versionName: dadosIniciais.versionName,
        colorName: dadosIniciais.colorName,
      },
      searchParams
    );

    params.set("saldo_financiar", String(financiamentoDisplay.saldo));
    params.set("financeira", "Santander Financiamentos");
    params.set("status_financiamento", "continuar_no_santander");

    if (planoFinanciamento) {
      params.set("prazo_escolhido", String(planoFinanciamento.prazo));
      params.set("parcela_escolhida", String(planoFinanciamento.parcela));
      params.set(
        "total_final",
        String(round2((planoFinanciamento.total || 0) + entradaSegura))
      );
    }

    try {
      if (builderOrder) {
        const enrichedOrder = {
          ...builderOrder,
          payment: {
            type: "financiamento",
            financeCompany: "Santander Financiamentos",
            vehicleValue: dadosIniciais.valor,
            entryValue: entradaSegura,
            financedValue: financiamentoDisplay.saldo,
            selectedPlan: planoFinanciamento
              ? {
                  months: planoFinanciamento.prazo,
                  installment: planoFinanciamento.parcela,
                  total: planoFinanciamento.total,
                }
              : null,
            status: "continuar_no_santander",
          },
        };

        localStorage.setItem("wb_contract_order", JSON.stringify(enrichedOrder));
      }

      localStorage.setItem("wb_financing_params", params.toString());
      localStorage.setItem("wb_financiamento_params", params.toString());
      localStorage.setItem("wb_financing_redirect", SANTANDER_URL);
      localStorage.setItem("wb_financiamento_redirect", SANTANDER_URL);
    } catch {}

    window.open(SANTANDER_URL, "_blank", "noopener,noreferrer");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
          <Loader2 className="animate-spin h-6 w-6 text-black" />
        </div>
        <p className="mt-4 text-xs font-bold uppercase tracking-widest text-slate-400">
          Preparando simulação...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24">
      <header className="bg-white/90 backdrop-blur border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <button
            onClick={() => router.back()}
            className="text-xs font-black text-slate-500 hover:text-black flex items-center gap-2 uppercase transition-all"
          >
            <ArrowLeft size={16} /> Voltar
          </button>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <h1 className="font-black text-black text-sm uppercase">
                {dadosIniciais.nome}
              </h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {dadosIniciais.modelo}
              </p>
            </div>

            {dadosIniciais.imagem ? (
              <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 bg-white shadow-sm">
                <img
                  src={dadosIniciais.imagem}
                  className="w-full h-full object-cover"
                  alt="Veículo"
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full border border-slate-200 bg-white shadow-sm" />
            )}
          </div>
        </div>
      </header>

      {isLanceOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsLanceOpen(false)}
        >
          <div
            className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="font-black text-slate-900 uppercase text-sm">
                  Simulador de Lance
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">
                  Informe o lance e escolha como deseja aplicar no plano.
                </p>
              </div>
              <button
                onClick={() => setIsLanceOpen(false)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-5 flex-1 overflow-y-auto overscroll-contain">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <p className="text-[10px] text-slate-400 font-black uppercase">
                    Crédito
                  </p>
                  <p className="text-lg font-black">{formatMoney(lanceCalc.credito)}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <p className="text-[10px] text-slate-400 font-black uppercase">
                    Parcela atual
                  </p>
                  <p className="text-lg font-black">
                    {formatMoney(lanceCalc.parcelaBase)}
                  </p>
                  <p className="text-[10px] text-slate-400 font-black uppercase mt-1">
                    {lanceCalc.prazo}x
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <p className="text-[10px] text-slate-400 font-black uppercase">
                    Plano
                  </p>
                  <p className="text-sm font-black text-slate-900">
                    {planMode === "essencial" ? "Essencial" : "Convencional"}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Tabela Normal Auto
                  </p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4">
                <p className="text-[10px] text-slate-400 font-black uppercase mb-2">
                  Valor do lance
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-slate-400">R$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={lanceDisplay}
                    onChange={(e) => {
                      const num = parseDigitsToBRLNumber(e.target.value);
                      setLanceValor(num);
                      setLanceDisplay(formatBRLInput(num));
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl h-11 px-3 text-lg font-black text-slate-900 outline-none focus:border-black"
                    placeholder="0,00"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  Máximo:{" "}
                  <span className="font-black">
                    {formatMoney(lanceCalc.credito)}
                  </span>
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4">
                <p className="text-[10px] text-slate-400 font-black uppercase mb-2">
                  Como aplicar o lance?
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLanceMode("reduzir_parcela")}
                    className={[
                      "h-11 rounded-xl border text-xs font-black uppercase tracking-widest transition-all",
                      lanceMode === "reduzir_parcela"
                        ? "bg-black text-white border-black"
                        : "bg-white text-slate-700 border-slate-200 hover:border-black",
                    ].join(" ")}
                  >
                    Reduzir parcela
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanceMode("reduzir_meses")}
                    className={[
                      "h-11 rounded-xl border text-xs font-black uppercase tracking-widest transition-all",
                      lanceMode === "reduzir_meses"
                        ? "bg-black text-white border-black"
                        : "bg-white text-slate-700 border-slate-200 hover:border-black",
                    ].join(" ")}
                  >
                    Reduzir meses
                  </button>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p className="text-[10px] text-slate-400 font-black uppercase">
                    Código de promoção
                  </p>
                  {couponApplied ? (
                    <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase text-emerald-700">
                      <CheckCircle2 size={14} /> Aplicado
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                  <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl h-11 px-3">
                    <Tag size={16} className="text-slate-400" />
                    <input
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="Digite o código"
                      className="w-full bg-transparent outline-none text-sm font-black uppercase tracking-wider text-slate-900 placeholder:text-slate-400"
                    />
                  </div>

                  {!couponApplied ? (
                    <button
                      type="button"
                      onClick={applyCoupon}
                      className="h-11 px-4 rounded-xl bg-black text-white font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition-all"
                    >
                      Aplicar
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={clearCoupon}
                      className="h-11 px-4 rounded-xl border-2 border-slate-200 hover:border-black text-black font-black uppercase text-xs tracking-widest transition-all"
                    >
                      Remover
                    </button>
                  )}
                </div>

                {couponError ? (
                  <div className="mt-2 flex items-center gap-2 text-rose-600">
                    <AlertCircle size={14} />
                    <p className="text-[11px] font-bold">{couponError}</p>
                  </div>
                ) : null}

                {couponApplied ? (
                  <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <p className="text-[11px] font-black text-slate-900 uppercase">
                      {couponApplied.label}
                    </p>
                    <p className="text-[11px] text-slate-600 mt-1">
                      {couponApplied.description}
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="bg-gradient-to-br from-[#f2e14c]/45 to-white border border-[#f2e14c] rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase text-black/70">
                      Resultado com lance
                    </p>
                    <p className="text-[11px] text-black/70 mt-1">
                      Crédito após lance:{" "}
                      <span className="font-black">
                        {formatMoney(lanceCalc.creditoAposLance)}
                      </span>
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase text-black/70">
                      Parcela final
                    </p>
                    <p className="text-2xl font-black text-black">
                      {formatMoney(lanceCalc.parcelaFinal)}
                    </p>
                    <p className="text-[10px] font-black uppercase text-black/70 mt-1">
                      Prazo final: {lanceCalc.prazoFinal}x
                    </p>
                  </div>
                </div>

                <p className="text-[11px] text-black/70 mt-3">
                  {lanceMode === "reduzir_parcela"
                    ? "Mantém o prazo e diminui o valor da parcela."
                    : "Mantém a parcela o mais próximo possível e reduz a quantidade de meses."}
                </p>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between flex-shrink-0 bg-white sticky bottom-0">
              <button
                type="button"
                onClick={() => {
                  setIsLanceOpen(false);
                  avancarParaContrato({ withLance: false });
                }}
                className="h-11 px-4 rounded-xl border-2 border-slate-200 hover:border-black text-black font-black uppercase text-xs tracking-widest transition-all"
              >
                Continuar sem lance
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsLanceOpen(false);
                  avancarParaContrato({ withLance: true });
                }}
                className="h-11 px-4 rounded-xl bg-black text-white font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
              >
                Aplicar lance e continuar <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                análise
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase text-slate-400">
                  Valor do veículo
                </p>
                <p className="text-lg font-black text-black">
                  {formatMoney(valorCarro)}
                </p>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase text-slate-400">
                  Entrada
                </p>
                <p className="text-lg font-black text-black">
                  {formatMoney(entradaSegura || 0)}
                </p>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase text-slate-400">
                  Crédito
                </p>
                <p className="text-lg font-black text-black">
                  {formatMoney(credito)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <Card className="mb-8">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <DollarSign size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Controle da simulação
                </p>
                <h3 className="text-lg font-black text-black">Valor da Entrada</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Digite o valor de entrada. O restante será usado como crédito.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                const sugerida = (dadosIniciais.valor || 0) * 0.3;
                setEntradaManual(sugerida);
                setEntradaDisplay(formatBRLInput(sugerida));
              }}
              className="h-11 px-4 rounded-xl bg-black hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 w-full sm:w-auto"
            >
              Sugerir 30%
            </button>
          </CardHeader>

          <div className="px-6">
            <Divider />
          </div>

          <CardBody className="pt-5">
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <span className="text-sm font-black text-slate-400">R$</span>
              <input
                type="text"
                inputMode="numeric"
                value={entradaDisplay}
                onChange={(e) => {
                  const num = parseDigitsToBRLNumber(e.target.value);
                  setEntradaManual(num);
                  setEntradaDisplay(formatBRLInput(num));
                }}
                className="bg-transparent border-none text-black text-3xl font-black w-full focus:ring-0 p-0 outline-none"
                placeholder="0,00"
              />
            </div>
          </CardBody>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          <Card className="overflow-hidden flex flex-col">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center">
                  <Landmark size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    CDC • simulação oficial
                  </p>
                  <h3 className="text-lg font-black text-black uppercase">
                    Financiamento
                  </h3>
                </div>
              </div>

              <div className="mt-4 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
                <p className="text-[10px] text-slate-400 uppercase font-black mb-1">
                  Saldo a financiar
                </p>
                <p className="text-2xl font-black text-black">
                  {formatMoney(financiamentoDisplay.saldo)}
                </p>
              </div>
            </CardHeader>

            <div className="px-6">
              <Divider />
            </div>

            <CardBody className="pt-5 flex-1 flex flex-col">
              <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase mb-3 px-1">
                <span>Prazo</span>
                <span>Parcela</span>
              </div>

              <div className="flex-1">
                {planosFinanciamento.map((p: any) => (
                  <button
                    key={p.prazo}
                    type="button"
                    onClick={() => irParaSantander(p)}
                    className="flex w-full justify-between items-center py-3 px-2 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200 text-left"
                  >
                    <span className="inline-flex items-center gap-2">
                      <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-black">
                        {p.prazo}x
                      </span>
                      <span className="text-sm font-bold text-slate-500">
                        clique para usar no Santander
                      </span>
                    </span>
                    <span className="font-black text-slate-900">
                      {formatMoney(p.parcela)}
                    </span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => irParaSantander()}
                className="mt-6 w-full bg-white border-2 border-slate-200 hover:border-black text-black font-black py-4 rounded-2xl uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-2"
              >
                Simular no Santander <ExternalLink size={14} />
              </button>
            </CardBody>
          </Card>

          <Card className="overflow-hidden flex flex-col ring-1 ring-black/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#f2e14c] text-black flex items-center justify-center">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Tabela Normal Auto
                  </p>
                  <h3 className="text-lg font-black text-black uppercase">
                    Consórcio
                  </h3>
                </div>
              </div>

              <div className="mt-5">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-2">
                  Tipo de plano
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {(["essencial", "convencional"] as PlanMode[]).map((mode) => {
                    const active = planMode === mode;
                    return (
                      <button
                        key={mode}
                        onClick={() => setPlanMode(mode)}
                        className={[
                          "h-10 rounded-xl border text-xs font-black uppercase tracking-widest transition-all",
                          active
                            ? "bg-black text-white border-black"
                            : "bg-white text-slate-700 border-slate-200 hover:border-black",
                        ].join(" ")}
                      >
                        {mode === "essencial" ? "Essencial 75%" : "Convencional 100%"}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-2">
                  Quantidade de parcelas
                </p>
                <div className="flex flex-wrap gap-2">
                  {VW_AUTO_PRAZOS.map((prazo) => {
                    const active = prazoConsorcio === prazo;
                    return (
                      <button
                        key={prazo}
                        onClick={() => setPrazoConsorcio(prazo)}
                        className={[
                          "h-10 px-3 rounded-xl border text-xs font-black uppercase tracking-widest transition-all",
                          active
                            ? "bg-black text-white border-black"
                            : "bg-white text-slate-700 border-slate-200 hover:border-black",
                        ].join(" ")}
                      >
                        {prazo}x
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardHeader>

            <div className="px-6">
              <Divider />
            </div>

            <CardBody className="pt-5 flex-1 flex flex-col">
              <button
                type="button"
                onClick={() => setPlanoSelecionado(selectedPlan)}
                className="w-full text-left rounded-2xl border border-black bg-gradient-to-br from-[#f2e14c]/60 to-white p-4 shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 w-5 h-5 rounded-full border-2 border-black flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-black" />
                    </div>

                    <div>
                      <p className="font-black text-sm text-black">
                        {selectedPlan.label}
                      </p>
                      <p className="text-[11px] text-slate-600 mt-1">
                        {selectedPlan.detalhe}
                      </p>
                      <p className="text-[10px] uppercase font-black text-slate-500 mt-2"></p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-black text-xl text-black">
                      {formatMoney(selectedPlan.parcela)}
                    </p>
                    <p className="text-[10px] uppercase font-black text-slate-500 mt-1">
                      {selectedPlan.prazo}x •{" "}
                      {planMode === "essencial" ? "Essencial" : "Convencional"}
                    </p>
                  </div>
                </div>
              </button>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                  <p className="text-[10px] font-black uppercase text-slate-400">
                    Saldo considerado
                  </p>
                  <p className="text-lg font-black text-slate-900">
                    {formatMoney(credito)}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                  <p className="text-[10px] font-black uppercase text-slate-400">
                    Total base
                  </p>
                  <p className="text-lg font-black text-slate-900">
                    {formatMoney(totalConsorcioBase)}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsLanceOpen(true)}
                className="mt-6 w-full font-black py-4 rounded-2xl uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-2 bg-black text-white hover:bg-slate-800 shadow-lg"
              >
                Continuar ({selectedPlan.prazo}x •{" "}
                {planMode === "essencial" ? "Essencial" : "Convencional"})
                <ChevronRight size={14} />
              </button>

              <p className="text-[11px] text-slate-500 mt-3"></p>
            </CardBody>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function AnaliseVolkswagenPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <AnaliseContent />
    </Suspense>
  );
}