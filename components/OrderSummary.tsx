"use client";

import { useState } from "react";
import { ArrowRight, BadgeCheck, FileText, Loader2, Save, Search, User, UserCheck, Wallet, MapPin, Phone, CreditCard, Info } from "lucide-react";
import dynamic from "next/dynamic";

// Widget carregado dinamicamente
const SellerScoreWidget = dynamic(() => import("@/components/SellerScoreWidget"), {
  ssr: false,
  loading: () => <div className="p-4 text-xs text-gray-400">Carregando painel...</div>
});

const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

interface OrderSummaryProps {
  currentCar: any;
  selectedColor: any;
  selectedWheel: any;
  selectedSeatType: any;
  selectedAccs: string[];
  totalPrice: number;
  user: any; // O Vendedor Logado
  onEdit: () => void; // Função para voltar
}

export default function OrderSummary({ 
  currentCar, selectedColor, selectedWheel, selectedSeatType, selectedAccs, totalPrice, user, onEdit 
}: OrderSummaryProps) {

  // --- ESTADOS DO FORMULÁRIO ---
  const [formData, setFormData] = useState({ nome: "", cpf: "", telefone: "", endereco: "" });
  const [loadingScore, setLoadingScore] = useState(false);
  const [clientData, setClientData] = useState<any>(null);
  const [clientScore, setClientScore] = useState<any>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleConsultarCliente = async (e: any) => {
    e.preventDefault();
    if(!formData.cpf || !formData.nome || !formData.telefone) {
        alert("Preencha os campos obrigatórios.");
        return;
    }
    
    setLoadingScore(true);
    setClientData(null);
    setClientScore(null);

    // SIMULAÇÃO DA API / SALVAR NO BANCO
    setTimeout(() => {
        setClientData({
            nome: formData.nome,
            cpf: formData.cpf,
            ocupacao: "Autônomo / Empresário",
            renda: 12500
        });

        const randomScore = Math.floor(Math.random() * (980 - 450 + 1)) + 450;
        let aprovado = randomScore > 600;

        setClientScore({
            points: randomScore,
            status: aprovado ? "Bom" : "Regular",
            aprovado: aprovado,
            limite: aprovado ? randomScore * 150 : 0
        });

        setLoadingScore(false);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[2000] h-screen w-full overflow-y-auto font-sans bg-white animate-in fade-in slide-in-from-bottom-10 duration-500">
      
      {/* Header */}
      <div className="sticky top-0 bg-white z-50 px-6 py-4 flex justify-between items-center border-b border-gray-200 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Resumo do Pedido</h1>
        <button onClick={onEdit} className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1">
          Editar Configuração <ArrowRight size={16} />
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col lg:flex-row gap-12">
        
        {/* COLUNA ESQUERDA: O CARRO */}
        <div className="flex-1 space-y-10">
          <div className="bg-gray-50 rounded-xl p-8 flex items-center justify-center">
            <img src={currentCar.image_url} className="w-full max-w-md object-contain" alt="Carro" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4">Itens Selecionados</h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">Modelo</span><span className="font-bold text-gray-900">{currentCar.model_name}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Cor</span><span className="font-bold text-gray-900">{selectedColor?.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Rodas</span><span className="font-bold text-gray-900">{selectedWheel?.name || 'Série'}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Interior</span><span className="font-bold text-gray-900">{selectedSeatType?.name || 'Série'}</span></div>
            </div>
          </div>

          <div className="bg-black text-white p-6 rounded-xl flex justify-between items-end">
            <span className="text-sm font-medium text-gray-400 uppercase">Valor Total</span>
            <span className="text-3xl font-bold">{formatMoney(totalPrice)}</span>
          </div>
        </div>

        {/* COLUNA DIREITA: FORMULÁRIO DO VENDEDOR */}
        <div className="w-full lg:w-[450px] space-y-6">
          {user ? (
            <div className="bg-white border-2 border-blue-50 rounded-xl shadow-lg overflow-hidden">
              <div className="bg-blue-50 px-6 py-3 border-b border-blue-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck size={18} className="text-blue-700" />
                  <span className="text-sm font-bold text-blue-900 uppercase">Área do Vendedor</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-bold text-green-700 uppercase">Online</span>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {!clientData ? (
                  <form onSubmit={handleConsultarCliente} className="space-y-4 animate-in fade-in">
                    <div className="flex items-center gap-2 mb-2 text-gray-800">
                        <FileText size={18} className="text-blue-600"/>
                        <h3 className="font-bold text-sm uppercase">Dados da Simulação</h3>
                    </div>
                    
                    {/* INPUTS SIMPLIFICADOS PARA ECONOMIZAR ESPAÇO NO EXEMPLO */}
                    <input name="nome" value={formData.nome} onChange={handleInputChange} required placeholder="Nome Completo *" className="w-full p-2 border rounded text-sm" />
                    <div className="grid grid-cols-2 gap-2">
                        <input name="cpf" value={formData.cpf} onChange={handleInputChange} required placeholder="CPF *" className="w-full p-2 border rounded text-sm" />
                        <input name="telefone" value={formData.telefone} onChange={handleInputChange} required placeholder="Telefone *" className="w-full p-2 border rounded text-sm" />
                    </div>
                    <input name="endereco" value={formData.endereco} onChange={handleInputChange} placeholder="Endereço (Opcional)" className="w-full p-2 border rounded text-sm" />

                    <button type="submit" disabled={loadingScore} className="w-full bg-blue-600 text-white p-3 rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                      {loadingScore ? <Loader2 className="animate-spin" size={18}/> : <><Save size={18}/> Salvar & Consultar</>}
                    </button>
                  </form>
                ) : (
                  // RESULTADO DO SCORE
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2"><BadgeCheck className="text-green-600"/> Análise Concluída</h3>
                        <button onClick={() => setClientData(null)} className="text-xs text-blue-600 font-bold hover:underline">Nova Consulta</button>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                        <h4 className="font-bold text-gray-900">{clientData.nome}</h4>
                        <p className="text-xs text-gray-500 mb-2">CPF: {clientData.cpf}</p>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-white p-2 rounded border"><p className="text-[10px] text-gray-400 font-bold">SCORE</p><p className={`font-bold ${clientScore.aprovado ? 'text-green-600' : 'text-yellow-600'}`}>{clientScore.points}</p></div>
                            <div className="bg-white p-2 rounded border"><p className="text-[10px] text-gray-400 font-bold">RENDA</p><p className="font-bold">{formatMoney(clientData.renda)}</p></div>
                        </div>
                    </div>

                    {clientScore.aprovado && (
                         <div className="pt-2">
                            <p className="text-xs font-bold text-gray-500 mb-2 uppercase flex items-center gap-1"><Wallet size={12} /> Condição Sugerida</p>
                            <SellerScoreWidget vehiclePrice={totalPrice} carModel={""} />
                         </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Visão Visitante
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
                <h3 className="font-bold text-gray-900 mb-2">Gostou deste carro?</h3>
                <p className="text-sm text-gray-600 mb-6">Leve este resumo até a concessionária.</p>
                <button className="w-full bg-black text-white font-bold py-3 rounded-lg">AGENDAR TEST DRIVE</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}