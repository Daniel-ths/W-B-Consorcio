"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Mail, Lock, ArrowRight, AlertCircle, Leaf } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  
  // Estados
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // --- APENAS LOGIN ---
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      // Redireciona e força recarregamento para atualizar a Navbar
      router.push("/"); 
      router.refresh();

    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao autenticar.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[5000] min-h-screen flex bg-white font-sans">
      
      {/* --- LADO ESQUERDO: DECORATIVO --- */}
      <div className="hidden lg:flex w-1/2 bg-gray-900 relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=2583&auto=format&fit=crop')] bg-cover bg-center opacity-40"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40"></div>
        
        <div className="relative z-10 p-12 text-white max-w-lg">
            <h2 className="text-5xl font-extrabold mb-6 leading-tight tracking-tight">Potencialize suas vendas.</h2>
            <p className="text-lg text-gray-300 mb-8 font-light">
              Acesso exclusivo para colaboradores e gestores.
            </p>
            <div className="flex items-center gap-3 text-green-400 bg-green-900/30 p-4 rounded-lg border border-green-800 backdrop-blur-sm">
                <Leaf size={24} />
                <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-green-300">Ambiente Seguro</p>
                    <p className="text-sm font-medium">Sistema integrado Chevrolet & Parceiros</p>
                </div>
            </div>
        </div>
      </div>

      {/* --- LADO DIREITO: FORMULÁRIO --- */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 lg:p-16 bg-white relative overflow-y-auto">
        
        <Link href="/" className="absolute top-8 right-8 text-sm font-bold text-gray-400 hover:text-green-700 flex items-center gap-2 transition-colors">
            Voltar ao site <ArrowRight size={16}/>
        </Link>

        <div className="w-full max-w-md space-y-8">
          
          {/* LOGOS */}
          <div className="flex items-center justify-center gap-6 mb-10 opacity-90">
             <div className="h-10 flex items-center">
                <span className="text-xl font-bold text-gray-400 border-2 border-dashed border-gray-300 px-4 py-1 rounded">LOGO PARCEIRA</span>
             </div>
             <div className="h-8 w-px bg-gray-300"></div>
             <img src="https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/chevrolet-logo.svg" alt="Chevrolet" className="h-6 object-contain grayscale hover:grayscale-0 transition-all duration-500" />
          </div>

          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Acesso Restrito</h1>
            <p className="text-sm text-gray-500 mt-3">Digite suas credenciais para entrar no sistema.</p>
          </div>

          {/* MENSAGEM DE ERRO */}
          {message && (
            <div className="p-4 rounded-lg flex items-start gap-3 text-sm animate-in fade-in slide-in-from-top-2 bg-red-50 text-red-700 border border-red-100">
                <AlertCircle className="shrink-0 mt-0.5" size={18}/>
                <span className="font-medium">{message.text}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">E-mail</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-green-600 transition-colors" size={20} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all font-medium text-gray-900 placeholder-gray-400"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Senha</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-green-600 transition-colors" size={20} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all font-medium text-gray-900 placeholder-gray-400"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-900/10 hover:shadow-green-900/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
            >
              {loading ? <Loader2 className="animate-spin" /> : "Entrar no Sistema"}
            </button>
          </form>

          <div className="mt-8 flex justify-center">
             <p className="text-[10px] text-gray-300 uppercase tracking-widest font-bold">WB Auto System v1.0</p>
          </div>
        </div>
      </div>
    </div>
  );
}