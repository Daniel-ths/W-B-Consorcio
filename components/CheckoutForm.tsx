"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { formatCurrency } from "@/lib/utils"
import { Check, CreditCard, Banknote, Users, Loader2, ArrowRight } from "lucide-react"

interface CheckoutProps {
  vehicleModel: string;
  vehiclePrice: number;
  vehicleImage: string;
}

export default function CheckoutForm({ vehicleModel, vehiclePrice, vehicleImage }: CheckoutProps) {
  const [tab, setTab] = useState<'vista' | 'financiamento' | 'consorcio'>('vista')
  
  const [formData, setFormData] = useState({
    cpf: '',
    birthDate: '',
    phone: ''
  })
  
  const [entry, setEntry] = useState(vehiclePrice * 0.3)
  const [installments, setInstallments] = useState(48)
  
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handlePhone = (v: string) => v.replace(/\D/g, '').replace(/^(\d{2})(\d)/g, '($1) $2').replace(/(\d)(\d{4})$/, '$1-$2')
  const handleCPF = (v: string) => v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.from('leads').insert({
        cpf: formData.cpf,
        phone: formData.phone,
        birth_date: formData.birthDate,
        vehicle_model: vehicleModel,
        vehicle_price: vehiclePrice,
        payment_type: tab,
        entry_value: tab === 'financiamento' ? entry : 0,
        installments: tab === 'financiamento' || tab === 'consorcio' ? installments : 0,
        status: 'novo'
    })

    setLoading(false)

    if (error) {
        alert("Erro ao salvar: " + error.message)
    } else {
        setSuccess(true)
        const msg = `Olá! Finalizei uma proposta no site:\nVeículo: *${vehicleModel}*\nPagamento: *${tab.toUpperCase()}*\nCPF: ${formData.cpf}\nAguardo contato.`
        window.open(`https://wa.me/5591999999999?text=${encodeURIComponent(msg)}`, '_blank')
    }
  }

  if (success) {
      return (
          <div className="bg-green-50 p-8 rounded-xl border border-green-200 text-center animate-in zoom-in">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Proposta Enviada!</h3>
              <p className="text-gray-600">Seus dados foram salvos com sucesso. Um vendedor entrará em contato em breve.</p>
          </div>
      )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden font-sans">
      <div className="grid grid-cols-3 border-b border-gray-200 bg-gray-50">
        <button onClick={() => setTab('vista')} className={`py-4 text-xs font-bold uppercase tracking-widest flex flex-col items-center gap-2 transition-all ${tab === 'vista' ? 'bg-white text-yellow-600 border-t-4 border-yellow-500' : 'text-gray-500 hover:text-gray-900'}`}><Banknote size={20}/> À Vista</button>
        <button onClick={() => setTab('financiamento')} className={`py-4 text-xs font-bold uppercase tracking-widest flex flex-col items-center gap-2 transition-all ${tab === 'financiamento' ? 'bg-white text-yellow-600 border-t-4 border-yellow-500' : 'text-gray-500 hover:text-gray-900'}`}><CreditCard size={20}/> Financiamento</button>
        <button onClick={() => setTab('consorcio')} className={`py-4 text-xs font-bold uppercase tracking-widest flex flex-col items-center gap-2 transition-all ${tab === 'consorcio' ? 'bg-white text-yellow-600 border-t-4 border-yellow-500' : 'text-gray-500 hover:text-gray-900'}`}><Users size={20}/> Consórcio</button>
      </div>

      <div className="p-8">
        <div className="mb-8 p-6 bg-gray-50 rounded-lg border border-gray-100">
            {tab === 'vista' && (
                <div className="text-center">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Valor Total</span>
                    <div className="text-4xl font-black text-gray-900 my-2">{formatCurrency(vehiclePrice)}</div>
                    <p className="text-xs text-green-600 font-bold uppercase">Melhor condição garantida</p>
                </div>
            )}
            {tab === 'financiamento' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                        <span className="font-bold text-gray-600">Entrada Sugerida</span>
                        <input type="number" value={entry} onChange={e => setEntry(Number(e.target.value))} className="w-32 bg-white border border-gray-300 rounded p-1 text-right font-bold text-gray-900"/>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="font-bold text-gray-600">Parcelas</span>
                        <select value={installments} onChange={e => setInstallments(Number(e.target.value))} className="bg-white border border-gray-300 rounded p-1 font-bold text-gray-900"><option value={24}>24x</option><option value={36}>36x</option><option value={48}>48x</option><option value={60}>60x</option></select>
                    </div>
                    <div className="pt-4 border-t border-gray-200 text-center">
                         <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Parcela Estimada</span>
                         <div className="text-3xl font-black text-gray-900">{formatCurrency((vehiclePrice - entry) * 1.5 / installments)}</div>
                    </div>
                </div>
            )}
            {tab === 'consorcio' && (
                <div className="text-center">
                    <p className="text-sm text-gray-600 mb-4 leading-relaxed">Planeje a compra do seu <strong>{vehicleModel}</strong> sem juros.</p>
                    <span className="text-xs font-bold text-blue-600 uppercase bg-blue-50 px-3 py-1 rounded-full">Taxa Adm. Reduzida</span>
                </div>
            )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
            <h4 className="text-sm font-bold uppercase tracking-widest text-gray-900 border-b border-gray-100 pb-2 mb-4">Dados do Comprador</h4>
            <div className="grid md:grid-cols-2 gap-4">
                <div className="group"><label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">CPF</label><input required placeholder="000.000.000-00" maxLength={14} value={formData.cpf} onChange={e => setFormData({...formData, cpf: handleCPF(e.target.value)})} className="w-full bg-white border-b-2 border-gray-200 py-2 text-gray-900 font-medium focus:outline-none focus:border-yellow-500"/></div>
                <div className="group"><label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Data de Nascimento</label><input required type="date" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} className="w-full bg-white border-b-2 border-gray-200 py-2 text-gray-900 font-medium focus:outline-none focus:border-yellow-500"/></div>
            </div>
            <div className="group"><label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Telefone / WhatsApp</label><input required placeholder="(91) 99999-9999" maxLength={15} value={formData.phone} onChange={e => setFormData({...formData, phone: handlePhone(e.target.value)})} className="w-full bg-white border-b-2 border-gray-200 py-2 text-gray-900 font-medium focus:outline-none focus:border-yellow-500"/></div>
            <button disabled={loading} type="submit" className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold uppercase tracking-widest text-xs h-14 rounded shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 mt-4">{loading ? <Loader2 className="animate-spin" size={18}/> : <>Enviar Proposta <ArrowRight size={18}/></>}</button>
        </form>
      </div>
    </div>
  )
}