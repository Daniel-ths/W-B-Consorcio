"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  LayoutDashboard, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  CarFront, 
  DollarSign, 
  Loader2,
  TrendingUp,
  Users,
  Wallet,
  LogOut,
  ArrowRight,
  Plus,
  FileText,
  Trash2,
  Check,
  Phone,
  Eye,
  X,
  Edit2
} from "lucide-react";
import Link from "next/link";

// --- COMPONENTE MODAL DE DETALHES ---
function ModalDetalhes({ sale, onClose, onUpdateStatus }: { sale: any, onClose: () => void, onUpdateStatus: (id: string, status: string) => void }) {
    if (!sale) return null;

    const [isProcessing, setIsProcessing] = useState(false);

    const handleAction = async (status: string) => {
        setIsProcessing(true);
        await onUpdateStatus(sale.id, status);
        setIsProcessing(false);
        onClose(); // Fecha o modal após a ação
    };

    const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val));
    const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR') + " às " + new Date(date).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 duration-200">
                
                {/* Header Modal */}
                <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex justify-between items-center z-10">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Detalhes do Pedido</h2>
                        <p className="text-xs text-slate-500 font-bold">ID: {sale.id.slice(0, 8)}</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                        <X size={20}/>
                    </button>
                </div>

                {/* Corpo Modal */}
                <div className="p-6 space-y-8">
                    
                    {/* Status Bar */}
                    <div className={`p-4 rounded-xl flex items-center justify-between ${
                        sale.status === 'Aprovado' ? 'bg-green-50 text-green-800' : 
                        sale.status === 'Recusado' ? 'bg-red-50 text-red-800' : 'bg-yellow-50 text-yellow-800'
                    }`}>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">Status Atual</span>
                            <span className="font-black text-sm uppercase flex items-center gap-2 mt-1">
                                {sale.status === 'Aprovado' && <CheckCircle2 size={18}/>}
                                {sale.status === 'Recusado' && <XCircle size={18}/>}
                                {sale.status === 'Aguardando Aprovação' && <Clock size={18}/>}
                                {sale.status}
                            </span>
                        </div>

                        {/* BOTÕES DE AÇÃO DENTRO DO MODAL (NOVO) */}
                        {sale.status === 'Aguardando Aprovação' && (
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => handleAction('Aprovado')} 
                                    disabled={isProcessing}
                                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase hover:bg-green-700 flex items-center gap-2 shadow-sm disabled:opacity-50"
                                >
                                    {isProcessing ? <Loader2 className="animate-spin" size={14}/> : <Check size={14}/>} Aprovar
                                </button>
                                <button 
                                    onClick={() => handleAction('Recusado')} 
                                    disabled={isProcessing}
                                    className="bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase hover:bg-red-700 flex items-center gap-2 shadow-sm disabled:opacity-50"
                                >
                                    {isProcessing ? <Loader2 className="animate-spin" size={14}/> : <X size={14}/>} Recusar
                                </button>
                            </div>
                        )}
                        
                        {/* Botão de Forçar Alteração (Caso precise corrigir) */}
                        {sale.status !== 'Aguardando Aprovação' && (
                             <button 
                                onClick={() => {
                                    if(confirm("Deseja reabrir este pedido para análise?")) handleAction('Aguardando Aprovação');
                                }}
                                className="text-xs font-bold text-slate-500 hover:text-black underline decoration-dotted underline-offset-4"
                             >
                                 Alterar Status
                             </button>
                        )}
                    </div>

                    {/* Bloco 1: Cliente */}
                    <div>
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 border-b border-gray-100 pb-2 flex items-center gap-2">
                            <Users size={14}/> Dados do Cliente
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Nome Completo</p>
                                <p className="text-sm font-bold text-slate-900">{sale.client_name}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">CPF</p>
                                <p className="text-sm font-mono text-slate-700">{sale.client_cpf}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Telefone</p>
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-mono text-slate-700">{sale.client_phone || "--"}</p>
                                    {sale.client_phone && (
                                        <a href={`https://wa.me/55${sale.client_phone.replace(/\D/g, '')}`} target="_blank" className="text-green-600 hover:text-green-800 bg-green-50 px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1">
                                            <Phone size={10}/> WhatsApp
                                        </a>
                                    )}
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Data do Pedido</p>
                                <p className="text-sm font-medium text-slate-700">{formatDate(sale.created_at)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Bloco 2: Veículo e Valores */}
                    <div>
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 border-b border-gray-100 pb-2 flex items-center gap-2">
                            <CarFront size={14}/> Detalhes da Venda
                        </h3>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Veículo / Modelo</p>
                                    <p className="text-lg font-black text-slate-900">{sale.car_name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Tipo</p>
                                    <span className="bg-black text-white text-[10px] font-bold px-2 py-1 rounded uppercase">{sale.interest_type}</span>
                                </div>
                            </div>
                            
                            <div className="space-y-2 border-t border-slate-200 pt-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500 font-medium">Valor Total</span>
                                    <span className="font-bold text-slate-900">{formatMoney(sale.total_price)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bloco 3: Vendedor */}
                    <div>
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 border-b border-gray-100 pb-2 flex items-center gap-2">
                            <CheckCircle2 size={14}/> Responsável
                        </h3>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                {sale.seller_name ? sale.seller_name.substring(0,2).toUpperCase() : "AD"}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-900">{sale.seller_name || "Sistema"}</p>
                                <p className="text-[10px] text-slate-500 font-mono">{sale.profiles?.email}</p>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer Modal */}
                <div className="bg-gray-50 p-6 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 rounded-b-2xl">
                    <button onClick={onClose} className="px-6 py-2.5 bg-white border border-gray-200 text-slate-700 font-bold text-xs uppercase rounded-lg hover:bg-gray-100 transition-colors">
                        Fechar
                    </button>
                    <button onClick={() => window.print()} className="px-6 py-2.5 bg-black text-white font-bold text-xs uppercase rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2">
                        <FileText size={14}/> Imprimir Ficha
                    </button>
                </div>
            </div>
        </div>
    );
}

