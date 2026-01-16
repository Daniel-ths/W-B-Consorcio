"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, AlertTriangle, Loader2, TrendingDown, Landmark, ChevronRight, AlertCircle, CarFront, ExternalLink
} from "lucide-react";

// --- TABELAS DE CÁLCULO (COEFICIENTES) ---
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

  // 1. CAPTURA DOS DADOS
  const dados = {
    nome: searchParams.get('nome') || "Cliente",
    cpf: searchParams.get('cpf') || "", 
    modelo: searchParams.get('modelo') || "Veículo",
    valor: parseFloat(searchParams.get('valor') || "0"),
    entrada: parseFloat(searchParams.get('entrada') || "0"),
    renda: parseFloat(searchParams.get('renda') || "0"),
    imagem: searchParams.get('imagem') || "", 
  };

  const [resultado, setResultado] = useState<any>(null);
  const [economia, setEconomia] = useState(0);

  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  useEffect(() => {
    const timer = setTimeout(() => {
        // CÁLCULOS
        const entradaMinima = dados.valor * 0.30;
        const valorEntrada = dados.entrada > 0 ? dados.entrada : 0; 
        const valorFinanciar = dados.valor - valorEntrada;
        
        const planosFinanc = COEF_FINANCIAMENTO.map(p => ({
            prazo: p.m, 
            parcela: valorFinanciar * p.c, 
            total: (valorFinanciar * p.c) * p.m
        }));

        let statusFinanc = "APROVADO";
        if (valorEntrada < entradaMinima) statusFinanc = "ALERTA_ENTRADA";

        const valorCarta = dados.valor - valorEntrada;
        const planosConsorcio = COEF_CONSORCIO.map(p => {
            const montante = valorCarta * (1 + (p.c * p.m));
            return { prazo: p.m, parcela: montante / p.m, total: montante };
        });

        const totalFinanc = planosFinanc[3].total + valorEntrada; 
        const totalConsorcio = planosConsorcio[0].total + valorEntrada;
        setEconomia(totalFinanc - totalConsorcio);

        setResultado({
            financiamento: { status: statusFinanc, entradaMinima, planos: planosFinanc, totalFinal: totalFinanc },
            consorcio: { valorCarta, planos: planosConsorcio, totalFinal: totalConsorcio }
        });
        setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [dados.valor, dados.entrada]);

  // --- AÇÃO 1: SANTANDER (Link Externo) ---
  const irParaSantander = () => {
    window.open("https://www.cliente.santanderfinanciamentos.com.br/originacaocliente/?mathts=nonpaid#/dados-pessoais", "_blank");
  };

  // --- AÇÃO 2: CONSÓRCIO (Contrato Interno) ---
  const irParaContratoConsorcio = () => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('tipo', 'CONSORCIO');
      if (resultado) {
        params.set('total_final', resultado.consorcio.totalFinal.toString());
        params.set('parcela_escolhida', resultado.consorcio.planos[0].parcela.toString());
        params.set('prazo_escolhido', '50');
      }
      router.push(`/vendedor/contrato?${params.toString()}`);
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin h-10 w-10 text-[#f2e14c] mb-4"/>
        <p className="text-sm font-bold text-slate-500 uppercase">Calculando Opções...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
        <header className="px-6 py-4 bg-white border-b border-gray-200 sticky top-0 z-30 flex justify-between items-center shadow-sm">
            <button onClick={() => router.back()} className="text-xs font-bold text-slate-400 hover:text-black flex items-center gap-2 uppercase transition-colors">
                <ArrowLeft size={14}/> Voltar
            </button>
            <div className="flex items-center gap-3 text-right">
                <div>
                    <h1 className="font-black text-slate-900 text-sm uppercase">{dados.nome}</h1>
                    <p className="text-xs text-slate-400 font-bold">{dados.modelo}</p>
                </div>
                {dados.imagem ? (
                    <img src={dados.imagem} alt="Carro" className="w-12 h-12 rounded-lg object-cover border border-slate-200" />
                ) : (
                    <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-300"><CarFront size={20}/></div>
                )}
            </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 py-8">
            <div className="text-center mb-10">
                <h2 className="text-3xl font-black text-slate-900 mb-2">Opções Disponíveis</h2>
                <p className="text-slate-500 font-medium">Selecione a modalidade ideal para o cliente.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                
                {/* --- OPÇÃO 1: FINANCIAMENTO (AGORA AMARELO) --- */}
                <div className="bg-white rounded-2xl border border-slate-200 flex flex-col h-full shadow-lg hover:shadow-xl transition-all relative overflow-hidden group hover:-translate-y-1 ring-1 ring-transparent hover:ring-[#f2e14c]">
                    <div className="h-2 w-full bg-[#f2e14c]"></div>
                    
                    <div className="p-8 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Financiamento</h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 flex items-center gap-1"><Landmark size={12}/> Banco Santander</p>
                            </div>
                        </div>

                        {/* Alerta de Entrada (Aparece se necessário) */}
                        {resultado.financiamento.status === "ALERTA_ENTRADA" && (
                             <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 mb-6 text-center">
                                <p className="text-amber-800 font-bold text-xs uppercase">Atenção</p>
                                <p className="text-amber-600 text-[10px] mt-1">Sugerido entrada de {formatMoney(resultado.financiamento.entradaMinima)} (30%).</p>
                            </div>
                        )}

                        <div className="flex-1 space-y-3 mb-8">
                            <div className="mb-4">
                                <p className="text-xs font-bold text-slate-400 uppercase">Simulação Base</p>
                                <p className="text-2xl font-black text-slate-900">{formatMoney(dados.valor)}</p>
                            </div>
                            {resultado.financiamento.planos.map((p: any) => (
                                <div key={p.prazo} className="flex justify-between items-center text-sm border-b border-slate-50 pb-2 last:border-0 hover:bg-slate-50 p-2 rounded transition-colors">
                                    <span className="font-bold text-slate-500">{p.prazo}x</span>
                                    <span className="font-bold text-slate-900">{formatMoney(p.parcela)}</span>
                                </div>
                            ))}
                        </div>

                        <button 
                            onClick={irParaSantander}
                            className="w-full bg-[#f2e14c] hover:bg-[#d4c435] text-black font-black py-4 rounded-xl uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                        >
                            Ir para Santander <ExternalLink size={14}/>
                        </button>
                    </div>
                </div>

                {/* --- OPÇÃO 2: CONSÓRCIO (IGUALMENTE ATRATIVO) --- */}
                <div className="bg-white rounded-2xl border border-slate-200 flex flex-col h-full shadow-lg hover:shadow-xl transition-all relative overflow-hidden group hover:-translate-y-1 ring-1 ring-transparent hover:ring-[#f2e14c]">
                    <div className="h-2 w-full bg-[#f2e14c]"></div>
                    
                    <div className="p-8 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Consórcio</h3>
                                <p className="text-[10px] text-emerald-600 font-bold uppercase mt-1 flex items-center gap-1"><TrendingDown size={12}/> Economia Garantida</p>
                            </div>
                        </div>

                        {/* Bloco de Economia */}
                        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 mb-6 flex flex-col items-center text-center">
                             <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Economia Total Estimada</p>
                             <p className="text-3xl font-black text-emerald-600 tracking-tight">{formatMoney(economia)}</p>
                             <p className="text-[10px] text-emerald-700/60 font-medium mt-1">Comparado ao financiamento</p>
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

                        <button 
                            onClick={irParaContratoConsorcio}
                            className="w-full bg-[#f2e14c] hover:bg-[#d4c435] text-black font-black py-4 rounded-xl uppercase text-xs tracking-widest shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                        >
                            Fechar Consórcio <ChevronRight size={14}/>
                        </button>
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