"use client";

export const dynamic = "force-dynamic";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  DollarSign,
  Users,
  Building2,
  TrendingUp,
  Edit3,
  Save,
  X,
  Sparkles,
  Info,
  AlertCircle,
  Lightbulb,
  Target,
  Calendar,
  RefreshCw,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";

/* ===================== DADOS DO MÊS ===================== */
const dadosIniciais = {
  // Produção do mês (crédito vendido — não é produto físico)
  vendasMes: 8000000,
  metaVendas: 8000000,

  // Receita de comissão do mês
  receitaAdesao: 160000,
  receitaSegunda: 96000,
  receitaTerceira: 65000,

  // Folha do mês (recorrente)
  vendedores: 40000,
  supervisores: 24000,
  alexandre: 26000,
  rh: 8000,

  // Custos operacionais do mês (recorrentes)
  castanheira: 12000,       // PDV Belém — custo mensal
  parauapebas: 24000,     // PDV Partage — custo mensal
  aluguelEscritorio: 5000, // aluguel mensal

  impostos: 52323,
  administrativoExtra: 20000,
};

const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const CORES = ["#059669", "#0d9488", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#64748b"];

export default function DashboardMensalConsorcio() {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [dados, setDados] = useState(dadosIniciais);
  const [temp, setTemp] = useState(dadosIniciais);

  useEffect(() => {
    const salvo = localStorage.getItem("dashboard-mensal-mais-consorcio");
    if (salvo) {
      try {
        const parsed = JSON.parse(salvo);
        setDados(parsed);
        setTemp(parsed);
      } catch {}
    }
  }, []);

  const iniciarEdicao = () => {
    setTemp({ ...dados });
    setEditando(true);
  };

  const cancelar = () => {
    setTemp({ ...dados });
    setEditando(false);
  };

  const salvar = () => {
    setDados(temp);
    localStorage.setItem("dashboard-mensal-mais-consorcio", JSON.stringify(temp));
    setEditando(false);
  };

  const atualizar = (campo: string, valor: number) => {
    setTemp((prev) => ({ ...prev, [campo]: valor }));
  };

  const d = editando ? temp : dados;

  // Tudo é do MÊS
  const receitaMes = d.receitaAdesao + d.receitaSegunda + d.receitaTerceira;
  const folhaMes = d.vendedores + d.supervisores + d.alexandre + d.rh;
  const pdvMes = d.castanheira + d.parauapebas;
  const escritorioMes = d.aluguelEscritorio + d.administrativoExtra;
  const custoMes = folhaMes + pdvMes + escritorioMes + d.impostos;
  const lucroMes = receitaMes - custoMes;
  const margemMes = receitaMes > 0 ? (lucroMes / receitaMes) * 100 : 0;
  const custoPorMilhao = (custoMes / d.vendasMes) * 1_000_000;
  const percMeta = (d.vendasMes / d.metaVendas) * 100;

  const porArea = [
    { nome: "Vendedores", valor: d.vendedores },
    { nome: "Supervisores", valor: d.supervisores },
    { nome: "Alexandre", valor: d.alexandre },
    { nome: "RH", valor: d.rh },
    { nome: "Castanheira", valor: d.castanheira },
    { nome: "Parauapebas", valor: d.parauapebas },
    { nome: "Escritório", valor: escritorioMes },
  ];

  const pizza = [
    { name: "Folha (time)", value: folhaMes },
    { name: "Pontos de venda", value: pdvMes },
    { name: "Escritório", value: escritorioMes },
    { name: "Impostos", value: d.impostos },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-zinc-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl">
        <p className="font-medium">{payload[0].payload?.nome || payload[0].name}</p>
        <p className="text-zinc-300">{money.format(payload[0].value)} / mês</p>
      </div>
    );
  };

  return (
    <main className="relative min-h-screen bg-[#f3f0e9] text-zinc-900">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#faf8f3_0%,_#f0ebe2_60%,_#e9e3d8_100%)]" />
      </div>

      <div className="relative z-10 max-w-[1100px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* HEADER */}
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-md bg-zinc-900 flex items-center justify-center">
                  <Sparkles size={14} className="text-[#c4a574]" />
                </div>
                <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-zinc-500">
                  Mais Consórcio
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                Resultado do mês
              </h1>
              <p className="text-sm text-zinc-500 mt-1 flex items-center gap-1.5">
                <Calendar size={14} />
                Ciclo mensal · crédito vendido (não é produto físico)
              </p>
            </div>

            <div className="flex items-center gap-2">
              {!editando ? (
                <button
                  onClick={iniciarEdicao}
                  className="h-10 px-4 rounded-full bg-zinc-900 text-white text-sm font-medium flex items-center gap-2 hover:bg-zinc-800 transition"
                >
                  <Edit3 size={15} />
                  Atualizar mês
                </button>
              ) : (
                <>
                  <button
                    onClick={salvar}
                    className="h-10 px-4 rounded-full bg-emerald-700 text-white text-sm font-medium flex items-center gap-2 hover:bg-emerald-800 transition"
                  >
                    <Save size={15} />
                    Salvar mês
                  </button>
                  <button
                    onClick={cancelar}
                    className="h-10 px-4 rounded-full bg-white border border-zinc-200 text-zinc-700 text-sm font-medium flex items-center gap-2 hover:bg-zinc-50 transition"
                  >
                    <X size={15} />
                    Cancelar
                  </button>
                </>
              )}
              <button
                onClick={() => router.back()}
                className="h-10 w-10 rounded-full bg-white border border-zinc-200 text-zinc-600 flex items-center justify-center hover:bg-zinc-50 transition"
              >
                <ArrowLeft size={16} />
              </button>
            </div>
          </div>

          {editando && (
            <div className="mt-4 flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200/80 px-4 py-3">
              <Info size={18} className="text-amber-700 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-900">
                <span className="font-medium">Editando o mês atual.</span> Todos os
                valores são mensais e recorrentes. Ao salvar, o lucro do mês é recalculado.
              </p>
            </div>
          )}
        </header>

        {/* LEMBRETE DO MODELO */}
        <div className="mb-6 flex items-start gap-3 rounded-xl bg-sky-50 border border-sky-200/80 px-4 py-3">
          <RefreshCw size={18} className="text-sky-700 shrink-0 mt-0.5" />
          <div className="text-sm text-sky-900">
            <p className="font-medium">Como funciona o mês</p>
            <p className="mt-0.5 text-sky-800/90">
              Vende crédito (R$ 8 mi) → recebe comissão → paga folha, PDV, aluguel e
              impostos do mês → sobra o lucro. Não tem estoque físico para carregar.
            </p>
          </div>
        </div>

        {/* RESULTADO DO MÊS */}
        <section className="mb-8 rounded-2xl bg-zinc-900 text-white p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
            Este mês · meta R$ 8 milhões em crédito
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-zinc-400 text-xs">Crédito vendido</p>
              <p className="text-xl font-semibold mt-0.5">
                {editando ? (
                  <CampoEscuro value={d.vendasMes} onChange={(v) => atualizar("vendasMes", v)} />
                ) : (
                  money.format(d.vendasMes)
                )}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">{Math.round(percMeta)}% da meta</p>
            </div>
            <div>
              <p className="text-zinc-400 text-xs">Receita (comissão)</p>
              <p className="text-xl font-semibold mt-0.5">{money.format(receitaMes)}</p>
            </div>
            <div>
              <p className="text-zinc-400 text-xs">Custos do mês</p>
              <p className="text-xl font-semibold mt-0.5">{money.format(custoMes)}</p>
            </div>
            <div>
              <p className="text-zinc-400 text-xs">Lucro do mês</p>
              <p className="text-xl font-semibold mt-0.5 text-emerald-400">
                {money.format(lucroMes)}
              </p>
              <p className="text-xs text-emerald-500/80 mt-0.5">
                margem {margemMes.toFixed(1)}%
              </p>
            </div>
          </div>
        </section>

        {/* CUSTOS RECORRENTES DO MÊS */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={16} className="text-zinc-500" />
            <h2 className="text-base font-semibold">Custos recorrentes deste mês</h2>
          </div>
          <p className="text-sm text-zinc-500 mb-4">
            Tudo que sai todo mês para manter a operação rodando
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-3 rounded-2xl bg-white border border-zinc-200/70 p-5 shadow-sm">
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={porArea} barSize={28}>
                    <XAxis
                      dataKey="nome"
                      tick={{ fontSize: 10, fill: "#71717a" }}
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                      angle={-18}
                      textAnchor="end"
                      height={48}
                    />
                    <YAxis hide />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f4f4f5" }} />
                    <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
                      {porArea.map((_, i) => (
                        <Cell key={i} fill={CORES[i % CORES.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-2 rounded-2xl bg-white border border-zinc-200/70 p-5 shadow-sm">
              <p className="text-xs font-medium text-zinc-500 mb-2">
                Para onde vai o custo do mês
              </p>
              <div className="h-[150px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pizza}
                      cx="50%"
                      cy="50%"
                      innerRadius={42}
                      outerRadius={62}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pizza.map((_, i) => (
                        <Cell key={i} fill={CORES[i]} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5 mt-1">
                {pizza.map((item, i) => (
                  <div key={item.name} className="flex justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: CORES[i] }} />
                      <span className="text-zinc-600">{item.name}</span>
                    </div>
                    <span className="font-medium">{money.format(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FOLHA DO MÊS */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Users size={16} className="text-zinc-500" />
            <h2 className="text-base font-semibold">Folha do mês (time comercial)</h2>
          </div>
          <p className="text-sm text-zinc-500 mb-4">
            Custo recorrente com quem vende o crédito
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <CardMes titulo="Vendedores" valor={d.vendedores} sub="Todo mês" editando={editando} onChange={(v) => atualizar("vendedores", v)} />
            <CardMes titulo="Supervisores" valor={d.supervisores} sub="Todo mês" editando={editando} onChange={(v) => atualizar("supervisores", v)} />
            <CardMes titulo="Alexandre" valor={d.alexandre} sub="Todo mês" editando={editando} onChange={(v) => atualizar("alexandre", v)} />
            <CardMes titulo="RH" valor={d.rh} sub="Todo mês" editando={editando} onChange={(v) => atualizar("rh", v)} />
          </div>
          <div className="mt-3 rounded-xl bg-white border border-zinc-200/70 px-4 py-3 flex justify-between shadow-sm">
            <span className="text-sm font-medium text-zinc-600">Total folha no mês</span>
            <span className="text-lg font-semibold">{money.format(folhaMes)}</span>
          </div>
        </section>

        {/* PDV + ESCRITÓRIO (MENSAIS) */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Building2 size={16} className="text-zinc-500" />
            <h2 className="text-base font-semibold">Pontos de venda e escritório (mensal)</h2>
          </div>
          <p className="text-sm text-zinc-500 mb-4">
            Custo fixo/recorrente para manter as lojas e a operação
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <CardMes
              titulo="Castanheira (Belém)"
              valor={d.castanheira}
              sub="Custo médio mensal do PDV"
              editando={editando}
              onChange={(v) => atualizar("castanheira", v)}
              destaque
            />
            <CardMes
              titulo="Partage (Parauapebas)"
              valor={d.parauapebas}
              sub="Custo médio mensal do PDV"
              editando={editando}
              onChange={(v) => atualizar("parauapebas", v)}
              destaque
            />
            <CardMes
              titulo="Aluguel do escritório"
              valor={d.aluguelEscritorio}
              sub="Todo mês"
              editando={editando}
              onChange={(v) => atualizar("aluguelEscritorio", v)}
            />
          </div>
        </section>

        {/* ONDE MELHORAR NO CICLO MENSAL */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb size={16} className="text-zinc-500" />
            <h2 className="text-base font-semibold">Onde ajustar para sobrar mais no mês</h2>
          </div>
          <p className="text-sm text-zinc-500 mb-4">
            Como o negócio é mensal, cada real a menos de custo ou a mais de venda no mês cai direto no lucro
          </p>

          <div className="space-y-3">
            <Insight
              tipo="alerta"
              titulo="Parauapebas custa 2x Belém todo mês"
              texto={`São ${money.format(d.parauapebas)} vs ${money.format(d.castanheira)} recorrentes. Se a venda de lá não for bem maior, esse custo mensal come lucro todo mês. Vale medir venda por real investido em cada PDV.`}
            />
            <Insight
              tipo="info"
              titulo="Folha é o maior gasto recorrente"
              texto={`${money.format(folhaMes)}/mês (${((folhaMes / custoMes) * 100).toFixed(0)}% dos custos). O caminho mais forte de lucro é o mesmo time vender mais crédito no mês — sem aumentar a folha.`}
            />
            <Insight
              tipo="positivo"
              titulo="Margem deste mês"
              texto={`Com ${money.format(d.vendasMes)} vendidos, sobram cerca de ${money.format(lucroMes)} (${margemMes.toFixed(1)}%). Como não há estoque físico, o lucro do mês é quase direto: comissão menos opex do mês.`}
            />
            <Insight
              tipo="info"
              titulo="Custo por R$ 1 milhão vendido no mês"
              texto={`Hoje sai cerca de ${money.format(custoPorMilhao)} de custo para cada R$ 1 mi em crédito vendido. Se esse número cair no próximo mês (mais venda ou menos custo fixo), o lucro sobe na mesma hora.`}
            />
          </div>
        </section>

        {/* CONTA DO MÊS */}
        <section className="rounded-2xl bg-white border border-zinc-200/70 p-5 sm:p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Target size={16} className="text-zinc-500" />
            <h2 className="text-base font-semibold">Conta fechada do mês</h2>
          </div>
          <p className="text-sm text-zinc-500 mb-5">
            Receita de comissão − custos recorrentes = lucro do mês
          </p>

          <div className="space-y-0 max-w-md">
            <Linha label="Receita de comissão (mês)" valor={receitaMes} tipo="mais" />
            <Linha label="(−) Folha comercial" valor={folhaMes} tipo="menos" />
            <Linha label="(−) Pontos de venda" valor={pdvMes} tipo="menos" />
            <Linha label="(−) Escritório + admin" valor={escritorioMes} tipo="menos" />
            <Linha
              label="(−) Impostos"
              valor={d.impostos}
              tipo="menos"
              editando={editando}
              onChange={(v) => atualizar("impostos", v)}
            />
            <div className="border-t border-zinc-100 my-2" />
            <Linha label="Lucro do mês" valor={lucroMes} tipo="resultado" />
          </div>
        </section>
      </div>
    </main>
  );
}

/* ===================== UI ===================== */

function CardMes({
  titulo,
  valor,
  sub,
  editando,
  onChange,
  destaque,
}: {
  titulo: string;
  valor: number;
  sub: string;
  editando?: boolean;
  onChange?: (v: number) => void;
  destaque?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm ${
        destaque ? "bg-white border-amber-200/80" : "bg-white border-zinc-200/70"
      }`}
    >
      <p className="text-sm font-medium text-zinc-700">{titulo}</p>
      <p className="text-xs text-zinc-400 mt-0.5 mb-2">{sub}</p>
      {editando && onChange ? (
        <Campo value={valor} onChange={onChange} />
      ) : (
        <p className="text-lg font-semibold">{money.format(valor)}</p>
      )}
    </div>
  );
}

function Campo({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <input
      type="number"
      value={value || ""}
      onChange={(e) => onChange(Number(e.target.value) || 0)}
      className="w-full bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
    />
  );
}

function CampoEscuro({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <input
      type="number"
      value={value || ""}
      onChange={(e) => onChange(Number(e.target.value) || 0)}
      className="w-36 bg-zinc-800 border border-zinc-600 rounded-lg px-2 py-1 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
    />
  );
}

function Linha({
  label,
  valor,
  tipo,
  editando,
  onChange,
}: {
  label: string;
  valor: number;
  tipo: "mais" | "menos" | "resultado";
  editando?: boolean;
  onChange?: (v: number) => void;
}) {
  return (
    <div
      className={`flex justify-between items-center py-2 ${
        tipo === "resultado" ? "bg-emerald-50 -mx-2 px-2 rounded-lg" : ""
      }`}
    >
      <span className={`text-sm ${tipo === "resultado" ? "font-semibold" : "text-zinc-600"}`}>
        {label}
      </span>
      {editando && onChange ? (
        <Campo value={valor} onChange={onChange} />
      ) : (
        <span
          className={`text-sm font-semibold tabular-nums ${
            tipo === "resultado"
              ? "text-emerald-700 text-base"
              : tipo === "menos"
              ? "text-red-600"
              : "text-emerald-700"
          }`}
        >
          {tipo === "menos" ? "− " : ""}
          {money.format(Math.abs(valor))}
        </span>
      )}
    </div>
  );
}

function Insight({
  tipo,
  titulo,
  texto,
}: {
  tipo: "alerta" | "info" | "positivo";
  titulo: string;
  texto: string;
}) {
  const estilos = {
    alerta: "bg-amber-50 border-amber-200/80 text-amber-900",
    info: "bg-sky-50 border-sky-200/80 text-sky-900",
    positivo: "bg-emerald-50 border-emerald-200/80 text-emerald-900",
  };
  const icones = {
    alerta: <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />,
    info: <Info size={18} className="text-sky-600 shrink-0 mt-0.5" />,
    positivo: <TrendingUp size={18} className="text-emerald-600 shrink-0 mt-0.5" />,
  };
  return (
    <div className={`rounded-xl border px-4 py-3 flex gap-3 ${estilos[tipo]}`}>
      {icones[tipo]}
      <div>
        <p className="text-sm font-semibold">{titulo}</p>
        <p className="text-sm mt-0.5 opacity-90">{texto}</p>
      </div>
    </div>
  );
}