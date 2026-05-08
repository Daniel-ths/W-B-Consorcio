"use client";

import { useEffect, useState, Suspense, useMemo } from "react";
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

// =========================
// REGRAS DO CONSÓRCIO VOLKSWAGEN
// Tabela Normal / Essencial - Automóveis
// Grupo 1130 / 1131 / 1132
// =========================
const CONSORCIO_MAX_MESES = 80;

// Taxas da tabela Volkswagen
const TAXA_ADM_TOTAL = 0.21; // 21%
const TAXA_ANTECIPACAO = 0; // 0%
const TAXA_SEGURO_VIDA = 0.000616; // 0,0616%
const FUNDO_RESERVA = 0.03; // 3%
const RATEIO_GRUPO = 110; // R$ 110,00
const PARTICIPANTES_GRUPO = 900;

// ✅ prazos disponíveis no consórcio conforme tabela Volkswagen
const CONSORCIO_PRAZOS = [24, 36, 50, 60, 70, 80];

type ConsorcioPrazo = 24 | 36 | 50 | 60 | 70 | 80;

type VolkswagenInstallmentPlan = {
  code: string;
  credit: number;
  plans: {
    months: ConsorcioPrazo;
    firstInstallment: number; // Convencional 100%
    reducedInstallment: number; // Essencial 75%
  }[];
};

