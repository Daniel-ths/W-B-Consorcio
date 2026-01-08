"use client"

import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Loader2, 
  ArrowLeft, 
  ArrowRight, 
  Info, 
  Gauge, 
  Armchair, 
  UserCheck, 
  User, 
  Search, 
  CreditCard, 
  BadgeCheck,
  Wallet,
  Save,
  MapPin,
  Phone,
  FileText
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

// --- IMPORTAÇÃO DINÂMICA DO WIDGET ---
const SellerScoreWidget = dynamic(() => import("@/components/SellerScoreWidget"), {
  ssr: false,
  loading: () => <div className="p-4 text-xs text-gray-400">Carregando painel de vendas...</div>
});

const safePrice = (value: any): number => {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    if (typeof value === 'string') {
        const cleanStr = value.replace(/[^0-9,-]+/g, "").replace(",", ".");
        const parsed = parseFloat(cleanStr);
        return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
};

export default function VehicleConfigurator() {
  const searchParams = useSearchParams();
  const idDoUrl = searchParams.get('id');
  const sidebarRef = useRef<HTMLDivElement>(null);

  const [isMounted, setIsMounted] = useState(false);

  // --- DADOS DO CARRO ---
  const [currentCar, setCurrentCar] = useState<any>(null);
  const [relatedCars, setRelatedCars] = useState<any[]>([]);
  
  // --- DADOS DO USUÁRIO (VENDEDOR) ---
  const [user, setUser] = useState<any>(null); 
  
  // --- DADOS DO CLIENTE (FORMULÁRIO COMPLETO) ---
  const [formData, setFormData] = useState({
      nome: "",
      cpf: "",
      telefone: "",
      endereco: ""
  });
  
  const [loadingScore, setLoadingScore] = useState(false);
  const [clientData, setClientData] = useState<any>(null);
  const [clientScore, setClientScore] = useState<any>(null);

  // Estados de Carregamento
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isSwitchingCar, setIsSwitchingCar] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // --- VISUAL ---
  const [activeTab, setActiveTab] = useState<'Modelo' | 'Exterior' | 'Interior'>('Modelo');
  const [showSummary, setShowSummary] = useState(false);
  const [transmission, setTransmission] = useState('Automático'); 
  const [interiorView, setInteriorView] = useState<'dash' | 'seats'>('dash');
  
  const [viewIndex, setViewIndex] = useState(0);
  const viewsOrder = ['front', 'side', 'rear_angle', 'front_detail', 'rear'];

  // --- SELEÇÕES ---
  const [selectedColor, setSelectedColor] = useState<any>(null);
  const [selectedWheel, setSelectedWheel] = useState<any>(null);
  const [selectedSeatType, setSelectedSeatType] = useState<any>(null);
  const [selectedAccs, setSelectedAccs] = useState<string[]>([]);

  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

  useEffect(() => {
    setIsMounted(true);
    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
    };
    checkUser();
  }, []);

  // --- HANDLER DOS INPUTS ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- FUNÇÃO PRINCIPAL: SALVAR E CONSULTAR ---
  const handleConsultarCliente = async (e: any) => {
    e.preventDefault();
    
    // Validação Básica
    if(!formData.cpf || !formData.nome || !formData.telefone) {
        alert("Preencha os campos obrigatórios (Nome, CPF e Telefone)");
        return;
    }
    
    setLoadingScore(true);
    setClientData(null);
    setClientScore(null);

    try {
        // 1. SALVAR NO BANCO DE DADOS (Simulação)
        // Se você já tiver a tabela 'simulations', descomente a linha abaixo:
        /*
        const { error } = await supabase.from('simulations').insert({
            user_id: user.id, // Vendedor
            client_name: formData.nome,
            client_cpf: formData.cpf,
            client_phone: formData.telefone,
            client_address: formData.endereco,
            vehicle_id: currentCar.id,
            price_total: totalPrice,
            created_at: new Date()
        });
        if (error) console.error("Erro ao salvar simulação:", error);
        */
       
       console.log("Dados salvos para simulação:", formData);

        // 2. SIMULAR API DE SCORE
        setTimeout(() => {
            // Mock de Dados Pessoais (Usando o que foi digitado)
            setClientData({
                nome: formData.nome,
                cpf: formData.cpf,
                ocupacao: "Autônomo / Empresário", // Mock
                renda: 12500 // Mock
            });

            // Mock de Score Lógico
            const randomScore = Math.floor(Math.random() * (980 - 450 + 1)) + 450;
            let status = "Regular";
            let aprovado = false;

            if(randomScore > 600) { status = "Bom"; aprovado = true; }
            if(randomScore > 800) { status = "Excelente"; aprovado = true; }

            setClientScore({
                points: randomScore,
                status: status,
                aprovado: aprovado,
                limite: aprovado ? randomScore * 150 : 0
            });

            setLoadingScore(false);
        }, 2000);

    } catch (err) {
        console.error(err);
        setLoadingScore(false);
    }
  };

  useEffect(() => {
    async function fetchCarData() {
      if (currentCar) setIsSwitchingCar(true);
      
      try {
        let carToLoad = null;
        if (idDoUrl) {
          const { data } = await supabase.from('vehicles').select('*').eq('id', idDoUrl).single();
          carToLoad = data;
        } else {
          const { data } = await supabase.from('vehicles').select('*').limit(1).single();
          carToLoad = data;
        }

        if (carToLoad) {
          setCurrentCar(carToLoad);
          setViewIndex(0);
          
          if (carToLoad.exterior_colors?.length > 0) setSelectedColor(carToLoad.exterior_colors[0]);
          if (carToLoad.wheels?.length > 0) setSelectedWheel(carToLoad.wheels[0]);
          if (carToLoad.seat_types?.length > 0) setSelectedSeatType(carToLoad.seat_types[0]);

          const { data: relatives } = await supabase.from('vehicles').select('*').eq('category_id', carToLoad.category_id).neq('id', carToLoad.id);
          if (relatives) setRelatedCars([carToLoad, ...relatives].sort((a,b) => a.price_start - b.price_start));
          else setRelatedCars([carToLoad]);
        }
      } catch (error) { 
          console.error(error); 
      } finally { 
          setIsInitialLoad(false);
          setIsSwitchingCar(false);
      }
    }
    fetchCarData();
  }, [idDoUrl]);

  const finalImage = getFinalImageURL();
  useEffect(() => {
      setImageLoaded(false);
  }, [finalImage]);

  const extAccessories = currentCar?.accessories?.filter((a: any) => a.type === 'exterior') || [];
  const intAccessories = currentCar?.accessories?.filter((a: any) => a.type === 'interior') || [];
  const hasSeats = currentCar?.interior_images?.seats && currentCar.interior_images.seats !== currentCar.interior_images.dash;

  const totalPrice = useMemo(() => {
      if (!currentCar) return 0;
      let total = safePrice(currentCar.price_start);
      total += safePrice(selectedColor?.price);
      total += safePrice(selectedWheel?.price);
      total += safePrice(selectedSeatType?.price);
      selectedAccs.forEach(accId => {
          const acc = currentCar.accessories?.find((a: any) => a.id === accId);
          total += safePrice(acc?.price);
      });
      return total;
  }, [currentCar, selectedColor, selectedWheel, selectedSeatType, selectedAccs]);

  const rotateCar = (direction: 'next' | 'prev') => {
      setImageLoaded(false);
      if (direction === 'next') setViewIndex((prev) => (prev + 1) % viewsOrder.length);
      else setViewIndex((prev) => (prev - 1 + viewsOrder.length) % viewsOrder.length);
  };

  const handleTabChange = (tab: 'Modelo' | 'Exterior' | 'Interior') => {
    setActiveTab(tab);
    if (sidebarRef.current) sidebarRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    if (tab === 'Interior') setInteriorView('dash');
    else setViewIndex(0);
    setImageLoaded(false);
  };

  const handleNext = () => {
      if (activeTab === 'Modelo') handleTabChange('Exterior');
      else if (activeTab === 'Exterior') handleTabChange('Interior');
      else if (activeTab === 'Interior') setShowSummary(true);
  }

  const handleColorChange = (color: any) => {
    setSelectedColor(color);
    setViewIndex(0); 
    setImageLoaded(false);
  };

  const handleSeatChange = (seat: any) => {
      setSelectedSeatType(seat);
      setInteriorView('seats');
      setImageLoaded(false);
  };

  const toggleAccessory = (id: string) => {
    setSelectedAccs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const updateInteriorImage = (view: 'dash' | 'seats') => {
    setInteriorView(view);
    setImageLoaded(false);
  };

  function getFinalImageURL() {
      if (!currentCar) return '';
      if (activeTab === 'Interior') {
          const isSeats = interiorView === 'seats';
          return isSeats ? (selectedSeatType?.image || currentCar?.interior_images?.seats) : currentCar?.interior_images?.dash;
      }
      const currentView = viewsOrder[viewIndex];
      if (selectedColor?.images?.[currentView]) return selectedColor.images[currentView];
      if (currentCar?.image_views?.[currentView]) return currentCar.image_views[currentView];
      if (selectedColor?.image) return selectedColor.image;
      return currentCar?.image_url;
  };

  if (!isMounted) return <div className="h-screen bg-white"></div>;
  if (!currentCar && !isInitialLoad) return <div className="h-screen flex items-center justify-center fixed inset-0 z-[5000] bg-white">Veículo não encontrado.</div>;

  return (
    <>
      <div className={`fixed inset-0 z-[9999] bg-white flex items-center justify-center transition-opacity duration-1000 ease-in-out pointer-events-none ${isInitialLoad ? 'opacity-100' : 'opacity-0'}`}>
         <Loader2 className={`w-8 h-8 text-gray-300 animate-spin ${isInitialLoad ? 'block' : 'hidden'}`} />
      </div>

      {currentCar && (
          showSummary ? (
            // --- TELA DE RESUMO ---
            <div className="fixed inset-0 z-[2000] h-screen w-full overflow-y-auto font-sans bg-white animate-in fade-in slide-in-from-bottom-10 duration-500">
                <div className="sticky top-0 bg-white z-50 px-6 py-4 flex justify-between items-center border-b border-gray-200 shadow-sm">
                    <h1 className="text-2xl font-bold text-gray-900">Resumo do Pedido</h1>
                    <button onClick={() => setShowSummary(false)} className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1">
                        Editar Configuração <ArrowRight size={16} />
                    </button>
                </div>

                <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col lg:flex-row gap-12">
                    
                    {/* COLUNA DA ESQUERDA: DETALHES DO CARRO */}
                    <div className="flex-1 space-y-10">
                        <div className="bg-gray-50 rounded-xl p-8 flex items-center justify-center">
                            <img src={currentCar.image_url} className="w-full max-w-md object-contain" alt="Carro" />
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4">Itens Selecionados</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Modelo</span>
                                    <span className="font-bold text-gray-900">{currentCar.model_name}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Cor Externa</span>
                                    <span className="font-bold text-gray-900">{selectedColor?.name}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Rodas</span>
                                    <span className="font-bold text-gray-900">{selectedWheel?.name || 'Série'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Interior</span>
                                    <span className="font-bold text-gray-900">{selectedSeatType?.name || 'Série'}</span>
                                </div>
                                {selectedAccs.length > 0 && (
                                    <div className="pt-2 border-t border-gray-100">
                                        <span className="text-gray-600 block mb-2">Acessórios:</span>
                                        {selectedAccs.map(id => {
                                            const acc = currentCar.accessories.find((a: any) => a.id === id);
                                            return acc ? <span key={id} className="inline-block bg-gray-100 text-xs px-2 py-1 rounded mr-1 mb-1">{acc.name}</span> : null
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-black text-white p-6 rounded-xl">
                            <div className="flex justify-between items-end">
                                <span className="text-sm font-medium text-gray-400 uppercase">Valor Total Estimado</span>
                                <span className="text-3xl font-bold">{formatMoney(totalPrice)}</span>
                            </div>
                        </div>
                    </div>

                    {/* COLUNA DA DIREITA: ÁREA DO VENDEDOR & FORMULÁRIO */}
                    <div className="w-full lg:w-[450px] space-y-6">
                        
                        {/* 1. ÁREA DO VENDEDOR (Protegida) */}
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
                                        // --- FORMULÁRIO DE CADASTRO DO CLIENTE ---
                                        <form onSubmit={handleConsultarCliente} className="space-y-4 animate-in fade-in">
                                            <div className="flex items-center gap-2 mb-2 text-gray-800">
                                                <FileText size={18} className="text-blue-600"/>
                                                <h3 className="font-bold text-sm uppercase">Dados da Simulação</h3>
                                            </div>

                                            <div>
                                                <label className="text-xs font-bold text-gray-500 mb-1 block">Nome Completo *</label>
                                                <div className="relative">
                                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                                    <input 
                                                        name="nome"
                                                        value={formData.nome}
                                                        onChange={handleInputChange}
                                                        type="text" 
                                                        required
                                                        placeholder="Nome do Cliente" 
                                                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-xs font-bold text-gray-500 mb-1 block">CPF *</label>
                                                    <div className="relative">
                                                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                                        <input 
                                                            name="cpf"
                                                            value={formData.cpf}
                                                            onChange={handleInputChange}
                                                            type="text" 
                                                            required
                                                            placeholder="000.000.000-00" 
                                                            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-gray-500 mb-1 block">Telefone *</label>
                                                    <div className="relative">
                                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                                        <input 
                                                            name="telefone"
                                                            value={formData.telefone}
                                                            onChange={handleInputChange}
                                                            type="text" 
                                                            required
                                                            placeholder="(00) 00000-0000" 
                                                            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-xs font-bold text-gray-500 mb-1 block">Endereço <span className="text-gray-300 font-normal">(Opcional)</span></label>
                                                <div className="relative">
                                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                                    <input 
                                                        name="endereco"
                                                        value={formData.endereco}
                                                        onChange={handleInputChange}
                                                        type="text" 
                                                        placeholder="Rua, Número, Bairro..." 
                                                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                            </div>

                                            <button 
                                                type="submit" 
                                                disabled={loadingScore}
                                                className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2 transition-all"
                                            >
                                                {loadingScore ? <Loader2 className="animate-spin" size={18}/> : <><Save size={18}/> Salvar & Consultar Score</>}
                                            </button>
                                        </form>
                                    ) : (
                                        // --- RESULTADO DA SIMULAÇÃO (APÓS SALVAR) ---
                                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="font-bold text-gray-900 flex items-center gap-2"><BadgeCheck className="text-green-600"/> Análise Concluída</h3>
                                                <button onClick={() => setClientData(null)} className="text-xs text-blue-600 font-bold hover:underline">Nova Consulta</button>
                                            </div>

                                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 relative overflow-hidden">
                                                <div className="flex justify-between items-start mb-4 relative z-10">
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 text-lg">{clientData.nome}</h4>
                                                        <p className="text-xs text-gray-500 flex gap-2">
                                                            <span>CPF: {clientData.cpf}</span>
                                                            <span>•</span>
                                                            <span>{clientData.ocupacao}</span>
                                                        </p>
                                                    </div>
                                                    {clientScore.aprovado ? (
                                                        <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded uppercase border border-green-200">
                                                            Aprovado
                                                        </span>
                                                    ) : (
                                                        <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-1 rounded uppercase border border-yellow-200">
                                                            Em Análise
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                <div className="grid grid-cols-2 gap-3 relative z-10">
                                                    <div className="bg-white p-3 rounded border border-gray-200 shadow-sm">
                                                        <p className="text-[10px] text-gray-400 uppercase font-bold">Score Serasa</p>
                                                        <p className={`text-xl font-bold ${clientScore.points > 700 ? 'text-green-600' : 'text-yellow-600'}`}>{clientScore.points} <span className="text-xs text-gray-400 font-normal">/ 1000</span></p>
                                                    </div>
                                                    <div className="bg-white p-3 rounded border border-gray-200 shadow-sm">
                                                        <p className="text-[10px] text-gray-400 uppercase font-bold">Renda Presumida</p>
                                                        <p className="text-xl font-bold text-gray-900">{formatMoney(clientData.renda)}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Integração com Widget de Vendas */}
                                            {clientScore.aprovado && (
                                                <div className="border-t border-gray-100 pt-4">
                                                    <p className="text-xs font-bold text-gray-500 mb-3 uppercase flex items-center gap-1">
                                                        <Wallet size={14} className="text-gray-400" /> Condição Sugerida para o Cliente
                                                    </p>
                                                    {/* Passamos o preço para o widget calcular parcelas */}
                                                    <SellerScoreWidget vehiclePrice={totalPrice} />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            // 2. VISÃO PARA CLIENTE NÃO LOGADO (Visitante)
                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
                                <h3 className="font-bold text-gray-900 mb-2 text-lg">Gostou deste carro?</h3>
                                <p className="text-sm text-gray-600 mb-8 leading-relaxed">
                                    Esta configuração foi salva. Leve este resumo até a concessionária mais próxima ou agende um test-drive agora mesmo.
                                </p>
                                <button className="w-full bg-black text-white font-bold py-4 rounded-lg hover:bg-gray-800 transition-colors uppercase text-sm shadow-lg hover:shadow-xl">
                                    Agendar Test Drive
                                </button>
                                <p className="text-xs text-gray-400 mt-4">Ou ligue para (11) 99999-9999</p>
                            </div>
                        )}

                    </div>
                </div>
            </div>
          ) : (
            // --- CONFIGURADOR NORMAL (Mantido igual) ---
            <div className="fixed inset-0 z-[2000] flex flex-col lg:flex-row h-screen w-full overflow-hidden font-sans bg-white">
              
              <div className="lg:w-[75%] w-full h-[50vh] lg:h-full bg-[#1a1a1a] relative flex items-center justify-center overflow-hidden">
                <div className={`absolute inset-0 z-50 bg-[#1a1a1a]/80 backdrop-blur-sm flex items-center justify-center transition-opacity duration-500 pointer-events-none ${isSwitchingCar ? 'opacity-100' : 'opacity-0'}`}>
                    <Loader2 className="animate-spin text-white w-8 h-8" />
                </div>
                {selectedColor && activeTab !== 'Interior' && (
                    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden animate-in fade-in duration-1000">
                        <div className="w-full h-full transition-colors duration-1000 ease-in-out opacity-20 blur-[120px] scale-150 transform-gpu" style={{ backgroundColor: selectedColor.hex }}></div>
                        <div className="absolute inset-0 bg-radial-gradient-to-t from-[#1a1a1a] via-transparent to-transparent opacity-60"></div>
                    </div>
                )}
                <Link href="/" className="absolute top-8 left-6 z-30 text-white/50 hover:text-white flex items-center gap-2 text-sm font-bold uppercase tracking-widest transition-colors"><ArrowLeft size={16}/> Voltar</Link>
                <div className="absolute top-6 left-0 right-0 flex justify-center z-20"><img src="https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/chevrolet-logo.svg" alt="Chevy" className="h-8 object-contain drop-shadow-lg"/></div>
                <div className={`w-full h-full flex items-center justify-center relative overflow-hidden transition-all duration-700 ease-in-out z-10 ${activeTab === 'Interior' ? 'p-0' : 'p-12 lg:p-32'}`}>
                    <div className={`relative w-full h-full flex items-center justify-center transition-all duration-700 ease-in-out transform drop-shadow-2xl ${activeTab === 'Interior' ? 'scale-105' : 'scale-100'}`}>
                        {!imageLoaded && !isSwitchingCar && (<div className="absolute inset-0 flex items-center justify-center z-0"><Loader2 className="animate-spin text-white/20 w-10 h-10" /></div>)}
                        <img key={finalImage} src={finalImage} alt="Car View" onLoad={() => setImageLoaded(true)} className={`absolute inset-0 w-full h-full object-contain z-10 select-none pointer-events-none transition-opacity duration-700 ease-in-out ${imageLoaded && !isSwitchingCar ? 'opacity-100' : 'opacity-0 scale-95'}`} />
                    </div>
                </div>
                {activeTab !== 'Interior' && (
                    <div className="absolute bottom-8 left-8 flex gap-2 z-30">
                        <button onClick={() => rotateCar('prev')} className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-md transition-all hover:scale-110 active:scale-95"><ChevronLeft size={20} /></button>
                        <button onClick={() => rotateCar('next')} className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-md transition-all hover:scale-110 active:scale-95"><ChevronRight size={20} /></button>
                        <div className="ml-4 flex gap-1 items-center">{viewsOrder.map((_, i) => (<div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === viewIndex ? 'bg-white scale-125' : 'bg-white/30'}`} />))}</div>
                    </div>
                )}
                <div className="absolute bottom-8 right-8 z-30"><button className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded font-bold text-sm backdrop-blur-md">Contate uma Concessionária</button></div>
              </div>

              <div className="lg:w-[25%] w-full h-full bg-white flex flex-col border-l border-gray-200 shadow-xl z-30">
                {/* --- AQUI FICA O CRACHÁ DO VENDEDOR --- */}
                <div className="p-6 pb-2 border-b border-gray-100 bg-white relative">
                    {/* INDICADOR DE USUÁRIO NO TOPO */}
                    <div className="absolute top-6 right-6 z-10">
                        {user ? (
                            <div className="flex items-center gap-2 text-xs font-bold text-green-700 bg-green-50 px-3 py-1.5 rounded-full border border-green-100 shadow-sm animate-in fade-in slide-in-from-top-2">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                <UserCheck size={14} />
                                <span className="max-w-[100px] truncate">{user.email?.split('@')[0]}</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                                <User size={14} />
                                <span>Visitante</span>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-8 text-base font-bold text-gray-400 mb-6 pr-24"> 
                        {['Modelo', 'Exterior', 'Interior'].map((tab: any) => (
                            <button key={tab} onClick={() => handleTabChange(tab)} className={`pb-2 border-b-2 transition-all ${activeTab === tab ? 'text-black border-black' : 'border-transparent hover:text-gray-600'}`}>{tab}</button>
                        ))}
                    </div>
                    {activeTab === 'Modelo' && (
                        <div key={currentCar.id}>
                            <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-4">Seu {currentCar.model_name}</h1>
                            <div className="mb-4">
                                <div className="flex gap-2">
                                    {['Automático', 'Manual'].map((type) => (
                                        <button key={type} onClick={() => setTransmission(type)} className={`flex-1 py-4 text-sm font-bold uppercase border rounded transition-all ${transmission === type ? 'border-black text-black ring-1 ring-black' : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}>{type}</button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div ref={sidebarRef} key={activeTab} className="flex-1 overflow-y-auto p-6 pt-4 space-y-4 custom-scrollbar">
                    {activeTab === 'Modelo' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center mb-2"><span className="text-base font-bold text-gray-900">Versões</span><span className="text-xs font-bold text-gray-500 cursor-pointer hover:underline flex items-center gap-1 uppercase tracking-wider"><ArrowLeft size={10} className="rotate-180"/> Comparar</span></div>
                            {relatedCars.map((ver, index) => (
                                <Link href={`/configurador?id=${ver.id}`} key={ver.id} onClick={(e) => {if(currentCar.id === ver.id) e.preventDefault();}} className={`block cursor-pointer border rounded-lg p-5 transition-all duration-200 relative group ${currentCar.id === ver.id ? 'border-black ring-1 ring-black bg-gray-50' : 'border-gray-200 hover:border-gray-400'}`}>
                                    <div className="flex justify-between items-start mb-2"><span className="font-bold text-gray-900 text-base">{ver.model_name}</span><span className="text-base font-bold text-gray-600">{formatMoney(ver.price_start)}</span></div>
                                    <p className="text-xs font-medium text-gray-500">Tecnologia e elegância</p>
                                </Link>
                            ))}
                        </div>
                    )}
                    {activeTab === 'Exterior' && (
                        <div className="space-y-10 pt-2">
                            <div>
                                <div className="flex justify-between items-center mb-4"><h3 className="text-base font-bold text-gray-900">Cores</h3><button className="text-gray-400 text-xl font-light">-</button></div>
                                <p className="text-sm font-bold text-gray-600 mb-4">{selectedColor?.name || 'Padrão'} <span className="float-right text-xs font-medium text-gray-400">{(selectedColor?.price || 0) > 0 ? `+ ${formatMoney(selectedColor.price)}` : 'Incluso'}</span></p>
                                <div className="flex flex-wrap gap-4">{currentCar.exterior_colors?.map((color: any) => (<button key={color.name} onClick={() => handleColorChange(color)} className={`w-10 h-10 rounded-full shadow-sm border transition-all ${selectedColor?.name === color.name ? 'ring-2 ring-offset-2 ring-blue-600 scale-110' : 'border-gray-200 hover:scale-105'}`} style={{ backgroundColor: color.hex }} />))}</div>
                            </div>
                            <div className="border-t border-gray-100 pt-8">
                                <div className="flex justify-between items-center mb-4"><h3 className="text-base font-bold text-gray-900">Rodas</h3><button className="text-gray-400 text-xl font-light">-</button></div>
                                <div className="space-y-4">{currentCar.wheels && currentCar.wheels.length > 0 ? currentCar.wheels.map((wheel: any) => (<div key={wheel.id} onClick={() => setSelectedWheel(wheel)} className={`cursor-pointer border rounded-lg p-3 flex gap-4 items-center transition-all ${selectedWheel?.id === wheel.id ? 'border-black ring-1 ring-black' : 'border-gray-200 hover:border-gray-300'}`}><div className="w-20 h-20 bg-white rounded flex items-center justify-center border border-gray-100 shrink-0"><img src={wheel.image} className="max-w-full max-h-full mix-blend-multiply" /></div><div className="flex-1 min-w-0"><p className="text-sm font-bold text-gray-900 leading-tight mb-2">{wheel.name}</p><p className="text-xs font-bold text-gray-500">{(wheel.price || 0) === 0 ? 'Padrão' : `+ ${formatMoney(wheel.price)}`}</p></div>{selectedWheel?.id === wheel.id && <Check size={16} className="text-black"/>}</div>)) : <p className="text-xs text-gray-400 italic">Nenhuma roda opcional.</p>}</div>
                            </div>
                            <div className="border-t border-gray-100 pt-8">
                                <div className="flex justify-between items-center mb-4"><h3 className="text-base font-bold text-gray-900">Acessórios Externos</h3><button className="text-gray-400 text-xl font-light">-</button></div>
                                <div className="space-y-4">{extAccessories.length > 0 ? extAccessories.map((acc: any, index: number) => (<div key={acc.id} onClick={() => toggleAccessory(acc.id)} className={`flex gap-4 cursor-pointer p-3 rounded hover:bg-gray-50 transition-all duration-200 ${selectedAccs.includes(acc.id) ? 'bg-gray-50 ring-1 ring-gray-200' : ''}`}><div className="w-24 h-16 bg-white rounded border border-gray-200 overflow-hidden shrink-0"><img src={acc.image} className="w-full h-full object-cover" /></div><div className="flex-1 min-w-0"><p className="text-sm font-bold text-gray-900 truncate">{acc.name}</p><p className="text-xs font-bold text-gray-500 flex items-center gap-1 mt-1">R$ {acc.price} <Info size={12} className="text-gray-400"/></p></div><div className={`w-6 h-6 rounded-full border flex items-center justify-center self-center transition-colors ${selectedAccs.includes(acc.id) ? 'bg-black border-black' : 'border-gray-300'}`}>{selectedAccs.includes(acc.id) ? <Check size={12} className="text-white"/> : <span className="text-xs text-gray-400">+</span>}</div></div>)) : <p className="text-xs text-gray-400 italic">Nenhum acessório externo.</p>}</div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'Interior' && (
                        <div className="space-y-8 pt-2">
                            <div className="flex gap-2">
                                <button onClick={() => updateInteriorImage('dash')} className={`${hasSeats ? 'flex-1' : 'w-full'} py-3 px-4 rounded border flex items-center justify-center gap-2 transition-all ${interiorView === 'dash' ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}><Gauge size={18} /> <span className="text-xs font-bold uppercase">Painel</span></button>
                                {hasSeats && (<button onClick={() => updateInteriorImage('seats')} className={`flex-1 py-3 px-4 rounded border flex items-center justify-center gap-2 transition-all ${interiorView === 'seats' ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}><Armchair size={18} /> <span className="text-xs font-bold uppercase">Bancos</span></button>)}
                            </div>
                            <div className="border-t border-gray-100 pt-6">
                                <div className="flex justify-between items-center mb-4"><h3 className="text-base font-bold text-gray-900">Acabamento dos Bancos</h3><button className="text-gray-400 text-xl font-light">-</button></div>
                                <div className="space-y-4">
                                    <div onClick={() => { setSelectedSeatType(null); updateInteriorImage('seats'); }} className={`cursor-pointer border rounded-lg p-3 flex gap-4 items-center transition-all ${selectedSeatType === null ? 'border-black ring-1 ring-black' : 'border-gray-200 hover:border-gray-300'}`}><div className="w-20 h-20 bg-white rounded flex items-center justify-center border border-gray-100 shrink-0 overflow-hidden"><img src={currentCar.interior_images?.seats || currentCar.interior_images?.dash} className="w-full h-full object-cover" /></div><div className="flex-1 min-w-0"><p className="text-sm font-bold text-gray-900 leading-tight mb-2">{currentCar.interior_images?.seats_desc || 'Bancos Padrão'}</p><p className="text-xs font-bold text-gray-500">Incluso</p></div>{selectedSeatType === null && <Check size={16} className="text-black"/>}</div>
                                    {currentCar.seat_types && currentCar.seat_types.map((seat: any) => (<div key={seat.id} onClick={() => handleSeatChange(seat)} className={`cursor-pointer border rounded-lg p-3 flex gap-4 items-center transition-all ${selectedSeatType?.id === seat.id ? 'border-black ring-1 ring-black' : 'border-gray-200 hover:border-gray-300'}`}><div className="w-20 h-20 bg-white rounded flex items-center justify-center border border-gray-100 shrink-0"><img src={seat.image} className="w-full h-full object-cover" /></div><div className="flex-1 min-w-0"><p className="text-sm font-bold text-gray-900 leading-tight mb-2">{seat.name}</p><p className="text-xs font-bold text-gray-500">{(seat.price || 0) === 0 ? 'Incluso' : `+ ${formatMoney(seat.price)}`}</p></div>{selectedSeatType?.id === seat.id && <Check size={16} className="text-black"/>}</div>))}
                                </div>
                            </div>
                            <div className="border-t border-gray-100 pt-6">
                                <div className="flex justify-between items-center mb-4"><h3 className="text-base font-bold text-gray-900">Acessórios Internos</h3><button className="text-gray-400 text-xl font-light">-</button></div>
                                <div className="space-y-4">{intAccessories.length > 0 ? intAccessories.map((acc: any, index: number) => (<div key={acc.id} onClick={() => toggleAccessory(acc.id)} className={`flex gap-4 cursor-pointer p-3 rounded hover:bg-gray-50 transition-all duration-200 ${selectedAccs.includes(acc.id) ? 'bg-gray-50 ring-1 ring-gray-200' : ''}`}><div className="w-24 h-16 bg-white rounded border border-gray-200 overflow-hidden shrink-0"><img src={acc.image} className="w-full h-full object-cover" /></div><div className="flex-1 min-w-0"><p className="text-sm font-bold text-gray-900 truncate">{acc.name}</p><p className="text-xs font-bold text-gray-500 flex items-center gap-1 mt-1">R$ {acc.price} <Info size={12} className="text-gray-400"/></p></div><div className={`w-6 h-6 rounded-full border flex items-center justify-center self-center transition-colors ${selectedAccs.includes(acc.id) ? 'bg-black border-black' : 'border-gray-300'}`}>{selectedAccs.includes(acc.id) ? <Check size={12} className="text-white"/> : <span className="text-xs text-gray-400">+</span>}</div></div>)) : <p className="text-xs text-gray-400 italic">Nenhum acessório interno.</p>}</div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-gray-200 bg-white">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-xs font-bold text-gray-400 mb-1 uppercase tracking-wide">Preço Total</p>
                            <p key={totalPrice} className="text-2xl font-bold text-gray-900 border-b-2 border-gray-100 pb-1 leading-none">{formatMoney(totalPrice)}</p>
                        </div>
                        <button onClick={handleNext} className="bg-black text-white px-8 py-4 rounded font-bold text-sm uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] flex items-center gap-2">{activeTab === 'Interior' ? 'FINALIZAR' : 'PRÓXIMO'} <ArrowRight size={16} /></button>
                    </div>
                </div>

              </div>
            </div>
          )
      )}
    </>
  );
}