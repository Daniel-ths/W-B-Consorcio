"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  Loader2,
  Banknote,
  ChevronRight,
  ExternalLink,
  Car,
  X,
  Ticket,
  Check,
  AlertCircle,
  Percent,
  Calendar,
  Info,
} from "lucide-react";

// =========================
// VISUAL
// =========================
const BRAND_BLUE = "#0072bc";
const BRAND_NAVY = "#10233f";

// =========================
// REGRAS DO CONSÓRCIO VOLKSWAGEN
// =========================
const CONSORCIO_MAX_MESES = 80;

const TAXA_ADM_TOTAL = 0.21;
const TAXA_ANTECIPACAO = 0;
const TAXA_SEGURO_VIDA = 0.000616;
const FUNDO_RESERVA = 0.03;
const RATEIO_GRUPO = 110;
const PARTICIPANTES_GRUPO = 900;

const CONSORCIO_PRAZOS = [24, 36, 50, 60, 70, 80];

type ConsorcioPrazo = 24 | 36 | 50 | 60 | 70 | 80;

type VolkswagenInstallmentPlan = {
  code: string;
  credit: number;
  plans: {
    months: ConsorcioPrazo;
    firstInstallment: number;
    reducedInstallment: number;
  }[];
};

const vw = (
  code: string,
  credit: number,
  rows: [ConsorcioPrazo, number, number][]
): VolkswagenInstallmentPlan => ({
  code,
  credit,
  plans: rows.map(([months, firstInstallment, reducedInstallment]) => ({
    months,
    firstInstallment,
    reducedInstallment,
  })),
});

const VOLKSWAGEN_CONSORCIO_TABLE: VolkswagenInstallmentPlan[] = [
  vw("WV003", 45000, [
    [80, 731.54, 586.69],
    [70, 831.18, 668.65],
    [60, 954.04, 792.03],
    [50, 1150.84, 913.29],
    [36, 1584.04, 1242.16],
    [24, 2353.04, 1857.23],
  ]),
  vw("WV004", 50000, [
    [80, 812.82, 651.88],
    [70, 923.53, 742.94],
    [60, 1060.04, 868.03],
    [50, 1278.71, 1014.71],
    [36, 1760.04, 1380.18],
    [24, 2614.49, 2063.58],
  ]),
  vw("WV005", 55000, [
    [80, 894.1, 717.07],
    [70, 1015.89, 813.57],
    [60, 1178.27, 942.23],
    [50, 1406.6, 1122.35],
    [36, 1936.05, 1522.2],
    [24, 2883.27, 2293.16],
  ]),
  vw("WV006", 60000, [
    [80, 975.38, 782.25],
    [70, 1108.24, 887.31],
    [60, 1272.5, 1046.19],
    [50, 1534.47, 1217.44],
    [36, 2112.05, 1656.22],
    [24, 3136.04, 2495.5],
  ]),
  vw("WV007", 65000, [
    [80, 1056.67, 847.45],
    [70, 1200.59, 961.49],
    [60, 1392.5, 1113.54],
    [50, 1661.17, 1326.42],
    [36, 2288.05, 1823.12],
    [24, 3407.5, 2710.1],
  ]),
  vw("WV008", 70000, [
    [80, 1137.95, 912.64],
    [70, 1292.94, 1042.22],
    [60, 1484.74, 1187.65],
    [50, 1789.05, 1420.48],
    [36, 2464.05, 1961.84],
    [24, 3668.95, 2906.33],
  ]),
  vw("WV009", 75000, [
    [80, 1219.23, 977.82],
    [70, 1385.3, 1109.41],
    [60, 1606.73, 1298.46],
    [50, 1916.73, 1530.48],
    [36, 2640.05, 2103.13],
    [24, 3931.73, 3127.04],
  ]),
  vw("WV010", 80000, [
    [80, 1300.51, 1043.01],
    [70, 1477.65, 1182.56],
    [60, 1697.55, 1373.12],
    [50, 2044.6, 1643.77],
    [36, 2816.05, 2218.96],
    [24, 4190.5, 3313.98],
  ]),
  vw("WV011", 85000, [
    [80, 1381.79, 1108.2],
    [70, 1570.01, 1257.33],
    [60, 1820.56, 1465.51],
    [50, 2172.29, 1734.54],
    [36, 2992.07, 2384.99],
    [24, 4455.96, 3543.98],
  ]),
  vw("WV012", 90000, [
    [80, 1463.07, 1173.39],
    [70, 1662.36, 1331.29],
    [60, 1924.42, 1541.79],
    [50, 2300.16, 1838.98],
    [36, 3168.05, 2527.03],
    [24, 4723.46, 3753.1],
  ]),
  vw("WV013", 100000, [
    [80, 1625.64, 1303.76],
    [70, 1847.06, 1478.18],
    [60, 2120.08, 1713.38],
    [50, 2555.9, 2038.9],
    [36, 3520.1, 2789.05],
    [24, 5230.2, 4161.5],
  ]),
  vw("WV014", 110000, [
    [80, 1788.2, 1434.13],
    [70, 2031.78, 1626.25],
    [60, 2346.72, 1875.98],
    [50, 2811.62, 2246.77],
    [36, 3872.1, 3063.52],
    [24, 5783.52, 4597.21],
  ]),
  vw("WV015", 120000, [
    [80, 1950.77, 1564.52],
    [70, 2216.48, 1775.05],
    [60, 2570.77, 2055.77],
    [50, 3066.77, 2448.77],
    [36, 4224.1, 3355.77],
    [24, 6290.77, 5003.27],
  ]),
  vw("WV016", 130000, [
    [80, 2113.33, 1694.89],
    [70, 2401.19, 1924.61],
    [60, 2776.77, 2241.1],
    [50, 3322.57, 2656.9],
    [36, 4576.13, 3573.77],
    [24, 6813.23, 5324.8],
  ]),
  vw("WV017", 140000, [
    [80, 2275.9, 1825.27],
    [70, 2585.9, 2070.9],
    [60, 2994.32, 2399.32],
    [50, 3577.9, 2856.9],
    [36, 4928.21, 3962.11],
    [24, 7330.23, 5802.15],
  ]),
  vw("WV018", 150000, [
    [80, 2438.46, 1955.65],
    [70, 2770.6, 2218.82],
    [60, 3212.46, 2569.72],
    [50, 3833.54, 3060.96],
    [36, 5280.11, 4270.21],
    [24, 7866.46, 6243.99],
  ]),
  vw("WV019", 160000, [
    [80, 2601.03, 2086.03],
    [70, 2955.31, 2367.44],
    [60, 3412.46, 2745.16],
    [50, 4089.46, 3260.96],
    [36, 5632.13, 4407.21],
    [24, 8396.46, 6545.09],
  ]),
  vw("WV020", 170000, [
    [80, 2763.59, 2216.4],
    [70, 3140.02, 2514.66],
    [60, 3641.92, 2921.46],
    [50, 4345.59, 3459.09],
    [36, 5984.14, 4786.17],
    [24, 8911.92, 7087.96],
  ]),
  vw("WV021", 180000, [
    [80, 2926.15, 2346.78],
    [70, 3324.72, 2662.77],
    [60, 3857.3, 3087.5],
    [50, 4601.59, 3690.09],
    [36, 6336.17, 5094.14],
    [24, 9432.74, 7366.79],
  ]),
  vw("WV022", 190000, [
    [80, 3088.72, 2477.15],
    [70, 3509.43, 2810.5],
    [60, 4070.38, 3254.9],
    [50, 4855.72, 3877.22],
    [36, 6688.16, 5323.15],
    [24, 9960.38, 7921.84],
  ]),
  vw("WV023", 200000, [
    [80, 3251.28, 2607.53],
    [70, 3694.13, 2955.9],
    [60, 4278.38, 3420.57],
    [50, 5111.9, 4083.38],
    [36, 7040.16, 5628.17],
    [24, 10465.38, 8248.63],
  ]),
  vw("WV024", 210000, [
    [80, 3413.84, 2737.91],
    [70, 3878.84, 3106.34],
    [60, 4498.84, 3579.59],
    [50, 5366.84, 4235.34],
    [36, 7392.18, 5809.09],
    [24, 11008.84, 8755.72],
  ]),
  vw("WV025", 220000, [
    [80, 3576.41, 2868.28],
    [70, 4063.54, 3253.92],
    [60, 4700.84, 3774.83],
    [50, 5622.84, 4483.84],
    [36, 7744.2, 6086.14],
    [24, 11468.84, 8755.72],
  ]),
  vw("WV026", 230000, [
    [80, 3738.97, 2998.66],
    [70, 4248.26, 3402.19],
    [60, 4927.31, 3917.33],
    [50, 5877.97, 4693.47],
    [36, 8096.19, 6451.06],
    [24, 12057.31, 9598.6],
  ]),
  vw("WV028", 240000, [
    [80, 3901.54, 3129.04],
    [70, 4432.96, 3550.46],
    [60, 5141.54, 4108.61],
    [50, 6133.54, 4897.54],
    [36, 8448.19, 6796.08],
    [24, 12513.54, 10056.58],
  ]),
];

