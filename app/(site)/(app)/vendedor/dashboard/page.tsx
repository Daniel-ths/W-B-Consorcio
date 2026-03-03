"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  LogOut, 
  User, 
  FileText, 
  CheckCircle, 
  TrendingUp, 
  Plus, 
  ShieldCheck, 
  Clock,
  BadgeCheck,
  Wallet,
  Banknote,
  MapPin,
  Calendar
} from "lucide-react";

export default function SellerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  
  // Novos estados para o perfil
  const [profile, setProfile] = useState({ fullName: "", avatarUrl: "" });
  
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Saudação baseada no horário
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  useEffect(() => {
    const init = async () => {
      // 1. Tenta pegar o usuário da sessão atual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
         router.push("/login");
         return;
      }
      
      setUser(user);

      // 2. Busca dados do perfil (Nome e Foto)
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single();
      
      if (profileData) {
        setProfile({
            fullName: profileData.full_name || "",
            avatarUrl: profileData.avatar_url || ""
        });
      }
      
      // 3. Busca as vendas
      const { data: salesData } = await supabase
        .from("sales")
        .select("*")
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });
        
      setSales(salesData || []);
      setLoading(false);
    };
    init();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh(); 
    router.push("/login");
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR');

  const userEmail = user?.email || "";
  const isAdmin = userEmail.toLowerCase().includes("admin");
  
  // Nome de exibição inteligente
  const displayName = profile.fullName || userEmail.split('@')[0];

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-10">
      
      {/* HEADER DECORATIVO (FUNDO) */}
      <div className="h-48 bg-gradient-to-r from-blue-900 to-blue-700 relative">
         <div className="absolute inset-0 bg-black/10"></div>
      </div>

      <main className="max-w-7xl mx-auto px-4 -mt-24 relative z-10">
        
        {/* CARTÃO DE PERFIL FLUTUANTE */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-8 flex flex-col md:flex-row justify-between items-center md:items-end gap-6">
            
            <div className="flex flex-col md:flex-row items-center md:items-end gap-6 w-full">
                {/* Foto do Perfil com Borda */}
                <div className="relative">
                    <div className="w-32 h-32 rounded-full border-4 border-white shadow-md bg-white flex items-center justify-center overflow-hidden">
                        {profile.avatarUrl ? (
                            <img src={profile.avatarUrl} alt="Perfil" className="w-full h-full object-cover" />
                        ) : (
                            <User size={48} className="text-gray-300" />
                        )}
                    </div>
                    {/* Badge de Cargo */}
                    <div className={`absolute bottom-2 right-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border-2 border-white shadow-sm
                        ${isAdmin ? 'bg-black text-yellow-400' : 'bg-green-500 text-white'}`}>
                        {isAdmin ? 'Admin' : 'Vendedor'}
                    </div>
                </div>

                {/* Textos */}
                <div className="text-center md:text-left mb-2">
                    <p className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-1">{getGreeting()},</p>
                    <h1 className="text-3xl font-black text-gray-900 leading-none mb-2">{displayName}</h1>
                    <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1"><MapPin size={14}/> {userEmail}</span>
                        <span className="flex items-center gap-1"><Calendar size={14}/> {new Date().toLocaleDateString('pt-BR')}</span>
                    </div>
                </div>
            </div>

            {/* Ações Rápidas */}
            <div className="flex flex-wrap gap-3 justify-center w-full md:w-auto">
                {isAdmin && (
                    <button
                        onClick={() => router.push('/admin')}
                        className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
                    >
                        <ShieldCheck size={18} />
                        Admin
                    </button>
                )}
                
                <button 
                    onClick={() => router.push("/")} 
                    className="bg-blue-600 text-white hover:bg-blue-700 px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-md shadow-blue-200 transition-all hover:-translate-y-0.5"
                >
                    <Plus size={18} />
                    Nova Venda
                </button>

                <button 
                    onClick={handleLogout} 
                    className="text-red-500 hover:bg-red-50 px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors border border-transparent hover:border-red-100"
                >
                    <LogOut size={18} />
                    Sair
                </button>
            </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
             <div className="flex justify-between items-center mb-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Simulações</p>
                <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                    <FileText size={20} />
                </div>
             </div>
             <p className="text-3xl font-black text-gray-900">{sales.length}</p>
             <p className="text-xs text-gray-400 mt-2">Total de propostas enviadas</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
             <div className="flex justify-between items-center mb-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Aprovados</p>
                <div className="p-2 bg-green-100 rounded-lg text-green-600">
                    <CheckCircle size={20} />
                </div>
             </div>
             <p className="text-3xl font-black text-green-600">{sales.filter(s => s.status === 'Aprovado').length}</p>
             <p className="text-xs text-gray-400 mt-2">Clientes com crédito aprovado</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
             <div className="flex justify-between items-center mb-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Volume Vendido</p>
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    <TrendingUp size={20} />
                </div>
             </div>
             <p className="text-3xl font-black text-blue-900">
               {formatCurrency(sales.reduce((acc, curr) => acc + (Number(curr.total_price) || 0), 0))}
             </p>
             <p className="text-xs text-gray-400 mt-2">Valor total em veículos</p>
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                  <Clock size={18} className="text-gray-400"/> Histórico Pessoal
                </h2>
                <span className="text-xs font-bold text-gray-500 bg-white border border-gray-200 px-3 py-1 rounded-full">
                    Últimos registros
                </span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-xs">
                        <tr>
                            <th className="px-6 py-4">Data</th>
                            <th className="px-6 py-4">Cliente</th>
                            <th className="px-6 py-4">Contato</th>
                            <th className="px-6 py-4">Veículo</th>
                            <th className="px-6 py-4">Pagamento</th>
                            <th className="px-6 py-4 text-center">Score</th>
                            <th className="px-6 py-4 text-center">Status</th>
                            <th className="px-6 py-4 text-right">Valor</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {sales.map(sale => {
                            const interestType = sale.interest_type || sale.payment_method || ""; 
                            const isConsorcio = interestType.toLowerCase().includes('consorcio');
                            const score = sale.score_result || 0;
                            const isGoodScore = score > 600;

                            return (
                              <tr key={sale.id} className="hover:bg-blue-50/20 transition-colors">
                                  <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{formatDate(sale.created_at)}</td>
                                  
                                  <td className="px-6 py-4">
                                      <p className="font-bold text-gray-900">{sale.client_name}</p>
                                      <p className="text-xs text-gray-400 font-mono">{sale.client_cpf}</p>
                                  </td>

                                  <td className="px-6 py-4">
                                      {sale.client_phone ? (
                                          <a href={`https://wa.me/55${sale.client_phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline font-medium">
                                              📱 {sale.client_phone}
                                          </a>
                                      ) : <span className="text-gray-400 text-xs italic">Não informado</span>}
                                  </td>

                                  <td className="px-6 py-4 text-gray-700 font-medium">
                                      {sale.car_name || sale.veiculo_interesse}
                                  </td>

                                  <td className="px-6 py-4">
                                      {interestType ? (
                                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${isConsorcio ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                                              {isConsorcio ? <Wallet size={12}/> : <Banknote size={12}/>}
                                              {isConsorcio ? "Consórcio" : "Financiamento"}
                                          </span>
                                      ) : <span className="px-2 py-1 rounded-md text-xs font-bold bg-gray-100 text-gray-500 border border-gray-200">Não salvo</span>}
                                  </td>

                                  <td className="px-6 py-4 text-center">
                                    <div className={`inline-flex items-center justify-center w-12 py-1 rounded font-bold text-xs ${score > 0 ? (isGoodScore ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800') : 'bg-gray-100 text-gray-400'}`}>
                                      {score > 0 ? score : "-"}
                                    </div>
                                  </td>

                                  <td className="px-6 py-4 text-center">
                                      {sale.status === 'Aprovado' 
                                          ? <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold border border-green-200"><CheckCircle size={10}/> Aprovado</span> 
                                          : <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold border border-yellow-200"><Clock size={10}/> Análise</span>}
                                  </td>

                                  <td className="px-6 py-4 text-right font-medium">{formatCurrency(sale.total_price)}</td>
                              </tr>
                            );
                        })}
                    </tbody>
                </table>
                {sales.length === 0 && <div className="p-12 text-center text-gray-400">Nenhuma venda encontrada.</div>}
            </div>
        </div>
      </main>
    </div>
  );
}