import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import type { Orcamento, TemplateOrcamento } from '@/types/database.types'
import { Card } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { EmptyEmpresaState } from '@/components/ui/EmptyEmpresaState'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ChevronDown, ChevronUp, Upload, X, Check } from 'lucide-react'

interface Empresa {
  id: string
  razao_social: string | null
  nome_fantasia: string | null
  cnpj: string | null
  email: string | null
  rua: string | null
  numero: string | null
  bairro: string | null
  cidade: string | null
  telefone_ddd: string | null
  telefone_numero: string | null
}

export default function OrcamentoPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [uploading, setUploading] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [orcamentos, setOrcamentos] = useState<Record<string, Partial<Orcamento>>>({})
  const [templates, setTemplates] = useState<TemplateOrcamento[]>([])
  const [expandedEmpresa, setExpandedEmpresa] = useState<string | null>(null)

  useEffect(() => {
    if (user?.id) {
      loadEmpresas()
      loadTemplates()
    }
  }, [user])

  const loadTemplates = async () => {
    try {
      const { data, error } = await (supabase
        .from('templates_orcamento') as any)
        .select('*')
        .eq('ativo', true)
        .order('ordem', { ascending: true })

      if (error) throw error
      setTemplates(data || [])
    } catch (error: any) {
      console.error('Erro ao carregar templates:', error)
    }
  };

  const loadEmpresas = async () => {
    try {
      setLoading(true)

      // Buscar todas as empresas do usuário
      const { data: empresasData, error: empresasError } = await (supabase
        .from('empresa') as any)
        .select('id, razao_social, nome_fantasia, cnpj, email, rua, numero, bairro, cidade, telefone_ddd, telefone_numero')
        .eq('user_id', user?.id)

      if (empresasError) throw empresasError

      if (empresasData && empresasData.length > 0) {
        setEmpresas(empresasData)

        // Buscar configurações de orçamento para todas as empresas
        const { data: orcamentosData } = await (supabase
          .from('orcamento') as any)
          .select('*')
          .in('empresa_id', empresasData.map((e: Empresa) => e.id))

        // Organizar orçamentos por empresa_id
        const orcamentosMap: Record<string, Partial<Orcamento>> = {}
        
        empresasData.forEach((empresa: Empresa) => {
          const orcamentoExistente = orcamentosData?.find((o: any) => o.empresa_id === empresa.id)
          
          if (orcamentoExistente) {
            orcamentosMap[empresa.id] = {
              ...orcamentoExistente,
              // Garantir que logo_url não seja null/undefined
              logo_url: orcamentoExistente.logo_url || ''
            }
          } else {
            // Preencher com dados da empresa se não existir orçamento
            orcamentosMap[empresa.id] = {
              razao_social: empresa.razao_social || '',
              nome_fantasia: empresa.nome_fantasia || '',
              cnpj: empresa.cnpj || '',
              email: empresa.email || '',
              telefone_wpp: empresa.telefone_ddd && empresa.telefone_numero 
                ? `(${empresa.telefone_ddd}) ${empresa.telefone_numero}`
                : '',
              rua: empresa.rua || '',
              numero: empresa.numero || '',
              bairro: empresa.bairro || '',
              cidade: empresa.cidade || '',
              site: '',
              slogan: '',
              logo_url: '',
              introducao: '',
              observacoes_importantes: '',
              quem_somos: ''
            }
          }
        })

        setOrcamentos(orcamentosMap)
        
        // Expandir a primeira empresa por padrão
        if (empresasData.length > 0) {
          setExpandedEmpresa(empresasData[0].id)
        }
      }
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error)
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent, empresaId: string) => {
    e.preventDefault()
    
    try {
      setSaving(empresaId)
      setMessage(null)

      const orcamentoData = orcamentos[empresaId]

      // Verificar se já existe configuração
      const { data: existing } = await (supabase
        .from('orcamento') as any)
        .select('id')
        .eq('empresa_id', empresaId)
        .maybeSingle()

      if (existing) {
        // Atualizar
        const { error } = await (supabase
          .from('orcamento') as any)
          .update({
            ...orcamentoData,
            empresa_id: empresaId,
            user_id: user?.id
          })
          .eq('id', existing.id)

        if (error) throw error
        setMessage({ type: 'success', text: 'Configurações atualizadas com sucesso!' })
      } else {
        // Inserir
        const { error } = await (supabase
          .from('orcamento') as any)
          .insert({
            ...orcamentoData,
            empresa_id: empresaId,
            user_id: user?.id
          })

        if (error) throw error
        setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' })
      }

      // Recarregar dados
      await loadEmpresas()
    } catch (error: any) {
      console.error('Erro ao salvar:', error)
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSaving(null)
    }
  }

  const handleInputChange = (empresaId: string, field: keyof Orcamento, value: string) => {
    setOrcamentos(prev => ({
      ...prev,
      [empresaId]: {
        ...prev[empresaId],
        [field]: value
      }
    }))
  }

  const toggleEmpresa = (empresaId: string) => {
    setExpandedEmpresa(expandedEmpresa === empresaId ? null : empresaId)
  }

  const handleLogoUpload = async (empresaId: string, file: File) => {
    try {
      setUploading(empresaId)
      setMessage(null)

      // Validar tipo de arquivo
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Formato de arquivo não suportado. Use JPG, PNG, GIF ou WEBP.')
      }

      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Arquivo muito grande. Tamanho máximo: 5MB.')
      }

      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop()
      const fileName = `${empresaId}.${fileExt}`
      const filePath = `${fileName}`

      // Verificar se já existe logo e deletar
      const orcamento = orcamentos[empresaId]
      if (orcamento?.logo_url) {
        const oldPath = orcamento.logo_url.split('/').pop()
        if (oldPath) {
          await supabase.storage.from('logos').remove([oldPath])
        }
      }

      // Upload do arquivo
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type
        })

      if (uploadError) throw uploadError

      // Obter URL pública
      const { data: publicUrlData } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath)

      const publicUrl = publicUrlData.publicUrl

      // Atualizar estado local
      setOrcamentos(prev => ({
        ...prev,
        [empresaId]: {
          ...prev[empresaId],
          logo_url: publicUrl
        }
      }))

      // Salvar logo_url no banco de dados
      const orcamentoData = orcamentos[empresaId]
      
      // Verificar se já existe configuração
      const { data: existing } = await (supabase
        .from('orcamento') as any)
        .select('id')
        .eq('empresa_id', empresaId)
        .maybeSingle()

      if (existing) {
        // Atualizar logo_url
        await (supabase
          .from('orcamento') as any)
          .update({ logo_url: publicUrl })
          .eq('id', existing.id)
      } else {
        // Criar registro com logo_url
        await (supabase
          .from('orcamento') as any)
          .insert({
            ...orcamentoData,
            logo_url: publicUrl,
            empresa_id: empresaId,
            user_id: user?.id
          })
      }

      setMessage({ type: 'success', text: 'Logo enviada com sucesso!' })
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error)
      setMessage({ type: 'error', text: error.message })
    } finally {
      setUploading(null)
    }
  }

  const handleLogoRemove = async (empresaId: string) => {
    try {
      setMessage(null)
      
      const orcamento = orcamentos[empresaId]
      if (!orcamento?.logo_url) return

      // Extrair o nome do arquivo da URL
      const fileName = orcamento.logo_url.split('/').pop()
      if (!fileName) return

      // Deletar do storage
      const { error } = await supabase.storage
        .from('logos')
        .remove([fileName])

      if (error) throw error

      // Atualizar estado local
      setOrcamentos(prev => ({
        ...prev,
        [empresaId]: {
          ...prev[empresaId],
          logo_url: ''
        }
      }))

      // Atualizar banco de dados
      const { data: existing } = await (supabase
        .from('orcamento') as any)
        .select('id')
        .eq('empresa_id', empresaId)
        .maybeSingle()

      if (existing) {
        await (supabase
          .from('orcamento') as any)
          .update({ logo_url: '' })
          .eq('id', existing.id)
      }

      setMessage({ type: 'success', text: 'Logo removida com sucesso!' })
    } catch (error: any) {
      console.error('Erro ao remover logo:', error)
      setMessage({ type: 'error', text: error.message })
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Carregando...</div>
        </div>
      </DashboardLayout>
    )
  }

  if (empresas.length === 0) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Emissor de Orçamentos</h1>
            <p className="text-gray-600 mt-1">Configure as informações das suas empresas para emissão de orçamentos</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Emissor de Orçamentos</h1>
          <p className="text-gray-600 mt-1">Configure as informações das suas empresas para emissão de orçamentos</p>
        </div>

        {/* Disclaimer WhatsApp */}
        <div className="bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                🤖 Gere Orçamentos em PDF direto pelo WhatsApp!
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                As informações que você salvar aqui (seu logo, slogan, "Quem Somos", etc.) serão o <strong>modelo padrão</strong> para seus orçamentos.
              </p>
              <p className="text-sm text-gray-700 leading-relaxed mt-2">
                Depois, basta enviar os detalhes do serviço para o nosso robô no WhatsApp (por texto ou áudio), 
                e ele usará este modelo para criar um <strong>PDF profissional na hora</strong>, pronto para você enviar ao seu cliente.
              </p>
            </div>
          </div>
        </div>

        {message && (
          <Alert type={message.type}>
            {message.text}
          </Alert>
        )}

        <div className="space-y-4">
          {empresas.map((empresa) => {
            const isExpanded = expandedEmpresa === empresa.id
            const orcamento = orcamentos[empresa.id] || {}
            
            return (
              <Card key={empresa.id}>
                <div className="p-4">
                  {/* Header da Empresa */}
                  <button
                    onClick={() => toggleEmpresa(empresa.id)}
                    className="w-full flex items-center justify-between text-left"
                  >
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        {empresa.nome_fantasia || empresa.razao_social || 'Empresa sem nome'}
                      </h2>
                      <p className="text-sm text-gray-600">CNPJ: {empresa.cnpj || 'Não informado'}</p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </button>

                  {/* Formulário (expandido) */}
                  {isExpanded && (
                    <form onSubmit={(e) => handleSubmit(e, empresa.id)} className="mt-6 space-y-6">
                      {/* Informações Básicas */}
                      <div>
                        <h3 className="text-md font-semibold text-gray-900 mb-4">Informações Básicas</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Razão Social
                            </label>
                            <input
                              type="text"
                              value={orcamento.razao_social || ''}
                              onChange={(e) => handleInputChange(empresa.id, 'razao_social', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Nome Fantasia
                            </label>
                            <input
                              type="text"
                              value={orcamento.nome_fantasia || ''}
                              onChange={(e) => handleInputChange(empresa.id, 'nome_fantasia', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              CNPJ
                            </label>
                            <input
                              type="text"
                              value={orcamento.cnpj || ''}
                              onChange={(e) => handleInputChange(empresa.id, 'cnpj', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Email
                            </label>
                            <input
                              type="email"
                              value={orcamento.email || ''}
                              onChange={(e) => handleInputChange(empresa.id, 'email', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Telefone/WhatsApp
                            </label>
                            <input
                              type="text"
                              value={orcamento.telefone_wpp || ''}
                              onChange={(e) => handleInputChange(empresa.id, 'telefone_wpp', e.target.value)}
                              placeholder="(00) 00000-0000"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Site
                            </label>
                            <input
                              type="url"
                              value={orcamento.site || ''}
                              onChange={(e) => handleInputChange(empresa.id, 'site', e.target.value)}
                              placeholder="https://www.seusite.com.br"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Seleção de Template */}
                      <div>
                        <h3 className="text-md font-semibold text-gray-900 mb-4">Template do Orçamento</h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Escolha o design que será usado para gerar seus orçamentos em PDF
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                          {templates.map((template) => {
                            const isSelected = orcamento.template === template.id
                            return (
                              <button
                                key={template.id}
                                type="button"
                                onClick={() => handleInputChange(empresa.id, 'template', template.id)}
                                className={`relative p-3 rounded-lg border-2 transition-all ${
                                  isSelected
                                    ? 'border-primary-500 bg-primary-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                {/* Miniatura */}
                                {template.imagem_url && (
                                  <img
                                    src={template.imagem_url}
                                    alt={template.nome}
                                    className="w-full h-32 object-cover rounded mb-2"
                                  />
                                )}
                                
                                {/* Check de seleção */}
                                {isSelected && (
                                  <div className="absolute top-1 right-1 bg-primary-500 text-white rounded-full p-1">
                                    <Check className="w-4 h-4" />
                                  </div>
                                )}

                                {/* Nome do template */}
                                <div className="text-sm font-medium text-gray-900">
                                  {template.nome}
                                </div>
                                
                                {/* Descrição */}
                                {template.descricao && (
                                  <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                                    {template.descricao}
                                  </div>
                                )}
                              </button>
                            )
                          })}
                        </div>
                        {templates.length === 0 && (
                          <p className="text-sm text-gray-500 text-center py-4">
                            Nenhum template disponível no momento.
                          </p>
                        )}
                      </div>

                      {/* Endereço */}
                      <div>
                        <h3 className="text-md font-semibold text-gray-900 mb-4">Endereço</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Rua
                            </label>
                            <input
                              type="text"
                              value={orcamento.rua || ''}
                              onChange={(e) => handleInputChange(empresa.id, 'rua', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Número
                            </label>
                            <input
                              type="text"
                              value={orcamento.numero || ''}
                              onChange={(e) => handleInputChange(empresa.id, 'numero', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Bairro
                            </label>
                            <input
                              type="text"
                              value={orcamento.bairro || ''}
                              onChange={(e) => handleInputChange(empresa.id, 'bairro', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Cidade
                            </label>
                            <input
                              type="text"
                              value={orcamento.cidade || ''}
                              onChange={(e) => handleInputChange(empresa.id, 'cidade', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Branding */}
                      <div>
                        <h3 className="text-md font-semibold text-gray-900 mb-4">Branding</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Slogan
                            </label>
                            <input
                              type="text"
                              value={orcamento.slogan || ''}
                              onChange={(e) => handleInputChange(empresa.id, 'slogan', e.target.value)}
                              placeholder="Ex: Soluções que transformam"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Logo da Empresa
                            </label>
                            
                            {/* Visualização da logo atual */}
                            {orcamento.logo_url && orcamento.logo_url.trim() !== '' && (
                              <div className="mb-3 relative inline-block">
                                <img 
                                  src={orcamento.logo_url} 
                                  alt="Logo da empresa" 
                                  className="h-24 w-auto object-contain border border-gray-300 rounded-lg p-2 bg-white"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleLogoRemove(empresa.id)}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                  title="Remover logo"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            )}

                            {/* Input de upload */}
                            <div className="flex items-center gap-2">
                              <label className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-600 rounded-lg cursor-pointer hover:bg-primary-100 border border-primary-200">
                                <Upload className="w-4 h-4" />
                                <span>{uploading === empresa.id ? 'Enviando...' : orcamento.logo_url ? 'Trocar Logo' : 'Enviar Logo'}</span>
                                <input
                                  type="file"
                                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) {
                                      handleLogoUpload(empresa.id, file)
                                    }
                                  }}
                                  disabled={uploading === empresa.id}
                                  className="hidden"
                                />
                              </label>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Formatos aceitos: JPG, PNG, GIF, WEBP (máx. 5MB)
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Textos Personalizados */}
                      <div>
                        <h3 className="text-md font-semibold text-gray-900 mb-4">Textos Personalizados</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Introdução
                            </label>
                            <textarea
                              value={orcamento.introducao || ''}
                              onChange={(e) => handleInputChange(empresa.id, 'introducao', e.target.value)}
                              rows={3}
                              placeholder="Texto de introdução do orçamento..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Quem Somos
                            </label>
                            <textarea
                              value={orcamento.quem_somos || ''}
                              onChange={(e) => handleInputChange(empresa.id, 'quem_somos', e.target.value)}
                              rows={4}
                              placeholder="Apresentação da empresa..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Observações Importantes
                            </label>
                            <textarea
                              value={orcamento.observacoes_importantes || ''}
                              onChange={(e) => handleInputChange(empresa.id, 'observacoes_importantes', e.target.value)}
                              rows={3}
                              placeholder="Ex: Condições de pagamento, prazos, garantias..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Botões */}
                      <div className="flex justify-end space-x-4 pt-4 border-t">
                        <button
                          type="button"
                          onClick={() => toggleEmpresa(empresa.id)}
                          disabled={saving === empresa.id}
                          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Fechar
                        </button>
                        <button
                          type="submit"
                          disabled={saving === empresa.id}
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          {saving === empresa.id ? 'Salvando...' : 'Salvar Configurações'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </DashboardLayout>
  )
}

