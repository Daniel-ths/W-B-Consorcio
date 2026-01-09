"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  ShieldCheck, Users, DollarSign, BarChart3, LogOut, ArrowRight 
} from "lucide-react";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      // 1. Verifica login
      const { data: { user } } = await supabase.auth.getUser();
      
      // Se não tem usuário, manda pro login
      if (!user) return router.push("/login");

      // SEGUNDA CAMADA DE SEGURANÇA (Frontend)
      // Se o email não for o do admin, chuta ele para a área de vendedor
      if (user.email?.toLowerCase().trim() !== 'admin@gmail.com') {
         router.push("/vendedor");
         return;
      }

      // 2. Busca TODAS as vendas (sem filtro de ID, pois é o admin)
      const { data, error } = await supabase
        .from("sales")
        .select("*") 
        .order("created_at", { ascending: false });

      if (!error) {
        setSales(data || []);
      } else {
        console.error("Erro ao buscar dados admin:", error);
      }
      
      setLoading(false);
    };

    fetchAllData();
  }, [router]);

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-gray-900 text-white">Carregando Painel Admin...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      
      {/* --- HEADER DO ADMIN --- */}
      <header className="border-b border-gray-800 bg-gray-900 px-8 py-5 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-yellow-500" size={28} />
          <div>
            <h1 className="font-bold text-xl tracking-tight">WB Auto <span className="text-gray-500 font-normal">| Admin</span></h1>
          </div>
        </div>
        
        <div className="flex gap-4 items-center">
            
            {/* --- BOTÃO PARA IR AO PAINEL DE VENDEDOR --- */}
            <button 
                onClick={() => router.push("/vendedor")} 
                className="text-sm bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors border border-gray-700 flex items-center gap-2"
            >
                Ir para Área Vendedor <ArrowRight size={14} />
            </button>

            <div className="h-6 w-px bg-gray-700"></div>
            
            <button onClick={handleLogout} className="text-red-400 hover:text-red-300 text-sm font-bold flex items-center gap-2">
              <LogOut size={16} /> Sair
            </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-10">
        
        {/* KPI GLOBAL */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          {/* Faturamento */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-blue-500/20 rounded text-blue-400"><DollarSign size={20}/></div>
                <span className="text-xs font-bold text-gray-400 uppercase">Faturamento Total</span>
            </div>
            <p className="text-3xl font-bold text-white">
                {formatCurrency(sales.reduce((acc, curr) => acc + (Number(curr.total_price) || 0), 0))}
            </p>
          </div>

          {/* Quantidade Vendas */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-purple-500/20 rounded text-purple-400"><Users size={20}/></div>
                <span className="text-xs font-bold text-gray-400 uppercase">Simulações Totais</span>
            </div>
            <p className="text-3xl font-bold text-white">{sales.length}</p>
          </div>

          {/* Aprovação */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-green-500/20 rounded text-green-400"><BarChart3 size={20}/></div>
                <span className="text-xs font-bold text-gray-400 uppercase">Taxa de Aprovação</span>
            </div>
            <p className="text-3xl font-bold text-white">
                {sales.length > 0 ? ((sales.filter(s => s.status === 'Aprovado').length / sales.length) * 100).toFixed(0) : 0}%
            </p>
          </div>
        </div>

        {/* TABELA MESTRA (Histórico Global) */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <h3 className="font-bold text-lg text-white">Todas as Vendas (Visão Gerencial)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-300">
                <thead className="bg-gray-900/50 text-xs uppercase font-bold text-gray-500">
                <tr>
                    <th className="px-6 py-4">Data</th>
                    <th className="px-6 py-4">Vendedor ID</th>
                    <th className="px-6 py-4">Cliente</th>
                    <th className="px-6 py-4">Carro</th>
                    <th className="px-6 py-4">Score</th>
                    <th className="px-6 py-4 text-right">Valor</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                {sales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 text-gray-400 whitespace-nowrap">
                        {new Date(sale.created_at).toLocaleDateString('pt-BR')} <span className="text-xs ml-1 opacity-50">{new Date(sale.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-yellow-500">
                        {sale.seller_id ? sale.seller_id.slice(0, 8) + '...' : 'N/A'}
                    </td>
                    <td className="px-6 py-4 font-bold text-white">
                        {sale.client_name}
                        <div className="text-xs text-gray-500 font-normal">{sale.client_cpf}</div>
                    </td>
                    <td className="px-6 py-4">{sale.car_name}</td>
                    <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                            sale.score_result > 600 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                            {sale.score_result}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-right text-white">
                        {formatCurrency(sale.total_price)}
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            {sales.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  Nenhum dado encontrado.<br/>
                  <span className="text-xs">Verifique se existem vendas no banco de dados.</span>
                </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}