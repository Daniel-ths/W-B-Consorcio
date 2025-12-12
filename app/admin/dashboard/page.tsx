"use client"

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Plus, Trash2, Zap, LayoutDashboard, LogOut, Car, Timer, Edit, ShieldCheck } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    const { data } = await supabase
      .from('vehicles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setVehicles(data);
    setLoading(false);
  };

  // Função de Excluir Veículo
  const handleDelete = async (id: string) => {
    const confirm = window.confirm("Tem certeza que deseja excluir este veículo permanentemente?");
    if (!confirm) return;

    const { error } = await supabase.from('vehicles').delete().eq('id', id);

    if (error) {
      alert("Erro ao excluir: " + error.message);
    } else {
      setVehicles(vehicles.filter(car => car.id !== id));
    }
  };

  // Função de Ativar Promoção (Vendedor)
  const handlePromo = async (id: string) => {
    const percent = prompt("Qual a porcentagem de desconto? (Digite apenas o número. Ex: 10)");
    if (!percent) return;

    const hours = prompt("Dura quantas horas? (Ex: 2, 4, 24)");
    if (!hours) return;

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + Number(hours));

    const { error } = await supabase.from('vehicles').update({
        promo_percent: Number(percent),
        promo_expires_at: expiresAt.toISOString()
    }).eq('id', id);

    if (error) alert("Erro: " + error.message);
    else {
        alert(`Oferta Relâmpago de ${percent}% ativada por ${hours} horas!`);
        fetchVehicles();
    }
  };

  // Função de Cancelar Promoção
  const handleRemovePromo = async (id: string) => {
    if (!confirm("Cancelar promoção deste veículo?")) return;
    
    const { error } = await supabase.from('vehicles').update({ 
        promo_percent: 0, 
        promo_expires_at: null 
    }).eq('id', id);

    if (error) alert("Erro: " + error.message);
    else fetchVehicles();
  }

  const handleLogout = () => {
      document.cookie = "admin_access=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
      router.push("/admin");
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      
      {/* Topo / Header */}
      <header className="bg-black border-b border-white/10 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <LayoutDashboard className="text-gray-400" />
                <span className="font-bold tracking-widest uppercase">Portal Vendedor</span>
            </div>
            <button onClick={handleLogout} className="text-xs font-bold text-red-500 uppercase tracking-widest hover:text-red-400 flex items-center gap-2">
                <LogOut size={14} /> Sair
            </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        
        {/* Barra de Comandos */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
            <div>
                <h1 className="text-3xl font-bold uppercase tracking-tighter mb-2">Gerenciar Estoque</h1>
                <p className="text-gray-500 text-sm">Controle total de veículos e ofertas.</p>
            </div>
            
            <div className="flex gap-4">
                {/* Botão Consultar Score (NOVO) */}
                <Link href="/admin/score">
                    <button className="border border-blue-500/50 text-blue-400 px-6 py-3 font-bold uppercase tracking-widest text-xs hover:bg-blue-500/10 transition-colors flex items-center gap-2">
                        <ShieldCheck size={16} /> Consultar Score
                    </button>
                </Link>

                {/* Botão Novo Veículo */}
                <Link href="/admin/carros/novo">
                    <button className="bg-white text-black px-6 py-3 font-bold uppercase tracking-widest text-xs hover:bg-gray-200 transition-colors flex items-center gap-2">
                        <Plus size={16} /> Novo Veículo
                    </button>
                </Link>
            </div>
        </div>

        {/* Tabela de Carros */}
        {loading ? (
            <div className="text-center py-20 text-gray-500 animate-pulse">Carregando sistema...</div>
        ) : (
            <div className="border border-white/10 bg-black/50 overflow-hidden">
                {/* Cabeçalho */}
                <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-white/10 text-xs font-bold text-gray-500 uppercase tracking-widest">
                    <div className="col-span-2">Foto</div>
                    <div className="col-span-4">Veículo</div>
                    <div className="col-span-2">Status Promo</div>
                    <div className="col-span-4 text-right">Ações</div>
                </div>

                {/* Lista */}
                {vehicles.map((car) => {
                    const isPromoActive = car.promo_percent > 0 && car.promo_expires_at && new Date(car.promo_expires_at) > new Date();
                    
                    return (
                        <div key={car.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border-b border-white/5 items-center hover:bg-white/5 transition-colors">
                            
                            {/* Foto */}
                            <div className="col-span-2 h-16 w-24 bg-neutral-900 relative overflow-hidden group">
                                {car.image_url ? (
                                    <img src={car.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-700"><Car size={20}/></div>
                                )}
                            </div>
                            
                            {/* Info */}
                            <div className="col-span-4 font-bold text-white uppercase tracking-wide">
                                {car.brand} {car.model}
                                <div className="text-gray-500 text-xs font-normal mt-1 flex gap-2">
                                    {formatCurrency(car.price)} • {car.year}
                                </div>
                            </div>

                            {/* Status */}
                            <div className="col-span-2">
                                {isPromoActive ? (
                                    <span className="inline-flex items-center gap-1 text-yellow-400 text-xs font-bold uppercase border border-yellow-400/30 bg-yellow-400/10 px-2 py-1 rounded">
                                        <Zap size={12} fill="currentColor"/> -{car.promo_percent}% Ativo
                                    </span>
                                ) : (
                                    <span className="text-gray-600 text-xs uppercase opacity-50">--</span>
                                )}
                            </div>

                            {/* Botões */}
                            <div className="col-span-4 flex justify-end gap-2">
                                
                                {isPromoActive ? (
                                    <button onClick={() => handleRemovePromo(car.id)} className="px-3 py-2 border border-red-500/50 text-red-400 hover:bg-red-900/20 text-xs font-bold uppercase rounded transition-colors" title="Parar Promoção">
                                        Parar
                                    </button>
                                ) : (
                                    <button onClick={() => handlePromo(car.id)} className="px-3 py-2 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold uppercase rounded transition-colors flex items-center gap-2" title="Criar Oferta">
                                        <Timer size={14}/> Oferta
                                    </button>
                                )}

                                <Link href={`/admin/carros/editar/${car.id}`}>
                                    <button className="p-2 text-blue-400 hover:bg-blue-900/20 rounded-md transition-colors" title="Editar Veículo">
                                        <Edit size={16} />
                                    </button>
                                </Link>

                                <button onClick={() => handleDelete(car.id)} className="p-2 text-gray-500 hover:text-red-400 hover:bg-white/5 rounded" title="Excluir Veículo">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    )
                })}

                {vehicles.length === 0 && (
                    <div className="p-12 text-center text-gray-600 border-t border-white/5">
                        <Car size={48} className="mx-auto mb-4 opacity-20"/>
                        <p>Nenhum carro no estoque.</p>
                    </div>
                )}
            </div>
        )}
      </main>
    </div>
  )
}