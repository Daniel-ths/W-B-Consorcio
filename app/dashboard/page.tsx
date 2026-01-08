"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase"; 
import { 
  FileText, 
  Users, 
  SearchCheck, 
  DollarSign, // Ícone de dinheiro para comissão/vendas
  Loader2 
} from 'lucide-react';

export default function SellerDashboard() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  // --- PROTEÇÃO DE ROTA ---
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUser(user);
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

  return (
    // Espaçamento para não ficar atrás da Navbar
    <div className="min-h-screen bg-gray-50 pt-24 px-8 pb-8">
      <div className="space-y-8 max-w-7xl mx-auto">
      
        {/* Cabeçalho */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Minha Área de Vendas</h1>
            <p className="text-gray-500 mt-1">Bem-vindo de volta, {user.email}</p>
          </div>
        </div>

        {/* Grid de KPIs - Focado no VENDEDOR INDIVIDUAL */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard 
            title="Minhas Vendas (Mês)" 
            value="5" 
            sub="Meta: 8 veículos"
            icon={<DollarSign size={24} className="text-emerald-600" />}
            color="emerald"
          />
          <KpiCard 
            title="Simulações em Aberto" 
            value="8" 
            sub="3 precisam de retorno hoje"
            icon={<FileText size={24} className="text-blue-600" />}
            color="blue"
          />
          <KpiCard 
            title="Meus Clientes" 
            value="42" 
            sub="Carteira ativa"
            icon={<Users size={24} className="text-purple-600" />}
            color="purple"
          />
          <KpiCard 
            title="Consultas Realizadas" 
            value="15" 
            sub="Últimos 7 dias"
            icon={<SearchCheck size={24} className="text-gray-600" />}
            color="gray"
          />
        </div>

        {/* Tabela: Meus Clientes Recentes */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">Meus Atendimentos Recentes</h3>
            <button className="text-sm text-blue-600 font-medium hover:underline">Ver agenda completa</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 font-medium">
                <tr>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Interesse</th>
                  <th className="px-6 py-4">Etapa</th>
                  <th className="px-6 py-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">Roberto Menezes</td>
                  <td className="px-6 py-4 text-gray-500">Chevrolet Onix</td>
                  <td className="px-6 py-4"><span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">Negociação</span></td>
                  <td className="px-6 py-4 text-right text-blue-600 cursor-pointer font-bold">Ver</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">Fernanda Lima</td>
                  <td className="px-6 py-4 text-gray-500">Tracker Premier</td>
                  <td className="px-6 py-4"><span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full">Venda Fechada</span></td>
                  <td className="px-6 py-4 text-right text-blue-600 cursor-pointer font-bold">Ver</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">Ricardo Souza</td>
                  <td className="px-6 py-4 text-gray-500">S10 High Country</td>
                  <td className="px-6 py-4"><span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">Prospecção</span></td>
                  <td className="px-6 py-4 text-right text-blue-600 cursor-pointer font-bold">Ver</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

// Componente dos Cards (Reutilizado para manter padrão visual)
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