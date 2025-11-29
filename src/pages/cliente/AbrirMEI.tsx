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
    // documentos
    document_number: '', // CPF
    rg: '',
    nome_mae: '',
    telefone: '',
    email: '',
    // endereço residencial (segregado)
    endereco_logradouro: '',
    endereco_numero: '',
    endereco_bairro: '',
    endereco_cep: '',
    endereco_cidade: '',
    endereco_estado: '',
    // endereço onde a atividade será exercida (segregado)
    atividade_logradouro: '',
    atividade_numero: '',
    atividade_bairro: '',
    atividade_cep: '',
    atividade_cidade: '',
    atividade_estado: '',
    usar_mesmo_endereco: true,
    descricao_atividade: '',
    forma_atuacao: '',
    possui_outra_empresa: 'nao',
    govbr_password: '', // note: do not store this server-side in production
    // novos campos
    titulo_eleitor: '',
    recibo_irpf: '',
  })

  const [selectedCnaes, setSelectedCnaes] = useState<string[]>([])
  const [primaryCnae, setPrimaryCnae] = useState<string>('')
  const [primaryQuery, setPrimaryQuery] = useState('')
  const [files, setFiles] = useState<Record<string, File | null>>({})
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)
  const [termsAccepted, setTermsAccepted] = useState(false)
  // Required documents evaluation will depend on whether activity address uses the same residential address
  const requiredDocsBase = ['cpf', 'rg_frente', 'rg_verso', 'comprovante_endereco_residencial']
  const hasRequiredDocuments = () => {
    const required = [...requiredDocsBase]
    if (!form.usar_mesmo_endereco) required.push('comprovante_endereco_atividade')
    return required.every(k => !!files[k])
  }

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

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 2) return digits
    const ddd = digits.slice(0, 2)
    const rest = digits.slice(2)
    if (rest.length <= 4) return `(${ddd}) ${rest}`
    if (rest.length <= 8) return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`
    // 9-digit subscriber (common): 5 + 4
    return `(${ddd}) ${rest.slice(0, rest.length - 4)}-${rest.slice(-4)}`
  }

  const handlePhoneChange = (raw: string) => {
    const formatted = formatPhone(raw)
    handleChange('telefone', formatted)
  }

  const handleFile = (key: string, fileList: FileList | null) => {
    setFiles(prev => ({ ...prev, [key]: fileList && fileList.length ? fileList[0] : null }))
  }

  const toggleCnae = (cnae: string) => {
    setSelectedCnaes(prev => (prev.includes(cnae) ? prev.filter(x => x !== cnae) : [...prev, cnae]))
  }

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setMessage(null)
    // basic validation: all fields required
    const requiredFields = [
      'nome', 'data_nascimento', 'document_number', 'rg', 'nome_mae', 'telefone', 'email',
      'endereco_logradouro', 'endereco_numero', 'endereco_bairro', 'endereco_cep', 'endereco_cidade', 'endereco_estado',
      'descricao_atividade', 'forma_atuacao', 'govbr_password', 'titulo_eleitor', 'recibo_irpf'
    ]
    for (const f of requiredFields) {
      // @ts-ignore
      if (!form[f] || (typeof form[f] === 'string' && !form[f].toString().trim())) {
        setMessage({ type: 'error', text: 'Preencha todos os campos obrigatórios.' })
        return
      }
    }

    // validação de telefone com DDD
    const telefoneDigits = (form.telefone || '').toString().replace(/\D/g, '')
    const validPhone = telefoneDigits.length === 10 || telefoneDigits.length === 11
    if (!validPhone) {
      setMessage({ type: 'error', text: 'Informe um telefone válido com DDD (ex: (99) 99999-9999).' })
      return
    }

    if (!user) {
      setMessage({ type: 'error', text: 'Você precisa estar autenticado para abrir um MEI.' })
      return
    }

    if (!primaryCnae) {
      setMessage({ type: 'error', text: 'Escolha uma atividade principal antes de enviar.' })
      return
    }

    if (!termsAccepted) {
      setMessage({ type: 'error', text: 'Você deve aceitar os Termos e Serviços antes de enviar.' })
      return
    }

    if (!hasRequiredDocuments()) {
      const required = [...requiredDocsBase]
      if (!form.usar_mesmo_endereco) required.push('comprovante_endereco_atividade')
      const missing = required.filter(k => !files[k]).map(k => {
        if (k === 'cpf') return 'Documento (CPF)'
        if (k === 'rg_frente') return 'RG (frente)'
        if (k === 'rg_verso') return 'RG (verso)'
        if (k === 'comprovante_endereco_residencial') return 'Comprovante de endereço (residencial)'
        if (k === 'comprovante_endereco_atividade') return 'Comprovante de endereço (atividade)'
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

  // Verifica se todos os campos obrigatórios e documentos foram preenchidos (usado para habilitar o botão)
  const isFormComplete = () => {
    const requiredFields = [
      'nome', 'data_nascimento', 'document_number', 'rg', 'nome_mae', 'telefone', 'email',
      'endereco_logradouro', 'endereco_numero', 'endereco_bairro', 'endereco_cep', 'endereco_cidade', 'endereco_estado',
      'descricao_atividade', 'forma_atuacao', 'govbr_password', 'titulo_eleitor', 'recibo_irpf'
    ]
    for (const f of requiredFields) {
      // @ts-ignore
      if (!form[f] || (typeof form[f] === 'string' && !form[f].toString().trim())) return false
    }

    if (!primaryCnae) return false

    if (!hasRequiredDocuments()) return false

    // telefone validation
    const telefoneDigits = (form.telefone || '').toString().replace(/\D/g, '')
    if (!(telefoneDigits.length === 10 || telefoneDigits.length === 11)) return false

    return true
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
                <label className="block text-sm font-medium text-gray-700">Data de nascimento *</label>
                <input type="date" value={form.data_nascimento} onChange={e => handleChange('data_nascimento', e.target.value)} className="w-full px-4 py-2 border rounded" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">CPF *</label>
                <input placeholder="000.000.000-00" value={form.document_number} onChange={e => handleChange('document_number', e.target.value)} className="w-full px-4 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">RG ou CNI *</label>
                <input value={form.rg} onChange={e => handleChange('rg', e.target.value)} className="w-full px-4 py-2 border rounded" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Nome da mãe *</label>
                <input value={form.nome_mae} onChange={e => handleChange('nome_mae', e.target.value)} className="w-full px-4 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Telefone de contato *</label>
                <input value={form.telefone} onChange={e => handlePhoneChange(e.target.value)} placeholder="(99) 9XXXX-XXXX" className="w-full px-4 py-2 border rounded" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">E-mail de contato *</label>
                <input value={form.email} onChange={e => handleChange('email', e.target.value)} className="w-full px-4 py-2 border rounded" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Endereço residencial - Logradouro *</label>
                <input value={form.endereco_logradouro} onChange={e => handleChange('endereco_logradouro', e.target.value)} className="w-full px-4 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Número *</label>
                <input value={form.endereco_numero} onChange={e => handleChange('endereco_numero', e.target.value)} className="w-full px-4 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Bairro *</label>
                <input value={form.endereco_bairro} onChange={e => handleChange('endereco_bairro', e.target.value)} className="w-full px-4 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">CEP *</label>
                <input value={form.endereco_cep} onChange={e => handleChange('endereco_cep', e.target.value)} className="w-full px-4 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Cidade *</label>
                <input value={form.endereco_cidade} onChange={e => handleChange('endereco_cidade', e.target.value)} className="w-full px-4 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Estado *</label>
                <input value={form.endereco_estado} onChange={e => handleChange('endereco_estado', e.target.value)} className="w-full px-4 py-2 border rounded" />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <input type="checkbox" checked={form.usar_mesmo_endereco} onChange={e => handleChange('usar_mesmo_endereco', e.target.checked)} className="mr-2" />
                  Usar o mesmo endereço residencial para a atividade
                </label>
              </div>

              {!form.usar_mesmo_endereco && (
                <>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Endereço da atividade - Logradouro *</label>
                    <input value={form.atividade_logradouro} onChange={e => handleChange('atividade_logradouro', e.target.value)} className="w-full px-4 py-2 border rounded" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Número *</label>
                    <input value={form.atividade_numero} onChange={e => handleChange('atividade_numero', e.target.value)} className="w-full px-4 py-2 border rounded" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Bairro *</label>
                    <input value={form.atividade_bairro} onChange={e => handleChange('atividade_bairro', e.target.value)} className="w-full px-4 py-2 border rounded" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">CEP *</label>
                    <input value={form.atividade_cep} onChange={e => handleChange('atividade_cep', e.target.value)} className="w-full px-4 py-2 border rounded" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Cidade *</label>
                    <input value={form.atividade_cidade} onChange={e => handleChange('atividade_cidade', e.target.value)} className="w-full px-4 py-2 border rounded" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Estado *</label>
                    <input value={form.atividade_estado} onChange={e => handleChange('atividade_estado', e.target.value)} className="w-full px-4 py-2 border rounded" />
                  </div>
                </>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Descrição do que você vai vender / produzir / prestar *</label>
                <textarea value={form.descricao_atividade} onChange={e => handleChange('descricao_atividade', e.target.value)} className="w-full px-4 py-2 border rounded" rows={4} />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Atividade principal *</label>
                <div className="mt-1 relative">
                  {primaryCnae ? (
                    <div className="flex items-center justify-between p-2 border rounded">
                      <div className="text-sm">{primaryCnae} — {cnaes.find(c => c.cnae_id === primaryCnae)?.ocupacao || ''}</div>
                      <button type="button" onClick={() => { setPrimaryCnae(''); setPrimaryQuery('') }} className="text-sm text-primary-600">Remover</button>
                    </div>
                  ) : (
                    <>
                      <input
                        value={primaryQuery}
                        onChange={e => setPrimaryQuery(e.target.value)}
                        placeholder="Buscar CNAE ou descrição"
                        className="w-full px-3 py-2 border rounded"
                      />
                      <div className="absolute z-10 bg-white border rounded mt-1 w-full max-h-48 overflow-auto">
                        {cnaes.filter(c => {
                          const q = primaryQuery.trim().toLowerCase()
                          if (!q) return true
                          return c.cnae_id.includes(q) || c.ocupacao.toLowerCase().includes(q)
                        }).slice(0, 50).map(c => (
                          <div key={c.cnae_id} className="px-3 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => { setPrimaryCnae(c.cnae_id); setPrimaryQuery('') }}>
                            <div className="text-sm">{c.cnae_id} — {c.ocupacao}</div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <label className="block text-sm font-medium text-gray-700 mt-4">Atividades secundárias (pesquise e selecione) — máximo 15</label>
                <div className="mt-2 mb-2">
                  <input placeholder="Buscar CNAE ou descrição" value={cnaeQuery} onChange={e => setCnaeQuery(e.target.value)} className="w-full px-3 py-2 border rounded" />
                  <div className="text-xs text-gray-500 mt-1">Selecionados: {selectedCnaes.length} / 15</div>
                </div>

                <div className="border rounded p-2 max-h-48 overflow-auto">
                  {loadingCnaes ? (
                    <div>Carregando atividades...</div>
                  ) : (
                    cnaes.filter(c => {
                      const q = cnaeQuery.trim().toLowerCase()
                      if (!q) return true
                      return c.cnae_id.includes(q) || c.ocupacao.toLowerCase().includes(q)
                    }).map(c => {
                      const disabled = !selectedCnaes.includes(c.cnae_id) && selectedCnaes.length >= 15
                      return (
                        <label key={c.cnae_id} className="flex items-center gap-2 py-1">
                          <input type="checkbox" checked={selectedCnaes.includes(c.cnae_id)} onChange={() => toggleCnae(c.cnae_id)} disabled={primaryCnae === c.cnae_id || disabled} />
                          <span className="text-sm">{c.cnae_id} — {c.ocupacao}{primaryCnae === c.cnae_id ? ' (selecionada como principal)' : ''}</span>
                        </label>
                      )
                    })
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
                <label className="block text-sm font-medium text-gray-700">Forma de atuação *</label>
                <input value={form.forma_atuacao} onChange={e => handleChange('forma_atuacao', e.target.value)} className="w-full px-4 py-2 border rounded" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Senha Gov.br (temporária recomendada) *</label>
                <input
                  type="text"
                  name="govbr_password"
                  autoComplete="new-password"
                  value={form.govbr_password}
                  onChange={e => handleChange('govbr_password', e.target.value)}
                  className="w-full px-4 py-2 border rounded"
                />
                <p className="text-xs text-gray-500 mt-1">* Recomendamos que crie uma senha temporária exclusivamente para este processo de abertura e a altere imediatamente após a finalização. Não armazene senhas sensíveis no sistema.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Título de eleitor (número) *</label>
                <input value={form.titulo_eleitor} onChange={e => handleChange('titulo_eleitor', e.target.value)} className="w-full px-4 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Número do recibo da última declaração do IRPF *</label>
                <input value={form.recibo_irpf} onChange={e => handleChange('recibo_irpf', e.target.value)} className="w-full px-4 py-2 border rounded" />
              </div>
            </div>
          </Card>

          <Card title="2. Documentos (envie fotos legíveis)">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">RG ou CNI (frente) *</label>
                <input type="file" accept="image/*,application/pdf" onChange={e => handleFile('rg_frente', e.target.files)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">RG ou CNI (verso) *</label>
                <input type="file" accept="image/*,application/pdf" onChange={e => handleFile('rg_verso', e.target.files)} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">CPF (documento) *</label>
                <input type="file" accept="image/*,application/pdf" onChange={e => handleFile('cpf', e.target.files)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">CNH (opcional)</label>
                <input type="file" accept="image/*,application/pdf" onChange={e => handleFile('cnh', e.target.files)} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Comprovante de endereço (residencial) *</label>
                <input type="file" accept="image/*,application/pdf" onChange={e => handleFile('comprovante_endereco_residencial', e.target.files)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Comprovante de endereço (atividade) {form.usar_mesmo_endereco ? '(se diferente)' : '*'}</label>
                <input type="file" accept="image/*,application/pdf" onChange={e => handleFile('comprovante_endereco_atividade', e.target.files)} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Título de eleitor (opcional)</label>
                <input type="file" accept="image/*,application/pdf" onChange={e => handleFile('titulo', e.target.files)} />
              </div>

              
            </div>
          </Card>

          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => window.history.back()} className="px-6 py-2 border rounded">Cancelar</button>
            <div className="flex items-center mr-4">
              <input id="terms" type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)} className="mr-2" />
              <label htmlFor="terms" className="text-sm text-gray-700">Li e aceito os <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary-600 underline">Termos e Serviços</a></label>
            </div>
            <button type="submit" disabled={submitting || !termsAccepted || !isFormComplete()} className="px-6 py-2 bg-primary-600 text-white rounded">
              {submitting ? 'Enviando...' : 'Enviar solicitação'}
            </button>
          </div>
        </form>

        <Card title="Aviso importante">
          <div className="space-y-3 text-sm text-gray-700">
            <p>
              A abertura de MEI envolve obrigações fiscais e legais que, se tratadas incorretamente,
              podem gerar retrabalho, multas ou problemas com a Receita. Por isso recomendamos que
              este procedimento seja conduzido por profissionais especializados.
            </p>
            <p>
              A TopMEI disponibiliza uma equipe experiente para orientar e executar todo o processo de
              abertura: conferimos e organizamos seus documentos, preparamos a solicitação, submetemos
              o registro e orientamos sobre as responsabilidades fiscais e previdenciárias seguintes.
            </p>
            <p>
              Contratar o serviço profissional da TopMEI reduz riscos, economiza tempo e garante que
              sua abertura seja feita com segurança e conformidade.
            </p>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
