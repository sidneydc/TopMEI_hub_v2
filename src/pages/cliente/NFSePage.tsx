import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { EmptyEmpresaState } from '@/components/ui/EmptyEmpresaState'
import { supabase } from '@/lib/supabase'
import type { Empresa, NFSe, CertificadoDigital } from '@/types/database.types'
import {
  ChevronDown,
  ChevronUp,
  FileText,
  Upload,
  Send,
  AlertCircle,
  CheckCircle2,
  Key,
  Calendar,
  DollarSign,
  User,
  MapPin,
  Clock,
  Shield
} from 'lucide-react'

interface EmpresaComDados extends Empresa {
  certificado?: CertificadoDigital | null
  nfses?: NFSe[]
}

export function NFSePage() {
  const { user } = useAuth()
  const [empresas, setEmpresas] = useState<EmpresaComDados[]>([])
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const [expandedSection, setExpandedSection] = useState<{ [key: string]: 'certificado' | 'nfse' | null }>({})
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [solicitando, setSolicitando] = useState(false)
  const [showTermos, setShowTermos] = useState(false)
  const [termosAceitos, setTermosAceitos] = useState<{ [key: string]: boolean }>({})
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)

  // Estados para Certificado Digital
  const [certificadoFile, setCertificadoFile] = useState<{ [key: string]: File | null }>({})
  const [certificadoSenha, setCertificadoSenha] = useState<{ [key: string]: string }>({})
  const [certificadoValidade, setCertificadoValidade] = useState<{ [key: string]: string }>({})

  // Estados para NFSe
  const [nfseForm, setNfseForm] = useState<{ [key: string]: Partial<NFSe> }>({})

  useEffect(() => {
    loadEmpresas()
  }, [user])

  const loadEmpresas = async () => {
    if (!user?.id) return

    try {
      setLoading(true)

      // Carregar empresas do usuário
      const { data: empresasData, error: empresasError } = await supabase
        .from('empresa')
        .select('*')
        .eq('user_id', user.id)
        .order('razao_social')

      if (empresasError) throw empresasError

      if (!empresasData || empresasData.length === 0) {
        setEmpresas([])
        return
      }

      // Carregar certificados
      const { data: certificadosData } = await supabase
        .from('certificados_digitais')
        .select('*')
        .in('empresa_id', empresasData.map(e => e.id))

      // Carregar NFSes
      const { data: nfsesData } = await supabase
        .from('nfse')
        .select('*')
        .in('empresa_id', empresasData.map(e => e.id))
        .order('created_at', { ascending: false })

      // Combinar dados
      const empresasComDados: EmpresaComDados[] = empresasData.map(empresa => ({
        ...empresa,
        certificado: certificadosData?.find(c => c.empresa_id === empresa.id) || null,
        nfses: nfsesData?.filter(n => n.empresa_id === empresa.id) || []
      }))

      setEmpresas(empresasComDados)

      // Inicializar forms vazios
      const formsIniciais: { [key: string]: Partial<NFSe> } = {}
      empresasData.forEach(empresa => {
        formsIniciais[empresa.id] = {
          data_competencia: new Date().toISOString().split('T')[0],
          valor_servicos: 0,
          status: 'pendente'
        }
      })
      setNfseForm(formsIniciais)

    } catch (error: any) {
      console.error('❌ Erro ao carregar empresas:', error)
      setAlert({ type: 'error', message: 'Erro ao carregar empresas: ' + error.message })
    } finally {
      setLoading(false)
    }
  }

  const toggleCard = (empresaId: string) => {
    setExpandedCard(expandedCard === empresaId ? null : empresaId)
  }

  const toggleSection = (empresaId: string, section: 'certificado' | 'nfse') => {
    setExpandedSection(prev => ({
      ...prev,
      [empresaId]: prev[empresaId] === section ? null : section
    }))
  }

  const handleUploadCertificado = async (empresaId: string) => {
    const file = certificadoFile[empresaId]
    const senha = certificadoSenha[empresaId]
    const validade = certificadoValidade[empresaId]

    if (!file || !senha) {
      setAlert({ type: 'error', message: 'Selecione o arquivo do certificado e informe a senha' })
      return
    }

    try {
      setSalvando(true)

      // Upload do arquivo para o storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${empresaId}-${Date.now()}.${fileExt}`
      const filePath = `certificados/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('certificados')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('certificados')
        .getPublicUrl(filePath)

      // Verificar se já existe certificado
      const empresa = empresas.find(e => e.id === empresaId)
      
      if (empresa?.certificado) {
        // Atualizar certificado existente
        const { error: updateError } = await supabase
          .from('certificados_digitais')
          .update({
            certificado_url: publicUrl,
            certificado_senha: senha,
            data_validade: validade || null,
            ativo: true
          })
          .eq('id', empresa.certificado.id)

        if (updateError) throw updateError
      } else {
        // Inserir novo certificado
        const { error: insertError } = await supabase
          .from('certificados_digitais')
          .insert({
            empresa_id: empresaId,
            user_id: user!.id,
            certificado_url: publicUrl,
            certificado_senha: senha,
            data_validade: validade || null,
            ativo: true
          } as never)

        if (insertError) throw insertError
      }

      setAlert({ type: 'success', message: 'Certificado salvo com sucesso!' })
      
      // Limpar form
      setCertificadoFile(prev => ({ ...prev, [empresaId]: null }))
      setCertificadoSenha(prev => ({ ...prev, [empresaId]: '' }))
      setCertificadoValidade(prev => ({ ...prev, [empresaId]: '' }))
      
      // Recarregar dados
      await loadEmpresas()

    } catch (error: any) {
      console.error('❌ Erro ao salvar certificado:', error)
      setAlert({ type: 'error', message: 'Erro ao salvar certificado: ' + error.message })
    } finally {
      setSalvando(false)
    }
  }

  const handleSolicitarEmissao = async (empresaId: string) => {
    const empresa = empresas.find(e => e.id === empresaId)
    
    if (!empresa?.certificado) {
      setAlert({ type: 'error', message: 'Configure o certificado digital antes de solicitar a emissão' })
      return
    }

    const form = nfseForm[empresaId]
    
    if (!form?.data_competencia || !form?.tomador_cpf_cnpj || !form?.tomador_nome || 
        !form?.descricao_servicos || !form?.valor_servicos) {
      setAlert({ type: 'error', message: 'Preencha todos os campos obrigatórios' })
      return
    }

    if (!termosAceitos[empresaId]) {
      setShowTermos(true)
      return
    }

    try {
      setSolicitando(true)

      const { error } = await supabase
        .from('nfse')
        .insert({
          empresa_id: empresaId,
          user_id: user!.id,
          ...form,
          status: 'pendente'
        } as never)

      if (error) throw error

      setAlert({ 
        type: 'success', 
        message: 'Solicitação enviada! Um analista contábil processará sua NFSe em até 3 dias úteis.' 
      })

      // Limpar form
      setNfseForm(prev => ({
        ...prev,
        [empresaId]: {
          data_competencia: new Date().toISOString().split('T')[0],
          valor_servicos: 0,
          status: 'pendente'
        }
      }))

      // Recarregar dados
      await loadEmpresas()

    } catch (error: any) {
      console.error('❌ Erro ao solicitar emissão:', error)
      setAlert({ type: 'error', message: 'Erro ao solicitar emissão: ' + error.message })
    } finally {
      setSolicitando(false)
    }
  }

  const updateNfseForm = (empresaId: string, field: string, value: any) => {
    setNfseForm(prev => ({
      ...prev,
      [empresaId]: {
        ...prev[empresaId],
        [field]: value
      }
    }))
  }

  const getStatusBadge = (status: string) => {
    const badges: { [key: string]: { color: 'info' | 'success' | 'warning' | 'danger'; label: string } } = {
      pendente: { color: 'warning', label: 'Pendente' },
      processando: { color: 'info', label: 'Processando' },
      emitida: { color: 'success', label: 'Emitida' },
      cancelada: { color: 'danger', label: 'Cancelada' },
      erro: { color: 'danger', label: 'Erro' }
    }
    const badge = badges[status] || badges.pendente
    return <Badge color={badge.color}>{badge.label}</Badge>
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (empresas.length === 0) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Emissão de NFSe</h1>
            <p className="text-gray-600 mt-1">Solicite a emissão de Notas Fiscais de Serviço Eletrônicas</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Emissão de NFSe</h1>
          <p className="text-gray-600 mt-1">Solicite a emissão de Notas Fiscais de Serviço Eletrônicas</p>
        </div>

        {/* Disclaimer Provisório */}
        <Alert type="info">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-900">Processo de Emissão</p>
              <p className="text-blue-800 text-sm mt-1">
                A emissão de NFSe será processada por um <strong>analista contábil especializado</strong>.
                O prazo para emissão é de até <strong>3 dias úteis</strong> após a solicitação.
                Este é um processo manual que garante a conformidade e precisão das informações fiscais.
              </p>
            </div>
          </div>
        </Alert>

        {alert && (
          <Alert type={alert.type} onClose={() => setAlert(null)}>
            {alert.message}
          </Alert>
        )}

        {/* Cards por Empresa */}
        <div className="space-y-4">
          {empresas.map((empresa) => (
            <Card key={empresa.id}>
              <div>
                {/* Header do Card - Empresa */}
                <button
                  onClick={() => toggleCard(empresa.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6 text-primary-600" />
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-900">
                        {empresa.razao_social || empresa.nome_fantasia}
                      </h3>
                      <p className="text-sm text-gray-600">
                        CNPJ: {empresa.cnpj ? empresa.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5') : 'Não informado'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {empresa.certificado && (
                      <Badge color="success">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Certificado OK
                      </Badge>
                    )}
                    {!empresa.certificado && (
                      <Badge color="warning">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Sem Certificado
                      </Badge>
                    )}
                    {expandedCard === empresa.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Conteúdo Expandido */}
                {expandedCard === empresa.id && (
                  <div className="border-t border-gray-200 p-4 space-y-4">
                    
                    {/* Card: Certificado Digital */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleSection(empresa.id, 'certificado')}
                        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Key className="w-5 h-5 text-gray-700" />
                          <span className="font-medium text-gray-900">Certificado Digital</span>
                        </div>
                        {expandedSection[empresa.id] === 'certificado' ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </button>

                      {expandedSection[empresa.id] === 'certificado' && (
                        <div className="p-4 space-y-4">
                          {empresa.certificado ? (
                            <div className="space-y-3">
                              <Alert type="success">
                                <div className="flex items-start gap-2">
                                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                                  <div>
                                    <p className="font-medium text-green-900">Certificado Configurado</p>
                                    {empresa.certificado.data_validade && (
                                      <p className="text-sm text-green-800 mt-1">
                                        Válido até: {new Date(empresa.certificado.data_validade).toLocaleDateString('pt-BR')}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </Alert>
                              
                              <div className="text-sm text-gray-600">
                                <p>Para atualizar o certificado, faça upload de um novo arquivo abaixo.</p>
                              </div>
                            </div>
                          ) : (
                            <Alert type="warning">
                              <div className="flex items-start gap-2">
                                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                                <div>
                                  <p className="font-medium text-yellow-900">Certificado Não Configurado</p>
                                  <p className="text-sm text-yellow-800 mt-1">
                                    Configure o certificado digital para poder emitir NFSe
                                  </p>
                                </div>
                              </div>
                            </Alert>
                          )}

                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Arquivo do Certificado (.pfx ou .p12) *
                              </label>
                              <input
                                type="file"
                                accept=".pfx,.p12"
                                onChange={(e) => {
                                  const file = e.target.files?.[0] || null
                                  setCertificadoFile(prev => ({ ...prev, [empresa.id]: file }))
                                }}
                                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Senha do Certificado *
                              </label>
                              <input
                                type="password"
                                value={certificadoSenha[empresa.id] || ''}
                                onChange={(e) => setCertificadoSenha(prev => ({ ...prev, [empresa.id]: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder="Digite a senha do certificado"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Data de Validade
                              </label>
                              <input
                                type="date"
                                value={certificadoValidade[empresa.id] || ''}
                                onChange={(e) => setCertificadoValidade(prev => ({ ...prev, [empresa.id]: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              />
                            </div>

                            <button
                              onClick={() => handleUploadCertificado(empresa.id)}
                              disabled={salvando || !certificadoFile[empresa.id] || !certificadoSenha[empresa.id]}
                              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                            >
                              <Upload className="w-4 h-4" />
                              {salvando ? 'Salvando...' : 'Salvar Certificado'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Card: Emissão de NFSe */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleSection(empresa.id, 'nfse')}
                        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-gray-700" />
                          <span className="font-medium text-gray-900">Emissão de NFSe</span>
                        </div>
                        {expandedSection[empresa.id] === 'nfse' ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </button>

                      {expandedSection[empresa.id] === 'nfse' && (
                        <div className="p-4 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Data de Competência */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Calendar className="w-4 h-4 inline mr-1" />
                                Data de Competência *
                              </label>
                              <input
                                type="date"
                                value={nfseForm[empresa.id]?.data_competencia || ''}
                                onChange={(e) => updateNfseForm(empresa.id, 'data_competencia', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              />
                            </div>

                            {/* Valor dos Serviços */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                <DollarSign className="w-4 h-4 inline mr-1" />
                                Valor dos Serviços *
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={nfseForm[empresa.id]?.valor_servicos || 0}
                                onChange={(e) => updateNfseForm(empresa.id, 'valor_servicos', parseFloat(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder="0.00"
                              />
                            </div>
                          </div>

                          {/* Tomador - CPF/CNPJ */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              <User className="w-4 h-4 inline mr-1" />
                              CPF/CNPJ do Tomador *
                            </label>
                            <input
                              type="text"
                              value={nfseForm[empresa.id]?.tomador_cpf_cnpj || ''}
                              onChange={(e) => updateNfseForm(empresa.id, 'tomador_cpf_cnpj', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              placeholder="CPF ou CNPJ sem pontuação"
                              maxLength={14}
                            />
                          </div>

                          {/* Tomador - Nome */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Nome do Tomador *
                            </label>
                            <input
                              type="text"
                              value={nfseForm[empresa.id]?.tomador_nome || ''}
                              onChange={(e) => updateNfseForm(empresa.id, 'tomador_nome', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              placeholder="Nome completo ou razão social"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Tomador - Email */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email do Tomador
                              </label>
                              <input
                                type="email"
                                value={nfseForm[empresa.id]?.tomador_email || ''}
                                onChange={(e) => updateNfseForm(empresa.id, 'tomador_email', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder="email@exemplo.com"
                              />
                            </div>

                            {/* Tomador - Telefone */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Telefone do Tomador
                              </label>
                              <input
                                type="tel"
                                value={nfseForm[empresa.id]?.tomador_telefone || ''}
                                onChange={(e) => updateNfseForm(empresa.id, 'tomador_telefone', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder="(00) 00000-0000"
                              />
                            </div>
                          </div>

                          {/* Endereço do Tomador */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              <MapPin className="w-4 h-4 inline mr-1" />
                              Endereço do Tomador
                            </label>
                            <input
                              type="text"
                              value={nfseForm[empresa.id]?.tomador_endereco || ''}
                              onChange={(e) => updateNfseForm(empresa.id, 'tomador_endereco', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              placeholder="Rua, Avenida, etc."
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Número</label>
                              <input
                                type="text"
                                value={nfseForm[empresa.id]?.tomador_numero || ''}
                                onChange={(e) => updateNfseForm(empresa.id, 'tomador_numero', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Bairro</label>
                              <input
                                type="text"
                                value={nfseForm[empresa.id]?.tomador_bairro || ''}
                                onChange={(e) => updateNfseForm(empresa.id, 'tomador_bairro', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">CEP</label>
                              <input
                                type="text"
                                value={nfseForm[empresa.id]?.tomador_cep || ''}
                                onChange={(e) => updateNfseForm(empresa.id, 'tomador_cep', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder="00000-000"
                                maxLength={8}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Cidade</label>
                              <input
                                type="text"
                                value={nfseForm[empresa.id]?.tomador_cidade || ''}
                                onChange={(e) => updateNfseForm(empresa.id, 'tomador_cidade', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">UF</label>
                              <select
                                value={nfseForm[empresa.id]?.tomador_uf || ''}
                                onChange={(e) => updateNfseForm(empresa.id, 'tomador_uf', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              >
                                <option value="">Selecione</option>
                                <option value="AC">AC</option>
                                <option value="AL">AL</option>
                                <option value="AP">AP</option>
                                <option value="AM">AM</option>
                                <option value="BA">BA</option>
                                <option value="CE">CE</option>
                                <option value="DF">DF</option>
                                <option value="ES">ES</option>
                                <option value="GO">GO</option>
                                <option value="MA">MA</option>
                                <option value="MT">MT</option>
                                <option value="MS">MS</option>
                                <option value="MG">MG</option>
                                <option value="PA">PA</option>
                                <option value="PB">PB</option>
                                <option value="PR">PR</option>
                                <option value="PE">PE</option>
                                <option value="PI">PI</option>
                                <option value="RJ">RJ</option>
                                <option value="RN">RN</option>
                                <option value="RS">RS</option>
                                <option value="RO">RO</option>
                                <option value="RR">RR</option>
                                <option value="SC">SC</option>
                                <option value="SP">SP</option>
                                <option value="SE">SE</option>
                                <option value="TO">TO</option>
                              </select>
                            </div>
                          </div>

                          {/* Descrição dos Serviços */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Descrição dos Serviços *
                            </label>
                            <textarea
                              value={nfseForm[empresa.id]?.descricao_servicos || ''}
                              onChange={(e) => updateNfseForm(empresa.id, 'descricao_servicos', e.target.value)}
                              rows={4}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              placeholder="Descreva os serviços prestados..."
                            />
                          </div>

                          {/* Observações */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Observações
                            </label>
                            <textarea
                              value={nfseForm[empresa.id]?.observacoes || ''}
                              onChange={(e) => updateNfseForm(empresa.id, 'observacoes', e.target.value)}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              placeholder="Observações adicionais (opcional)"
                            />
                          </div>

                          {/* Termos de Uso */}
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <Shield className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <label className="flex items-start gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={termosAceitos[empresa.id] || false}
                                    onChange={(e) => setTermosAceitos(prev => ({ ...prev, [empresa.id]: e.target.checked }))}
                                    className="mt-1"
                                  />
                                  <span className="text-sm text-yellow-900">
                                    Aceito os termos de uso do serviço de emissão de NFSe e estou ciente de que
                                    a nota será processada por um analista contábil em até 3 dias úteis. *
                                  </span>
                                </label>
                              </div>
                            </div>
                          </div>

                          {/* Botão Solicitar */}
                          <button
                            onClick={() => handleSolicitarEmissao(empresa.id)}
                            disabled={solicitando || !empresa.certificado || !termosAceitos[empresa.id]}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                          >
                            <Send className="w-5 h-5" />
                            {solicitando ? 'Enviando Solicitação...' : 'Solicitar Emissão'}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Lista de NFSes desta empresa */}
                    {empresa.nfses && empresa.nfses.length > 0 && (
                      <div className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                          <Clock className="w-5 h-5" />
                          Histórico de Solicitações
                        </h4>
                        <div className="space-y-2">
                          {empresa.nfses.map((nfse) => (
                            <div key={nfse.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {nfse.tomador_nome}
                                </p>
                                <p className="text-xs text-gray-600">
                                  Competência: {new Date(nfse.data_competencia).toLocaleDateString('pt-BR')}
                                  {' • '}
                                  Valor: R$ {nfse.valor_servicos.toFixed(2)}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {getStatusBadge(nfse.status)}
                                {nfse.pdf_url && (
                                  <a
                                    href={nfse.pdf_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary-600 hover:text-primary-700"
                                  >
                                    <FileText className="w-4 h-4" />
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
