"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ShieldCheck } from "lucide-react";

export default function AdminButton() {
  // Começa nulo para não piscar o botão errado antes de verificar
  const [destino, setDestino] = useState<string | null>(null);
  const [titulo, setTitulo] = useState("Carregando...");

  useEffect(() => {
    let montado = true; // Flag para evitar atualizações em componentes desmontados

    async function verificarUsuario() {
      try {
        // 1. Pega a sessão atual
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;

        if (!session?.user) {
          if (montado) setDestino(null);
          return;
        }

        // 2. Consulta o cargo na tabela profiles
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        
        if (profileError) {
          console.warn("Perfil não encontrado ou erro na busca.");
          return;
        }

        // 3. Define o link correto apenas se o componente estiver ativo
        if (montado) {
          if (profile?.role === 'admin') {
            setDestino('/admin');
            setTitulo('Ir para Painel Admin');
          } else if (profile?.role === 'vendedor') {
            setDestino('/vendedor/dashboard');
            setTitulo('Ir para Painel do Vendedor');
          } else {
            setDestino(null);
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error("Erro no AdminButton:", err);
        }
      }
    }

    // Execução inicial
    verificarUsuario();
    
    // Ouve mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        // --- CORREÇÃO AQUI ---
        // Removido: || event === 'TOKEN_REFRESHED'
        // Agora ele ignora a renovação silenciosa de 20s e evita o loop.
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
            console.log("Mudança de Login/Logout detectada:", event);
            verificarUsuario();
        }
    });

    return () => {
        montado = false;
        subscription.unsubscribe();
    };
  }, []);

  // Se não tiver destino definido, não mostra nada
  if (!destino) return null;

  return (
    <a 
      href={destino}
      className="fixed bottom-5 right-5 z-[9999] bg-white text-black p-3 rounded-full shadow-2xl border border-gray-200 hover:scale-110 hover:bg-gray-100 transition-all group flex items-center justify-center"
      title={titulo}
    >
      <ShieldCheck size={24} className="group-hover:text-blue-600 transition-colors" />
    </a>
  );
}