// =========================
// FINANCIAMENTO
// =========================
const TAXA_FINANCIAMENTO_MERCADO = 0.022;
const SANTANDER_FINANCIAMENTOS_URL =
  "https://www.cliente.santanderfinanciamentos.com.br/originacaocliente/?mathts=nonpaid#/dados-pessoais";

type LanceMode = "reduzir_parcela" | "reduzir_meses";

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

const COUPONS: Coupon[] = [
  {
    code: "FRETE100",
    label: "Frete grátis",
    description: "Libera o frete sem custo na venda.",
    sellerOnly: true,
    effects: { freteFree: true, note: "Frete 100% grátis." },
  },
  {
    code: "PLACA100",
    label: "Placa grátis",
    description: "Libera o emplacamento sem custo na venda.",
    sellerOnly: true,
    effects: { platingFree: true, note: "Emplacamento 100% grátis." },
  },
  {
    code: "WBCVIP",
    label: "VIP: frete + placa grátis",
    description: "Libera frete e emplacamento sem custo na venda.",
    sellerOnly: true,
    effects: {
      freteFree: true,
      platingFree: true,
      note: "Frete + emplacamento 100% grátis.",
    },
  },
];

// =========================
// TYPES
// =========================
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
    monthly_80?: number;
  };
};

// =========================
// HELPERS
// =========================
const formatMoney = (val: number) => {
  if (!isFinite(val)) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(val);
};

const formatBRLInput = (value: number) => {
  const v = isFinite(value) ? value : 0;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
    .format(v)
    .replace(/^R\$\s?/, "");
};

const parseDigitsToBRLNumber = (raw: string) => {
  const digits = (raw || "").replace(/\D/g, "");
  const cents = digits ? parseInt(digits, 10) : 0;
  return cents / 100;
};

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

const safeNumber = (v: any) => {
  const n = typeof v === "number" ? v : parseFloat(String(v || "0"));
  return Number.isFinite(n) ? n : 0;
};

