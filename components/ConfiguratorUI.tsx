"use client";

import { useState, useRef } from "react"; // Removi o useEffect que causava loop
import { ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, Gauge, Armchair, Loader2, Info } from "lucide-react";
import { useRouter } from "next/navigation"; 

const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

interface ConfiguratorUIProps {
  currentCar: any;
  relatedCars: any[];
  selectedColor: any; setSelectedColor: (v:any)=>void;
  selectedWheel: any; setSelectedWheel: (v:any)=>void;
  selectedSeatType: any; setSelectedSeatType: (v:any)=>void;
  selectedAccs: string[]; toggleAccessory: (id:string)=>void;
  totalPrice: number;
  user: any;
  onFinish: () => void;
  isSwitchingCar: boolean;
}

export default function ConfiguratorUI({
  currentCar, relatedCars,
  selectedColor, setSelectedColor,
  selectedWheel, setSelectedWheel,
  selectedSeatType, setSelectedSeatType,
  selectedAccs, toggleAccessory,
  totalPrice, user, onFinish, isSwitchingCar
}: ConfiguratorUIProps) {

  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'Modelo' | 'Exterior' | 'Interior'>('Modelo');
  const [interiorView, setInteriorView] = useState<'dash' | 'seats'>('dash');
  const [viewIndex, setViewIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const viewsOrder = ['front', 'side', 'rear_angle', 'front_detail', 'rear'];
  const sidebarRef = useRef<HTMLDivElement>(null);
  
  const hasSeats = currentCar?.interior_images?.seats && currentCar.interior_images.seats !== currentCar.interior_images.dash;
  const extAccessories = currentCar?.accessories?.filter((a: any) => a.type === 'exterior') || [];
  const intAccessories = currentCar?.accessories?.filter((a: any) => a.type === 'interior') || [];

  const getFinalImageURL = () => {
    if (!currentCar) return '';
    if (activeTab === 'Interior') {
        return (interiorView === 'seats') ? (selectedSeatType?.image || currentCar?.interior_images?.seats) : currentCar?.interior_images?.dash;
    }
    const currentView = viewsOrder[viewIndex];
    if (selectedColor?.images?.[currentView]) return selectedColor.images[currentView];
    if (currentCar?.image_views?.[currentView]) return currentCar.image_views[currentView];
    if (selectedColor?.image) return selectedColor.image;
    return currentCar?.image_url;
  };
  
  const finalImage = getFinalImageURL();

  // --- ARQUIVO CORRIGIDO: REMOVIDO O useEffect QUE CAUSAVA LOOP ---
  // O controle de 'imageLoaded' agora é feito nos eventos de clique.

  // --- BOTÃO VOLTAR BLINDADO ---
  const handleBack = () => {
    try {
        router.push('/');
    } catch {
        window.location.href = '/'; 
    }
  };

  // Funções auxiliares para resetar o loading manualmente ao trocar opções
  const handleColorChange = (color: any) => {
      if (selectedColor?.name !== color.name) {
          setImageLoaded(false); 
          setSelectedColor(color);
          setViewIndex(0);
      }
  }

  const handleSeatChange = (seat: any) => {
      if (selectedSeatType?.id !== seat?.id) {
          // Não precisa resetar loading se for só troca de banco, 
          // mas se mudar a view sim.
          setSelectedSeatType(seat); 
          if (interiorView !== 'seats') {
              setImageLoaded(false);
              setInteriorView('seats');
          }
      }
  }

  const handleInteriorViewChange = (view: 'dash' | 'seats') => {
      if (interiorView !== view) {
          setImageLoaded(false);
          setInteriorView(view);
      }
  }

  const rotateCar = (dir: 'next' | 'prev') => {
      setImageLoaded(false); 
      if (dir === 'next') setViewIndex((prev) => (prev + 1) % viewsOrder.length);
      else setViewIndex((prev) => (prev - 1 + viewsOrder.length) % viewsOrder.length);
  };

  const handleNext = () => {
    if (activeTab === 'Modelo') setActiveTab('Exterior');
    else if (activeTab === 'Exterior') {
        setImageLoaded(false); // Vai trocar para interior -> nova imagem -> loading
        setActiveTab('Interior');
    }
    else if (activeTab === 'Interior') onFinish();
  };

  const handleTabChange = (tab: any) => {
      if (activeTab !== tab) {
          // Se entrar ou sair do interior, a imagem muda drasticamente
          if (tab === 'Interior' || activeTab === 'Interior') setImageLoaded(false);
          setActiveTab(tab);
      }
  }

  return (
    <div className="fixed inset-0 z-[2000] flex flex-col lg:flex-row h-screen w-full overflow-hidden font-sans bg-white animate-in fade-in duration-500">
      
      {/* 1. ÁREA VISUAL (ESQUERDA) */}
      <div className="lg:w-[75%] w-full h-[50vh] lg:h-full bg-[#1a1a1a] relative flex items-center justify-center overflow-hidden group">
        
        <div className={`absolute inset-0 z-50 bg-[#1a1a1a]/80 backdrop-blur-sm flex items-center justify-center transition-opacity duration-500 pointer-events-none ${isSwitchingCar ? 'opacity-100' : 'opacity-0'}`}>
            <Loader2 className="animate-spin text-white w-8 h-8" />
        </div>

        {selectedColor && activeTab !== 'Interior' && (
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden animate-in fade-in duration-1000">
                <div className="w-full h-full transition-colors duration-1000 ease-in-out opacity-20 blur-[120px] scale-150 transform-gpu" style={{ backgroundColor: selectedColor.hex }}></div>
            </div>
        )}

        <button onClick={handleBack} className="absolute top-8 left-6 z-30 text-white/50 hover:text-white flex items-center gap-2 text-sm font-bold uppercase tracking-widest transition-all hover:-translate-x-1">
            <ArrowLeft size={16}/> Voltar
        </button>

        <div className="absolute top-6 left-0 right-0 flex justify-center z-20 pointer-events-none">
            <img src="https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/chevrolet-logo.svg" alt="Chevy" className="h-8 object-contain drop-shadow-lg opacity-80"/>
        </div>

        <div className={`w-full h-full flex items-center justify-center relative overflow-hidden transition-all duration-700 ease-in-out z-10 ${activeTab === 'Interior' ? 'p-0' : 'p-12 lg:p-32'}`}>
             <div className={`relative w-full h-full flex items-center justify-center transition-all duration-700 ease-out transform drop-shadow-2xl ${activeTab === 'Interior' ? 'scale-105' : 'scale-100'}`}>
                
                {/* Loader de Imagem */}
                {!imageLoaded && !isSwitchingCar && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="animate-spin text-white/20 w-10 h-10" />
                    </div>
                )}
                
                <img 
                    key={finalImage} // Força recriar o elemento img quando a URL muda
                    src={finalImage} 
                    alt="Car View" 
                    onLoad={() => setImageLoaded(true)} 
                    className={`absolute inset-0 w-full h-full object-contain z-10 select-none pointer-events-none transition-all duration-700 ease-out ${imageLoaded && !isSwitchingCar ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-95 blur-sm'}`} 
                />
            </div>
        </div>

        {activeTab !== 'Interior' && (
            <div className="absolute bottom-8 left-8 flex gap-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button onClick={() => rotateCar('prev')} className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-md transition-all hover:scale-110 active:scale-95 border border-white/5"><ChevronLeft size={20} /></button>
                <button onClick={() => rotateCar('next')} className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-md transition-all hover:scale-110 active:scale-95 border border-white/5"><ChevronRight size={20} /></button>
                <div className="ml-4 flex gap-1 items-center">{viewsOrder.map((_, i) => (<div key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === viewIndex ? 'bg-white scale-150' : 'bg-white/30'}`} />))}</div>
            </div>
        )}
      </div>

      {/* 2. BARRA LATERAL (DIREITA) */}
      <div className="lg:w-[25%] w-full h-full bg-white flex flex-col border-l border-gray-200 shadow-2xl z-30 animate-in slide-in-from-right duration-700">
         
         <div className="p-6 border-b border-gray-100 bg-white z-20">
            {user ? (
                <div className="flex items-center gap-2 mb-4 animate-in fade-in slide-in-from-top-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="text-xs font-bold text-green-700 uppercase tracking-wide">Vendedor: {user.email.split('@')[0]}</span>
                </div>
            ) : <span className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4 block">Modo Visitante</span>}
            
            <div className="flex gap-6 mt-2 text-sm font-bold text-gray-400">
                {['Modelo', 'Exterior', 'Interior'].map((tab: any) => (
                    <button key={tab} onClick={() => handleTabChange(tab)} className={`pb-2 border-b-2 transition-all duration-300 ${activeTab === tab ? 'text-black border-black' : 'border-transparent hover:text-gray-600'}`}>{tab}</button>
                ))}
            </div>
         </div>

         <div ref={sidebarRef} className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar relative">
            <div key={activeTab} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* --- ABA MODELO --- */}
                {activeTab === 'Modelo' && (
                    <div>
                        <h1 className="text-3xl font-bold mb-2 tracking-tight">{currentCar.model_name}</h1>
                        <p className="text-gray-500 text-sm mb-6 leading-relaxed">Selecione a versão que melhor se adapta ao seu estilo de vida.</p>
                        <div className="space-y-3">
                            {/* PROTEÇÃO: key usa ID ou index para não quebrar com dados ruins */}
                            {relatedCars.map((car, i) => (
                                <div key={car.id || i} onClick={() => router.push(`/configurador?id=${car.id}`)} className={`cursor-pointer border rounded-xl p-4 transition-all duration-200 relative group ${currentCar.id === car.id ? 'border-black ring-1 ring-black bg-gray-50 shadow-md' : 'hover:border-gray-400 hover:shadow-sm'}`}>
                                    <div className="flex justify-between font-bold text-sm mb-1">
                                        <span className="group-hover:translate-x-1 transition-transform">{car.model_name}</span>
                                        <span>{formatMoney(car.price_start)}</span>
                                    </div>
                                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Ver detalhes</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- ABA EXTERIOR --- */}
                {activeTab === 'Exterior' && (
                    <div className="space-y-10">
                        {/* Cores */}
                        <div>
                            <h3 className="font-bold mb-3 text-sm flex justify-between">Cores <span className="text-gray-400 font-normal">{selectedColor?.name}</span></h3>
                            <div className="flex flex-wrap gap-3">
                                {/* PROTEÇÃO: key usa nome ou index */}
                                {currentCar.exterior_colors?.map((c:any, i:number) => (
                                    <button 
                                        key={c.name || i} 
                                        onClick={() => handleColorChange(c)} 
                                        className={`w-12 h-12 rounded-full border-2 shadow-sm transition-all duration-300 hover:scale-110 ${selectedColor?.name === c.name ? 'ring-2 ring-offset-2 ring-blue-600 scale-110 border-white' : 'border-gray-100 hover:border-gray-300'}`} 
                                        style={{backgroundColor: c.hex}} 
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Rodas */}
                        <div className="border-t border-gray-100 pt-8">
                            <h3 className="font-bold mb-4 text-sm">Rodas</h3>
                            <div className="space-y-4">
                                {/* PROTEÇÃO: key usa ID ou index */}
                                {currentCar.wheels?.map((w:any, i:number) => (
                                    <div key={w.id || i} onClick={() => setSelectedWheel(w)} className={`flex items-center gap-4 p-3 border rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${selectedWheel?.id === w.id ? 'border-black ring-1 ring-black bg-gray-50' : 'border-gray-200'}`}>
                                        <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center border border-gray-100 shrink-0">
                                            <img src={w.image} className="w-full h-full object-contain mix-blend-multiply p-1"/> 
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className="text-sm font-bold block leading-tight mb-1">{w.name}</span>
                                            <span className="text-xs font-bold text-gray-500">{(w.price || 0) === 0 ? 'Incluso' : `+ ${formatMoney(w.price)}`}</span>
                                        </div>
                                        {selectedWheel?.id === w.id && <Check size={16} className="text-black"/>}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Acessórios Externos */}
                        <div className="border-t border-gray-100 pt-8">
                            <h3 className="font-bold mb-4 text-sm">Acessórios</h3>
                            <div className="space-y-4">
                                {/* PROTEÇÃO: key usa ID ou index */}
                                {extAccessories.length > 0 ? extAccessories.map((acc:any, i:number) => (
                                    <div key={acc.id || i} onClick={() => toggleAccessory(acc.id)} className={`flex gap-4 cursor-pointer p-3 border rounded-xl transition-all duration-200 hover:shadow-sm ${selectedAccs.includes(acc.id) ? 'bg-gray-50 ring-1 ring-black border-black' : 'border-gray-200 hover:border-gray-300'}`}>
                                        <div className="w-24 h-16 bg-white rounded-lg border border-gray-200 overflow-hidden shrink-0">
                                            <img src={acc.image} className="w-full h-full object-cover" alt={acc.name} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-900 truncate">{acc.name}</p>
                                            <p className="text-xs font-bold text-gray-500 flex items-center gap-1 mt-1">R$ {acc.price} <Info size={12} className="text-gray-400"/></p>
                                        </div>
                                        <div className={`w-6 h-6 rounded-full border flex items-center justify-center self-center transition-colors ${selectedAccs.includes(acc.id) ? 'bg-black border-black' : 'border-gray-300'}`}>
                                            {selectedAccs.includes(acc.id) ? <Check size={12} className="text-white"/> : <span className="text-xs text-gray-400">+</span>}
                                        </div>
                                    </div>
                                )) : <p className="text-xs text-gray-400 italic">Nenhum acessório disponível.</p>}
                            </div>
                        </div>
                    </div>
                )}

                {/* --- ABA INTERIOR --- */}
                {activeTab === 'Interior' && (
                    <div className="space-y-8">
                        <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                            <button onClick={() => handleInteriorViewChange('dash')} className={`flex-1 py-2 px-3 rounded-md text-xs font-bold transition-all shadow-sm ${interiorView === 'dash' ? 'bg-white text-black shadow' : 'text-gray-500 hover:text-black'}`}><Gauge size={16} className="mx-auto mb-1"/> Painel</button>
                            {hasSeats && <button onClick={() => handleInteriorViewChange('seats')} className={`flex-1 py-2 px-3 rounded-md text-xs font-bold transition-all shadow-sm ${interiorView === 'seats' ? 'bg-white text-black shadow' : 'text-gray-500 hover:text-black'}`}><Armchair size={16} className="mx-auto mb-1"/> Bancos</button>}
                        </div>

                        {/* Acabamento Bancos */}
                        <div className="border-t border-gray-100 pt-6">
                            <h3 className="font-bold mb-4 text-sm">Acabamento</h3>
                            <div className="space-y-4">
                                <div onClick={() => {setSelectedSeatType(null); handleInteriorViewChange('seats');}} className={`cursor-pointer border rounded-xl p-3 flex gap-4 items-center transition-all ${selectedSeatType === null ? 'border-black ring-1 ring-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200 shrink-0 overflow-hidden">
                                        <img src={currentCar.interior_images?.seats || currentCar.interior_images?.dash} className="w-full h-full object-cover opacity-80" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-900 leading-tight mb-1">Padrão de Série</p>
                                        <p className="text-xs font-bold text-gray-500">Incluso</p>
                                    </div>
                                    {selectedSeatType === null && <Check size={16} className="text-black"/>}
                                </div>

                                {/* PROTEÇÃO: key usa ID ou index */}
                                {currentCar.seat_types?.map((s:any, i:number) => (
                                    <div key={s.id || i} onClick={() => handleSeatChange(s)} className={`cursor-pointer border rounded-xl p-3 flex gap-4 items-center transition-all ${selectedSeatType?.id === s.id ? 'border-black ring-1 ring-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                        <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center border border-gray-200 shrink-0 overflow-hidden">
                                            <img src={s.image} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-900 leading-tight mb-1">{s.name}</p>
                                            <p className="text-xs font-bold text-gray-500">{(s.price || 0) === 0 ? 'Incluso' : `+ ${formatMoney(s.price)}`}</p>
                                        </div>
                                        {selectedSeatType?.id === s.id && <Check size={16} className="text-black"/>}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Acessórios Internos */}
                        <div className="border-t border-gray-100 pt-6">
                            <h3 className="font-bold mb-4 text-sm">Acessórios Internos</h3>
                            <div className="space-y-4">
                                {/* PROTEÇÃO: key usa ID ou index */}
                                {intAccessories.length > 0 ? intAccessories.map((acc:any, i:number) => (
                                    <div key={acc.id || i} onClick={() => toggleAccessory(acc.id)} className={`flex gap-4 cursor-pointer p-3 border rounded-xl transition-all duration-200 hover:shadow-sm ${selectedAccs.includes(acc.id) ? 'bg-gray-50 ring-1 ring-black border-black' : 'border-gray-200 hover:border-gray-300'}`}>
                                        <div className="w-24 h-16 bg-white rounded-lg border border-gray-200 overflow-hidden shrink-0">
                                            <img src={acc.image} className="w-full h-full object-cover" alt={acc.name} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-900 truncate">{acc.name}</p>
                                            <p className="text-xs font-bold text-gray-500 flex items-center gap-1 mt-1">R$ {acc.price} <Info size={12} className="text-gray-400"/></p>
                                        </div>
                                        <div className={`w-6 h-6 rounded-full border flex items-center justify-center self-center transition-colors ${selectedAccs.includes(acc.id) ? 'bg-black border-black' : 'border-gray-300'}`}>
                                            {selectedAccs.includes(acc.id) ? <Check size={12} className="text-white"/> : <span className="text-xs text-gray-400">+</span>}
                                        </div>
                                    </div>
                                )) : <p className="text-xs text-gray-400 italic">Nenhum acessório interno.</p>}
                            </div>
                        </div>
                    </div>
                )}
            </div>
         </div>

         {/* FOOTER PREÇO */}
         <div className="p-6 border-t border-gray-200 bg-gray-50 z-20">
             <div className="flex justify-between items-center">
                 <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Valor Estimado</p>
                    <p className="text-2xl font-bold text-gray-900 leading-none">{formatMoney(totalPrice)}</p>
                 </div>
                 <button 
                    onClick={handleNext} 
                    className="bg-black text-white px-8 py-4 rounded-xl font-bold text-xs uppercase hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 flex items-center gap-2 group"
                 >
                    {activeTab === 'Interior' ? 'FINALIZAR' : 'PRÓXIMO'} 
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform"/>
                 </button>
             </div>
         </div>
      </div>
    </div>
  );
}