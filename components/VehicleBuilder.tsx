"use client"

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Check, ArrowRight, Info, Disc, Package, Shield, Download, Mail, Save, ArrowRightLeft, ChevronRight as ChevronRightIcon } from "lucide-react";

// --- DADOS E TIPOS ---
interface VehicleProps {
    id: number | string;
    model: string;
    price: number | string;
    image_url: string;
}

const INTERIOR_DASH_URL = "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/carro%202026%20Onix%20interior.AVIF";
const INTERIOR_SEATS_URL = "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/carro%202026%20Onix%20interior%20banco.AVIF";

const interiorViews = [
  { id: 'dash', name: 'Painel', url: INTERIOR_DASH_URL },
  { id: 'seats', name: 'Bancos', url: INTERIOR_SEATS_URL },
];

const colorOptions = [
    { name: "Preto Ouro Negro", hex: "#000000", bgColor: "#1a1a1a", image: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/novo%20onix%20preto.png", thumb: "linear-gradient(45deg, #000, #333)" },
    { name: "Vermelho Carmim", hex: "#CE1126", bgColor: "#4a0404", image: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/novo%20onix%20preto%20vermelho.png", thumb: "linear-gradient(45deg, #CE1126, #800)" },
    { name: "Branco Summit", hex: "#F0F0F0", bgColor: "#8c8c8c", image: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/novo%20onix%20preto%20branco.png", thumb: "linear-gradient(45deg, #fff, #ccc)" },
    { name: "Cinza Drake", hex: "#5d5d5d", bgColor: "#2d2d2d", image: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/novo%20onix%20preto%20cinza.png", thumb: "linear-gradient(45deg, #5d5d5d, #333)" },
    { name: "Prata Switchblade", hex: "#C0C0C0", bgColor: "#3e4146", image: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/novo%20onix%20preto%20prata.png", thumb: "linear-gradient(45deg, #C0C0C0, #888)" }
];

const mockVersions = [
  { id: 'v1', name: 'Onix AT Turbo', price: 112990, features: 'Tecnologia e elegância' },
  { id: 'v2', name: 'Onix LT Turbo', price: 118990, features: 'Mais conforto' },
  { id: 'v3', name: 'Onix LTZ Turbo', price: 123990, features: 'Acabamento premium' },
  { id: 'v4', name: 'Onix PREMIER', price: 129990, features: 'Topo de linha' },
  { id: 'v5', name: 'Onix RS Turbo', price: 130990, features: 'Esportividade' },
];

// --- RODAS E ACESSÓRIOS ---
const mockWheels = [
    { id: 'w1', name: 'Roda de aço High-vent aro 15" com calotas esportivas', price: 0, icon: Disc, standard: true },
    { id: 'w2', name: 'Rodas de alumínio preta 16”', price: 6888, icon: Disc, standard: false },
    { id: 'w3', name: 'Rodas de alumínio preta diamantada 16”', price: 7588, icon: Disc, standard: false },
];

const mockExteriorAccessories = [
    { name: "Aerofólio traseiro esportivo", price: 1880, icon: Package },
    { name: "Trava antifurto para rodas", price: 516, icon: Shield },
    { name: "Sensor de estacionamento traseiro", price: 738, icon: Info },
    { name: "Ponteira de escapamento", price: 1156, icon: Package },
];

const mockInteriorAccessories = [
    { name: "Tapete de bandeja para porta-malas", price: 589 },
    { name: "Tapete de pvc", price: 646 },
    { name: "Bancos com revestimento premium", price: 2750 },
    { name: "Pedaleira esportiva", price: 482 },
    { name: "OnStar Protect & Connect", price: 1299 },
];

export default function VehicleBuilder({ vehicle }: { vehicle: VehicleProps }) {
  const basePrice = typeof vehicle.price === 'string' 
    ? parseFloat(vehicle.price.replace('R$', '').replace('.', '').replace(',', '.')) 
    : vehicle.price;

  // Tabs atualizadas
  const TABS = ['Modelo', 'Exterior', 'Rodas', 'Interior'];

  const [activeTab, setActiveTab] = useState('Modelo');
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>('v1');
  const [transmission, setTransmission] = useState('Automático');
  const [copied, setCopied] = useState(false);

  const [currentImage, setCurrentImage] = useState(vehicle.image_url);
  const [exteriorImage, setExteriorImage] = useState(vehicle.image_url); 
  const [currentBgColor, setCurrentBgColor] = useState("#3e4146");
  const [colorName, setColorName] = useState("Cor Padrão");
  const [selectedColorThumb, setSelectedColorThumb] = useState(colorOptions[4].thumb); 

  const [interiorViewId, setInteriorViewId] = useState<string>('dash');
  
  const [selectedAccessories, setSelectedAccessories] = useState<string[]>([]);
  const [selectedWheelId, setSelectedWheelId] = useState('w1');

  useEffect(() => {
    setCurrentImage(vehicle.image_url);
    setExteriorImage(vehicle.image_url);
  }, [vehicle]);

  const formatMoney = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const selectedVersionObj = selectedVersionId === 'db-car' 
      ? { name: vehicle.model, price: basePrice }
      : mockVersions.find(v => v.id === selectedVersionId);
  
  const versionPrice = selectedVersionObj?.price || 0;
  const versionName = selectedVersionObj?.name || vehicle.model;

  const wheelPrice = mockWheels.find(w => w.id === selectedWheelId)?.price || 0;
  
  const accessoriesTotal = selectedAccessories.reduce((total, accName) => {
      const extItem = mockExteriorAccessories.find(i => i.name === accName);
      const intItem = mockInteriorAccessories.find(i => i.name === accName);
      return total + (extItem?.price || intItem?.price || 0);
  }, 0);

  const currentPrice = versionPrice + accessoriesTotal + wheelPrice;

  // Handlers
  const toggleAccessory = (name: string) => {
      setSelectedAccessories(prev => 
          prev.includes(name) ? prev.filter(i => i !== name) : [...prev, name]
      );
  };

  const handleTabChange = (tab: string) => {
      setActiveTab(tab);
      if (tab === 'Interior') {
          setInteriorViewId('dash');
      } else {
          setCurrentImage(exteriorImage);
      }
  };

  const handleColorChange = (color: typeof colorOptions[0]) => {
      setCurrentImage(color.image);
      setExteriorImage(color.image);
      setCurrentBgColor(color.bgColor);
      setColorName(color.name);
      setSelectedColorThumb(color.thumb);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNextStep = () => {
      if (activeTab === 'Modelo') setActiveTab('Exterior');
      else if (activeTab === 'Exterior') setActiveTab('Rodas');
      else if (activeTab === 'Rodas') handleTabChange('Interior');
      else if (activeTab === 'Interior') setActiveTab('Resumo');
  };

  const currentInteriorUrl = interiorViews.find(v => v.id === interiorViewId)?.url;

  // --- MODO RESUMO ---
  if (activeTab === 'Resumo') {
      return (
        <div className="fixed inset-0 z-[9999] bg-white font-sans overflow-y-auto animate-in fade-in duration-500 flex flex-col">
            
            {/* Header Resumo */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-50 px-8 py-4 flex justify-between items-center shadow-[0_2px_8px_rgba(0,0,0,0.05)] shrink-0">
                <div className="flex items-center gap-6">
                     <button onClick={() => setActiveTab('Interior')} className="hover:opacity-70 transition-opacity">
                        <ChevronLeft size={28} className="text-gray-900 stroke-[2]"/>
                     </button>
                     <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-tight">Seu {versionName}</h1>
                </div>
                {/* Ações */}
                <div className="flex items-center gap-6 text-gray-700">
                    <button className="flex flex-col items-center gap-1 hover:text-black transition-colors group">
                        <Download size={20} className="stroke-[2] group-hover:scale-110 transition-transform"/>
                        <span className="text-[10px] font-bold uppercase tracking-widest">Baixar</span>
                    </button>
                    <button className="flex flex-col items-center gap-1 hover:text-black transition-colors group">
                        <Save size={20} className="stroke-[2] group-hover:scale-110 transition-transform"/>
                        <span className="text-[10px] font-bold uppercase tracking-widest">Salvar</span>
                    </button>
                    <button className="flex flex-col items-center gap-1 hover:text-black transition-colors group">
                        <Mail size={20} className="stroke-[2] group-hover:scale-110 transition-transform"/>
                        <span className="text-[10px] font-bold uppercase tracking-widest">Enviar</span>
                    </button>
                </div>
            </div>

            {/* Conteúdo Resumo */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-[1400px] mx-auto p-8 pb-24">
                    
                    {/* Galeria de 3 Imagens */}
                    <div className="flex flex-col md:flex-row gap-4 mb-16">
                        <div className="md:w-1/2 bg-gray-100 rounded-lg overflow-hidden relative group aspect-video">
                            <img src={exteriorImage} alt="Exterior" className="w-full h-full object-cover object-center scale-105 group-hover:scale-110 transition-transform duration-700" />
                            <span className="absolute bottom-4 left-4 text-xs font-bold uppercase text-gray-900 bg-white/90 px-3 py-1 rounded">Exterior</span>
                        </div>
                        <div className="md:w-1/2 flex flex-col md:flex-row gap-4">
                            <div className="flex-1 bg-gray-100 rounded-lg overflow-hidden relative group aspect-video md:aspect-auto">
                                <img src={INTERIOR_DASH_URL} alt="Painel" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                <span className="absolute bottom-4 left-4 text-xs font-bold uppercase text-gray-900 bg-white/90 px-3 py-1 rounded">Painel</span>
                            </div>
                            <div className="flex-1 bg-gray-100 rounded-lg overflow-hidden relative group aspect-video md:aspect-auto">
                                <img src={INTERIOR_SEATS_URL} alt="Bancos" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                <span className="absolute bottom-4 left-4 text-xs font-bold uppercase text-gray-900 bg-white/90 px-3 py-1 rounded">Interior</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-16 items-start">
                        {/* Detalhes Esquerda */}
                        <div className="flex-1 w-full space-y-10">
                            <div className="mb-10 relative">
                                <h2 className="text-3xl font-light text-gray-900 uppercase tracking-tight inline-block border-b-4 border-[#c6a95e] pb-1">
                                    Resumo da configuração
                                </h2>
                            </div>
                            
                            {/* Versão */}
                            <div className="flex gap-6 items-center pb-8 border-b border-gray-100">
                                <div className="w-28 h-24 rounded-lg bg-gray-50 p-2 border border-gray-200 flex items-center justify-center">
                                    <img src={exteriorImage} className="w-full h-auto object-contain" alt="Carro" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-base font-bold text-gray-900 uppercase tracking-wider mb-1">Versão</p>
                                    <p className="text-2xl font-light text-gray-600">{versionName}</p>
                                </div>
                                <div className="text-xl font-bold text-gray-900">{formatMoney(versionPrice)}</div>
                            </div>

                            {/* Cor */}
                            <div className="flex gap-6 items-center pb-8 border-b border-gray-100">
                                <div className="w-28 h-24 rounded-lg border border-gray-200 shadow-sm" style={{ background: selectedColorThumb }}></div>
                                <div className="flex-1">
                                    <p className="text-base font-bold text-gray-900 uppercase tracking-wider mb-1">Cor</p>
                                    <p className="text-2xl font-light text-gray-600">{colorName}</p>
                                </div>
                                <div className="text-base font-bold text-gray-500 uppercase tracking-wider">Padrão</div>
                            </div>

                            {/* Roda Selecionada */}
                            <div className="flex gap-6 items-center pb-8 border-b border-gray-100">
                                <div className="w-28 h-24 rounded-lg bg-gray-100 border border-gray-200 shadow-sm flex items-center justify-center text-gray-500">
                                     <Disc size={40} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-base font-bold text-gray-900 uppercase tracking-wider mb-1">Rodas</p>
                                    <p className="text-xl font-light text-gray-600">
                                        {mockWheels.find(w => w.id === selectedWheelId)?.name}
                                    </p>
                                </div>
                                <div className="text-xl font-bold text-gray-900">
                                    {mockWheels.find(w => w.id === selectedWheelId)?.price ? formatMoney(mockWheels.find(w => w.id === selectedWheelId)?.price!) : 'Incluso'}
                                </div>
                            </div>

                            {/* Acessórios */}
                            {selectedAccessories.length > 0 && (
                                <div className="pt-4">
                                    <p className="text-base font-bold text-gray-900 uppercase tracking-wider mb-6">Acessórios</p>
                                    {selectedAccessories.map(accName => {
                                        const item = [...mockExteriorAccessories, ...mockInteriorAccessories].find(i => i.name === accName);
                                        return (
                                            <div key={accName} className="flex gap-6 items-center pb-6 border-b border-gray-100 last:border-0">
                                                <div className="w-24 h-24 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-200 text-gray-400">
                                                    {item && <item.icon size={32} strokeWidth={1.5} />}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-xl font-light text-gray-700">{accName}</p>
                                                </div>
                                                <div className="text-xl font-bold text-gray-900">
                                                    {item ? formatMoney(item.price) : '-'}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Sidebar Direita Resumo */}
                        <div className="lg:w-[400px] shrink-0 lg:sticky lg:top-28">
                            <div className="bg-gray-50 p-8 rounded-sm shadow-sm border border-gray-100">
                                <h3 className="text-lg font-bold text-gray-900 uppercase tracking-widest mb-10 text-center">Valor Total Estimado</h3>
                                
                                <div className="space-y-4 mb-8 pb-8 border-b border-gray-200">
                                    <div className="flex justify-between items-center text-base text-gray-600 font-medium">
                                        <span>Preço base</span>
                                        <span>{formatMoney(versionPrice)}</span>
                                    </div>
                                    {(accessoriesTotal + wheelPrice) > 0 && (
                                        <div className="flex justify-between items-center text-base text-gray-600 font-medium">
                                            <span>Opcionais / Acessórios</span>
                                            <span>{formatMoney(accessoriesTotal + wheelPrice)}</span>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="text-center mb-10">
                                    <span className="block text-5xl font-bold text-gray-900 tracking-tight">{formatMoney(currentPrice)}</span>
                                </div>

                                <div className="space-y-4">
                                    <button className="w-full py-5 bg-black text-white font-bold text-sm uppercase tracking-widest hover:bg-gray-900 transition-colors flex items-center justify-center gap-2 shadow-lg">
                                        Enviar proposta para concessionária
                                    </button>
                                    <button className="w-full py-5 bg-white border-2 border-gray-300 text-gray-900 font-bold text-sm uppercase tracking-widest hover:border-black transition-colors flex items-center justify-center gap-2">
                                        Simule o financiamento
                                    </button>
                                </div>

                                <p className="text-[10px] text-gray-400 text-center leading-relaxed mt-8 font-medium">
                                    * O preço demonstrado é sugerido e pode variar de acordo com as concessionárias. Frete não incluso. Imagens meramente ilustrativas.
                                </p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
      );
  }

  // --- RENDERIZAÇÃO PRINCIPAL (BUILDER) ---
  return (
    <div className="fixed inset-0 z-[9999] bg-white flex flex-col lg:flex-row font-sans overflow-hidden">
      
      {/* CSS PARA A ANIMAÇÃO */}
      <style jsx global>{`
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
      `}</style>

      {/* Visualizador */}
      <div 
        className={`lg:w-[75%] w-full h-[40vh] lg:h-full relative transition-colors duration-1000 ease-in-out ${activeTab === 'Interior' ? 'bg-black' : 'flex items-center justify-center'}`}
        style={{ backgroundColor: activeTab === 'Interior' ? '#000' : currentBgColor }}
      >
        <div className="absolute top-10 left-0 right-0 flex justify-center opacity-30 pointer-events-none z-20">
             <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Chevrolet_logo_2013.png/640px-Chevrolet_logo_2013.png" alt="Chevy" className="h-12 object-contain grayscale brightness-200" />
        </div>

        {activeTab === 'Interior' ? (
            <img key={interiorViewId} src={currentInteriorUrl || "/placeholder-car.png"} alt="Interior" className="absolute inset-0 w-full h-full object-cover z-0 animate-in fade-in slide-in-from-right-6 duration-700 ease-in-out"/>
        ) : (
            <div className="relative w-full max-w-7xl px-4 flex justify-center z-10">
                 <img src={currentImage || "/placeholder-car.png"} alt={vehicle.model} className="w-[85%] lg:w-full h-auto object-contain drop-shadow-2xl transition-all duration-700 animate-in fade-in zoom-in duration-500 lg:scale-110"/>
            </div>
        )}

        {activeTab !== 'Interior' && (
            <div className="absolute bottom-10 left-10 flex gap-2 z-10">
                <button className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-md transition-all border border-white/10"><ChevronLeft size={24} /></button>
                <button className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-md transition-all border border-white/10"><ChevronRight size={24} /></button>
            </div>
        )}
      </div>

      {/* Sidebar Direita */}
      <div className="lg:w-[25%] w-full h-full bg-white flex flex-col border-l border-gray-200 shadow-2xl z-40 relative">
        <div className="px-8 pt-8 pb-0 bg-white">
            <div className="flex gap-6 text-base font-bold text-gray-400 mb-8 border-b border-gray-200 overflow-x-auto no-scrollbar">
                {TABS.map((tab) => (
                    <button 
                        key={tab}
                        onClick={() => handleTabChange(tab)}
                        className={`pb-3 border-b-2 transition-colors whitespace-nowrap ${activeTab === tab ? 'text-black border-black' : 'border-transparent hover:text-gray-600'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <h1 className="text-5xl font-light text-gray-900 tracking-tight mb-8">Seu Onix</h1>
            
            {activeTab === 'Modelo' && (
                <div className="mb-8 animate-in fade-in slide-in-from-bottom-2">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Transmissão</h3>
                    <div className="flex gap-4">
                        <button onClick={() => setTransmission('Automático')} className={`flex-1 py-4 text-base font-semibold rounded border ${transmission === 'Automático' ? 'border-black text-black border-2' : 'border-gray-300 text-gray-500 hover:border-gray-400'}`}>Automático</button>
                        <button onClick={() => setTransmission('Manual')} className={`flex-1 py-4 text-base font-semibold rounded border ${transmission === 'Manual' ? 'border-black text-black border-2' : 'border-gray-300 text-gray-500 hover:border-gray-400'}`}>Manual</button>
                    </div>
                </div>
            )}
        </div>

        <div className="flex-1 overflow-y-auto px-8 pb-4 custom-scrollbar">
            
            {/* 1. ABA MODELO */}
            {activeTab === 'Modelo' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xl font-bold text-gray-900">Versões</span>
                        <button className="flex items-center gap-1 text-sm font-bold text-gray-500 hover:text-black transition-colors"><ArrowRightLeft size={14} /> Comparar</button>
                    </div>
                    {mockVersions.map((ver, index) => (
                        <div 
                            key={ver.id} 
                            onClick={() => setSelectedVersionId(ver.id)} 
                            className={`cursor-pointer rounded-lg p-6 transition-all duration-200 relative group bg-white 
                                ${selectedVersionId === ver.id ? 'border-[2px] border-black' : 'border border-gray-300 hover:border-gray-400'}`}
                            style={{ 
                                animation: `fadeInUp 0.4s ease-out forwards`,
                                animationDelay: `${index * 100}ms`,
                                opacity: 0 // Começa invisível e animação revela
                            }}
                        >
                            <div className="flex justify-between items-start mb-2"><span className={`text-lg font-bold ${selectedVersionId === ver.id ? 'text-gray-900' : 'text-gray-800'}`}>{ver.name}</span><span className="text-lg font-bold text-gray-900">{formatMoney(ver.price)}</span></div>
                            <div className="flex items-center gap-2 text-gray-500"><p className="text-sm font-medium">{ver.features}</p><Info size={14} className="text-gray-400" /></div>
                        </div>
                    ))}
                </div>
            )}

            {/* 2. ABA EXTERIOR */}
            {activeTab === 'Exterior' && (
                <div className="animate-in slide-in-from-right-4 duration-300 space-y-8">
                     <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Cores do exterior</h3>
                        <div className="flex gap-4 items-center mb-4"><span className="text-lg font-bold text-gray-700">{colorName}</span><span className="text-base font-semibold text-gray-400 ml-auto">Padrão</span></div>
                        <div className="flex flex-wrap gap-4">
                            {colorOptions.map((color) => (
                                <button key={color.name} onClick={() => handleColorChange(color)} className={`w-12 h-12 rounded-full shadow-sm border-2 transition-all hover:scale-110 ${colorName === color.name ? 'ring-2 ring-offset-2 ring-black border-transparent' : 'border-white ring-1 ring-gray-200'}`} style={{ backgroundColor: color.hex }} title={color.name}/>
                            ))}
                        </div>
                     </div>
                     <div className="pt-6 border-t border-gray-100">
                        <h3 className="text-xl font-bold text-gray-900 mb-6">Acessórios Externos</h3>
                        <div className="space-y-4">
                             {mockExteriorAccessories.map((acc, index) => {
                                 const isSelected = selectedAccessories.includes(acc.name);
                                 return (
                                 <div 
                                    key={index} 
                                    onClick={() => toggleAccessory(acc.name)} 
                                    className={`flex gap-4 items-center bg-white p-4 rounded-lg border transition-all cursor-pointer ${isSelected ? 'border-[2px] border-black' : 'border-gray-200 hover:border-gray-400'}`}
                                    style={{ 
                                        animation: `fadeInUp 0.4s ease-out forwards`,
                                        animationDelay: `${index * 100}ms`,
                                        opacity: 0
                                    }}
                                 >
                                     <div className="w-16 h-16 bg-gray-100 rounded-md shrink-0 flex items-center justify-center text-gray-500"><acc.icon size={28} /></div>
                                     <div className="flex-1"><p className="text-base font-bold text-gray-900 uppercase mb-1">{acc.name}</p><p className="text-base text-gray-600 font-medium">{formatMoney(acc.price)}</p></div>
                                     <div className={`transition-all ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}><div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'bg-black text-white border-black' : 'border-gray-300 text-gray-400'}`}>{isSelected ? <Check size={14} strokeWidth={4} /> : '+'}</div></div>
                                 </div>
                                 )
                             })}
                        </div>
                     </div>
                </div>
            )}

            {/* 3. ABA RODAS */}
            {activeTab === 'Rodas' && (
                <div className="space-y-8 pb-20">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-xl font-bold text-gray-900">Escolha suas Rodas</h3>
                    </div>
                    
                    <div className="space-y-4">
                        {mockWheels.map((wheel, index) => {
                            const isSelected = selectedWheelId === wheel.id;
                            return (
                                <div 
                                    key={wheel.id}
                                    onClick={() => setSelectedWheelId(wheel.id)}
                                    className={`flex gap-4 items-center bg-white p-4 rounded-lg border transition-all cursor-pointer group
                                        ${isSelected ? 'border-[2px] border-black' : 'border-gray-200 hover:border-gray-400'}`}
                                    style={{ 
                                        animation: `fadeInUp 0.4s ease-out forwards`,
                                        animationDelay: `${index * 100}ms`,
                                        opacity: 0
                                    }}
                                >
                                    <div className="w-20 h-20 bg-gray-100 rounded-md shrink-0 flex items-center justify-center text-gray-500 relative overflow-hidden">
                                        <div className={`absolute inset-0 bg-cover bg-center opacity-80 ${index === 0 ? "bg-[url('https://chevrolet.com.br/content/dam/chevrolet/mercosur/brazil/portuguese/index/cars/2024-onix-plus/mov/01-images/rodas-aro-16-preto.jpg?imwidth=200')]" : "bg-gray-300"}`}></div>
                                        <wheel.icon size={32} className="relative z-10 text-black/50" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-base font-bold text-gray-900 uppercase mb-1 leading-tight">{wheel.name}</p>
                                        <p className="text-base text-gray-600 font-medium">{wheel.price === 0 ? 'Incluso' : `+ ${formatMoney(wheel.price)}`}</p>
                                    </div>
                                    <div className="flex items-center justify-center">
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'bg-black text-white border-black' : 'border-gray-300 text-gray-400'}`}>{isSelected ? <Check size={14} strokeWidth={4} /> : ''}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            
            {/* 4. ABA INTERIOR */}
            {activeTab === 'Interior' && (
                <div className="space-y-8">
                     <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Visualização</h3>
                        <div className="flex gap-4">
                            {interiorViews.map((view) => (
                                <button key={view.id} onClick={() => setInteriorViewId(view.id)} className={`flex items-center gap-3 px-4 py-3 rounded border transition-all ${interiorViewId === view.id ? 'border-black bg-gray-50 border-2' : 'border-gray-200 hover:border-gray-300'}`}>
                                    <div className="w-10 h-8 bg-gray-200 rounded overflow-hidden shrink-0"><img src={view.url} alt={view.name} className="w-full h-full object-cover" /></div>
                                    <span className="text-sm font-bold uppercase text-gray-900">{view.name}</span>
                                </button>
                            ))}
                        </div>
                     </div>

                     <div className="pt-6 border-t border-gray-100">
                        <h3 className="text-xl font-bold text-gray-900 mb-6">Opcionais Internos</h3>
                        <div className="space-y-4">
                             {mockInteriorAccessories.map((acc, index) => {
                                 const isSelected = selectedAccessories.includes(acc.name);
                                 return (
                                 <div 
                                    key={index} 
                                    onClick={() => toggleAccessory(acc.name)} 
                                    className={`flex gap-4 items-center bg-white p-4 rounded-lg border transition-all cursor-pointer ${isSelected ? 'border-[2px] border-black' : 'border-gray-200 hover:border-gray-400'}`}
                                    style={{ 
                                        animation: `fadeInUp 0.4s ease-out forwards`,
                                        animationDelay: `${index * 100}ms`,
                                        opacity: 0
                                    }}
                                 >
                                     <div className="w-16 h-16 bg-gray-100 rounded-md shrink-0 flex items-center justify-center text-gray-500"><Info size={28} /></div>
                                     <div className="flex-1"><p className="text-base font-bold text-gray-900 uppercase mb-1">{acc.name}</p><p className="text-base text-gray-600 font-medium">{formatMoney(acc.price)}</p></div>
                                     <div className={`transition-all ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}><div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'bg-black text-white border-black' : 'border-gray-300 text-gray-400'}`}>{isSelected ? <Check size={14} strokeWidth={4} /> : '+'}</div></div>
                                 </div>
                                 )
                             })}
                        </div>
                     </div>
                </div>
            )}

            <div className="mt-8 pt-4 border-t border-gray-100">
                <button className="w-full flex justify-between items-center py-5 border-b border-gray-100 text-base font-bold text-gray-600 hover:text-black transition-colors group"><span>Baixar</span><ChevronRightIcon size={20} className="text-gray-400 group-hover:text-black"/></button>
                <button onClick={handleShare} className="w-full flex justify-between items-center py-5 border-b border-gray-100 text-base font-bold text-gray-600 hover:text-black transition-colors group"><span>{copied ? "Link Copiado!" : "Compartilhar"}</span><ChevronRightIcon size={20} className="text-gray-400 group-hover:text-black"/></button>
            </div>
        </div>

        <div className="p-8 border-t border-gray-200 bg-white z-20">
            <div className="flex justify-between items-end">
                <div className="flex flex-col">
                    <span className="text-gray-500 text-base font-bold mb-1">Forma de pagamento</span>
                    <span className="text-3xl font-light text-gray-900 border-b-2 border-gray-900 pb-0.5 inline-block cursor-pointer hover:border-black transition-colors leading-none">{formatMoney(currentPrice)}<sup className="text-sm font-bold ml-1">1</sup></span>
                </div>
                <button onClick={handleNextStep} className="bg-black text-white w-14 h-14 rounded flex items-center justify-center hover:bg-gray-800 transition-all shadow-md group active:scale-95"><ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" /></button>
            </div>
        </div>

      </div>
    </div>
  );
}