const VOLKSWAGEN_CONSORCIO_TABLE: VolkswagenInstallmentPlan[] = [
  {
    code: "WV003",
    credit: 45000,
    plans: [
      { months: 80, firstInstallment: 731.54, reducedInstallment: 586.69 },
      { months: 70, firstInstallment: 831.18, reducedInstallment: 668.65 },
      { months: 60, firstInstallment: 954.04, reducedInstallment: 792.03 },
      { months: 50, firstInstallment: 1150.84, reducedInstallment: 913.29 },
      { months: 36, firstInstallment: 1584.04, reducedInstallment: 1242.16 },
      { months: 24, firstInstallment: 2353.04, reducedInstallment: 1857.23 },
    ],
  },
  {
    code: "WV004",
    credit: 50000,
    plans: [
      { months: 80, firstInstallment: 812.82, reducedInstallment: 651.88 },
      { months: 70, firstInstallment: 923.53, reducedInstallment: 742.94 },
      { months: 60, firstInstallment: 1060.04, reducedInstallment: 868.03 },
      { months: 50, firstInstallment: 1278.71, reducedInstallment: 1014.71 },
      { months: 36, firstInstallment: 1760.04, reducedInstallment: 1380.18 },
      { months: 24, firstInstallment: 2614.49, reducedInstallment: 2063.58 },
    ],
  },
  {
    code: "WV005",
    credit: 55000,
    plans: [
      { months: 80, firstInstallment: 894.1, reducedInstallment: 717.07 },
      { months: 70, firstInstallment: 1015.89, reducedInstallment: 813.57 },
      { months: 60, firstInstallment: 1178.27, reducedInstallment: 942.23 },
      { months: 50, firstInstallment: 1406.6, reducedInstallment: 1122.35 },
      { months: 36, firstInstallment: 1936.05, reducedInstallment: 1522.2 },
      { months: 24, firstInstallment: 2883.27, reducedInstallment: 2293.16 },
    ],
  },
  {
    code: "WV006",
    credit: 60000,
    plans: [
      { months: 80, firstInstallment: 975.38, reducedInstallment: 782.25 },
      { months: 70, firstInstallment: 1108.24, reducedInstallment: 887.31 },
      { months: 60, firstInstallment: 1272.5, reducedInstallment: 1046.19 },
      { months: 50, firstInstallment: 1534.47, reducedInstallment: 1217.44 },
      { months: 36, firstInstallment: 2112.05, reducedInstallment: 1656.22 },
      { months: 24, firstInstallment: 3136.04, reducedInstallment: 2495.5 },
    ],
  },
  {
    code: "WV007",
    credit: 65000,
    plans: [
      { months: 80, firstInstallment: 1056.67, reducedInstallment: 847.45 },
      { months: 70, firstInstallment: 1200.59, reducedInstallment: 961.49 },
      { months: 60, firstInstallment: 1392.5, reducedInstallment: 1113.54 },
      { months: 50, firstInstallment: 1661.17, reducedInstallment: 1326.42 },
      { months: 36, firstInstallment: 2288.05, reducedInstallment: 1823.12 },
      { months: 24, firstInstallment: 3407.5, reducedInstallment: 2710.1 },
    ],
  },
  {
    code: "WV008",
    credit: 70000,
    plans: [
      { months: 80, firstInstallment: 1137.95, reducedInstallment: 912.64 },
      { months: 70, firstInstallment: 1292.94, reducedInstallment: 1042.22 },
      { months: 60, firstInstallment: 1484.74, reducedInstallment: 1187.65 },
      { months: 50, firstInstallment: 1789.05, reducedInstallment: 1420.48 },
      { months: 36, firstInstallment: 2464.05, reducedInstallment: 1961.84 },
      { months: 24, firstInstallment: 3668.95, reducedInstallment: 2906.33 },
    ],
  },
  {
    code: "WV009",
    credit: 75000,
    plans: [
      { months: 80, firstInstallment: 1219.23, reducedInstallment: 977.82 },
      { months: 70, firstInstallment: 1385.3, reducedInstallment: 1109.41 },
      { months: 60, firstInstallment: 1606.73, reducedInstallment: 1298.46 },
      { months: 50, firstInstallment: 1916.73, reducedInstallment: 1530.48 },
      { months: 36, firstInstallment: 2640.05, reducedInstallment: 2103.13 },
      { months: 24, firstInstallment: 3931.73, reducedInstallment: 3127.04 },
    ],
  },
  {
    code: "WV010",
    credit: 80000,
    plans: [
      { months: 80, firstInstallment: 1300.51, reducedInstallment: 1043.01 },
      { months: 70, firstInstallment: 1477.65, reducedInstallment: 1182.56 },
      { months: 60, firstInstallment: 1697.55, reducedInstallment: 1373.12 },
      { months: 50, firstInstallment: 2044.6, reducedInstallment: 1643.77 },
      { months: 36, firstInstallment: 2816.05, reducedInstallment: 2218.96 },
      { months: 24, firstInstallment: 4190.5, reducedInstallment: 3313.98 },
    ],
  },
  {
    code: "WV011",
    credit: 85000,
    plans: [
      { months: 80, firstInstallment: 1381.79, reducedInstallment: 1108.2 },
      { months: 70, firstInstallment: 1570.01, reducedInstallment: 1257.33 },
      { months: 60, firstInstallment: 1820.56, reducedInstallment: 1465.51 },
      { months: 50, firstInstallment: 2172.29, reducedInstallment: 1734.54 },
      { months: 36, firstInstallment: 2992.07, reducedInstallment: 2384.99 },
      { months: 24, firstInstallment: 4455.96, reducedInstallment: 3543.98 },
    ],
  },
  {
    code: "WV012",
    credit: 90000,
    plans: [
      { months: 80, firstInstallment: 1463.07, reducedInstallment: 1173.39 },
      { months: 70, firstInstallment: 1662.36, reducedInstallment: 1331.29 },
      { months: 60, firstInstallment: 1924.42, reducedInstallment: 1541.79 },
      { months: 50, firstInstallment: 2300.16, reducedInstallment: 1838.98 },
      { months: 36, firstInstallment: 3168.05, reducedInstallment: 2527.03 },
      { months: 24, firstInstallment: 4723.46, reducedInstallment: 3753.1 },
    ],
  },
  {
    code: "WV013",
    credit: 100000,
    plans: [
      { months: 80, firstInstallment: 1625.64, reducedInstallment: 1303.76 },
      { months: 70, firstInstallment: 1847.06, reducedInstallment: 1478.18 },
      { months: 60, firstInstallment: 2120.08, reducedInstallment: 1713.38 },
      { months: 50, firstInstallment: 2555.9, reducedInstallment: 2038.9 },
      { months: 36, firstInstallment: 3520.1, reducedInstallment: 2789.05 },
      { months: 24, firstInstallment: 5230.2, reducedInstallment: 4161.5 },
    ],
  },
  {
    code: "WV014",
    credit: 110000,
    plans: [
      { months: 80, firstInstallment: 1788.2, reducedInstallment: 1434.13 },
      { months: 70, firstInstallment: 2031.78, reducedInstallment: 1626.25 },
      { months: 60, firstInstallment: 2346.72, reducedInstallment: 1875.98 },
      { months: 50, firstInstallment: 2811.62, reducedInstallment: 2246.77 },
      { months: 36, firstInstallment: 3872.1, reducedInstallment: 3063.52 },
      { months: 24, firstInstallment: 5783.52, reducedInstallment: 4597.21 },
    ],
  },
  {
    code: "WV015",
    credit: 120000,
    plans: [
      { months: 80, firstInstallment: 1950.77, reducedInstallment: 1564.52 },
      { months: 70, firstInstallment: 2216.48, reducedInstallment: 1775.05 },
      { months: 60, firstInstallment: 2570.77, reducedInstallment: 2055.77 },
      { months: 50, firstInstallment: 3066.77, reducedInstallment: 2448.77 },
      { months: 36, firstInstallment: 4224.1, reducedInstallment: 3355.77 },
      { months: 24, firstInstallment: 6290.77, reducedInstallment: 5003.27 },
    ],
  },
  {
    code: "WV016",
    credit: 130000,
    plans: [
      { months: 80, firstInstallment: 2113.33, reducedInstallment: 1694.89 },
      { months: 70, firstInstallment: 2401.19, reducedInstallment: 1924.61 },
      { months: 60, firstInstallment: 2776.77, reducedInstallment: 2241.1 },
      { months: 50, firstInstallment: 3322.57, reducedInstallment: 2656.9 },
      { months: 36, firstInstallment: 4576.13, reducedInstallment: 3573.77 },
      { months: 24, firstInstallment: 6813.23, reducedInstallment: 5324.8 },
    ],
  },
  {
    code: "WV017",
    credit: 140000,
    plans: [
      { months: 80, firstInstallment: 2275.9, reducedInstallment: 1825.27 },
      { months: 70, firstInstallment: 2585.9, reducedInstallment: 2070.9 },
      { months: 60, firstInstallment: 2994.32, reducedInstallment: 2399.32 },
      { months: 50, firstInstallment: 3577.9, reducedInstallment: 2856.9 },
      { months: 36, firstInstallment: 4928.21, reducedInstallment: 3962.11 },
      { months: 24, firstInstallment: 7330.23, reducedInstallment: 5802.15 },
    ],
  },
  {
    code: "WV018",
    credit: 150000,
    plans: [
      { months: 80, firstInstallment: 2438.46, reducedInstallment: 1955.65 },
      { months: 70, firstInstallment: 2770.6, reducedInstallment: 2218.82 },
      { months: 60, firstInstallment: 3212.46, reducedInstallment: 2569.72 },
      { months: 50, firstInstallment: 3833.54, reducedInstallment: 3060.96 },
      { months: 36, firstInstallment: 5280.11, reducedInstallment: 4270.21 },
      { months: 24, firstInstallment: 7866.46, reducedInstallment: 6243.99 },
    ],
  },
  {
    code: "WV019",
    credit: 160000,
    plans: [
      { months: 80, firstInstallment: 2601.03, reducedInstallment: 2086.03 },
      { months: 70, firstInstallment: 2955.31, reducedInstallment: 2367.44 },
      { months: 60, firstInstallment: 3412.46, reducedInstallment: 2745.16 },
      { months: 50, firstInstallment: 4089.46, reducedInstallment: 3260.96 },
      { months: 36, firstInstallment: 5632.13, reducedInstallment: 4407.21 },
      { months: 24, firstInstallment: 8396.46, reducedInstallment: 6545.09 },
    ],
  },
  {
    code: "WV020",
    credit: 170000,
    plans: [
      { months: 80, firstInstallment: 2763.59, reducedInstallment: 2216.4 },
      { months: 70, firstInstallment: 3140.02, reducedInstallment: 2514.66 },
      { months: 60, firstInstallment: 3641.92, reducedInstallment: 2921.46 },
      { months: 50, firstInstallment: 4345.59, reducedInstallment: 3459.09 },
      { months: 36, firstInstallment: 5984.14, reducedInstallment: 4786.17 },
      { months: 24, firstInstallment: 8911.92, reducedInstallment: 7087.96 },
    ],
  },
  {
    code: "WV021",
    credit: 180000,
    plans: [
      { months: 80, firstInstallment: 2926.15, reducedInstallment: 2346.78 },
      { months: 70, firstInstallment: 3324.72, reducedInstallment: 2662.77 },
      { months: 60, firstInstallment: 3857.3, reducedInstallment: 3087.5 },
      { months: 50, firstInstallment: 4601.59, reducedInstallment: 3690.09 },
      { months: 36, firstInstallment: 6336.17, reducedInstallment: 5094.14 },
      { months: 24, firstInstallment: 9432.74, reducedInstallment: 7366.79 },
    ],
  },
  {
    code: "WV022",
    credit: 190000,
    plans: [
      { months: 80, firstInstallment: 3088.72, reducedInstallment: 2477.15 },
      { months: 70, firstInstallment: 3509.43, reducedInstallment: 2810.5 },
      { months: 60, firstInstallment: 4070.38, reducedInstallment: 3254.9 },
      { months: 50, firstInstallment: 4855.72, reducedInstallment: 3877.22 },
      { months: 36, firstInstallment: 6688.16, reducedInstallment: 5323.15 },
      { months: 24, firstInstallment: 9960.38, reducedInstallment: 7921.84 },
    ],
  },
  {
    code: "WV023",
    credit: 200000,
    plans: [
      { months: 80, firstInstallment: 3251.28, reducedInstallment: 2607.53 },
      { months: 70, firstInstallment: 3694.13, reducedInstallment: 2955.9 },
      { months: 60, firstInstallment: 4278.38, reducedInstallment: 3420.57 },
      { months: 50, firstInstallment: 5111.9, reducedInstallment: 4083.38 },
      { months: 36, firstInstallment: 7040.16, reducedInstallment: 5628.17 },
      { months: 24, firstInstallment: 10465.38, reducedInstallment: 8248.63 },
    ],
  },
  {
    code: "WV024",
    credit: 210000,
    plans: [
      { months: 80, firstInstallment: 3413.84, reducedInstallment: 2737.91 },
      { months: 70, firstInstallment: 3878.84, reducedInstallment: 3106.34 },
      { months: 60, firstInstallment: 4498.84, reducedInstallment: 3579.59 },
      { months: 50, firstInstallment: 5366.84, reducedInstallment: 4235.34 },
      { months: 36, firstInstallment: 7392.18, reducedInstallment: 5809.09 },
      { months: 24, firstInstallment: 11008.84, reducedInstallment: 8755.72 },
    ],
  },
  {
    code: "WV025",
    credit: 220000,
    plans: [
      { months: 80, firstInstallment: 3576.41, reducedInstallment: 2868.28 },
      { months: 70, firstInstallment: 4063.54, reducedInstallment: 3253.92 },
      { months: 60, firstInstallment: 4700.84, reducedInstallment: 3774.83 },
      { months: 50, firstInstallment: 5622.84, reducedInstallment: 4483.84 },
      { months: 36, firstInstallment: 7744.2, reducedInstallment: 6086.14 },
      { months: 24, firstInstallment: 11468.84, reducedInstallment: 8755.72 },
    ],
  },
  {
    code: "WV026",
    credit: 230000,
    plans: [
      { months: 80, firstInstallment: 3738.97, reducedInstallment: 2998.66 },
      { months: 70, firstInstallment: 4248.26, reducedInstallment: 3402.19 },
      { months: 60, firstInstallment: 4927.31, reducedInstallment: 3917.33 },
      { months: 50, firstInstallment: 5877.97, reducedInstallment: 4693.47 },
      { months: 36, firstInstallment: 8096.19, reducedInstallment: 6451.06 },
      { months: 24, firstInstallment: 12057.31, reducedInstallment: 9598.6 },
    ],
  },
  {
    code: "WV028",
    credit: 240000,
    plans: [
      { months: 80, firstInstallment: 3901.54, reducedInstallment: 3129.04 },
      { months: 70, firstInstallment: 4432.96, reducedInstallment: 3550.46 },
      { months: 60, firstInstallment: 5141.54, reducedInstallment: 4108.61 },
      { months: 50, firstInstallment: 6133.54, reducedInstallment: 4897.54 },
      { months: 36, firstInstallment: 8448.19, reducedInstallment: 6796.08 },
      { months: 24, firstInstallment: 12513.54, reducedInstallment: 10056.58 },
    ],
  },
];

