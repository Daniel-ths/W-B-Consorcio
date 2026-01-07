import { DollarSign, Car, Users, TrendingUp, Calendar } from 'lucide-react'

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      
      {/* Cabeçalho da Página */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Bem-vindo de volta ao painel de controle.</p>
        </div>
        <div className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm">
          <Calendar size={16} />
          Hoje, 07 Jan 2026
        </div>
      </div>

      {/* Grid de KPIs (Indicadores) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard 
          title="Vendas Totais" 
          value="R$ 145.000" 
          sub="+12% esse mês"
          icon={<DollarSign size={24} className="text-emerald-600" />}
          color="emerald"
        />
        <KpiCard 
          title="Carros Ativos" 
          value="34" 
          sub="4 novos hoje"
          icon={<Car size={24} className="text-blue-600" />}
          color="blue"
        />
        <KpiCard 
          title="Vendedores" 
          value="8" 
          sub="2 online agora"
          icon={<Users size={24} className="text-purple-600" />}
          color="purple"
        />
        <KpiCard 
          title="Conversão" 
          value="4.2%" 
          sub="Média da loja"
          icon={<TrendingUp size={24} className="text-orange-600" />}
          color="orange"
        />
      </div>

      {/* Seção de Resumo de Vendedores (Prévia da nova funcionalidade) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Tabela Principal */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">Desempenho da Equipe (Top 3)</h3>
            <span className="text-xs font-medium bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full">Tempo Real</span>
          </div>
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium">
              <tr>
                <th className="px-6 py-4">Vendedor</th>
                <th className="px-6 py-4">Vendas (Mês)</th>
                <th className="px-6 py-4 text-right">Total Gerado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 font-medium text-gray-900">Carlos Silva</td>
                <td className="px-6 py-4">12 Carros</td>
                <td className="px-6 py-4 text-right font-bold text-emerald-600">R$ 450k</td>
              </tr>
              <tr className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 font-medium text-gray-900">Ana Souza</td>
                <td className="px-6 py-4">9 Carros</td>
                <td className="px-6 py-4 text-right font-bold text-emerald-600">R$ 320k</td>
              </tr>
              <tr className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 font-medium text-gray-900">Roberto Jr.</td>
                <td className="px-6 py-4">5 Carros</td>
                <td className="px-6 py-4 text-right font-bold text-emerald-600">R$ 180k</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Card Lateral Menor */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-4">Ações Rápidas</h3>
          <div className="space-y-3">
             <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all flex items-center gap-3 text-sm font-medium text-gray-700">
               <Car size={18} /> Cadastrar Novo Veículo
             </button>
             <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center gap-3 text-sm font-medium text-gray-700">
               <Users size={18} /> Adicionar Vendedor
             </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente simples para os Cards
function KpiCard({ title, value, sub, icon, color }: any) {
  // Mapas de cores para o fundo do ícone
  const bgColors: any = {
    emerald: 'bg-emerald-50',
    blue: 'bg-blue-50',
    purple: 'bg-purple-50',
    orange: 'bg-orange-50'
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        </div>
        <div className={`p-3 rounded-lg ${bgColors[color]}`}>
          {icon}
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-4 font-medium">
        {sub}
      </p>
    </div>
  )
}