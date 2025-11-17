import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Badge } from '@/components/ui/Badge'
import { EmptyEmpresaState } from '@/components/ui/EmptyEmpresaState'
import { 
  Building2, 
  FileText, 
  Package, 
  CreditCard,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  Clock,
  FileSpreadsheet,
  Receipt,
  AlertCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Empresa } from '@/types/database.types'

interface EmpresaStats {
  empresa: Empresa
  plano: string | null
  planoValor: number | null
  planoStatus: string | null
  planoVigenciaFim: string | null
  statusCadastro: string
  documentosPendentes: number
  documentosAprovados: number
  documentosRejeitados: number
  servicosConcluidos: number
  servicosPendentes: number
  temOrcamento: boolean
  temNFSe: boolean
}

export function ClienteDashboard() {
  const { user } = useAuth()
  const [empresasStats, setEmpresasStats] = useState<EmpresaStats[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedEmpresas, setExpandedEmpresas] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (user?.id) {
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Buscar todas as empresas do usuário
      const { data: empresasData, error: empresasError } = await (supabase
        .from('empresa') as any)
        .select('*')
        .eq('user_id', user?.id)

      if (empresasError) throw empresasError

      if (!empresasData || empresasData.length === 0) {
        setEmpresasStats([])
        return
      }

      // Para cada empresa, buscar estatísticas
      const statsPromises = empresasData.map(async (empresa: Empresa) => {
        // Buscar plano (mais recente) com detalhes
        const { data: planoData } = await (supabase
          .from('empresas_planos') as any)
          .select(`
            valor,
            status,
            vigencia_fim,
            vigencia_inicio,
            planos:plano_id (
              nome
            )
          `)
          .eq('empresa_id', empresa.id)
          .order('vigencia_inicio', { ascending: false })
          .limit(1)
          .single()

        console.log('📊 Plano da empresa', empresa.razao_social, ':', planoData)

        // Buscar documentos
        const { data: documentosData } = await (supabase
          .from('documentos') as any)
          .select('status')
          .eq('empresa_id', empresa.id)

        // Buscar serviços
        const { data: servicosData } = await (supabase
          .from('empresa_servicos') as any)
          .select('concluido')
          .eq('empresa_id', empresa.id)

        // Verificar se tem orçamento configurado
        const { data: orcamentoData } = await (supabase
          .from('orcamento') as any)
          .select('id, logo_url, template')
          .eq('empresa_id', empresa.id)
          .single()

        // Contar documentos por status
        const docsPendentes = documentosData?.filter((d: any) => d.status === 'pendente' || d.status === 'aguardando_aprovacao').length || 0
        const docsAprovados = documentosData?.filter((d: any) => d.status === 'aprovado').length || 0
        const docsRejeitados = documentosData?.filter((d: any) => d.status === 'rejeitado').length || 0

        // Contar serviços
        const servConcluidos = servicosData?.filter((s: any) => s.concluido === true).length || 0
        const servPendentes = servicosData?.filter((s: any) => s.concluido === false).length || 0

        return {
          empresa,
          plano: planoData?.planos?.nome || null,
          planoValor: planoData?.valor || null,
          planoStatus: planoData?.status || null,
          planoVigenciaFim: planoData?.vigencia_fim || null,
          statusCadastro: empresa.status_cadastro || 'pendente',
          documentosPendentes: docsPendentes,
          documentosAprovados: docsAprovados,
          documentosRejeitados: docsRejeitados,
          servicosConcluidos: servConcluidos,
          servicosPendentes: servPendentes,
          temOrcamento: !!orcamentoData?.logo_url || !!orcamentoData?.template,
          temNFSe: false // Por enquanto sempre false, implementar quando tiver lógica de NFSe
        }
      })

      const stats = await Promise.all(statsPromises)
      setEmpresasStats(stats)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleEmpresa = (empresaId: string) => {
    const newExpanded = new Set(expandedEmpresas)
    if (newExpanded.has(empresaId)) {
      newExpanded.delete(empresaId)
    } else {
      newExpanded.add(empresaId)
    }
    setExpandedEmpresas(newExpanded)
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'aprovado':
        return 'success'
      case 'rejeitado':
        return 'error'
      case 'pendente':
        return 'warning'
      default:
        return 'default'
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (empresasStats.length === 0) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Bem-vindo ao seu painel de controle</p>
          </div>
          
          <EmptyEmpresaState />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Visão geral de {empresasStats.length} {empresasStats.length === 1 ? 'empresa' : 'empresas'}
          </p>
        </div>

        {/* Cards de Empresas */}
        <div className="space-y-4">
          {empresasStats.map((stats) => {
            const isExpanded = expandedEmpresas.has(stats.empresa.id)
            
            return (
              <div
                key={stats.empresa.id}
                className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow"
              >
                {/* Header do Card - Clicável */}
                <button
                  onClick={() => toggleEmpresa(stats.empresa.id)}
                  className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary-100 rounded-lg">
                      <Building2 className="w-6 h-6 text-primary-600" />
                    </div>
                    <div className="text-left">
                      <h2 className="text-xl font-semibold text-gray-900">
                        {stats.empresa.nome_fantasia || stats.empresa.razao_social}
                      </h2>
                      <p className="text-sm text-gray-600">
                        {stats.empresa.cnpj ? `CNPJ: ${stats.empresa.cnpj}` : 'CNPJ não informado'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge variant={getStatusColor(stats.statusCadastro)}>
                      {stats.statusCadastro}
                    </Badge>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Conteúdo Expandível - Subcards */}
                {isExpanded && (
                  <div className="p-6 pt-0 border-t border-gray-200 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                      
                      {/* Subcard: Plano */}
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-2 mb-3">
                          <CreditCard className="w-5 h-5 text-primary-600" />
                          <h3 className="font-semibold text-gray-900">Plano</h3>
                        </div>
                        {stats.plano ? (
                          <div>
                            <p className="text-lg font-bold text-gray-900">
                              {stats.plano}
                            </p>
                            {stats.planoValor && (
                              <p className="text-sm text-gray-600 mt-1">
                                R$ {stats.planoValor.toFixed(2).replace('.', ',')}
                              </p>
                            )}
                            {stats.planoVigenciaFim && (
                              <p className="text-xs text-gray-500 mt-1">
                                Válido até: {new Date(stats.planoVigenciaFim).toLocaleDateString('pt-BR')}
                              </p>
                            )}
                            <div className="mt-2">
                              {stats.planoStatus === 'ativo' && (
                                <Badge variant="success">Ativo</Badge>
                              )}
                              {stats.planoStatus === 'aguardando_confirmacao_pagamento' && (
                                <Badge variant="warning">Aguardando Pagamento</Badge>
                              )}
                              {stats.planoStatus === 'suspenso' && (
                                <Badge variant="error">Suspenso</Badge>
                              )}
                              {stats.planoStatus === 'cancelado' && (
                                <Badge variant="error">Cancelado</Badge>
                              )}
                              {!['ativo', 'aguardando_confirmacao_pagamento', 'suspenso', 'cancelado'].includes(stats.planoStatus || '') && (
                                <Badge variant="default">{stats.planoStatus}</Badge>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p className="text-lg font-bold text-gray-500">
                              Nenhum plano
                            </p>
                            <p className="text-xs text-gray-500 mt-1">Configure um plano para sua empresa</p>
                          </div>
                        )}
                      </div>

                      {/* Subcard: Documentos */}
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-2 mb-3">
                          <FileText className="w-5 h-5 text-primary-600" />
                          <h3 className="font-semibold text-gray-900">Documentos</h3>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="w-4 h-4" />
                              Aprovados
                            </span>
                            <span className="font-semibold">{stats.documentosAprovados}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-1 text-orange-600">
                              <Clock className="w-4 h-4" />
                              Pendentes
                            </span>
                            <span className="font-semibold">{stats.documentosPendentes}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-1 text-red-600">
                              <XCircle className="w-4 h-4" />
                              Rejeitados
                            </span>
                            <span className="font-semibold">{stats.documentosRejeitados}</span>
                          </div>
                        </div>
                      </div>

                      {/* Subcard: Serviços */}
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-2 mb-3">
                          <Package className="w-5 h-5 text-primary-600" />
                          <h3 className="font-semibold text-gray-900">Serviços</h3>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="w-4 h-4" />
                              Concluídos
                            </span>
                            <span className="font-semibold">{stats.servicosConcluidos}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-1 text-orange-600">
                              <Clock className="w-4 h-4" />
                              Pendentes
                            </span>
                            <span className="font-semibold">{stats.servicosPendentes}</span>
                          </div>
                        </div>
                      </div>

                      {/* Subcard: Emissor de Orçamento */}
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-2 mb-3">
                          <FileSpreadsheet className="w-5 h-5 text-primary-600" />
                          <h3 className="font-semibold text-gray-900">Emissor de Orçamento</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          {stats.temOrcamento ? (
                            <>
                              <CheckCircle className="w-5 h-5 text-green-600" />
                              <span className="text-sm font-medium text-green-600">Configurado</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-5 h-5 text-orange-600" />
                              <span className="text-sm font-medium text-orange-600">Não configurado</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Subcard: Emissor de NFSe */}
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-2 mb-3">
                          <Receipt className="w-5 h-5 text-primary-600" />
                          <h3 className="font-semibold text-gray-900">Emissor de NFSe</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          {stats.temNFSe ? (
                            <>
                              <CheckCircle className="w-5 h-5 text-green-600" />
                              <span className="text-sm font-medium text-green-600">Configurado</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-5 h-5 text-orange-600" />
                              <span className="text-sm font-medium text-orange-600">Não configurado</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Subcard: Status do Cadastro */}
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-2 mb-3">
                          <Building2 className="w-5 h-5 text-primary-600" />
                          <h3 className="font-semibold text-gray-900">Status do Cadastro</h3>
                        </div>
                        <div className="text-base px-3 py-1">
                          <Badge variant={getStatusColor(stats.statusCadastro)}>
                            {stats.statusCadastro}
                          </Badge>
                        </div>
                        {stats.statusCadastro === 'pendente' && (
                          <p className="text-xs text-gray-500 mt-2">Aguardando aprovação do contador</p>
                        )}
                        {stats.statusCadastro === 'rejeitado' && stats.empresa.motivo_rejeicao && (
                          <p className="text-xs text-red-600 mt-2">{stats.empresa.motivo_rejeicao}</p>
                        )}
                      </div>

                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </DashboardLayout>
  )
}
