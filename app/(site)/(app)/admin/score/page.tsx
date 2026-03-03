'use client'

import { useState } from 'react'
import { Search, CheckCircle, XCircle, AlertTriangle, CreditCard, User, History } from 'lucide-react'

export default function ScorePage() {
  const [cpf, setCpf] = useState('')
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<any>(null)

  // --- SIMULAÇÃO DA API DE SCORE (MOCK) ---
  // Quando contratarmos a API real, trocaremos essa função.
  const consultarScore = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cpf) return

    setLoading(true)
    setResultado(null)

    // Simula um delay de 2 segundos (como se fosse no servidor)
    setTimeout(() => {
      // Gera um score aleatório entre 300 e 1000 para teste
      const scoreAleatorio = Math.floor(Math.random() * (1000 - 300) + 300)
      
      let status = 'baixo'
      if (scoreAleatorio > 700) status = 'alto'
      else if (scoreAleatorio > 500) status = 'medio'

      setResultado({
        nome: 'Cliente Exemplo da Silva', // Viria da API
        cpf: cpf,
        score: scoreAleatorio,
        status: status,
        limiteSugerido: scoreAleatorio > 600 ? 'R$ 85.000,00' : 'R$ 25.000,00',
        mensagem: scoreAleatorio > 600 ? 'Crédito Pré-Aprovado' : 'Necessário Avalista'
      })
      
      setLoading(false)
    }, 2000)
  }

  // Função para formatar CPF enquanto digita
  const handleCpfChange = (e: any) => {
    let value = e.target.value.replace(/\D/g, '')
    if (value.length > 11) value = value.slice(0, 11)
    setCpf(value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4"))
  }

  return (
    <div className="space-y-6">
      
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Consulta de Crédito (Score)</h1>
        <p className="text-gray-500 mt-1">Verifique a viabilidade de financiamento para o cliente antes de fechar o pedido.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUNA DA ESQUERDA: FORMULÁRIO DE CONSULTA */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Search size={20} className="text-emerald-600" />
              Nova Consulta
            </h3>
            
            <form onSubmit={consultarScore} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CPF do Cliente</label>
                <input
                  type="text"
                  value={cpf}
                  onChange={handleCpfChange}
                  placeholder="000.000.000-00"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                />
              </div>
              
              <button
                type="submit"
                disabled={loading || cpf.length < 14}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {loading ? (
                  <span className="animate-pulse">Consultando API...</span>
                ) : (
                  <>Consultar Score</>
                )}
              </button>
            </form>
            
            <div className="mt-4 p-3 bg-blue-50 text-blue-700 text-xs rounded-lg border border-blue-100">
              <p className="font-bold mb-1">Nota:</p>
              <p>Esta consulta gera um log no histórico do cliente e pode ser visualizada pelo gerente.</p>
            </div>
          </div>
        </div>

        {/* COLUNA DA DIREITA: RESULTADO DA CONSULTA */}
        <div className="lg:col-span-2">
          
          {/* ESTADO INICIAL (VAZIO) */}
          {!resultado && !loading && (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-gray-400">
              <Search size={48} className="mb-4 opacity-20" />
              <p>Aguardando consulta...</p>
            </div>
          )}

          {/* ESTADO DE CARREGAMENTO */}
          {loading && (
             <div className="h-full min-h-[300px] flex flex-col items-center justify-center bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
                <p className="text-gray-600 font-medium">Conectando com Bureau de Crédito...</p>
                <p className="text-xs text-gray-400 mt-2">Validando CPF {cpf}</p>
             </div>
          )}

          {/* RESULTADO (QUANDO A API RESPONDE) */}
          {resultado && !loading && (
            <div className="space-y-6">
              
              {/* CARTÃO PRINCIPAL DO RESULTADO */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
                <div className={`p-6 border-b ${
                  resultado.status === 'alto' ? 'bg-emerald-50 border-emerald-100' : 
                  resultado.status === 'medio' ? 'bg-yellow-50 border-yellow-100' : 'bg-red-50 border-red-100'
                }`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">{resultado.nome}</h2>
                      <p className="text-gray-500 text-sm flex items-center gap-2 mt-1">
                        <User size={14} /> CPF: {resultado.cpf}
                      </p>
                    </div>
                    <div className={`px-4 py-2 rounded-lg font-bold text-xl ${
                      resultado.status === 'alto' ? 'bg-emerald-100 text-emerald-700' : 
                      resultado.status === 'medio' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                    }`}>
                      Score: {resultado.score}
                    </div>
                  </div>
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Situação Cadastral</p>
                    <div className="flex items-center gap-2 text-lg font-medium text-gray-900">
                      {resultado.status === 'alto' ? <CheckCircle className="text-emerald-500" /> : <AlertTriangle className="text-yellow-500" />}
                      {resultado.mensagem}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Limite Sugerido (Financiamento)</p>
                    <div className="flex items-center gap-2 text-lg font-bold text-gray-900">
                      <CreditCard className="text-gray-400" />
                      {resultado.limiteSugerido}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 text-right">
                  <button className="text-sm text-emerald-700 font-bold hover:underline">
                    Ver relatório detalhado PDF →
                  </button>
                </div>
              </div>

              {/* Histórico Recente (Visual) */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                 <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <History size={18} /> Histórico Recente deste Cliente
                 </h4>
                 <div className="text-sm text-gray-500 italic">
                    Nenhuma consulta anterior encontrada para este CPF nos últimos 30 dias.
                 </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  )
}