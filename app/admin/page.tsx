"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  LayoutDashboard, Plus, FileText, Wallet, Users, TrendingUp, Car, Search, Phone, ExternalLink, Check, Trash2, ArrowRight, LogOut 
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const router = useRouter();
  
  // --- ESTADOS ---
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // --- O CÓDIGO QUE IGNORA A SEGURANÇA ---
  useEffect(() => {
    const initUnsafe = async () => {
      try {
        console.log("⚡ MODO INSEGURO: Buscando dados direto...");

        // NÃO VERIFICA USUÁRIO
        // NÃO VERIFICA PERFIL
        // NÃO REDIRECIONA

        // Busca Vendas Direto
        const { data: salesData, error } = await supabase
          .from("sales")
          .select(`*, profiles:seller_id (email)`) 
          .order("created_at", { ascending: false });

        if (error) console.error("Erro Supabase:", error);
        
        setSales(salesData || []);
      } catch (err) {
        console.error("Erro Geral:", err);
      } finally {
        setLoading(false);
      }
    };

    initUnsafe();
  }, []);

  // --- FUNÇÕES DE AÇÃO ---
  const handleApproveSale = async (saleId: string) => {
    if (!window.confirm("Aprovar?")) return;
    setIsUpdating(saleId);
    try {
      await supabase.from('sales').update({ status: 'Aprovado' }).eq('id', saleId);
      setSales((prev) => prev.map((s) => s.id === saleId ? { ...s, status: 'Aprovado' } : s));
    } finally { setIsUpdating(null); }
  };

  const handleDeleteSale = async (saleId: string) => {
    if (!window.confirm("Excluir?")) return;
    setIsDeleting(saleId);
    try {
      await supabase.from('sales').delete().eq('id', saleId);
      setSales((prev) => prev.filter((s) => s.id !== saleId));
    } finally { setIsDeleting(null); }
  };

  // --- CÁLCULOS KPI ---
  const filteredSales = sales.filter(s => 
    s.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.car_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalRevenue = filteredSales.reduce((acc, curr) => acc + (Number(curr.total_price) || 0), 0);
  const totalClients = new Set(filteredSales.map(s => s.client_cpf || s.client_name)).size;
  const averageTicket = sales.length > 0 ? totalRevenue / sales.length : 0;
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR');

  if (loading) return <div className="p-10 text-center font-bold">Carregando Painel (Modo Livre)...</div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <div className="bg-red-600 text-white text-center text-xs font-bold py-1">⚠️ MODO DE DEBUG: AUTENTICAÇÃO DESATIVADA ⚠️</div>
      
      {/* NAVBAR */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-black text-white p-2 rounded-lg"><LayoutDashboard size={20} /></div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Admin Dashboard</h1>
            </div>
          </div>
          <button onClick={() => router.push("/")} className="text-xs font-bold border px-3 py-1 rounded">Voltar ao Site</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {/* HEADER AÇÕES */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">Visão Geral</h2>
          <div className="flex gap-2">
            <Link href="/admin/cars/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-sm"><Plus size={16}/> Novo Carro</Link>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl border shadow-sm"><p className="text-xs font-bold text-gray-400 uppercase">Faturamento</p><h3 className="text-xl font-bold">{formatCurrency(totalRevenue)}</h3></div>
          <div className="bg-white p-5 rounded-xl border shadow-sm"><p className="text-xs font-bold text-gray-400 uppercase">Vendas</p><h3 className="text-xl font-bold">{filteredSales.length}</h3></div>
          <div className="bg-white p-5 rounded-xl border shadow-sm"><p className="text-xs font-bold text-gray-400 uppercase">Clientes</p><h3 className="text-xl font-bold">{totalClients}</h3></div>
          <div className="bg-white p-5 rounded-xl border shadow-sm"><p className="text-xs font-bold text-gray-400 uppercase">Ticket Médio</p><h3 className="text-xl font-bold">{formatCurrency(averageTicket)}</h3></div>
        </div>

        {/* TABELA */}
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
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
                  <td className="px-4 py-3"><span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold">{sale.status || 'Pendente'}</span></td>
                  <td className="px-4 py-3 text-right font-bold">{formatCurrency(sale.total_price)}</td>
                  <td className="px-4 py-3 text-right flex justify-end gap-2">
                    <button onClick={() => handleApproveSale(sale.id)} className="text-green-600 p-1 border rounded hover:bg-green-50"><Check size={14}/></button>
                    <button onClick={() => handleDeleteSale(sale.id)} className="text-red-600 p-1 border rounded hover:bg-red-50"><Trash2 size={14}/></button>
                  </td>
                </tr>
              ))}
              {filteredSales.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-gray-400">Nenhum dado encontrado.</td></tr>}
            </tbody>
          </table>
        </div>

      </main>
    </div>
  );
}