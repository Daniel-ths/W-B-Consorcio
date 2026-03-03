"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  ArrowLeft, 
  Printer, 
  Calendar, 
  TrendingUp, 
  PieChart as PieIcon, 
  BarChart3 
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

export default function ReportsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState<any[]>([]);

  // Cores para o gráfico de pizza
  const COLORS = ['#22c55e', '#eab308', '#ef4444']; // Verde, Amarelo, Vermelho

  useEffect(() => {
    const fetchData = async () => {
      // Busca todas as vendas
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) console.error(error);
      setSales(data || []);
      setLoading(false);
    };

    fetchData();
  }, []);

  // --- PROCESSAMENTO DE DADOS ---

  // 1. Dados para Gráfico de Faturamento (Agrupado por Mês)
  const revenueData = sales.reduce((acc: any[], sale) => {
    const date = new Date(sale.created_at);
    const month = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }); // ex: jan/24
    
    const existing = acc.find(item => item.name === month);
    if (existing) {
      existing.total += Number(sale.total_price);
    } else {
      acc.push({ name: month, total: Number(sale.total_price) });
    }
    return acc;
  }, []);

  // 2. Dados para Gráfico de Pizza (Status)
  const statusData = [
    { name: 'Aprovados', value: sales.filter(s => s.status === 'Aprovado').length },
    { name: 'Em Análise', value: sales.filter(s => s.status === 'Em Análise' || s.status === 'Pendente').length },
    { name: 'Rejeitados', value: sales.filter(s => s.status === 'Rejeitado').length },
  ].filter(item => item.value > 0); // Remove zerados

  // 3. Carros mais vendidos
  const carRanking = sales.reduce((acc: any, sale) => {
    const car = sale.car_name || "Desconhecido";
    acc[car] = (acc[car] || 0) + 1;
    return acc;
  }, {});
  
  // Transforma em array e ordena
  const topCars = Object.entries(carRanking)
    .sort(([,a]:any, [,b]:any) => b - a)
    .slice(0, 5); // Top 5

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  if (loading) return <div className="h-screen flex items-center justify-center text-slate-500">Gerando relatórios...</div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-12">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 mb-8 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <TrendingUp className="text-blue-600" size={24}/> Relatórios de Desempenho
              </h1>
              <p className="text-xs text-slate-500">Análise detalhada das vendas</p>
            </div>
          </div>
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-black border border-slate-300 px-4 py-2 rounded-lg hover:bg-slate-50 print:hidden"
          >
            <Printer size={16}/> Imprimir
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 space-y-8">
        
        {/* GRÁFICO 1: FATURAMENTO NO TEMPO */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <BarChart3 size={20} className="text-slate-400"/>
              Faturamento Mensal
            </h3>
            <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">
              Total: {formatCurrency(sales.reduce((acc, curr) => acc + Number(curr.total_price), 0))}
            </span>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#64748b', fontSize: 12}} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#64748b', fontSize: 12}} 
                  tickFormatter={(value) => `R$${value/1000}k`}
                />
                <Tooltip 
                  cursor={{fill: '#f1f5f9'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  formatter={(value: any) => [formatCurrency(Number(value)), "Faturamento"]}
                />
                <Bar dataKey="total" fill="#0f172a" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* GRÁFICO 2: PIZZA DE STATUS */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
              <PieIcon size={20} className="text-slate-400"/>
              Status das Propostas
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* LISTA: TOP CARROS */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
              <TrendingUp size={20} className="text-slate-400"/>
              Veículos Mais Vendidos
            </h3>
            
            <div className="flex-1">
              {topCars.length > 0 ? (
                <div className="space-y-4">
                  {topCars.map(([car, count]: any, index) => (
                    <div key={car} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold text-sm">
                          {index + 1}
                        </div>
                        <span className="font-medium text-slate-700">{car}</span>
                      </div>
                      <span className="text-sm font-bold text-slate-900">{count} un.</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                  Sem dados suficientes.
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}