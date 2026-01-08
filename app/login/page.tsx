'use client';

import React, { useState } from 'react';
import { User, Lock, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase'; // Importando o Supabase real

const LoginPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // 1. Tenta fazer login REAL no Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        throw error;
      }

      // 2. Se deu certo, define o cargo (lógica simples baseada no email)
      // Você pode melhorar isso depois puxando do banco de dados
      const role = email.includes('admin') ? 'Administrador' : 'Vendedor';
      localStorage.setItem('userRole', role);

      // 3. Força o router a atualizar para o Navbar perceber a mudança
      router.refresh();
      router.push('/'); 
      
    } catch (error: any) {
      console.error("Erro no login:", error);
      setErrorMessage("Email ou senha incorretos. Tente novamente.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4 font-sans">
      
      {/* Header Centralizado com Logo */}
      <div className="mb-8 text-center animate-fade-in-down">
        <img 
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Chevrolet_Logo.png/800px-Chevrolet_Logo.png" 
          alt="Chevrolet" 
          className="h-16 w-auto mx-auto mb-4 object-contain"
        />
        <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Portal do Concessionário</h2>
        <p className="text-gray-500 text-sm mt-1">Acesso exclusivo para Vendedores e Gerência</p>
      </div>

      {/* Card de Login */}
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100">
        
        {/* Barra Superior Decorativa */}
        <div className="h-2 bg-yellow-400 w-full"></div>

        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            
            {/* Mensagem de Erro */}
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle size={16} />
                {errorMessage}
              </div>
            )}

            {/* Input Usuário */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <User size={16} className="text-yellow-500" />
                Email Corporativo
              </label>
              <div className="relative">
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 outline-none transition-all text-gray-700 placeholder-gray-400"
                />
              </div>
            </div>

            {/* Input Senha */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Lock size={16} className="text-yellow-500" />
                Senha de Acesso
              </label>
              <div className="relative">
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 outline-none transition-all text-gray-700 placeholder-gray-400"
                />
              </div>
            </div>

            {/* Botão Entrar */}
            <button 
              type="submit" 
              disabled={isLoading}
              className={`w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 rounded-xl shadow-lg transition-all transform flex items-center justify-center gap-2 ${
                isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {isLoading ? (
                <span className="animate-pulse">Autenticando...</span>
              ) : (
                <>
                  ACESSAR SISTEMA <ArrowRight size={18} />
                </>
              )}
            </button>

          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <div className="flex justify-center items-center gap-2 text-xs text-gray-400 mb-2">
              <ShieldCheck size={14} />
              <span>Ambiente Seguro via Supabase</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer simples */}
      <div className="mt-8 text-center text-xs text-gray-400">
        &copy; 2024 Chevrolet Dealer System.
      </div>
    </div>
  );
};

export default LoginPage;