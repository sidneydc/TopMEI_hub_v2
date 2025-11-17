import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Card } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { EmptyEmpresaState } from '@/components/ui/EmptyEmpresaState'
import { ShoppingCart, Building2, CheckCircle, XCircle, Clock, DollarSign } from 'lucide-react'

interface Empresa {
  id: string
  razao_social: string
  nome_fantasia: string
  cnpj: string
  status_cadastro: string
}

interface Servico {
  id: string
  nome: string
  descricao: string | null
  valor: number | null
  ativo: boolean
}

interface ServicoContratado {
  id: string
  empresa_id: string
  servicos_id: string
  data_contratacao: string
  valor: number
  status: string
  concluido: boolean
}

export function ContratarServicosPage() {
  const { user } = useAuth()
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [empresasAtivas, setEmpresasAtivas] = useState<Empresa[]>([])
  const [servicos, setServicos] = useState<Servico[]>([])
  const [servicosContratados, setServicosContratados] = useState<ServicoContratado[]>([])
  const [empresaSelecionada, setEmpresaSelecionada] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [contratando, setContratando] = useState(false)
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null)

  useEffect(() => {
    if (user?.id) {
      loadData()
    }
  }, [user?.id])

  useEffect(() => {
    if (empresaSelecionada) {
      loadServicosContratados()
    }
  }, [empresaSelecionada])

  async function loadData() {
    try {
      setLoading(true)
      console.log('🔄 Carregando dados...')

      // Verificar se user.id existe
      if (!user?.id) {
        console.log('⚠️ user.id não definido')
        setLoading(false)
        return
      }

      // Carregar empresas do usuário
      const { data: empresasData, error: empresasError } = await supabase
        .from('empresa')
        .select('id, razao_social, nome_fantasia, cnpj, status_cadastro')
        .eq('user_id', user.id)
        .order('razao_social', { ascending: true })

      if (empresasError) throw empresasError

      setEmpresas(empresasData || [])
      
      // Separar empresas ativas
      const ativas = (empresasData || []).filter((e: Empresa) => e.status_cadastro === 'ativa')
      setEmpresasAtivas(ativas)
      
      console.log('✅ Empresas carregadas:', empresasData?.length || 0)
      console.log('✅ Empresas ativas:', ativas.length)

      // Carregar serviços ativos
      const { data: servicosData, error: servicosError } = await supabase
        .from('servicos')
        .select('*')
        .eq('ativo', true)
        .order('nome', { ascending: true })

      if (servicosError) throw servicosError

      setServicos(servicosData || [])
      console.log('✅ Serviços carregados:', servicosData?.length || 0)

    } catch (error: any) {
      console.error('❌ Erro ao carregar dados:', error)
      setAlert({
        type: 'error',
        message: `Erro ao carregar dados: ${error.message}`
      })
    } finally {
      setLoading(false)
    }
  }

  async function loadServicosContratados() {
    try {
      const { data, error } = await supabase
        .from('empresa_servicos')
        .select('*')
        .eq('empresa_id', empresaSelecionada)

      if (error) throw error

      setServicosContratados(data || [])
      console.log('✅ Serviços contratados:', data?.length || 0)
    } catch (error: any) {
      console.error('❌ Erro ao carregar serviços contratados:', error)
    }
  }

  async function handleContratarServico(servico: Servico) {
    if (!empresaSelecionada) {
      setAlert({
        type: 'info',
        message: 'Por favor, selecione uma empresa primeiro.'
      })
      return
    }

    const empresaAtual = empresas.find(e => e.id === empresaSelecionada)
    
    if (!empresaAtual) return

    if (empresaAtual.status_cadastro !== 'ativa') {
      setAlert({
        type: 'error',
        message: `Não é possível contratar serviços. A empresa está com status "${empresaAtual.status_cadastro}". Apenas empresas ativas podem contratar serviços.`
      })
      return
    }

    // Verificar se já foi contratado
    const jaContratado = servicosContratados.some(
      sc => sc.servicos_id === servico.id && sc.status === 'ativo'
    )

    if (jaContratado) {
      setAlert({
        type: 'info',
        message: 'Este serviço já foi contratado para esta empresa.'
      })
      return
    }

    try {
      setContratando(true)
      console.log('💾 Contratando serviço:', servico.nome)

      const { error } = await supabase
        .from('empresa_servicos')
        .insert({
          empresa_id: empresaSelecionada,
          servicos_id: servico.id,
          valor: servico.valor,
          status: 'ativo',
          concluido: false
        } as never)

      if (error) throw error

      setAlert({
        type: 'success',
        message: `Serviço "${servico.nome}" contratado com sucesso!`
      })

      loadServicosContratados()
    } catch (error: any) {
      console.error('❌ Erro ao contratar serviço:', error)
      setAlert({
        type: 'error',
        message: `Erro ao contratar serviço: ${error.message}`
      })
    } finally {
      setContratando(false)
    }
  }

  function isServicoContratado(servicoId: string): boolean {
    return servicosContratados.some(
      sc => sc.servicos_id === servicoId && sc.status === 'ativo'
    )
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  const empresaAtual = empresas.find(e => e.id === empresaSelecionada)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-primary-600" />
            Contratar Serviços
          </h1>
          <p className="text-gray-600 mt-1">
            Contrate serviços avulsos para suas empresas
          </p>
        </div>

        {/* Alert */}
        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        {/* Seleção de Empresa */}
        <Card>
          <div className="p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Building2 className="w-4 h-4 inline mr-2" />
              Selecione a Empresa
            </label>
            
            {/* Caso 1: Nenhuma empresa cadastrada */}
            {empresas.length === 0 ? (
              <EmptyEmpresaState />
            ) : 
            /* Caso 2: Tem empresas mas nenhuma ativa */
            empresasAtivas.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <Clock className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Aguardando Aprovação do Cadastro
                </h2>
                <p className="text-gray-600 mb-4">
                  Você tem {empresas.length} {empresas.length === 1 ? 'empresa cadastrada' : 'empresas cadastradas'}, 
                  mas {empresas.length === 1 ? 'ela ainda não está ativa' : 'nenhuma delas está ativa'}.
                </p>
                
                {/* Mostrar status de cada empresa */}
                <div className="mt-4 space-y-2">
                  {empresas.map((empresa) => (
                    <div key={empresa.id} className="bg-gray-50 rounded-lg p-3 text-left">
                      <p className="font-medium text-gray-900">{empresa.razao_social}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={
                          empresa.status_cadastro === 'pendente' ? 'warning' :
                          empresa.status_cadastro === 'rejeitado' ? 'error' :
                          'default'
                        }>
                          {empresa.status_cadastro}
                        </Badge>
                        {empresa.status_cadastro === 'pendente' && (
                          <span className="text-xs text-gray-600">
                            Aguardando aprovação do contador
                          </span>
                        )}
                        {empresa.status_cadastro === 'rejeitado' && (
                          <span className="text-xs text-red-600">
                            Verifique as pendências no cadastro da empresa
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <a
                  href="/empresa"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors mt-4"
                >
                  <Building2 className="w-5 h-5" />
                  Ver Minhas Empresas
                </a>
              </div>
            ) : (
              /* Caso 3: Tem empresas ativas - mostrar select */
              <>
                <select
                  value={empresaSelecionada}
                  onChange={(e) => setEmpresaSelecionada(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Escolha uma empresa...</option>
                  {empresasAtivas.map((empresa) => (
                    <option key={empresa.id} value={empresa.id}>
                      {empresa.razao_social} - {empresa.cnpj}
                    </option>
                  ))}
                </select>

                {empresaAtual && (
                  <div className="mt-4">
                    <Badge 
                      variant={
                        empresaAtual.status_cadastro === 'ativa' ? 'success' : 
                        empresaAtual.status_cadastro === 'pendente' ? 'warning' : 
                        'error'
                      }
                    >
                      Status: {empresaAtual.status_cadastro}
                    </Badge>
                    
                    {empresaAtual.status_cadastro !== 'ativa' && (
                      <p className="text-sm text-yellow-600 mt-2">
                        ⚠️ Apenas empresas com status "ativa" podem contratar serviços.
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </Card>

        {/* Lista de Serviços */}
        {empresaSelecionada && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Serviços Disponíveis
            </h2>
            
            {servicos.length === 0 ? (
              <Card>
                <div className="p-6 text-center text-gray-500">
                  Nenhum serviço disponível no momento.
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {servicos.map((servico) => {
                  const contratado = isServicoContratado(servico.id)
                  
                  return (
                    <Card key={servico.id}>
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-semibold text-lg text-gray-900">
                            {servico.nome}
                          </h3>
                          {contratado && (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          )}
                        </div>

                        <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                          {servico.descricao || 'Sem descrição'}
                        </p>

                        <div className="flex items-center justify-between mb-4">
                          <span className="text-2xl font-bold text-primary-600 flex items-center gap-1">
                            <DollarSign className="w-5 h-5" />
                            R$ {servico.valor ? servico.valor.toFixed(2) : '0.00'}
                          </span>
                        </div>

                        <button
                          onClick={() => handleContratarServico(servico)}
                          disabled={contratando || contratado || empresaAtual?.status_cadastro !== 'ativa'}
                          className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                            contratado
                              ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                              : empresaAtual?.status_cadastro !== 'ativa'
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-primary-600 text-white hover:bg-primary-700'
                          }`}
                        >
                          {contratado ? 'Já Contratado' : 'Contratar Serviço'}
                        </button>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Serviços Contratados */}
        {empresaSelecionada && servicosContratados.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Serviços Contratados para esta Empresa
            </h2>
            
            <Card>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Serviço
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {servicosContratados.map((sc) => {
                      const servico = servicos.find(s => s.id === sc.servicos_id)
                      
                      return (
                        <tr key={sc.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {servico?.nome || 'Serviço não encontrado'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(sc.data_contratacao).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                            R$ {sc.valor.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge 
                              variant={
                                sc.concluido ? 'success' : 
                                sc.status === 'ativo' ? 'info' : 
                                'error'
                              }
                            >
                              {sc.concluido ? (
                                <span className="flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  Concluído
                                </span>
                              ) : sc.status === 'ativo' ? (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  Em andamento
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <XCircle className="w-3 h-3" />
                                  {sc.status}
                                </span>
                              )}
                            </Badge>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
