"use client";

import { useState, useRef, useEffect, useMemo } from "react"; 
import { ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, Gauge, Armchair, Loader2, Info } from "lucide-react";
import { useRouter } from "next/navigation"; 

const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

interface ConfiguratorUIProps {
  currentCar: any;
  relatedCars: any[]; // Essas são as outras versões do banco
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
  
  // Define o câmbio inicial baseado no carro que carregou
  const initialTrans = currentCar.transmission_type === 'manual' ? 'Manual' : 'Automático';
  const [transmissionFilter, setTransmissionFilter] = useState<'Automático' | 'Manual'>(initialTrans);

  // --- 1. LÓGICA DE VERSÕES REAIS ---
  // Junta o carro atual com os relacionados para ter todas as opções
  // Filtra duplicatas pelo ID
  const allVersions = useMemo(() => {
      const all = [currentCar, ...relatedCars];
      const unique = all.filter((car, index, self) => 
        index === self.findIndex((t) => t.id === car.id)
      );
      // Ordena por preço
      return unique.sort((a, b) => a.price_start - b.price_start);
  }, [currentCar, relatedCars]);

  // --- 2. FILTRO POR CÂMBIO ---
  const filteredVersions = useMemo(() => {
      return allVersions.filter(car => {
          // Se o carro for 'both', ele aparece nas duas listas. Se não, tem que bater com o filtro.
          const carTrans = car.transmission_type || 'automatic'; // fallback
          if (carTrans === 'both') return true;
          return (transmissionFilter === 'Automático' && carTrans === 'automatic') ||
                 (transmissionFilter === 'Manual' && carTrans === 'manual');
      });
  }, [allVersions, transmissionFilter]);

  // Controle de imagem
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [displayedImage, setDisplayedImage] = useState(""); 
  const [nextImage, setNextImage] = useState(""); 

  const viewsOrder = ['front', 'side', 'rear_angle', 'front_detail', 'rear'];
  const sidebarRef = useRef<HTMLDivElement>(null);
  
  const hasSeats = currentCar?.interior_images?.seats && currentCar.interior_images.seats !== currentCar.interior_images.dash;
  const extAccessories = currentCar?.accessories?.filter((a: any) => a.type === 'exterior') || [];
  const intAccessories = currentCar?.accessories?.filter((a: any) => a.type === 'interior') || [];

