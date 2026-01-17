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
        console.log("Verificando sessão para o botão...");

        // 1. Pega a sessão atual (mais estável que getUser para componentes de UI)
        // Isso evita o erro de 'locks.js' e o AbortError
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;

        if (!session?.user) {
          console.log("Usuário não logado.");
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
          // Se o perfil ainda não existir ou a API falhar, não quebramos o app
          console.warn("Perfil não encontrado ou erro na busca.");
          return;
        }

        console.log("Cargo encontrado:", profile?.role);

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
        // Ignora erros de aborto que causam o loop visual
        if (err.name !== 'AbortError') {
          console.error("Erro crítico no AdminButton:", err);
        }
      }
    }

    // Execução inicial
    verificarUsuario();
    
    // Ouve mudanças de auth para atualizar o botão de forma otimizada
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        console.log("Evento de Auth detectado:", event);
        // Só revalida se houver mudança real de login/logout/token
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
            verificarUsuario();
        }
    });

    return () => {
        montado = false;
        subscription.unsubscribe();
    };
  }, []);

  // Se não tiver destino definido (não é admin nem vendedor), não mostra nada
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