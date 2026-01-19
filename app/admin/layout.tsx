"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

export default function AdminDashboard({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState("Iniciando verificação...");
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkDebug = async () => {
      try {
        setStatus("Verificando sessão local...");
        
        // 1. Pega a sessão (LocalStorage)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        // 2. Pega o usuário (Validação Servidor)
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        let profileData = null;
        let profileError = null;

        if (user) {
          setStatus("Usuário encontrado. Buscando perfil...");
          // 3. Busca o perfil
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
            
          profileData = data;
          profileError = error;
        }

        setDebugInfo({
          session: session ? "Sessão Ativa ✅" : "Sem Sessão ❌",
          user: user ? `Logado: ${user.email}` : "Usuário Nulo ❌",
          userId: user?.id,
          userError: userError?.message,
          profileRole: profileData?.role || "Não definido",
          profileError: profileError?.message
        });

        // LÓGICA DE APROVAÇÃO (SEM REDIRECIONAR)
        if (user && profileData?.role === 'admin') {
          setIsAuthorized(true);
          setStatus("✅ Acesso Permitido (Admin confirmado)");
        } else {
          setStatus("⛔ Acesso Negado: " + (user ? "Usuário não é admin" : "Não logado"));
        }

      } catch (err: any) {
        setStatus("Erro Crítico: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    checkDebug();
  }, []);

  // TELA DE DIAGNÓSTICO (NÃO REDIRECIONA)
  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 bg-gray-50">
      <Loader2 className="animate-spin text-blue-600" size={48} />
      <p className="text-gray-500 font-mono">{status}</p>
    </div>
  );

  if (!isAuthorized) {
    return (
      <div className="min-h-screen p-10 bg-gray-100 font-mono text-sm">
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-xl border-l-4 border-red-500">
          <h1 className="text-2xl font-bold text-red-600 flex items-center gap-2 mb-6">
            <AlertTriangle /> Loop Interrompido (Modo Debug)
          </h1>
          
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded border">
              <p className="font-bold text-gray-500 text-xs uppercase">Status Atual</p>
              <p className="text-lg font-bold">{status}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded border border-blue-100">
                <p className="font-bold text-blue-500 text-xs uppercase">Sessão Supabase</p>
                <p>{debugInfo.session}</p>
              </div>
              <div className="p-4 bg-purple-50 rounded border border-purple-100">
                <p className="font-bold text-purple-500 text-xs uppercase">Perfil (Banco de Dados)</p>
                <p>Role: <strong>{debugInfo.profileRole}</strong></p>
                {debugInfo.profileError && <p className="text-red-500 text-xs mt-1">{debugInfo.profileError}</p>}
              </div>
            </div>

            <div className="p-4 bg-slate-800 text-green-400 rounded font-mono text-xs overflow-auto">
              <p className="mb-2 text-white font-bold border-b border-gray-600 pb-1">Detalhes Técnicos:</p>
              <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>

            <div className="flex gap-4 mt-6">
              <button onClick={() => window.location.href = '/login'} className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300 font-bold">
                Ir para Login
              </button>
              <button onClick={() => window.location.reload()} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-bold">
                Tentar Recarregar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // SE ESTIVER TUDO CERTO, MOSTRA O PAINEL NORMALMENTE
  return (
    <div className="min-h-screen bg-slate-50">
        {/* Barra de Aviso Debug */}
        <div className="bg-yellow-100 px-4 py-1 text-[10px] text-yellow-800 text-center font-bold">
            MODO DEBUG ATIVO - SE VOCÊ VÊ ISTO, O LOOP FOI RESOLVIDO
        </div>
        {children}
    </div>
  );
}