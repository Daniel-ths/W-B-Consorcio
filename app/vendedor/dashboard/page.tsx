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
  Wallet,      // Ícone para Consórcio
  Banknote,    // Ícone para Financiamento
  AlertCircle  // Ícone para Score baixo
} from "lucide-react";

export default function SellerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      // 1. Tenta pegar o usuário da sessão atual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
         router.push("/login");
         return;
      }
      
      setUser(user);
      
      // 2. Busca as vendas
      const { data } = await supabase
        .from("sales")
        .select("*")
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });
        
      setSales(data || []);
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

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-10">
      
      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* LADO ESQUERDO: PERFIL */}
          <div className="flex items-center gap-3 w-full md:w-auto">
             <div className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 border ${isAdmin ? 'bg-gray-900 text-yellow-400 border-gray-800' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                <User size={24} />
             </div>
             <div>
                <div className="flex items-center gap-2">
                    <h1 className="font-bold text-gray-900 text-lg leading-none">
                      {isAdmin ? "Administrador" : "Vendedor"}
                    </h1>
                    {isAdmin && <BadgeCheck size={18} className="text-blue-600 fill-blue-50" />}
                </div>
                <p className="text-xs text-gray-500 font-mono mt-1">{userEmail}</p>
             </div>
          </div>
          
          {/* LADO DIREITO: BOTÕES DE AÇÃO */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-center md:justify-end">
            
            {isAdmin && (
              <button
                onClick={() => router.push('/admin')}
                className="bg-gray-900 text-yellow-400 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-black transition-all shadow-md transform hover:scale-105 border border-yellow-500/50"
              >
                <ShieldCheck size={18} />
                Painel Gerencial
              </button>
            )}

            <button 
              onClick={() => router.push("/")} 
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Nova Venda</span>
            </button>

            <div className="h-6 w-px bg-gray-300 hidden md:block mx-1"></div>

            <button 
              onClick={handleLogout} 
              className="text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors border border-transparent hover:border-red-100"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Sair</span>
            </button>

          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
             <div className="flex justify-between items-center mb-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Simulações</p>
                <FileText size={20} className="text-gray-400" />
             </div>
             <p className="text-3xl font-black text-gray-900">{sales.length}</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
             <div className="flex justify-between items-center mb-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Aprovados</p>
                <CheckCircle size={20} className="text-green-500" />
             </div>
             <p className="text-3xl font-black text-green-600">{sales.filter(s => s.status === 'Aprovado').length}</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
             <div className="flex justify-between items-center mb-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Volume Vendido</p>
                <TrendingUp size={20} className="text-blue-500" />
             </div>
             <p className="text-3xl font-black text-blue-900">
               {formatCurrency(sales.reduce((acc, curr) => acc + (Number(curr.total_price) || 0), 0))}
             </p>
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                  <Clock size={18} className="text-gray-400"/> Histórico Pessoal
                </h2>
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
                            <th className="px-6 py-4 text-center">Score</th> {/* Coluna nova */}
                            <th className="px-6 py-4 text-center">Status</th>
                            <th className="px-6 py-4 text-right">Valor</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {sales.map(sale => {
                            // Correção da lógica de exibição
                            const interestType = sale.interest_type || sale.payment_method || ""; 
                            const isConsorcio = interestType.toLowerCase().includes('consorcio');
                            const isFinanciamento = interestType.toLowerCase().includes('financiamento');
                            
                            // Lógica do Score
                            const score = sale.score_result || 0;
                            const isGoodScore = score > 600;

                            return (
                              <tr key={sale.id} className="hover:bg-blue-50/20 transition-colors">
                                  <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{formatDate(sale.created_at)}</td>
                                  
                                  {/* Coluna Nome */}
                                  <td className="px-6 py-4">
                                      <p className="font-bold text-gray-900">{sale.client_name}</p>
                                      <p className="text-xs text-gray-400 font-mono">{sale.client_cpf}</p>
                                  </td>

                                  {/* Contato */}
                                  <td className="px-6 py-4">
                                      {sale.client_phone ? (
                                          <a 
                                            href={`https://wa.me/55${sale.client_phone.replace(/\D/g, '')}`} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline font-medium"
                                          >
                                              📱 {sale.client_phone}
                                          </a>
                                      ) : (
                                          <span className="text-gray-400 text-xs italic">Não informado</span>
                                      )}
                                  </td>

                                  {/* Veículo */}
                                  <td className="px-6 py-4 text-gray-700 font-medium">
                                      {sale.car_name || sale.veiculo_interesse}
                                  </td>

                                  {/* Pagamento (CORRIGIDO) */}
                                  <td className="px-6 py-4">
                                      {interestType ? (
                                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${
                                              isConsorcio 
                                              ? 'bg-purple-50 text-purple-700 border-purple-200' 
                                              : 'bg-blue-50 text-blue-700 border-blue-200'
                                          }`}>
                                              {isConsorcio ? <Wallet size={12}/> : <Banknote size={12}/>}
                                              {isConsorcio ? "Consórcio" : "Financiamento"}
                                          </span>
                                      ) : (
                                          <span className="px-2 py-1 rounded-md text-xs font-bold bg-gray-100 text-gray-500 border border-gray-200">
                                              Não salvo
                                          </span>
                                      )}
                                  </td>

                                  {/* Score (NOVO) */}
                                  <td className="px-6 py-4 text-center">
                                    <div className={`inline-flex items-center justify-center w-12 py-1 rounded font-bold text-xs ${
                                      score > 0 
                                        ? (isGoodScore ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800')
                                        : 'bg-gray-100 text-gray-400'
                                    }`}>
                                      {score > 0 ? score : "-"}
                                    </div>
                                  </td>

                                  {/* Status */}
                                  <td className="px-6 py-4 text-center">
                                      {sale.status === 'Aprovado' 
                                          ? <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold border border-green-200"><CheckCircle size={10}/> Aprovado</span> 
                                          : <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold border border-yellow-200"><Clock size={10}/> Análise</span>}
                                  </td>

                                  {/* Valor */}
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