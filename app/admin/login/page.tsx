'use client'

import { createBrowserClient } from '@supabase/ssr' // <--- MUDOU AQUI
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LoginPage() {
  // ... (states iguais: email, password, etc) ...
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  
  const router = useRouter()
  
  // CRIAR O CLIENTE ASSIM AGORA:
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleLogin = async (e: React.FormEvent) => {
    // ... (o resto do código continua IDÊNTICO ao anterior) ...
    e.preventDefault()
    setLoading(true)
    // ...
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
       setError('Erro ao entrar.')
       setLoading(false)
    } else {
       router.refresh()
       router.push('/admin/dashboard')
    }
  }

  // ... (o return do JSX continua IDÊNTICO) ...
  return (
      // ... seu html ...
      <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
        <div className="w-full max-w-md p-8 bg-gray-800 rounded-lg shadow-lg">
             {/* ... resto do seu formulário ... */}
             <form onSubmit={handleLogin} className="space-y-4">
                {/* Inputs de email e senha iguais ao anterior */}
                <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input 
                        type="email" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)}
                        className="w-full p-3 rounded bg-gray-700 border border-gray-600"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Senha</label>
                    <input 
                        type="password" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)}
                        className="w-full p-3 rounded bg-gray-700 border border-gray-600"
                    />
                </div>
                <button type="submit" className="w-full bg-emerald-600 p-3 rounded">Entrar</button>
             </form>
        </div>
      </div>
  )
}