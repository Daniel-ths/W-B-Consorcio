"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, Info, Loader2, Gauge, Armchair } from "lucide-react";
import Link from "next/link";

// Utilitário simples de preço
const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

interface ConfiguratorUIProps {
  currentCar: any;
  relatedCars: any[];
  // Estados que vêm do Pai
  selectedColor: any; setSelectedColor: (v:any)=>void;
  selectedWheel: any; setSelectedWheel: (v:any)=>void;
  selectedSeatType: any; setSelectedSeatType: (v:any)=>void;
  selectedAccs: string[]; toggleAccessory: (id:string)=>void;
  totalPrice: number;
  // Navegação
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

  const [activeTab, setActiveTab] = useState<'Modelo' | 'Exterior' | 'Interior'>('Modelo');
  const [interiorView, setInteriorView] = useState<'dash' | 'seats'>('dash');
  const [viewIndex, setViewIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const viewsOrder = ['front', 'side', 'rear_angle', 'front_detail', 'rear'];
  const sidebarRef = useRef<HTMLDivElement>(null);
  
  // Helpers
  const hasSeats = currentCar?.interior_images?.seats && currentCar.interior_images.seats !== currentCar.interior_images.dash;
  const extAccessories = currentCar?.accessories?.filter((a: any) => a.type === 'exterior') || [];
  const intAccessories = currentCar?.accessories?.filter((a: any) => a.type === 'interior') || [];

  // Lógica de Imagem Final
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

  useEffect(() => { setImageLoaded(false); }, [finalImage]);

  const rotateCar = (dir: 'next' | 'prev') => {
      setImageLoaded(false);
      if (dir === 'next') setViewIndex((prev) => (prev + 1) % viewsOrder.length);
      else setViewIndex((prev) => (prev - 1 + viewsOrder.length) % viewsOrder.length);
  };

  const handleNext = () => {
    if (activeTab === 'Modelo') setActiveTab('Exterior');
    else if (activeTab === 'Exterior') setActiveTab('Interior');
    else if (activeTab === 'Interior') onFinish();
  };

  return (
    <div className="fixed inset-0 z-[2000] flex flex-col lg:flex-row h-screen w-full overflow-hidden font-sans bg-white">
      
      {/* 1. ÁREA VISUAL (ESQUERDA) */}
      <div className="lg:w-[75%] w-full h-[50vh] lg:h-full bg-[#1a1a1a] relative flex items-center justify-center overflow-hidden">
        {/* Loading Overlay */}
        <div className={`absolute inset-0 z-50 bg-[#1a1a1a]/80 backdrop-blur-sm flex items-center justify-center transition-opacity duration-500 pointer-events-none ${isSwitchingCar ? 'opacity-100' : 'opacity-0'}`}>
            <Loader2 className="animate-spin text-white w-8 h-8" />
        </div>

        {/* Background Glow */}
        {selectedColor && activeTab !== 'Interior' && (
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden animate-in fade-in duration-1000">
                <div className="w-full h-full transition-colors duration-1000 ease-in-out opacity-20 blur-[120px] scale-150 transform-gpu" style={{ backgroundColor: selectedColor.hex }}></div>
            </div>
        )}

        <Link href="/" className="absolute top-8 left-6 z-30 text-white/50 hover:text-white flex items-center gap-2 text-sm font-bold uppercase tracking-widest"><ArrowLeft size={16}/> Voltar</Link>

        {/* IMAGEM PRINCIPAL */}
        <div className={`w-full h-full flex items-center justify-center relative overflow-hidden transition-all duration-700 ease-in-out z-10 ${activeTab === 'Interior' ? 'p-0' : 'p-12 lg:p-32'}`}>
             <div className={`relative w-full h-full flex items-center justify-center transition-all duration-700 ease-in-out transform drop-shadow-2xl ${activeTab === 'Interior' ? 'scale-105' : 'scale-100'}`}>
                {!imageLoaded && !isSwitchingCar && (<div className="absolute inset-0 flex items-center justify-center"><Loader2 className="animate-spin text-white/20 w-10 h-10" /></div>)}
                <img key={finalImage} src={finalImage} alt="Car View" onLoad={() => setImageLoaded(true)} className={`absolute inset-0 w-full h-full object-contain z-10 select-none pointer-events-none transition-opacity duration-700 ease-in-out ${imageLoaded && !isSwitchingCar ? 'opacity-100' : 'opacity-0 scale-95'}`} />
            </div>
        </div>

        {/* CONTROLES DE ROTAÇÃO */}
        {activeTab !== 'Interior' && (
            <div className="absolute bottom-8 left-8 flex gap-2 z-30">
                <button onClick={() => rotateCar('prev')} className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-md"><ChevronLeft size={20} /></button>
                <button onClick={() => rotateCar('next')} className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-md"><ChevronRight size={20} /></button>
                <div className="ml-4 flex gap-1 items-center">{viewsOrder.map((_, i) => (<div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === viewIndex ? 'bg-white scale-125' : 'bg-white/30'}`} />))}</div>
            </div>
        )}
      </div>

      {/* 2. BARRA LATERAL (DIREITA) */}
      <div className="lg:w-[25%] w-full h-full bg-white flex flex-col border-l border-gray-200 shadow-xl z-30">
         {/* Crachá Simples */}
         <div className="p-6 border-b border-gray-100">
            {user ? <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">Vendedor: {user.email.split('@')[0]}</span> : <span className="text-xs text-gray-400">Visitante</span>}
            <div className="flex gap-6 mt-4 text-sm font-bold text-gray-400">
                {['Modelo', 'Exterior', 'Interior'].map((tab: any) => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-2 border-b-2 transition-all ${activeTab === tab ? 'text-black border-black' : 'border-transparent hover:text-gray-600'}`}>{tab}</button>
                ))}
            </div>
         </div>

         {/* CONTEÚDO SCROLLÁVEL */}
         <div ref={sidebarRef} className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            {activeTab === 'Modelo' && (
                <div>
                    <h1 className="text-3xl font-bold mb-4">{currentCar.model_name}</h1>
                    <p className="text-gray-500 text-sm mb-6">Escolha a versão ideal para você.</p>
                    {relatedCars.map(car => (
                         <Link href={`/configurador?id=${car.id}`} key={car.id} className={`block mb-3 border rounded-lg p-4 ${currentCar.id === car.id ? 'border-black ring-1 ring-black bg-gray-50' : 'hover:border-gray-400'}`}>
                            <div className="flex justify-between font-bold text-sm"><span>{car.model_name}</span><span>{formatMoney(car.price_start)}</span></div>
                         </Link>
                    ))}
                </div>
            )}

            {activeTab === 'Exterior' && (
                <div className="space-y-8">
                    <div>
                        <h3 className="font-bold mb-3 text-sm">Cores</h3>
                        <div className="flex flex-wrap gap-3">{currentCar.exterior_colors?.map((c:any) => (<button key={c.name} onClick={() => {setSelectedColor(c); setViewIndex(0);}} className={`w-10 h-10 rounded-full border shadow-sm ${selectedColor?.name === c.name ? 'ring-2 ring-offset-2 ring-blue-600' : ''}`} style={{backgroundColor: c.hex}} />))}</div>
                        <p className="text-xs text-gray-500 mt-2 font-bold">{selectedColor?.name}</p>
                    </div>
                    <div>
                        <h3 className="font-bold mb-3 text-sm">Rodas</h3>
                        {currentCar.wheels?.map((w:any) => (<div key={w.id} onClick={() => setSelectedWheel(w)} className={`flex items-center gap-3 p-2 border rounded cursor-pointer mb-2 ${selectedWheel?.id === w.id ? 'border-black' : ''}`}><img src={w.image} className="w-12 h-12 mix-blend-multiply"/> <span className="text-xs font-bold">{w.name}</span></div>))}
                    </div>
                    <div>
                        <h3 className="font-bold mb-3 text-sm">Acessórios</h3>
                        {extAccessories.map((acc:any) => (<div key={acc.id} onClick={() => toggleAccessory(acc.id)} className={`flex justify-between p-3 border rounded cursor-pointer mb-2 ${selectedAccs.includes(acc.id) ? 'bg-black text-white' : ''}`}><span className="text-xs font-bold">{acc.name}</span>{selectedAccs.includes(acc.id) && <Check size={14}/>}</div>))}
                    </div>
                </div>
            )}

            {activeTab === 'Interior' && (
                <div className="space-y-6">
                    <div className="flex gap-2">
                        <button onClick={() => {setInteriorView('dash'); setImageLoaded(false);}} className={`flex-1 py-2 border rounded text-xs font-bold ${interiorView === 'dash' ? 'bg-black text-white' : ''}`}><Gauge size={16} className="mx-auto mb-1"/> Painel</button>
                        {hasSeats && <button onClick={() => {setInteriorView('seats'); setImageLoaded(false);}} className={`flex-1 py-2 border rounded text-xs font-bold ${interiorView === 'seats' ? 'bg-black text-white' : ''}`}><Armchair size={16} className="mx-auto mb-1"/> Bancos</button>}
                    </div>
                    <div>
                         <h3 className="font-bold mb-3 text-sm">Acabamento</h3>
                         <div onClick={() => {setSelectedSeatType(null); setInteriorView('seats');}} className={`p-3 border rounded cursor-pointer mb-2 ${selectedSeatType === null ? 'border-black' : ''}`}><span className="text-xs font-bold">Padrão</span></div>
                         {currentCar.seat_types?.map((s:any) => (<div key={s.id} onClick={() => {setSelectedSeatType(s); setInteriorView('seats');}} className={`p-3 border rounded cursor-pointer mb-2 ${selectedSeatType?.id === s.id ? 'border-black' : ''}`}><span className="text-xs font-bold">{s.name}</span></div>))}
                    </div>
                     <div>
                        <h3 className="font-bold mb-3 text-sm">Acessórios Internos</h3>
                        {intAccessories.map((acc:any) => (<div key={acc.id} onClick={() => toggleAccessory(acc.id)} className={`flex justify-between p-3 border rounded cursor-pointer mb-2 ${selectedAccs.includes(acc.id) ? 'bg-black text-white' : ''}`}><span className="text-xs font-bold">{acc.name}</span>{selectedAccs.includes(acc.id) && <Check size={14}/>}</div>))}
                    </div>
                </div>
            )}
         </div>

         {/* FOOTER PREÇO */}
         <div className="p-6 border-t border-gray-200">
             <div className="flex justify-between items-center">
                 <div><p className="text-[10px] text-gray-400 font-bold uppercase">TOTAL</p><p className="text-2xl font-bold">{formatMoney(totalPrice)}</p></div>
                 <button onClick={handleNext} className="bg-black text-white px-6 py-3 rounded font-bold text-xs uppercase hover:bg-gray-800 flex items-center gap-2">{activeTab === 'Interior' ? 'FINALIZAR' : 'PRÓXIMO'} <ArrowRight size={14}/></button>
             </div>
         </div>
      </div>
    </div>
  );
}