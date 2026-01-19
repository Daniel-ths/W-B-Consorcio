"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { LayoutDashboard, Plus, Car } from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Busca dados sem perguntar quem é o usuário
    const fetchData = async () => {
      try {
        const { data } = await supabase.from("sales").select("*").order("created_at", { ascending: false });
        setSales(data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-20 text-center">Carregando Painel...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6 pt-24">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LayoutDashboard /> Painel Admin (Modo Livre)
          </h1>
          
          {/* O BOTÃO QUE SEU FUNCIONÁRIO PRECISA 👇 */}
          <Link href="/admin/cars/new" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700">
            <Plus size={20}/> CADASTRAR NOVO VEÍCULO
          </Link>
        </div>

        {/* LISTA SIMPLES */}
        <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="font-bold mb-4">Vendas Recentes</h2>
            {sales.length === 0 ? (
                <p className="text-gray-500">Nenhuma venda encontrada ou acesso restrito pelo Banco de Dados.</p>
            ) : (
                <ul>
                    {sales.map((s: any) => <li key={s.id} className="border-b py-2">{s.client_name} - {s.car_name}</li>)}
                </ul>
            )}
        </div>

      </div>
    </div>
  );
}