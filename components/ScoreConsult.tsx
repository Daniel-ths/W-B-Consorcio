"use client"

import { useState } from "react"
import { Search, CheckCircle, Lock, Loader2 } from "lucide-react"

export default function ScoreConsult() {
  const [cpf, setCpf] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<null | number>(null)

  const handleConsult = (e: React.FormEvent) => {
    e.preventDefault()
    // Validação simples de tamanho
    if (cpf.length < 14) return alert("Digite um CPF válido")

    setLoading(true)
    setResult(null)

    // Simula o tempo de processamento (2.5 segundos)
    setTimeout(() => {
        setLoading(false)
        // Gera um score aleatório alto (entre 780 e 980) para o cliente ficar feliz
        setResult(Math.floor(Math.random() * (980 - 780 + 1)) + 780)
    }, 2500)
  }

  // Função para colocar os pontos e traço no CPF visualmente
  const maskCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1')
  }

  return (
    <section className="py-24 bg-neutral-900 border-y border-white/5 relative overflow-hidden">
        
        {/* Efeito de Fundo (Cadeado Gigante Transparente) */}
        <div className="absolute top-0 right-0 p-20 opacity-5 pointer-events-none">
            <Lock size={400} />
        </div>

        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
            <h2 className="text-3xl font-bold uppercase tracking-tighter text-white mb-4">
                Consulte seu <span className="text-blue-500">Potencial de Compra</span>
            </h2>
            <p className="text-gray-400 mb-12 max-w-xl mx-auto text-sm">
                Utilize nossa tecnologia para verificar sua pré-aprovação de crédito em segundos. 
                Ambiente 100% seguro e criptografado.
            </p>

            {!result ? (
                // FORMULÁRIO DE BUSCA
                <form onSubmit={handleConsult} className="max-w-md mx-auto relative">
                    <div className="relative group">
                        <Search className="absolute left-4 top-4 text-gray-500 group-focus-within:text-white transition-colors" />
                        <input 
                            value={cpf}
                            maxLength={14}
                            onChange={(e) => setCpf(maskCPF(e.target.value))}
                            placeholder="Digite seu CPF"
                            className="w-full bg-black border border-gray-700 text-white pl-12 pr-32 py-4 rounded-full focus:outline-none focus:border-blue-500 transition-all text-lg tracking-widest placeholder:text-sm placeholder:tracking-normal placeholder:text-gray-600"
                        />
                        <button 
                            disabled={loading}
                            type="submit"
                            className="absolute right-2 top-2 bg-white text-black px-6 py-2 rounded-full font-bold uppercase text-xs tracking-widest hover:bg-gray-200 transition-all h-10 flex items-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" size={16}/> : "Consultar"}
                        </button>
                    </div>
                    <p className="mt-4 text-[10px] text-gray-600 uppercase tracking-wider flex items-center justify-center gap-2">
                        <Lock size={10} /> Seus dados não serão armazenados
                    </p>
                </form>
            ) : (
                // TELA DE SUCESSO (RESULTADO)
                <div className="animate-in zoom-in duration-500 bg-black/50 border border-green-500/30 p-8 rounded-2xl max-w-md mx-auto backdrop-blur-md shadow-2xl shadow-green-900/20">
                    <div className="flex justify-center mb-4">
                        <CheckCircle className="text-green-500 h-16 w-16" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2 uppercase tracking-tight">Crédito Pré-Aprovado!</h3>
                    <p className="text-gray-400 mb-6 text-sm">Encontramos um score excelente para financiamento.</p>
                    
                    <div className="flex justify-center items-end gap-2 mb-8 bg-neutral-900/50 p-4 rounded-lg border border-white/5">
                        <span className="text-6xl font-bold text-white tracking-tighter">{result}</span>
                        <span className="text-xs text-gray-500 mb-2 uppercase tracking-widest font-bold">Pontos Serasa</span>
                    </div>

                    <a 
                        href="#estoque" 
                        onClick={() => setResult(null)} 
                        className="block w-full bg-green-600 hover:bg-green-500 text-white py-4 rounded-xl font-bold uppercase tracking-widest text-xs transition-all shadow-lg hover:shadow-green-900/30"
                    >
                        Ver Carros Disponíveis
                    </a>
                </div>
            )}
        </div>
    </section>
  )
}