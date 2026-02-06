"use client";

import { useState, Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase"; 
import { 
  CheckCircle2, Loader2, ArrowLeft, Printer, CarFront, User, DollarSign, 
  Briefcase, Send, MapPin, Phone, Calendar, Heart, FileText, RefreshCw 
} from "lucide-react";

// --- SOLUÇÃO GLOBAL PARA O ERRO 429 ---
// Esta variável fica fora do componente, então ela não zera quando o React atualiza a tela.
// Armazena: { "12345678900": 17000000000 (timestamp) }
const cacheConsultasGlobal = new Map<string, number>();

function PedidoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // --- DADOS DO PEDIDO ---
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
  const [verificando, setVerificando] = useState(false);
  const [loadingSalvar, setLoadingSalvar] = useState(false); 
  const [pedidoSalvo, setPedidoSalvo] = useState(false); 
  
  const [apiData, setApiData] = useState<any>(null);
  const [nomeManual, setNomeManual] = useState("");
  const [dataAtual, setDataAtual] = useState("");

  useEffect(() => {
    setDataAtual(new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }));
    
    // --- LÓGICA DE PROTEÇÃO ANTI-DUPLICIDADE ---
    if (dados.cpf) {
        const ultimaConsulta = cacheConsultasGlobal.get(dados.cpf);
        const agora = Date.now();
        
        // Se já consultou esse CPF nos últimos 2 minutos (120000ms), NÃO consulta de novo automaticamente.
        const recente = ultimaConsulta && (agora - ultimaConsulta < 120000);

        if (!recente) {
            // Marca que estamos consultando AGORA para bloquear as próximas tentativas automáticas
            cacheConsultasGlobal.set(dados.cpf, agora);
            validarReceita(false); // false = automático
        } else {
            console.log("Consulta automática bloqueada pelo Cache Global (evitando erro 429).");
            setLoadingValidacao(false);
        }
    } else {
        setLoadingValidacao(false);
    }
  }, []); // Roda apenas uma vez na montagem

  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const numeroPedido = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');

  // --- CONSULTA API ---
  const validarReceita = async (isManual = true) => {
    if (isManual) {
        setVerificando(true);
        // Se for manual (clique do usuário), atualizamos o cache para permitir nova tentativa
        if (dados.cpf) cacheConsultasGlobal.set(dados.cpf, Date.now());
    }
    
    try {
      const response = await fetch('/api/consultar-cpf', {
        method: 'POST',
        body: JSON.stringify({ cpf: dados.cpf }),
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();

      if (response.ok && data && !data.error) {
        setApiData(data); 
        
        const nomeApi = data.nome || 
                        data.response?.content?.nome?.conteudo?.nome || 
                        "";
        
        if (nomeApi) setNomeManual(nomeApi);
        if (isManual) alert("✅ Dados atualizados com sucesso!");
      
      } else {
        if (response.status === 429) {
            console.warn("API bloqueou por excesso de tentativas.");
            // Só avisa na tela se foi o usuário que clicou
            if (isManual) alert("⏳ Muitas consultas seguidas. Aguarde alguns segundos.");
        } else {
            const msg = data.error || "Erro ao buscar dados";
            if (isManual) alert(`❌ ${msg}`);
        }
      }
    } catch (error) {
      console.error("Erro fetch", error);
      if (isManual) alert("Erro de conexão.");
    } finally {
      setLoadingValidacao(false);
      setVerificando(false);
    }
  };

  // --- ATALHOS DE DADOS ---
  const situacaoReceita = apiData?.situacao || apiData?.response?.content?.nome?.conteudo?.situacao_receita || "Não Verificado";
  const dataNascimento = apiData?.nascimento || apiData?.data_nascimento || apiData?.response?.content?.nome?.conteudo?.data_nascimento || "---";
  const nomeMae = apiData?.mae || apiData?.nome_mae || apiData?.response?.content?.nome?.conteudo?.mae || "---";
  const genero = apiData?.genero || apiData?.response?.content?.nome?.conteudo?.genero || "";
  
  const enderecoComplexo = apiData?.response?.content?.pesquisa_enderecos?.conteudo?.[0];
  const enderecoSimples = apiData?.uf ? { estado: apiData.uf } : null;
  const endereco = enderecoComplexo || enderecoSimples || {};

  const telefoneAPI = apiData?.response?.content?.contato_preferencial?.conteudo?.[0]?.valor || "Não informado";

  // --- ENVIAR PARA O ADMIN ---
  const handleFinalizarSolicitacao = async () => {
    if (!nomeManual) return alert("Aguarde o carregamento ou preencha os dados.");
    setLoadingSalvar(true);

    try {
        const { data: { user } } = await supabase.auth.getUser();
        
        const payload = {
            seller_id: user?.id || null, 
            car_name: dados.modelo,
            client_name: nomeManual.toUpperCase(), 
            client_cpf: dados.cpf,
            status: "Aguardando Aprovação",
            total_price: dados.valor,
            interest_type: dados.tipo,
            client_phone: telefoneAPI,
            created_at: new Date().toISOString()
        };

        const { error } = await supabase.from('sales').insert([payload]);
        if (error) throw error;

        setPedidoSalvo(true);
        alert("Proposta salva com sucesso!");

    } catch (error: any) {
        alert("Erro ao salvar: " + error.message);
    } finally {
        setLoadingSalvar(false);
    }
  };

  if (loadingValidacao) {
      return (
          <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
              <Loader2 className="animate-spin text-blue-600 w-12 h-12"/>
              <p className="text-slate-500 font-medium animate-pulse">Verificando CPF...</p>
          </div>
      )
  }

  return (
    <div className="min-h-screen bg-[#e5e7eb] font-sans text-slate-900 pb-20 print:bg-white print:p-0">
        
        {/* HEADER */}
        <header className="px-6 py-4 bg-white border-b border-gray-200 sticky top-0 z-50 print:hidden shadow-sm">
            <div className="max-w-5xl mx-auto flex items-center justify-between">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 hover:text-black transition-colors font-bold text-xs uppercase">
                    <ArrowLeft size={16}/> Voltar
                </button>
                <div className="flex items-center gap-3">
                    <button onClick={() => window.print()} className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-xs font-bold uppercase hover:bg-slate-50 flex items-center gap-2 shadow-sm transition-all">
                        <Printer size={16}/> Imprimir
                    </button>
                    
                    {!pedidoSalvo ? (
                        <button 
                            onClick={handleFinalizarSolicitacao} 
                            disabled={loadingSalvar} 
                            className="bg-black text-white px-6 py-2 rounded-lg text-xs font-bold uppercase hover:bg-slate-800 flex items-center gap-2 shadow-md transition-all hover:scale-105"
                        >
                            {loadingSalvar ? <Loader2 className="animate-spin" size={16}/> : <Send size={16}/>}
                            {loadingSalvar ? "Enviando..." : "Finalizar Proposta"}
                        </button>
                    ) : (
                        <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-2 border border-green-200">
                            <CheckCircle2 size={16}/> Salvo
                        </div>
                    )}
                </div>
            </div>
        </header>

        {/* PAPER AREA */}
        <main className="max-w-5xl mx-auto py-8 md:px-4 print:max-w-full print:p-0">
            
            <div className="bg-white shadow-xl rounded-xl overflow-hidden print:shadow-none print:rounded-none border border-gray-200 print:border-none w-full max-w-[210mm] mx-auto min-h-[297mm] flex flex-col">
                
                {/* HEADER DOCUMENTO */}
                <div className="bg-slate-900 text-white p-8 print:bg-white print:text-black print:border-b-2 print:border-black print:p-0 print:mb-6">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-white text-black flex items-center justify-center rounded-lg font-black text-3xl print:border-2 print:border-black">W</div>
                            <div>
                                <h1 className="text-2xl font-bold uppercase tracking-tight leading-none mb-1">Ficha Cadastral</h1>
                                <p className="text-xs font-medium text-slate-400 uppercase tracking-widest print:text-black">WBCNAC.com</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] uppercase text-slate-400 font-bold print:text-black">Protocolo</p>
                            <p className="text-2xl font-mono font-bold tracking-widest">#{numeroPedido}</p>
                            <div className="mt-2">
                                <span className="px-3 py-1 bg-[#f2e14c] text-black text-[10px] font-bold uppercase rounded print:border print:border-black print:bg-white">
                                    {dados.tipo}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-8 flex-1 print:p-0 print:space-y-4">

                    {/* 1. DADOS DO CLIENTE */}
                    <section className="border border-gray-200 rounded-lg overflow-hidden print:border-black print:rounded-none">
                        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between print:bg-gray-200 print:border-black">
                            <div className="flex items-center gap-2">
                                <User size={14} className="text-black"/>
                                <h3 className="text-xs font-black uppercase text-slate-800">1. Identificação do Proponente</h3>
                            </div>
                            
                            <button 
                                onClick={() => validarReceita(true)} 
                                disabled={verificando}
                                className="print:hidden flex items-center gap-1 text-[10px] bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200 hover:bg-blue-100 transition-colors uppercase font-bold"
                            >
                                {verificando ? <Loader2 size={12} className="animate-spin"/> : <RefreshCw size={12}/>}
                                {verificando ? "Buscando..." : "Buscar na Receita"}
                            </button>
                        </div>
                        
                        <div className="p-5 grid grid-cols-1 md:grid-cols-4 gap-y-5 gap-x-4 print:gap-y-2 print:text-sm">
                            
                            <div className="md:col-span-3">
                                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Nome Completo</label>
                                <div className="font-bold text-slate-900 uppercase border-b border-gray-100 pb-1 min-h-[24px]">
                                    {nomeManual || (verificando ? <span className="animate-pulse bg-gray-200 h-4 w-1/2 block rounded"/> : "---")}
                                </div>
                            </div>
                            <div>
                                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">CPF</label>
                                <div className="font-mono font-bold text-slate-900 border-b border-gray-100 pb-1 flex items-center justify-between">
                                    {dados.cpf}
                                    {situacaoReceita === 'REGULAR' && <CheckCircle2 size={14} className="text-green-500 print:hidden"/>}
                                </div>
                            </div>

                            <div>
                                <label className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase mb-1"><Calendar size={10}/> Data Nasc.</label>
                                <div className="font-medium text-slate-700">
                                    {dataNascimento}
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase mb-1"><Heart size={10}/> Nome da Mãe</label>
                                <div className="font-medium text-slate-700 uppercase">
                                    {nomeMae}
                                </div>
                            </div>
                            <div>
                            </div>

                            {genero && (
                                <div className="md:col-span-1">
                                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Gênero</label>
                                    <div className="font-medium text-slate-700 uppercase">{genero}</div>
                                </div>
                            )}


                            <div className="md:col-span-3">
                                <label className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase mb-1"><MapPin size={10}/> Endereço Residencial</label>
                                {endereco.logradouro ? (
                                    <div className="font-medium text-slate-700 uppercase text-xs border p-2 rounded bg-gray-50 print:bg-white print:border-none print:p-0">
                                        {endereco.logradouro}, Nº {endereco.numero} {endereco.complemento} - {endereco.bairro}. <br/>
                                        {endereco.cidade} / {endereco.estado} - CEP: {endereco.cep}
                                    </div>
                                ) : (
                                    <div className="text-slate-400 text-xs italic border-b border-dotted border-gray-300 w-full h-6 flex items-center">
                                        {endereco.estado ? `Estado: ${endereco.estado} (Preencher endereço completo)` : "Preencher manualmente"}
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* 2. DADOS DO BEM */}
                    <section className="border border-gray-200 rounded-lg overflow-hidden print:border-black print:rounded-none">
                        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center gap-2 print:bg-gray-200 print:border-black">
                            <CarFront size={14} className="text-black"/>
                            <h3 className="text-xs font-black uppercase text-slate-800">2. Objeto do Contrato</h3>
                        </div>
                        <div className="p-5 flex gap-6 items-center">
                            {dados.imagem && (
                                <img src={dados.imagem} className="w-40 h-24 object-contain rounded border border-gray-100 p-2 bg-white print:hidden" />
                            )}
                            <div className="flex-1 grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Modelo / Bem</label>
                                    <div className="text-xl font-black text-slate-900 uppercase leading-none">{dados.modelo}</div>
                                    <div className="text-[10px] text-slate-500 mt-1 uppercase print:text-black">Veículo Novo • 2026 • 0KM</div>
                                </div>
                                <div className="text-right">
                                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Valor do Bem (Carta)</label>
                                    <div className="text-xl font-bold text-slate-900">{formatMoney(dados.valor)}</div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 3. CONDIÇÕES COMERCIAIS */}
                    <section className="border border-gray-200 rounded-lg overflow-hidden print:border-black print:rounded-none">
                        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center gap-2 print:bg-gray-200 print:border-black">
                            <DollarSign size={14} className="text-black"/>
                            <h3 className="text-xs font-black uppercase text-slate-800">3. Condições de Pagamento</h3>
                        </div>
                        <table className="w-full text-sm text-left">
                            <tbody className="divide-y divide-gray-100 print:divide-black">
                                <tr>
                                    <td className="px-5 py-3 font-medium text-slate-600 uppercase text-xs">Entrada / Lance</td>
                                    <td className="px-5 py-3 font-bold text-slate-900 text-right">{formatMoney(dados.entrada)}</td>
                                </tr>
                                <tr>
                                    <td className="px-5 py-3 font-medium text-slate-600 uppercase text-xs">Saldo Restante</td>
                                    <td className="px-5 py-3 font-bold text-slate-900 text-right">{formatMoney(dados.valor - dados.entrada)}</td>
                                </tr>
                                <tr className="bg-yellow-50 print:bg-transparent">
                                    <td className="px-5 py-3 font-bold text-slate-900 flex items-center gap-2 uppercase text-xs">
                                        <Briefcase size={14}/> Parcelamento ({dados.prazo}x)
                                    </td>
                                    <td className="px-5 py-3 font-black text-slate-900 text-right text-lg">{formatMoney(dados.parcela)}</td>
                                </tr>
                                <tr>
                                    <td className="px-5 py-3 font-medium text-slate-400 text-[10px] uppercase">Total do Contrato (Estimado)</td>
                                    <td className="px-5 py-3 font-medium text-slate-400 text-right text-[10px]">{formatMoney(dados.total)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </section>

                    {/* ESPAÇO VAZIO */}
                    <div className="flex-1 min-h-[100px] border border-gray-200 rounded p-4 print:border-black print:min-h-[150px]">
                        <p className="text-[9px] font-bold text-slate-400 uppercase mb-2">Observações Adicionais / Acessórios / Cor</p>
                        <div className="w-full h-full border-b border-gray-100 print:hidden"></div>
                    </div>

                    {/* ASSINATURAS */}
                    <div className="mt-auto pt-8 border-t-2 border-black print:break-inside-avoid">
                        <div className="grid grid-cols-2 gap-12 items-end mb-8">
                            <div className="text-center">
                                <div className="border-b border-black mb-2"></div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase">W B C Consórcio & Veículos</p>
                                <p className="text-[9px] text-slate-400">Vendedor Autorizado</p>
                            </div>
                            <div className="text-center">
                                <div className="border-b border-black mb-2"></div>
                                <p className="text-[10px] font-bold text-slate-900 uppercase">{nomeManual || "Cliente Proponente"}</p>
                                <p className="text-[9px] text-slate-400">CPF: {dados.cpf}</p>
                            </div>
                        </div>

                        <div className="text-center text-[9px] text-slate-500 leading-tight">
                            <p className="mb-1"><strong>IMPORTANTE:</strong> Este documento constitui uma proposta comercial e não garante a contemplação imediata (em caso de consórcio) ou aprovação de crédito bancário. O cliente declara estar ciente de todas as cláusulas do contrato de adesão.</p>
                            <p className="font-mono mt-2 uppercase">Belém, {dataAtual}</p>
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