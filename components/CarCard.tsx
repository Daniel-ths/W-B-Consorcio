"use client" // <--- Importante: Agora é um componente interativo

import { useState } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { Settings } from "lucide-react";

// Definição do tipo para as cores
export interface ColorOption {
    name: string;
    hex: string;
    image_url: string;
}

interface CarCardProps {
    id: string | number; // Aceita string ou number para evitar erros
    model: string;
    price: number | string; // Aceita string caso venha formatado do banco
    image_url: string | null;
    colors?: ColorOption[]; // Nova prop opcional
}

export default function CarCard({ id, model, price, image_url, colors }: CarCardProps) {
  // Estado para controlar a imagem atual (começa com a padrão)
  const [currentImage, setCurrentImage] = useState(image_url);
  
  // Estado para saber qual cor está selecionada (para destacar a bolinha)
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  // Helper para formatar preço se for número, ou exibir direto se for string
  const displayPrice = typeof price === 'number' ? formatCurrency(price) : price;

  return (
    <div className="group block bg-white border border-transparent hover:border-gray-200 hover:shadow-2xl transition-all duration-500 ease-out p-8 rounded-3xl text-center relative flex flex-col h-full hover:-translate-y-2">
        
        {/* Nome Maior */}
        <h3 className="text-2xl font-extrabold text-gray-900 uppercase tracking-tight mb-2">
            {model}
        </h3>
        
        <p className="text-sm text-gray-500 uppercase font-bold tracking-widest mb-6">
            A partir de {displayPrice}
        </p>

        {/* IMAGEM BEM MAIOR (h-60) */}
        {/* Adicionei 'relative' e 'group' para animações futuras se precisar */}
        <div className="relative h-60 w-full mb-6 flex items-center justify-center flex-1">
            {currentImage ? (
                <Link href={`/carros/${id}`} className="w-full h-full flex items-center justify-center">
                    <img 
                        src={currentImage} 
                        alt={model} 
                        // Mantive seu estilo de object-contain e as transições
                        className="max-h-full max-w-full object-contain transition-transform duration-700 ease-in-out group-hover:scale-110 cursor-pointer drop-shadow-lg group-hover:drop-shadow-2xl"
                    />
                </Link>
            ) : (
                <div className="text-gray-300 font-bold text-sm uppercase">Imagem indisponível</div>
            )}
        </div>

        {/* --- NOVO: SELETOR DE CORES (Só aparece se tiver cores) --- */}
        {colors && colors.length > 0 && (
            <div className="mb-6 animate-in slide-in-from-bottom-2 duration-500">
                <div className="flex justify-center flex-wrap gap-3">
                    {colors.map((color) => (
                        <button
                            key={color.name}
                            onClick={(e) => {
                                e.preventDefault(); // Evita clicar no Link do card se ele envolvesse tudo
                                setCurrentImage(color.image_url);
                                setSelectedColor(color.name);
                            }}
                            className={`w-8 h-8 rounded-full shadow-md border-2 transition-all hover:scale-125 ${
                                selectedColor === color.name 
                                ? 'border-blue-600 scale-110 ring-2 ring-blue-100' 
                                : 'border-gray-200'
                            }`}
                            style={{ backgroundColor: color.hex }}
                            title={color.name}
                        />
                    ))}
                </div>
                {selectedColor && (
                    <p className="text-[10px] uppercase font-bold text-gray-400 mt-2 tracking-widest">
                        Cor: <span className="text-gray-800">{selectedColor}</span>
                    </p>
                )}
            </div>
        )}

        {/* Botões Maiores (Seu layout original) */}
        <div className="grid grid-cols-2 gap-4 mt-auto">
            <Link 
                href={`/carros/${id}`}
                className="flex items-center justify-center gap-2 py-4 border border-gray-200 text-gray-600 font-bold uppercase text-xs tracking-widest rounded-lg hover:bg-gray-50 transition-colors"
            >
                Detalhes
            </Link>

            <Link 
                href={`/monte-o-seu/${id}`}
                className="flex items-center justify-center gap-2 py-4 bg-yellow-500 text-white font-bold uppercase text-xs tracking-widest rounded-lg hover:bg-yellow-600 transition-colors shadow-md hover:shadow-lg"
            >
                <Settings size={14}/> Montar
            </Link>
        </div>
    </div>
  );
}