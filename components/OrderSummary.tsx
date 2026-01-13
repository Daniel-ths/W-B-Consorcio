"use client";

import { useState } from "react";
import Link from "next/link"; 
import { supabase } from "@/lib/supabase";
import { 
  Loader2, 
  ChevronRight,
  Download,
  Link as LinkIcon,
  Check,
  Package,
  Lock,
  Wallet,
  Banknote,
  CheckCircle2,
  AlertCircle // Ícone para erro
} from "lucide-react";

// --- MÁSCARAS E HELPER FUNCTIONS ---
const maskCPF = (value: string) => {
  return value
    .replace(/\D/g, "") // Remove tudo o que não é dígito
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})/, "$1-$2")
    .replace(/(-\d{2})\d+?$/, "$1"); // Limita a formatação
};

const maskPhone = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .replace(/(-\d{4})\d+?$/, "$1");
};

const validateEmail = (email: string) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

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
  user, 
  onEdit, 
}: any) {
  
  const [paymentMethod, setPaymentMethod] = useState<"Financiamento" | "Consorcio">("Financiamento");

  // Estados dos Campos
  const [clientName, setClientName] = useState("");
  const [clientCpf, setClientCpf] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  
  // Estados de Controle
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  
  // Estado de Erros de Validação
  const [errors, setErrors] = useState({
    clientName: "",
    clientCpf: "",
    clientEmail: "",
    clientPhone: ""
  });

  // Handlers com Máscaras
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setClientCpf(maskCPF(e.target.value));
    if (errors.clientCpf) setErrors({...errors, clientCpf: ""}); // Limpa erro ao digitar
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setClientPhone(maskPhone(e.target.value));
    if (errors.clientPhone) setErrors({...errors, clientPhone: ""});
  };

  const handleFinishOrder = async () => {
    // --- 1. VALIDADOR (REJECTS) ---
    let newErrors = { clientName: "", clientCpf: "", clientEmail: "", clientPhone: "" };
    let hasError = false;

    if (!user) {
      alert("Você precisa estar logado para realizar esta ação.");
      return;
    }

    // Validação Nome (Mínimo 3 letras)
    if (clientName.trim().length < 3) {
      newErrors.clientName = "Nome completo é obrigatório.";
      hasError = true;
    }

    // Validação CPF (Deve ter 14 caracteres: 000.000.000-00)
    if (clientCpf.length < 14) {
      newErrors.clientCpf = "CPF inválido ou incompleto.";
      hasError = true;
    }

    // Validação Email
    if (!clientEmail || !validateEmail(clientEmail)) {
      newErrors.clientEmail = "Insira um e-mail válido.";
      hasError = true;
    }

    // Validação Telefone (Mínimo 14 caracteres: (11) 9999-9999)
    if (clientPhone.length < 14) {
      newErrors.clientPhone = "Telefone obrigatório.";
      hasError = true;
    }

    setErrors(newErrors);

    if (hasError) {
      return; // REJECT: Para a execução aqui se houver erros
    }
    
    setLoading(true);

    // 2. Lógica de Envio
    const carNameResolved = currentCar.model_name || currentCar.name || currentCar.model || `Veículo ID ${currentCar.id}`;
    
    const simulatedScore = Math.floor(Math.random() * (999 - 300 + 1)) + 300;
    setScore(simulatedScore);

    try {
      const saleData = {
        car_id: currentCar.id,
        car_name: carNameResolved,
        seller_id: user.id,
        client_name: clientName,
        client_cpf: clientCpf,
        client_email: clientEmail,
        client_phone: clientPhone,
        total_price: totalPrice,
        score_result: simulatedScore,
        status: simulatedScore > 600 ? "Aprovado" : "Em Análise",
        interest_type: paymentMethod,
        details: {
          color: selectedColor?.name || "Padrão",
          wheels: selectedWheel?.name || "Padrão",
          seats: selectedSeatType?.name || "Padrão",
          accessories: selectedAccessoriesList.map((a: any) => a.name)
        },
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("sales").insert([saleData]);
      if (error) throw error;
      setSuccess(true);
    } catch (error: any) {
      console.error("Erro ao salvar no Supabase:", error);
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
           <p className="text-gray-500">A proposta de <strong>{paymentMethod}</strong> foi enviada para análise.</p>
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
          <h1 className="text-3xl font-light tracking-tight">Sua 2026 {currentCar.model_name || currentCar.name}</h1>
          <div className="flex items-center gap-6">
            <div className="flex gap-4 text-gray-600">
               <button className="hover:text-black"><Download size={20} /></button>
               <button className="hover:text-black"><LinkIcon size={20} /></button>
            </div>
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
                alt={currentCar.model_name || currentCar.name} 
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
              {/* DETALHES DO VEÍCULO (Mantido igual) */}
              <div className="grid grid-cols-1 md:grid-cols-4 py-8 border-b border-gray-200">
                 <div className="text-lg font-normal mb-4 md:mb-0">Versões</div>
                 <div className="md:col-span-3">
                   <div className="flex items-center gap-6">
                      <div className="w-24 h-16 bg-white border border-gray-200 rounded flex items-center justify-center p-1 overflow-hidden">
                        <img src={currentCar.image_url} className="w-full h-full object-cover" />
                      </div>
                      <p className="text-lg font-normal">2026 {currentCar.model_name || currentCar.name}</p>
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

              {/* PREÇO */}
              <div className="grid grid-cols-1 md:grid-cols-4 py-8 border-b border-gray-200">
                 <div className="text-lg font-normal mb-4 md:mb-0">Total</div>
                 <div className="md:col-span-3">
                    <span className="text-3xl font-bold text-gray-900">{formatCurrency(totalPrice)}</span>
                 </div>
              </div>
            </div>
          </section>

          {/* DADOS PARA PROPOSTA E SCORE (SEGMENTO PROTEGIDO) */}
          <section className="pt-10 border-t border-gray-200">
             <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
               
               <div className="lg:col-span-1">
                  <h3 className="text-2xl font-normal text-gray-900 mb-4">Dados para Proposta</h3>
                  <p className="text-sm text-gray-500">
                    Preencha os dados do cliente com atenção. O CPF e Telefone serão formatados automaticamente.
                  </p>
               </div>

               <div className="lg:col-span-3">
                  {!user ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-10 flex flex-col items-center justify-center text-center">
                       <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                           <Lock className="text-gray-500" size={32} />
                       </div>
                       <h3 className="text-xl font-bold text-gray-900 mb-2">Funcionalidade Restrita</h3>
                       <p className="text-gray-500 mb-6 max-w-md">
                         A consulta de Score e finalização de propostas são exclusivas para vendedores logados.
                       </p>
                       <Link href="/login" className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors">
                         Fazer Login de Vendedor
                       </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-6">
                      
                      {/* SELEÇÃO DE MODALIDADE */}
                      <div className="grid grid-cols-2 gap-4 mb-2">
                        <button
                          onClick={() => setPaymentMethod("Financiamento")}
                          className={`py-4 rounded border-2 font-bold flex items-center justify-center gap-2 transition-all
                            ${paymentMethod === "Financiamento" 
                              ? "border-blue-600 bg-blue-50 text-blue-700" 
                              : "border-gray-200 hover:border-blue-200 text-gray-500"}`}
                        >
                          <Banknote size={20} /> Financiamento
                          {paymentMethod === "Financiamento" && <CheckCircle2 size={16} />}
                        </button>

                        <button
                          onClick={() => setPaymentMethod("Consorcio")}
                          className={`py-4 rounded border-2 font-bold flex items-center justify-center gap-2 transition-all
                            ${paymentMethod === "Consorcio" 
                              ? "border-purple-600 bg-purple-50 text-purple-700" 
                              : "border-gray-200 hover:border-purple-200 text-gray-500"}`}
                        >
                          <Wallet size={20} /> Consórcio
                          {paymentMethod === "Consorcio" && <CheckCircle2 size={16} />}
                        </button>
                      </div>

                      {/* CAMPOS COM VALIDAÇÃO */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                                Nome Completo <span className="text-red-500">*</span>
                            </label>
                            <input 
                              value={clientName} 
                              onChange={e => {
                                  setClientName(e.target.value);
                                  if (errors.clientName) setErrors({...errors, clientName: ""});
                              }}
                              className={`w-full h-12 px-4 border rounded focus:outline-none transition-all text-sm
                                ${errors.clientName ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-black bg-white'}
                              `}
                              placeholder="Digite o nome completo"
                            />
                            {errors.clientName && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={10}/> {errors.clientName}</p>}
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                                CPF <span className="text-red-500">*</span>
                            </label>
                            <input 
                              value={clientCpf} 
                              onChange={handleCpfChange}
                              maxLength={14}
                              className={`w-full h-12 px-4 border rounded focus:outline-none transition-all text-sm
                                ${errors.clientCpf ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-black bg-white'}
                              `}
                              placeholder="000.000.000-00"
                            />
                            {errors.clientCpf && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={10}/> {errors.clientCpf}</p>}
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                                Email <span className="text-red-500">*</span>
                            </label>
                            <input 
                              value={clientEmail} 
                              onChange={e => {
                                  setClientEmail(e.target.value);
                                  if (errors.clientEmail) setErrors({...errors, clientEmail: ""});
                              }}
                              className={`w-full h-12 px-4 border rounded focus:outline-none transition-all text-sm
                                ${errors.clientEmail ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-black bg-white'}
                              `}
                              placeholder="exemplo@email.com"
                            />
                            {errors.clientEmail && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={10}/> {errors.clientEmail}</p>}
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                                Telefone <span className="text-red-500">*</span>
                            </label>
                            <input 
                              value={clientPhone} 
                              onChange={handlePhoneChange}
                              maxLength={15}
                              className={`w-full h-12 px-4 border rounded focus:outline-none transition-all text-sm
                                ${errors.clientPhone ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-black bg-white'}
                              `}
                              placeholder="(00) 00000-0000"
                            />
                            {errors.clientPhone && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={10}/> {errors.clientPhone}</p>}
                          </div>
                      </div>

                      <div className="mt-4 flex justify-end">
                          <button 
                            onClick={handleFinishOrder}
                            disabled={loading}
                            className={`text-white font-bold py-4 px-12 rounded hover:opacity-90 transition-colors flex items-center gap-3 shadow-lg disabled:opacity-70 text-sm uppercase tracking-wider
                              ${paymentMethod === 'Consorcio' ? 'bg-purple-700' : 'bg-[#1c1c1c]'}
                            `}
                          >
                            {loading ? <Loader2 className="animate-spin" size={18} /> : `Finalizar (${paymentMethod})`}
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