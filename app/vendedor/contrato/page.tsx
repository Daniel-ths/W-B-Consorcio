"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  CheckCircle2, ShieldCheck, Loader2, ArrowLeft, Printer, CarFront, User, CreditCard, Wallet, Landmark, FileCheck
} from "lucide-react";

// VALIDADOR OFICIAL
function validarCPF(cpf: string) {
    cpf = cpf.replace(/[^\d]+/g, '');
    if (cpf == '') return false;
    if (cpf.length != 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    let add = 0;
    for (let i = 0; i < 9; i ++) add += parseInt(cpf.charAt(i)) * (10 - i);
    let rev = 11 - (add % 11);
    if (rev == 10 || rev == 11) rev = 0;
    if (rev != parseInt(cpf.charAt(9))) return false;
    add = 0;
    for (let i = 0; i < 10; i ++) add += parseInt(cpf.charAt(i)) * (11 - i);
    rev = 11 - (add % 11);
    if (rev == 10 || rev == 11) rev = 0;
    if (rev != parseInt(cpf.charAt(10))) return false;
    return true;
}

function ContratoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const dados = {
    tipo: searchParams.get('tipo') || "CONSORCIO",
    nome: searchParams.get('nome') || "Cliente VIP",
    cpf: searchParams.get('cpf') || "", 
    modelo: searchParams.get('modelo') || "Veículo Selecionado",
    valor: parseFloat(searchParams.get('valor') || "0"),
    entrada: parseFloat(searchParams.get('entrada') || "0"),
    parcela: parseFloat(searchParams.get('parcela_escolhida') || "0"),
    prazo: searchParams.get('prazo_escolhido') || "0",
    total: parseFloat(searchParams.get('total_final') || "0"),
  };

  const [etapa, setEtapa] = useState(1);
  const [loadingValidacao, setLoadingValidacao] = useState(false);
  const [statusCPF, setStatusCPF] = useState<'PENDENTE' | 'VALIDO' | 'INVALIDO'>('PENDENTE');

  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const protocolo = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');

  const handleValidarReceita = async () => {
    setLoadingValidacao(true);
    await new Promise(r => setTimeout(r, 2000));
    const isValido = validarCPF(dados.cpf);
    setStatusCPF(isValido ? 'VALIDO' : 'INVALIDO');
    setLoadingValidacao(false);
  };

  const handleEmitirContrato = () => setEtapa(2);

  if (etapa === 2) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
            <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl animate-in zoom-in duration-500 relative overflow-hidden text-center border border-slate-100">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 via-yellow-400 to-emerald-600"></div>
                <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-4 ring-white">
                    <CheckCircle2 size={48} className="text-emerald-600"/>
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Sucesso!</h2>
                <p className="text-slate-500 mb-8 font-medium">Contrato gerado. Protocolo <span className="font-mono text-slate-900 bg-slate-100 px-2 py-1 rounded">#{protocolo}</span>.</p>
                <div className="bg-slate-50 rounded-2xl mb-8 text-left border border-slate-200 overflow-hidden relative">
                    <div className="p-6 border-b border-dashed border-slate-300 bg-white">
                        <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Veículo</p>
                        <p className="font-black text-slate-900 text-lg">{dados.modelo}</p>
                    </div>
                    <div className="p-6 bg-slate-50">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Cliente</p>
                                <p className="font-bold text-slate-700">{dados.nome}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Status</p>
                                <p className="text-xs font-bold text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">Aprovado</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => window.print()} className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg hover:shadow-xl"><Printer size={16}/> Imprimir</button>
                    <button onClick={() => router.push('/vendedor/dashboard')} className="w-full bg-white border border-slate-200 text-slate-600 font-bold py-4 rounded-xl uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"><ArrowLeft size={16}/> Voltar</button>
                </div>
            </div>
        </div>
      )
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc] pb-20 font-sans">
        <header className="px-6 py-6 bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-30">
            <div className="max-w-5xl mx-auto flex items-center justify-between">
                <button onClick={() => router.back()} className="group flex items-center gap-3 text-slate-500 hover:text-slate-900 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-white border border-slate-200 group-hover:border-slate-300 flex items-center justify-center transition-all shadow-sm"><ArrowLeft size={18}/></div>
                    <div className="text-left hidden md:block"><p className="text-[10px] font-bold uppercase text-slate-400">Voltar para</p><p className="text-xs font-bold uppercase text-slate-900">Análise de Crédito</p></div>
                </button>
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-full"><ShieldCheck size={16} className="text-emerald-500"/><span className="text-[10px] font-bold text-emerald-700 uppercase">Ambiente Seguro</span></div>
            </div>
        </header>

        <main className="max-w-5xl mx-auto px-6 py-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                <div className="lg:col-span-7 space-y-6 animate-in slide-in-from-left-4 duration-700">
                    <div><h1 className="text-3xl font-black text-slate-900 mb-2">Finalizar Proposta</h1><p className="text-slate-500 font-medium">Revise os detalhes antes da emissão oficial.</p></div>

                    {/* CARD VEICULO (BLACK CARD) */}
                    <div className="bg-[#1a1a1a] rounded-3xl p-8 text-white shadow-2xl shadow-slate-900/10 relative overflow-hidden group hover:shadow-slate-900/20 transition-all duration-500">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-white/10 transition-colors duration-700"></div>
                        <div className="relative z-10 flex justify-between items-start mb-14">
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full mb-3 backdrop-blur-sm"><CarFront size={12} className="text-[#f2e14c]"/><span className="text-[10px] font-bold text-white uppercase tracking-wider">Veículo Selecionado</span></div>
                                <h2 className="text-3xl font-black tracking-wide leading-none">{dados.modelo}</h2>
                            </div>
                        </div>
                        <div className="relative z-10 grid grid-cols-3 gap-6 border-t border-white/10 pt-8">
                            <div><p className="text-white/40 text-[10px] font-bold uppercase mb-1">Valor Total</p><p className="text-xl font-bold">{formatMoney(dados.valor)}</p></div>
                            <div><p className="text-white/40 text-[10px] font-bold uppercase mb-1">Entrada</p><p className="text-xl font-bold text-[#f2e14c]">{formatMoney(dados.entrada)}</p></div>
                            <div className="text-right"><p className="text-white/40 text-[10px] font-bold uppercase mb-1">Prazo</p><p className="text-xl font-bold">{dados.prazo}x</p></div>
                        </div>
                    </div>

                    {/* DETALHES MODALIDADE */}
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${dados.tipo === 'CONSORCIO' ? 'bg-[#f2e14c] text-black' : 'bg-slate-900 text-white'}`}>{dados.tipo === 'CONSORCIO' ? <Wallet size={24}/> : <Landmark size={24}/>}</div>
                                <div><p className="text-xs font-bold text-slate-400 uppercase mb-1">Modalidade</p><p className="font-black text-slate-900 text-lg tracking-tight">{dados.tipo}</p></div>
                            </div>
                            <div className="text-right"><p className="text-xs font-bold text-slate-400 uppercase mb-1">Mensalidade</p><p className="text-3xl font-black text-emerald-600">{formatMoney(dados.parcela)}</p></div>
                        </div>
                        <div className="p-6 bg-slate-50/80 space-y-3">
                            <div className="flex justify-between text-sm"><span className="text-slate-500 font-medium">Valor Financiado/Carta</span><span className="font-bold text-slate-900">{formatMoney(dados.valor - dados.entrada)}</span></div>
                            <div className="flex justify-between text-sm pt-4 border-t border-slate-200 mt-2"><span className="font-bold text-slate-900 uppercase">Custo Total da Operação</span><span className="font-black text-slate-900">{formatMoney(dados.total)}</span></div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-5 space-y-6 animate-in slide-in-from-right-4 duration-700 delay-100">
                    <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl relative">
                        {statusCPF === 'VALIDO' && (<div className="absolute -top-3 -right-3 bg-emerald-500 text-white p-2 rounded-full shadow-lg animate-in zoom-in"><ShieldCheck size={24}/></div>)}
                        <h3 className="text-xs font-black text-slate-400 uppercase mb-8 flex items-center gap-2 tracking-widest"><User size={14}/> Validação Cadastral</h3>
                        <div className="space-y-6">
                            <div className="relative group"><label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Nome do Cliente</label><div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold text-slate-700">{dados.nome}</div></div>
                            <div className="relative group">
                                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">CPF (Pessoa Física)</label>
                                <div className={`w-full bg-slate-50 border-2 rounded-xl p-4 font-mono font-bold text-lg flex justify-between items-center transition-all ${statusCPF === 'INVALIDO' ? 'border-red-200 bg-red-50 text-red-600' : statusCPF === 'VALIDO' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-900'}`}>{dados.cpf}{statusCPF === 'VALIDO' && <CheckCircle2 size={20} className="text-emerald-500"/>}</div>
                                <div className="h-6 mt-1">{statusCPF === 'INVALIDO' && <p className="text-[10px] text-red-500 font-bold">CPF inválido.</p>}{statusCPF === 'VALIDO' && <p className="text-[10px] text-emerald-600 font-bold">CPF Regular.</p>}</div>
                            </div>
                        </div>
                        <div className="mt-4 pt-6 border-t border-slate-100">
                            {statusCPF !== 'VALIDO' ? (
                                <button onClick={handleValidarReceita} disabled={loadingValidacao} className="w-full bg-[#f2e14c] hover:bg-[#ebd52a] text-black font-black py-5 rounded-2xl uppercase text-xs tracking-widest shadow-lg shadow-yellow-100 transition-all flex items-center justify-center gap-3 transform active:scale-[0.98]">
                                    {loadingValidacao ? <Loader2 className="animate-spin" size={18}/> : <ShieldCheck size={18}/>} {loadingValidacao ? "Consultando Base..." : "Validar CPF na Receita"}
                                </button>
                            ) : (
                                <button onClick={handleEmitirContrato} className="w-full bg-slate-900 hover:bg-black text-white font-black py-5 rounded-2xl uppercase text-xs tracking-widest shadow-xl shadow-slate-900/20 transition-all flex items-center justify-center gap-3 transform active:scale-[0.98] animate-in zoom-in">
                                    <FileCheck size={18}/> Emitir Contrato Agora
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>
  );
}

export default function ContratoPage() {
  return <Suspense fallback={<div>Carregando...</div>}><ContratoContent /></Suspense>;
}