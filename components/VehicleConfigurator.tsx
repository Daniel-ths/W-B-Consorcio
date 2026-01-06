"use client"

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ChevronLeft, ChevronRight, Check, Loader2, ArrowLeft, ArrowRight, Info, Gauge, Armchair, Edit2, Download, Link as LinkIcon } from "lucide-react";
import Link from "next/link";

export default function VehicleConfigurator() {
  const searchParams = useSearchParams();
  const idDoUrl = searchParams.get('id');
  const sidebarRef = useRef<HTMLDivElement>(null);

  // --- DADOS ---
  const [currentCar, setCurrentCar] = useState<any>(null);
  const [relatedCars, setRelatedCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- VISUAL ---
  const [activeTab, setActiveTab] = useState<'Modelo' | 'Exterior' | 'Interior'>('Modelo');
  const [showSummary, setShowSummary] = useState(false);
  const [transmission, setTransmission] = useState('Automático'); 
  const [interiorView, setInteriorView] = useState<'dash' | 'seats'>('dash');
  const [isRotated, setIsRotated] = useState(false);
  const [displayImage, setDisplayImage] = useState<string>('');

  // --- SELEÇÕES ---
  const [selectedColor, setSelectedColor] = useState<any>(null);
  const [selectedWheel, setSelectedWheel] = useState<any>(null);
  const [selectedSeatType, setSelectedSeatType] = useState<any>(null);
  const [selectedAccs, setSelectedAccs] = useState<string[]>([]);

  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

  useEffect(() => {
    async function fetchCarData() {
      setLoading(true);
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
          
          // Imagem inicial
          setDisplayImage(carToLoad.image_url);

          // Defaults
          if (carToLoad.exterior_colors?.length > 0) {
            setSelectedColor(carToLoad.exterior_colors[0]);
            setDisplayImage(carToLoad.exterior_colors[0].image);
          }
          if (carToLoad.wheels?.length > 0) setSelectedWheel(carToLoad.wheels[0]);
          if (carToLoad.seat_types?.length > 0) setSelectedSeatType(carToLoad.seat_types[0]);

          const { data: relatives } = await supabase.from('vehicles').select('*').eq('category_id', carToLoad.category_id).neq('id', carToLoad.id);
          if (relatives) setRelatedCars([carToLoad, ...relatives].sort((a,b) => a.price_start - b.price_start));
          else setRelatedCars([carToLoad]);
        }
      } catch (error) { console.error(error); } finally { setLoading(false); }
    }
    fetchCarData();
  }, [idDoUrl]);

  // Filtros de Acessórios
  const extAccessories = currentCar?.accessories?.filter((a: any) => a.type === 'exterior') || [];
  const intAccessories = currentCar?.accessories?.filter((a: any) => a.type === 'interior') || [];
  const hasSeats = currentCar?.interior_images?.seats && currentCar.interior_images.seats !== currentCar.interior_images.dash;

  // Helpers
  const getSelectedAccessoriesObjects = () => {
      if (!currentCar?.accessories) return [];
      return currentCar.accessories.filter((a: any) => selectedAccs.includes(a.id));
  }

  // --- CÁLCULO TOTAL ---
  const calculateTotal = () => {
      let total = currentCar?.price_start || 0;
      if (selectedColor?.price) total += selectedColor.price;
      if (selectedWheel?.price) total += selectedWheel.price;
      if (selectedSeatType?.price) total += selectedSeatType.price;
      selectedAccs.forEach(accId => {
          const acc = currentCar?.accessories.find((a: any) => a.id === accId);
          if (acc?.price) total += acc.price;
      })
      return total;
  }
  const totalPrice = calculateTotal();

  // --- HANDLERS ---
  const handleTabChange = (tab: 'Modelo' | 'Exterior' | 'Interior') => {
    setActiveTab(tab);
    setIsRotated(false);
    if (sidebarRef.current) sidebarRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    if (tab === 'Interior') {
        updateInteriorImage('dash');
    } else {
        if (selectedColor) setDisplayImage(selectedColor.image);
        else setDisplayImage(currentCar?.image_url);
    }
  };

  const handleNext = () => {
      if (activeTab === 'Modelo') handleTabChange('Exterior');
      else if (activeTab === 'Exterior') handleTabChange('Interior');
      else if (activeTab === 'Interior') setShowSummary(true);
  }

  const handleColorChange = (color: any) => {
    setSelectedColor(color);
    if (activeTab !== 'Interior') setDisplayImage(color.image);
  };

  const handleSeatChange = (seat: any) => {
      setSelectedSeatType(seat);
      setInteriorView('seats');
      if (seat.image) setDisplayImage(seat.image); 
  };

  const toggleAccessory = (id: string) => {
    setSelectedAccs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const updateInteriorImage = (view: 'dash' | 'seats') => {
    setInteriorView(view);
    if (view === 'dash' && currentCar?.interior_images?.dash) {
        setDisplayImage(currentCar.interior_images.dash);
    } else if (view === 'seats') {
        if(selectedSeatType?.image) setDisplayImage(selectedSeatType.image)
        else if(currentCar?.interior_images?.seats) setDisplayImage(currentCar.interior_images.seats);
    }
  };

  // Função para girar o carro (Front/Back)
  const toggleRotation = () => {
      if (currentCar?.image_back_url) {
          setIsRotated(!isRotated);
      }
  };

  const getMainDisplayImage = () => {
      if (activeTab === 'Interior') {
          return displayImage; 
      }
      
      // EXTERIOR
      if (isRotated && currentCar?.image_back_url) {
          return currentCar.image_back_url;
      }
      
      return selectedColor?.image || currentCar?.image_url;
  }

  // Renderização final da imagem
  const finalImage = getMainDisplayImage();

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#1a1a1a] text-white fixed inset-0 z-[5000]"><Loader2 className="animate-spin mr-2"/> Carregando...</div>;
  if (!currentCar) return <div className="h-screen flex items-center justify-center fixed inset-0 z-[5000] bg-white">Veículo não encontrado.</div>;

  // --- TELA DE RESUMO ---
  if (showSummary) {
      const selectedAccsObjs = getSelectedAccessoriesObjects();
      const mosaicMain = selectedColor?.image || currentCar.image_url;
      const mosaicSecondary = currentCar.image_back_url || currentCar.image_url;
      const mosaicInterior = selectedSeatType?.image || currentCar.interior_images?.dash;

      const standardDashDesc = currentCar.interior_images?.dash_desc || 'Acabamento do Painel Padrão';
      const standardSeatsDesc = currentCar.interior_images?.seats_desc || 'Bancos Padrão';

      return (
        <div className="fixed inset-0 z-[2000] h-screen w-full overflow-y-auto font-sans bg-white animate-in fade-in duration-500">
             <div className="sticky top-0 bg-white z-50 px-8 py-6 flex justify-between items-center border-b border-gray-100">
                <div className="flex items-center gap-4">
                    <button onClick={() => setShowSummary(false)} className="text-gray-500 hover:text-black transition-colors"><ArrowLeft size={24} /></button>
                    <h1 className="text-3xl font-bold text-gray-900">Seu {currentCar.model_name}</h1>
                </div>
                <div></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-1 p-1 bg-gray-100">
                <div className="md:col-span-2 h-[50vh] bg-white relative overflow-hidden group">
                     <div className="w-full h-full bg-center bg-contain bg-no-repeat transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url(${mosaicMain})` }}></div>
                </div>
                <div className="h-[40vh] bg-white relative overflow-hidden group">
                    <div className="w-full h-full bg-center bg-cover transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url(${mosaicSecondary})` }}></div>
                </div>
                <div className="h-[40vh] bg-white relative overflow-hidden group">
                    <div className="w-full h-full bg-center bg-cover transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url(${mosaicInterior})` }}></div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-8 py-16 space-y-20">
                <div>
                    <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-200">
                        <h2 className="text-2xl font-bold text-gray-900">Resumo</h2>
                        <button onClick={() => setShowSummary(false)} className="text-sm font-bold text-gray-500 hover:text-black flex items-center gap-1 uppercase tracking-wider"><Edit2 size={14}/> Editar</button>
                    </div>
                    <div className="space-y-12">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-6">Versões</h3>
                            <div className="flex items-center gap-6">
                                <div className="w-32 h-20 bg-gray-100 rounded-lg border border-gray-200 overflow-hidden relative"><img src={currentCar.image_url} className="w-full h-full object-cover" /></div>
                                <span className="text-lg font-medium text-gray-700">{currentCar.model_name}</span>
                            </div>
                        </div>
                        <div className="border-t border-gray-100 pt-12">
                            <h3 className="text-lg font-bold text-gray-900 mb-6">Exterior</h3>
                            <div className="space-y-8">
                                {selectedColor && (<div className="flex items-center gap-6"><div className="w-16 h-16 rounded-lg shadow-sm border border-gray-200" style={{ backgroundColor: selectedColor.hex }}></div><div><p className="text-lg font-medium text-gray-900">{selectedColor.name}</p><p className="text-sm text-gray-500">{selectedColor.price > 0 ? `+ ${formatMoney(selectedColor.price)}` : 'Padrão'}</p></div></div>)}
                                {selectedWheel && (<div className="flex items-center gap-6"><div className="w-32 h-20 bg-white rounded-lg border border-gray-200 overflow-hidden flex items-center justify-center p-2"><img src={selectedWheel.image} className="max-w-full max-h-full mix-blend-multiply" /></div><div><p className="text-lg font-medium text-gray-900 leading-tight max-w-md">{selectedWheel.name}</p><p className="text-sm text-gray-500 mt-1">{selectedWheel.price > 0 ? `+ ${formatMoney(selectedWheel.price)}` : 'Padrão'}</p></div></div>)}
                            </div>
                        </div>
                        <div className="border-t border-gray-100 pt-12">
                            <h3 className="text-lg font-bold text-gray-900 mb-6">Interior</h3>
                            <div className="flex items-center gap-6">
                                <div className="w-32 h-20 bg-gray-100 rounded-lg border border-gray-200 overflow-hidden relative">
                                    <img src={selectedSeatType?.image || currentCar.interior_images?.seats || currentCar.interior_images?.dash} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <p className="text-lg font-medium text-gray-900 leading-tight max-w-md">
                                        {selectedSeatType ? selectedSeatType.name : standardSeatsDesc}
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {selectedSeatType && selectedSeatType.price > 0 ? `+ ${formatMoney(selectedSeatType.price)}` : 'Padrão'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        {selectedAccsObjs.length > 0 && (
                            <div className="border-t border-gray-100 pt-12">
                                <h3 className="text-lg font-bold text-gray-900 mb-6">Opcionais</h3>
                                <div className="space-y-8">
                                    {selectedAccsObjs.map((acc: any) => (<div key={acc.id} className="flex items-center gap-6"><div className="w-32 h-20 bg-white rounded-lg border border-gray-200 overflow-hidden flex items-center justify-center"><img src={acc.image} className="w-full h-full object-cover" /></div><div><p className="text-lg font-medium text-gray-900 leading-tight max-w-md">{acc.name}</p><p className="text-sm text-gray-500 mt-1">{acc.price > 0 ? `+ ${formatMoney(acc.price)}` : 'Incluso'}</p></div></div>))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-8 pb-4 border-b border-gray-200">Preço</h2>
                    <div className="space-y-6 text-lg">
                        <div className="flex justify-between items-start"><span className="font-bold text-gray-900">Veículo</span></div>
                        <div className="flex justify-between items-start pl-4 text-gray-700"><span>{currentCar.model_name}</span><span>{formatMoney(currentCar.price_start)}</span></div>
                        {selectedColor && (<div className="flex justify-between items-start pl-4 text-gray-700"><span>{selectedColor.name}</span><span>{selectedColor.price > 0 ? formatMoney(selectedColor.price) : 'Padrão'}</span></div>)}
                        {selectedWheel && (<div className="flex justify-between items-start pl-4 text-gray-700"><span className="max-w-md">{selectedWheel.name}</span><span>{selectedWheel.price > 0 ? formatMoney(selectedWheel.price) : 'Padrão'}</span></div>)}
                        <div className="flex justify-between items-start pl-4 text-gray-700">
                             <span className="max-w-md">{selectedSeatType ? selectedSeatType.name : standardSeatsDesc}</span>
                             <span>{selectedSeatType && selectedSeatType.price > 0 ? formatMoney(selectedSeatType.price) : 'Padrão'}</span>
                        </div>
                        {selectedAccsObjs.length > 0 && (<>
                                <div className="flex justify-between items-start pt-4"><span className="font-bold text-gray-900">Opcionais</span></div>
                                {selectedAccsObjs.map((acc: any) => (<div key={acc.id} className="flex justify-between items-start pl-4 text-gray-700"><span className="max-w-md">{acc.name}</span><span>{formatMoney(acc.price)}</span></div>))}
                        </>)}
                        <div className="border-t border-gray-200 pt-6 mt-8 flex justify-between items-center"><span className="text-xl font-bold text-gray-900">Total estimado</span><span className="text-3xl font-bold text-gray-900">{formatMoney(totalPrice)}</span></div>
                    </div>
                    <div className="mt-12 text-xs text-gray-500 space-y-2 max-w-3xl">
                        <p>IMPORTANTE: A simulação de compra não garante a disponibilidade do veículo escolhido.</p>
                        <p>1. O preço demonstrado é sugerido e pode variar de acordo com as concessionárias.</p>
                    </div>
                </div>
            </div>
        </div>
      )
  }

  // --- CONFIGURADOR NORMAL ---
  return (
    <div className="fixed inset-0 z-[2000] flex flex-col lg:flex-row h-screen w-full overflow-hidden font-sans bg-white">
      
      {/* ESQUERDA */}
      <div className="lg:w-[75%] w-full h-[50vh] lg:h-full bg-[#1a1a1a] relative flex items-center justify-center overflow-hidden">
        {selectedColor && activeTab !== 'Interior' && (
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="w-full h-full transition-colors duration-1000 ease-in-out opacity-30 blur-[120px] scale-150 transform-gpu" style={{ backgroundColor: selectedColor.hex }}></div>
                <div className="absolute inset-0 bg-radial-gradient-to-t from-[#1a1a1a] via-transparent to-transparent opacity-60"></div>
            </div>
        )}
        <Link href="/" className="absolute top-8 left-6 z-30 text-white/50 hover:text-white flex items-center gap-2 text-sm font-bold uppercase tracking-widest transition-colors"><ArrowLeft size={16}/> Voltar</Link>
        <div className="absolute top-6 left-0 right-0 flex justify-center z-20"><img src="https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/chevrolet-logo.svg" alt="Chevy" className="h-8 object-contain drop-shadow-lg"/></div>
        
        {/* ÁREA DA IMAGEM */}
        <div className={`w-full h-full flex items-center justify-center relative overflow-hidden transition-all duration-700 ease-in-out z-10 ${activeTab === 'Interior' ? 'p-0' : 'p-12 lg:p-32'}`}>
            <div className={`w-full h-full bg-center bg-no-repeat transition-all duration-700 ease-in-out transform drop-shadow-2xl ${activeTab === 'Interior' ? 'bg-cover scale-105' : 'bg-contain scale-100'}`} style={{ backgroundImage: `url(${finalImage})` }}></div>
        </div>

        {/* SETAS DE ROTAÇÃO (Substituindo botões fake) */}
        {activeTab !== 'Interior' && (
            <div className="absolute bottom-8 left-8 flex gap-2 z-30">
                <button 
                    onClick={toggleRotation}
                    disabled={!currentCar.image_back_url}
                    className={`bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-md transition-all ${!currentCar.image_back_url ? 'opacity-30 cursor-not-allowed' : ''}`}
                >
                    <ChevronLeft size={20} />
                </button>
                <button 
                    onClick={toggleRotation}
                    disabled={!currentCar.image_back_url}
                    className={`bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-md transition-all ${!currentCar.image_back_url ? 'opacity-30 cursor-not-allowed' : ''}`}
                >
                    <ChevronRight size={20} />
                </button>
            </div>
        )}
        <div className="absolute bottom-8 right-8 z-30"><button className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded font-bold text-sm backdrop-blur-md">Contate uma Concessionária</button></div>
      </div>

      {/* DIREITA (Configuração) */}
      <div className="lg:w-[25%] w-full h-full bg-white flex flex-col border-l border-gray-200 shadow-xl z-30">
        
        <div className="p-6 pb-2 border-b border-gray-100 bg-white">
            <div className="flex gap-8 text-base font-bold text-gray-400 mb-6">
                {['Modelo', 'Exterior', 'Interior'].map((tab: any) => (
                    <button key={tab} onClick={() => handleTabChange(tab)} className={`pb-2 border-b-2 transition-all ${activeTab === tab ? 'text-black border-black' : 'border-transparent hover:text-gray-600'}`}>{tab}</button>
                ))}
            </div>
            {activeTab === 'Modelo' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
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

        <div ref={sidebarRef} key={activeTab} className="flex-1 overflow-y-auto p-6 pt-4 space-y-4 custom-scrollbar animate-in slide-in-from-right-8 fade-in duration-500">
            {activeTab === 'Modelo' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center mb-2"><span className="text-base font-bold text-gray-900">Versões</span><span className="text-xs font-bold text-gray-500 cursor-pointer hover:underline flex items-center gap-1 uppercase tracking-wider"><ArrowLeft size={10} className="rotate-180"/> Comparar</span></div>
                    {relatedCars.map((ver) => (
                        <Link href={`/configurador?id=${ver.id}`} key={ver.id} className={`block cursor-pointer border rounded-lg p-5 transition-all duration-200 relative group ${currentCar.id === ver.id ? 'border-black ring-1 ring-black bg-gray-50' : 'border-gray-200 hover:border-gray-400'}`}>
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
                        <div className="flex flex-wrap gap-4">
                            {currentCar.exterior_colors?.map((color: any) => (
                                <button key={color.name} onClick={() => handleColorChange(color)} className={`w-10 h-10 rounded-full shadow-sm border transition-all ${selectedColor?.name === color.name ? 'ring-2 ring-offset-2 ring-blue-600 scale-110' : 'border-gray-200 hover:scale-105'}`} style={{ backgroundColor: color.hex }} />
                            ))}
                        </div>
                    </div>
                    <div className="border-t border-gray-100 pt-8">
                        <div className="flex justify-between items-center mb-4"><h3 className="text-base font-bold text-gray-900">Rodas</h3><button className="text-gray-400 text-xl font-light">-</button></div>
                        <div className="space-y-4">
                            {currentCar.wheels && currentCar.wheels.length > 0 ? currentCar.wheels.map((wheel: any) => (
                                <div key={wheel.id} onClick={() => setSelectedWheel(wheel)} className={`cursor-pointer border rounded-lg p-3 flex gap-4 items-center transition-all ${selectedWheel?.id === wheel.id ? 'border-black ring-1 ring-black' : 'border-gray-200 hover:border-gray-300'}`}>
                                    <div className="w-20 h-20 bg-white rounded flex items-center justify-center border border-gray-100 shrink-0"><img src={wheel.image} className="max-w-full max-h-full mix-blend-multiply" /></div>
                                    <div className="flex-1 min-w-0"><p className="text-sm font-bold text-gray-900 leading-tight mb-2">{wheel.name}</p><p className="text-xs font-bold text-gray-500">{(wheel.price || 0) === 0 ? 'Padrão' : `+ ${formatMoney(wheel.price)}`}</p></div>
                                    {selectedWheel?.id === wheel.id && <Check size={16} className="text-black"/>}
                                </div>
                            )) : <p className="text-xs text-gray-400 italic">Nenhuma roda opcional.</p>}
                        </div>
                    </div>
                    <div className="border-t border-gray-100 pt-8">
                        <div className="flex justify-between items-center mb-4"><h3 className="text-base font-bold text-gray-900">Acessórios Externos</h3><button className="text-gray-400 text-xl font-light">-</button></div>
                        <div className="space-y-4">
                            {extAccessories.length > 0 ? extAccessories.map((acc: any, index: number) => (
                                <div key={acc.id} onClick={() => toggleAccessory(acc.id)} className={`flex gap-4 cursor-pointer p-3 rounded hover:bg-gray-50 transition-all duration-500 animate-in slide-in-from-right-8 fade-in fill-mode-backwards ${selectedAccs.includes(acc.id) ? 'bg-gray-50 ring-1 ring-gray-200' : ''}`} style={{ animationDelay: `${index * 150}ms` }}>
                                    <div className="w-24 h-16 bg-white rounded border border-gray-200 overflow-hidden shrink-0"><img src={acc.image} className="w-full h-full object-cover" /></div>
                                    <div className="flex-1 min-w-0"><p className="text-sm font-bold text-gray-900 truncate">{acc.name}</p><p className="text-xs font-bold text-gray-500 flex items-center gap-1 mt-1">R$ {acc.price} <Info size={12} className="text-gray-400"/></p></div>
                                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center self-center transition-colors ${selectedAccs.includes(acc.id) ? 'bg-black border-black' : 'border-gray-300'}`}>{selectedAccs.includes(acc.id) ? <Check size={12} className="text-white"/> : <span className="text-xs text-gray-400">+</span>}</div>
                                </div>
                            )) : <p className="text-xs text-gray-400 italic">Nenhum acessório externo.</p>}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'Interior' && (
                <div className="space-y-8 pt-2">
                    <div className="flex gap-2">
                        <button onClick={() => updateInteriorImage('dash')} className={`${hasSeats ? 'flex-1' : 'w-full'} py-3 px-4 rounded border flex items-center justify-center gap-2 transition-all ${interiorView === 'dash' ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                            <Gauge size={18} /> <span className="text-xs font-bold uppercase">Painel</span>
                        </button>
                        {hasSeats && (
                            <button onClick={() => updateInteriorImage('seats')} className={`flex-1 py-3 px-4 rounded border flex items-center justify-center gap-2 transition-all ${interiorView === 'seats' ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                                <Armchair size={18} /> <span className="text-xs font-bold uppercase">Bancos</span>
                            </button>
                        )}
                    </div>
                    <div className="border-t border-gray-100 pt-6">
                        <div className="flex justify-between items-center mb-4"><h3 className="text-base font-bold text-gray-900">Acabamento dos Bancos</h3><button className="text-gray-400 text-xl font-light">-</button></div>
                        <div className="space-y-4">
                            {/* OPÇÃO PADRÃO */}
                            <div 
                                onClick={() => { setSelectedSeatType(null); updateInteriorImage('seats'); }} 
                                className={`cursor-pointer border rounded-lg p-3 flex gap-4 items-center transition-all ${selectedSeatType === null ? 'border-black ring-1 ring-black' : 'border-gray-200 hover:border-gray-300'}`}
                            >
                                <div className="w-20 h-20 bg-white rounded flex items-center justify-center border border-gray-100 shrink-0 overflow-hidden">
                                    <img src={currentCar.interior_images?.seats || currentCar.interior_images?.dash} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-gray-900 leading-tight mb-2">{currentCar.interior_images?.seats_desc || 'Bancos Padrão'}</p>
                                    <p className="text-xs font-bold text-gray-500">Incluso</p>
                                </div>
                                {selectedSeatType === null && <Check size={16} className="text-black"/>}
                            </div>

                            {/* TIPOS DE BANCOS EXTRAS */}
                            {currentCar.seat_types && currentCar.seat_types.map((seat: any) => (
                                <div key={seat.id} onClick={() => handleSeatChange(seat)} className={`cursor-pointer border rounded-lg p-3 flex gap-4 items-center transition-all ${selectedSeatType?.id === seat.id ? 'border-black ring-1 ring-black' : 'border-gray-200 hover:border-gray-300'}`}>
                                    <div className="w-20 h-20 bg-white rounded flex items-center justify-center border border-gray-100 shrink-0"><img src={seat.image} className="w-full h-full object-cover" /></div>
                                    <div className="flex-1 min-w-0"><p className="text-sm font-bold text-gray-900 leading-tight mb-2">{seat.name}</p><p className="text-xs font-bold text-gray-500">{(seat.price || 0) === 0 ? 'Incluso' : `+ ${formatMoney(seat.price)}`}</p></div>
                                    {selectedSeatType?.id === seat.id && <Check size={16} className="text-black"/>}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="border-t border-gray-100 pt-6">
                        <div className="flex justify-between items-center mb-4"><h3 className="text-base font-bold text-gray-900">Acessórios Internos</h3><button className="text-gray-400 text-xl font-light">-</button></div>
                        <div className="space-y-4">
                            {intAccessories.length > 0 ? intAccessories.map((acc: any, index: number) => (
                                <div key={acc.id} onClick={() => toggleAccessory(acc.id)} className={`flex gap-4 cursor-pointer p-3 rounded hover:bg-gray-50 transition-all duration-500 animate-in slide-in-from-right-8 fade-in fill-mode-backwards ${selectedAccs.includes(acc.id) ? 'bg-gray-50 ring-1 ring-gray-200' : ''}`} style={{ animationDelay: `${index * 150}ms` }}>
                                    <div className="w-24 h-16 bg-white rounded border border-gray-200 overflow-hidden shrink-0"><img src={acc.image} className="w-full h-full object-cover" /></div>
                                    <div className="flex-1 min-w-0"><p className="text-sm font-bold text-gray-900 truncate">{acc.name}</p><p className="text-xs font-bold text-gray-500 flex items-center gap-1 mt-1">R$ {acc.price} <Info size={12} className="text-gray-400"/></p></div>
                                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center self-center transition-colors ${selectedAccs.includes(acc.id) ? 'bg-black border-black' : 'border-gray-300'}`}>{selectedAccs.includes(acc.id) ? <Check size={12} className="text-white"/> : <span className="text-xs text-gray-400">+</span>}</div>
                                </div>
                            )) : <p className="text-xs text-gray-400 italic">Nenhum acessório interno.</p>}
                        </div>
                    </div>
                </div>
            )}
        </div>

        <div className="p-6 border-t border-gray-200 bg-white">
            <div className="flex justify-between items-center">
                <div><p className="text-xs font-bold text-gray-400 mb-1 uppercase tracking-wide">Preço Total</p><p className="text-2xl font-bold text-gray-900 border-b-2 border-gray-100 pb-1 leading-none">{formatMoney(totalPrice)}</p></div>
                <button onClick={handleNext} className="bg-black text-white px-8 py-4 rounded font-bold text-sm uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] flex items-center gap-2">
                    {activeTab === 'Interior' ? 'FINALIZAR' : 'PRÓXIMO'} <ArrowRight size={16} />
                </button>
            </div>
        </div>

      </div>
    </div>
  );
}