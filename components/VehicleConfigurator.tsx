"use client"

import { useState } from "react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import Image from "next/image";

// --- DADOS MOCKADOS (Para simular o Onix) ---
const versions = [
  { id: 'at-turbo', name: 'Onix AT Turbo', price: 112990, features: 'Tecnologia e elegância' },
  { id: 'lt-turbo', name: 'Onix LT Turbo', price: 118990, features: 'Mais conforto' },
  { id: 'ltz-turbo', name: 'Onix LTZ Turbo', price: 123990, features: 'Acabamento premium' },
  { id: 'premier', name: 'Onix PREMIER', price: 129990, features: 'Topo de linha' },
  { id: 'rs', name: 'Onix RS Turbo', price: 130990, features: 'Esportividade' },
];

const transmissions = ['Automático', 'Manual'];

export default function VehicleConfigurator() {
  const [selectedVersion, setSelectedVersion] = useState(versions[0]);
  const [transmission, setTransmission] = useState('Automático');
  const [activeTab, setActiveTab] = useState('Modelo'); // Modelo, Exterior, Interior

  // Formatação de Moeda
  const formatMoney = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full overflow-hidden font-sans">
      
      {/* --- LADO ESQUERDO: VISUALIZADOR 3D --- */}
      <div className="lg:w-[75%] w-full h-[50vh] lg:h-full bg-[#3e4146] relative flex items-center justify-center transition-colors duration-500">
        
        {/* Logo Chevrolet no Topo (Efeito visual) */}
        <div className="absolute top-6 left-0 right-0 flex justify-center opacity-80">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Chevrolet_logo_2013.png/640px-Chevrolet_logo_2013.png" alt="Chevy" className="h-6 object-contain grayscale brightness-200" />
        </div>

        {/* Nome do Carro (Canto esquerdo) */}
        <div className="absolute top-6 left-6 text-white text-opacity-50 text-sm font-medium tracking-wide">
            2025 Onix
        </div>

        {/* IMAGEM DO CARRO (Simulando o 3D) */}
        <div className="relative w-full max-w-4xl px-4 animate-in fade-in zoom-in duration-700">
             {/* Substitua pela imagem do Onix Cinza do seu Supabase */}
             <img 
                src="https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/novo%20onix%20preto%20cinza.png" 
                alt="Onix Visualizer" 
                className="w-full h-auto object-contain drop-shadow-2xl scale-110"
             />
        </div>

        {/* Controles de Rotação (Fake 360) */}
        <div className="absolute bottom-8 left-8 flex gap-2">
            <button className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-md transition-all">
                <ChevronLeft size={20} />
            </button>
            <button className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-md transition-all">
                <ChevronRight size={20} />
            </button>
        </div>

        <div className="absolute bottom-8 right-8">
            <button className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded text-xs font-bold backdrop-blur-md">
                Contate uma Concessionária
            </button>
        </div>
      </div>

      {/* --- LADO DIREITO: SIDEBAR DE CONFIGURAÇÃO --- */}
      <div className="lg:w-[25%] w-full h-full bg-white flex flex-col border-l border-gray-200 shadow-xl z-20">
        
        {/* Header da Sidebar */}
        <div className="p-6 pb-2 border-b border-gray-100">
            {/* Tabs de Navegação */}
            <div className="flex gap-6 text-sm font-medium text-gray-500 mb-6">
                {['Modelo', 'Exterior', 'Interior'].map((tab) => (
                    <button 
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-2 border-b-2 transition-colors ${activeTab === tab ? 'text-black border-black' : 'border-transparent hover:text-gray-800'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <h1 className="text-3xl font-light text-gray-900 tracking-tight mb-6">Seu Onix</h1>

            {/* Seletor de Transmissão */}
            <div className="mb-6">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Transmissão</label>
                <div className="flex gap-2">
                    {transmissions.map((type) => (
                        <button
                            key={type}
                            onClick={() => setTransmission(type)}
                            className={`flex-1 py-3 text-sm font-medium border rounded transition-all ${
                                transmission === type 
                                ? 'border-black bg-gray-900 text-white' 
                                : 'border-gray-300 text-gray-600 hover:border-gray-400'
                            }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {/* Lista de Versões (Scrollável) */}
        <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-3">
            <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-gray-900">Versões</span>
                <span className="text-xs text-gray-500 cursor-pointer hover:underline">Comparar</span>
            </div>

            {versions.map((ver) => (
                <div 
                    key={ver.id}
                    onClick={() => setSelectedVersion(ver)}
                    className={`cursor-pointer border rounded p-4 transition-all duration-200 relative group ${
                        selectedVersion.id === ver.id 
                        ? 'border-black bg-gray-50 ring-1 ring-black' 
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                >
                    <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-gray-900 text-sm">{ver.name}</span>
                        <span className="text-sm text-gray-600">{formatMoney(ver.price)}</span>
                    </div>
                    <p className="text-xs text-gray-500">{ver.features}</p>
                    
                    {/* Checkmark da Chevrolet */}
                    {selectedVersion.id === ver.id && (
                        <div className="absolute -top-2 -right-2 bg-black text-white rounded-full p-0.5 shadow-md">
                            <Check size={12} />
                        </div>
                    )}
                </div>
            ))}
        </div>

        {/* Footer Fixo da Sidebar */}
        <div className="p-6 border-t border-gray-200 bg-white">
            <div className="flex justify-between items-end mb-4">
                <span className="text-xs text-gray-500">Preço total sugerido</span>
            </div>
            <div className="text-3xl font-light text-gray-900 mb-6">
                {formatMoney(selectedVersion.price)}
            </div>

            <button className="w-full bg-black text-white font-bold py-4 rounded hover:bg-gray-800 transition-colors flex justify-between px-6 items-center group">
                <span>PRÓXIMO</span>
                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
        </div>

      </div>
    </div>
  );
}