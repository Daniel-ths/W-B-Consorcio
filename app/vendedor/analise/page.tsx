"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, Loader2, Landmark, ChevronRight, CarFront, ExternalLink, ShieldCheck, DollarSign
} from "lucide-react";

// --- TABELAS ---
const COEF_CONSORCIO = [ 
  { m: 12, c: 0.09599 }, 
  { m: 24, c: 0.05435 }, 
  { m: 36, c: 0.04079 }, 
  { m: 48, c: 0.03425 }, 
  { m: 60, c: 0.03050 } 
];

const TAXA_FINANCIAMENTO_MERCADO = 0.022; // 2.2% a.m

function AnaliseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);

  // DADOS
  const dadosIniciais = {
    nome: searchParams.get('nome') || "Cliente",
    modelo: searchParams.get('modelo') || "Veículo Selecionado",
    valor: parseFloat(searchParams.get('valor') || "0"),
    // CORREÇÃO 1: Se o parseFloat retornar NaN, usa 0
    entradaUrl: parseFloat(searchParams.get('entrada') || "0") || 0,
    imagem: searchParams.get('imagem') || "", 
  };

  const [entradaManual, setEntradaManual] = useState(dadosIniciais.entradaUrl);
  const [resultado, setResultado] = useState<any>(null);
  const [economia, setEconomia] = useState(0);
  const [planoSelecionado, setPlanoSelecionado] = useState<any>(null);

  const formatMoney = (val: number) => {
    if (isNaN(val)) return "R$ 0,00";
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  }

  useEffect(() => {
    const realizarCalculo = () => {
        const valorCarro = dadosIniciais.valor || 0;
        let valorEntrada = entradaManual;
        
        // Proteção contra NaN nos cálculos
        if (isNaN(valorEntrada) || valorEntrada < 0) valorEntrada = 0;
        if (valorEntrada >= valorCarro && valorCarro > 0) valorEntrada = valorCarro - 1000;

        const valorFinanciar = Math.max(0, valorCarro - valorEntrada);
        
        // A. CONSÓRCIO
        const planosConsorcio = COEF_CONSORCIO.map(p => ({
            prazo: p.m, 
            parcela: valorFinanciar * p.c, 
            total: (valorFinanciar * p.c) * p.m
        }));

        // B. FINANCIAMENTO
        const prazosFinanc = [12, 24, 36, 48, 60];
        const planosFinanc = prazosFinanc.map(prazo => {
            const i = TAXA_FINANCIAMENTO_MERCADO;
            // Evita divisão por zero
            const divisor = (1 - Math.pow(1 + i, -prazo));
            const parcela = divisor !== 0 ? (valorFinanciar * i) / divisor : 0;
            return {
                prazo: prazo,
                parcela: parcela,
                total: parcela * prazo
            };
        });

        // Comparação
        const totalConsorcio48 = planosConsorcio.find(p => p.prazo === 48)?.total || 0;
        const totalFinanc48 = planosFinanc.find(p => p.prazo === 48)?.total || 0;
        setEconomia(Math.max(0, totalFinanc48 - totalConsorcio48));

        setResultado({
            consorcio: { planos: planosConsorcio },
            financiamento: { planos: planosFinanc }
        });
        setLoading(false);
        setPlanoSelecionado(null);
    };

    if (loading) {
        const timer = setTimeout(realizarCalculo, 600);
        return () => clearTimeout(timer);
    } else {
        realizarCalculo();
    }
  }, [entradaManual, dadosIniciais.valor]); 

  const irParaSantander = () => {
    window.open("https://www.cliente.santanderfinanciamentos.com.br/originacaocliente/?mathts=nonpaid#/dados-pessoais", "_blank");
  };

  const avancarParaContrato = () => {
      if (!planoSelecionado) return;

      const params = new URLSearchParams(searchParams.toString());
      params.set('tipo', 'CONSORCIO');
      params.set('entrada', (entradaManual || 0).toString());
      
      const totalReal = (planoSelecionado.parcela * planoSelecionado.prazo) + (entradaManual || 0);
      params.set('total_final', totalReal.toString());
      params.set('parcela_escolhida', planoSelecionado.parcela.toString());
      params.set('prazo_escolhido', planoSelecionado.prazo.toString());
      
      router.push(`/vendedor/contrato?${params.toString()}`);
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
        <Loader2 className="animate-spin h-10 w-10 text-black mb-4"/>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
        
        {/* HEADER */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
            <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
                <button onClick={() => router.back()} className="text-xs font-bold text-slate-500 hover:text-black flex items-center gap-2 uppercase transition-all">
                    <ArrowLeft size={16}/> Voltar
                </button>
                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <h1 className="font-black text-black text-sm uppercase">{dadosIniciais.nome}</h1>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{dadosIniciais.modelo}</p>
                    </div>
                    {dadosIniciais.imagem && (
                        <img src={dadosIniciais.imagem} className="w-10 h-10 rounded-full object-cover border border-slate-200"/> 
                    )}
                </div>
            </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 py-8">
            
            {/* CONTROLE DE ENTRADA (CLEAN) */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h2 className="text-xl font-black uppercase tracking-tight text-black flex items-center gap-2">
                        <DollarSign size={20} className="text-[#f2e14c]"/> Simulação de Crédito
                    </h2>
                    <p className="text-slate-500 text-xs font-medium mt-1">Defina a entrada para recalcular as opções.</p>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <div className="pl-4">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Valor da Entrada</span>
                        <div className="flex items-center gap-1">
                            <span className="text-sm font-bold text-slate-400">R$</span>
                            
                            {/* CORREÇÃO 2: Input Protegido contra NaN */}
                            <input 
                                type="number" 
                                value={isNaN(entradaManual) ? "" : entradaManual}
                                onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    setEntradaManual(isNaN(val) ? 0 : val);
                                }}
                                className="bg-transparent border-none text-black text-xl font-black w-32 focus:ring-0 p-0"
                            />

                        </div>
                    </div>
                    <button 
                        onClick={() => setEntradaManual((dadosIniciais.valor || 0) * 0.3)} 
                        className="bg-black hover:bg-slate-800 text-white text-[10px] font-bold uppercase px-4 py-3 rounded-md transition-all active:scale-95"
                    >
                        Sugerir 30%
                    </button>
                </div>
            </div>

            {/* --- GRID DE 2 COLUNAS IGUAIS (BRANCO & PRETO) --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                
                {/* --- CARD A: FINANCIAMENTO --- */}
                <div className="bg-white flex flex-col rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full">
                     <div className="p-6 border-b border-slate-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
                                <Landmark size={20}/>
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-black uppercase">Financiamento</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Simulação Bancária (CDC)</p>
                            </div>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-lg text-center">
                            <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Saldo a Financiar</p>
                            <p className="text-2xl font-black text-black">{formatMoney((dadosIniciais.valor || 0) - (entradaManual || 0))}</p>
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
                                Simular no Santander <ExternalLink size={14}/>
                            </button>
                        </div>
                     </div>
                </div>

                {/* --- CARD B: CONSÓRCIO (SELECIONÁVEL) --- */}
                <div className="bg-white flex flex-col rounded-xl shadow-lg border border-slate-200 overflow-hidden h-full relative ring-1 ring-black/5">
                     
                     <div className="p-6 border-b border-slate-100 bg-white">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-[#f2e14c] text-black flex items-center justify-center">
                                <ShieldCheck size={20}/>
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-black uppercase">Consórcio W B C</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tabela Exclusiva</p>
                            </div>
                        </div>
                        
                        <div className="bg-black text-[#f2e14c] p-4 rounded-lg flex justify-between items-center shadow-md">
                            <div>
                                <p className="text-[10px] uppercase font-bold mb-0 opacity-80">Economia Garantida</p>
                                <p className="text-[9px] font-medium opacity-60">vs Financiamento</p>
                            </div>
                            <p className="text-2xl font-black">{formatMoney(economia)}</p>
                        </div>
                     </div>

                     <div className="p-6 flex-1 flex flex-col">
                        <div className="space-y-2 flex-1">
                            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase mb-2 px-4">
                                <span>Prazo</span>
                                <span>Parcela Fixa</span>
                            </div>

                            {resultado?.consorcio?.planos?.map((p: any) => {
                                const isSelected = planoSelecionado?.prazo === p.prazo;
                                return (
                                    <div 
                                        key={p.prazo} 
                                        onClick={() => setPlanoSelecionado(p)}
                                        className={`
                                            flex justify-between items-center py-3 px-4 rounded-lg cursor-pointer transition-all border
                                            ${isSelected 
                                                ? 'bg-[#f2e14c] border-[#f2e14c] text-black shadow-md scale-[1.02]' 
                                                : 'bg-white border-transparent hover:bg-slate-50 text-slate-600'}
                                        `}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-black' : 'border-slate-300'}`}>
                                                {isSelected && <div className="w-2 h-2 rounded-full bg-black"/>}
                                            </div>
                                            <span className={`font-black text-sm ${isSelected ? 'text-black' : 'text-slate-500'}`}>{p.prazo}x</span>
                                        </div>
                                        <span className={`font-black text-lg ${isSelected ? 'text-black' : 'text-slate-900'}`}>{formatMoney(p.parcela)}</span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-8 pt-4 border-t border-slate-100">
                             <button 
                                onClick={avancarParaContrato}
                                disabled={!planoSelecionado}
                                className={`
                                    w-full font-black py-4 rounded-lg uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-2
                                    ${planoSelecionado 
                                        ? 'bg-black text-white hover:bg-slate-800 shadow-lg cursor-pointer' 
                                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'}
                                `}
                            >
                                {planoSelecionado 
                                    ? `Gerar Contrato (${planoSelecionado.prazo}x)` 
                                    : 'Selecione um prazo acima'} 
                                {planoSelecionado && <ChevronRight size={14}/>}
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