// FINANCIAMENTO
const TAXA_FINANCIAMENTO_MERCADO = 0.022; // 2.2% a.m
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
    description: "Libera o frete sem custo na venda (acessórios permanecem com preço normal).",
    sellerOnly: true,
    effects: { freteFree: true, note: "Frete 100% grátis." },
  },
  {
    code: "PLACA100",
    label: "Placa grátis",
    description: "Libera o emplacamento sem custo na venda (acessórios permanecem com preço normal).",
    sellerOnly: true,
    effects: { platingFree: true, note: "Emplacamento 100% grátis." },
  },
  {
    code: "WBCVIP",
    label: "VIP: frete + placa grátis",
    description: "Libera frete e emplacamento sem custo na venda (acessórios permanecem com preço normal).",
    sellerOnly: true,
    effects: { freteFree: true, platingFree: true, note: "Frete + emplacamento 100% grátis." },
  },
];

// =========================
// Helpers
// =========================
const formatMoney = (val: number) => {
  if (!isFinite(val)) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
};

const formatBRLInput = (value: number) => {
  const v = isFinite(value) ? value : 0;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })
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

const findClosestVolkswagenPlan = (credit: number) => {
  if (!credit || credit <= 0) return VOLKSWAGEN_CONSORCIO_TABLE[0];

  return VOLKSWAGEN_CONSORCIO_TABLE.reduce((closest, current) => {
    const closestDiff = Math.abs(closest.credit - credit);
    const currentDiff = Math.abs(current.credit - credit);
    return currentDiff < closestDiff ? current : closest;
  }, VOLKSWAGEN_CONSORCIO_TABLE[0]);
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
// UI helpers
// =========================
const Card = ({ className = "", children }: any) => (
  <div className={`bg-white border border-slate-200 rounded-2xl shadow-sm ${className}`}>{children}</div>
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
      if (!pedidoId) {
        try {
          const cached = localStorage.getItem("wb_analysis_order") || localStorage.getItem("wb_builder_order");
          if (cached && active) setBuilderOrder(JSON.parse(cached));
        } catch {}
        return;
      }

      try {
        const cached = localStorage.getItem("wb_analysis_order") || localStorage.getItem("wb_builder_order");
        if (cached && active) {
          const parsed = JSON.parse(cached);
          setBuilderOrder(parsed);
        }
      } catch {}

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
        safeNumber(searchParams.get("valor")) ||
        builderInitialData?.valor ||
        0,
      entradaUrl: safeNumber(searchParams.get("entrada")) || 0,
      imagem:
        searchParams.get("imagem") ||
        builderInitialData?.imagem ||
        "",
      vendedorId: searchParams.get("vendedor") || searchParams.get("vendedor_id") || null,
      pedidoId,
      origem: searchParams.get("origem") || "",
      vehicleSlug: searchParams.get("vehicle_slug") || builderInitialData?.vehicleSlug || "",
      vehicleName: searchParams.get("vehicle_name") || builderInitialData?.vehicleName || "",
      versionName: searchParams.get("versao") || builderInitialData?.versionName || "",
      colorName: searchParams.get("cor") || builderInitialData?.colorName || "",
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchParams.toString(), builderInitialData, pedidoId]
  );

  // ENTRADA com máscara BRL
  const [entradaManual, setEntradaManual] = useState<number>(dadosIniciais.entradaUrl);
  const [entradaDisplay, setEntradaDisplay] = useState<string>(formatBRLInput(dadosIniciais.entradaUrl));

  // prazo do consórcio
  const [prazoConsorcio, setPrazoConsorcio] = useState<number>(Math.min(CONSORCIO_MAX_MESES, 80));

  const [resultado, setResultado] = useState<any>(null);
  const [planoSelecionado, setPlanoSelecionado] = useState<any>(null);

  // MODAL LANCE
  const [isLanceOpen, setIsLanceOpen] = useState(false);

  const [lanceValor, setLanceValor] = useState<number>(0);
  const [lanceDisplay, setLanceDisplay] = useState<string>(formatBRLInput(0));
  const [lanceMode, setLanceMode] = useState<LanceMode>("reduzir_parcela");

  // PROMO
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
      if (valorEntrada >= valorCarro && valorCarro > 0) valorEntrada = valorCarro - 1000;

      const credito = Math.max(0, valorCarro - valorEntrada);

      // CONSÓRCIO - TABELA VOLKSWAGEN
      const tabelaSelecionada = findClosestVolkswagenPlan(credito);
      const prazoSeguro = Math.min(prazoConsorcio, CONSORCIO_MAX_MESES);
      const parcelaTabela = getVolkswagenInstallmentByPrazo(tabelaSelecionada, prazoSeguro);

      const primeiraParcelaIntegral = parcelaTabela.firstInstallment;
      const demaisParcelasReduzidas = parcelaTabela.reducedInstallment;
      const quantidadeReduzidas = Math.max(0, parcelaTabela.months - 1);

      const consorcioOpcoes = [
        {
          key: "integral",
          label: "Opção 1",
          prazo: parcelaTabela.months,
          percentualCategoria: 1,
          parcela: primeiraParcelaIntegral,
          detalhe: "1ª parcela integral.",
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
          label: "Opção 2",
          prazo: parcelaTabela.months,
          percentualCategoria: 0.75,
          parcela: demaisParcelasReduzidas,
          detalhe: `${quantidadeReduzidas} parcelas reduzidas (Essencial 75%).`,
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

      // FINANCIAMENTO
      const prazosFinanc = [12, 24, 36, 48, 60];
      const planosFinanc = prazosFinanc.map((prazo) => {
        const i = TAXA_FINANCIAMENTO_MERCADO;
        const divisor = 1 - Math.pow(1 + i, -prazo);
        const parcela = divisor !== 0 ? (credito * i) / divisor : 0;
        return { prazo, parcela, total: parcela * prazo };
      });

      setResultado({
        credito,
        consorcio: {
          opcoes: consorcioOpcoes,
          prazoSelecionado: parcelaTabela.months,
          tabelaSelecionada,
        },
        financiamento: { planos: planosFinanc },
      });

      setPlanoSelecionado(null);
      setLoading(false);
    };

    if (loading) {
      const timer = setTimeout(realizarCalculo, 450);
      return () => clearTimeout(timer);
    } else {
      realizarCalculo();
    }
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
      params.set("versao", dadosIniciais.versionName || dadosIniciais.modelo || "");
      params.set("cor", dadosIniciais.colorName || "");

      if (planoFinanciamento) {
        params.set("prazo_escolhido", String(planoFinanciamento.prazo));
        params.set("parcela_escolhida", String(planoFinanciamento.parcela));
        params.set("total_final", String(round2((planoFinanciamento.total || 0) + (entradaManual || 0))));
      }

      if (builderOrder) {
        localStorage.setItem("wb_contract_order", JSON.stringify(builderOrder));
      }

      localStorage.setItem("wb_financiamento_params", params.toString());
      localStorage.setItem("wb_financiamento_redirect", SANTANDER_FINANCIAMENTOS_URL);
    } catch {}

    window.open(SANTANDER_FINANCIAMENTOS_URL, "_blank");
  };

  const lanceCalc = useMemo(() => {
    const valorCarro = dadosIniciais.valor || 0;
    const entrada = Math.max(0, entradaManual || 0);
    const credito = Math.max(0, valorCarro - entrada);

    const prazo = planoSelecionado?.prazo || Math.min(prazoConsorcio, CONSORCIO_MAX_MESES);
    const percentualCategoria = planoSelecionado?.percentualCategoria ?? 1;

    const parcelaBase = planoSelecionado?.parcela || 0;

    const lance = Math.max(0, Math.min(lanceValor || 0, credito));

    const creditoAposLance = Math.max(0, credito - lance);

    const tabelaAposLance = findClosestVolkswagenPlan(creditoAposLance);
    const parcelaTabelaAposLance = getVolkswagenInstallmentByPrazo(tabelaAposLance, prazo);

    const parcelaAposLance_mesmoPrazo =
      planoSelecionado?.key === "integral"
        ? parcelaTabelaAposLance.firstInstallment
        : parcelaTabelaAposLance.reducedInstallment;

    const totalTabelaAposLance =
      parcelaTabelaAposLance.firstInstallment +
      parcelaTabelaAposLance.reducedInstallment *
        Math.max(0, parcelaTabelaAposLance.months - 1);

    const mesesAposLance_mantendoParcela =
      parcelaBase > 0
        ? Math.max(1, Math.ceil(totalTabelaAposLance / parcelaBase))
        : prazo;

    const resultadoFinal =
      lanceMode === "reduzir_parcela"
        ? { prazoFinal: prazo, parcelaFinal: parcelaAposLance_mesmoPrazo }
        : { prazoFinal: Math.min(prazo, mesesAposLance_mantendoParcela), parcelaFinal: parcelaBase };

    return {
      valorCarro,
      entrada,
      credito,
      lance,
      creditoAposLance,
      prazo,
      percentualCategoria,
      parcelaBase,
      parcelaAposLance_mesmoPrazo,
      mesesAposLance_mantendoParcela,
      ...resultadoFinal,
    };
  }, [dadosIniciais.valor, entradaManual, prazoConsorcio, planoSelecionado, lanceValor, lanceMode]);

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
    params.set("versao", dadosIniciais.versionName || dadosIniciais.modelo || "");
    params.set("cor", dadosIniciais.colorName || "");

    const valorCarro = dadosIniciais.valor || 0;
    const credito = Math.max(0, valorCarro - (entradaManual || 0));

    const primeiraParcelaIntegral = planoSelecionado.primeiraParcelaIntegral || 0;
    const demaisParcelasReduzidas = planoSelecionado.demaisParcelasReduzidas || 0;
    const quantidadeReduzidas =
      planoSelecionado.quantidadeReduzidas || Math.max(0, planoSelecionado.prazo - 1);

    const totalConsorcioTabela = round2(
      primeiraParcelaIntegral + demaisParcelasReduzidas * quantidadeReduzidas
    );

    const totalBase = round2(totalConsorcioTabela + (entradaManual || 0));

    params.set("prazo_escolhido", String(planoSelecionado.prazo));
    params.set("parcela_escolhida", String(planoSelecionado.parcela));
    params.set("taxa_adm_total", String(TAXA_ADM_TOTAL));
    params.set("modo_parcela", String(planoSelecionado.key));
    params.set("percentual_categoria", String(planoSelecionado.percentualCategoria));
    params.set("total_final_base", String(totalBase));

    params.set("codigo_tabela", String(planoSelecionado.codigoTabela || ""));
    params.set("credito_tabela", String(planoSelecionado.creditoTabela || credito));
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
      params.set("cupom_acessorios_gratis", couponApplied.effects.accessoriesFree ? "1" : "0");
      params.set("cupom_emplacamento_gratis", couponApplied.effects.platingFree ? "1" : "0");
      params.set("cupom_frete_gratis", couponApplied.effects.freteFree ? "1" : "0");
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

  if (loading)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
          <Loader2 className="animate-spin h-6 w-6 text-black" />
        </div>
        <p className="mt-4 text-xs font-bold uppercase tracking-widest text-slate-400">
          Calculando...
        </p>
      </div>
    );

  const valorCarro = dadosIniciais.valor || 0;
  const credito = resultado?.credito || 0;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24">
      {/* HEADER */}
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
              <h1 className="font-black text-black text-sm uppercase">{dadosIniciais.nome}</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {dadosIniciais.modelo}
              </p>
            </div>

            {dadosIniciais.imagem ? (
              <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 bg-white shadow-sm">
                <img src={dadosIniciais.imagem} className="w-full h-full object-cover" alt="Veículo" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full border border-slate-200 bg-white shadow-sm" />
            )}
          </div>
        </div>
      </header>

      {/* MODAL LANCE */}
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
                <h3 className="font-black text-slate-900 uppercase text-sm">Simulador de Lance</h3>
                <p className="text-[11px] text-slate-500 mt-1">
                  Aplique um lance e escolha: reduzir parcela ou reduzir meses.
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
                  <p className="text-[10px] text-slate-400 font-black uppercase">Crédito</p>
                  <p className="text-lg font-black">{formatMoney(lanceCalc.credito)}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <p className="text-[10px] text-slate-400 font-black uppercase">Parcela Atual</p>
                  <p className="text-lg font-black">{formatMoney(lanceCalc.parcelaBase)}</p>
                  <p className="text-[10px] text-slate-400 font-black uppercase mt-1">{lanceCalc.prazo}x</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <p className="text-[10px] text-slate-400 font-black uppercase">Plano</p>
                  <p className="text-sm font-black text-slate-900">{planoSelecionado?.label}</p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {planoSelecionado?.key === "reduzida" ? "Reduzida" : "Integral"}
                  </p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4">
                <p className="text-[10px] text-slate-400 font-black uppercase mb-2">Valor do Lance</p>
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
                  Máximo: <span className="font-black">{formatMoney(lanceCalc.credito)}</span>
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4">
                <p className="text-[10px] text-slate-400 font-black uppercase mb-2">Como aplicar o lance?</p>
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
                  <p className="text-[10px] text-slate-400 font-black uppercase">Código de Promoção</p>

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
                    <p className="text-[11px] font-black text-slate-900 uppercase">{couponApplied.label}</p>
                    <p className="text-[11px] text-slate-600 mt-1">{couponApplied.description}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {couponApplied.effects.freteFree ? (
                        <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase">
                          Frete grátis
                        </span>
                      ) : null}
                      {couponApplied.effects.platingFree ? (
                        <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase">
                          Emplacamento grátis
                        </span>
                      ) : null}
                      {couponApplied.effects.discountPercent ? (
                        <span className="px-2 py-1 rounded-full bg-slate-200 text-slate-800 text-[10px] font-black uppercase">
                          {couponApplied.effects.discountPercent}% off
                        </span>
                      ) : null}
                      {couponApplied.effects.discountValue ? (
                        <span className="px-2 py-1 rounded-full bg-slate-200 text-slate-800 text-[10px] font-black uppercase">
                          {formatMoney(couponApplied.effects.discountValue)} off
                        </span>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="bg-gradient-to-br from-[#f2e14c]/45 to-white border border-[#f2e14c] rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase text-black/70">Resultado com lance</p>
                    <p className="text-[11px] text-black/70 mt-1">
                      Crédito após lance:{" "}
                      <span className="font-black">{formatMoney(lanceCalc.creditoAposLance)}</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase text-black/70">Parcela final</p>
                    <p className="text-2xl font-black text-black">{formatMoney(lanceCalc.parcelaFinal)}</p>
                    <p className="text-[10px] font-black uppercase text-black/70 mt-1">
                      Prazo final: {lanceCalc.prazoFinal}x
                    </p>
                  </div>
                </div>

                <p className="text-[11px] text-black/70 mt-3">
                  {lanceMode === "reduzir_parcela"
                    ? "Você mantém o mesmo prazo e diminui o valor da parcela."
                    : "Você mantém a parcela e reduz a quantidade de meses (quando possível)."}
                </p>
              </div>

              <div className="h-2" />
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
        {/* TOP SUMMARY */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Módulo de análise
              </p>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-black mt-1">
                Simulação de Crédito
              </h2>
              <p className="text-sm text-slate-500 mt-2">
                Ajuste a entrada e compare <span className="font-black">Financiamento</span> vs{" "}
                <span className="font-black">Consórcio</span>.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase text-slate-400">Valor do veículo</p>
                <p className="text-lg font-black text-black">{formatMoney(valorCarro)}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase text-slate-400">Entrada</p>
                <p className="text-lg font-black text-black">{formatMoney(entradaManual || 0)}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase text-slate-400">Crédito</p>
                <p className="text-lg font-black text-black">{formatMoney(credito)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ENTRADA */}
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
                <p className="text-xs text-slate-500 mt-1">Digite o valor (o campo formata automaticamente).</p>
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

        {/* GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* FINANCIAMENTO */}
          <Card className="overflow-hidden flex flex-col">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center">
                  <Landmark size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    CDC • simulação bancária
                  </p>
                  <h3 className="text-lg font-black text-black uppercase">Financiamento</h3>
                </div>
              </div>

              <div className="mt-4 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
                <p className="text-[10px] text-slate-400 uppercase font-black mb-1">Saldo a financiar</p>
                <p className="text-2xl font-black text-black">{formatMoney(credito)}</p>
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
                {resultado?.financiamento?.planos?.map((p: any) => (
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
                      <span className="text-sm font-bold text-slate-500">clique para usar no contrato</span>
                    </span>
                    <span className="font-black text-slate-900">{formatMoney(p.parcela)}</span>
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

          {/* CONSÓRCIO */}
          <Card className="overflow-hidden flex flex-col ring-1 ring-black/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#f2e14c] text-black flex items-center justify-center">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    tabela exclusiva • máximo {CONSORCIO_MAX_MESES}x
                  </p>
                  <h3 className="text-lg font-black text-black uppercase">Consórcio WBC</h3>
                </div>
              </div>

              <div className="mt-5">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Quantidade de parcelas</p>
                <div className="flex flex-wrap gap-2">
                  {CONSORCIO_PRAZOS.filter((p) => p <= CONSORCIO_MAX_MESES).map((p) => {
                    const active = prazoConsorcio === p;
                    return (
                      <button
                        key={p}
                        onClick={() => setPrazoConsorcio(p)}
                        className={[
                          "h-10 px-3 rounded-xl border text-xs font-black uppercase tracking-widest transition-all",
                          active
                            ? "bg-black text-white border-black"
                            : "bg-white text-slate-700 border-slate-200 hover:border-black",
                        ].join(" ")}
                      >
                        {p}x
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
              <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase mb-3 px-1">
                <span>Opção</span>
                <span>Parcela</span>
              </div>

              <div className="space-y-2 flex-1">
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
                        "w-full text-left rounded-2xl border p-4 transition-all",
                        isSelected
                          ? "border-black bg-gradient-to-br from-[#f2e14c]/60 to-white shadow-md"
                          : "border-slate-200 bg-white hover:bg-slate-50",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div
                            className={[
                              "mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center",
                              isSelected ? "border-black" : "border-slate-300",
                            ].join(" ")}
                          >
                            {isSelected ? <div className="w-2.5 h-2.5 rounded-full bg-black" /> : null}
                          </div>

                          <div>
                            <p className="font-black text-sm text-black">{op.label}</p>
                            <p className="text-[11px] text-slate-600 mt-1">{op.detalhe}</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="font-black text-xl text-black">{formatMoney(op.parcela)}</p>
                          <p className="text-[10px] uppercase font-black text-slate-500 mt-1">
                            {op.prazo}x • {op.key === "reduzida" ? "reduzida" : "integral"}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => {
                  if (!planoSelecionado) return;
                  setIsLanceOpen(true);
                }}
                disabled={!planoSelecionado}
                className={[
                  "mt-6 w-full font-black py-4 rounded-2xl uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-2",
                  planoSelecionado
                    ? "bg-black text-white hover:bg-slate-800 shadow-lg"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed",
                ].join(" ")}
              >
                {planoSelecionado
                  ? `Continuar (${planoSelecionado.prazo}x • ${planoSelecionado.key === "reduzida" ? "Reduzida" : "Integral"})`
                  : "Selecione uma opção acima"}
                {planoSelecionado ? <ChevronRight size={14} /> : null}
              </button>

              <p className="text-[11px] text-slate-500 mt-3">
                Próximo passo: montar o <span className="font-black">lance</span> e (opcional) aplicar{" "}
                <span className="font-black">promoção</span> no modal.
              </p>
            </CardBody>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function AnalisePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <AnaliseContent />
    </Suspense>
  );
}