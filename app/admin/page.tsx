"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { 
  LayoutDashboard, Car, Plus, LogOut, ArrowRight, Wallet, Users, TrendingUp, Search, FileText, ExternalLink, Trash2, Check, Phone, Loader2, ShieldAlert
} from "lucide-react";

export default function AdminDashboard() {
  const router = useRouter();
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false); // Novo estado para erro sem loop
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const initPage = async () => {
      try {
        // 1. Verifica Usuário
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          if (mounted) {
            setLoading(false);
            setAccessDenied(true); // NÃO REDIRECIONA, SÓ MOSTRA ERRO
          }
          return;
        }

        // 2. Verifica Cargo
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile?.role !== 'admin') {
           if (mounted) {
             setLoading(false);
             setAccessDenied(true); // NÃO REDIRECIONA, SÓ MOSTRA ERRO
           }
           return;
        }

        // 3. Se passou, busca dados
        const { data: salesData, error } = await supabase
          .from("sales")
          .select(`*, profiles:seller_id (email)`) 
          .order("created_at", { ascending: false });

        if (mounted) {
          setSales(salesData || []);
          setLoading(false);
        }

      } catch (error) {
        console.error("Erro:", error);
        if (mounted) setLoading(false);
      }
    };

    initPage();

    return () => { mounted = false; };
  }, []);

  // --- TELA DE "ACESSO NEGADO" (O QUEBRA-LOOP) ---
  if (accessDenied) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-100 p-4 text-center">
        <ShieldAlert size={64} className="text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Acesso Restrito</h1>
        <p className="text-gray-600 mb-6">Você precisa estar logado como Administrador para ver esta página.</p>
        
        <div className="flex gap-4">
            <button 
              onClick={() => window.location.href = "/login"} 
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors"
            >
              Ir para Login
            </button>
            <button 
              onClick={() => window.location.href = "/"} 
              className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-bold hover:bg-gray-50 transition-colors"
            >
              Voltar ao Início
            </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="animate-spin text-blue-600 w-10 h-10" />
        <p className="text-slate-500 font-medium text-sm animate-pulse">Carregando painel...</p>
      </div>
    );
  }

  // --- CÁLCULOS KPI ---
  const filteredSales = sales.filter(s => 
    s.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.car_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalRevenue = filteredSales.reduce((acc, curr) => acc + (Number(curr.total_price) || 0), 0);
  const totalClients = new Set(filteredSales.map(s => s.client_cpf || s.client_name)).size;
  const averageTicket = sales.length > 0 ? totalRevenue / sales.length : 0;
  
  const salesBySeller = sales.reduce((acc: any, curr) => {
    const sellerEmail = curr.profiles?.email || 'Desconhecido';
    if (!acc[sellerEmail]) acc[sellerEmail] = { count: 0, total: 0, name: sellerEmail };
    acc[sellerEmail].count += 1;
    acc[sellerEmail].total += Number(curr.total_price) || 0;
    return acc;
  }, {});
  const topSellers = Object.values(salesBySeller).sort((a: any, b: any) => b.total - a.total).slice(0, 3);
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR');

  // --- FUNÇÕES DE AÇÃO ---
  const handleApproveSale = async (saleId: string) => {
    if(!confirm("Aprovar?")) return;
    setIsUpdating(saleId);
    await supabase.from('sales').update({ status: 'Aprovado' }).eq('id', saleId);
    setSales(prev => prev.map(s => s.id === saleId ? { ...s, status: 'Aprovado' } : s));
    setIsUpdating(null);
  };

  const handleDeleteSale = async (saleId: string) => {
    if(!confirm("Excluir?")) return;
    setIsDeleting(saleId);
    await supabase.from('sales').delete().eq('id', saleId);
    setSales(prev => prev.filter(s => s.id !== saleId));
    setIsDeleting(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  // --- RENDERIZAÇÃO PRINCIPAL ---
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-blue-100">
      
      {/* NAVBAR */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-black text-white p-2 rounded-lg"><LayoutDashboard size={20} /></div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Admin Dashboard</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/vendedor/dashboard")} className="hidden md:flex text-xs font-medium text-slate-600 hover:text-black items-center gap-2 border border-slate-200 bg-slate-50 hover:bg-white px-3 py-2 rounded-md transition-all">
              <ArrowRight size={14}/> Visão Vendedor
            </button>
            <div className="h-6 w-px bg-slate-200 mx-1"></div>
            <button onClick={handleLogout} className="text-red-600 hover:text-red-700 text-xs font-bold flex items-center gap-2 px-2">
              <LogOut size={16} /> Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {/* HEADER AÇÕES */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Olá, Administrador</h2>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <Link href="/admin/cars/new" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm transition-all w-full md:w-auto justify-center">
              <Plus size={18}/> Novo Veículo
            </Link>
            <Link href="/admin/reports" className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm transition-all">
              <FileText size={18}/> Relatórios
            </Link>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-slate-500 text-xs font-bold uppercase">Faturamento</p>
            <h3 className="text-xl font-bold text-slate-900">{formatCurrency(totalRevenue)}</h3>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-slate-500 text-xs font-bold uppercase">Clientes</p>
            <h3 className="text-xl font-bold text-slate-900">{totalClients}</h3>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-slate-500 text-xs font-bold uppercase">Ticket Médio</p>
            <h3 className="text-xl font-bold text-slate-900">{formatCurrency(averageTicket)}</h3>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-slate-500 text-xs font-bold uppercase">Vendas</p>
            <h3 className="text-xl font-bold text-slate-900">{filteredSales.length}</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* TABELA */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800">Últimas Transações</h3>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                <input type="text" placeholder="Buscar..." className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-48" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 min-w-[140px]">Cliente</th>
                    <th className="px-4 py-3 min-w-[120px]">Veículo</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Valor</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900 text-sm leading-tight">{sale.client_name}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 whitespace-nowrap">{formatDate(sale.created_at)}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs font-medium">{sale.car_name}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide whitespace-nowrap ${
                          sale.status === 'Aprovado' ? 'bg-green-100 text-green-700' :
                          sale.status === 'Rejeitado' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {sale.status || 'Pendente'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-800 whitespace-nowrap text-sm">
                        {formatCurrency(sale.total_price)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/monte-o-seu/${sale.car_id || sale.id}`} target="_blank" className="text-blue-600 p-1.5 hover:bg-blue-50 rounded border border-blue-100"><ExternalLink size={14}/></Link>
                          {sale.status !== 'Aprovado' && (
                            <button onClick={() => handleApproveSale(sale.id)} disabled={isUpdating === sale.id} className="text-green-600 p-1.5 hover:bg-green-50 rounded border border-green-100"><Check size={14}/></button>
                          )}
                          <button onClick={() => handleDeleteSale(sale.id)} disabled={isDeleting === sale.id} className="text-red-400 p-1.5 hover:bg-red-50 rounded border border-red-100"><Trash2 size={14}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="flex flex-col gap-6">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">Top Vendedores</h3>
              <div className="space-y-3">
                {topSellers.map((seller: any, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <p className="font-bold text-slate-800 truncate w-24">{seller.name.split('@')[0]}</p>
                    <span className="font-bold text-slate-700 text-xs">{formatCurrency(seller.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}