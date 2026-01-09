"use client";

import { useState } from "react";
import Link from "next/link"; // Importação necessária para o botão de login
import { supabase } from "@/lib/supabase";
import { 
  Loader2, 
  ChevronRight,
  Download,
  Link as LinkIcon,
  Check,
  Package,
  Lock // Ícone de cadeado para área restrita
} from "lucide-react";

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0, 
    maximumFractionDigits: 0,
  }).format(val || 0);
};

export default function OrderSummary({
  currentCar,
  selectedColor,
  selectedWheel,
  selectedSeatType,
  selectedAccessoriesList = [], 
  totalPrice,
  user, // Esse objeto user vem do componente pai (VehicleConfigurator) que checou a sessão
  onEdit, 
}: any) {
  
  const [clientName, setClientName] = useState("");
  const [clientCpf, setClientCpf] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  const handleFinishOrder = async () => {
    // Dupla verificação de segurança
    if (!user) {
      alert("Você precisa estar logado para realizar esta ação.");
      return;
    }

    if (!clientName || !clientCpf) {
      alert("Por favor, preencha os dados obrigatórios.");
      return;
    }
    setLoading(true);

    const simulatedScore = Math.floor(Math.random() * (999 - 300 + 1)) + 300;
    setScore(simulatedScore);

    try {
      const saleData = {
        car_id: currentCar.id,
        car_name: currentCar.name,
        seller_id: user.id, // AQUI: Salva o ID do vendedor logado
        client_name: clientName,
        client_cpf: clientCpf,
        client_email: clientEmail,
        client_phone: clientPhone,
        total_price: totalPrice,
        score_result: simulatedScore,
        status: simulatedScore > 600 ? "Aprovado" : "Em Análise",
        details: {
          color: selectedColor?.name,
          wheels: selectedWheel?.name,
          seats: selectedSeatType?.name,
          accessories: selectedAccessoriesList.map((a: any) => a.name)
        },
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("sales").insert([saleData]);
      if (error) throw error;
      setSuccess(true);
    } catch (error: any) {
      alert("Erro ao salvar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-white text-center p-8 space-y-8 animate-in fade-in duration-500">
        <div className="w-24 h-24 bg-green-600 rounded-full flex items-center justify-center shadow-lg">
          <Check size={48} className="text-white" />
        </div>
        <div>
           <h2 className="text-4xl font-light text-gray-900 mb-2">Pedido Registrado</h2>
           <p className="text-gray-500">A proposta foi enviada para análise.</p>
        </div>
        <div className="bg-gray-50 p-10 rounded border border-gray-200 shadow-xl w-full max-w-md">
          <p className="text-gray-400 uppercase text-xs font-bold tracking-widest mb-4">SCORE DE CRÉDITO</p>
          <div className="text-7xl font-bold text-gray-900 mb-6 tracking-tighter">{score}</div>
          <div className={`inline-block px-6 py-2 rounded-full text-sm font-bold uppercase tracking-wide ${score && score > 600 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
            {score && score > 600 ? 'Pré-Aprovado' : 'Em Análise'}
          </div>
        </div>
        <button onClick={() => window.location.reload()} className="text-blue-600 hover:text-blue-800 font-medium transition-colors border-b border-transparent hover:border-blue-800">
          Voltar ao início
        </button>
      </div>
    );
  }

  return (
    <div className="w-full bg-white font-sans text-[#1a1a1a]">
      
      {/* 1. HEADER (Fixo) */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm flex-none">
        <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
          <h1 className="text-3xl font-light tracking-tight">Sua 2026 {currentCar.name}</h1>
          <div className="flex items-center gap-6">
            <div className="flex gap-4 text-gray-600">
               <button className="hover:text-black"><Download size={20} /></button>
               <button className="hover:text-black"><LinkIcon size={20} /></button>
            </div>
            {/* Botões do Topo só aparecem se estiver logado, opcionalmente */}
            {user && (
              <>
                <button className="hidden md:block px-6 py-2 bg-gray-100 text-gray-900 font-medium rounded hover:bg-gray-200 transition-colors text-sm">
                  Inventário
                </button>
                <button className="px-6 py-2 bg-black text-white font-medium rounded hover:bg-gray-800 transition-colors text-sm">
                  Enviar pedido
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. CONTEÚDO PRINCIPAL */}
      <main className="w-full pb-20">
        
        {/* HERO IMAGE */}
        <div className="bg-[#f2f2f2] w-full py-12 flex justify-center items-center mb-12">
           <div className="max-w-[1200px] w-full aspect-[21/9] relative">
              <img 
                src={currentCar.image_url || "/placeholder-car.png"} 
                alt={currentCar.name} 
                className="w-full h-full object-contain drop-shadow-xl"
              />
           </div>
        </div>

        <div className="max-w-[1200px] mx-auto px-6">
          
          {/* BLOCO DE RESUMO */}
          <section className="mb-16 border-b border-gray-200 pb-12">
            <div className="flex justify-between items-baseline mb-8 border-b border-gray-200 pb-4">
              <h2 className="text-3xl font-normal">Resumo</h2>
              <button onClick={onEdit} className="text-sm font-medium flex items-center gap-1 hover:underline">
                Editar <ChevronRight size={14} />
              </button>
            </div>

            <div className="space-y-0">
              {/* Versões */}
              <div className="grid grid-cols-1 md:grid-cols-4 py-8 border-b border-gray-200">
                 <div className="text-lg font-normal mb-4 md:mb-0">Versões</div>
                 <div className="md:col-span-3">
                   <div className="flex items-center gap-6">
                      <div className="w-24 h-16 bg-white border border-gray-200 rounded flex items-center justify-center p-1 overflow-hidden">
                        <img src={currentCar.image_url} className="w-full h-full object-cover" />
                      </div>
                      <p className="text-lg font-normal">2026 {currentCar.name}</p>
                   </div>
                 </div>
              </div>

              {/* Exterior */}
              <div className="grid grid-cols-1 md:grid-cols-4 py-8 border-b border-gray-200">
                 <div className="text-lg font-normal mb-4 md:mb-0">Exterior</div>
                 <div className="md:col-span-3 space-y-8">
                   {selectedColor && (
                     <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded border border-gray-300 shadow-sm" style={{ backgroundColor: selectedColor.hex }} />
                        <div>
                          <p className="text-lg font-normal">{selectedColor.name}</p>
                          <p className="text-gray-500 mt-1">{selectedColor.price > 0 ? formatCurrency(selectedColor.price) : 'R$ 0,00'}</p>
                        </div>
                     </div>
                   )}
                   {selectedWheel && (
                     <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-gray-100 rounded-full border border-gray-200 overflow-hidden flex items-center justify-center">
                          <img src={selectedWheel.image} className="w-full h-full object-cover" onError={(e:any) => e.target.style.display='none'} />
                        </div>
                        <div>
                          <p className="text-lg font-normal">{selectedWheel.name}</p>
                          <p className="text-gray-500 mt-1">{selectedWheel.price > 0 ? formatCurrency(selectedWheel.price) : 'Padrão'}</p>
                        </div>
                     </div>
                   )}
                 </div>
              </div>

              {/* Interior */}
              <div className="grid grid-cols-1 md:grid-cols-4 py-8 border-b border-gray-200">
                 <div className="text-lg font-normal mb-4 md:mb-0">Interior</div>
                 <div className="md:col-span-3">
                   {selectedSeatType && (
                     <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-gray-800 rounded border border-gray-200 overflow-hidden">
                             {/* Imagem do banco */}
                        </div>
                        <div>
                          <p className="text-lg font-normal">{selectedSeatType.name}</p>
                          <p className="text-gray-500 mt-1">{selectedSeatType.price > 0 ? formatCurrency(selectedSeatType.price) : 'Padrão'}</p>
                        </div>
                     </div>
                   )}
                 </div>
              </div>

               {/* Acessórios */}
               {selectedAccessoriesList.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-4 py-8 border-b border-gray-200">
                   <div className="text-lg font-normal mb-4 md:mb-0">Acessórios</div>
                   
                   <div className="md:col-span-3 grid grid-cols-2 lg:grid-cols-3 gap-4">
                     {selectedAccessoriesList.map((acc: any) => (
                       <div key={acc.id} className="flex flex-col border border-gray-200 rounded-lg p-3 hover:border-gray-400 transition-colors bg-white shadow-sm">
                          <div className="h-20 w-full bg-gray-50 rounded mb-2 flex items-center justify-center overflow-hidden relative">
                             {acc.image_url || acc.image ? (
                               <img src={acc.image_url || acc.image} alt={acc.name} className="w-full h-full object-contain" />
                             ) : (
                               <Package className="text-gray-300" size={32} />
                             )}
                          </div>
                          <div className="mt-1">
                            <p className="text-sm font-bold text-gray-900 leading-tight line-clamp-2">{acc.name}</p>
                            <p className="text-xs text-gray-500 mt-1 font-medium">+ {formatCurrency(acc.price)}</p>
                          </div>
                       </div>
                     ))}
                   </div>
                </div>
              )}
            </div>
          </section>

          {/* PREÇO */}
          <section className="mb-20">
            <h2 className="text-3xl font-normal mb-8">Preço</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
               <div className="hidden md:block"></div>
               <div>
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-gray-600">
                      <span>Veículo</span>
                      <span className="text-gray-900">{formatCurrency(currentCar.price_start)}</span>
                    </div>
                    {selectedColor?.price > 0 && (
                      <div className="flex justify-between text-gray-600">
                        <span>{selectedColor.name}</span>
                        <span className="text-gray-900">{formatCurrency(selectedColor.price)}</span>
                      </div>
                    )}
                    {selectedAccessoriesList.length > 0 && (
                      <div className="flex justify-between text-gray-600">
                        <span>Acessórios</span>
                        <span className="text-gray-900">{formatCurrency(selectedAccessoriesList.reduce((a:number, b:any) => a + b.price, 0))}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="border-t border-gray-200 pt-6 flex justify-between items-baseline">
                     <span className="text-lg font-bold text-gray-900">Total estimado</span>
                     <span className="text-3xl font-normal text-gray-900">{formatCurrency(totalPrice)}</span>
                  </div>
                  
                  <div className="mt-8 text-xs text-gray-400 space-y-2">
                     <p>IMPORTANTE: A simulação de compra não garante a disponibilidade do veículo escolhido.</p>
                  </div>
               </div>
            </div>
          </section>

          {/* DADOS PARA PROPOSTA E SCORE (SEGMENTO PROTEGIDO) */}
          <section className="pt-10 border-t border-gray-200">
             <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Texto Intro */}
                <div className="lg:col-span-1">
                   <h3 className="text-2xl font-normal text-gray-900 mb-4">Dados para Proposta</h3>
                   <p className="text-sm text-gray-500">
                     Preencha seus dados para finalizar a configuração e calcular seu score de financiamento.
                   </p>
                </div>

                <div className="lg:col-span-3">
                   
                   {/* VERIFICAÇÃO DE USUÁRIO: Se não tiver user, mostra bloqueio */}
                   {!user ? (
                     <div className="bg-gray-50 border border-gray-200 rounded-lg p-10 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                            <Lock className="text-gray-500" size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Funcionalidade Restrita</h3>
                        <p className="text-gray-500 mb-6 max-w-md">
                          A consulta de Score e finalização de propostas são exclusivas para vendedores logados.
                        </p>
                        <Link 
                          href="/login" 
                          className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors"
                        >
                          Fazer Login de Vendedor
                        </Link>
                     </div>
                   ) : (
                     // SE TIVER USER, MOSTRA O FORMULÁRIO NORMAL
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nome Completo</label>
                          <input 
                            value={clientName} onChange={e => setClientName(e.target.value)}
                            className="w-full h-12 px-4 border border-gray-300 rounded focus:border-black outline-none bg-white transition-all text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">CPF</label>
                          <input 
                            value={clientCpf} onChange={e => setClientCpf(e.target.value)}
                            className="w-full h-12 px-4 border border-gray-300 rounded focus:border-black outline-none bg-white transition-all text-sm"
                            placeholder="000.000.000-00"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Email</label>
                          <input 
                            value={clientEmail} onChange={e => setClientEmail(e.target.value)}
                            className="w-full h-12 px-4 border border-gray-300 rounded focus:border-black outline-none bg-white transition-all text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Telefone</label>
                          <input 
                            value={clientPhone} onChange={e => setClientPhone(e.target.value)}
                            className="w-full h-12 px-4 border border-gray-300 rounded focus:border-black outline-none bg-white transition-all text-sm"
                          />
                        </div>

                        <div className="md:col-span-2 mt-4 flex justify-end">
                            <button 
                              onClick={handleFinishOrder}
                              disabled={loading}
                              className="bg-[#1c1c1c] text-white font-bold py-4 px-12 rounded hover:bg-black transition-colors flex items-center gap-3 shadow-lg disabled:opacity-70 text-sm uppercase tracking-wider"
                            >
                              {loading ? <Loader2 className="animate-spin" size={18} /> : 'Finalizar e Calcular Score'}
                            </button>
                        </div>
                     </div>
                   )}
                </div>
             </div>
          </section>

        </div>
      </main>
      
    </div>
  );
}