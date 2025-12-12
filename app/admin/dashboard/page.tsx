"use client"

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Plus, Trash2, Zap, LayoutDashboard, LogOut, Car, Timer, Edit, ShieldCheck, Loader2 } from "lucide-react";
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

  const handlePromo = async (id: string) => {
    const percent = prompt("Qual a porcentagem de desconto? (Ex: 10)");
    if (!percent) return;
    const hours = prompt("Dura quantas horas? (Ex: 24)");
    if (!hours) return;

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + Number(hours));

    const { error } = await supabase.from('vehicles').update({
        promo_percent: Number(percent),
        promo_expires_at: expiresAt.toISOString()
    }).eq('id', id);

    if (error) alert("Erro: " + error.message);
    else {
        alert("Oferta ativada!");
        fetchVehicles();
    }
  };

  const handleRemovePromo = async (id: string) => {
    if (!confirm("Cancelar promoção?")) return;
    const { error } = await supabase.from('vehicles').update({ promo_percent: 0, promo_expires_at: null }).eq('id', id);
    if (error) alert("Erro: " + error.message);
    else fetchVehicles();
  }

  const handleLogout = async () => {
      await supabase.auth.signOut();
      document.cookie = "admin_access=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
      router.push("/admin");
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      
      {/* Header Branco */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <img 
                    src="https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/chevrolet-bowtie-120.svg" 
                    alt="Chevrolet" 
                    className="h-5"
                />
                <div className="h-6 w-px bg-gray-200"></div>
                <div className="flex items-center gap-2 text-gray-500">
                    <LayoutDashboard size={18} />
                    <span className="font-bold tracking-wide uppercase text-xs">Gestão de Estoque</span>
                </div>
            </div>
            <button onClick={handleLogout} className="text-xs font-bold text-red-600 uppercase tracking-widest hover:text-red-800 flex items-center gap-2 bg-red-50 px-4 py-2 rounded-full transition-colors">
                <LogOut size={14} /> Sair
            </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        
        {/* Barra de Comandos */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
            <div>
                <h1 className="text-3xl font-black uppercase text-gray-900 mb-1">Visão Geral</h1>
                <p className="text-gray-500 text-sm">Gerencie veículos, ofertas e leads em tempo real.</p>
            </div>
            
            <div className="flex gap-3">
                <Link href="/admin/score">
                    <button className="bg-gray-700 text-white px-6 py-3 font-bold uppercase tracking-widest text-xs hover:bg-gray-800 transition-colors flex items-center gap-2 rounded shadow-sm">
                        <ShieldCheck size={16} /> Consultar Score
                    </button>
                </Link>

                <Link href="/admin/carros/novo">
                    <button className="bg-yellow-500 text-black px-6 py-3 font-bold uppercase tracking-widest text-xs hover:bg-yellow-600 transition-colors flex items-center gap-2 rounded shadow-md hover:shadow-lg">
                        <Plus size={16} /> Novo Veículo
                    </button>
                </Link>
            </div>
        </div>

        {/* Tabela de Carros (Clean) */}
        {loading ? (
            <div className="text-center py-20 text-gray-400 flex flex-col items-center">
                <Loader2 className="animate-spin mb-2" size={32}/>
                <p>Carregando sistema...</p>
            </div>
        ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Cabeçalho da Tabela */}
                <div className="hidden md:grid grid-cols-12 gap-4 p-5 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-50">
                    <div className="col-span-2">Foto</div>
                    <div className="col-span-4">Veículo</div>
                    <div className="col-span-2">Oferta</div>
                    <div className="col-span-4 text-right">Ações</div>
                </div>

                {/* Lista */}
                {vehicles.map((car) => {
                    const isPromoActive = car.promo_percent > 0 && car.promo_expires_at && new Date(car.promo_expires_at) > new Date();
                    
                    return (
                        <div key={car.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-5 border-b border-gray-100 items-center hover:bg-gray-50 transition-colors group">
                            
                            {/* Foto */}
                            <div className="col-span-2 h-16 w-24 bg-gray-100 rounded-lg relative overflow-hidden flex items-center justify-center border border-gray-200">
                                {car.image_url ? (
                                    <img src={car.image_url} className="w-full h-full object-contain" />
                                ) : (
                                    <Car size={20} className="text-gray-300"/>
                                )}
                            </div>
                            
                            {/* Info */}
                            <div className="col-span-4">
                                <span className="block font-bold text-gray-900 uppercase text-sm">{car.model}</span>
                                <span className="text-xs font-bold text-yellow-600 uppercase tracking-wider">{car.brand}</span>
                                <div className="text-gray-500 text-xs mt-1">
                                    {formatCurrency(car.price)} • {car.year}
                                </div>
                            </div>

                            {/* Status Promo */}
                            <div className="col-span-2">
                                {isPromoActive ? (
                                    <span className="inline-flex items-center gap-1 text-yellow-700 text-[10px] font-bold uppercase border border-yellow-200 bg-yellow-50 px-2 py-1 rounded-full">
                                        <Zap size={10} fill="currentColor"/> -{car.promo_percent}% Ativo
                                    </span>
                                ) : (
                                    <span className="text-gray-300 text-xs font-medium">--</span>
                                )}
                            </div>

                            {/* Botões */}
                            <div className="col-span-4 flex justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                
                                {isPromoActive ? (
                                    <button onClick={() => handleRemovePromo(car.id)} className="px-3 py-2 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold uppercase rounded transition-colors" title="Parar Promoção">
                                        Parar
                                    </button>
                                ) : (
                                    <button onClick={() => handlePromo(car.id)} className="px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-black text-xs font-bold uppercase rounded transition-colors flex items-center gap-2 shadow-sm" title="Criar Oferta">
                                        <Timer size={14}/> Oferta
                                    </button>
                                )}

                                <Link href={`/admin/carros/editar/${car.id}`}>
                                    <button className="p-2 text-black bg-gray-200 hover:bg-gray-300 rounded border border-transparent transition-colors" title="Editar">
                                        <Edit size={16} />
                                    </button>
                                </Link>

                                <button onClick={() => handleDelete(car.id)} className="p-2 text-red-600 hover:bg-red-50 rounded border border-transparent hover:border-red-100 transition-colors" title="Excluir">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>
        )}
      </main>
    </div>
  )
}