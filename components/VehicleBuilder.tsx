"use client"

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { Check } from "lucide-react";
import CheckoutForm from "./CheckoutForm"; // <--- O Import deve funcionar se ambos estiverem na mesma pasta 'components'

const COLORS = [
  { name: 'Branco Summit', price: 0, hex: '#ffffff', border: 'border-gray-200' },
  { name: 'Preto Ouro Negro', price: 1750, hex: '#000000', border: 'border-black' },
  { name: 'Prata Switchblade', price: 1850, hex: '#C0C0C0', border: 'border-gray-400' },
  { name: 'Cinza Drake', price: 1950, hex: '#555555', border: 'border-gray-600' },
  { name: 'Vermelho Chili', price: 2100, hex: '#b91c1c', border: 'border-red-600' },
  { name: 'Azul Eclipse', price: 2100, hex: '#1e3a8a', border: 'border-blue-900' },
];

export default function VehicleBuilder({ vehicle }: { vehicle: any }) {
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const totalPrice = vehicle.price + selectedColor.price;

  return (
    <div className="flex flex-col lg:flex-row gap-8 min-h-[600px] items-start animate-in fade-in duration-700">
      {/* LADO ESQUERDO: O CARRO E CORES */}
      <div className="lg:w-1/2 w-full sticky top-24 space-y-8">
         <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100 relative overflow-hidden group text-center">
            <h1 className="text-3xl font-black uppercase text-gray-900 leading-none mb-2">{vehicle.model}</h1>
            <p className="text-sm text-gray-500 mb-6">{vehicle.brand} • {vehicle.year}</p>
            <img src={vehicle.image_url} alt={vehicle.model} className="w-full h-auto object-contain drop-shadow-2xl z-10 relative transition-transform duration-700 group-hover:scale-105"/>
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-2/3 h-4 bg-black/20 blur-xl rounded-[100%]"></div>
         </div>

         <div className="bg-white p-6 rounded-2xl border border-gray-200">
            <div className="flex justify-between items-center mb-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-gray-900">Cor: <span className="text-yellow-600">{selectedColor.name}</span></h4>
                <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">{selectedColor.price > 0 ? `+ ${formatCurrency(selectedColor.price)}` : 'Sem custo'}</span>
            </div>
            <div className="flex flex-wrap gap-3">
                {COLORS.map((color) => (
                    <button key={color.name} onClick={() => setSelectedColor(color)} className={`w-12 h-12 rounded-full shadow-sm border-2 transition-all hover:scale-110 ${color.border} ${selectedColor.name === color.name ? 'ring-2 ring-offset-2 ring-yellow-500 scale-110' : ''}`} style={{ backgroundColor: color.hex }}/>
                ))}
            </div>
         </div>
         
         <div className="grid grid-cols-2 gap-4">
            {vehicle.features?.map((feat: string, i: number) => (
                <div key={i} className="flex items-center gap-2 text-xs font-bold text-gray-600 bg-gray-50 border border-gray-100 p-3 rounded-lg"><Check size={14} className="text-green-600 shrink-0"/> {feat}</div>
            ))}
         </div>
      </div>

      {/* LADO DIREITO: CHECKOUT */}
      <div className="lg:w-1/2 w-full">
         <CheckoutForm vehicleModel={vehicle.model} vehiclePrice={totalPrice} vehicleImage={vehicle.image_url} />
      </div>
    </div>
  )
}