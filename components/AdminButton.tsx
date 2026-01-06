"use client"

import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'

export default function AdminButton() {
  return (
    <Link 
      href="/admin" 
      className="fixed bottom-5 right-5 z-[9999] bg-white text-black p-3 rounded-full shadow-2xl border border-gray-200 hover:scale-110 hover:bg-gray-100 transition-all group"
      title="Ir para o Painel Admin"
    >
      <ShieldCheck size={24} className="group-hover:text-blue-600 transition-colors" />
    </Link>
  )
}