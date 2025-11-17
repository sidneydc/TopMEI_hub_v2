import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { supabase } from '@/lib/supabase'
import { 
  FileText, 
  Check, 
  X, 
  Clock, 
  Search,
  Building2,
  Download,
  Eye,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

interface TipoDocumento {
  id: string
  nome: string
  obrigatorio: boolean
  ativo: boolean
}

interface Documento {
  id: string
  empresa_id: string
  tipo_documento_id: string
  nome_arquivo: string
  caminho_storage: string
  tamanho_bytes: number
  mime_type: string
  data_upload: string
  status: string
  observacao: string | null
  tipo_documento: TipoDocumento
}

interface EmpresaComDocumentos {
  id: string
  razao_social: string
  cnpj: string
  nome_fantasia: string
  status_cadastro: string
  user_id: string
  documentos: Documento[]
  documentosObrigatorios: {
    tipo: TipoDocumento
    documento: Documento | null
  }[]
}

export function ContadorDocumentosPage() {
  const [empresas, setEmpresas] = useState<EmpresaComDocumentos[]>([])
  const [tiposDocumentos, setTiposDocumentos] = useState<TipoDocumento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')
  const [filtroStatusCadastro, setFiltroStatusCadastro] = useState<string>('todos')
  const [filtroEmpresa, setFiltroEmpresa] = useState<string>('')
  const [documentoSelecionado, setDocumentoSelecionado] = useState<Documento | null>(null)
  const [empresaSelecionada, setEmpresaSelecionada] = useState<EmpresaComDocumentos | null>(null)
  const [observacao, setObservacao] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [expandedEmpresas, setExpandedEmpresas] = useState<Set<string>>(new Set())
  const [aprovandoCadastro, setAprovandoCadastro] = useState(false)

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    try {
      setLoading(true)
      
      // 1. Carregar tipos de documentos
      const { data: tiposData, error: tiposError } = await supabase
        .from('tipo_documentos')
        .select('*')
        .eq('ativo', true)
        .order('nome')
      
      if (tiposError) throw tiposError
      const tipos = (tiposData || []) as TipoDocumento[]
      setTiposDocumentos(tipos)
      
      // 2. Carregar empresas
      const { data: empresasData, error: empresasError } = await supabase
        .from('empresa')
        .select('id, razao_social, cnpj, nome_fantasia, status_cadastro, user_id')
        .order('razao_social')
      
      if (empresasError) throw empresasError
      
      // 3. Carregar todos os documentos
      const { data: documentosData, error: documentosError } = await supabase
        .from('documentos')
        .select(`
          *,
          tipo_documento:tipo_documento_id (
            id,
            nome,
            obrigatorio,
            ativo
          )
        `)
        .order('data_upload', { ascending: false })
      
      if (documentosError) throw documentosError
      const docs = (documentosData || []) as Documento[]
      
      // 4. Agrupar documentos por empresa
      const empresasComDocs: EmpresaComDocumentos[] = (empresasData || []).map((empresa: any) => {
        const empresaDocs = docs.filter(doc => doc.empresa_id === empresa.id)
        
        // Criar lista de documentos obrigatórios
        const docsObrigatorios = tipos
          .filter(tipo => tipo.obrigatorio)
          .map(tipo => ({
            tipo,
            documento: empresaDocs.find(doc => doc.tipo_documento_id === tipo.id) || null
          }))
        
        return {
          ...empresa,
          documentos: empresaDocs,
          documentosObrigatorios: docsObrigatorios
        }
      })
      
      setEmpresas(empresasComDocs)
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err)
      setError('Erro ao carregar dados: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const abrirModalAnalise = (documento: Documento, empresa: EmpresaComDocumentos) => {
    setDocumentoSelecionado(documento)
    setEmpresaSelecionada(empresa)
    setObservacao(documento.observacao || '')
    setShowModal(true)
  }

  const handleAprovar = async () => {
    if (!documentoSelecionado || !empresaSelecionada) return

    try {
      // 1. Atualizar status do documento
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: docError } = await (supabase.from('documentos') as any)
        .update({ 
          status: 'aprovado',
          observacao: observacao || null
        })
        .eq('id', documentoSelecionado.id)

      if (docError) throw docError

      // 2. Criar notificação para o cliente
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: notifError } = await (supabase.from('notificacao') as any)
        .insert({
          user_id: empresaSelecionada.user_id,
          titulo: '✅ Documento Aprovado',
          mensagem: `Seu documento "${documentoSelecionado.tipo_documento?.nome}" da empresa ${empresaSelecionada.razao_social} foi aprovado.${observacao ? ` Observação: ${observacao}` : ''}`,
          tipo: 'documento_aprovado',
          lida: false,
          link: '/documentos'
        })

      if (notifError) console.error('Erro ao criar notificação:', notifError)

      setSuccess('✅ Documento aprovado com sucesso!')
      setShowModal(false)
      setDocumentoSelecionado(null)
      setEmpresaSelecionada(null)
      setObservacao('')
      carregarDados()
    } catch (err: any) {
      console.error('Erro ao aprovar documento:', err)
      setError('Erro ao aprovar documento: ' + err.message)
    }
  }

  const handleRejeitar = async () => {
    if (!documentoSelecionado || !empresaSelecionada) return
    
    if (!observacao.trim()) {
      setError('Por favor, informe o motivo da rejeição')
      return
    }

    try {
      // 1. Atualizar status do documento
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: docError } = await (supabase.from('documentos') as any)
        .update({ 
          status: 'rejeitado',
          observacao: observacao
        })
        .eq('id', documentoSelecionado.id)

      if (docError) throw docError

      // 2. Criar notificação para o cliente
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: notifError } = await (supabase.from('notificacao') as any)
        .insert({
          user_id: empresaSelecionada.user_id,
          titulo: '⚠️ Documento Rejeitado',
          mensagem: `Seu documento "${documentoSelecionado.tipo_documento?.nome}" da empresa ${empresaSelecionada.razao_social} foi rejeitado. Motivo: ${observacao}. Por favor, corrija e reenvie o documento.`,
          tipo: 'documento_rejeitado',
          lida: false,
          link: '/documentos'
        })

      if (notifError) console.error('Erro ao criar notificação:', notifError)

      setSuccess('✅ Documento rejeitado')
      setShowModal(false)
      setDocumentoSelecionado(null)
      setEmpresaSelecionada(null)
      setObservacao('')
      carregarDados()
    } catch (err: any) {
      console.error('Erro ao rejeitar documento:', err)
      setError('Erro ao rejeitar documento: ' + err.message)
    }
  }

  const handleAprovarCadastro = async (empresa: EmpresaComDocumentos) => {
    if (!confirm(`Tem certeza que deseja aprovar o cadastro da empresa ${empresa.razao_social}?`)) {
      return
    }

    try {
      setAprovandoCadastro(true)
      
      // 1. Atualizar status_cadastro da empresa para 'ativa'
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: empresaError } = await (supabase.from('empresa') as any)
        .update({ 
          status_cadastro: 'ativa',
          data_aprovacao: new Date().toISOString()
        })
        .eq('id', empresa.id)

      if (empresaError) throw empresaError

      // 2. Criar notificação para o cliente
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: notifError } = await (supabase.from('notificacao') as any)
        .insert({
          user_id: empresa.user_id,
          titulo: '🎉 Cadastro Aprovado!',
          mensagem: `Parabéns! O cadastro da empresa ${empresa.razao_social} foi aprovado e agora está ativa. Você já pode contratar serviços e acessar todas as funcionalidades do sistema.`,
          tipo: 'cadastro_aprovado',
          lida: false,
          link: '/empresa'
        })

      if (notifError) console.error('Erro ao criar notificação:', notifError)

      setSuccess(`✅ Cadastro da empresa ${empresa.razao_social} aprovado com sucesso!`)
      carregarDados()
    } catch (err: any) {
      console.error('Erro ao aprovar cadastro:', err)
      setError('Erro ao aprovar cadastro: ' + err.message)
    } finally {
      setAprovandoCadastro(false)
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

  const podeAprovarCadastro = (empresa: EmpresaComDocumentos): boolean => {
    // Verifica se todos os documentos obrigatórios estão aprovados
    return empresa.documentosObrigatorios.every(
      item => item.documento && item.documento.status === 'aprovado'
    ) && empresa.status_cadastro !== 'ativa'
  }

  const getDownloadUrl = async (caminhoStorage: string) => {
    if (!caminhoStorage) return null

    try {
      const { data, error } = await supabase.storage
        .from('doc_cus')
        .createSignedUrl(caminhoStorage, 3600)

      if (error) {
        console.error('Erro ao gerar URL:', error)
        return null
      }

      return data.signedUrl
    } catch (err) {
      console.error('Erro ao obter URL de download:', err)
      return null
    }
  }

  const handleDownload = async (documento: Documento) => {
    if (!documento.caminho_storage) {
      setError('Documento sem caminho de storage')
      return
    }

    try {
      const url = await getDownloadUrl(documento.caminho_storage)
      
      if (!url) {
        setError('Não foi possível gerar link de download')
        return
      }

      window.open(url, '_blank')
    } catch (err: any) {
      console.error('Erro ao fazer download:', err)
      setError('Erro ao fazer download do documento')
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatCNPJ = (cnpj: string) => {
    if (!cnpj) return ''
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
  }

  const getStatusBadge = (status: string) => {
    const config = {
      'aguardando_aprovacao': { 
        color: 'bg-yellow-100 text-yellow-800', 
        icon: <Clock className="w-4 h-4" />,
        text: 'Aguardando' 
      },
      'aprovado': { 
        color: 'bg-green-100 text-green-800', 
        icon: <Check className="w-4 h-4" />,
        text: 'Aprovado' 
      },
      'rejeitado': { 
        color: 'bg-red-100 text-red-800', 
        icon: <X className="w-4 h-4" />,
        text: 'Rejeitado' 
      }
    }
    
    const badge = config[status as keyof typeof config] || config.aguardando_aprovacao
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.icon}
        {badge.text}
      </span>
    )
  }

  const getStatusCadastro = (status: string) => {
    const config = {
      'pendente': { variant: 'warning' as const, text: 'Pendente' },
      'ativa': { variant: 'success' as const, text: 'Ativa' },
      'rejeitado': { variant: 'error' as const, text: 'Rejeitada' },
      'suspensa': { variant: 'error' as const, text: 'Suspensa' }
    }
    return config[status as keyof typeof config] || { variant: 'default' as const, text: status }
  }

  // Filtrar empresas baseado nos filtros
  const empresasFiltradas = empresas.filter(empresa => {
    // Filtro por nome/CNPJ da empresa
    if (filtroEmpresa && 
        !empresa.razao_social.toLowerCase().includes(filtroEmpresa.toLowerCase()) &&
        !empresa.cnpj.includes(filtroEmpresa)) {
      return false
    }
    
    // Filtro por status dos documentos
    if (filtroStatus !== 'todos') {
      const temDocumentoComStatus = empresa.documentos.some(doc => doc.status === filtroStatus)
      if (!temDocumentoComStatus) return false
    }
    
    // Filtro por status do cadastro da empresa
    if (filtroStatusCadastro !== 'todos' && empresa.status_cadastro !== filtroStatusCadastro) {
      return false
    }
    
    return true
  })

  // Calcular estatísticas
  const todosDocumentos = empresas.flatMap(e => e.documentos)
  const documentosAguardando = todosDocumentos.filter(d => d.status === 'aguardando_aprovacao').length
  
  // Estatísticas de empresas por status
  const empresasStats = {
    total: empresas.length,
    pendente: empresas.filter(e => e.status_cadastro === 'pendente').length,
    aguardando_aprovacao: empresas.filter(e => e.status_cadastro === 'aguardando_aprovacao').length,
    ativa: empresas.filter(e => e.status_cadastro === 'ativa').length,
    rejeitado: empresas.filter(e => e.status_cadastro === 'rejeitado').length,
    suspensa: empresas.filter(e => e.status_cadastro === 'suspensa').length,
    inativa: empresas.filter(e => e.status_cadastro === 'inativa').length
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Documentos</h1>
          <p className="text-gray-600 mt-1">Analise e aprove documentos dos clientes</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card: Documentos Aguardando Aprovação */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Documentos Aguardando</p>
                    <p className="text-3xl font-bold text-yellow-600">{documentosAguardando}</p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-500">Documentos pendentes de análise</p>
            </div>
          </Card>
          
          {/* Card: Empresas por Status */}
          <Card>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-primary-100 rounded-lg">
                  <Building2 className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Empresas Cadastradas</p>
                  <p className="text-3xl font-bold text-gray-900">{empresasStats.total}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-gray-600">Pendente:</span>
                  <span className="font-semibold text-gray-900">{empresasStats.pendente}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                  <span className="text-gray-600">Aguardando:</span>
                  <span className="font-semibold text-yellow-700">{empresasStats.aguardando_aprovacao}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                  <span className="text-gray-600">Ativa:</span>
                  <span className="font-semibold text-green-700">{empresasStats.ativa}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                  <span className="text-gray-600">Rejeitada:</span>
                  <span className="font-semibold text-red-700">{empresasStats.rejeitado}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-orange-50 rounded">
                  <span className="text-gray-600">Suspensa:</span>
                  <span className="font-semibold text-orange-700">{empresasStats.suspensa}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-gray-600">Inativa:</span>
                  <span className="font-semibold text-gray-700">{empresasStats.inativa}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Filtro Status dos Documentos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status dos Documentos
                </label>
                <select
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="todos">Todos</option>
                  <option value="aguardando_aprovacao">Aguardando Aprovação</option>
                  <option value="aprovado">Aprovados</option>
                  <option value="rejeitado">Rejeitados</option>
                </select>
              </div>

              {/* Filtro Status do Cadastro */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status do Cadastro
                </label>
                <select
                  value={filtroStatusCadastro}
                  onChange={(e) => setFiltroStatusCadastro(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="todos">Todos</option>
                  <option value="pendente">Pendente</option>
                  <option value="aguardando_aprovacao">Aguardando Aprovação</option>
                  <option value="ativa">Ativa</option>
                  <option value="rejeitado">Rejeitada</option>
                  <option value="suspensa">Suspensa</option>
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
                    placeholder="Digite o nome da empresa..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Lista de Empresas e Documentos */}
        {loading ? (
          <Card>
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Carregando dados...</p>
            </div>
          </Card>
        ) : empresasFiltradas.length === 0 ? (
          <Card>
            <div className="p-12 text-center">
              <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhuma empresa encontrada</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            {empresasFiltradas.map((empresa) => {
              const isExpanded = expandedEmpresas.has(empresa.id)
              const statusCadastro = getStatusCadastro(empresa.status_cadastro)
              const podeAprovar = podeAprovarCadastro(empresa)
              
              return (
                <Card key={empresa.id}>
                  <div className="p-6">
                    {/* Cabeçalho da Empresa */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 flex-1">
                        <Building2 className="w-6 h-6 text-primary-600 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="text-lg font-bold text-gray-900">
                              {empresa.razao_social}
                            </h3>
                            <Badge variant={statusCadastro.variant}>
                              {statusCadastro.text}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            CNPJ: {formatCNPJ(empresa.cnpj)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {/* Botão Aprovar Cadastro */}
                        {podeAprovar && (
                          <button
                            onClick={() => handleAprovarCadastro(empresa)}
                            disabled={aprovandoCadastro}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Aprovar Cadastro
                          </button>
                        )}
                        
                        {/* Botão Expandir/Recolher */}
                        <button
                          onClick={() => toggleEmpresa(empresa.id)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Resumo dos Documentos Obrigatórios */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="w-5 h-5 text-gray-600" />
                        <h4 className="font-semibold text-gray-900">Documentos Obrigatórios</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {empresa.documentosObrigatorios.map((item) => {
                          const doc = item.documento
                          return (
                            <div key={item.tipo.id} className="flex items-center gap-2">
                              {!doc ? (
                                <>
                                  <X className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm text-gray-500">{item.tipo.nome}</span>
                                  <span className="text-xs text-gray-400">(Não enviado)</span>
                                </>
                              ) : doc.status === 'aprovado' ? (
                                <>
                                  <Check className="w-4 h-4 text-green-600" />
                                  <span className="text-sm text-gray-900">{item.tipo.nome}</span>
                                  <span className="text-xs text-green-600">(Aprovado)</span>
                                </>
                              ) : doc.status === 'rejeitado' ? (
                                <>
                                  <X className="w-4 h-4 text-red-600" />
                                  <span className="text-sm text-gray-900">{item.tipo.nome}</span>
                                  <span className="text-xs text-red-600">(Rejeitado)</span>
                                </>
                              ) : (
                                <>
                                  <Clock className="w-4 h-4 text-yellow-600" />
                                  <span className="text-sm text-gray-900">{item.tipo.nome}</span>
                                  <span className="text-xs text-yellow-600">(Aguardando)</span>
                                </>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Lista Completa de Documentos (Expandível) */}
                    {isExpanded && empresa.documentos.length > 0 && (
                      <div className="space-y-3 pt-4 border-t">
                        <h4 className="font-semibold text-gray-900 mb-3">Todos os Documentos</h4>
                        {empresa.documentos.map((documento) => (
                          <div 
                            key={documento.id} 
                            className="p-4 bg-white border border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <FileText className="w-4 h-4 text-gray-400" />
                                  <span className="font-medium text-gray-900">
                                    {documento.tipo_documento?.nome}
                                  </span>
                                  {documento.tipo_documento?.obrigatorio && (
                                    <span className="text-xs text-red-600">* Obrigatório</span>
                                  )}
                                  {getStatusBadge(documento.status)}
                                </div>
                                <p className="text-sm text-gray-600">
                                  {documento.nome_arquivo} • {formatBytes(documento.tamanho_bytes)} • 
                                  {new Date(documento.data_upload).toLocaleDateString('pt-BR')}
                                </p>
                                {documento.observacao && (
                                  <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
                                    <span className="font-medium">Obs:</span> {documento.observacao}
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex gap-2">
                                {documento.caminho_storage && (
                                  <button
                                    onClick={() => handleDownload(documento)}
                                    className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                    title="Baixar documento"
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                )}
                                
                                {documento.status === 'aguardando_aprovacao' && (
                                  <button
                                    onClick={() => abrirModalAnalise(documento, empresa)}
                                    className="px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-1"
                                  >
                                    <Eye className="w-4 h-4" />
                                    Analisar
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Mensagem quando não há documentos */}
                    {isExpanded && empresa.documentos.length === 0 && (
                      <div className="pt-4 border-t text-center text-gray-500 text-sm">
                        Nenhum documento enviado ainda
                      </div>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal de Análise */}
      {showModal && documentoSelecionado && empresaSelecionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Analisar Documento
              </h2>

              <div className="space-y-4">
                {/* Info da Empresa */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Empresa</p>
                  <p className="font-medium text-gray-900">
                    {empresaSelecionada.razao_social}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    CNPJ: {formatCNPJ(empresaSelecionada.cnpj)}
                  </p>
                </div>

                {/* Info do Documento */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Tipo de Documento</p>
                  <p className="font-medium text-gray-900">
                    {documentoSelecionado.tipo_documento?.nome}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Arquivo: {documentoSelecionado.nome_arquivo}
                  </p>
                </div>

                {/* Observação */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observação (opcional para aprovação, obrigatória para rejeição)
                  </label>
                  <textarea
                    value={observacao}
                    onChange={(e) => setObservacao(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Digite suas observações..."
                  />
                </div>

                {/* Botões */}
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => {
                      setShowModal(false)
                      setDocumentoSelecionado(null)
                      setEmpresaSelecionada(null)
                      setObservacao('')
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  
                  <button
                    onClick={handleRejeitar}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Rejeitar
                  </button>
                  
                  <button
                    onClick={handleAprovar}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Aprovar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

