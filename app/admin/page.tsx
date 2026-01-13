"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { 
  LayoutDashboard, 
  Car, 
  Plus, 
  LogOut, 
  ArrowRight,
  Wallet,
  Users,
  TrendingUp,
  Search,
  FileText,
  ExternalLink,
  Trash2, // <--- 1. NOVO ÍCONE
  AlertCircle
} from "lucide-react";

export default function AdminDashboard() {
  const router = useRouter();
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Estado para loading de exclusão (opcional, para evitar cliques duplos)
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.replace("/login");
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile?.role !== 'admin') {
          if (profile?.role === 'vendedor') {
            router.replace("/vendedor/dashboard");
          } else {
            router.replace("/");
          }
          return;
        }

        setIsAdmin(true);

        const { data: salesData, error: salesError } = await supabase
          .from("sales")
          .select(`
            *,
            profiles:seller_id (email) 
          `) 
          .order("created_at", { ascending: false });

        if (salesError) console.error("Erro ao buscar vendas:", salesError);
        setSales(salesData || []);

      } catch (error) {
        console.error("Erro crítico:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [router]);

  // --- 2. FUNÇÃO DE EXCLUIR ---
  const handleDeleteSale = async (saleId: string) => {
    // Confirmação do navegador
    const confirmDelete = window.confirm("Tem certeza que deseja excluir esta transação? Essa ação não pode ser desfeita.");
    
    if (!confirmDelete) return;

    setIsDeleting(saleId);

    try {
      // Deleta do Supabase
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', saleId);

      if (error) throw error;

      // Atualiza a lista localmente (remove o item da tela sem precisar recarregar tudo)
      setSales((prevSales) => prevSales.filter((sale) => sale.id !== saleId));
      
      alert("Transação removida com sucesso.");

    } catch (error: any) {
      console.error("Erro ao excluir:", error);
      alert("Erro ao excluir: " + error.message);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.replace("/login");
  };

  // --- KPI LOGIC ---
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

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800"></div>
        <p className="text-slate-500 text-sm">Carregando painel...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-blue-100">
      
      {/* NAVBAR */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-black text-white p-2 rounded-lg">
              <LayoutDashboard size={20} />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Admin Dashboard</h1>
              <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Visão Geral</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push("/vendedor/dashboard")}
              className="hidden md:flex text-xs font-medium text-slate-600 hover:text-black items-center gap-2 border border-slate-200 bg-slate-50 hover:bg-white px-3 py-2 rounded-md transition-all"
            >
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
        
        {/* AÇÕES E FILTROS */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Olá, Administrador</h2>
            <p className="text-slate-500 text-sm">Aqui está o desempenho da sua loja hoje.</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <Link 
              href="/admin/cars/new"
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm shadow-blue-200 transition-all w-full md:w-auto justify-center"
            >
              <Plus size={18}/> Novo Veículo
            </Link>
            <button className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm transition-all">
              <FileText size={18}/> Relatórios
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-green-50 rounded-lg text-green-600"><Wallet size={24}/></div>
              <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full"></span>
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase">Faturamento Total</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(totalRevenue)}</h3>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Users size={24}/></div>
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase">Clientes Únicos</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalClients}</h3>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-purple-50 rounded-lg text-purple-600"><TrendingUp size={24}/></div>
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase">Tíquete Médio</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(averageTicket)}</h3>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-orange-50 rounded-lg text-orange-600"><Car size={24}/></div>
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase">Vendas Totais</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{filteredSales.length}</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* TABELA PRINCIPAL */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800">Últimas Transações</h3>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                <input 
                  type="text" 
                  placeholder="Buscar cliente ou carro..." 
                  className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Cliente</th>
                    <th className="px-6 py-4">Veículo</th>
                    <th className="px-6 py-4">Vendedor</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Valor</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900">{sale.client_name}</p>
                        <p className="text-xs text-slate-500">{formatDate(sale.created_at)}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{sale.car_name}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                            {(sale.profiles?.email || 'V')[0].toUpperCase()}
                          </div>
                          <span className="text-xs text-slate-600 truncate max-w-[100px]" title={sale.profiles?.email}>
                            {sale.profiles?.email?.split('@')[0] || 'Vendedor'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          sale.status === 'Aprovado' ? 'bg-green-100 text-green-700' :
                          sale.status === 'Rejeitado' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {sale.status || 'Pendente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-800">
                        {formatCurrency(sale.total_price)}
                      </td>
                      
                      {/* --- COLUNA DE AÇÕES ATUALIZADA --- */}
                      <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                          
                          {/* Botão Ver Carro */}
                          <Link 
                            href={`/monte-o-seu/${sale.car_id || sale.id}`} 
                            target="_blank"
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-bold border border-blue-200 hover:bg-blue-50 px-3 py-1.5 rounded transition-all"
                            title="Ver configuração do veículo"
                          >
                            Ver <ExternalLink size={12}/>
                          </Link>
                          
                          {/* 3. BOTÃO DE EXCLUIR */}
                          <button 
                            onClick={() => handleDeleteSale(sale.id)}
                            disabled={isDeleting === sale.id}
                            className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded transition-all border border-transparent hover:border-red-200"
                            title="Excluir Transação"
                          >
                             {isDeleting === sale.id ? (
                               <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                             ) : (
                               <Trash2 size={16} />
                             )}
                          </button>
                      </td>
                    </tr>
                  ))}
                  {filteredSales.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                        Nenhum registro encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* SIDEBAR VENDEDORES */}
          <div className="flex flex-col gap-6">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <TrendingUp size={18} className="text-blue-600"/> 
                Top Vendedores
              </h3>
              <div className="space-y-4">
                {topSellers.map((seller: any, index) => (
                  <div key={index} className="flex items-center justify-between pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-700' : 
                        index === 1 ? 'bg-gray-100 text-gray-700' : 
                        'bg-slate-50 text-slate-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 truncate w-32">
                          {seller.name.split('@')[0]}
                        </p>
                        <p className="text-xs text-slate-500">{seller.count} vendas</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-slate-900">
                      {formatCurrency(seller.total)}
                    </span>
                  </div>
                ))}
                {topSellers.length === 0 && <p className="text-sm text-slate-400">Sem dados ainda.</p>}
              </div>
            </div>

{/* Card Informativo Rápido */}
            <div className="bg-blue-600 rounded-xl p-6 text-white shadow-lg shadow-blue-200">
              <h3 className="font-bold text-lg mb-2">Precisa de ajuda?</h3>
              <p className="text-blue-100 text-sm mb-4">
                Entre em contato com o suporte técnico para adicionar novos usuários ou configurar metas.
              </p>
              
              {/* Link para o WhatsApp */}
              <a 
                href="https://wa.me/5591999246801?text=Olá,%20preciso%20de%20ajuda%20com%20o%20Painel%20Admin."
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white text-blue-600 px-4 py-3 rounded-lg text-sm font-bold w-full hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
              >
                Contatar Suporte
              </a>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}