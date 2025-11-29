import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { Building2, FileText, CheckCircle, User, MapPin, FileSignature } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export function AbrirMEI() {
  const { user } = useAuth()

  const [loadingCnaes, setLoadingCnaes] = useState(false)
  const [cnaes, setCnaes] = useState<Array<{ cnae_id: string; ocupacao: string }>>([])
  const [cnaeQuery, setCnaeQuery] = useState('')

  // form state
  const [form, setForm] = useState({
    nome: '',
    data_nascimento: '',
    document_type: 'cpf', // 'cpf' | 'cnh'
    document_number: '',
    rg: '',
    nome_mae: '',
    telefone: '',
    email: '',
    endereco_residencial: '',
    endereco_atividade: '',
    descricao_atividade: '',
    forma_atuacao: '',
    possui_outra_empresa: 'nao',
    govbr_password: '', // note: do not store this server-side in production
  })

  const [selectedCnaes, setSelectedCnaes] = useState<string[]>([])
  const [primaryCnae, setPrimaryCnae] = useState<string>('')
  const [files, setFiles] = useState<Record<string, File | null>>({})
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const requiredDocs = ['cpf', 'rg', 'comprovante_endereco']
  const hasRequiredDocuments = requiredDocs.every(k => !!files[k])

  useEffect(() => {
    // prefill email from logged user
    if (user?.email && !form.email) setForm(prev => ({ ...prev, email: user.email }))

    // load CNAEs from cnaes_mei catalog if available
    const load = async () => {
      setLoadingCnaes(true)
      try {
        const { data, error } = await supabase
          .from('cnaes_mei')
          .select('cnae_id, ocupacao')
          .eq('ativo', true)
          .order('cnae_id', { ascending: true })

        if (error) throw error
        setCnaes((data as any) || [])
      } catch (err) {
        console.error('Erro ao carregar CNAEs:', err)
      } finally {
        setLoadingCnaes(false)
      }
    }
    load()
  }, [])

  const handleChange = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }))

  const handleFile = (key: string, fileList: FileList | null) => {
    setFiles(prev => ({ ...prev, [key]: fileList && fileList.length ? fileList[0] : null }))
  }

  const toggleCnae = (cnae: string) => {
    setSelectedCnaes(prev => (prev.includes(cnae) ? prev.filter(x => x !== cnae) : [...prev, cnae]))
  }

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setMessage(null)
    // basic validation
      if (!form.nome.trim() || !form.document_number.trim() || !form.telefone.trim() || !form.endereco_residencial.trim()) {
        setMessage({ type: 'error', text: 'Preencha os campos obrigatórios (nome, documento, telefone e endereço residencial).' })
      return
    }

    if (!user) {
      setMessage({ type: 'error', text: 'Você precisa estar autenticado para abrir um MEI.' })
      return
    }

    if (selectedCnaes.length === 0 && !primaryCnae && !form.descricao_atividade.trim()) {
      setMessage({ type: 'error', text: 'Escolha pelo menos uma atividade principal, secundária ou descreva o que você fará.' })
      return
    }

    if (!termsAccepted) {
      setMessage({ type: 'error', text: 'Você deve aceitar os Termos e Serviços antes de enviar.' })
      return
    }

    if (!hasRequiredDocuments) {
      const missing = requiredDocs.filter(k => !files[k]).map(k => {
        if (k === 'cpf') return 'Documento (CPF/CNH)'
        if (k === 'rg') return 'RG'
        if (k === 'comprovante_endereco') return 'Comprovante de endereço'
        return k
      })
      setMessage({ type: 'error', text: `Envie os documentos obrigatórios antes de enviar: ${missing.join(', ')}.` })
      return
    }

    setSubmitting(true)
    try {
      // For now we only collect and show the payload. A transactional server-side RPC is recommended.
      const payload = {
          owner_user_id: user.id,
          form,
          primaryCnae,
          selectedCnaes,
            files: Object.keys(files).filter(k => !!files[k]).map(k => ({ key: k, name: files[k]?.name })),
      }
      console.log('AbrirMEI payload:', payload)

      // TODO: call RPC or insert into empresa + cnaes_secundarios in a transaction
      setMessage({ type: 'success', text: 'Dados coletados localmente. Integração server-side pendente.' })
    } catch (err) {
      console.error(err)
      setMessage({ type: 'error', text: 'Erro ao enviar os dados. Veja o console para detalhes.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Abrir um MEI</h1>
          <p className="text-gray-600 mt-1">Preencha o formulário abaixo para iniciar o processo de abertura do MEI.</p>
        </div>

        {message && (
          <Alert type={message.type === 'error' ? 'error' : message.type === 'success' ? 'success' : 'info'}>
            {message.text}
          </Alert>
        )}

        <form onSubmit={submit} className="space-y-6">
          <Card title="1. Dados Pessoais">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome completo *</label>
                <input value={form.nome} onChange={e => handleChange('nome', e.target.value)} className="w-full px-4 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Data de nascimento</label>
                <input type="date" value={form.data_nascimento} onChange={e => handleChange('data_nascimento', e.target.value)} className="w-full px-4 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Documento *</label>
                <div className="flex gap-2">
                  <select value={form.document_type} onChange={e => handleChange('document_type', e.target.value)} className="px-3 py-2 border rounded w-36">
                    <option value="cpf">CPF</option>
                    <option value="cnh">CNH</option>
                  </select>
                  <input placeholder={form.document_type === 'cpf' ? '000.000.000-00' : 'Número da CNH'} value={form.document_number} onChange={e => handleChange('document_number', e.target.value)} className="flex-1 px-4 py-2 border rounded" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">RG ou CNH</label>
                <input value={form.rg} onChange={e => handleChange('rg', e.target.value)} className="w-full px-4 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome da mãe</label>
                <input value={form.nome_mae} onChange={e => handleChange('nome_mae', e.target.value)} className="w-full px-4 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Telefone de contato *</label>
                <input value={form.telefone} onChange={e => handleChange('telefone', e.target.value)} className="w-full px-4 py-2 border rounded" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">E-mail de contato</label>
                <input value={form.email} onChange={e => handleChange('email', e.target.value)} className="w-full px-4 py-2 border rounded" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Endereço residencial completo *</label>
                <input value={form.endereco_residencial} onChange={e => handleChange('endereco_residencial', e.target.value)} className="w-full px-4 py-2 border rounded" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Endereço onde a atividade será exercida</label>
                <input value={form.endereco_atividade} onChange={e => handleChange('endereco_atividade', e.target.value)} className="w-full px-4 py-2 border rounded" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Descrição do que você vai vender / produzir / prestar</label>
                <textarea value={form.descricao_atividade} onChange={e => handleChange('descricao_atividade', e.target.value)} className="w-full px-4 py-2 border rounded" rows={4} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Atividade principal (opcional)</label>
                <div className="mt-1">
                  <select value={primaryCnae} onChange={e => setPrimaryCnae(e.target.value)} className="w-full px-4 py-2 border rounded">
                    <option value="">-- Selecionar atividade principal --</option>
                    {cnaes.map(c => (
                      <option key={c.cnae_id} value={c.cnae_id}>{c.cnae_id} — {c.ocupacao}</option>
                    ))}
                  </select>
                </div>

                <label className="block text-sm font-medium text-gray-700 mt-4">Atividades secundárias (pesquise e selecione)</label>
                <div className="mt-2 mb-2">
                  <input placeholder="Buscar CNAE ou descrição" value={cnaeQuery} onChange={e => setCnaeQuery(e.target.value)} className="w-full px-3 py-2 border rounded" />
                  <div className="text-xs text-gray-500 mt-1">Selecionados: {selectedCnaes.length}</div>
                </div>

                <div className="border rounded p-2 max-h-48 overflow-auto">
                  {loadingCnaes ? (
                    <div>Carregando atividades...</div>
                  ) : (
                    cnaes.filter(c => {
                      const q = cnaeQuery.trim().toLowerCase()
                      if (!q) return true
                      return c.cnae_id.includes(q) || c.ocupacao.toLowerCase().includes(q)
                    }).map(c => (
                      <label key={c.cnae_id} className="flex items-center gap-2 py-1">
                        <input type="checkbox" checked={selectedCnaes.includes(c.cnae_id)} onChange={() => toggleCnae(c.cnae_id)} disabled={primaryCnae === c.cnae_id} />
                        <span className="text-sm">{c.cnae_id} — {c.ocupacao}{primaryCnae === c.cnae_id ? ' (selecionada como principal)' : ''}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Você já possui outra empresa? *</label>
                <select value={form.possui_outra_empresa} onChange={e => handleChange('possui_outra_empresa', e.target.value)} className="w-full px-4 py-2 border rounded">
                  <option value="nao">Não</option>
                  <option value="sim">Sim</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Forma de atuação</label>
                <input value={form.forma_atuacao} onChange={e => handleChange('forma_atuacao', e.target.value)} className="w-full px-4 py-2 border rounded" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Senha Gov.br (temporária recomendada)</label>
                <input type="password" value={form.govbr_password} onChange={e => handleChange('govbr_password', e.target.value)} className="w-full px-4 py-2 border rounded" />
                <p className="text-xs text-gray-500 mt-1">Se for necessário informar a senha, use uma senha temporária para o processo de abertura e altere-a após a finalização. Não armazene senhas sensíveis no sistema.</p>
              </div>
            </div>
          </Card>

          <Card title="2. Documentos (envie fotos legíveis)">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">RG (frente/verso)</label>
                <input type="file" accept="image/*,application/pdf" onChange={e => handleFile('rg', e.target.files)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Documento (CPF/CNH)</label>
                <input type="file" accept="image/*,application/pdf" onChange={e => handleFile('cpf', e.target.files)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Comprovante de endereço</label>
                <input type="file" accept="image/*,application/pdf" onChange={e => handleFile('comprovante_endereco', e.target.files)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Título de eleitor (opcional)</label>
                <input type="file" accept="image/*,application/pdf" onChange={e => handleFile('titulo', e.target.files)} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Selfie segurando o documento (se solicitado)</label>
                <input type="file" accept="image/*" onChange={e => handleFile('selfie', e.target.files)} />
              </div>
            </div>
          </Card>

          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => window.history.back()} className="px-6 py-2 border rounded">Cancelar</button>
            <div className="flex items-center mr-4">
              <input id="terms" type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)} className="mr-2" />
              <label htmlFor="terms" className="text-sm text-gray-700">Li e aceito os <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary-600 underline">Termos e Serviços</a></label>
            </div>
            <button type="submit" disabled={submitting || !termsAccepted || !hasRequiredDocuments} className="px-6 py-2 bg-primary-600 text-white rounded">
              {submitting ? 'Enviando...' : 'Enviar solicitação'}
            </button>
          </div>
        </form>

        <Card title="Links Oficiais">
          <div className="space-y-3">
            <a href="https://www.gov.br/mei" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary-600 hover:underline">
              <FileText className="w-4 h-4" /> Portal do Empreendedor (gov.br/mei)
            </a>
            <a href="https://www.gov.br/empresas-e-negocios/pt-br/empreendedor" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary-600 hover:underline">
              <FileText className="w-4 h-4" /> Guia Completo do MEI
            </a>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
