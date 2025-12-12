"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Lock, ArrowRight, Car, UserCircle } from "lucide-react"

export default function Login() {
  const [user, setUser] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // LOGIN DO VENDEDOR
    if (user === "vendedor" && password === "vendas123") {
       document.cookie = "admin_access=true; path=/"
       router.push("/admin/dashboard")
    } 
    // LOGIN DO DONO (ADMIN)
    else if (user === "admin" && password === "admin123") {
       document.cookie = "admin_access=true; path=/"
       router.push("/admin/dashboard")
    } else {
       setError("Usuário ou senha incorretos.")
       setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="mb-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-6">
            <Car size={32} className="text-black" />
        </div>
        <h1 className="text-3xl font-bold text-white tracking-widest uppercase mb-2">Acesso Restrito</h1>
        <p className="text-gray-500 text-sm tracking-wide uppercase">Portal do Vendedor WB Auto</p>
      </div>

      <div className="w-full max-w-sm">
        <form onSubmit={handleLogin} className="space-y-6">
            
            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Usuário</label>
                <div className="relative group">
                    <UserCircle className="absolute left-4 top-3.5 text-gray-600" size={18} />
                    <input 
                        value={user}
                        onChange={(e) => setUser(e.target.value)}
                        placeholder="vendedor"
                        className="w-full bg-neutral-900 border border-neutral-800 text-white pl-12 pr-4 py-3 focus:outline-none focus:border-white transition-all placeholder-neutral-700"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Senha</label>
                <div className="relative group">
                    <Lock className="absolute left-4 top-3.5 text-gray-600" size={18} />
                    <input 
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-neutral-900 border border-neutral-800 text-white pl-12 pr-4 py-3 focus:outline-none focus:border-white transition-all placeholder-neutral-700"
                    />
                </div>
            </div>

            {error && (
                <div className="bg-red-900/20 border border-red-900/50 text-red-400 text-xs p-3 text-center uppercase tracking-wide">
                    {error}
                </div>
            )}

            <button 
                disabled={loading}
                type="submit" 
                className="w-full bg-white text-black h-12 font-bold uppercase tracking-[0.15em] hover:bg-gray-200 transition-all flex items-center justify-center gap-2 text-xs disabled:opacity-50"
            >
                {loading ? "Acessando..." : "Entrar no Painel"} <ArrowRight size={16}/>
            </button>
        </form>
      </div>
    </div>
  )
}