import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { useEmpresasUsuario } from '@/hooks/useEmpresa'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { Building2, Plus, FileText, Search, Loader2, XCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface ReceitaData {
  taxId: string
  alias?: string
  founded: string
  company: {
    name: string
    nature?: { text: string }
    simei?: { optant: boolean }
  }
  address: {
    street: string
    number: string
    details?: string
    district: string
    city: string
    state: string
    zip: string
  }
  mainActivity?: {
    id: number
    text: string
  }
  sideActivities?: Array<{
    id: number
    text: string
  }>
  phones?: Array<{
    area: string
    number: string
  }>
  emails?: Array<{
    address: string
  }>
  registrations?: Array<{
    number: string
    state: string
    enabled: boolean
    type: { text: string }
  }>
}

// Interface para ReceitaWS (API alternativa)
interface ReceitaWSData {
  cnpj: string
  nome: string
  fantasia?: string
  abertura: string
  natureza_juridica: string
  logradouro: string
  numero: string
  complemento?: string
  bairro: string
  municipio: string
  uf: string
  cep: string
  telefone?: string
  email?: string
  atividade_principal: Array<{
    code: string
    text: string
  }>
  atividades_secundarias?: Array<{
    code: string
    text: string
  }>
}

export function EmpresaPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { empresas, loading, recarregar } = useEmpresasUsuario(user?.id)
  const [showCadastroForm, setShowCadastroForm] = useState(false)
  const [cnpjConsulta, setCnpjConsulta] = useState('')
  const [loadingConsulta, setLoadingConsulta] = useState(false)
  const [dadosReceita, setDadosReceita] = useState<ReceitaData | null>(null)
  const [errorConsulta, setErrorConsulta] = useState('')
  
  // Debug
  useEffect(() => {
    console.log('EmpresaPage - Estado:', {
      userId: user?.id,
      empresas,
      loading,
      showCadastroForm
    })
  }, [user?.id, empresas, loading, showCadastroForm])
  
  // Campos adicionais do proprietário (não vêm da API)
  const [nomeProprietario, setNomeProprietario] = useState('')
  const [cpfProprietario, setCpfProprietario] = useState('')
  const [dataNascimento, setDataNascimento] = useState('')
  
  // Planos
  const [planos, setPlanos] = useState<any[]>([])
  const [planoSelecionado, setPlanoSelecionado] = useState<string>('')
  const [loadingPlanos, setLoadingPlanos] = useState(false)
  
  // Aceite dos termos
  const [aceitouTermos, setAceitouTermos] = useState(false)

  // Função para limpar e formatar CPF (apenas números)
  const limparCPF = (valor: string) => {
    return valor.replace(/\D/g, '')
  }

  // Função para formatar CPF com máscara visual
  const formatarCPF = (valor: string) => {
    const cpf = limparCPF(valor)
    return cpf
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1-$2')
      .substring(0, 14)
  }

  // Função para carregar planos disponíveis
  const carregarPlanos = async () => {
    setLoadingPlanos(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('planos') as any)
        .select('*')
        .eq('ativo', true)
        .order('tipo', { ascending: true })
        .order('valor', { ascending: true })

      if (error) throw error
      setPlanos(data || [])
    } catch (error) {
      console.error('Erro ao carregar planos:', error)
    } finally {
      setLoadingPlanos(false)
    }
  }

  // Função para formatar valor em Real
  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  // Função para excluir empresa
  const inativarEmpresa = async (empresaId: string, cnpj: string) => {
    const confirmacao = window.confirm(
      `Tem certeza que deseja inativar a empresa CNPJ ${cnpj}?\n\nVocê poderá reativar esta empresa posteriormente se necessário.`
    )

    if (!confirmacao) return

    try {
      setLoadingConsulta(true)

      // Atualizar status da empresa para 'inativo'
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('empresa') as any)
        .update({ 
          status_cadastro: 'inativo',
          data_inativacao: new Date().toISOString()
        })
        .eq('id', empresaId)

      if (error) throw error

      // Inativar também o plano da empresa
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('empresas_planos') as any)
        .update({ status: 'inativo' })
        .eq('empresa_id', empresaId)

      alert('✅ Empresa inativada com sucesso!')
      recarregar() // Recarrega a lista de empresas
    } catch (error) {
      console.error('Erro ao inativar empresa:', error)
      alert('❌ Erro ao inativar empresa. Tente novamente.')
    } finally {
      setLoadingConsulta(false)
    }
  }

  // Função para limpar e formatar CNPJ (apenas números)
  const limparCNPJ = (valor: string) => {
    return valor.replace(/\D/g, '')
  }

  // Função para formatar CNPJ com máscara visual
  const formatarCNPJ = (valor: string) => {
    const cnpj = limparCNPJ(valor)
    return cnpj
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .substring(0, 18)
  }

  // Função para converter dados da ReceitaWS para formato ReceitaData
  const converterReceitaWS = (data: ReceitaWSData): ReceitaData => {
    const telefone = data.telefone?.replace(/\D/g, '')
    return {
      taxId: data.cnpj.replace(/\D/g, ''),
      alias: data.fantasia,
      founded: data.abertura,
      company: {
        name: data.nome,
        nature: { text: data.natureza_juridica },
        simei: { optant: false }
      },
      address: {
        street: data.logradouro,
        number: data.numero,
        details: data.complemento,
        district: data.bairro,
        city: data.municipio,
        state: data.uf,
        zip: data.cep.replace(/\D/g, '')
      },
      mainActivity: data.atividade_principal?.[0] ? {
        id: parseInt(data.atividade_principal[0].code.replace(/\D/g, '')),
        text: data.atividade_principal[0].text
      } : undefined,
      sideActivities: data.atividades_secundarias?.map(a => ({
        id: parseInt(a.code.replace(/\D/g, '')),
        text: a.text
      })),
      phones: telefone && telefone.length >= 10 ? [{
        area: telefone.substring(0, 2),
        number: telefone.substring(2)
      }] : undefined,
      emails: data.email ? [{
        address: data.email
      }] : undefined
    }
  }

  // Função para consultar CNPJ na API da Receita
  const consultarCNPJ = async () => {
    const cnpjLimpo = limparCNPJ(cnpjConsulta)
    
    if (cnpjLimpo.length !== 14) {
      setErrorConsulta('CNPJ deve conter 14 dígitos')
      return
    }

    setLoadingConsulta(true)
    setErrorConsulta('')
    setDadosReceita(null)

    try {
      console.log('Consultando CNPJ:', cnpjLimpo)
      
      // Tenta primeiro com Open CNPJA
      try {
        const response = await fetch(`https://open.cnpja.com/office/${cnpjLimpo}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        })

        console.log('Status Open CNPJA:', response.status)

        if (response.ok) {
          const data: ReceitaData = await response.json()
          console.log('Dados recebidos (Open CNPJA):', data)
          setDadosReceita(data)
          return
        }
      } catch (error) {
        console.log('Open CNPJA falhou, tentando ReceitaWS...')
      }

      // Se falhar, tenta com ReceitaWS
      const response = await fetch(`https://receitaws.com.br/v1/cnpj/${cnpjLimpo}`)
      
      console.log('Status ReceitaWS:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Erro na resposta:', errorText)
        throw new Error(`CNPJ não encontrado ou inválido`)
      }

      const dataWS: ReceitaWSData = await response.json()
      console.log('Dados recebidos (ReceitaWS):', dataWS)
      
      // Converte formato ReceitaWS para ReceitaData
      const data = converterReceitaWS(dataWS)
      setDadosReceita(data)
      
      // Carregar planos após obter dados da empresa
      carregarPlanos()
      
    } catch (error) {
      console.error('Erro completo:', error)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setErrorConsulta('Erro de conexão. Verifique sua internet e tente novamente.')
      } else {
        setErrorConsulta(`Erro: ${error instanceof Error ? error.message : 'CNPJ não encontrado ou inválido.'}`)
      }
    } finally {
      setLoadingConsulta(false)
    }
  }

  // Função para salvar empresa no banco
  const salvarEmpresa = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!dadosReceita || !user) return

    // Validação de aceite dos termos
    if (!aceitouTermos) {
      setErrorConsulta('Você deve aceitar os Termos de Uso para continuar')
      return
    }

    // Validações de campos obrigatórios
    if (!nomeProprietario.trim()) {
      setErrorConsulta('Nome do proprietário é obrigatório')
      return
    }

    const cpfLimpo = limparCPF(cpfProprietario)
    if (cpfLimpo.length !== 11) {
      setErrorConsulta('CPF do proprietário deve conter 11 dígitos')
      return
    }

    if (!dataNascimento) {
      setErrorConsulta('Data de nascimento é obrigatória')
      return
    }

    if (!planoSelecionado) {
      setErrorConsulta('Selecione um plano para continuar')
      return
    }

    try {
      setLoadingConsulta(true)
      
      // Verificar se o CNPJ já está cadastrado para este usuário
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: empresaExistente, error: checkError } = await (supabase.from('empresa') as any)
        .select('id, cnpj, status_cadastro')
        .eq('cnpj', dadosReceita.taxId)
        .eq('user_id', user.id)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 = não encontrou registros (isso é bom)
        throw checkError
      }

      if (empresaExistente) {
        const status = empresaExistente.status_cadastro
        
        if (status === 'aguardando_aprovacao') {
          setErrorConsulta('Este CNPJ já possui um cadastro aguardando aprovação. Aguarde a análise.')
          setLoadingConsulta(false)
          return
        }
        
        if (status === 'aprovado') {
          setErrorConsulta('Este CNPJ já está cadastrado e aprovado no sistema.')
          setLoadingConsulta(false)
          return
        }
        
        // Se status for 'rejeitado', permite novo cadastro (continua o fluxo)
        if (status !== 'rejeitado') {
          setErrorConsulta('Este CNPJ já está cadastrado no sistema')
          setLoadingConsulta(false)
          return
        }
      }
      
      // 1. Inserir empresa
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: empresaData, error: empresaError } = await (supabase.from('empresa') as any).insert({
        user_id: user.id,
        cnpj: dadosReceita.taxId,
        razao_social: dadosReceita.company.name,
        nome_fantasia: dadosReceita.alias || dadosReceita.company.name,
        nome_proprietario: nomeProprietario,
        cpf_proprietario: cpfLimpo,
        data_nascimento: dataNascimento,
        data_abertura: dadosReceita.founded,
        optante_simei: dadosReceita.company.simei?.optant || false,
        cnae_principal: dadosReceita.mainActivity?.id.toString(),
        descricao_cnae_principal: dadosReceita.mainActivity?.text,
        rua: dadosReceita.address.street,
        numero: dadosReceita.address.number,
        complemento: dadosReceita.address.details,
        bairro: dadosReceita.address.district,
        cidade: dadosReceita.address.city,
        estado: dadosReceita.address.state,
        cep: dadosReceita.address.zip,
        telefone_ddd: dadosReceita.phones?.[0]?.area,
        telefone_numero: dadosReceita.phones?.[0]?.number,
        email: dadosReceita.emails?.[0]?.address,
        status_cnpj: 'ativo', // Status padrão quando cadastra
        data_opcao_simei: dadosReceita.company.simei?.optant ? dadosReceita.founded : null,
        status_cadastro: 'aguardando_aprovacao'
      }).select()

      if (empresaError) throw empresaError

      const empresaId = empresaData[0].id

      // 2. Vincular plano à empresa
      // Buscar o valor do plano selecionado
      const planoEscolhido = planos.find(p => p.id === planoSelecionado)
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: planoError } = await (supabase.from('empresas_planos') as any).insert({
        empresa_id: empresaId,
        plano_id: planoSelecionado,
        valor: planoEscolhido?.valor || 0,
        status: 'aguardando_confirmacao_pagamento',
        vigencia_inicio: new Date().toISOString().split('T')[0]
      })

      if (planoError) {
        console.error('Erro ao vincular plano:', planoError)
        throw new Error(`Erro ao vincular plano: ${planoError.message}`)
      }

      // 4. Inserir CNAEs Secundários (se houver)
      if (dadosReceita.sideActivities && dadosReceita.sideActivities.length > 0) {
        const cnaesSecundarios = dadosReceita.sideActivities.map(cnae => ({
          empresa_id: empresaId,
          cnae_num: cnae.id.toString(),
          cnae_descricao: cnae.text,
          ativo: true
        }))

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: cnaesError } = await (supabase.from('cnaes_secundarios') as any).insert(cnaesSecundarios)
        if (cnaesError) console.error('Erro ao salvar CNAEs secundários:', cnaesError)
      }

      // 5. Inserir Inscrições Estaduais (se houver)
      if (dadosReceita.registrations && dadosReceita.registrations.length > 0) {
        const inscricoes = dadosReceita.registrations.map(reg => ({
          empresa_id: empresaId,
          tipo: reg.type.text,
          numero: reg.number,
          estado: reg.state,
          ativa: reg.enabled
        }))

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: inscricoesError } = await (supabase.from('inscricoes') as any).insert(inscricoes)
        if (inscricoesError) console.error('Erro ao salvar inscrições:', inscricoesError)
      }

      // Sucesso - exibir mensagem e recarregar
      alert('✅ Cadastro enviado com sucesso! Seu cadastro está aguardando aprovação.')
      
      // Limpar formulário e fechar
      setShowCadastroForm(false)
      setDadosReceita(null)
      setCnpjConsulta('')
      setNomeProprietario('')
      setCpfProprietario('')
      setDataNascimento('')
      setPlanoSelecionado('')
      setPlanos([])
      setAceitouTermos(false)
      
      // Recarregar lista de empresas
      await recarregar()
      // Após cadastrar com sucesso, redirecionar para dashboard
      navigate('/dashboard')
    } catch (error) {
      console.error('Erro ao salvar empresa:', error)
      setErrorConsulta('Erro ao salvar os dados da empresa')
    } finally {
      setLoadingConsulta(false)
    }
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

  // Log para debug
  console.log('Estado atual:', { empresas, loading, showCadastroForm, user: user?.id })

  // Renderização principal
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Minhas Empresas</h1>
            <p className="text-gray-600 mt-1">Gerencie suas empresas MEI</p>
          </div>
          {!showCadastroForm && empresas.length > 0 && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/abrir-mei')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-primary-600 text-primary-600 bg-white hover:bg-primary-50"
              >
                <Building2 className="w-5 h-5" />
                Abrir MEI
              </button>

              <button
                type="button"
                onClick={() => navigate('/prospera-mei')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-primary-600 text-primary-600 bg-white hover:bg-primary-50"
                title="Prospera MEI"
              >
                <FileText className="w-5 h-5" />
                Prospera MEI
              </button>

              <button
                onClick={() => {
                  setShowCadastroForm(true)
                  carregarPlanos()
                }}
                className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
              >
                <Plus className="w-5 h-5" />
                Cadastrar Nova Empresa
              </button>
            </div>
          )}
        </div>

        {/* Lista de Empresas Cadastradas */}
        {!showCadastroForm && empresas.length > 0 && (
          <div className="grid grid-cols-1 gap-4">
            {empresas.map((empresa) => (
              <Card key={empresa.id} className="hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    {/* Cabeçalho com Razão Social e Badges */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary-100 p-2 rounded-lg">
                          <Building2 className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{empresa.razao_social}</h3>
                          <p className="text-sm text-gray-500">
                            CNPJ: {empresa.cnpj ? empresa.cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5') : '-'}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 items-center">
                        <span className="text-sm font-medium text-gray-700">Cadastro Topmei:</span>
                        <Badge 
                          variant={
                            empresa.status_cadastro === 'ativa' ? 'success' : 
                            empresa.status_cadastro === 'rejeitado' ? 'error' : 
                            empresa.status_cadastro === 'suspensa' ? 'error' :
                            'warning'
                          }
                        >
                          {empresa.status_cadastro === 'aguardando_aprovacao' ? 'Aguardando Aprovação' :
                           empresa.status_cadastro === 'ativa' ? 'Ativa' :
                           empresa.status_cadastro === 'rejeitado' ? 'Rejeitada' :
                           empresa.status_cadastro === 'suspensa' ? 'Suspensa' :
                           empresa.status_cadastro === 'pendente' ? 'Pendente' :
                           empresa.status_cadastro}
                        </Badge>
                      </div>
                    </div>

                    {/* Informações Resumidas em Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm border-t pt-3">
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Nome Fantasia</p>
                        <p className="font-medium text-gray-900">{empresa.nome_fantasia || '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Data Abertura</p>
                        <p className="font-medium text-gray-900">
                          {empresa.data_abertura
                            ? new Date(empresa.data_abertura).toLocaleDateString('pt-BR')
                            : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Cidade/Estado</p>
                        <p className="font-medium text-gray-900">{empresa.cidade} - {empresa.estado}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Optante SIMEI</p>
                        <p className="font-medium text-gray-900">
                          {empresa.optante_simei ? (
                            <span className="text-green-600">✓ Sim</span>
                          ) : (
                            <span className="text-gray-400">✗ Não</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Botão de Inativar */}
                  <button
                    onClick={() => inativarEmpresa(empresa.id, empresa.cnpj || '')}
                    className="ml-4 p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                    title="Inativar empresa"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Tela de boas-vindas quando não há empresas */}
        {!showCadastroForm && empresas.length === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Opção: Abrir um MEI */}
            <Card className="hover:shadow-lg transition-shadow">
              <div className="text-center p-8">
                <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Abrir um MEI</h3>
                <p className="text-gray-600 mb-6">
                  Ainda não tem MEI? Vamos te ajudar a abrir seu MEI de forma simples e rápida.
                </p>
                <button 
                  onClick={() => navigate('/abrir-mei')}
                  className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Iniciar Abertura
                </button>
                <p className="text-sm text-gray-500 mt-4">
                  Processo 100% online • Documentação completa • Suporte especializado
                </p>
              </div>
            </Card>

            {/* Opção: Cadastrar MEI Existente */}
            <Card className="hover:shadow-lg transition-shadow">
              <div className="text-center p-8">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Cadastrar MEI Existente</h3>
                <p className="text-gray-600 mb-6">
                  Já tem um MEI? Cadastre sua empresa no sistema para começar a usar nossos serviços.
                </p>
                <button
                  onClick={() => {
                    setShowCadastroForm(true)
                    carregarPlanos()
                  }}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Cadastrar Agora
                </button>
                <p className="text-sm text-gray-500 mt-4">
                  Análise rápida • Gestão completa • Acesso imediato
                </p>
              </div>
            </Card>
          </div>
        )}

          {/* Formulário de Cadastro (se ativado) */}
          {showCadastroForm && (
            <Card title="Cadastrar MEI" className="max-w-6xl mx-auto">
              {/* Campo de Consulta CNPJ */}
              {!dadosReceita && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CNPJ *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formatarCNPJ(cnpjConsulta)}
                      onChange={(e) => setCnpjConsulta(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="00.000.000/0000-00"
                      maxLength={18}
                    />
                    <button
                      type="button"
                      onClick={consultarCNPJ}
                      disabled={loadingConsulta}
                      className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loadingConsulta ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Consultando...
                        </>
                      ) : (
                        <>
                          <Search className="w-5 h-5" />
                          Consulta Cadastral
                        </>
                      )}
                    </button>
                  </div>
                  {errorConsulta && (
                    <div className="mt-3">
                      <Alert type="error">
                        {errorConsulta}
                      </Alert>
                    </div>
                  )}
                </div>
              )}

              {/* Dados da Consulta */}
              {dadosReceita && (
                <form onSubmit={salvarEmpresa} className="space-y-6">
                  {/* Informações da Empresa */}
                  <Card title="Dados da Empresa" className="bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          CNPJ *
                        </label>
                        <input
                          type="text"
                          value={formatarCNPJ(dadosReceita.taxId)}
                          disabled
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Razão Social *
                        </label>
                        <input
                          type="text"
                          value={dadosReceita.company.name}
                          disabled
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nome Fantasia
                        </label>
                        <input
                          type="text"
                          defaultValue={dadosReceita.alias || ''}
                          disabled={!!dadosReceita.alias}
                          className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${
                            dadosReceita.alias
                              ? 'bg-gray-100 text-gray-600 cursor-not-allowed'
                              : 'focus:ring-2 focus:ring-primary-500'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Data de Abertura *
                        </label>
                        <input
                          type="date"
                          value={dadosReceita.founded}
                          disabled
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </Card>

                  {/* Dados do Proprietário (Campos Adicionais) */}
                  <Card title="Dados do Proprietário" className="bg-primary-50 border-2 border-primary-300">
                    <div className="mb-4">
                      <Alert type="info">
                        Estes dados não constam na Receita Federal. Por favor, preencha manualmente.
                      </Alert>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nome Completo do Proprietário *
                        </label>
                        <input
                          type="text"
                          value={nomeProprietario}
                          onChange={(e) => setNomeProprietario(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="Nome completo"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          CPF do Proprietário *
                        </label>
                        <input
                          type="text"
                          value={formatarCPF(cpfProprietario)}
                          onChange={(e) => setCpfProprietario(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="000.000.000-00"
                          maxLength={14}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Data de Nascimento *
                        </label>
                        <input
                          type="date"
                          value={dataNascimento}
                          onChange={(e) => setDataNascimento(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          required
                        />
                      </div>
                    </div>
                  </Card>

                  {/* Informações Adicionais */}
                  <Card title="Informações Adicionais" className="bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Natureza Jurídica
                        </label>
                        <input
                          type="text"
                          value={dadosReceita.company.nature?.text || ''}
                          disabled
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Optante SIMEI
                        </label>
                        <input
                          type="text"
                          value={dadosReceita.company.simei?.optant ? 'Sim' : 'Não'}
                          disabled
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          CNAE Principal
                        </label>
                        <input
                          type="text"
                          value={dadosReceita.mainActivity ? `${dadosReceita.mainActivity.id} - ${dadosReceita.mainActivity.text}` : ''}
                          disabled
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </Card>

                  {/* Endereço */}
                  <Card title="Endereço" className="bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Logradouro *
                        </label>
                        <input
                          type="text"
                          value={dadosReceita.address.street}
                          disabled
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Número *
                        </label>
                        <input
                          type="text"
                          value={dadosReceita.address.number}
                          disabled
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Complemento
                        </label>
                        <input
                          type="text"
                          defaultValue={dadosReceita.address.details || ''}
                          disabled={!!dadosReceita.address.details}
                          className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${
                            dadosReceita.address.details
                              ? 'bg-gray-100 text-gray-600 cursor-not-allowed'
                              : 'focus:ring-2 focus:ring-primary-500'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Bairro *
                        </label>
                        <input
                          type="text"
                          value={dadosReceita.address.district}
                          disabled
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cidade *
                        </label>
                        <input
                          type="text"
                          value={dadosReceita.address.city}
                          disabled
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          UF *
                        </label>
                        <input
                          type="text"
                          value={dadosReceita.address.state}
                          disabled
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          CEP *
                        </label>
                        <input
                          type="text"
                          value={dadosReceita.address.zip}
                          disabled
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </Card>

                  {/* Contato */}
                  <Card title="Contato" className="bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Telefone
                        </label>
                        <input
                          type="text"
                          value={dadosReceita.phones?.[0] ? `(${dadosReceita.phones[0].area}) ${dadosReceita.phones[0].number}` : ''}
                          disabled={!!dadosReceita.phones?.[0]}
                          className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${
                            dadosReceita.phones?.[0]
                              ? 'bg-gray-100 text-gray-600 cursor-not-allowed'
                              : 'focus:ring-2 focus:ring-primary-500'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          defaultValue={dadosReceita.emails?.[0]?.address || ''}
                          disabled={!!dadosReceita.emails?.[0]}
                          className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${
                            dadosReceita.emails?.[0]
                              ? 'bg-gray-100 text-gray-600 cursor-not-allowed'
                              : 'focus:ring-2 focus:ring-primary-500'
                          }`}
                        />
                      </div>
                    </div>
                  </Card>

                  {/* CNAEs Secundários */}
                  {dadosReceita.sideActivities && dadosReceita.sideActivities.length > 0 && (
                    <Card title="CNAEs Secundários" className="bg-gray-50">
                      <div className="space-y-2">
                        {dadosReceita.sideActivities.map((cnae, index) => (
                          <div key={index} className="p-3 bg-white rounded border border-gray-200">
                            <span className="font-medium text-gray-900">{cnae.id}</span>
                            <span className="text-gray-600"> - {cnae.text}</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* Inscrições Estaduais */}
                  {dadosReceita.registrations && dadosReceita.registrations.length > 0 && (
                    <Card title="Inscrições Estaduais" className="bg-gray-50">
                      <div className="space-y-3">
                        {dadosReceita.registrations.map((inscricao, index) => (
                          <div key={index} className="p-4 bg-white rounded border border-gray-200">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div>
                                <span className="text-sm text-gray-600">Número:</span>
                                <p className="font-medium">{inscricao.number}</p>
                              </div>
                              <div>
                                <span className="text-sm text-gray-600">UF:</span>
                                <p className="font-medium">{inscricao.state}</p>
                              </div>
                              <div>
                                <span className="text-sm text-gray-600">Tipo:</span>
                                <p className="font-medium">{inscricao.type.text}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* Seleção de Plano */}
                  <Card title="� Selecione seu Plano" className="bg-gradient-to-br from-primary-50 to-primary-100 border-2 border-primary-300">
                    {loadingPlanos ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                        <span className="ml-3 text-gray-600">Carregando planos...</span>
                      </div>
                    ) : planos.length === 0 ? (
                      <Alert type="warning">
                        Nenhum plano disponível no momento. Entre em contato com o suporte.
                      </Alert>
                    ) : (
                      <>
                        {/* Agrupamento por tipo */}
                        {['mensal', 'semestral', 'anual'].map(tipo => {
                          const planosPorTipo = planos.filter(p => p.tipo?.toLowerCase() === tipo)
                          if (planosPorTipo.length === 0) return null

                          return (
                            <div key={tipo} className="mb-6 last:mb-0">
                              <h3 className="text-lg font-semibold text-gray-900 mb-3 capitalize">
                                Planos {tipo === 'mensal' ? 'Mensais' : tipo === 'semestral' ? 'Semestrais' : 'Anuais'}
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {planosPorTipo.map((plano) => (
                                  <div
                                    key={plano.id}
                                    onClick={() => setPlanoSelecionado(plano.id)}
                                    className={`relative p-6 rounded-lg border-2 cursor-pointer transition-all ${
                                      planoSelecionado === plano.id
                                        ? 'border-primary-600 bg-primary-50 shadow-lg'
                                        : 'border-gray-300 bg-white hover:border-primary-400 hover:shadow-md'
                                    }`}
                                  >
                                    {/* Badge de selecionado */}
                                    {planoSelecionado === plano.id && (
                                      <div className="absolute top-3 right-3 bg-primary-600 text-white rounded-full w-6 h-6 flex items-center justify-center">
                                        ✓
                                      </div>
                                    )}

                                    {/* Nome do plano */}
                                    <h4 className="text-xl font-bold text-gray-900 mb-2">
                                      {plano.nome}
                                    </h4>

                                    {/* Valor */}
                                    <div className="mb-4">
                                      <span className="text-3xl font-bold text-primary-600">
                                        {formatarValor(plano.valor)}
                                      </span>
                                      <span className="text-gray-600 text-sm">
                                        /{tipo === 'mensal' ? 'mês' : tipo === 'semestral' ? 'semestre' : 'ano'}
                                      </span>
                                    </div>

                                    {/* Descrição */}
                                    {plano.descrição && (
                                      <p className="text-sm text-gray-600 leading-relaxed">
                                        {plano.descrição}
                                      </p>
                                    )}

                                    {/* Botão visual */}
                                    <button
                                      type="button"
                                      className={`mt-4 w-full py-2 rounded-lg font-medium transition-colors ${
                                        planoSelecionado === plano.id
                                          ? 'bg-primary-600 text-white'
                                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                      }`}
                                    >
                                      {planoSelecionado === plano.id ? 'Selecionado' : 'Selecionar'}
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        })}

                        {/* Planos sem tipo definido */}
                        {planos.filter(p => !p.tipo || !['mensal', 'semestral', 'anual'].includes(p.tipo?.toLowerCase())).length > 0 && (
                          <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Outros Planos</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {planos
                                .filter(p => !p.tipo || !['mensal', 'semestral', 'anual'].includes(p.tipo?.toLowerCase()))
                                .map((plano) => (
                                  <div
                                    key={plano.id}
                                    onClick={() => setPlanoSelecionado(plano.id)}
                                    className={`relative p-6 rounded-lg border-2 cursor-pointer transition-all ${
                                      planoSelecionado === plano.id
                                        ? 'border-primary-600 bg-primary-50 shadow-lg'
                                        : 'border-gray-300 bg-white hover:border-primary-400 hover:shadow-md'
                                    }`}
                                  >
                                    {planoSelecionado === plano.id && (
                                      <div className="absolute top-3 right-3 bg-primary-600 text-white rounded-full w-6 h-6 flex items-center justify-center">
                                        ✓
                                      </div>
                                    )}
                                    <h4 className="text-xl font-bold text-gray-900 mb-2">{plano.nome}</h4>
                                    <div className="mb-4">
                                      <span className="text-3xl font-bold text-primary-600">
                                        {formatarValor(plano.valor)}
                                      </span>
                                    </div>
                                    {plano.descrição && (
                                      <p className="text-sm text-gray-600 leading-relaxed">{plano.descrição}</p>
                                    )}
                                    <button
                                      type="button"
                                      className={`mt-4 w-full py-2 rounded-lg font-medium transition-colors ${
                                        planoSelecionado === plano.id
                                          ? 'bg-primary-600 text-white'
                                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                      }`}
                                    >
                                      {planoSelecionado === plano.id ? 'Selecionado' : 'Selecionar'}
                                    </button>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}

                        {!planoSelecionado && (
                          <div className="mt-4">
                            <Alert type="info">
                              Selecione um plano para continuar com o cadastro
                            </Alert>
                          </div>
                        )}
                      </>
                    )}
                  </Card>

                  {/* Aceite dos Termos de Uso */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="aceitarTermos"
                        checked={aceitouTermos}
                        onChange={(e) => setAceitouTermos(e.target.checked)}
                        className="mt-1 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <label htmlFor="aceitarTermos" className="text-sm text-gray-700">
                        Li e aceito os{' '}
                        <a href="/termos-de-uso" target="_blank" className="text-primary-600 hover:underline font-medium">
                          Termos de Uso
                        </a>
                        {' '}e{' '}
                        <a href="/politica-privacidade" target="_blank" className="text-primary-600 hover:underline font-medium">
                          Política de Privacidade
                        </a>
                        {' '}dos serviços TopMEI. Confirmo que as informações fornecidas são verdadeiras e estou ciente das responsabilidades do cadastro.
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCadastroForm(false)
                        setDadosReceita(null)
                        setCnpjConsulta('')
                        setNomeProprietario('')
                        setCpfProprietario('')
                        setDataNascimento('')
                        setPlanoSelecionado('')
                        setPlanos([])
                        setAceitouTermos(false)
                      }}
                      className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={!aceitouTermos || loadingConsulta}
                      className={`px-6 py-2 rounded-lg transition-colors ${
                        !aceitouTermos || loadingConsulta
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {loadingConsulta ? 'Cadastrando...' : 'Cadastrar Empresa'}
                    </button>
                  </div>
                </form>
              )}
            </Card>
          )}

          {/* (Informational card removed as requested) */}
        </div>
      </DashboardLayout>
    )
}

