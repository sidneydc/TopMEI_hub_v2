import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { supabase } from '@/lib/supabase'
import { 
  FileText, 
  Clock,
  Search,
  Building2,
  CheckCircle,
  PlayCircle,
  Calendar,
  DollarSign,
  Filter
} from 'lucide-react'

interface Empresa {
  id: string
  razao_social: string
  cnpj: string
  nome_fantasia: string
}

interface Servico {
  id: string
  nome: string
  descricao: string
  valor: number
  tipo?: string
  prazo_dias?: number
}

interface EmpresaServico {
  id: string
  empresa_id: string
  servicos_id: string
  data_contratacao: string
  valor: number
  status: string
  observacao: string | null
  concluido: boolean
  data_conclusao: string | null
  created_at: string
  updated_at: string
  empresa: Empresa
  servico: Servico
}

interface AgingData {
  dias_0: number
  dias_1: number
  dias_2: number
  dias_3: number
  dias_4: number
  dias_5: number
  dias_6: number
  dias_7: number
  dias_8: number
  dias_9: number
  dias_acima_9: number
}

export function ServicosExecutarPage() {
  const [servicosContratados, setServicosContratados] = useState<EmpresaServico[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Filtros
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')
  const [filtroEmpresa, setFiltroEmpresa] = useState<string>('')
  const [filtroServico, setFiltroServico] = useState<string>('')
  const [filtroDias, setFiltroDias] = useState<string>('todos')

  useEffect(() => {
    carregarServicos()
  }, [])

  const carregarServicos = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('empresa_servicos')
        .select(`
          *,
          empresa:empresa_id (
            id,
            razao_social,
            cnpj,
            nome_fantasia
          ),
          servico:servicos_id (
            id,
            nome,
            descricao,
            valor
          )
        `)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setServicosContratados((data || []) as EmpresaServico[])
    } catch (err: any) {
      console.error('Erro ao carregar serviços:', err)
      setError('Erro ao carregar serviços: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const calcularDiasDesdeContratacao = (created_at: string): number => {
    const dataContratacao = new Date(created_at)
    const hoje = new Date()
    const diffTime = Math.abs(hoje.getTime() - dataContratacao.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const calcularAging = (): AgingData => {
    // Considerar apenas status 'pendente' e 'em_andamento'
    const servicosAging = servicosContratados.filter(
      s => s.status === 'pendente' || s.status === 'em_andamento'
    )

    const aging: AgingData = {
      dias_0: 0,
      dias_1: 0,
      dias_2: 0,
      dias_3: 0,
      dias_4: 0,
      dias_5: 0,
      dias_6: 0,
      dias_7: 0,
      dias_8: 0,
      dias_9: 0,
      dias_acima_9: 0
    }

    servicosAging.forEach(servico => {
      const dias = calcularDiasDesdeContratacao(servico.created_at)
      
      if (dias === 0) aging.dias_0++
      else if (dias === 1) aging.dias_1++
      else if (dias === 2) aging.dias_2++
      else if (dias === 3) aging.dias_3++
      else if (dias === 4) aging.dias_4++
      else if (dias === 5) aging.dias_5++
      else if (dias === 6) aging.dias_6++
      else if (dias === 7) aging.dias_7++
      else if (dias === 8) aging.dias_8++
      else if (dias === 9) aging.dias_9++
      else aging.dias_acima_9++
    })

    return aging
  }

  const getStatusBadge = (status: string) => {
    const config = {
      'pendente': { variant: 'warning' as const, text: 'Pendente' },
      'em_andamento': { variant: 'info' as const, text: 'Em Andamento' },
      'concluido': { variant: 'success' as const, text: 'Concluído' },
      'cancelado': { variant: 'error' as const, text: 'Cancelado' }
    }
    return config[status as keyof typeof config] || { variant: 'default' as const, text: status }
  }

  const formatCNPJ = (cnpj: string) => {
    if (!cnpj) return ''
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  // Filtrar serviços
  const servicosFiltrados = servicosContratados.filter(servico => {
    // Filtro por status
    if (filtroStatus !== 'todos' && servico.status !== filtroStatus) {
      return false
    }

    // Filtro por empresa
    if (filtroEmpresa && 
        !servico.empresa?.razao_social?.toLowerCase().includes(filtroEmpresa.toLowerCase()) &&
        !servico.empresa?.cnpj?.includes(filtroEmpresa)) {
      return false
    }

    // Filtro por serviço
    if (filtroServico && 
        !servico.servico?.nome?.toLowerCase().includes(filtroServico.toLowerCase())) {
      return false
    }

    // Filtro por dias desde contratação
    if (filtroDias !== 'todos') {
      const dias = calcularDiasDesdeContratacao(servico.created_at)
      
      if (filtroDias === '0' && dias !== 0) return false
      if (filtroDias === '1' && dias !== 1) return false
      if (filtroDias === '2' && dias !== 2) return false
      if (filtroDias === '3' && dias !== 3) return false
      if (filtroDias === '4' && dias !== 4) return false
      if (filtroDias === '5' && dias !== 5) return false
      if (filtroDias === '6' && dias !== 6) return false
      if (filtroDias === '7' && dias !== 7) return false
      if (filtroDias === '8' && dias !== 8) return false
      if (filtroDias === '9' && dias !== 9) return false
      if (filtroDias === 'acima_9' && dias <= 9) return false
    }

    return true
  })

  // Estatísticas
  const aging = calcularAging()
  const totalPendentes = servicosContratados.filter(s => s.status === 'pendente').length
  const totalEmAndamento = servicosContratados.filter(s => s.status === 'em_andamento').length
  const totalConcluidos = servicosContratados.filter(s => s.status === 'concluido').length

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Serviços a Executar</h1>
          <p className="text-gray-600 mt-1">Gerencie os serviços contratados pelos clientes</p>
        </div>

        {/* Alerts */}
        {error && (
          <Alert type="error" onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert type="success" onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pendentes</p>
                  <p className="text-3xl font-bold text-yellow-600">{totalPendentes}</p>
                </div>
              </div>
              <p className="text-sm text-gray-500">Serviços aguardando início</p>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <PlayCircle className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Em Andamento</p>
                  <p className="text-3xl font-bold text-blue-600">{totalEmAndamento}</p>
                </div>
              </div>
              <p className="text-sm text-gray-500">Serviços sendo executados</p>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Concluídos</p>
                  <p className="text-3xl font-bold text-green-600">{totalConcluidos}</p>
                </div>
              </div>
              <p className="text-sm text-gray-500">Total de serviços finalizados</p>
            </div>
          </Card>
        </div>

        {/* Card Aging List */}
        <Card>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-6 h-6 text-primary-600" />
              <h3 className="text-lg font-bold text-gray-900">
                Aging List - Serviços Pendentes e Em Andamento
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-11 gap-2">
              <div className="flex flex-col items-center p-3 bg-green-50 rounded-lg border border-green-200">
                <span className="text-2xl font-bold text-green-700">{aging.dias_0}</span>
                <span className="text-xs text-gray-600 mt-1">Hoje</span>
              </div>
              <div className="flex flex-col items-center p-3 bg-green-50 rounded-lg border border-green-200">
                <span className="text-2xl font-bold text-green-700">{aging.dias_1}</span>
                <span className="text-xs text-gray-600 mt-1">1 dia</span>
              </div>
              <div className="flex flex-col items-center p-3 bg-green-50 rounded-lg border border-green-200">
                <span className="text-2xl font-bold text-green-700">{aging.dias_2}</span>
                <span className="text-xs text-gray-600 mt-1">2 dias</span>
              </div>
              <div className="flex flex-col items-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <span className="text-2xl font-bold text-yellow-700">{aging.dias_3}</span>
                <span className="text-xs text-gray-600 mt-1">3 dias</span>
              </div>
              <div className="flex flex-col items-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <span className="text-2xl font-bold text-yellow-700">{aging.dias_4}</span>
                <span className="text-xs text-gray-600 mt-1">4 dias</span>
              </div>
              <div className="flex flex-col items-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <span className="text-2xl font-bold text-yellow-700">{aging.dias_5}</span>
                <span className="text-xs text-gray-600 mt-1">5 dias</span>
              </div>
              <div className="flex flex-col items-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                <span className="text-2xl font-bold text-orange-700">{aging.dias_6}</span>
                <span className="text-xs text-gray-600 mt-1">6 dias</span>
              </div>
              <div className="flex flex-col items-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                <span className="text-2xl font-bold text-orange-700">{aging.dias_7}</span>
                <span className="text-xs text-gray-600 mt-1">7 dias</span>
              </div>
              <div className="flex flex-col items-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                <span className="text-2xl font-bold text-orange-700">{aging.dias_8}</span>
                <span className="text-xs text-gray-600 mt-1">8 dias</span>
              </div>
              <div className="flex flex-col items-center p-3 bg-red-50 rounded-lg border border-red-200">
                <span className="text-2xl font-bold text-red-700">{aging.dias_9}</span>
                <span className="text-xs text-gray-600 mt-1">9 dias</span>
              </div>
              <div className="flex flex-col items-center p-3 bg-red-100 rounded-lg border border-red-300">
                <span className="text-2xl font-bold text-red-800">{aging.dias_acima_9}</span>
                <span className="text-xs text-gray-600 mt-1">&gt;9 dias</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              * Apenas serviços com status Pendente e Em Andamento
            </p>
          </div>
        </Card>

        {/* Filtros */}
        <Card>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Filtros</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Filtro Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="todos">Todos</option>
                  <option value="pendente">Pendente</option>
                  <option value="em_andamento">Em Andamento</option>
                  <option value="concluido">Concluído</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>

              {/* Filtro Dias */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dias desde Contratação
                </label>
                <select
                  value={filtroDias}
                  onChange={(e) => setFiltroDias(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="todos">Todos</option>
                  <option value="0">Hoje (0 dias)</option>
                  <option value="1">1 dia</option>
                  <option value="2">2 dias</option>
                  <option value="3">3 dias</option>
                  <option value="4">4 dias</option>
                  <option value="5">5 dias</option>
                  <option value="6">6 dias</option>
                  <option value="7">7 dias</option>
                  <option value="8">8 dias</option>
                  <option value="9">9 dias</option>
                  <option value="acima_9">Acima de 9 dias</option>
                </select>
              </div>

              {/* Filtro Empresa */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar Empresa
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={filtroEmpresa}
                    onChange={(e) => setFiltroEmpresa(e.target.value)}
                    placeholder="Nome ou CNPJ..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Filtro Serviço */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar Serviço
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={filtroServico}
                    onChange={(e) => setFiltroServico(e.target.value)}
                    placeholder="Nome do serviço..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Lista de Serviços */}
        {loading ? (
          <Card>
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Carregando serviços...</p>
            </div>
          </Card>
        ) : servicosFiltrados.length === 0 ? (
          <Card>
            <div className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum serviço encontrado</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {servicosFiltrados.map((servico) => {
              const statusBadge = getStatusBadge(servico.status)
              const diasDesdeContratacao = calcularDiasDesdeContratacao(servico.created_at)
              
              return (
                <Card key={servico.id}>
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        {/* Empresa */}
                        <div className="flex items-center gap-3 mb-3">
                          <Building2 className="w-5 h-5 text-gray-400" />
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {servico.empresa?.razao_social}
                            </h3>
                            <p className="text-sm text-gray-500">
                              CNPJ: {formatCNPJ(servico.empresa?.cnpj || '')}
                            </p>
                          </div>
                        </div>

                        {/* Serviço */}
                        <div className="flex items-start gap-3 mb-3">
                          <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {servico.servico?.nome}
                            </p>
                            {servico.servico?.descricao && (
                              <p className="text-sm text-gray-600 mt-1">
                                {servico.servico.descricao}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Informações */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <div>
                              <span className="text-gray-600">Contratado:</span>
                              <p className="font-medium">{formatDate(servico.data_contratacao)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <div>
                              <span className="text-gray-600">Dias:</span>
                              <p className="font-medium">{diasDesdeContratacao}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-gray-400" />
                            <div>
                              <span className="text-gray-600">Valor:</span>
                              <p className="font-medium">{formatCurrency(servico.valor)}</p>
                            </div>
                          </div>
                          {servico.servico?.prazo_dias && (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <div>
                                <span className="text-gray-600">Prazo:</span>
                                <p className="font-medium">{servico.servico.prazo_dias} dias</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Observação */}
                        {servico.observacao && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Obs:</span> {servico.observacao}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Status e Ações */}
                      <div className="flex flex-col items-end gap-3">
                        <Badge variant={statusBadge.variant}>
                          {statusBadge.text}
                        </Badge>
                        
                        {servico.data_conclusao && (
                          <div className="text-sm text-gray-600 text-right">
                            <p className="text-xs">Concluído em:</p>
                            <p className="font-medium">{formatDate(servico.data_conclusao)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
