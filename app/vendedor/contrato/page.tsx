"use client";

import { useState, Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase"; 
import { 
  CheckCircle2, Loader2, ArrowLeft, Printer, CarFront, User, DollarSign, Briefcase, Send
} from "lucide-react";

function PedidoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // --- DADOS DO PEDIDO (Vindos da URL) ---
  const dados = {
    tipo: searchParams.get('tipo') || "CONSORCIO",
    cpf: searchParams.get('cpf') || "", 
    modelo: searchParams.get('modelo') || "Veículo Selecionado",
    valor: parseFloat(searchParams.get('valor') || "0"),
    entrada: parseFloat(searchParams.get('entrada') || "0"),
    parcela: parseFloat(searchParams.get('parcela_escolhida') || "0"),
    prazo: searchParams.get('prazo_escolhido') || "0",
    total: parseFloat(searchParams.get('total_final') || "0"),
    imagem: searchParams.get('imagem') || "", 
  };

  const [loadingValidacao, setLoadingValidacao] = useState(true);
  const [loadingSalvar, setLoadingSalvar] = useState(false); 
  const [pedidoSalvo, setPedidoSalvo] = useState(false); 
  
  // DADOS DA API E MANUAIS
  const [apiData, setApiData] = useState<any>(null);
  const [erroApi, setErroApi] = useState(false);
  const [nomeManual, setNomeManual] = useState(""); // <--- NOVO: Nome editável
  const [dataAtual, setDataAtual] = useState("");

  useEffect(() => {
    setDataAtual(new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }));
    
    if (dados.cpf) {
        validarReceita();
    } else {
        setLoadingValidacao(false);
    }
  }, []);

  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const numeroPedido = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');

  // --- 1. CONSULTA API RECEITA ---
  const validarReceita = async () => {
    try {
      const response = await fetch('/api/consultar-cpf', {
        method: 'POST',
        body: JSON.stringify({ cpf: dados.cpf }),
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();

      if (data && !data.error) {
        setApiData(data); 
        setNomeManual(data.nome); // <--- NOVO: Preenche o nome se a API achar
      } else {
        setErroApi(true); // API falhou, mas não vamos travar a venda
      }
    } catch (error) {
      console.error(error);
      setErroApi(true);
    } finally {
      setLoadingValidacao(false);
    }
  };

  // --- 2. ENVIAR PARA O ADMIN (SUPABASE) ---
  const handleFinalizarSolicitacao = async () => {
    // Validação simples: Precisa ter pelo menos um nome digitado
    if (!nomeManual || nomeManual.trim().length < 3) {
        alert("Por favor, preencha o Nome do Cliente antes de finalizar.");
        return;
    }

    setLoadingSalvar(true);

    try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            alert("Erro: Você precisa estar logado para finalizar uma venda.");
            return;
        }

        // Prepara o objeto para salvar no banco
        const payload = {
            seller_id: user.id,
            car_name: dados.modelo,
            // USA O NOME QUE ESTIVER NO CAMPO (Seja da API ou Digitado)
            client_name: nomeManual.toUpperCase(), 
            client_cpf: dados.cpf,
            status: "Aguardando Aprovação",
            total_price: dados.valor,
            interest_type: dados.tipo,
            client_phone: "Não informado",
            created_at: new Date().toISOString()
        };

        const { error } = await supabase.from('sales').insert([payload]);

        if (error) throw error;

        setPedidoSalvo(true);
        alert("Solicitação enviada com sucesso para o Painel Administrativo!");

    } catch (error: any) {
        console.error("Erro ao salvar:", error);
        alert("Erro ao enviar solicitação: " + error.message);
    } finally {
        setLoadingSalvar(false);
    }
  };

  if (loadingValidacao) {
      return (
          <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
              <Loader2 className="animate-spin text-[#f2e14c] w-12 h-12 mb-4"/>
              <p className="text-slate-500 font-bold uppercase text-sm animate-pulse">Preparando Documento...</p>
          </div>
      )
  }

  return (
    <div className="min-h-screen bg-[#f3f4f6] font-sans text-slate-900 pb-20 print:bg-white print:pb-0">
        
        {/* HEADER (Tela) */}
        <header className="px-6 py-4 bg-white border-b border-gray-200 sticky top-0 z-50 print:hidden shadow-sm">
            <div className="max-w-5xl mx-auto flex items-center justify-between">
                <button onClick={() => router.back()} className="group flex items-center gap-3 text-slate-500 hover:text-black transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-200"><ArrowLeft size={16}/></div>
                    <span className="text-sm font-bold uppercase tracking-wide">Voltar</span>
                </button>
                <div className="flex items-center gap-2">
                    <button onClick={() => window.print()} className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-50 flex items-center gap-2 transition-all">
                        <Printer size={14}/> Imprimir
                    </button>
                    
                    {!pedidoSalvo ? (
                        <button 
                            onClick={handleFinalizarSolicitacao} 
                            disabled={loadingSalvar} 
                            // ^^^ AQUI MUDOU: Removemos "|| erroApi". O botão SEMPRE funciona agora.
                            className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-black flex items-center gap-2 shadow-md transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loadingSalvar ? <Loader2 className="animate-spin" size={14}/> : <Send size={14}/>}
                            {loadingSalvar ? "Enviando..." : "Finalizar Solicitação"}
                        </button>
                    ) : (
                        <div className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-2">
                            <CheckCircle2 size={14}/> Enviado ao Admin
                        </div>
                    )}
                </div>
            </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-8 md:px-6">
            
            <div className="bg-white shadow-xl rounded-xl overflow-hidden print:shadow-none print:rounded-none border border-gray-200 print:border-none">
                
                {/* CABEÇALHO DO PEDIDO */}
                <div className="bg-gray-100 p-8 border-b border-gray-300 print:bg-white print:border-b-2 print:border-black">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-black text-[#f2e14c] flex items-center justify-center rounded font-black text-xl">W</div>
                            <div>
                                <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">Solicitação de Pedido</h1>
                                <p className="text-xs font-bold text-slate-500 uppercase">W B C Consórcio & Veículos</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] uppercase text-slate-500 font-bold">Número do Pedido</p>
                            <p className="text-2xl font-mono font-bold text-black tracking-widest">#{numeroPedido}</p>
                            <div className="flex justify-end gap-1 mt-1">
                                <span className="inline-block px-2 py-0.5 bg-[#f2e14c] text-black text-[10px] font-bold uppercase rounded">
                                    {dados.tipo}
                                </span>
                                {pedidoSalvo && <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase rounded border border-emerald-200">Sincronizado</span>}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 md:p-12 space-y-8">

                    {/* 1. DADOS DO PROPONENTE (Cliente) */}
                    <section className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center gap-2">
                            <User size={14} className="text-slate-500"/>
                            <h3 className="text-xs font-black uppercase text-slate-700">Dados do Proponente</h3>
                        </div>
                        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                            
                            {/* CAMPO DE NOME AGORA É EDITÁVEL */}
                            <div className="md:col-span-2 relative">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nome Completo</label>
                                <input 
                                    type="text" 
                                    value={nomeManual}
                                    onChange={(e) => setNomeManual(e.target.value.toUpperCase())}
                                    className="w-full border-b-2 border-slate-200 bg-transparent py-1 text-sm font-bold text-slate-900 uppercase focus:border-black focus:outline-none placeholder:text-slate-300"
                                    placeholder="Digite o nome do cliente..."
                                />
                                {erroApi && <span className="text-[10px] text-orange-500 font-bold absolute right-0 top-0">Preenchimento Manual</span>}
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase">CPF</label>
                                <div className="text-sm font-mono font-bold text-slate-900">{dados.cpf}</div>
                            </div>
                            
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase">Status Cadastral</label>
                                <div className="flex items-center gap-1">
                                    {/* Se der erro na API, mostra bolinha cinza, senão mostra a cor correta */}
                                    <div className={`w-2 h-2 rounded-full ${erroApi ? 'bg-gray-300' : (apiData?.situacaoCadastral === 'REGULAR' ? 'bg-emerald-500' : 'bg-red-500')}`}></div>
                                    <span className="text-sm font-bold text-slate-700">{erroApi ? "Não verificado (API)" : (apiData?.situacaoCadastral || "Verificar")}</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase">Data de Nascimento</label>
                                <div className="text-sm text-slate-700">{apiData?.dataNascimento || "---"}</div>
                            </div>
                        </div>
                    </section>

                    {/* 2. DADOS DO VEÍCULO (Item do Pedido) */}
                    <section className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center gap-2">
                            <CarFront size={14} className="text-slate-500"/>
                            <h3 className="text-xs font-black uppercase text-slate-700">Especificação do Item</h3>
                        </div>
                        <div className="p-4 flex gap-6 items-center">
                            {dados.imagem && (
                                <img src={dados.imagem} className="w-24 h-16 object-cover rounded border border-gray-200 bg-white print:hidden" />
                            )}
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase">Modelo / Descrição</label>
                                    <div className="text-lg font-black text-slate-900 uppercase">{dados.modelo}</div>
                                    <div className="text-xs text-slate-500">Ano/Modelo: 2026 • 0KM</div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase">Valor de Tabela</label>
                                    <div className="text-lg font-bold text-slate-900">{formatMoney(dados.valor)}</div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 3. RESUMO FINANCEIRO (Tabela) */}
                    <section className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center gap-2">
                            <DollarSign size={14} className="text-slate-500"/>
                            <h3 className="text-xs font-black uppercase text-slate-700">Condições de Pagamento</h3>
                        </div>
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-gray-50/50 border-b border-gray-100">
                                <tr>
                                    <th className="px-4 py-2 font-bold">Descrição</th>
                                    <th className="px-4 py-2 font-bold text-right">Valor</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                <tr>
                                    <td className="px-4 py-3 font-medium text-slate-700">Entrada / Lance Inicial</td>
                                    <td className="px-4 py-3 font-bold text-slate-900 text-right">{formatMoney(dados.entrada)}</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-3 font-medium text-slate-700">Saldo Restante ({dados.tipo})</td>
                                    <td className="px-4 py-3 font-bold text-slate-900 text-right">{formatMoney(dados.valor - dados.entrada)}</td>
                                </tr>
                                <tr className="bg-[#f2e14c]/10">
                                    <td className="px-4 py-3 font-bold text-slate-900 flex items-center gap-2">
                                        <Briefcase size={14}/> Plano Selecionado ({dados.prazo}x)
                                    </td>
                                    <td className="px-4 py-3 font-black text-slate-900 text-right text-lg">{formatMoney(dados.parcela)} <span className="text-xs font-normal text-slate-500">/mês</span></td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-3 font-medium text-slate-500">Custo Total Estimado</td>
                                    <td className="px-4 py-3 font-medium text-slate-500 text-right">{formatMoney(dados.total)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </section>

                    {/* RODAPÉ E OBSERVAÇÕES */}
                    <div className="pt-8 mt-4 border-t-2 border-dashed border-gray-200">
                        <div className="mb-8">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Observações Internas / Pendências</h4>
                            <div className="w-full h-20 border border-gray-200 rounded bg-gray-50/50 p-2 text-xs text-gray-400">
                                (Espaço reservado para anotações manuais do vendedor)
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8 items-end">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Responsável pela Venda</p>
                                <p className="text-sm font-bold text-slate-900 border-b border-slate-300 pb-1">W B C Consórcio LTDA</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Cliente / Proponente</p>
                                <p className="text-sm font-bold text-slate-900 border-b border-slate-300 pb-1">{nomeManual || "________________________"}</p>
                            </div>
                        </div>

                        <div className="mt-8 text-center">
                            <p className="text-[10px] text-slate-400">
                                Este documento é uma <strong>solicitação de pedido</strong> e não garante a aprovação do crédito. Ao assinar, o cliente autoriza a consulta aos órgãos de proteção ao crédito.
                            </p>
                            <p className="text-[10px] text-slate-300 font-mono mt-1 uppercase">
                                Emitido em: {dataAtual}
                            </p>
                        </div>
                    </div>

                </div>
            </div>

        </main>
    </div>
  );
}

export default function PedidoPage() {
  return <Suspense fallback={<div>Carregando...</div>}><PedidoContent /></Suspense>;
}