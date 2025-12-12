"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, CheckCircle, Lock, Loader2, ArrowLeft, ShieldCheck } from "lucide-react"

export default function AdminScorePage() {
  const [cpf, setCpf] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<null | number>(null)

  const handleConsult = (e: React.FormEvent) => {
    e.preventDefault()
    if (cpf.length < 14) return alert("Digite um CPF válido")

    setLoading(true)
    setResult(null)

    // Simulação do tempo de API
    setTimeout(() => {
        setLoading(false)
        setResult(Math.floor(Math.random() * (980 - 780 + 1)) + 780)
    }, 2000)
  }

  const maskCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1')
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        
        <Link href="/admin/dashboard" className="inline-flex items-center text-gray-500 hover:text-white mb-8 text-xs font-bold uppercase tracking-widest gap-2">
            <ArrowLeft size={14} /> Voltar ao Painel
        </Link>

        {/* Header da Ferramenta */}
        <div className="flex items-center gap-4 mb-8 border-b border-white/10 pb-8">
            <div className="p-4 bg-blue-900/20 rounded-full border border-blue-500/20">
                <ShieldCheck size={32} className="text-blue-500"/>
            </div>
            <div>
                <h1 className="text-3xl font-bold uppercase tracking-tighter text-white">
                    Consulta de Score
                </h1>
                <p className="text-gray-400 text-sm">
                    Ferramenta interna para análise de crédito do cliente.
                </p>
            </div>
        </div>

        {/* Área Principal */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
            
            <div>
                <h2 className="text-xl font-bold mb-4">Consulte o Potencial de Compra</h2>
                <p className="text-gray-400 mb-8 leading-relaxed">
                    Utilize nossa tecnologia para verificar a pré-aprovação de crédito do cliente em segundos. 
                    <br/><br/>
                    <span className="flex items-center gap-2 text-green-500 text-xs font-bold uppercase tracking-widest">
                        <Lock size={12}/> Ambiente 100% seguro e criptografado
                    </span>
                </p>

                <form onSubmit={handleConsult} className="relative max-w-sm">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">CPF do Cliente</label>
                    <div className="relative group">
                        <input 
                            value={cpf}
                            maxLength={14}
                            onChange={(e) => setCpf(maskCPF(e.target.value))}
                            placeholder="000.000.000-00"
                            className="w-full bg-black border border-gray-700 text-white pl-4 pr-12 py-4 rounded-lg focus:outline-none focus:border-blue-500 transition-all text-lg tracking-widest placeholder:text-gray-600 font-mono"
                        />
                        <button 
                            disabled={loading}
                            type="submit"
                            className="absolute right-2 top-2 bottom-2 bg-white text-black px-4 rounded font-bold uppercase text-xs tracking-widest hover:bg-gray-200 transition-all flex items-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" size={16}/> : <Search size={16}/>}
                        </button>
                    </div>
                </form>
            </div>

            {/* Resultado */}
            <div className="bg-neutral-900 border border-white/5 p-8 rounded-2xl h-full flex flex-col justify-center items-center text-center relative overflow-hidden">
                {!result ? (
                    <div className="opacity-30">
                        <Search size={64} className="mx-auto mb-4"/>
                        <p className="uppercase tracking-widest text-sm">Aguardando Consulta...</p>
                    </div>
                ) : (
                    <div className="animate-in zoom-in duration-500 w-full">
                        <div className="inline-flex justify-center items-center p-4 bg-green-500/10 rounded-full mb-6">
                            <CheckCircle className="text-green-500 h-12 w-12" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2 uppercase tracking-tight">Crédito Pré-Aprovado</h3>
                        <p className="text-gray-400 mb-6 text-sm">Perfil com alta probabilidade de aprovação.</p>
                        
                        <div className="py-6 border-y border-white/10 mb-6">
                            <span className="block text-xs text-gray-500 mb-2 uppercase tracking-widest font-bold">Score Estimado</span>
                            <span className="text-7xl font-bold text-white tracking-tighter">{result}</span>
                        </div>

                        <div className="bg-blue-600 text-white py-3 rounded uppercase font-bold text-xs tracking-widest">
                            Liberado para Financiar
                        </div>
                    </div>
                )}
            </div>

        </div>
      </div>
    </div>
  )
}