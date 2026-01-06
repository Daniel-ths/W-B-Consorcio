"use client"

import { useState } from "react";
import { Zap } from "lucide-react";

interface ColorOption {
    name: string;
    hex: string;
    image_url: string;
}

interface CarShowcaseProps {
    initialImage: string | null;
    model: string;
    colors?: ColorOption[] | null;
    isPromoActive: boolean;
}

export default function CarShowcase({ initialImage, model, colors, isPromoActive }: CarShowcaseProps) {
    // Estado para controlar qual imagem está aparecendo
    const [currentImage, setCurrentImage] = useState(initialImage);
    const [selectedColor, setSelectedColor] = useState(colors?.[0]?.name || null);

    return (
        <div className="space-y-6">
            
            {/* FOTO PRINCIPAL */}
            {/* MUDANÇA 1: Adicionei 'p-6' (padding) para criar respiro em volta do carro */}
            {/* Adicionei 'flex items-center justify-center' para garantir alinhamento perfeito */}
            <div className="aspect-[16/9] w-full bg-gray-100 rounded-3xl overflow-hidden shadow-xl relative group p-6 flex items-center justify-center">
                {currentImage ? (
                    <img 
                        src={currentImage} 
                        alt={model} 
                        // MUDANÇA 2: Troquei 'object-cover' por 'object-contain'
                        // Isso faz o carro caber inteiro dentro do espaço, dando o efeito de "zoom out"
                        className="w-full h-full object-contain transition-all duration-500 ease-in-out group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">Sem Imagem</div>
                )}
                
                {isPromoActive && (
                    <div className="absolute top-6 right-6 bg-yellow-400 text-black px-4 py-2 font-bold uppercase tracking-widest text-sm shadow-lg rounded flex items-center gap-2 animate-pulse z-10">
                        <Zap size={18} /> Oferta Relâmpago
                    </div>
                )}
            </div>

            {/* SELETOR DE CORES (Só aparece se tiver cores cadastradas) */}
            {colors && colors.length > 0 && (
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 animate-in slide-in-from-bottom-4 duration-700">
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-4">
                        Escolha a Cor: <span className="text-gray-900 ml-1">{selectedColor}</span>
                    </h3>
                    
                    <div className="flex flex-wrap gap-4">
                        {colors.map((color) => (
                            <button
                                key={color.name}
                                onClick={() => {
                                    setCurrentImage(color.image_url);
                                    setSelectedColor(color.name);
                                }}
                                className={`w-10 h-10 rounded-full shadow-sm border-2 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                                    selectedColor === color.name ? 'border-yellow-500 scale-110 ring-2 ring-yellow-500 ring-offset-2' : 'border-gray-200'
                                }`}
                                style={{ backgroundColor: color.hex }}
                                title={color.name}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}