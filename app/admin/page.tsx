"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  LayoutDashboard, Plus, FileText, Wallet, Users, TrendingUp, Car, Search, Phone, ExternalLink, Check, Trash2 
} from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  // NÃO usamos useRouter (para garantir que não há redirect)
  
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("🔓 MODO LIVRE: Buscando dados sem verificar usuário...");
        
        // Busca direta (confia apenas no RLS do banco de dados)
        const { data, error } = await supabase
          .from("sales")
          .select(`*, profiles:seller_id (email)`) 
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Erro Supabase:", error);
        }

        setSales(data || []);
      } catch (err) {
        console.error("Erro Geral:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- FUNÇÕES DE AÇÃO (Simplificadas) ---
  const handleApproveSale = async (saleId: string) => {
    if (!confirm("Aprovar venda?")) return;
    await supabase.from('sales').update({ status: 'Aprovado' }).eq('id', saleId);
    setSales(prev => prev.map(s => s.id === saleId ? { ...s, status: 'Aprovado' } : s));
  };

  const handleDeleteSale = async (saleId: string) => {
    if (!confirm("Excluir registro?")) return;
    await supabase.from('sales').delete().eq('id', saleId);
    setSales(prev => prev.filter(s => s.id !== saleId));
  };

  // --- CÁLCULOS KPI ---
  const filteredSales = sales.filter(s => 
    s.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.car_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalRevenue = filteredSales.reduce((acc, curr) => acc + (Number(curr.total_price) || 0), 0);
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR');

  if (loading) return <div className="p-10 text-center font-bold text-blue-600">Carregando Painel (Sem Auth)...</div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      
      {/* HEADER DE AVISO */}
      <div className="bg-red-600 text-white text-center text-xs font-bold py-2 uppercase tracking-widest">
        ⚠️ Modo de Segurança Desativado: Acesso Livre
      </div>

      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-black text-white p-2 rounded-lg"><LayoutDashboard size={20} /></div>
            <h1 className="font-bold text-lg">Admin Dashboard</h1>
          </div>
          <Link href="/" className="text-xs font-bold text-slate-500 hover:text-black">Voltar ao Site</Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-slate-500 text-xs font-bold uppercase">Faturamento Total</p>
            <h3 className="text-2xl font-bold text-slate-900">{formatCurrency(totalRevenue)}</h3>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-slate-500 text-xs font-bold uppercase">Vendas Registradas</p>
            <h3 className="text-2xl font-bold text-slate-900">{filteredSales.length}</h3>
          </div>
        </div>

        {/* TABELA */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-slate-700">Registros</h3>
                <input 
                  type="text" 
                  placeholder="Filtrar..." 
                  className="px-3 py-1 border rounded text-sm"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b">
                    <tr>
                        <th className="px-4 py-3">Cliente</th>
                        <th className="px-4 py-3">Carro</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Valor</th>
                        <th className="px-4 py-3 text-right">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredSales.map(sale => (
                        <tr key={sale.id} className="border-b hover:bg-slate-50">
                            <td className="px-4 py-3 font-bold">{sale.client_name}<br/><span className="text-xs font-normal text-gray-400">{formatDate(sale.created_at)}</span></td>
                            <td className="px-4 py-3">{sale.car_name}</td>
                            <td className="px-4 py-3">{sale.status}</td>
                            <td className="px-4 py-3 text-right font-bold">{formatCurrency(sale.total_price)}</td>
                            <td className="px-4 py-3 text-right flex justify-end gap-2">
                                <button onClick={() => handleApproveSale(sale.id)} className="text-green-600 border p-1 rounded hover:bg-green-50"><Check size={14}/></button>
                                <button onClick={() => handleDeleteSale(sale.id)} className="text-red-600 border p-1 rounded hover:bg-red-50"><Trash2 size={14}/></button>
                            </td>
                        </tr>
                    ))}
                    {filteredSales.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-gray-400">Sem dados (Verifique se está logado ou se o RLS permite)</td></tr>}
                </tbody>
            </table>
        </div>
      </main>
    </div>
  );
}