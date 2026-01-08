"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase"; 
import { 
  FileText, 
  Car, 
  Users, 
  SearchCheck, 
  UserCheck, 
  Loader2 
} from 'lucide-react';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // --- LÓGICA DE PROTEÇÃO (Mantida para segurança) ---
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Opcional: Verificar se é admin no banco
      // Por enquanto, apenas garante que está logado
      setLoading(false);
    };

    checkUser();
  }, [router]);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  // --- SEU LAYOUT VISUAL (EXATO) ---
  return (
    // Adicionei pt-24 e px-8 para dar espaço da Navbar fixa e margens laterais
    <div className="min-h-screen bg-gray-50 pt-24 px-8 pb-8">
      <div className="space-y-8 max-w-7xl mx-auto">
      
        {/* Cabeçalho */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Painel de Controle</h1>
            <p className="text-gray-500 mt-1">Resumo das atividades, simulações e clientes.</p>
          </div>
        </div>

        {/* Grid de KPIs - Focado no Contrato (Cláusula 1.1.d) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard 
            title="Simulações Hoje" 
            value="12" 
            sub="3 aguardando contato"
            icon={<FileText size={24} className="text-blue-600" />}
            color="blue"
          />
          <KpiCard 
            title="Financiamentos Fechados" 
            value="4" 
            sub="Este mês"
            icon={<UserCheck size={24} className="text-emerald-600" />}
            color="emerald"
          />
          <KpiCard 
            title="Total Clientes Cadastrados" 
            value="156" 
            sub="+12 novos essa semana"
            icon={<Users size={24} className="text-gray-600" />}
            color="gray"
          />
          <KpiCard 
            title="Consultas de Score" 
            value="8" 
            sub="Realizadas hoje"
            icon={<SearchCheck size={24} className="text-purple-600" />}
            color="purple"
          />
        </div>

        {/* Tabelas de Dados Relevantes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Tabela 1: Últimas Simulações (Item 1.1.b e 1.1.d) */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">Últimas Simulações</h3>
              <button className="text-sm text-emerald-600 font-medium hover:underline">Ver todas</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-medium">
                  <tr>
                    <th className="px-6 py-4">Cliente</th>
                    <th className="px-6 py-4">Veículo</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {/* Exemplo estático - Depois virá do Banco de Dados */}
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">João Silva</td>
                    <td className="px-6 py-4 text-gray-500">Honda Civic 2021</td>
                    <td className="px-6 py-4"><span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">Análise</span></td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">Maria Costa</td>
                    <td className="px-6 py-4 text-gray-500">Toyota Corolla</td>
                    <td className="px-6 py-4"><span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full">Aprovado</span></td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">Pedro Alves</td>
                    <td className="px-6 py-4 text-gray-500">Fiat Toro</td>
                    <td className="px-6 py-4"><span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Novo</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Tabela 2: Desempenho por Vendedor */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="font-bold text-gray-800">Vendas por Vendedor (Mês)</h3>
            </div>
            <div className="p-6 space-y-4">
                {/* Lista simples de vendedores */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">CS</div>
                      <div>
                        <p className="font-medium text-gray-900">Carlos Silva</p>
                        <p className="text-xs text-gray-500">Vendedor Sênior</p>
                      </div>
                  </div>
                  <div className="text-right">
                      <p className="font-bold text-gray-900">8 Carros</p>
                      <p className="text-xs text-emerald-600">Meta batida</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">AS</div>
                      <div>
                        <p className="font-medium text-gray-900">Ana Souza</p>
                        <p className="text-xs text-gray-500">Vendedora</p>
                      </div>
                  </div>
                  <div className="text-right">
                      <p className="font-bold text-gray-900">5 Carros</p>
                      <p className="text-xs text-gray-500">Em andamento</p>
                  </div>
                </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// Componente dos Cards (Mantido idêntico)
function KpiCard({ title, value, sub, icon, color }: any) {
  const bgColors: any = {
    emerald: 'bg-emerald-50',
    blue: 'bg-blue-50',
    purple: 'bg-purple-50',
    gray: 'bg-gray-100'
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        </div>
        <div className={`p-3 rounded-lg ${bgColors[color]}`}>
          {icon}
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-4 font-medium">
        {sub}
      </p>
    </div>
  )
}