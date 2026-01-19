"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  LayoutDashboard, Plus, FileText, Wallet, Users, TrendingUp, Car, Search, Phone, ExternalLink, Check, Trash2, ArrowRight, LogOut 
} from "lucide-react";

export default function AdminDashboard({ children }: { children: React.ReactNode }) {
  // --- ESTADOS ---
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [envStatus, setEnvStatus] = useState("");

  // --- IGNORAR AUTENTICAÇÃO (MODO INSEGURO) ---
  // Não verificamos user nem profile. Carregamos direto.
  
  useEffect(() => {
    const initUnsafeDashboard = async () => {
      try {
        // 1. DIAGNÓSTICO DE VARIÁVEIS (Vai aparecer no topo da tela)
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        const statusMsg = `URL: ${url ? '✅ Definida' : '❌ INDEFINIDA'} | KEY: ${key ? '✅ Definida' : '❌ INDEFINIDA'}`;
        setEnvStatus(statusMsg);
        console.log("Status Vercel:", statusMsg);

        // 2. BUSCA DADOS DIRETO (Sem checar login)
        const { data: salesData, error } = await supabase
          .from("sales")
          .select(`*, profiles:seller_id (email)`) 
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Erro ao buscar dados:", error);
          alert("Erro no Banco: " + error.message);
        }

        setSales(salesData || []);

      } catch (err: any) {
        console.error("Erro fatal:", err);
      } finally {
        setLoading(false);
      }
    };

    initUnsafeDashboard();
  }, []);

  // --- FUNÇÕES DE AÇÃO ---
  const handleApproveSale = async (saleId: string) => { /* ...lógica mantida... */ };
  const handleDeleteSale = async (saleId: string) => { /* ...lógica mantida... */ };

  // --- CÁLCULOS KPI ---
  const filteredSales = sales.filter(s => 
    s.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.car_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalRevenue = filteredSales.reduce((acc, curr) => acc + (Number(curr.total_price) || 0), 0);
  const totalClients = new Set(filteredSales.map(s => s.client_cpf || s.client_name)).size;
  const averageTicket = sales.length > 0 ? totalRevenue / sales.length : 0;
  
  // Formatadores
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR');


  if (loading) return <div className="p-10 text-center">Carregando modo inseguro...</div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      
      {/* 🚨 BARRA DE DIAGNÓSTICO (Remova depois) */}
      <div className={`px-4 py-2 text-xs font-bold text-center text-white ${envStatus.includes('❌') ? 'bg-red-600' : 'bg-green-600'}`}>
        STATUS DO VERCEL: {envStatus}
      </div>

      {/* NAVBAR */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 text-white p-2 rounded-lg"><LayoutDashboard size={20} /></div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Admin (Modo Inseguro)</h1>
              <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Login Ignorado</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* ... RESTO DO CONTEÚDO (Mantive a estrutura visual para não quebrar) ... */}
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-slate-500 text-xs font-bold uppercase">Faturamento</p>
            <h3 className="text-xl font-bold text-slate-900">{formatCurrency(totalRevenue)}</h3>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
             <p className="text-slate-500 text-xs font-bold uppercase">Vendas</p>
             <h3 className="text-xl font-bold text-slate-900">{filteredSales.length}</h3>
          </div>
           {/* Adicionei placeholders para os outros cards não quebrarem o layout */}
           <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm opacity-50"><p>Ticket Médio</p><h3>---</h3></div>
           <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm opacity-50"><p>Clientes</p><h3>---</h3></div>
        </div>

        {/* TABELA SIMPLIFICADA */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b">
                    <tr><th className="px-4 py-3">Cliente</th><th className="px-4 py-3">Veículo</th><th className="px-4 py-3">Valor</th></tr>
                </thead>
                <tbody>
                    {filteredSales.map(sale => (
                        <tr key={sale.id} className="border-b last:border-0 hover:bg-slate-50">
                            <td className="px-4 py-3">{sale.client_name}</td>
                            <td className="px-4 py-3">{sale.car_name}</td>
                            <td className="px-4 py-3">{formatCurrency(sale.total_price)}</td>
                        </tr>
                    ))}
                    {filteredSales.length === 0 && <tr><td colSpan={3} className="p-4 text-center text-gray-400">Sem dados (Verifique o Status do Vercel no topo)</td></tr>}
                </tbody>
            </table>
        </div>

      </main>
    </div>
  );
}