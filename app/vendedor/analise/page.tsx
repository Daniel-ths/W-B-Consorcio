"use client";

import { useEffect, useState, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
// REGRAS DO CONSÓRCIO (pedido do cliente)
// =========================
const CONSORCIO_MAX_MESES = 84;
const TAXA_ADM_TOTAL = 0.4346; // 43,46%
const REDUZIDA_PERCENT_CATEGORIA = 0.7665; // 76,65% do valor de categoria (até contemplar)

// ✅ prazos disponíveis no consórcio (ajuste como quiser)
const CONSORCIO_PRAZOS = [12, 24, 36, 48, 60, 72, 84];

// FINANCIAMENTO
const TAXA_FINANCIAMENTO_MERCADO = 0.022; // 2.2% a.m

type LanceMode = "reduzir_parcela" | "reduzir_meses";

/**
 * =========================
 * CÓDIGOS DE PROMOÇÃO (vendedor)
 * =========================
 * ✅ NÃO é cupom único: pode usar infinitas vezes.
 * ✅ Validação local (sem backend) via catálogo COUPONS.
 * ✅ Aplica desconto AQUI antes de ir pra /vendedor/contrato.
 */

type CouponEffect = {
  accessoriesFree?: boolean;
  platingFree?: boolean;
  discountPercent?: number; // ex: 2 => 2%
  discountValue?: number; // em reais
  note?: string;
};

type Coupon = {
  code: string;
  label: string;
  description: string;
  sellerOnly?: boolean;
  sellerId?: string; // opcional: restringir para um vendedor específico
  effects: CouponEffect;
};

// ✅ Catálogo de códigos (adicione quantos quiser aqui)
const COUPONS: Coupon[] = [
  // --- GRATUIDADES ---
  {
    code: "WBC-PLACA100",
    label: "Emplacamento grátis",
    description: "Libera o emplacamento sem custo na venda.",
    sellerOnly: true,
    effects: { platingFree: true, note: "Emplacamento 100% grátis." },
  },
  {
    code: "WBC-ACESS100",
    label: "Acessórios grátis",
    description: "Libera os acessórios sem custo na venda.",
    sellerOnly: true,
    effects: { accessoriesFree: true, note: "Acessórios 100% grátis." },
  },
  {
    code: "WBC-COMBOVIP",
    label: "Combo VIP: acessórios + emplacamento grátis",
    description: "Libera acessórios e emplacamento sem custo na venda.",
    sellerOnly: true,
    effects: {
      accessoriesFree: true,
      platingFree: true,
      note: "Acessórios + emplacamento 100% grátis.",
    },
  },

  // ✅ PEDIDO: 2% OFF EM TUDO + EMPLACAMENTO GRÁTIS
  {
    code: "WBC-PLACA2OFF",
    label: "2% OFF em tudo + emplacamento grátis",
    description: "Aplica 2% de desconto no total e libera o emplacamento grátis.",
    sellerOnly: true,
    effects: {
      discountPercent: 2,
      platingFree: true,
      note: "2% OFF no total + emplacamento grátis.",
    },
  },

  // --- OUTROS CÓDIGOS (opcionais pra você ter variedade) ---
  {
    code: "WBC-PLACA3OFF",
    label: "3% OFF + emplacamento grátis",
    description: "Aplica 3% de desconto no total e libera emplacamento grátis.",
    sellerOnly: true,
    effects: { discountPercent: 3, platingFree: true, note: "3% OFF + emplacamento grátis." },
  },
  {
    code: "WBC-ACESS2OFF",
    label: "2% OFF + acessórios grátis",
    description: "Aplica 2% de desconto no total e libera acessórios grátis.",
    sellerOnly: true,
    effects: { discountPercent: 2, accessoriesFree: true, note: "2% OFF + acessórios grátis." },
  },
  {
    code: "WBC-PLACA500",
    label: "R$ 500 OFF + emplacamento grátis",
    description: "Desconto fixo de R$ 500 no total e emplacamento grátis.",
    sellerOnly: true,
    effects: { discountValue: 500, platingFree: true, note: "R$ 500 OFF + emplacamento grátis." },
  },
];

// =========================
// Helpers de Dinheiro (BRL)
// =========================
const formatMoney = (val: number) => {
  if (!isFinite(val)) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
};

// input “mascarado”: usuário digita números, vira centavos, formata em pt-BR (sem R$)
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

function findCoupon(
  codeRaw: string,
  sellerId?: string | null
): { ok: true; coupon: Coupon } | { ok: false; reason: string } {
  const code = (codeRaw || "").trim().toUpperCase();
  if (!code) return { ok: false, reason: "Digite um código." };

  const coupon = COUPONS.find((c) => c.code.toUpperCase() === code);
  if (!coupon) return { ok: false, reason: "Código inválido." };

  // restringe por vendedor, se desejar
  if (coupon.sellerId && sellerId && coupon.sellerId !== sellerId) {
    return { ok: false, reason: "Código não pertence a este vendedor." };
  }

  return { ok: true, coupon };
}

function AnaliseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);

  // DADOS
  const dadosIniciais = useMemo(
    () => ({
      nome: searchParams.get("nome") || "Cliente",
      modelo: searchParams.get("modelo") || "Veículo Selecionado",
      valor: parseFloat(searchParams.get("valor") || "0"),
      entradaUrl: parseFloat(searchParams.get("entrada") || "0") || 0,
      imagem: searchParams.get("imagem") || "",
      vendedorId: searchParams.get("vendedor") || searchParams.get("vendedor_id") || null, // opcional
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchParams.toString()]
  );

  // =========================
  // ENTRADA com máscara BRL
  // =========================
  const [entradaManual, setEntradaManual] = useState<number>(dadosIniciais.entradaUrl);
  const [entradaDisplay, setEntradaDisplay] = useState<string>(formatBRLInput(dadosIniciais.entradaUrl));

  // ✅ escolhe prazo do consórcio
  const [prazoConsorcio, setPrazoConsorcio] = useState<number>(Math.min(CONSORCIO_MAX_MESES, 84));

  const [resultado, setResultado] = useState<any>(null);
  const [planoSelecionado, setPlanoSelecionado] = useState<any>(null);

  // ====== MODAL DE LANCE ======
  const [isLanceOpen, setIsLanceOpen] = useState(false);

  // LANCE com máscara BRL
  const [lanceValor, setLanceValor] = useState<number>(0);
  const [lanceDisplay, setLanceDisplay] = useState<string>(formatBRLInput(0));
  const [lanceMode, setLanceMode] = useState<LanceMode>("reduzir_parcela");

  // =========================
  // CÓDIGO DE PROMO — UI/Estado
  // =========================
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

      // ===== CONSÓRCIO (calcula por trás, mas NÃO EXIBE valor de categoria) =====
      const valorCategoria = credito * (1 + TAXA_ADM_TOTAL);
      const prazoSeguro = Math.min(prazoConsorcio, CONSORCIO_MAX_MESES);

      const consorcioOpcoes = [
        {
          key: "integral",
          label: "Opção 1 (Integral)",
          prazo: prazoSeguro,
          percentualCategoria: 1,
          parcela: prazoSeguro > 0 ? valorCategoria / prazoSeguro : 0,
          detalhe: "Parcela integral (100%) no prazo selecionado.",
        },
        {
          key: "reduzida",
          label: "Opção 2 (Reduzida até contemplar)",
          prazo: prazoSeguro,
          percentualCategoria: REDUZIDA_PERCENT_CATEGORIA,
          parcela: prazoSeguro > 0 ? (valorCategoria * REDUZIDA_PERCENT_CATEGORIA) / prazoSeguro : 0,
          detalhe: "Parcela reduzida até contemplação (76,65%).",
        },
      ];

      // ===== FINANCIAMENTO =====
      const prazosFinanc = [12, 24, 36, 48, 60];
      const planosFinanc = prazosFinanc.map((prazo) => {
        const i = TAXA_FINANCIAMENTO_MERCADO;
        const divisor = 1 - Math.pow(1 + i, -prazo);
        const parcela = divisor !== 0 ? (credito * i) / divisor : 0;
        return { prazo, parcela, total: parcela * prazo };
      });

      setResultado({
        credito,
        consorcio: { opcoes: consorcioOpcoes, prazoSelecionado: prazoSeguro },
        financiamento: { planos: planosFinanc },
      });

      setPlanoSelecionado(null);
      setLoading(false);
    };

    if (loading) {
      const timer = setTimeout(realizarCalculo, 600);
      return () => clearTimeout(timer);
    } else {
      realizarCalculo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entradaManual, dadosIniciais.valor, prazoConsorcio]);

  const irParaSantander = () => {
    window.open(
      "https://www.cliente.santanderfinanciamentos.com.br/originacaocliente/?mathts=nonpaid#/dados-pessoais",
      "_blank"
    );
  };

  // ====== CÁLCULO DO LANCE ======
  const lanceCalc = useMemo(() => {
    const valorCarro = dadosIniciais.valor || 0;
    const entrada = Math.max(0, entradaManual || 0);
    const credito = Math.max(0, valorCarro - entrada);

    const prazo = planoSelecionado?.prazo || Math.min(prazoConsorcio, CONSORCIO_MAX_MESES);
    const percentualCategoria = planoSelecionado?.percentualCategoria ?? 1;

    // parcela base é do plano selecionado (sem lance)
    const parcelaBase = planoSelecionado?.parcela || 0;

    // lance: não pode passar do crédito
    const lance = Math.max(0, Math.min(lanceValor || 0, credito));

    // modelo simples: lance reduz o crédito necessário
    const creditoAposLance = Math.max(0, credito - lance);
    const valorCategoriaAposLance = creditoAposLance * (1 + TAXA_ADM_TOTAL);

    const parcelaAposLance_mesmoPrazo =
      prazo > 0 ? (valorCategoriaAposLance * percentualCategoria) / prazo : 0;

    // reduzir meses mantendo parcela original (base)
    const mesesAposLance_mantendoParcela =
      parcelaBase > 0
        ? Math.max(1, Math.ceil((valorCategoriaAposLance * percentualCategoria) / parcelaBase))
        : prazo;

    const resultadoFinal =
      lanceMode === "reduzir_parcela"
        ? {
            prazoFinal: prazo,
            parcelaFinal: parcelaAposLance_mesmoPrazo,
          }
        : {
            prazoFinal: Math.min(prazo, mesesAposLance_mantendoParcela),
            parcelaFinal: parcelaBase, // mantém parcela original do plano
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
      valorCategoriaAposLance,
      parcelaAposLance_mesmoPrazo,
      mesesAposLance_mantendoParcela,
      ...resultadoFinal,
    };
  }, [dadosIniciais.valor, entradaManual, prazoConsorcio, planoSelecionado, lanceValor, lanceMode]);

  // ====== AVANÇAR COM O LANCE + PROMO (APLICA DESCONTO AQUI) ======
  const avancarParaContrato = (opts?: { withLance?: boolean }) => {
    if (!planoSelecionado) return;

    const params = new URLSearchParams(searchParams.toString());

    params.set("tipo", "CONSORCIO");
    params.set("entrada", String(entradaManual || 0));

    // ✅ total_base (sem exibir valor de categoria — mas precisa calcular)
    const valorCarro = dadosIniciais.valor || 0;
    const credito = Math.max(0, valorCarro - (entradaManual || 0));
    const valorCategoria = credito * (1 + TAXA_ADM_TOTAL);
    const totalBase = round2((valorCategoria || 0) + (entradaManual || 0));

    // valores base (do plano)
    params.set("prazo_escolhido", String(planoSelecionado.prazo));
    params.set("parcela_escolhida", String(planoSelecionado.parcela));

    // extras úteis
    params.set("taxa_adm_total", String(TAXA_ADM_TOTAL));
    params.set("modo_parcela", String(planoSelecionado.key)); // integral | reduzida
    params.set("percentual_categoria", String(planoSelecionado.percentualCategoria));

    // Sempre manda o base (pra conferência/depuração)
    params.set("total_final_base", String(totalBase));

    // ✅ PROMO: aplica desconto no total aqui e manda total final já pronto
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

      // manda infos da promo
      params.set("cupom_codigo", couponApplied.code);
      params.set("cupom_label", couponApplied.label);
      params.set("cupom_acessorios_gratis", couponApplied.effects.accessoriesFree ? "1" : "0");
      params.set("cupom_emplacamento_gratis", couponApplied.effects.platingFree ? "1" : "0");
      params.set("cupom_desconto_percent", String(percent));
      params.set("cupom_desconto_valor", String(descontoFixo));
      params.set("cupom_obs", couponApplied.effects.note || "");

      // manda valores calculados
      params.set("total_final_com_cupom", String(totalComPromo));
      params.set("desconto_total_valor", String(descontoTotalValor));

      // ✅ facilita na próxima página:
      params.set("total_final", String(totalComPromo));
    } else {
      // sem promo: padrão
      params.set("total_final", String(totalBase));
    }

    // ✅ campos do lance (se aplicável)
    const usarLance = !!opts?.withLance;
    if (usarLance) {
      params.set("lance_valor", String(lanceCalc.lance));
      params.set("lance_modo", String(lanceMode)); // reduzir_parcela | reduzir_meses
      params.set("prazo_final", String(lanceCalc.prazoFinal));
      params.set("parcela_final", String(lanceCalc.parcelaFinal));
      params.set("credito_apos_lance", String(lanceCalc.creditoAposLance));
    }

    router.push(`/vendedor/contrato?${params.toString()}`);
  };

  if (loading)
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white">
        <Loader2 className="animate-spin h-10 w-10 text-black mb-4" />
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <button
            onClick={() => router.back()}
            className="text-xs font-bold text-slate-500 hover:text-black flex items-center gap-2 uppercase transition-all"
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
              <img
                src={dadosIniciais.imagem}
                className="w-10 h-10 rounded-full object-cover border border-slate-200"
                alt="Veículo"
              />
            ) : null}
          </div>
        </div>
      </header>

      {/* =========================
          MODAL DO LANCE (R$ + PROMO)
         ========================= */}
      {isLanceOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900 uppercase text-sm">Simulador de Lance</h3>
                <p className="text-[11px] text-slate-500 mt-1">
                  Aplique um lance e escolha: reduzir parcela ou reduzir meses.
                </p>
              </div>
              <button
                onClick={() => setIsLanceOpen(false)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-500"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Crédito</p>
                  <p className="text-lg font-black">{formatMoney(lanceCalc.credito)}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Parcela Atual</p>
                  <p className="text-lg font-black">{formatMoney(lanceCalc.parcelaBase)}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{lanceCalc.prazo}x</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Plano</p>
                  <p className="text-sm font-black text-slate-900">{planoSelecionado?.label}</p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {planoSelecionado?.key === "reduzida" ? "Reduzida" : "Integral"}
                  </p>
                </div>
              </div>

              {/* LANCE (R$ mascarado) */}
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-2">Valor do Lance</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-400">R$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={lanceDisplay}
                    onChange={(e) => {
                      const num = parseDigitsToBRLNumber(e.target.value);
                      setLanceValor(num);
                      setLanceDisplay(formatBRLInput(num));
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg h-11 px-3 text-lg font-black text-slate-900 outline-none focus:border-black"
                    placeholder="0,00"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  Máximo: <span className="font-black">{formatMoney(lanceCalc.credito)}</span> (crédito)
                </p>
              </div>

              {/* COMO APLICAR */}
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-2">Como aplicar o lance?</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLanceMode("reduzir_parcela")}
                    className={[
                      "h-11 rounded-lg border text-xs font-black uppercase tracking-widest transition-all",
                      lanceMode === "reduzir_parcela"
                        ? "bg-black text-white border-black"
                        : "bg-white text-slate-600 border-slate-200 hover:border-black",
                    ].join(" ")}
                  >
                    Reduzir parcela
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanceMode("reduzir_meses")}
                    className={[
                      "h-11 rounded-lg border text-xs font-black uppercase tracking-widest transition-all",
                      lanceMode === "reduzir_meses"
                        ? "bg-black text-white border-black"
                        : "bg-white text-slate-600 border-slate-200 hover:border-black",
                    ].join(" ")}
                  >
                    Reduzir meses
                  </button>
                </div>
              </div>

              {/* PROMO */}
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Código de Promoção</p>

                  {couponApplied ? (
                    <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase text-emerald-700">
                      <CheckCircle2 size={14} /> Aplicado
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                  <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg h-11 px-3">
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
                      className="h-11 px-4 rounded-lg bg-black text-white font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition-all"
                    >
                      Aplicar
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={clearCoupon}
                      className="h-11 px-4 rounded-lg border-2 border-slate-200 hover:border-black text-black font-black uppercase text-xs tracking-widest transition-all"
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
                  <div className="mt-3 bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <p className="text-[11px] font-black text-slate-900 uppercase">{couponApplied.label}</p>
                    <p className="text-[11px] text-slate-600 mt-1">{couponApplied.description}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {couponApplied.effects.accessoriesFree ? (
                        <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase">
                          Acessórios grátis
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

              {/* RESULTADO */}
              <div className="bg-[#f2e14c]/40 border border-[#f2e14c] rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase text-black/70">Resultado com lance</p>
                    <p className="text-[11px] text-black/70 mt-1">
                      Crédito após lance: <span className="font-black">{formatMoney(lanceCalc.creditoAposLance)}</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase text-black/70">Parcela Final</p>
                    <p className="text-xl font-black text-black">{formatMoney(lanceCalc.parcelaFinal)}</p>
                    <p className="text-[10px] font-black uppercase text-black/70 mt-1">
                      Prazo Final: {lanceCalc.prazoFinal}x
                    </p>
                  </div>
                </div>

                <p className="text-[11px] text-black/70 mt-3">
                  {lanceMode === "reduzir_parcela"
                    ? "Você mantém o mesmo prazo e diminui o valor da parcela."
                    : "Você mantém a parcela e reduz a quantidade de meses (quando possível)."}
                </p>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => {
                  setIsLanceOpen(false);
                  avancarParaContrato({ withLance: false });
                }}
                className="h-11 px-4 rounded-lg border-0 border-slate-200 hover:border-black text-black font-black uppercase text-xs tracking-widest transition-all"
              >
               
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsLanceOpen(false);
                  avancarParaContrato({ withLance: true });
                }}
                className="h-11 px-4 rounded-lg bg-black text-white font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
              >
                Aplicar lance e continuar <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* CONTROLE DE ENTRADA (R$ mascarado) */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight text-black flex items-center gap-2">
              <DollarSign size={20} className="text-[#f2e14c]" /> Simulação de Crédito
            </h2>
            <p className="text-slate-500 text-xs font-medium mt-1">Defina a entrada para recalcular.</p>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto bg-slate-50 p-2 rounded-lg border border-slate-200">
            <div className="pl-4">
              <span className="text-[9px] font-bold text-slate-400 uppercase block">Valor da Entrada</span>
              <div className="flex items-center gap-1">
                <span className="text-sm font-bold text-slate-400">R$</span>

                <input
                  type="text"
                  inputMode="numeric"
                  value={entradaDisplay}
                  onChange={(e) => {
                    const num = parseDigitsToBRLNumber(e.target.value);
                    setEntradaManual(num);
                    setEntradaDisplay(formatBRLInput(num));
                  }}
                  className="bg-transparent border-none text-black text-xl font-black w-36 focus:ring-0 p-0 outline-none"
                  placeholder="0,00"
                />
              </div>
            </div>

            <button
              onClick={() => {
                const sugerida = (dadosIniciais.valor || 0) * 0.3;
                setEntradaManual(sugerida);
                setEntradaDisplay(formatBRLInput(sugerida));
              }}
              className="bg-black hover:bg-slate-800 text-white text-[10px] font-bold uppercase px-4 py-3 rounded-md transition-all active:scale-95"
            >
              Sugerir 30%
            </button>
          </div>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* FINANCIAMENTO */}
          <div className="bg-white flex flex-col rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
                  <Landmark size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-black uppercase">Financiamento</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Simulação Bancária (CDC)
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg text-center">
                <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Saldo a Financiar</p>
                <p className="text-2xl font-black text-black">{formatMoney(resultado?.credito || 0)}</p>
              </div>
            </div>

            <div className="p-6 flex-1 flex flex-col">
              <div className="space-y-0 flex-1">
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase mb-3 px-2">
                  <span>Prazo</span>
                  <span>Estimativa</span>
                </div>

                {resultado?.financiamento?.planos?.map((p: any) => (
                  <div key={p.prazo} className="flex justify-between items-center py-3 px-2 border-b border-slate-100">
                    <span className="font-bold text-slate-500 text-sm">{p.prazo}x</span>
                    <span className="font-bold text-slate-900">{formatMoney(p.parcela)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-4">
                <button
                  onClick={irParaSantander}
                  className="w-full bg-white border-2 border-slate-200 hover:border-black text-black font-black py-4 rounded-lg uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-2"
                >
                  Simular no Santander <ExternalLink size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* CONSÓRCIO */}
          <div className="bg-white flex flex-col rounded-xl shadow-lg border border-slate-200 overflow-hidden h-full relative ring-1 ring-black/5">
            <div className="p-6 border-b border-slate-100 bg-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#f2e14c] text-black flex items-center justify-center">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-black uppercase">Consórcio W B C</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    tabela exclusiva • máximo {CONSORCIO_MAX_MESES}x
                  </p>
                </div>
              </div>

              {/* ✅ ESCOLHER PRAZO */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Quantidade de parcelas</p>
                <div className="flex flex-wrap gap-2">
                  {CONSORCIO_PRAZOS.filter((p) => p <= CONSORCIO_MAX_MESES).map((p) => {
                    const active = prazoConsorcio === p;
                    return (
                      <button
                        key={p}
                        onClick={() => setPrazoConsorcio(p)}
                        className={[
                          "h-9 px-3 rounded-lg border text-xs font-black uppercase tracking-widest transition-all",
                          active
                            ? "bg-black text-white border-black"
                            : "bg-white text-slate-600 border-slate-200 hover:border-black",
                        ].join(" ")}
                      >
                        {p}x
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-6 flex-1 flex flex-col">
              <div className="space-y-2 flex-1">
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase mb-2 px-4">
                  <span>Opção</span>
                  <span>Parcela</span>
                </div>

                {resultado?.consorcio?.opcoes?.map((op: any) => {
                  const isSelected = planoSelecionado?.key === op.key;

                  return (
                    <div
                      key={op.key}
                      onClick={() => {
                        setPlanoSelecionado(op);
                        // reset do lance quando troca plano
                        setLanceValor(0);
                        setLanceDisplay(formatBRLInput(0));
                        setLanceMode("reduzir_parcela");
                      }}
                      className={[
                        "flex flex-col gap-2 py-3 px-4 rounded-lg cursor-pointer transition-all border",
                        isSelected
                          ? "bg-[#f2e14c] border-[#f2e14c] text-black shadow-md scale-[1.02]"
                          : "bg-white border-transparent hover:bg-slate-50 text-slate-600",
                      ].join(" ")}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={[
                              "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                              isSelected ? "border-black" : "border-slate-300",
                            ].join(" ")}
                          >
                            {isSelected ? <div className="w-2 h-2 rounded-full bg-black" /> : null}
                          </div>

                          <div>
                            <p className={["font-black text-sm", isSelected ? "text-black" : "text-slate-700"].join(" ")}>
                              {op.label}
                            </p>
                            <p className={["text-[11px]", isSelected ? "text-black/70" : "text-slate-500"].join(" ")}>
                              {op.detalhe}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className={["font-black text-lg", isSelected ? "text-black" : "text-slate-900"].join(" ")}>
                            {formatMoney(op.parcela)}
                          </p>
                          <p
                            className={[
                              "text-[10px] uppercase font-bold",
                              isSelected ? "text-black/70" : "text-slate-400",
                            ].join(" ")}
                          >
                            {op.prazo}x
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100 space-y-3">
                {/* ✅ abre modal */}
                <button
                  onClick={() => {
                    if (!planoSelecionado) return;
                    setIsLanceOpen(true);
                  }}
                  disabled={!planoSelecionado}
                  className={[
                    "w-full font-black py-4 rounded-lg uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-2",
                    planoSelecionado
                      ? "bg-black text-white hover:bg-slate-800 shadow-lg cursor-pointer"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed",
                  ].join(" ")}
                >
                  {planoSelecionado
                    ? `Continuar (${planoSelecionado.prazo}x • ${planoSelecionado.key === "reduzida" ? "Reduzida" : "Integral"})`
                    : "Selecione uma opção acima"}
                  {planoSelecionado ? <ChevronRight size={14} /> : null}
                </button>

                <p className="text-[11px] text-slate-500">
                  Próximo passo: montar o <span className="font-black">lance</span> e (opcional) aplicar{" "}
                  <span className="font-black">promoção</span> no modal.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AnalisePage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <AnaliseContent />
    </Suspense>
  );
}