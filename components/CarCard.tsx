import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { Settings } from "lucide-react";

interface CarCardProps {
    id: string;
    model: string;
    price: number;
    image_url: string | null;
}

export default function CarCard({ id, model, price, image_url }: CarCardProps) {
  return (
    // Aumentei o padding (p-8) para ficar mais espaçado
    <div className="group block bg-white border border-transparent hover:border-gray-200 hover:shadow-2xl transition-all duration-500 ease-out p-8 rounded-3xl text-center relative flex flex-col h-full hover:-translate-y-2">
        
        {/* Nome Maior */}
        <h3 className="text-2xl font-extrabold text-gray-900 uppercase tracking-tight mb-2">
            {model}
        </h3>
        
        <p className="text-sm text-gray-500 uppercase font-bold tracking-widest mb-6">
            A partir de {formatCurrency(price)}
        </p>

        {/* IMAGEM BEM MAIOR (h-60) */}
        <div className="relative h-60 w-full mb-8 flex items-center justify-center flex-1">
            {image_url && (
                <Link href={`/carros/${id}`} className="w-full h-full flex items-center justify-center">
                    <img 
                        src={image_url} 
                        alt={model} 
                        // O 'object-contain' garante que o carro inteiro apareça sem cortes
                        className="max-h-full max-w-full object-contain transition-transform duration-700 ease-in-out group-hover:scale-110 cursor-pointer drop-shadow-lg group-hover:drop-shadow-2xl"
                    />
                </Link>
            )}
        </div>

        {/* Botões Maiores */}
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