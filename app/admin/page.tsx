"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  LayoutDashboard, 
  Car, 
  Plus, 
  LogOut, 
  ArrowRight
} from "lucide-react";

export default function AdminDashboard() {
  const router = useRouter();
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      // 1. Verifica login
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return router.push("/login");
      }

      // 2. Segurança CORRETA (Consulta a tabela profiles)
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        // Se não for admin, manda para o painel dele (ou home)
        router.push(profile?.role === 'vendedor' ? "/vendedor/dashboard" : "/"); 
        return;
      }

      // 3. Busca DADOS GERAIS (Todas as vendas)
      const { data, error } = await supabase
        .from("sales")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) console.error("Erro ao buscar vendas:", error);
      setSales(data || []);
      setLoading(false);
    };

    fetchAdminData();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR');

  if (loading) return <div className="h-screen bg-gray-900 text-white flex items-center justify-center">Carregando Painel Gerencial...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      
      {/* HEADER DO ADMIN */}
      <header className="border-b border-gray-800 bg-gray-900 sticky top-0 z-20 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-500 p-2 rounded text-black">
              <LayoutDashboard size={24} />
            </div>
            <div>
              <h1 className="font-bold text-xl text-white">WB Auto Admin</h1>
              <p className="text-xs text-gray-400">Visão Geral</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push("/vendedor/dashboard")}
              className="text-sm text-gray-400 hover:text-white flex items-center gap-2 border border-gray-700 px-3 py-1.5 rounded transition-colors"
            >
              <ArrowRight size={14}/> Visão do Vendedor
            </button>
            <button onClick={handleLogout} className="text-red-400 hover:text-red-300 font-bold text-sm flex items-center gap-2">
              <LogOut size={16} /> Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {/* BOTÕES DE AÇÃO */}
        <div className="flex gap-4 mb-8">
            <button onClick={() => alert("Adicionar Carro")} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2">
                <Plus size={20}/> Adicionar Carro
            </button>
            <button onClick={() => alert("Ver Estoque")} className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2">
                <Car size={20}/> Gerenciar Estoque
            </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <p className="text-gray-400 text-xs font-bold uppercase">Faturamento Total</p>
            <p className="text-3xl font-bold text-white mt-2">
                {formatCurrency(sales.reduce((acc, curr) => acc + (Number(curr.total_price) || 0), 0))}
            </p>
          </div>
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <p className="text-gray-400 text-xs font-bold uppercase">Vendas Realizadas</p>
            <p className="text-3xl font-bold text-white mt-2">{sales.length}</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <p className="text-gray-400 text-xs font-bold uppercase">Taxa de Aprovação</p>
            <p className="text-3xl font-bold text-white mt-2">
                {sales.length > 0 ? ((sales.filter(s => s.status === 'Aprovado').length / sales.length) * 100).toFixed(0) : 0}%
            </p>
          </div>
        </div>

        {/* TABELA DE VENDAS */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-700 font-bold text-white">Todas as Transações</div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-300">
                    <thead className="bg-gray-900 text-gray-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-3">Data</th>
                            <th className="px-6 py-3">Vendedor</th>
                            <th className="px-6 py-3">Cliente</th>
                            <th className="px-6 py-3">Carro</th>
                            <th className="px-6 py-3 text-right">Valor</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {sales.map((sale) => (
                            <tr key={sale.id} className="hover:bg-gray-700/50">
                                <td className="px-6 py-4">{formatDate(sale.created_at)}</td>
                                {/* Aqui seria legal fazer um join para pegar o nome do vendedor em vez do ID, mas deixei o ID por enquanto */}
                                <td className="px-6 py-4 text-yellow-500 font-mono text-xs">{sale.seller_id?.slice(0,8)}...</td>
                                <td className="px-6 py-4 text-white font-bold">{sale.client_name}</td>
                                <td className="px-6 py-4">{sale.car_name}</td>
                                <td className="px-6 py-4 text-right text-white">{formatCurrency(sale.total_price)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {sales.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    Nenhuma venda encontrada no sistema.
                  </div>
                )}
            </div>
        </div>
      </main>
    </div>
  );
}