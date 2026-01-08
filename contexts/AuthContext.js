"use client"; // Necessário se usar Next.js 13+ App Router

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // Use 'next/router' se for versão antiga

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 1. Ao carregar a página (F5), verifica se já existe login salvo
  useEffect(() => {
    const usuarioSalvo = localStorage.getItem("u_data");
    if (usuarioSalvo) {
      setUser(JSON.parse(usuarioSalvo));
    }
    setLoading(false);
  }, []);

  // 2. Função de Login
  const login = async (email, password) => {
    try {
      // AQUI entra sua chamada real para a API
      // const response = await api.post('/login', { email, password });
      
      // MOCK (Simulação) - Substitua pela resposta real da sua API
      const responseMock = {
        token: "123token",
        user: {
          id: 1,
          name: "Fulano",
          email: email,
          // O PULO DO GATO: O backend precisa retornar a 'role' (cargo)
          role: email.includes("vendedor") ? "vendedor" : "cliente" 
        }
      };

      // Salva no estado (memória) e no localStorage (persistência)
      localStorage.setItem("u_token", responseMock.token);
      localStorage.setItem("u_data", JSON.stringify(responseMock.user));
      
      setUser(responseMock.user);
      
      // Redireciona APÓS salvar o estado
      router.push("/dashboard");
      
    } catch (error) {
      console.error("Erro no login", error);
      alert("Falha ao logar");
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("u_token");
    localStorage.removeItem("u_data");
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);