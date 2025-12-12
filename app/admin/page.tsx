"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Lock, ArrowRight, Loader2, User } from "lucide-react"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    })

    if (error) {
      setError("Acesso negado. Verifique suas credenciais.")
      setLoading(false)
    } else {
      document.cookie = "admin_access=true; path=/"
      router.push("/admin/dashboard")
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      
      <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-sm border border-gray-200">
          <div className="mb-10 text-center">
            {/* Logo Chevrolet */}
            <img 
                src="https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/chevrolet-bowtie-120.svg" 
                alt="Chevrolet" 
                className="h-8 mx-auto mb-6"
            />
            <h1 className="text-xl font-bold text-gray-900 uppercase tracking-tight">Portal do Vendedor</h1>
            <p className="text-gray-500 text-xs mt-2">Acesso restrito à equipe de vendas</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
                
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">E-mail</label>
                    <div className="relative group">
                        <User className="absolute left-4 top-3.5 text-gray-400" size={18} />
                        <input 
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 text-gray-900 pl-12 pr-4 py-3 rounded-lg focus:outline-none focus:border-yellow-500 focus:bg-white transition-all placeholder-gray-400 font-medium"
                            placeholder="vendedor@wbauto.com.br"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Senha</label>
                    <div className="relative group">
                        <Lock className="absolute left-4 top-3.5 text-gray-400" size={18} />
                        <input 
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 text-gray-900 pl-12 pr-4 py-3 rounded-lg focus:outline-none focus:border-yellow-500 focus:bg-white transition-all placeholder-gray-400 font-medium"
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-100 text-red-600 text-xs p-3 rounded text-center font-bold">
                        {error}
                    </div>
                )}

                <button 
                    disabled={loading}
                    type="submit" 
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-white h-12 font-bold uppercase tracking-widest text-xs rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" size={16}/> : "Acessar Painel"} {!loading && <ArrowRight size={16}/>}
                </button>
          </form>
      </div>
      
      <p className="mt-8 text-center text-[10px] text-gray-400 uppercase font-bold tracking-widest">
        Sistema Seguro WB Auto
      </p>
    </div>
  )
}