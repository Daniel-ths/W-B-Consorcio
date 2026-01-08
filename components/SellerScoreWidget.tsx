'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Search, CheckCircle, AlertTriangle, Lock, Save, Loader2, Phone, MapPin, User } from 'lucide-react'

interface SellerScoreWidgetProps {
  vehiclePrice: number
  carModel: string
}

export default function SellerScoreWidget({ vehiclePrice, carModel }: SellerScoreWidgetProps) {
  const [isAuthorized, setIsAuthorized] = useState(false) // Mudamos o nome para ficar mais claro
  const [expanded, setExpanded] = useState(false)
  
  // Dados
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientAddress, setClientAddress] = useState('')
  const [cpf, setCpf] = useState('')
  
  // Interface
  const [loadingScore, setLoadingScore] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [result, setResult] = useState<any>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // --- NOVA VERIFICAÇÃO DE SEGURANÇA ---
  useEffect(() => {
    const checkPermission = async () => {
      // 1. Verifica se tem sessão
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setIsAuthorized(false)
        return
      }

      // 2. Verifica se o usuário tem permissão (Cargo) no banco
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      // Só libera se for vendedor ou admin
      if (profile && (profile.role === 'vendedor' || profile.role === 'admin')) {
        setIsAuthorized(true)
      } else {
        setIsAuthorized(false) // Bloqueia clientes comuns ou erros
      }
    }

    checkPermission()
  }, [])

  // Se não for autorizado, o componente "morre" aqui e não renderiza nada
  if (!isAuthorized) return null

  // --- RESTO DO CÓDIGO (Igual ao anterior) ---
  const handlePhoneChange = (e: any) => {
    let v = e.target.value.replace(/\D/g, "")
    v = v.replace(/^(\d\d)(\d)/g, "($1) $2")
    v = v.replace(/(\d{5})(\d)/, "$1-$2")
    if (v.length > 15) v = v.substring(0, 15)
    setClientPhone(v)
  }

  const handleCpfChange = (e: any) => {
    let v = e.target.value.replace(/\D/g, '')
    if (v.length > 11) v = v.slice(0, 11)
    setCpf(v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4"))
  }

  const handleCheckScore = async (e: React.FormEvent) => {
    e.preventDefault()
    if(!clientName || !clientPhone || cpf.length < 14) {
        alert("Preencha Nome, Celular e CPF corretamente.")
        return
    }
    setLoadingScore(true)
    setSavedSuccess(false)
    setTimeout(() => {
      const score = Math.floor(Math.random() * (1000 - 300) + 300)
      const status = score > 700 ? 'aprovado' : score > 500 ? 'pendente' : 'recusado'
      setResult({
        score,
        status,
        mensagem: score > 700 ? 'Crédito Pré-Aprovado' : score > 500 ? 'Em Análise' : 'Recusado',
        entradaSugerida: score > 700 ? vehiclePrice * 0.1 : vehiclePrice * 0.3
      })
      setLoadingScore(false)
    }, 1500)
  }

  const handleSaveSimulation = async () => {
    try {
      setSaving(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase.from('simulations').insert({
        user_id: user.id,
        client_name: clientName,
        client_phone: clientPhone,
        client_address: clientAddress,
        client_cpf: cpf,
        car_model: carModel,
        car_price: vehiclePrice,
        status: result.status,
        entry_value: result.entradaSugerida
      })

      if (error) throw error

      setSavedSuccess(true)
      setTimeout(() => setExpanded(false), 3000)

    } catch (error) {
      console.error('Erro ao salvar:', error)
      alert('Erro ao salvar simulação.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-8 border-t-2 border-emerald-100 pt-6 bg-emerald-50/50 p-6 rounded-xl shadow-inner animate-in fade-in">
      <div 
        className="flex items-center justify-between cursor-pointer group"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 text-emerald-800 font-bold">
          <Lock size={18} className="text-emerald-600" />
          <span>Área do Vendedor</span>
        </div>
        <button className="text-sm text-emerald-600 underline group-hover:text-emerald-800 transition-colors">
          {expanded ? 'Minimizar' : 'Nova Consulta'}
        </button>
      </div>

      {expanded && (
        <div className="mt-6 transition-all animate-in fade-in slide-in-from-top-2">
          {savedSuccess ? (
             <div className="bg-green-100 text-green-800 p-4 rounded-lg flex items-center justify-center gap-2 font-bold">
                <CheckCircle size={20} />
                Lead Salvo com Sucesso!
             </div>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-4">
                Preencha os dados do cliente para verificar crédito e salvar o lead.
              </p>
              <form onSubmit={handleCheckScore} className="space-y-3">
                <div className="relative">
                    <User className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input 
                        type="text" placeholder="Nome Completo *" value={clientName}
                        onChange={e => setClientName(e.target.value)}
                        className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:outline-emerald-500" required
                    />
                </div>
                <div className="relative">
                    <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input 
                        type="text" placeholder="Celular (WhatsApp) *" value={clientPhone}
                        onChange={handlePhoneChange} maxLength={15}
                        className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:outline-emerald-500" required
                    />
                </div>
                <div className="relative">
                    <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input 
                        type="text" placeholder="Endereço (Opcional)" value={clientAddress}
                        onChange={e => setClientAddress(e.target.value)}
                        className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:outline-emerald-500"
                    />
                </div>
                <div className="flex gap-2 pt-2">
                    <input 
                    type="text" placeholder="CPF (000.000.000-00) *" value={cpf}
                    onChange={handleCpfChange}
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-emerald-500 font-mono" required
                    />
                    <button 
                    disabled={loadingScore || cpf.length < 14 || !clientName || !clientPhone}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-bold disabled:opacity-50 shadow-md flex items-center gap-2"
                    >
                    {loadingScore ? <Loader2 className="animate-spin"/> : <Search size={18} />}
                    Consultar
                    </button>
                </div>
              </form>
              {result && (
                <div className="mt-6 bg-white p-5 rounded-lg border border-gray-200 shadow-sm animate-in fade-in">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-500 text-sm font-medium">Resultado Preliminar</span>
                    <span className={`font-bold text-xl ${
                      result.status === 'aprovado' ? 'text-green-600' : 
                      result.status === 'pendente' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {result.score} pts
                    </span>
                  </div>
                  <div className="text-sm space-y-2 mb-6">
                    <div className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                        {result.status === 'aprovado' ? <CheckCircle size={16} className="text-green-500"/> : <AlertTriangle size={16} className="text-yellow-500"/>}
                        <span className="font-bold text-gray-800">{result.mensagem}</span>
                    </div>
                  </div>
                  <button onClick={handleSaveSimulation} disabled={saving} className="w-full bg-gray-900 hover:bg-black text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 shadow-lg">
                    {saving ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                    Salvar Lead e Simulação
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}