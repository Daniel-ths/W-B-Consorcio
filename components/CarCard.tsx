import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface CarCardProps {
    id: string;
    model: string;
    brand: string;
    price: number;
    year: number;
    image_url: string | null;
    description: string;
}

export default function CarCard({ id, model, brand, price, year, image_url }: CarCardProps) {
  return (
    <Link href={`/carros/${id}`} className="group block relative">
        {/* Imagem (Foco Total) */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-900">
            {image_url && (
                <img 
                    src={image_url} 
                    alt={model} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                />
            )}
            
            {/* Overlay sutil no hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-500"></div>

            {/* Tag do Ano */}
            <div className="absolute top-4 left-4 bg-white text-black text-xs font-bold px-2 py-1 uppercase tracking-widest">
                {year}
            </div>
        </div>

        {/* Informações (Minimalista em baixo) */}
        <div className="pt-4 flex justify-between items-end border-b border-gray-800 pb-4 group-hover:border-white transition-colors duration-500">
            <div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">{brand}</span>
                <h3 className="text-xl font-medium text-white group-hover:text-gray-200 uppercase tracking-wide">
                    {model}
                </h3>
                <p className="text-gray-400 text-sm mt-1">A partir de {formatCurrency(price)}</p>
            </div>
            
            <div className="bg-transparent border border-gray-600 rounded-full p-2 group-hover:bg-white group-hover:text-black group-hover:border-white transition-all">
                <ArrowUpRight size={20} />
            </div>
        </div>
    </Link>
  );
}