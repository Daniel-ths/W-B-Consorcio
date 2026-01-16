"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ShieldCheck, Loader2 } from "lucide-react";

export default function AdminButton() {
  // Começa nulo para não piscar o botão errado antes de verificar
  const [destino, setDestino] = useState<string | null>(null);
  const [titulo, setTitulo] = useState("Carregando...");

  useEffect(() => {
    async function verificarUsuario() {
      console.log("Verificando usuário para o botão...");

      // 1. Pega usuário logado
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log("Usuário não logado.");
        // Se quiser mostrar o botão para login, descomente a linha abaixo:
        // setDestino('/login'); setTitulo('Fazer Login');
        return;
      }

      // 2. Consulta o cargo na tabela profiles
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error("Erro ao buscar perfil:", error);
        return;
      }

      console.log("Cargo encontrado:", profile?.role);

      // 3. Define o link correto
      if (profile?.role === 'admin') {
        setDestino('/admin');
        setTitulo('Ir para Painel Admin');
      } else if (profile?.role === 'vendedor') {
        setDestino('/vendedor/dashboard');
        setTitulo('Ir para Painel do Vendedor');
      }
    }

    verificarUsuario();
    
    // Ouve mudanças de auth para atualizar o botão se o usuário sair/entrar
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
        verificarUsuario();
    });

    return () => {
        subscription.unsubscribe();
    };
  }, []);

  // Se não tiver destino definido (não é admin nem vendedor), não mostra nada
  if (!destino) return null;

  return (
    // USAMOS A TAG <a> PARA EVITAR O LOOP INFINITO
    // Isso força o navegador a carregar a página do zero, validando o cookie corretamente
    <a 
      href={destino}
      className="fixed bottom-5 right-5 z-[9999] bg-white text-black p-3 rounded-full shadow-2xl border border-gray-200 hover:scale-110 hover:bg-gray-100 transition-all group flex items-center justify-center"
      title={titulo}
    >
      <ShieldCheck size={24} className="group-hover:text-blue-600 transition-colors" />
    </a>
  );
}