"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2, KeyRound, Mail } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // --- CORREÇÃO DE SEGURANÇA E REDIRECIONAMENTO ---
      
      // 1. Define quem é o admin (tudo minúsculo para comparar)
      const ADMIN_EMAIL = "admin@gmail.com"; 
      
      // 2. Normaliza o email digitado (remove espaços e poe minúsculo)
      const emailDigitado = email.trim().toLowerCase();

      if (emailDigitado === ADMIN_EMAIL) {
        console.log("Logado como ADMIN. Redirecionando...");
        router.push("/admin"); 
      } else {
        console.log("Logado como VENDEDOR. Redirecionando...");
        router.push("/vendedor"); 
      }

    } catch (error: any) {
      console.error(error);
      setErrorMsg("Email ou senha incorretos.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-sm border border-gray-200">
        
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-black text-white rounded-lg mb-4">
            <KeyRound size={24} />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Acesso Restrito</h1>
          <p className="text-xs text-gray-500 mt-1">Área exclusiva para colaboradores</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400" size={16} />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded text-sm focus:border-black focus:ring-1 focus:ring-black outline-none"
                placeholder="seu@email.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Senha</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded text-sm focus:border-black focus:ring-1 focus:ring-black outline-none"
              placeholder="••••••••"
            />
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded border border-red-100 text-center">
              {errorMsg}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-black hover:bg-gray-800 text-white font-bold py-3 rounded transition-all text-sm flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}