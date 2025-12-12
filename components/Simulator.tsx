"use client" 

import { useState, useEffect } from "react"
import { formatCurrency } from "@/lib/utils"
import { Calculator, ArrowRight } from "lucide-react"

interface SimulatorProps {
  vehiclePrice: number;
  vehicleModel: string;
}

export default function Simulator({ vehiclePrice, vehicleModel }: SimulatorProps) {
  // Estado inicial (Entrada de 30% padrão)
  const [entryValue, setEntryValue] = useState(vehiclePrice * 0.3) 
  const [months, setMonths] = useState(48) 
  const [monthlyPayment, setMonthlyPayment] = useState(0)
  
  // Taxa de juros fictícia (1.89% a.m.)
  const INTEREST_RATE = 0.0189 

  // Função de Cálculo (Tabela Price)
  const calculate = () => {
    const financedAmount = vehiclePrice - entryValue;
    
    // Se a entrada for maior que o valor do carro, zera
    if (financedAmount <= 0) {
      setMonthlyPayment(0);
      return;
    }

    const pmt = financedAmount * (
      (Math.pow(1 + INTEREST_RATE, months) * INTEREST_RATE) / 
      (Math.pow(1 + INTEREST_RATE, months) - 1)
    );

    setMonthlyPayment(pmt);
  }

  // Recalcula sempre que os valores mudam
  useEffect(() => {
    calculate();
  }, [entryValue, months, vehiclePrice]);

  // Mensagem pronta para o WhatsApp
  const whatsappMessage = `Olá! Fiz uma simulação no site para o *${vehicleModel}* com entrada de ${formatCurrency(entryValue)} e gostaria de saber mais.`;
  const whatsappLink = `https://wa.me/5591999999999?text=${encodeURIComponent(whatsappMessage)}`; 

  return (
    // MUDANÇA 1: Fundo Branco e Borda Cinza
    <div className="bg-white p-8 border border-gray-200 rounded-3xl shadow-xl">
      <div className="flex items-center gap-3 mb-8 border-b border-gray-100 pb-4">
        {/* MUDANÇA 2: Ícone Azul e Texto Escuro */}
        <Calculator className="text-blue-600" size={20} />
        <h3 className="font-bold text-sm tracking-[0.2em] uppercase text-gray-900">Simular Financiamento</h3>
      </div>

      <div className="space-y-8">
        {/* Campo de Entrada */}
        <div className="group">
          <label htmlFor="entry" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 group-hover:text-blue-600 transition-colors">
            Valor de Entrada
          </label>
          <div className="relative">
             <span className="absolute left-0 top-2 text-gray-900 font-light">R$</span>
             <input 
                id="entry" 
                type="number" 
                value={entryValue}
                onChange={(e) => setEntryValue(Number(e.target.value))}
                // MUDANÇA 3: Texto Escuro e Borda Cinza
                className="w-full bg-transparent border-b border-gray-300 py-2 pl-8 text-xl font-light text-gray-900 focus:outline-none focus:border-blue-600 transition-colors placeholder-gray-400 rounded-none"
             />
          </div>
        </div>

        {/* Campo de Parcelas (Select) */}
        <div className="group">
          <label htmlFor="months" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 group-hover:text-blue-600 transition-colors">
            Tempo (Meses)
          </label>
          <select 
            id="months"
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
            // MUDANÇA 4: Texto Escuro e Opções com fundo branco
            className="w-full bg-transparent border-b border-gray-300 py-2 text-xl font-light text-gray-900 focus:outline-none focus:border-blue-600 transition-colors rounded-none cursor-pointer appearance-none"
          >
            <option value={12} className="bg-white text-gray-900">12x Parcelas</option>
            <option value={24} className="bg-white text-gray-900">24x Parcelas</option>
            <option value={36} className="bg-white text-gray-900">36x Parcelas</option>
            <option value={48} className="bg-white text-gray-900">48x Parcelas</option>
            <option value={60} className="bg-white text-gray-900">60x Parcelas</option>
          </select>
        </div>

        {/* Resultado do Cálculo */}
        <div className="pt-6 border-t border-gray-100">
          <div className="flex justify-between items-end mb-2">
            <span className="text-xs uppercase tracking-widest text-gray-500">Parcela Estimada</span>
          </div>
          {/* MUDANÇA 5: Valor Grande Escuro */}
          <div className="text-4xl font-bold text-gray-900 tracking-tight">
            {formatCurrency(monthlyPayment)}
          </div>
          <p className="text-[10px] text-gray-500 mt-2 uppercase tracking-wide">
            *Sujeito a análise de crédito. Taxa base de 1.89% a.m.
          </p>
        </div>

        {/* Botão WhatsApp (Azul Chevrolet) */}
        <a 
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-blue-600 text-white h-14 font-bold uppercase tracking-[0.15em] hover:bg-blue-700 transition-all flex items-center justify-center gap-4 text-xs mt-4 rounded shadow-lg shadow-blue-200"
        >
          Falar com Vendedor <ArrowRight size={16}/>
        </a>
      </div>
    </div>
  )
}