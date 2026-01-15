"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, AlertTriangle, Wallet, Loader2, TrendingDown, CheckCircle2, Landmark, ChevronRight, XCircle, AlertCircle, ExternalLink, ThumbsUp
} from "lucide-react";

// --- TABELAS DE CÁLCULO ---
const COEF_FINANCIAMENTO = [ 
  { m: 12, c: 0.09599 }, { m: 24, c: 0.05435 }, { m: 36, c: 0.04079 }, 
  { m: 48, c: 0.03425 }, { m: 60, c: 0.03050 } 
];
const COEF_CONSORCIO = [ 
  { m: 50, c: 0.018 }, { m: 72, c: 0.015 }, { m: 80, c: 0.013 } 
];

function AnaliseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);

  const dados = {
    nome: searchParams.get('nome') || "Cliente",
    cpf: searchParams.get('cpf') || "", 
    modelo: searchParams.get('modelo') || "Veículo",
    valor: parseFloat(searchParams.get('valor') || "0"),
    entrada: parseFloat(searchParams.get('entrada') || "0"),
    renda: parseFloat(searchParams.get('renda') || "0"), 
  };

  const [resultado, setResultado] = useState<any>(null);
  const [economia, setEconomia] = useState(0);

  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  useEffect(() => {
    const timer = setTimeout(() => {
        // 1. Financiamento
        const entradaMinima = dados.valor * 0.30;
        const valorFinanciar = dados.valor - dados.entrada;
        const planosFinanc = COEF_FINANCIAMENTO.map(p => ({
            prazo: p.m, parcela: valorFinanciar * p.c, total: (valorFinanciar * p.c) * p.m
        }));

        let statusFinanc = "APROVADO";
        if (dados.entrada < entradaMinima) statusFinanc = "REPROVADO_ENTRADA";
        else {
            const parcelaBase = planosFinanc[3].parcela; 
            if (dados.renda > 0 && parcelaBase > (dados.renda * 0.30)) statusFinanc = "ANALISE_MANUAL";
        }

        // 2. Consórcio
        const valorCarta = dados.valor - dados.entrada;
        const planosConsorcio = COEF_CONSORCIO.map(p => {
            const montante = valorCarta * (1 + (p.c * p.m));
            return { prazo: p.m, parcela: montante / p.m, total: montante };
        });

        // 3. Economia
        const totalFinanc = planosFinanc[3].total + dados.entrada;
        const totalConsorcio = planosConsorcio[0].total + dados.entrada;
        setEconomia(totalFinanc - totalConsorcio);

        setResultado({
            financiamento: { status: statusFinanc, entradaMinima, planos: planosFinanc, totalFinal: totalFinanc },
            consorcio: { valorCarta, planos: planosConsorcio, totalFinal: totalConsorcio }
        });
        setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // LINK EXTERNO (SANTANDER)
  const irParaSantander = () => {
    window.open("https://www.cliente.santanderfinanciamentos.com.br/originacaocliente/?mathts=nonpaid#/dados-pessoais", "_blank");
  };

  // LINK INTERNO (CONTRATO)
  const irParaContratoConsorcio = () => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('tipo', 'CONSORCIO');
      params.set('total_final', resultado.consorcio.totalFinal.toString());
      params.set('parcela_escolhida', resultado.consorcio.planos[0].parcela.toString());
      params.set('prazo_escolhido', '50');
      router.push(`/vendedor/contrato?${params.toString()}`);
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin h-10 w-10 text-[#f2e14c] mb-4"/>
        <p className="text-sm font-bold text-slate-500 uppercase">Simulando cenários...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
        <header className="px-6 py-6 bg-white border-b border-gray-200 sticky top-0 z-30 flex justify-between items-center">
            <button onClick={() => router.back()} className="text-xs font-bold text-slate-400 hover:text-black flex items-center gap-2 uppercase transition-colors">
                <ArrowLeft size={14}/> Voltar
            </button>
            <div className="text-right">
                <h1 className="font-black text-slate-900 text-sm uppercase">{dados.nome}</h1>
                <p className="text-xs text-slate-400 font-bold">{formatMoney(dados.valor)}</p>
            </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 py-8">
            <div className="text-center mb-10">
                <h2 className="text-3xl font-black text-slate-900 mb-2">Painel de Decisão</h2>
                <p className="text-slate-500 font-medium">Selecione a modalidade ideal para o cliente.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                
                {/* --- OPÇÃO 1: FINANCIAMENTO (Destaque Preto/Sóbrio) --- */}
                <div className={`bg-white rounded-2xl border border-slate-200 flex flex-col h-full relative transition-all duration-300 group overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-1 ${resultado.financiamento.status === 'REPROVADO_ENTRADA' ? 'opacity-75 grayscale' : ''}`}>
                    
                    {/* BARRA DE DESTAQUE PRETA */}
                    <div className="h-3 w-full bg-slate-800"></div>

                    <div className="p-8 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Financiamento</h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 flex items-center gap-1"><Landmark size={12}/> Taxas Santander</p>
                            </div>
                            
                            {resultado.financiamento.status === "APROVADO" && <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-black uppercase rounded-full flex items-center gap-1 border border-slate-200"><CheckCircle2 size={12}/> Disponível</span>}
                            {resultado.financiamento.status === "ANALISE_MANUAL" && <span className="px-3 py-1 bg-amber-50 text-amber-700 text-[10px] font-black uppercase rounded-full flex items-center gap-1 border border-amber-100"><AlertTriangle size={12}/> Em Análise</span>}
                            {resultado.financiamento.status === "REPROVADO_ENTRADA" && <span className="px-3 py-1 bg-red-50 text-red-700 text-[10px] font-black uppercase rounded-full flex items-center gap-1 border border-red-100"><XCircle size={12}/> Entrada Baixa</span>}
                        </div>

                        {resultado.financiamento.status === "REPROVADO_ENTRADA" ? (
                             <div className="bg-red-50 p-6 rounded-xl border border-red-100 mb-6 flex-1 flex flex-col justify-center items-center text-center">
                                <AlertCircle size={40} className="text-red-400 mb-3"/>
                                <p className="text-red-800 font-bold text-sm uppercase">Reprovado</p>
                                <p className="text-red-600 text-xs mt-2">Mínimo de 30% ({formatMoney(resultado.financiamento.entradaMinima)}) necessário.</p>
                            </div>
                        ) : (
                            <div className="flex-1 space-y-3 mb-8">
                                <div className="mb-4">
                                    <p className="text-xs font-bold text-slate-400 uppercase">Entrada</p>
                                    <p className="text-2xl font-black text-slate-900">{formatMoney(dados.entrada)}</p>
                                </div>
                                {resultado.financiamento.planos.slice(0,5).map((p: any) => (
                                    <div key={p.prazo} className="flex justify-between items-center text-sm border-b border-slate-50 pb-2 last:border-0 hover:bg-slate-50 p-2 rounded transition-colors">
                                        <span className="font-bold text-slate-500">{p.prazo}x</span>
                                        <span className="font-bold text-slate-900">{formatMoney(p.parcela)}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="mt-auto">
                            <button 
                                onClick={irParaSantander}
                                disabled={resultado.financiamento.status === 'REPROVADO_ENTRADA'}
                                className="w-full bg-slate-900 hover:bg-black text-white font-bold py-5 rounded-xl uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-slate-500/20"
                            >
                                {resultado.financiamento.status === 'ANALISE_MANUAL' ? 'Enviar para Análise' : 'Abrir Santander'}
                                <ExternalLink size={14}/>
                            </button>
                        </div>
                    </div>
                </div>

                {/* --- OPÇÃO 2: CONSÓRCIO (Destaque Amarelo/Vibrante) --- */}
                <div className="bg-white rounded-2xl border border-slate-200 flex flex-col h-full relative transition-all duration-300 group overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-[#f2e14c]/20 hover:-translate-y-2 ring-1 ring-transparent hover:ring-[#f2e14c]">
                    
                    {/* BARRA DE DESTAQUE AMARELA */}
                    <div className="h-3 w-full bg-[#f2e14c]"></div>
                    
                    <div className="absolute top-7 right-6 bg-[#f2e14c] text-black text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                        <ThumbsUp size={12}/> Melhor Escolha
                    </div>

                    <div className="p-8 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Consórcio</h3>
                                <p className="text-[10px] text-emerald-600 font-bold uppercase mt-1 flex items-center gap-1"><TrendingDown size={12}/> Economia Garantida</p>
                            </div>
                        </div>

                        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 mb-6 flex flex-col items-center text-center">
                             <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Economia Total</p>
                             <p className="text-3xl font-black text-emerald-600 tracking-tight">{formatMoney(economia)}</p>
                             <p className="text-[10px] text-emerald-700/60 font-medium mt-1">Comparado ao financiamento</p>
                        </div>

                        <div className="flex gap-4 mb-6">
                             <div className="flex-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Lance</p>
                                <p className="text-xl font-black text-slate-900">{formatMoney(dados.entrada)}</p>
                             </div>
                             <div className="flex-1 text-right">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Carta</p>
                                <p className="text-xl font-black text-slate-900">{formatMoney(resultado.consorcio.valorCarta)}</p>
                             </div>
                        </div>

                        <div className="flex-1 space-y-2 mb-8">
                            {resultado.consorcio.planos.map((p: any, idx: number) => (
                                <div key={p.prazo} className={`flex justify-between items-center p-3 rounded-xl transition-all ${idx === 0 ? 'bg-slate-900 text-white shadow-lg transform scale-[1.02]' : 'text-slate-600 hover:bg-slate-50'}`}>
                                    <div className="flex items-center gap-2">
                                        {idx === 0 && <div className="w-2 h-2 rounded-full bg-[#f2e14c]"/>}
                                        <span className={`font-bold text-sm ${idx === 0 ? 'text-white' : 'text-slate-500'}`}>{p.prazo}x</span>
                                    </div>
                                    <span className={`font-bold ${idx === 0 ? 'text-[#f2e14c]' : 'text-slate-900'}`}>{formatMoney(p.parcela)}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-auto">
                            <button 
                                onClick={irParaContratoConsorcio}
                                className="w-full bg-[#f2e14c] hover:bg-[#ebd52a] text-black font-black py-5 rounded-xl uppercase text-xs tracking-widest shadow-lg shadow-yellow-100 transition-all flex items-center justify-center gap-2 transform active:scale-[0.98]"
                            >
                                Selecionar Consórcio
                                <ChevronRight size={14}/>
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </main>
    </div>
  );
}

export default function AnalisePage() {
  return <Suspense fallback={<div>Carregando...</div>}><AnaliseContent /></Suspense>;
}