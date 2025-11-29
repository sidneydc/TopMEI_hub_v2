import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { EmptyEmpresaState } from '@/components/ui/EmptyEmpresaState'
import { Badge } from '@/components/ui/Badge'
import { useEmpresasUsuario } from '@/hooks/useEmpresa'
import { supabase } from '@/lib/supabase'
import { 
  Upload, 
  FileText, 
  Check, 
  Clock, 
  AlertCircle, 
  Trash2
} from 'lucide-react'

interface TipoDocumento {
  id: string
  nome: string
  descricao: string
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
  tipo_documento?: TipoDocumento
}

export function DocumentosPage() {
  const { user } = useAuth()
  const { empresas, loading: loadingEmpresas } = useEmpresasUsuario(user?.id)
  
  const [empresaSelecionada, setEmpresaSelecionada] = useState<string>('')
  const [tiposDocumentos, setTiposDocumentos] = useState<TipoDocumento[]>([])
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Estados para "Outros Documentos"
  const [outroDocumentoNome, setOutroDocumentoNome] = useState('')
  const [outroDocumentoFile, setOutroDocumentoFile] = useState<File | null>(null)
  const [uploadingOutro, setUploadingOutro] = useState(false)

  // Carregar tipos de documentos
  useEffect(() => {
    carregarTiposDocumentos()
  }, [])

  // Carregar documentos quando empresa for selecionada
  useEffect(() => {
    if (empresaSelecionada) {
      carregarDocumentos()
    }
  }, [empresaSelecionada])

  const carregarTiposDocumentos = async () => {
    try {
      const { data, error } = await supabase
        .from('tipo_documentos')
        .select('*')
        .eq('ativo', true)
        .order('obrigatorio', { ascending: false })
        .order('nome', { ascending: true })

      if (error) {
        console.error('Erro ao carregar tipos de documentos:', error)
        throw error
      }
      
      console.log('Tipos de documentos carregados:', data)
      setTiposDocumentos(data || [])
      
      if (!data || data.length === 0) {
        console.warn('Nenhum tipo de documento encontrado. Execute o script tipos_documentos_exemplo.sql')
      }
    } catch (err: any) {
      console.error('Erro ao carregar tipos de documentos:', err)
      setError(`Erro ao carregar tipos de documentos: ${err.message || 'Erro desconhecido'}`)
    }
  }

  const carregarDocumentos = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('documentos')
        .select(`
          *,
          tipo_documento:tipo_documento_id (
            id,
            nome,
            descricao,
            obrigatorio
          )
        `)
        .eq('empresa_id', empresaSelecionada)
        .order('data_upload', { ascending: false })

      if (error) {
        console.error('Erro do Supabase:', error)
        throw error
      }
      
      console.log('Documentos carregados:', data)
      setDocumentos(data || [])
    } catch (err: any) {
      console.error('Erro ao carregar documentos:', err)
      setError(`Erro ao carregar documentos: ${err.message || 'Erro desconhecido'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (tipoDocumentoId: string, file: File) => {
    if (!empresaSelecionada) {
      setError('Selecione uma empresa primeiro')
      return
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      setError('Arquivo muito grande. Máximo 10MB')
      return
    }

    try {
      setUploading(true)
      setError('')
      setSuccess('')

      // 1. Primeiro criar o registro no banco para obter o ID
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: documentoData, error: dbError } = await (supabase.from('documentos') as any)
        .insert({
          empresa_id: empresaSelecionada,
          tipo_documento_id: tipoDocumentoId,
          nome_arquivo: file.name,
          caminho_storage: '', // Será atualizado após upload
          tamanho_bytes: file.size,
          mime_type: file.type,
          status: 'aguardando_aprovacao'
        })
        .select()
        .single()

      if (dbError) throw dbError

      const documentoId = documentoData.id

      // 2. Definir caminho do arquivo no storage
      // Formato: {empresa_id}/{documento_id}.{extensao}
      const fileExt = file.name.split('.').pop()
      const storagePath = `${empresaSelecionada}/${documentoId}.${fileExt}`

      // 3. Upload para Supabase Storage (bucket: doc_cus)
      // A estrutura de pastas será criada automaticamente pelo Supabase
      const { error: uploadError } = await supabase.storage
        .from('doc_cus')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        // Se falhar o upload, remover o registro do banco
        await supabase.from('documentos').delete().eq('id', documentoId)
        throw uploadError
      }

      // 4. Atualizar o caminho no banco de dados
      console.log('=== INICIANDO UPDATE ===')
      console.log('Documento ID:', documentoId)
      console.log('Storage Path:', storagePath)
      console.log('Empresa ID:', empresaSelecionada)
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: updateData, error: updateError } = await (supabase.from('documentos') as any)
        .update({ caminho_storage: storagePath })
        .eq('id', documentoId)
        .select()
        .single()

      console.log('=== RESULTADO UPDATE ===')
      console.log('Data:', updateData)
      console.log('Error:', updateError)

      if (updateError) {
        console.error('❌ Erro ao atualizar caminho:', updateError)
        // Não vamos lançar erro aqui, apenas avisar
        setError(`Documento enviado mas erro ao atualizar caminho: ${updateError.message}`)
      } else {
        console.log('✅ Caminho atualizado com sucesso!')
      }

      setSuccess('✅ Documento enviado com sucesso!')
      carregarDocumentos()
    } catch (err: any) {
      console.error('Erro ao fazer upload:', err)
      setError('Erro ao enviar documento: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (documentoId: string, caminhoStorage: string) => {
    if (!confirm('Tem certeza que deseja excluir este documento?')) return

    try {
      // Deletar do storage (bucket: doc_cus)
      const { error: storageError } = await supabase.storage
        .from('doc_cus')
        .remove([caminhoStorage])

      if (storageError) console.error('Erro ao deletar do storage:', storageError)

      // Deletar do banco
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: dbError } = await (supabase.from('documentos') as any)
        .delete()
        .eq('id', documentoId)

      if (dbError) throw dbError

      setSuccess('✅ Documento excluído com sucesso!')
      carregarDocumentos()
    } catch (err: any) {
      console.error('Erro ao excluir documento:', err)
      setError('Erro ao excluir documento')
    }
  }

  const handleUploadOutroDocumento = async () => {
    if (!empresaSelecionada) {
      setError('Selecione uma empresa primeiro')
      return
    }

    if (!outroDocumentoNome.trim()) {
      setError('Informe o nome do documento')
      return
    }

    if (!outroDocumentoFile) {
      setError('Selecione um arquivo')
      return
    }

    if (outroDocumentoFile.size > 10 * 1024 * 1024) { // 10MB
      setError('Arquivo muito grande. Máximo 10MB')
      return
    }

    try {
      setUploadingOutro(true)
      setError('')
      setSuccess('')

      // Buscar ou criar tipo de documento "Outros"
      let tipoOutrosId = ''
      const { data: tipoOutros } = await supabase
        .from('tipo_documentos')
        .select('id')
        .eq('nome', 'Outros')
        .single()

      if (tipoOutros) {
        tipoOutrosId = tipoOutros.id
      } else {
        // Criar tipo "Outros" se não existir
        const { data: novoTipo, error: tipoError } = await supabase
          .from('tipo_documentos')
          .insert({
            nome: 'Outros',
            descricao: 'Documentos diversos enviados pelo cliente',
            obrigatorio: false,
            ativo: true
          } as never)
          .select()
          .single()

        if (tipoError) throw tipoError
        tipoOutrosId = novoTipo.id
      }

      // Criar registro no banco usando o nome personalizado
      const nomeArquivoCustomizado = `${outroDocumentoNome} - ${outroDocumentoFile.name}`
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: documentoData, error: dbError } = await (supabase.from('documentos') as any)
        .insert({
          empresa_id: empresaSelecionada,
          tipo_documento_id: tipoOutrosId,
          nome_arquivo: nomeArquivoCustomizado,
          caminho_storage: '',
          tamanho_bytes: outroDocumentoFile.size,
          mime_type: outroDocumentoFile.type,
          status: 'aguardando_aprovacao',
          observacao: `Documento: ${outroDocumentoNome}`
        })
        .select()
        .single()

      if (dbError) throw dbError

      const documentoId = documentoData.id

      // Upload para storage
      const fileExt = outroDocumentoFile.name.split('.').pop()
      const storagePath = `${empresaSelecionada}/${documentoId}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('doc_cus')
        .upload(storagePath, outroDocumentoFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        await supabase.from('documentos').delete().eq('id', documentoId)
        throw uploadError
      }

      // Atualizar caminho no banco
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase.from('documentos') as any)
        .update({ caminho_storage: storagePath })
        .eq('id', documentoId)

      if (updateError) {
        console.error('Erro ao atualizar caminho:', updateError)
      }

      setSuccess('✅ Documento enviado com sucesso!')
      
      // Limpar formulário
      setOutroDocumentoNome('')
      setOutroDocumentoFile(null)
      
      carregarDocumentos()
    } catch (err: any) {
      console.error('Erro ao fazer upload:', err)
      setError('Erro ao enviar documento: ' + err.message)
    } finally {
      setUploadingOutro(false)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getDownloadUrl = async (caminhoStorage: string) => {
    if (!caminhoStorage) {
      console.error('Caminho de storage vazio')
      return null
    }

    try {
      const { data, error } = await supabase.storage
        .from('doc_cus')
        .createSignedUrl(caminhoStorage, 3600) // URL válida por 1 hora

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

      // Abrir em nova aba ou fazer download
      window.open(url, '_blank')
    } catch (err: any) {
      console.error('Erro ao fazer download:', err)
      setError('Erro ao fazer download do documento')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aprovado': return 'text-green-600 bg-green-50'
      case 'rejeitado': return 'text-red-600 bg-red-50'
      case 'aguardando_aprovacao': return 'text-yellow-600 bg-yellow-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'aprovado': return <Check className="w-4 h-4" />
      case 'rejeitado': return <AlertCircle className="w-4 h-4" />
      case 'aguardando_aprovacao': return <Clock className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'aprovado': return 'Aprovado'
      case 'rejeitado': return 'Rejeitado'
      case 'aguardando_aprovacao': return 'Aguardando Aprovação'
      default: return status
    }
  }

  const getDocumentoStatus = (tipoId: string) => {
    return documentos.find(doc => doc.tipo_documento_id === tipoId)
  }

  // Formatar CNPJ simples
  const formatarCNPJ = (valor?: string) => {
    if (!valor) return '-'
    const cnpj = valor.replace(/\D/g, '')
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }

  if (loadingEmpresas) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documentos</h1>
          <p className="text-gray-600 mt-1">
            Envie os documentos necessários para análise
          </p>
        </div>

        {/* Mensagens */}
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

        {/* Seleção de Empresa */}
        <Card>
          <div className="p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecione a Empresa
            </label>
            {empresas.length === 0 ? (
              <EmptyEmpresaState />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {empresas.map((empresa) => (
                  <button
                    key={empresa.id}
                    type="button"
                    onClick={() => setEmpresaSelecionada(empresa.id)}
                    className={`text-left p-4 rounded-lg border transition-shadow hover:shadow-sm ${empresaSelecionada === empresa.id ? 'border-primary-600 bg-primary-50 shadow-md' : 'border-gray-200 bg-white'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">{empresa.razao_social}</h4>
                        <p className="text-sm text-gray-500">CNPJ: {formatarCNPJ(empresa.cnpj)}</p>
                      </div>
                      <div className="ml-3">
                        <Badge variant={empresa.status_cadastro === 'ativa' ? 'success' : empresa.status_cadastro === 'rejeitado' ? 'error' : 'warning'}>
                          {empresa.status_cadastro === 'aguardando_aprovacao' ? 'Aguardando' : empresa.status_cadastro}
                        </Badge>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Lista de Documentos */}
        {empresaSelecionada && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Documentos Necessários
              </h2>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-100 border-2 border-red-500 rounded"></div>
                  <span className="text-gray-600">Obrigatório</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-100 border-2 border-gray-300 rounded"></div>
                  <span className="text-gray-600">Opcional</span>
                </div>
              </div>
            </div>

            {loading ? (
              <Card>
                <div className="p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Carregando documentos...</p>
                </div>
              </Card>
            ) : (
              <div className="grid gap-4">
                {tiposDocumentos.map((tipo) => {
                  const docExistente = getDocumentoStatus(tipo.id)
                  
                  return (
                    <Card key={tipo.id}>
                      <div className={`p-6 ${tipo.obrigatorio ? 'border-l-4 border-red-500' : ''}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <FileText className="w-5 h-5 text-gray-400" />
                              <h3 className="font-semibold text-gray-900">
                                {tipo.nome}
                                {tipo.obrigatorio && (
                                  <span className="ml-2 text-xs text-red-600">*</span>
                                )}
                              </h3>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {tipo.descricao}
                            </p>

                            {/* Documento enviado */}
                            {docExistente && (
                              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <FileText className="w-5 h-5 text-gray-400" />
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">
                                        {docExistente.nome_arquivo}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {formatBytes(docExistente.tamanho_bytes)} • {new Date(docExistente.data_upload).toLocaleDateString('pt-BR')}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {/* Status Badge */}
                                    <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(docExistente.status)}`}>
                                      {getStatusIcon(docExistente.status)}
                                      {getStatusText(docExistente.status)}
                                    </div>

                                    {/* Botão de download */}
                                    {docExistente.caminho_storage && (
                                      <button
                                        onClick={() => handleDownload(docExistente)}
                                        className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                        title="Baixar documento"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                          <polyline points="7 10 12 15 17 10"></polyline>
                                          <line x1="12" y1="15" x2="12" y2="3"></line>
                                        </svg>
                                      </button>
                                    )}

                                    {/* Botão de excluir */}
                                    {docExistente.status === 'aguardando_aprovacao' && (
                                      <button
                                        onClick={() => handleDelete(docExistente.id, docExistente.caminho_storage)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Excluir documento"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Observação do contador */}
                                {docExistente.observacao && (
                                  <div className="mt-3 pt-3 border-t border-gray-200">
                                    <p className="text-xs font-medium text-gray-700">Observação do Contador:</p>
                                    <p className="text-sm text-gray-600 mt-1">{docExistente.observacao}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Botão de Upload */}
                          {!docExistente ? (
                            <div className="ml-4">
                              <label className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 cursor-pointer transition-colors">
                                <Upload className="w-4 h-4" />
                                <span>Enviar</span>
                                <input
                                  type="file"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) handleUpload(tipo.id, file)
                                  }}
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  disabled={uploading}
                                />
                              </label>
                            </div>
                          ) : docExistente.status === 'rejeitado' && (
                            <div className="ml-4">
                              <label className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 cursor-pointer transition-colors">
                                <Upload className="w-4 h-4" />
                                <span>Reenviar</span>
                                <input
                                  type="file"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) handleUpload(tipo.id, file)
                                  }}
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  disabled={uploading}
                                />
                              </label>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}

            {/* Seção: Outros Documentos */}
            {empresaSelecionada && (
              <Card>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Upload className="w-6 h-6 text-primary-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Outros Documentos</h3>
                      <p className="text-sm text-gray-600">Envie documentos adicionais quando necessário</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Campo: Nome do Documento */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome do Documento *
                      </label>
                      <input
                        type="text"
                        value={outroDocumentoNome}
                        onChange={(e) => setOutroDocumentoNome(e.target.value)}
                        placeholder="Ex: Comprovante de pagamento, Contrato de aluguel, etc."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        disabled={uploadingOutro}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Informe um nome descritivo para identificar o documento
                      </p>
                    </div>

                    {/* Campo: Arquivo */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Selecione o arquivo *
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => setOutroDocumentoFile(e.target.files?.[0] || null)}
                        className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
                        disabled={uploadingOutro}
                      />
                      {outroDocumentoFile && (
                        <p className="text-xs text-gray-600 mt-1">
                          Arquivo selecionado: {outroDocumentoFile.name} ({formatBytes(outroDocumentoFile.size)})
                        </p>
                      )}
                    </div>

                    {/* Botão de Upload */}
                    <button
                      onClick={handleUploadOutroDocumento}
                      disabled={uploadingOutro || !outroDocumentoNome.trim() || !outroDocumentoFile}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      {uploadingOutro ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Enviar Documento
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </Card>
            )}

            {/* Informações adicionais */}
            <Alert type="info">
              <div className="space-y-2">
                <p className="font-medium">📋 Informações importantes:</p>
                <ul className="text-sm space-y-1 ml-4">
                  <li>• Formatos aceitos: PDF, JPG, JPEG, PNG</li>
                  <li>• Tamanho máximo por arquivo: 10MB</li>
                  <li>• Documentos marcados com * são obrigatórios</li>
                  <li>• Seus documentos serão analisados pelo contador</li>
                  <li>• Você pode excluir documentos pendentes e enviar novamente</li>
                </ul>
              </div>
            </Alert>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