// --- PÁGINA PRINCIPAL ADMIN ---
export default function AdminDashboard() {
  const router = useRouter();
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("TODOS");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal State
  const [selectedSale, setSelectedSale] = useState<any>(null);

  // Stats
  const [stats, setStats] = useState({ total: 0, pending: 0, value: 0 });

  // Estados de Ação
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // Buscar Dados
  const fetchSales = async () => {
    setLoading(true);
    try {
        const { data, error } = await supabase
            .from('sales')
            .select(`*, profiles:seller_id (email)`)
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (data) {
            setSales(data);
            
            // Calcular Stats
            const total = data.length;
            const pending = data.filter((s: any) => s.status === 'Aguardando Aprovação').length;
            const value = data.reduce((acc: number, curr: any) => acc + (Number(curr.total_price) || 0), 0);
            
            setStats({ total, pending, value });
        }
    } catch (error) {
        console.error("Erro ao buscar vendas:", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  // --- AÇÕES GERAIS ---
  const updateStatus = async (saleId: string, newStatus: string) => {
      try {
        const { error } = await supabase.from('sales').update({ status: newStatus }).eq('id', saleId);
        if (error) throw error;
        
        // Atualiza estado local
        setSales((prev) => prev.map((s) => s.id === saleId ? { ...s, status: newStatus } : s));
        
        // Atualiza o modal se estiver aberto
        if (selectedSale && selectedSale.id === saleId) {
            setSelectedSale((prev: any) => ({ ...prev, status: newStatus }));
        }

        alert(`Status atualizado para: ${newStatus}`);
      } catch (error: any) {
        alert("Erro: " + error.message);
      }
  };

  const handleApproveSale = async (e: any, saleId: string) => {
    if(e) e.stopPropagation();
    if (!confirm("Aprovar este crédito manualmente?")) return;
    setIsUpdating(saleId);
    await updateStatus(saleId, 'Aprovado');
    setIsUpdating(null);
  };

  const handleRejectSale = async (e: any, saleId: string) => {
      if(e) e.stopPropagation();
      if (!confirm("Recusar esta proposta?")) return;
      setIsUpdating(saleId);
      await updateStatus(saleId, 'Recusado');
      setIsUpdating(null);
  };

  const handleDeleteSale = async (e: any, saleId: string) => {
    e.stopPropagation();
    if (!confirm("Excluir esta transação permanentemente?")) return;
    
    setIsDeleting(saleId);
    try {
      const { error } = await supabase.from('sales').delete().eq('id', saleId);
      if (error) throw error;
      setSales((prev) => prev.filter((s) => s.id !== saleId));
      if (selectedSale?.id === saleId) setSelectedSale(null);
      alert("Removido.");
    } catch (error: any) {
      alert("Erro: " + error.message);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.replace("/login");
  };

  // Filtragem
  const filteredSales = sales.filter(sale => {
      const matchesStatus = filterStatus === "TODOS" || sale.status === filterStatus;
      const matchesSearch = 
        sale.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        sale.car_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.seller_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesStatus && matchesSearch;
  });

  const salesBySeller = sales.reduce((acc: any, curr) => {
    const sellerName = curr.seller_name || curr.profiles?.email || 'Desconhecido';
    if (!acc[sellerName]) acc[sellerName] = { count: 0, total: 0, name: sellerName };
    acc[sellerName].count += 1;
    acc[sellerName].total += Number(curr.total_price) || 0;
    return acc;
  }, {});
  const topSellers = Object.values(salesBySeller).sort((a: any, b: any) => b.total - a.total).slice(0, 5);

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // Badge de Status
  const StatusBadge = ({ status }: { status: string }) => {
      let styles = "bg-gray-100 text-gray-600";
      let icon = <Clock size={12}/>;

      if (status === 'Aprovado') {
          styles = "bg-green-100 text-green-700 border-green-200";
          icon = <CheckCircle2 size={12}/>;
      } else if (status === 'Recusado') {
          styles = "bg-red-100 text-red-700 border-red-200";
          icon = <XCircle size={12}/>;
      } else if (status === 'Aguardando Aprovação') {
          styles = "bg-yellow-100 text-yellow-800 border-yellow-200";
          icon = <Clock size={12}/>;
      }

      return (
          <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border ${styles}`}>
              {icon} {status}
          </span>
      )
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
        
        {/* MODAL DETALHES (Passamos a função genérica de update) */}
        {selectedSale && (
            <ModalDetalhes 
                sale={selectedSale} 
                onClose={() => setSelectedSale(null)} 
                onUpdateStatus={updateStatus}
            />
        )}

        {/* HEADER */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-30">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-black p-2 rounded-lg text-[#f2e14c]">
                        <LayoutDashboard size={20}/>
                    </div>
                    <div>
                        <h1 className="text-lg font-black uppercase tracking-tight">Admin Dashboard</h1>
                        <p className="text-xs text-gray-400 font-bold">WBCNAC Consórcios</p>
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
            
            {/* STATS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-green-50 rounded-lg text-green-600"><Wallet size={20}/></div>
                    </div>
                    <p className="text-slate-500 text-xs font-bold uppercase">Faturamento</p>
                    <h3 className="text-xl font-bold text-slate-900">{new Intl.NumberFormat('pt-BR', { notation: "compact", style: 'currency', currency: 'BRL' }).format(stats.value)}</h3>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Users size={20}/></div>
                    </div>
                    <p className="text-slate-500 text-xs font-bold uppercase">Clientes</p>
                    <h3 className="text-xl font-bold text-slate-900">{stats.total}</h3>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-purple-50 rounded-lg text-purple-600"><TrendingUp size={20}/></div>
                    </div>
                    <p className="text-slate-500 text-xs font-bold uppercase">Ticket Médio</p>
                    <h3 className="text-xl font-bold text-slate-900">{stats.total > 0 ? new Intl.NumberFormat('pt-BR', { notation: "compact", style: 'currency', currency: 'BRL' }).format(stats.value / stats.total) : "R$ 0"}</h3>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-yellow-50 rounded-lg text-yellow-600"><Clock size={20}/></div>
                    </div>
                    <p className="text-slate-500 text-xs font-bold uppercase">Pendentes</p>
                    <h3 className="text-xl font-bold text-slate-900">{stats.pending}</h3>
                </div>
            </div>

            {/* FILTROS E BUSCA */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                    <input 
                        type="text" 
                        placeholder="Buscar por cliente, carro ou vendedor..." 
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:border-black transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
                    {["TODOS", "Aguardando Aprovação", "Aprovado", "Recusado"].map((status) => (
                        <button 
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase whitespace-nowrap transition-all ${filterStatus === status ? 'bg-black text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                        >
                            {status === "Aguardando Aprovação" ? "Pendentes" : status}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* TABELA DE VENDAS */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800">Últimas Transações</h3>
                        <div className="flex gap-2">
                            <Link href="/admin/cars/new" className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-100 flex items-center gap-1">
                                <Plus size={14}/> Add Veículo
                            </Link>
                            <Link href="/admin/reports" className="text-xs bg-slate-50 text-slate-600 px-3 py-1.5 rounded-lg font-bold hover:bg-slate-100 flex items-center gap-1">
                                <FileText size={14}/> Relatórios
                            </Link>
                        </div>
                    </div>

                    {loading ? (
                        <div className="p-12 flex flex-col items-center justify-center text-slate-400">
                            <Loader2 className="animate-spin mb-2" size={32}/>
                            <p className="text-xs font-bold uppercase">Carregando...</p>
                        </div>
                    ) : filteredSales.length === 0 ? (
                        <div className="p-12 text-center text-slate-400">
                            <p className="text-sm font-medium">Nenhuma proposta encontrada.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4 min-w-[140px]">Cliente</th>
                                        <th className="px-6 py-4">Veículo</th>
                                        <th className="px-6 py-4 text-center">Status</th>
                                        <th className="px-6 py-4 text-right">Valor</th>
                                        <th className="px-6 py-4 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredSales.map((sale) => (
                                        <tr 
                                            key={sale.id} 
                                            onClick={() => setSelectedSale(sale)} // Abre o modal ao clicar na linha
                                            className="hover:bg-slate-50 transition-colors group cursor-pointer"
                                        >
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-bold text-slate-900 uppercase">{sale.client_name}</p>
                                                <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                                                    <span className="font-mono">{sale.client_cpf}</span>
                                                    {sale.client_phone && (
                                                        <a 
                                                            href={`https://wa.me/55${sale.client_phone.replace(/\D/g, '')}`} 
                                                            target="_blank" 
                                                            onClick={(e) => e.stopPropagation()} 
                                                            className="text-green-600 hover:text-green-800 ml-2"
                                                        >
                                                            <Phone size={12}/>
                                                        </a>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 text-xs font-medium">
                                                <div className="flex flex-col">
                                                    <span>{sale.car_name}</span>
                                                    <span className="text-[9px] text-slate-400">Vendedor: {sale.seller_name || "---"}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <StatusBadge status={sale.status} />
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-slate-800 text-sm">
                                                {formatCurrency(sale.total_price)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                    
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); setSelectedSale(sale); }}
                                                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all border border-blue-100"
                                                        title="Ver Detalhes"
                                                    >
                                                        <Eye size={14}/>
                                                    </button>

                                                    {sale.status === 'Aguardando Aprovação' && (
                                                        <>
                                                            <button onClick={(e) => handleApproveSale(e, sale.id)} disabled={isUpdating === sale.id} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 hover:scale-110 transition-all border border-green-100">
                                                                {isUpdating === sale.id ? <Loader2 size={14} className="animate-spin"/> : <Check size={14}/>}
                                                            </button>
                                                            <button onClick={(e) => handleRejectSale(e, sale.id)} disabled={isUpdating === sale.id} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 hover:scale-110 transition-all border border-red-100">
                                                                <XCircle size={14}/>
                                                            </button>
                                                        </>
                                                    )}
                                                    <button onClick={(e) => handleDeleteSale(e, sale.id)} disabled={isDeleting === sale.id} className="p-2 bg-slate-100 text-slate-400 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors">
                                                        {isDeleting === sale.id ? <Loader2 size={14} className="animate-spin"/> : <Trash2 size={14}/>}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* SIDEBAR DE SUPORTE */}
                <div className="flex flex-col gap-6">
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">Top Vendedores</h3>
                        <div className="space-y-3">
                            {topSellers.map((seller: any, index) => (
                                <div key={index} className="flex items-center justify-between text-sm border-b border-slate-50 last:border-0 pb-2 last:pb-0">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-600'}`}>
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 truncate w-24 capitalize">{seller.name.split('@')[0]}</p>
                                            <p className="text-[10px] text-slate-500">{seller.count} vendas</p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-slate-700 text-xs">{formatCurrency(seller.total)}</span>
                                </div>
                            ))}
                            {topSellers.length === 0 && <p className="text-xs text-slate-400 text-center py-4">Sem dados ainda.</p>}
                        </div>
                    </div>

                    <div className="bg-blue-600 rounded-xl p-5 text-white shadow-lg">
                        <h3 className="font-bold mb-2">Suporte</h3>
                        <p className="text-blue-100 text-xs mb-4 leading-relaxed">Dúvidas ou problemas técnicos? Fale conosco.</p>
                        <a href="https://wa.me/5591999246801?text=Olá,%20preciso%20de%20ajuda%20com%20o%20Painel%20Admin." target="_blank" rel="noopener noreferrer" className="bg-white text-blue-600 px-4 py-2.5 rounded-lg text-xs font-bold w-full hover:bg-blue-50 transition-colors flex items-center justify-center gap-2">
                            Contatar via WhatsApp
                        </a>
                    </div>
                </div>

            </div>
        </main>
    </div>
  );
}