  const getTargetImageURL = () => {
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

  useEffect(() => {
      const target = getTargetImageURL();
      if (target !== displayedImage) {
          setIsImageLoading(true);
          setNextImage(target);
      }
  }, [selectedColor, viewIndex, activeTab, interiorView, currentCar]);

  const handleImageLoad = () => {
      setDisplayedImage(nextImage);
      setIsImageLoading(false);
  };

  const handleBack = () => {
    try { router.push('/'); } catch { window.location.href = '/'; }
  };

  const handleColorChange = (color: any) => {
      if (selectedColor?.name !== color.name) {
          setSelectedColor(color);
          setViewIndex(0); 
      }
  }

  const handleSeatChange = (seat: any) => {
      if (selectedSeatType?.id !== seat?.id) {
          setSelectedSeatType(seat); 
          if (interiorView !== 'seats') setInteriorView('seats');
      }
  }

  const handleInteriorViewChange = (view: 'dash' | 'seats') => {
      if (interiorView !== view) setInteriorView(view);
  }

  const rotateCar = (dir: 'next' | 'prev') => {
      if (dir === 'next') setViewIndex((prev) => (prev + 1) % viewsOrder.length);
      else setViewIndex((prev) => (prev - 1 + viewsOrder.length) % viewsOrder.length);
  };

  const handleNext = () => {
    if (activeTab === 'Modelo') setActiveTab('Exterior');
    else if (activeTab === 'Exterior') setActiveTab('Interior');
    else if (activeTab === 'Interior') onFinish();
  };

  // --- 3. TROCA DE CARRO REAL ---
  const handleVersionClick = (carId: number) => {
      if (carId === currentCar.id) return; // Já está nele
      router.push(`/configurador?id=${carId}`); // Recarrega a página com o novo carro
  };

  const handleTransmissionSwitch = (type: 'Automático' | 'Manual') => {
      setTransmissionFilter(type);
  };

  return (
    <div className="fixed inset-0 z-[2000] flex flex-col lg:flex-row h-screen w-full overflow-hidden font-sans bg-white animate-in fade-in duration-500">
      
      {/* 1. ÁREA VISUAL (ESQUERDA) */}
      <div className="lg:w-[75%] w-full h-[50vh] lg:h-full relative flex items-center justify-center overflow-hidden group">
        
        <div className="absolute inset-0 z-0 bg-[#1a1a1a]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-800 via-[#1a1a1a] to-black opacity-80"></div>
            <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-black/80 to-transparent"></div>
            {selectedColor && activeTab !== 'Interior' && (
                <div className="absolute inset-0 transition-colors duration-[1500ms] ease-in-out opacity-10 blur-[150px]" style={{ backgroundColor: selectedColor.hex }}></div>
            )}
        </div>

        <div className={`absolute inset-0 z-50 bg-black/90 flex items-center justify-center transition-opacity duration-500 pointer-events-none ${isSwitchingCar ? 'opacity-100' : 'opacity-0'}`}>
            <Loader2 className="animate-spin text-white w-10 h-10" />
        </div>

        <button onClick={handleBack} className="absolute top-8 left-6 z-30 text-white/50 hover:text-white flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-all hover:-translate-x-1 hover:bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
            <ArrowLeft size={14}/> Voltar
        </button>

        <div className="absolute top-8 left-0 right-0 flex justify-center z-20 pointer-events-none">
            <img src="https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/chevrolet-logo.svg" alt="Chevy" className="h-6 object-contain opacity-60"/>
        </div>

        <div className={`w-full h-full flex items-center justify-center relative transition-all duration-700 ease-in-out z-10 ${activeTab === 'Interior' ? 'p-0 scale-110' : 'p-8 lg:p-24 scale-100'}`}>
             
             {/* --- CORREÇÃO AQUI: Adicionado || undefined para evitar src="" --- */}
             <img 
                src={displayedImage || undefined} 
                alt="Car View" 
                className={`absolute w-full h-full object-contain z-10 select-none pointer-events-none transition-all duration-700 ease-out ${isImageLoading ? 'opacity-0 scale-105 blur-sm' : 'opacity-100 scale-100 blur-0'}`} 
             />
             
             <img 
                src={nextImage || undefined} 
                alt="Loading View" 
                onLoad={handleImageLoad} 
                className="absolute w-full h-full object-contain z-0 opacity-0 pointer-events-none" 
             />
             
             {isImageLoading && <div className="absolute z-20"><Loader2 className="animate-spin text-white/30 w-12 h-12" /></div>}
        </div>

        {activeTab !== 'Interior' && (
            <div className="absolute bottom-10 flex gap-4 z-30 transition-all duration-500 transform translate-y-4 opacity-0 group-hover:opacity-100 group-hover:translate-y-0">
                <button onClick={() => rotateCar('prev')} className="bg-white/10 hover:bg-white text-white hover:text-black p-4 rounded-full backdrop-blur-md transition-all shadow-lg border border-white/10"><ChevronLeft size={24} /></button>
                <div className="bg-black/50 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-2 border border-white/10">
                    {viewsOrder.map((_, i) => (<div key={i} className={`w-2 h-2 rounded-full transition-all duration-500 ${i === viewIndex ? 'bg-white w-6' : 'bg-white/30'}`} />))}
                </div>
                <button onClick={() => rotateCar('next')} className="bg-white/10 hover:bg-white text-white hover:text-black p-4 rounded-full backdrop-blur-md transition-all shadow-lg border border-white/10"><ChevronRight size={24} /></button>
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
            
            <div className="flex justify-between mt-2 relative">
                {['Modelo', 'Exterior', 'Interior'].map((tab: any) => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-3 text-sm font-bold uppercase tracking-wide transition-all duration-300 relative ${activeTab === tab ? 'text-black' : 'text-gray-400 hover:text-gray-600'}`}>
                        {tab}
                        {activeTab === tab && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-black rounded-full animate-in zoom-in duration-300"/>}
                    </button>
                ))}
            </div>
         </div>

         <div ref={sidebarRef} className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar relative bg-gray-50/30">
            <div key={activeTab} className="animate-in fade-in slide-in-from-right-4 duration-500">
                
                {/* --- ABA MODELO --- */}
                {activeTab === 'Modelo' && (
                    <div>
                        {/* Nome do Carro (Ex: Onix, Cruze, Tracker) */}
                        <h1 className="text-4xl font-black mb-2 tracking-tighter uppercase italic">
                            {/* Tenta pegar apenas o primeiro nome para ser o "Modelo Família" */}
                            {currentCar.model_name.split(' ')[0]}
                        </h1>
                        
                        {/* SELETOR DE CÂMBIO */}
                        <div className="mb-8 p-1 bg-gray-200 rounded-xl flex">
                            <button 
                                onClick={() => handleTransmissionSwitch('Automático')}
                                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${transmissionFilter === 'Automático' ? 'bg-black text-white shadow-md' : 'text-gray-500 hover:text-black'}`}
                            >
                                Automático
                            </button>
                            <button 
                                onClick={() => handleTransmissionSwitch('Manual')}
                                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${transmissionFilter === 'Manual' ? 'bg-black text-white shadow-md' : 'text-gray-500 hover:text-black'}`}
                            >
                                Manual
                            </button>
                        </div>

                        <p className="text-gray-500 text-xs font-medium mb-4 leading-relaxed uppercase tracking-wide">
                            Versões ({transmissionFilter})
                        </p>
                        
                        {/* LISTA DE VERSÕES FILTRADAS (DO BANCO) */}
                        <div className="space-y-3">
                            {filteredVersions.length > 0 ? filteredVersions.map((car, i) => (
                                <div 
                                    key={car.id || i} 
                                    onClick={() => handleVersionClick(car.id)} 
                                    className={`cursor-pointer border-2 rounded-2xl p-5 transition-all duration-300 relative group overflow-hidden ${currentCar.id === car.id ? 'border-black bg-white shadow-xl scale-[1.02]' : 'border-transparent bg-white hover:border-gray-200 shadow-sm hover:shadow-md'}`}
                                >
                                    <div className="flex justify-between items-center mb-1 relative z-10">
                                        <span className={`font-black uppercase tracking-tight text-lg ${currentCar.id === car.id ? 'text-black' : 'text-gray-600'}`}>{car.model_name}</span>
                                        {currentCar.id === car.id && <Check size={18} className="text-black bg-yellow-400 rounded-full p-0.5"/>}
                                    </div>
                                    <p className="text-xs text-gray-400 mb-2 font-medium">
                                        {car.transmission_type === 'automatic' ? 'Câmbio Automático' : car.transmission_type === 'manual' ? 'Câmbio Manual' : 'Automático/Manual'}
                                    </p>
                                    <span className="text-sm font-bold text-gray-900 relative z-10">{formatMoney(car.price_start)}</span>
                                </div>
                            )) : (
                                <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 text-xs font-medium">
                                    Nenhuma versão {transmissionFilter.toLowerCase()} encontrada para este modelo.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* --- ABA EXTERIOR --- */}
                {activeTab === 'Exterior' && (
                    <div className="space-y-10">
                        <div>
                            <h3 className="font-black uppercase text-xs tracking-widest text-gray-400 mb-4 flex justify-between items-center">Cor <span className="text-black">{selectedColor?.name}</span></h3>
                            <div className="grid grid-cols-4 gap-3">
                                {currentCar.exterior_colors?.map((c:any, i:number) => (
                                    <button key={c.name || i} onClick={() => handleColorChange(c)} className={`w-full aspect-square rounded-2xl shadow-sm transition-all duration-300 relative group overflow-hidden ${selectedColor?.name === c.name ? 'ring-2 ring-black scale-105 shadow-md' : 'hover:scale-105'}`} style={{backgroundColor: c.hex}}>
                                        {selectedColor?.name === c.name && <div className="absolute inset-0 flex items-center justify-center bg-black/10"><Check size={16} className="text-white drop-shadow-md"/></div>}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="border-t border-gray-200 pt-8">
                            <h3 className="font-black uppercase text-xs tracking-widest text-gray-400 mb-4">Rodas</h3>
                            <div className="space-y-3">
                                {currentCar.wheels?.map((w:any, i:number) => (
                                    <div key={w.id || i} onClick={() => setSelectedWheel(w)} className={`flex items-center gap-4 p-2 pr-4 border-2 rounded-2xl cursor-pointer transition-all duration-200 ${selectedWheel?.id === w.id ? 'border-black bg-white shadow-lg' : 'border-transparent bg-white hover:border-gray-200'}`}>
                                        <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center shrink-0"><img src={w.image} className="w-full h-full object-contain p-1 mix-blend-multiply"/></div>
                                        <div className="flex-1 min-w-0"><span className="text-xs font-bold uppercase block text-gray-900 mb-0.5">{w.name}</span><span className="text-[10px] font-bold text-gray-500">{(w.price || 0) === 0 ? 'Série' : `+ ${formatMoney(w.price)}`}</span></div>
                                        {selectedWheel?.id === w.id && <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center"><Check size={10} className="text-white"/></div>}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="border-t border-gray-200 pt-8">
                            <h3 className="font-black uppercase text-xs tracking-widest text-gray-400 mb-4">Acessórios</h3>
                            <div className="space-y-3">
                                {extAccessories.length > 0 ? extAccessories.map((acc:any, i:number) => (
                                    <div key={acc.id || i} onClick={() => toggleAccessory(acc.id)} className={`flex gap-3 cursor-pointer p-2 border-2 rounded-2xl transition-all duration-200 ${selectedAccs.includes(acc.id) ? 'bg-black text-white border-black shadow-lg' : 'bg-white border-transparent hover:border-gray-200'}`}>
                                        <div className="w-14 h-14 bg-white rounded-xl overflow-hidden shrink-0"><img src={acc.image} className="w-full h-full object-cover" alt={acc.name} /></div>
                                        <div className="flex-1 self-center min-w-0"><p className={`text-xs font-bold uppercase truncate ${selectedAccs.includes(acc.id) ? 'text-white' : 'text-gray-900'}`}>{acc.name}</p><p className={`text-[10px] font-bold ${selectedAccs.includes(acc.id) ? 'text-gray-400' : 'text-gray-500'}`}>R$ {acc.price}</p></div>
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center self-center shrink-0 transition-colors ${selectedAccs.includes(acc.id) ? 'border-white bg-white' : 'border-gray-200'}`}>{selectedAccs.includes(acc.id) && <Check size={12} className="text-black"/>}</div>
                                    </div>
                                )) : <p className="text-xs text-gray-400 italic">Nenhum acessório disponível.</p>}
                            </div>
                        </div>
                    </div>
                )}

                {/* --- ABA INTERIOR --- */}
                {activeTab === 'Interior' && (
                    <div className="space-y-8">
                        <div className="flex p-1 bg-gray-200 rounded-xl">
                            <button onClick={() => handleInteriorViewChange('dash')} className={`flex-1 py-3 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${interiorView === 'dash' ? 'bg-white text-black shadow-md' : 'text-gray-500 hover:text-black'}`}>Painel</button>
                            {hasSeats && <button onClick={() => handleInteriorViewChange('seats')} className={`flex-1 py-3 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${interiorView === 'seats' ? 'bg-white text-black shadow-md' : 'text-gray-500 hover:text-black'}`}>Bancos</button>}
                        </div>
                        <div className="border-t border-gray-200 pt-6">
                            <h3 className="font-black uppercase text-xs tracking-widest text-gray-400 mb-4">Acabamento</h3>
                            <div className="space-y-3">
                                <div onClick={() => {setSelectedSeatType(null); handleInteriorViewChange('seats');}} className={`cursor-pointer border-2 rounded-2xl p-2 pr-4 flex gap-4 items-center transition-all ${selectedSeatType === null ? 'border-black bg-white shadow-lg' : 'border-transparent bg-white hover:border-gray-200'}`}>
                                    <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden border border-gray-100 shrink-0"><img src={currentCar.interior_images?.seats || currentCar.interior_images?.dash} className="w-full h-full object-cover opacity-80" /></div>
                                    <div className="flex-1"><p className="text-xs font-bold uppercase text-gray-900 mb-0.5">Série</p><p className="text-[10px] font-bold text-gray-500">Incluso</p></div>
                                    {selectedSeatType === null && <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center"><Check size={10} className="text-white"/></div>}
                                </div>
                                {currentCar.seat_types?.map((s:any, i:number) => (
                                    <div key={s.id || i} onClick={() => handleSeatChange(s)} className={`cursor-pointer border-2 rounded-2xl p-2 pr-4 flex gap-4 items-center transition-all ${selectedSeatType?.id === s.id ? 'border-black bg-white shadow-lg' : 'border-transparent bg-white hover:border-gray-200'}`}>
                                        <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden border border-gray-100 shrink-0"><img src={s.image} className="w-full h-full object-cover" /></div>
                                        <div className="flex-1"><p className="text-xs font-bold uppercase text-gray-900 mb-0.5">{s.name}</p><p className="text--[10px] font-bold text-gray-500">{(s.price || 0) === 0 ? 'Incluso' : `+ ${formatMoney(s.price)}`}</p></div>
                                        {selectedSeatType?.id === s.id && <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center"><Check size={10} className="text-white"/></div>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
         </div>

         {/* FOOTER PREÇO */}
         <div className="p-6 border-t border-gray-200 bg-white z-20 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
             <div className="flex justify-between items-center">
                 <div>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Preço Final</p>
                    <p className="text-2xl font-black text-gray-900 leading-none tracking-tight">{formatMoney(totalPrice)}</p>
                 </div>
                 <button onClick={handleNext} className="bg-black text-white px-8 py-4 rounded-full font-black text-xs uppercase hover:bg-gray-800 transition-all shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 flex items-center gap-3 group">
                    {activeTab === 'Interior' ? 'FINALIZAR' : 'PRÓXIMO'} 
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform"/>
                 </button>
             </div>
         </div>
      </div>
    </div>
  );
}