const normalizeVolkswagenCredit = (credit: number) => {
  const value = safeNumber(credit);
  if (!value || value <= 0) return 0;
  return value;
};

const findClosestVolkswagenPlan = (credit: number) => {
  if (!credit || credit <= 0) return VOLKSWAGEN_CONSORCIO_TABLE[0];

  const sortedTable = [...VOLKSWAGEN_CONSORCIO_TABLE].sort(
    (a, b) => a.credit - b.credit
  );

  const exactCredit = normalizeVolkswagenCredit(credit);
  const nextPlan = sortedTable.find((plan) => plan.credit >= exactCredit);

  return nextPlan || sortedTable[sortedTable.length - 1];
};

const getVolkswagenInstallmentByPrazo = (
  tablePlan: VolkswagenInstallmentPlan,
  prazo: number
) => {
  return (
    tablePlan.plans.find((p) => p.months === prazo) ||
    tablePlan.plans.find((p) => p.months === 80) ||
    tablePlan.plans[0]
  );
};

function builderOrderToInitialData(order: BuilderOrderPayload | null) {
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

// =========================
// MAIN
// =========================
function AnaliseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);

  const pedidoId = searchParams.get("pedido") || "";

  const [builderOrder, setBuilderOrder] =
    useState<BuilderOrderPayload | null>(null);

  const builderInitialData = useMemo(
    () => builderOrderToInitialData(builderOrder),
    [builderOrder]
  );

  useEffect(() => {
    let active = true;

    async function loadBuilderOrder() {
      if (!pedidoId) {
        try {
          const cached =
            localStorage.getItem("wb_analysis_order") ||
            localStorage.getItem("wb_builder_order");

          if (cached && active) setBuilderOrder(JSON.parse(cached));
        } catch {}

        return;
      }

      try {
        const cached =
          localStorage.getItem("wb_analysis_order") ||
          localStorage.getItem("wb_builder_order");

        if (cached && active) {
          setBuilderOrder(JSON.parse(cached));
        }
      } catch {}

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

    return () => {
      active = false;
    };
  }, [pedidoId]);

  const dadosIniciais = useMemo(
    () => ({
      nome: searchParams.get("nome") || "Cliente",
      modelo:
        searchParams.get("modelo") ||
        builderInitialData?.modelo ||
        "Veículo Selecionado",
      valor:
        safeNumber(searchParams.get("valor")) || builderInitialData?.valor || 0,
      entradaUrl: safeNumber(searchParams.get("entrada")) || 0,
      imagem: searchParams.get("imagem") || builderInitialData?.imagem || "",
      vendedorId:
        searchParams.get("vendedor") || searchParams.get("vendedor_id") || null,
      pedidoId,
      origem: searchParams.get("origem") || "",
      vehicleSlug:
        searchParams.get("vehicle_slug") || builderInitialData?.vehicleSlug || "",
      vehicleName:
        searchParams.get("vehicle_name") || builderInitialData?.vehicleName || "",
      versionName:
        searchParams.get("versao") || builderInitialData?.versionName || "",
      colorName: searchParams.get("cor") || builderInitialData?.colorName || "",
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchParams.toString(), builderInitialData, pedidoId]
  );

  const [entradaManual, setEntradaManual] = useState<number>(
    dadosIniciais.entradaUrl
  );
  const [entradaDisplay, setEntradaDisplay] = useState<string>(
    formatBRLInput(dadosIniciais.entradaUrl)
  );

  const [prazoConsorcio, setPrazoConsorcio] = useState<number>(80);

  const [resultado, setResultado] = useState<any>(null);
  const [planoSelecionado, setPlanoSelecionado] = useState<any>(null);

  const [isLanceOpen, setIsLanceOpen] = useState(false);

  const [lanceValor, setLanceValor] = useState<number>(0);
  const [lanceDisplay, setLanceDisplay] = useState<string>(formatBRLInput(0));
  const [lanceMode, setLanceMode] =
    useState<LanceMode>("reduzir_parcela");

  const [couponInput, setCouponInput] = useState<string>("");
  const [couponApplied, setCouponApplied] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState<string>("");

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

  useEffect(() => {
    const realizarCalculo = () => {
      const valorCarro = dadosIniciais.valor || 0;
      let valorEntrada = entradaManual;

      if (isNaN(valorEntrada) || valorEntrada < 0) valorEntrada = 0;

      if (valorEntrada >= valorCarro && valorCarro > 0) {
        valorEntrada = valorCarro - 1000;
      }

      const credito = Math.max(0, valorCarro - valorEntrada);

      const tabelaSelecionada = findClosestVolkswagenPlan(credito);
      const prazoSeguro = Math.min(prazoConsorcio, CONSORCIO_MAX_MESES);
      const parcelaTabela = getVolkswagenInstallmentByPrazo(
        tabelaSelecionada,
        prazoSeguro
      );

      const primeiraParcelaIntegral = parcelaTabela.firstInstallment;
      const demaisParcelasReduzidas = parcelaTabela.reducedInstallment;
      const quantidadeReduzidas = Math.max(0, parcelaTabela.months - 1);

      const consorcioOpcoes = [
        {
          key: "integral",
          label: "Integral",
          prazo: parcelaTabela.months,
          percentualCategoria: 1,
          parcela: primeiraParcelaIntegral,
          detalhe: "1ª parcela integral + demais reduzidas",
          codigoTabela: tabelaSelecionada.code,
          creditoTabela: tabelaSelecionada.credit,
          primeiraParcelaIntegral,
          demaisParcelasReduzidas,
          quantidadeReduzidas,
          taxaAdmTotal: TAXA_ADM_TOTAL,
          taxaAntecipacao: TAXA_ANTECIPACAO,
          taxaSeguroVida: TAXA_SEGURO_VIDA,
          fundoReserva: FUNDO_RESERVA,
          rateioGrupo: RATEIO_GRUPO,
          participantesGrupo: PARTICIPANTES_GRUPO,
        },
        {
          key: "reduzida",
          label: "Reduzida",
          prazo: parcelaTabela.months,
          percentualCategoria: 0.75,
          parcela: demaisParcelasReduzidas,
          detalhe: `${quantidadeReduzidas} parcelas após a 1ª`,
          codigoTabela: tabelaSelecionada.code,
          creditoTabela: tabelaSelecionada.credit,
          primeiraParcelaIntegral,
          demaisParcelasReduzidas,
          quantidadeReduzidas,
          taxaAdmTotal: TAXA_ADM_TOTAL,
          taxaAntecipacao: TAXA_ANTECIPACAO,
          taxaSeguroVida: TAXA_SEGURO_VIDA,
          fundoReserva: FUNDO_RESERVA,
          rateioGrupo: RATEIO_GRUPO,
          participantesGrupo: PARTICIPANTES_GRUPO,
        },
      ];

      const prazosFinanc = [12, 24, 36, 48, 60];

      const planosFinanc = prazosFinanc.map((prazo) => {
        const i = TAXA_FINANCIAMENTO_MERCADO;
        const divisor = 1 - Math.pow(1 + i, -prazo);
        const parcela = divisor !== 0 ? (credito * i) / divisor : 0;

        return {
          prazo,
          parcela,
          total: parcela * prazo,
        };
      });

      setResultado({
        credito,
        consorcio: {
          opcoes: consorcioOpcoes,
          prazoSelecionado: parcelaTabela.months,
          tabelaSelecionada,
        },
        financiamento: {
          planos: planosFinanc,
        },
      });

      setPlanoSelecionado(null);
      setLoading(false);
    };

    if (loading) {
      const timer = setTimeout(realizarCalculo, 450);
      return () => clearTimeout(timer);
    }

    realizarCalculo();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entradaManual, dadosIniciais.valor, prazoConsorcio]);

  const irParaSantander = (planoFinanciamento?: any) => {
    try {
      const params = new URLSearchParams(searchParams.toString());

      params.set("tipo", "FINANCIAMENTO");
      params.set("modelo", dadosIniciais.modelo);
      params.set("valor", String(dadosIniciais.valor || 0));
      params.set("entrada", String(entradaManual || 0));
      params.set("imagem", dadosIniciais.imagem || "");
      params.set("pedido", dadosIniciais.pedidoId || "");
      params.set("origem", dadosIniciais.origem || "builder");
      params.set("vehicle_slug", dadosIniciais.vehicleSlug || "");
      params.set("vehicle_name", dadosIniciais.vehicleName || "");
      params.set(
        "versao",
        dadosIniciais.versionName || dadosIniciais.modelo || ""
      );
      params.set("cor", dadosIniciais.colorName || "");

      if (planoFinanciamento) {
        params.set("prazo_escolhido", String(planoFinanciamento.prazo));
        params.set("parcela_escolhida", String(planoFinanciamento.parcela));
        params.set(
          "total_final",
          String(round2((planoFinanciamento.total || 0) + (entradaManual || 0)))
        );
      }

      if (builderOrder) {
        localStorage.setItem("wb_contract_order", JSON.stringify(builderOrder));
      }

      localStorage.setItem("wb_financiamento_params", params.toString());
      localStorage.setItem(
        "wb_financiamento_redirect",
        SANTANDER_FINANCIAMENTOS_URL
      );
    } catch {}

    window.open(SANTANDER_FINANCIAMENTOS_URL, "_blank");
  };

  const lanceCalc = useMemo(() => {
    const valorCarro = dadosIniciais.valor || 0;
    const entrada = Math.max(0, entradaManual || 0);
    const credito = Math.max(0, valorCarro - entrada);

    const prazo =
      planoSelecionado?.prazo || Math.min(prazoConsorcio, CONSORCIO_MAX_MESES);

    const percentualCategoria = planoSelecionado?.percentualCategoria ?? 1;
    const parcelaBase = planoSelecionado?.parcela || 0;
    const lance = Math.max(0, Math.min(lanceValor || 0, credito));
    const creditoAposLance = Math.max(0, credito - lance);

    const tabelaAposLance = findClosestVolkswagenPlan(creditoAposLance);
    const parcelaTabelaAposLance = getVolkswagenInstallmentByPrazo(
      tabelaAposLance,
      prazo
    );

    const parcelaAposLanceMesmoPrazo =
      planoSelecionado?.key === "integral"
        ? parcelaTabelaAposLance.firstInstallment
        : parcelaTabelaAposLance.reducedInstallment;

    const totalTabelaAposLance =
      parcelaTabelaAposLance.firstInstallment +
      parcelaTabelaAposLance.reducedInstallment *
        Math.max(0, parcelaTabelaAposLance.months - 1);

    const mesesAposLanceMantendoParcela =
      parcelaBase > 0
        ? Math.max(1, Math.ceil(totalTabelaAposLance / parcelaBase))
        : prazo;

    const resultadoFinal =
      lanceMode === "reduzir_parcela"
        ? {
            prazoFinal: prazo,
            parcelaFinal: parcelaAposLanceMesmoPrazo,
          }
        : {
            prazoFinal: Math.min(prazo, mesesAposLanceMantendoParcela),
            parcelaFinal: parcelaBase,
          };

    return {
      valorCarro,
      entrada,
      credito,
      lance,
      creditoAposLance,
      prazo,
      percentualCategoria,
      parcelaBase,
      parcelaAposLanceMesmoPrazo,
      mesesAposLanceMantendoParcela,
      ...resultadoFinal,
    };
  }, [
    dadosIniciais.valor,
    entradaManual,
    prazoConsorcio,
    planoSelecionado,
    lanceValor,
    lanceMode,
  ]);

  const avancarParaContrato = (opts?: { withLance?: boolean }) => {
    if (!planoSelecionado) return;

    const params = new URLSearchParams(searchParams.toString());

    params.set("tipo", "CONSORCIO");
    params.set("entrada", String(entradaManual || 0));
    params.set("modelo", dadosIniciais.modelo);
    params.set("valor", String(dadosIniciais.valor || 0));
    params.set("imagem", dadosIniciais.imagem || "");
    params.set("pedido", dadosIniciais.pedidoId || "");
    params.set("origem", dadosIniciais.origem || "builder");
    params.set("vehicle_slug", dadosIniciais.vehicleSlug || "");
    params.set("vehicle_name", dadosIniciais.vehicleName || "");
    params.set(
      "versao",
      dadosIniciais.versionName || dadosIniciais.modelo || ""
    );
    params.set("cor", dadosIniciais.colorName || "");

    const valorCarro = dadosIniciais.valor || 0;
    const credito = Math.max(0, valorCarro - (entradaManual || 0));

    const primeiraParcelaIntegral =
      planoSelecionado.primeiraParcelaIntegral || 0;

    const demaisParcelasReduzidas =
      planoSelecionado.demaisParcelasReduzidas || 0;

    const quantidadeReduzidas =
      planoSelecionado.quantidadeReduzidas ||
      Math.max(0, planoSelecionado.prazo - 1);

    const totalConsorcioTabela = round2(
      primeiraParcelaIntegral + demaisParcelasReduzidas * quantidadeReduzidas
    );

    const totalBase = round2(totalConsorcioTabela + (entradaManual || 0));

    params.set("prazo_escolhido", String(planoSelecionado.prazo));
    params.set("parcela_escolhida", String(planoSelecionado.parcela));
    params.set("taxa_adm_total", String(TAXA_ADM_TOTAL));
    params.set("modo_parcela", String(planoSelecionado.key));
    params.set(
      "percentual_categoria",
      String(planoSelecionado.percentualCategoria)
    );
    params.set("total_final_base", String(totalBase));
    params.set("codigo_tabela", String(planoSelecionado.codigoTabela || ""));
    params.set(
      "credito_tabela",
      String(planoSelecionado.creditoTabela || credito)
    );
    params.set("primeira_parcela_integral", String(primeiraParcelaIntegral));
    params.set("demais_parcelas_reduzidas", String(demaisParcelasReduzidas));
    params.set("quantidade_reduzidas", String(quantidadeReduzidas));
    params.set("taxa_antecipacao", String(TAXA_ANTECIPACAO));
    params.set("taxa_seguro_vida", String(TAXA_SEGURO_VIDA));
    params.set("fundo_reserva", String(FUNDO_RESERVA));
    params.set("rateio_grupo", String(RATEIO_GRUPO));
    params.set("participantes_grupo", String(PARTICIPANTES_GRUPO));
    params.set("modo_tabela", "vw_primeira_integral_demais_reduzidas");

    let totalComPromo = totalBase;
    let descontoTotalValor = 0;

    if (couponApplied) {
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

      totalComPromo = Math.max(0, round2(totalComPromo));

      params.set("cupom_codigo", couponApplied.code);
      params.set("cupom_label", couponApplied.label);
      params.set(
        "cupom_acessorios_gratis",
        couponApplied.effects.accessoriesFree ? "1" : "0"
      );
      params.set(
        "cupom_emplacamento_gratis",
        couponApplied.effects.platingFree ? "1" : "0"
      );
      params.set(
        "cupom_frete_gratis",
        couponApplied.effects.freteFree ? "1" : "0"
      );
      params.set("cupom_desconto_percent", String(percent));
      params.set("cupom_desconto_valor", String(descontoFixo));
      params.set("cupom_obs", couponApplied.effects.note || "");
      params.set("total_final_com_cupom", String(totalComPromo));
      params.set("desconto_total_valor", String(descontoTotalValor));
      params.set("total_final", String(totalComPromo));
    } else {
      params.set("total_final", String(totalBase));
    }

    const usarLance = !!opts?.withLance;

    if (usarLance) {
      params.set("lance_valor", String(lanceCalc.lance));
      params.set("lance_modo", String(lanceMode));
      params.set("prazo_final", String(lanceCalc.prazoFinal));
      params.set("parcela_final", String(lanceCalc.parcelaFinal));
      params.set("credito_apos_lance", String(lanceCalc.creditoAposLance));
    }

    try {
      if (builderOrder) {
        localStorage.setItem("wb_contract_order", JSON.stringify(builderOrder));
      }

      localStorage.setItem("wb_contract_params", params.toString());
    } catch {}

    router.push(`/vendedor/contrato?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f7f9fc] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/3 left-1/4 w-72 h-72 rounded-full bg-[#0072bc]/8 blur-[90px] animate-pulse" />
          <div
            className="absolute bottom-1/4 right-1/4 w-56 h-56 rounded-full bg-[#b8d4ea]/40 blur-[70px] animate-pulse"
            style={{ animationDelay: "1s" }}
          />
        </div>
        <Loader2 className="h-8 w-8 text-[#0072bc] animate-spin relative z-10" />
        <p className="mt-5 text-[11px] font-medium tracking-[0.18em] uppercase text-[#8a9aab] relative z-10">
          Montando simulação
        </p>
      </div>
    );
  }

  const valorCarro = dadosIniciais.valor || 0;
  const credito = resultado?.credito || 0;

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-[#1a2332] relative overflow-hidden">
      {/* Fundo animado sutil (claro) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-24 -left-24 w-[380px] h-[380px] rounded-full bg-[#0072bc]/[0.07] blur-[100px]"
          style={{ animation: "float1 20s ease-in-out infinite" }}
        />
        <div
          className="absolute top-[45%] -right-20 w-[300px] h-[300px] rounded-full bg-[#a8cce0]/25 blur-[90px]"
          style={{ animation: "float2 24s ease-in-out infinite" }}
        />
        <div
          className="absolute -bottom-16 left-1/3 w-[260px] h-[260px] rounded-full bg-[#d0e4f2]/40 blur-[80px]"
          style={{ animation: "float3 16s ease-in-out infinite" }}
        />
        <style jsx>{`
          @keyframes float1 {
            0%, 100% { transform: translate(0, 0); }
            50% { transform: translate(36px, 28px); }
          }
          @keyframes float2 {
            0%, 100% { transform: translate(0, 0); }
            50% { transform: translate(-28px, -36px); }
          }
          @keyframes float3 {
            0%, 100% { transform: translate(0, 0); }
            50% { transform: translate(22px, -18px); }
          }
        `}</style>
      </div>

      {/* Header */}
      <header className="relative z-30 sticky top-0 border-b border-[#e4ebf3] bg-white/85 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[#6b7c8f] hover:text-[#0072bc] transition-colors"
          >
            <span className="w-8 h-8 rounded-xl bg-[#f0f4f8] flex items-center justify-center">
              <ArrowLeft size={16} strokeWidth={1.75} />
            </span>
            <span className="text-xs font-medium hidden sm:inline">Voltar</span>
          </button>

          <div className="flex items-center gap-3 min-w-0">
            <div className="text-right min-w-0">
              <p className="text-sm font-semibold text-[#1a2332] truncate max-w-[140px] sm:max-w-[200px]">
                {dadosIniciais.nome}
              </p>
              <p className="text-[11px] text-[#8a9aab] truncate max-w-[140px] sm:max-w-[200px]">
                {dadosIniciais.modelo}
              </p>
            </div>
            {dadosIniciais.imagem ? (
              <div className="w-9 h-9 rounded-xl overflow-hidden border border-[#e4ebf3] flex-shrink-0 bg-white shadow-sm">
                <img
                  src={dadosIniciais.imagem}
                  className="w-full h-full object-cover"
                  alt=""
                />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-[#f0f4f8] border border-[#e4ebf3] flex items-center justify-center flex-shrink-0">
                <Car size={16} className="text-[#8a9aab]" strokeWidth={1.5} />
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Modal Lance */}
      {isLanceOpen ? (
        <div
          className="fixed inset-0 z-[100] bg-[#10233f]/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-5"
          onClick={() => setIsLanceOpen(false)}
        >
          <div
            className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-[#e4ebf3] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 pt-5 pb-4 flex items-center justify-between border-b border-[#eef2f7]">
              <div>
                <h3 className="text-sm font-semibold text-[#1a2332]">Lance</h3>
                <p className="text-[12px] text-[#7a8b9e] mt-0.5">
                  Aplique e escolha como reduzir
                </p>
              </div>
              <button
                onClick={() => setIsLanceOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8a9aab] hover:text-[#1a2332] hover:bg-[#f0f4f8] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-[#f7f9fc] border border-[#e8eef5] p-3.5">
                  <p className="text-[10px] text-[#8a9aab] uppercase tracking-wider mb-1">
                    Crédito
                  </p>
                  <p className="text-base font-semibold text-[#1a2332]">
                    {formatMoney(lanceCalc.credito)}
                  </p>
                </div>
                <div className="rounded-2xl bg-[#f7f9fc] border border-[#e8eef5] p-3.5">
                  <p className="text-[10px] text-[#8a9aab] uppercase tracking-wider mb-1">
                    Parcela
                  </p>
                  <p className="text-base font-semibold text-[#1a2332]">
                    {formatMoney(lanceCalc.parcelaBase)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-[11px] text-[#7a8b9e] mb-2">Valor do lance</p>
                <div className="flex items-center gap-2 rounded-xl bg-[#f7f9fc] border border-[#e4ebf3] px-3.5 h-12 focus-within:border-[#0072bc] focus-within:ring-2 focus-within:ring-[#0072bc]/15 transition-all">
                  <span className="text-sm text-[#8a9aab]">R$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={lanceDisplay}
                    onChange={(e) => {
                      const num = parseDigitsToBRLNumber(e.target.value);
                      setLanceValor(num);
                      setLanceDisplay(formatBRLInput(num));
                    }}
                    className="w-full bg-transparent text-lg font-semibold text-[#1a2332] outline-none"
                    placeholder="0,00"
                  />
                </div>
                <p className="text-[11px] text-[#8a9aab] mt-1.5 flex items-center gap-1">
                  <Info size={11} />
                  Máx. {formatMoney(lanceCalc.credito)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLanceMode("reduzir_parcela")}
                  className={[
                    "h-11 rounded-xl text-xs font-semibold transition-all",
                    lanceMode === "reduzir_parcela"
                      ? "bg-[#0072bc] text-white shadow-md shadow-[#0072bc]/20"
                      : "bg-[#f7f9fc] text-[#5a6d80] border border-[#e4ebf3] hover:border-[#0072bc]/40",
                  ].join(" ")}
                >
                  Reduzir parcela
                </button>
                <button
                  type="button"
                  onClick={() => setLanceMode("reduzir_meses")}
                  className={[
                    "h-11 rounded-xl text-xs font-semibold transition-all",
                    lanceMode === "reduzir_meses"
                      ? "bg-[#0072bc] text-white shadow-md shadow-[#0072bc]/20"
                      : "bg-[#f7f9fc] text-[#5a6d80] border border-[#e4ebf3] hover:border-[#0072bc]/40",
                  ].join(" ")}
                >
                  Reduzir meses
                </button>
              </div>

              {/* Cupom */}
              <div>
                <p className="text-[11px] text-[#7a8b9e] mb-2">Cupom</p>
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center gap-2 rounded-xl bg-[#f7f9fc] border border-[#e4ebf3] px-3 h-11">
                    <Ticket size={14} className="text-[#8a9aab] flex-shrink-0" />
                    <input
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="Código"
                      className="w-full bg-transparent text-sm font-medium uppercase tracking-wide text-[#1a2332] outline-none placeholder:text-[#a8b5c4]"
                    />
                  </div>
                  {!couponApplied ? (
                    <button
                      type="button"
                      onClick={applyCoupon}
                      className="h-11 px-4 rounded-xl bg-[#1a2332] text-white text-xs font-semibold hover:bg-[#2a3545] transition-colors"
                    >
                      Aplicar
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={clearCoupon}
                      className="h-11 px-4 rounded-xl border border-[#e4ebf3] text-[#5a6d80] text-xs font-semibold hover:border-[#0072bc] transition-colors"
                    >
                      Limpar
                    </button>
                  )}
                </div>
                {couponError ? (
                  <p className="mt-2 text-[11px] text-rose-500 flex items-center gap-1.5">
                    <AlertCircle size={12} /> {couponError}
                  </p>
                ) : null}
                {couponApplied ? (
                  <p className="mt-2 text-[11px] text-emerald-600 flex items-center gap-1.5">
                    <Check size={12} /> {couponApplied.label}
                  </p>
                ) : null}
              </div>

              <div className="rounded-2xl bg-[#eef6fc] border border-[#c5dff0] p-4">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] text-[#5a7a94] uppercase tracking-wider">
                      Após lance
                    </p>
                    <p className="text-sm text-[#3d5a72] mt-0.5">
                      {formatMoney(lanceCalc.creditoAposLance)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-semibold text-[#10233f] tracking-tight">
                      {formatMoney(lanceCalc.parcelaFinal)}
                    </p>
                    <p className="text-[11px] text-[#5a7a94]">
                      {lanceCalc.prazoFinal}x
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[#eef2f7] flex gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setIsLanceOpen(false);
                  avancarParaContrato({ withLance: false });
                }}
                className="flex-1 h-11 rounded-xl border border-[#e4ebf3] text-[#5a6d80] text-xs font-semibold hover:bg-[#f7f9fc] transition-colors"
              >
                Sem lance
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLanceOpen(false);
                  avancarParaContrato({ withLance: true });
                }}
                className="flex-1 h-11 rounded-xl bg-[#0072bc] text-white text-xs font-semibold hover:bg-[#0084d6] shadow-md shadow-[#0072bc]/20 transition-colors flex items-center justify-center gap-1.5"
              >
                Aplicar
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Conteúdo */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-7 sm:py-9">
        {/* Resumo */}
        <div className="flex flex-wrap items-end justify-between gap-4 mb-7">
          <div>
            <p className="text-[11px] text-[#8a9aab] tracking-wider uppercase mb-1">
              Crédito disponível
            </p>
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#10233f] tracking-tight">
              {formatMoney(credito)}
            </h1>
            <p className="text-sm text-[#7a8b9e] mt-1">
              Veículo {formatMoney(valorCarro)} · Entrada{" "}
              {formatMoney(entradaManual || 0)}
            </p>
          </div>

          <button
            onClick={() => {
              const sugerida = (dadosIniciais.valor || 0) * 0.3;
              setEntradaManual(sugerida);
              setEntradaDisplay(formatBRLInput(sugerida));
            }}
            className="h-9 px-3.5 rounded-lg bg-white border border-[#e4ebf3] text-[11px] font-medium text-[#5a6d80] hover:border-[#0072bc] hover:text-[#0072bc] transition-colors shadow-sm"
          >
            Sugerir 30%
          </button>
        </div>

        {/* Entrada */}
        <div className="mb-7">
          <div className="rounded-2xl bg-white border border-[#e4ebf3] shadow-[0_4px_24px_rgba(16,35,63,0.04)] p-1 focus-within:border-[#0072bc]/50 focus-within:ring-2 focus-within:ring-[#0072bc]/10 transition-all">
            <div className="flex items-center gap-3 px-4 h-16">
              <div className="w-10 h-10 rounded-xl bg-[#eef5fb] flex items-center justify-center flex-shrink-0">
                <Banknote size={18} className="text-[#0072bc]" strokeWidth={1.6} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-[#8a9aab] uppercase tracking-wider leading-none mb-1">
                  Valor da entrada
                </p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-sm text-[#8a9aab]">R$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={entradaDisplay}
                    onChange={(e) => {
                      const num = parseDigitsToBRLNumber(e.target.value);
                      setEntradaManual(num);
                      setEntradaDisplay(formatBRLInput(num));
                    }}
                    className="w-full bg-transparent text-xl sm:text-2xl font-semibold text-[#1a2332] outline-none tracking-tight"
                    placeholder="0,00"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Financiamento */}
          <div className="lg:col-span-2 rounded-2xl bg-white border border-[#e4ebf3] shadow-[0_4px_24px_rgba(16,35,63,0.04)] overflow-hidden">
            <div className="px-5 pt-5 pb-3 flex items-center gap-2.5">
              <Percent size={16} className="text-[#8a9aab]" strokeWidth={1.75} />
              <div>
                <p className="text-sm font-medium text-[#1a2332]">Financiamento</p>
                <p className="text-[11px] text-[#8a9aab]">CDC · estimativa</p>
              </div>
            </div>

            <div className="px-3 pb-2 space-y-0.5">
              {resultado?.financiamento?.planos?.map((p: any) => (
                <button
                  key={p.prazo}
                  type="button"
                  onClick={() => irParaSantander(p)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[#f7f9fc] transition-colors group"
                >
                  <span className="text-[13px] text-[#7a8b9e] group-hover:text-[#5a6d80] transition-colors">
                    {p.prazo}x
                  </span>
                  <span className="text-[13px] font-medium text-[#1a2332]">
                    {formatMoney(p.parcela)}
                  </span>
                </button>
              ))}
            </div>

            <div className="px-4 pb-4 pt-1">
              <button
                onClick={() => irParaSantander()}
                className="w-full h-10 rounded-xl border border-[#e4ebf3] text-[11px] font-medium text-[#7a8b9e] hover:text-[#0072bc] hover:border-[#0072bc]/40 transition-all flex items-center justify-center gap-1.5"
              >
                Abrir no Santander
                <ExternalLink size={12} />
              </button>
            </div>
          </div>

          {/* Consórcio */}
          <div className="lg:col-span-3 rounded-2xl bg-white border border-[#0072bc]/20 shadow-[0_8px_32px_rgba(0,114,188,0.08)] overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#eef6fc]/80 via-transparent to-transparent pointer-events-none" />

            <div className="relative px-5 pt-5 pb-3 flex items-center gap-2.5">
              <Calendar size={16} className="text-[#0072bc]" strokeWidth={1.75} />
              <div>
                <p className="text-sm font-medium text-[#1a2332]">Consórcio Nacional</p>
                <p className="text-[11px] text-[#8a9aab]">
                  Tabela exclusiva · até {CONSORCIO_MAX_MESES}x
                </p>
              </div>
            </div>

            {/* Prazos */}
            <div className="relative px-5 pb-4">
              <p className="text-[10px] text-[#8a9aab] uppercase tracking-wider mb-2">
                Prazo
              </p>
              <div className="flex flex-wrap gap-1.5">
                {CONSORCIO_PRAZOS.filter((p) => p <= CONSORCIO_MAX_MESES).map(
                  (p) => {
                    const active = prazoConsorcio === p;
                    return (
                      <button
                        key={p}
                        onClick={() => setPrazoConsorcio(p)}
                        className={[
                          "h-9 min-w-[48px] px-2.5 rounded-lg text-[12px] font-medium transition-all",
                          active
                            ? "bg-[#0072bc] text-white shadow-sm shadow-[#0072bc]/25"
                            : "bg-[#f7f9fc] text-[#5a6d80] border border-[#e4ebf3] hover:border-[#0072bc]/40",
                        ].join(" ")}
                      >
                        {p}x
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* Opções */}
            <div className="relative px-4 pb-3 space-y-2">
              {resultado?.consorcio?.opcoes?.map((op: any) => {
                const isSelected = planoSelecionado?.key === op.key;

                return (
                  <button
                    key={op.key}
                    type="button"
                    onClick={() => {
                      setPlanoSelecionado(op);
                      setLanceValor(0);
                      setLanceDisplay(formatBRLInput(0));
                      setLanceMode("reduzir_parcela");
                    }}
                    className={[
                      "w-full text-left rounded-xl px-4 py-3.5 transition-all border",
                      isSelected
                        ? "bg-[#eef6fc] border-[#0072bc]/45 shadow-sm"
                        : "bg-[#fafbfc] border-[#e8eef5] hover:border-[#c5d8ea] hover:bg-white",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={[
                            "w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                            isSelected
                              ? "border-[#0072bc] bg-[#0072bc]"
                              : "border-[#c5d0dc]",
                          ].join(" ")}
                        >
                          {isSelected ? (
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#1a2332]">
                            {op.label}
                          </p>
                          <p className="text-[11px] text-[#7a8b9e] truncate">
                            {op.detalhe}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-semibold text-[#1a2332] tracking-tight">
                          {formatMoney(op.parcela)}
                        </p>
                        <p className="text-[10px] text-[#8a9aab]">
                          {op.prazo}x
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="relative px-4 pb-5 pt-1">
              <button
                onClick={() => {
                  if (!planoSelecionado) return;
                  setIsLanceOpen(true);
                }}
                disabled={!planoSelecionado}
                className={[
                  "w-full h-12 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2",
                  planoSelecionado
                    ? "bg-[#0072bc] text-white hover:bg-[#0084d6] shadow-lg shadow-[#0072bc]/25 active:scale-[0.98]"
                    : "bg-[#eef2f7] text-[#a0aec0] cursor-not-allowed",
                ].join(" ")}
              >
                {planoSelecionado ? (
                  <>
                    Continuar · {planoSelecionado.prazo}x{" "}
                    {planoSelecionado.label}
                    <ChevronRight size={16} />
                  </>
                ) : (
                  "Escolha uma opção"
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AnalisePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f7f9fc]" />}>
      <AnaliseContent />
    </Suspense>
  );
}