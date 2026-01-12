"use client"

import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AdminButton() {
  // Começa apontando para o Login por segurança
  const [destino, setDestino] = useState('/login')
  const [titulo, setTitulo] = useState('Carregando...')

  useEffect(() => {
    async function verificarUsuario() {
      console.log("Verificando usuário para o botão...") // Debug no F12

      // 1. Pega usuário logado
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.log("Usuário não logado. Botão vai para Login.")
        setDestino('/login')
        setTitulo('Fazer Login')
        return
      }

      // 2. Consulta o cargo na tabela profiles
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      if (error) {
        console.error("Erro ao buscar perfil:", error)
        return
      }

      console.log("Cargo encontrado:", profile?.role)

      // 3. Define o link correto
      if (profile?.role === 'admin') {
        // AQUI: Isso aponta para app/admin/page.tsx
        setDestino('/admin') 
        setTitulo('Ir para Painel Admin')
      } else if (profile?.role === 'vendedor') {
        // AQUI: Isso aponta para app/vendedor/dashboard/page.tsx
        setDestino('/vendedor/dashboard') 
        setTitulo('Ir para Painel do Vendedor')
      }
    }

    verificarUsuario()
  }, [])

  return (
    <Link 
      href={destino} 
      // Adicionamos prefetch={false} para evitar cache antigo
      prefetch={false}
      className="fixed bottom-5 right-5 z-[9999] bg-white text-black p-3 rounded-full shadow-2xl border border-gray-200 hover:scale-110 hover:bg-gray-100 transition-all group"
      title={titulo}
    >
      <ShieldCheck size={24} className="group-hover:text-blue-600 transition-colors" />
    </Link>
  )
}