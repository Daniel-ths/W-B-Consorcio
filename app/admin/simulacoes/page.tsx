'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useUserRole } from '@/hooks/useUserRole'
import { FileText, Search, Calendar, Car, User, Phone, MapPin, BadgeCheck } from 'lucide-react'
import Link from 'next/link'

export default function SimulacoesPage() {
  const [simulations, setSimulations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Pega o cargo para saber se mostramos a coluna "Vendedor"
  const { role } = useUserRole()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    fetchSimulations()
  }, [])

  const fetchSimulations = async () => {
    try {
      setLoading(true)
      
      // Select com JOIN para pegar o email do vendedor (profiles)
      const { data, error } = await supabase
        .from('simulations')
        .select('*, profiles(email)') 
        .order('created_at', { ascending: false })

      if (error) throw error
      if (data) setSimulations(data)

    } catch (error) {
      console.error('Erro ao buscar simulações:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredSimulations = simulations.filter(sim => 
    sim.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sim.car_model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sim.client_cpf?.includes(searchTerm)
  )

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR')
  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {role === 'admin' ? 'Todas as Simulações' : 'Minhas Simulações'}
          </h1>
          <p className="text-gray-500 mt-1">Gerencie os leads e propostas de financiamento.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por cliente, CPF ou carro..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-emerald-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center text-gray-400">
            <span className="animate-pulse">Carregando...</span>
          </div>
        ) : filteredSimulations.length === 0 ? (
          <div className="p-16 text-center text-gray-500">
            <h3 className="text-lg font-bold">Nenhum registro encontrado</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 font-medium uppercase text-xs">
                <tr>
                  <th className="px-6 py-4">Data</th>
                  {/* Se for Admin, mostra coluna Vendedor */}
                  {role === 'admin' && <th className="px-6 py-4 text-emerald-700">Vendedor</th>}
                  <th className="px-6 py-4">Cliente / Contato</th>
                  <th className="px-6 py-4">Veículo</th>
                  <th className="px-6 py-4">Entrada Sug.</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSimulations.map((sim) => (
                  <tr key={sim.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        {formatDate(sim.created_at)}
                      </div>
                    </td>
                    
                    {/* Coluna Vendedor (Só para Admin) */}
                    {role === 'admin' && (
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                                <BadgeCheck size={16} className="text-emerald-500" />
                                <span className="font-medium text-gray-800">
                                    {sim.profiles?.email?.split('@')[0] || 'Desconhecido'}
                                </span>
                            </div>
                        </td>
                    )}

                    <td className="px-6 py-4 font-medium text-gray-900">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold">{sim.client_name}</span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                             <User size={10}/> CPF: {sim.client_cpf}
                        </span>
                        <span className="text-xs text-blue-600 flex items-center gap-1 bg-blue-50 w-fit px-1 rounded">
                             <Phone size={10}/> {sim.client_phone}
                        </span>
                        {sim.client_address && (
                            <span className="text-[10px] text-gray-400 flex items-center gap-1 truncate max-w-[150px]" title={sim.client_address}>
                                <MapPin size={10}/> {sim.client_address}
                            </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Car size={16} className="text-gray-400" />
                        {sim.car_model}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {formatMoney(sim.car_price)}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-700">
                      {formatMoney(sim.entry_value)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold border ${
                        sim.status === 'aprovado' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                        sim.status === 'pendente' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                        'bg-red-100 text-red-800 border-red-200'
                      }`}>
                        {sim.status === 'aprovado' ? 'Aprovado' : sim.status === 'pendente' ? 'Análise' : 'Recusado'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}