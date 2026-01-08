import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr' // <--- Agora usando a lib certa

export function useUserRole() {
  const [role, setRole] = useState<'admin' | 'vendedor' | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Criando o cliente da forma correta para a nova versão
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function getRole() {
      try {
        // 1. Pega a sessão atual
        const { data: { session } } = await supabase.auth.getSession()
        
        // 2. Se não tiver usuário logado, retorna null
        if (!session) {
          setRole(null)
          setLoading(false)
          return
        }

        // 3. Se tiver logado, busca o cargo na tabela 'profiles'
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()

        if (error) {
            console.error("Erro ao buscar perfil:", error)
            // Se der erro (ex: perfil não criado), assume vendedor por segurança
            setRole('vendedor') 
        } else {
            setRole(profile?.role || 'vendedor')
        }

      } catch (error) {
        console.error('Erro inesperado no hook:', error)
        setRole(null)
      } finally {
        setLoading(false)
      }
    }

    getRole()
  }, [])

  return { role, loading }
}