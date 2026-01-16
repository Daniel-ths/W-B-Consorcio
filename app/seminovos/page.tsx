"use client";

import { useState, Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  CheckCircle2, ShieldCheck, Loader2, ArrowLeft, Printer, CarFront, User, DollarSign
} from "lucide-react";

function ContratoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // --- DADOS RECEBIDOS ---
  const dados = {
    tipo: searchParams.get('tipo') || "CONSORCIO",
    nome: searchParams.get('nome') || "Cliente",
    cpf: searchParams.get('cpf') || "", 
    modelo: searchParams.get('modelo') || "Veículo Selecionado",
    valor: parseFloat(searchParams.get('valor') || "0"),
    entrada: parseFloat(searchParams.get('entrada') || "0"),
    parcela: parseFloat(searchParams.get('parcela_escolhida') || "0"),
    prazo: searchParams.get('prazo_escolhido') || "0",
    total: parseFloat(searchParams.get('total_final') || "0"),
    imagem: searchParams.get('imagem') || "", 
  };

  const [loadingValidacao, setLoadingValidacao] = useState(false);
  const [statusCPF, setStatusCPF] = useState<'PENDENTE' | 'VALIDO' | 'INVALIDO'>('PENDENTE');
  const [nomeReceita, setNomeReceita] = useState("");
  const [dataAtual, setDataAtual] = useState("");

  useEffect(() => {
    setDataAtual(new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }));
  }, []);

  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const protocolo = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');

  // --- VALIDAÇÃO API ---
  const handleValidarReceita = async () => {
    setLoadingValidacao(true);
    try {
      const response = await fetch('/api/consultar-cpf', {
        method: 'POST',
        body: JSON.stringify({ cpf: dados.cpf }),
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();

      if (data && data.situacaoCadastral === 'REGULAR') {
        setStatusCPF('VALIDO');
        setNomeReceita(data.nome); 
      } else {
        setStatusCPF('INVALIDO');
        alert("CPF irregular na Receita Federal ou erro de conexão.");
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao validar CPF. Verifique a conexão.");
    } finally {
      setLoadingValidacao(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] font-sans text-slate-900 pb-20 print:bg-white print:pb-0">
        
        {/* --- HEADER (Escondido na Impressão) --- */}
        <header className="px-6 py-4 bg-white border-b border-gray-200 sticky top-0 z-50 print:hidden shadow-sm">
            <div className="max-w-6xl mx-auto flex items-center justify-between">
                <button onClick={() => router.back()} className="group flex items-center gap-3 text-slate-500 hover:text-black transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-200"><ArrowLeft size={16}/></div>
                    <span className="text-sm font-bold uppercase tracking-wide">Voltar</span>
                </button>
                <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${statusCPF === 'VALIDO' ? 'bg-emerald-500' : 'bg-yellow-400 animate-pulse'}`}></span>
                    <span className="text-xs font-bold uppercase text-slate-500">
                        {statusCPF === 'VALIDO' ? 'Pronto para Impressão' : 'Aguardando Validação'}
                    </span>
                </div>
            </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-8 md:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* --- COLUNA ESQUERDA: O DOCUMENTO (Visual de Papel) --- */}
                <div className="lg:col-span-8">
                    
                    {/* FOLHA A4 DIGITAL */}
                    <div id="contrato-print" className="bg-white rounded-xl shadow-xl p-10 md:p-12 min-h-[800px] relative overflow-hidden border border-gray-100 print:shadow-none print:border-none print:p-0 print:w-full">
                        
                        {/* Marca D'água */}
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03] select-none">
                            <CarFront size={400} />
                        </div>

                        {/* Cabeçalho do Documento */}
                        <div className="border-b-2 border-black pb-6 mb-8 flex justify-between items-end">
                            <div>
                                <h1 className="text-2xl font-black uppercase tracking-tighter mb-1">Pré-Contrato de Intenção</h1>
                                <p className="text-xs font-bold text-gray-500 uppercase">Documento Auxiliar de Venda • {dados.tipo}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-mono text-gray-400 uppercase mb-1">Protocolo</p>
                                <p className="text-xl font-mono font-bold text-black bg-gray-100 px-2 rounded">#{protocolo}</p>
                            </div>
                        </div>

                        {/* Seção 1: Contratante */}
                        <div className="mb-8">
                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 border-b border-gray-100 pb-1 flex items-center gap-2">
                                <User size={12}/> Dados do Contratante
                            </h3>
                            <div className="grid grid-cols-2 gap-y-4 text-sm">
                                <div>
                                    <span className="block text-[10px] font-bold text-gray-400 uppercase">Nome Completo</span>
                                    <span className="font-bold text-gray-900 uppercase">{nomeReceita || dados.nome}</span>
                                </div>
                                <div>
                                    <span className="block text-[10px] font-bold text-gray-400 uppercase">CPF</span>
                                    <span className="font-mono text-gray-900">{dados.cpf}</span>
                                </div>
                                <div>
                                    <span className="block text-[10px] font-bold text-gray-400 uppercase">Situação Cadastral</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${statusCPF === 'VALIDO' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                        {statusCPF === 'VALIDO' ? 'REGULAR NA RECEITA FEDERAL' : 'AGUARDANDO VALIDAÇÃO'}
                                    </span>
                                </div>
                                <div>
                                    <span className="block text-[10px] font-bold text-gray-400 uppercase">Data de Emissão</span>
                                    <span className="text-gray-900">{dataAtual}</span>
                                </div>
                            </div>
                        </div>

                        {/* Seção 2: O Veículo */}
                        <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-100 print:bg-white print:border-black">
                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                                <CarFront size={12}/> Objeto do Contrato
                            </h3>
                            <div className="flex gap-6 items-center">
                                {dados.imagem && (
                                    <div className="w-24 h-16 bg-white border border-gray-200 rounded flex items-center justify-center overflow-hidden print:hidden">
                                        <img src={dados.imagem} className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <div>
                                    <p className="text-lg font-black text-gray-900 uppercase">{dados.modelo}</p>
                                    <p className="text-sm text-gray-500">Ano/Modelo 2025/2026 • 0KM</p>
                                </div>
                            </div>
                        </div>

                        {/* Seção 3: Valores Financeiros */}
                        <div className="mb-12">
                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 border-b border-gray-100 pb-1 flex items-center gap-2">
                                <DollarSign size={12}/> Condições Comerciais
                            </h3>
                            <div className="grid grid-cols-3 gap-6">
                                <div className="p-3 border border-gray-200 rounded print:border-black">
                                    <span className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Valor do Bem</span>
                                    <span className="block text-lg font-bold text-gray-900">{formatMoney(dados.valor)}</span>
                                </div>
                                <div className="p-3 border border-gray-200 rounded print:border-black bg-gray-50 print:bg-white">
                                    <span className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Entrada / Lance</span>
                                    <span className="block text-lg font-bold text-gray-900">{formatMoney(dados.entrada)}</span>
                                </div>
                                <div className="p-3 border border-black bg-black text-white rounded print:bg-white print:text-black shadow-lg print:shadow-none">
                                    <span className="block text-[10px] font-bold text-white/60 print:text-black uppercase mb-1">Condição Escolhida</span>
                                    <span className="block text-lg font-bold">{dados.prazo}x de {formatMoney(dados.parcela)}</span>
                                </div>
                            </div>
                            <div className="mt-4 text-right">
                                <p className="text-xs font-bold text-gray-400 uppercase">Valor Total da Operação: <span className="text-gray-900">{formatMoney(dados.total)}</span></p>
                            </div>
                        </div>

                        {/* Área de Assinaturas */}
                        <div className="mt-20 grid grid-cols-2 gap-12 print:mt-32">
                            <div className="border-t border-black pt-2 text-center">
                                <p className="text-xs font-bold uppercase text-gray-900">{nomeReceita || "Assinatura do Cliente"}</p>
                                <p className="text-[10px] text-gray-400">Contratante</p>
                            </div>
                            <div className="border-t border-black pt-2 text-center">
                                <p className="text-xs font-bold uppercase text-gray-900">W B C Consórcio LTDA</p>
                                <p className="text-[10px] text-gray-400">Contratada</p>
                            </div>
                        </div>

                        <div className="mt-12 pt-6 border-t border-gray-100 text-center print:hidden">
                            <p className="text-[10px] text-gray-400">Este documento é uma simulação de intenção de compra e depende de aprovação final de crédito.</p>
                        </div>
                    </div>
                </div>

                {/* --- COLUNA DIREITA: AÇÕES (Escondido na Impressão) --- */}
                <div className="lg:col-span-4 space-y-6 print:hidden">
                    
                    {/* CARD AÇÕES */}
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 sticky top-24">
                        <div className="mb-6">
                            <h3 className="text-lg font-black text-slate-900">Ações Disponíveis</h3>
                            <p className="text-xs text-slate-500">Valide os dados para liberar a impressão.</p>
                        </div>

                        {/* Se ainda não validou */}
                        {statusCPF !== 'VALIDO' ? (
                            <div className="space-y-4">
                                <div className="bg-blue-50 p-4 rounded-lg text-xs text-blue-700 font-medium border border-blue-100">
                                    <p className="font-bold mb-1">Passo 1: Validação</p>
                                    É obrigatório validar o CPF na base da Receita Federal antes de imprimir o contrato.
                                </div>
                                <button 
                                    onClick={handleValidarReceita} 
                                    disabled={loadingValidacao} 
                                    className="w-full bg-[#f2e14c] hover:bg-[#ebd52a] text-black font-black py-4 rounded-xl uppercase text-xs tracking-widest shadow-md transition-all flex items-center justify-center gap-2"
                                >
                                    {loadingValidacao ? <Loader2 className="animate-spin" size={16}/> : <ShieldCheck size={16}/>}
                                    {loadingValidacao ? "Consultando..." : "Validar CPF na Receita"}
                                </button>
                            </div>
                        ) : (
                            // SE VALIDADO -> MOSTRA BOTÃO DE IMPRIMIR DIRETO
                            <div className="space-y-3 animate-in zoom-in">
                                <div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg text-xs font-bold text-center border border-emerald-100 mb-4 flex items-center justify-center gap-2">
                                    <CheckCircle2 size={16}/> Dados validados com sucesso.
                                </div>
                                
                                <button 
                                    onClick={() => window.print()}
                                    className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-xl uppercase text-xs tracking-widest shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                                >
                                    <Printer size={16}/> Imprimir Contrato
                                </button>
                                
                                <button 
                                    onClick={() => router.push('/vendedor/dashboard')}
                                    className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 font-bold py-4 rounded-xl uppercase text-xs tracking-widest transition-all"
                                >
                                    Novo Atendimento
                                </button>
                            </div>
                        )}

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