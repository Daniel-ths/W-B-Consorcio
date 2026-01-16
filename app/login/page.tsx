"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from '@supabase/ssr';
import { Mail, Lock, Loader2, ArrowRight, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true); // <--- NOVO: Controla o loading inicial da sessão
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 1. PROTEÇÃO ANTI-LOOP: Verifica se já está logado ao entrar na página
  useEffect(() => {
    const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            // Se já tem sessão, busca o cargo e redireciona
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .single();
            
            const role = profile?.role || 'vendedor';
            
            if (role === 'admin') router.replace('/admin');
            else router.replace('/vendedor/dashboard');
        } else {
            // Se não tem sessão, libera o formulário
            setCheckingSession(false);
        }
    };
    checkUser();
  }, [router, supabase]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Email ou senha incorretos.");
      setLoading(false);
      return;
    }

    router.refresh(); 

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

    const role = profile?.role || 'vendedor';

    // Delay visual (UX)
    await new Promise(resolve => setTimeout(resolve, 500));

    if (role === 'admin') {
        router.replace('/admin');
    } else {
        router.replace('/vendedor/dashboard');
    }
  };

  // Se estiver checando a sessão, mostra um loading de tela cheia (evita piscar o formulário)
  if (checkingSession) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-white">
            <Loader2 className="animate-spin text-gray-400" size={32} />
        </div>
      );
  }

  return (
    <div className="flex min-h-screen w-full font-sans bg-white">
      
      {/* --- LADO ESQUERDO: IMAGEM/BRANDING --- */}
      <div className="hidden lg:flex w-1/2 relative bg-black items-center justify-center overflow-hidden">
        <div 
            className="absolute inset-0 bg-cover bg-center opacity-60"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=1920&auto=format&fit=crop')" }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40"></div>

        <div className="relative z-10 p-12 text-white max-w-lg">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center mb-6 border border-white/10">
                <ShieldCheck size={28} className="text-white" />
            </div>
            <h2 className="text-4xl font-bold mb-4 tracking-tight leading-tight">
                Gestão automotiva simplificada.
            </h2>
            <p className="text-gray-300 text-lg leading-relaxed">
                Controle total sobre vendas, estoque e equipe em uma única plataforma integrada e segura.
            </p>
        </div>
      </div>

      {/* --- LADO DIREITO: FORMULÁRIO --- */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-12 bg-white">
        <div className="w-full max-w-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            <div className="text-center lg:text-left">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Bem-vindo de volta</h1>
                <p className="text-gray-500 mt-2 text-sm">Digite suas credenciais para acessar o painel.</p>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm flex items-center gap-2 border border-red-100 animate-in fade-in">
                    <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
                    {error}
                </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
                
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wide ml-1">E-mail Corporativo</label>
                    <div className="relative group">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" size={18} />
                        <input
                            type="email"
                            placeholder="exemplo@wbauto.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all placeholder:text-gray-400 text-gray-900"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <div className="flex justify-between items-center ml-1">
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Senha</label>
                        <a href="#" className="text-xs text-gray-500 hover:text-black hover:underline"></a>
                    </div>
                    <div className="relative group">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" size={18} />
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all placeholder:text-gray-400 text-gray-900"
                            required
                        />
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-black text-white py-3.5 rounded-lg font-bold text-sm tracking-wide hover:bg-gray-800 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg shadow-gray-200 flex items-center justify-center gap-2 group"
                >
                    {loading ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            Acessando...
                        </>
                    ) : (
                        <>
                            Entrar no Sistema
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>
            </form>

            <p className="text-center text-xs text-gray-400 mt-8">
                &copy; 2026 W B C Consórcio LTDA. Todos os direitos reservados.
            </p>
        </div>
      </div>
    </div>
  );
}