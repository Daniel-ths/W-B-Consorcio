"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// Definindo o formato dos dados
type AuthContextType = {
  user: any;
  loading: boolean;
  signOut: () => Promise<void>;
};

// Criando o contexto
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // 1. Função que busca o usuário UMA VEZ
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error("Erro no Contexto:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    checkUser();

    // 2. Ouvinte passivo (Só atualiza os dados, NUNCA redireciona)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (mounted) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Logout simples
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    // NÃO colocamos window.location.href aqui. Deixamos o botão decidir.
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);