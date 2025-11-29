import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useEmpresasUsuario } from '@/hooks/useEmpresa'
import { FileText, ChevronDown, ChevronUp } from 'lucide-react'

type Pergunta = {
  id: string
  uuid?: string
  pilar: string
  pergunta_principal: string
  pontos?: number
  explicacao?: string
  exemplos_sim?: string
  exemplos_nao?: string
  diferenciacoes?: string
  pergunta_se_nao?: string
  prazos_opcoes?: any
  ordem?: number
  ativo?: boolean
}

export default function ProsperaMEI() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [perguntas, setPerguntas] = useState<Pergunta[]>([])
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)

  // answers state keyed by empresaId::perguntaId
  const [answers, setAnswers] = useState<Record<string, { resposta?: 'sim' | 'nao'; prazo?: string; plano?: string }>>({})
  

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('perguntas')
          .select('*')
          .eq('ativo', true)
          .order('pilar', { ascending: true })
          .order('ordem', { ascending: true })

        if (error) throw error
        const rows = (data as any) || []
        console.log('Perguntas carregadas:', rows.length, rows)
        setPerguntas(rows)
        if (!rows.length) {
          setMessage({ type: 'info', text: 'Nenhuma pergunta ativa encontrada.' })
        }
      } catch (err: any) {
        // Serialize error for richer logging
        try {
          console.error('Erro ao carregar perguntas (detalhes):', JSON.stringify(err, Object.getOwnPropertyNames(err), 2))
        } catch (e) {
          console.error('Erro ao carregar perguntas (detalhes):', err)
        }

        

        // If supabase error object has status/details, show them
        const status = err?.status || err?.statusCode
        const details = err?.details || err?.message || err?.hint || JSON.stringify(err)

        const dev = typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.DEV
        const userMessage = dev
          ? `Erro ao carregar perguntas: status=${status} message=${details}`
          : 'Erro ao carregar perguntas. Tente novamente.'

        setMessage({ type: 'error', text: userMessage })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const groupByPilar = () => {
    const map = new Map<string, Pergunta[]>()
    perguntas.forEach(p => {
      const key = p.pilar || 'Geral'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(p)
    })
    return map
  }

  const onAnswer = (id: string, value: 'sim' | 'nao') => {
    setAnswers(prev => ({ ...prev, [id]: { ...(prev[id] || {}), resposta: value } }))
  }

  const onPrazo = (id: string, prazo: string) => {
    setAnswers(prev => ({ ...prev, [id]: { ...(prev[id] || {}), prazo } }))
  }

  const onPlano = (id: string, plano: string) => {
    setAnswers(prev => ({ ...prev, [id]: { ...(prev[id] || {}), plano } }))
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    // For now just validate and print payload. Persistence will be added later.
    const payload = {
      user_id: user?.id,
      timestamp: new Date().toISOString(),
      respostas: answers,
    }
    console.log('ProsperaMEI respostas:', payload)
    setMessage({ type: 'success', text: 'Respostas coletadas localmente. Implementaremos armazenamento em seguida.' })
  }

  const grouped = groupByPilar()
  const [pilarOpen, setPilarOpen] = useState<Record<string, boolean>>({})
  const [helpOpen, setHelpOpen] = useState<Record<string, boolean>>({})

  const togglePilar = (pilar: string) => {
    setPilarOpen(prev => ({ ...prev, [pilar]: !prev[pilar] }))
  }

  const toggleHelp = (id: string) => {
    setHelpOpen(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // empresas do usuário
  const { empresas, loading: loadingEmpresas } = useEmpresasUsuario(user?.id)
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const toggleCard = (empresaId: string) => setExpandedCard(prev => (prev === empresaId ? null : empresaId))

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Prospera MEI</h1>
          <p className="text-gray-600 mt-1">Prospera MEI: O diagnóstico que transforma negócios. Avalie seu negócio em 6 pilares essenciais, receba um score de maturidade com recomendações específicas e construa um plano de ação priorizado. Em 15 minutos, você terá clareza total do caminho para a próxima fase do seu MEI.</p>
        </div>

        

        {message && (
          <Alert type={message.type === 'error' ? 'error' : message.type === 'success' ? 'success' : 'info'}>
            {message.text}
          </Alert>
        )}

        {empresas && empresas.length > 0 ? (
          <div className="space-y-4">
            {empresas.map(empresa => (
              <Card key={empresa.id}>
                <div>
                  <button
                    onClick={() => toggleCard(empresa.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-6 h-6 text-primary-600" />
                      <div className="text-left">
                        <h3 className="font-semibold text-gray-900">{empresa.razao_social || empresa.nome_fantasia}</h3>
                        <p className="text-sm text-gray-600">CNPJ: {empresa.cnpj || 'Não informado'}</p>
                      </div>
                    </div>
                    <div>
                      {expandedCard === empresa.id ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {expandedCard === empresa.id && (
                    <div className="border-t border-gray-200 p-4 space-y-4">
                      <form onSubmit={(e) => { e.preventDefault(); console.log('Salvar respostas para', empresa.id) }} className="space-y-6">
                        <div className="grid grid-cols-1 gap-4">
                          {Array.from(grouped.entries()).map(([pilar, itens]) => (
                            <Card key={`${empresa.id}::${pilar}`} title={pilar} className="min-h-[120px]">
                              <div className="flex items-center justify-between mb-3">
                                <div className="text-sm text-gray-600">Perguntas: {itens.length}</div>
                                <button type="button" onClick={() => togglePilar(`${empresa.id}::${pilar}`)} className="text-xs px-2 py-1 border rounded text-gray-700">
                                  {pilarOpen[`${empresa.id}::${pilar}`] ? 'Recolher' : 'Expandir'}
                                </button>
                              </div>
                              {pilarOpen[`${empresa.id}::${pilar}`] === true && (
                                <div className="space-y-4">
                                  {itens.map(item => {
                                    let prazos: string[] = []
                                    try {
                                      if (item.prazos_opcoes) prazos = typeof item.prazos_opcoes === 'string' ? JSON.parse(item.prazos_opcoes) : item.prazos_opcoes
                                    } catch (e) {
                                      prazos = []
                                    }

                                    const key = `${empresa.id}::${item.id}`
                                    const ans = answers[key] || {}
                                    return (
                                      <div key={item.id} className="border rounded p-3">
                                        <div className="flex justify-between items-start">
                                          <div>
                                            <div className="font-medium text-gray-800 flex items-center gap-3">
                                              {item.pergunta_principal}
                                              {typeof item.pontos === 'number' && (
                                                <span className="ml-2 inline-block text-xs bg-primary-100 text-primary-800 px-2 py-0.5 rounded">{item.pontos} pts</span>
                                              )}
                                            </div>
                                            {item.explicacao && <div className="text-xs text-gray-500 mt-1">{item.explicacao}</div>}
                                          </div>
                                          <div className="flex items-center gap-3">
                                            <button
                                              type="button"
                                              onClick={() => toggleHelp(`${empresa.id}::${item.id}`)}
                                              title="Ajuda — exemplos Sim / Não"
                                              aria-expanded={!!helpOpen[`${empresa.id}::${item.id}`]}
                                              className="p-1 rounded border hover:bg-gray-100"
                                            >
                                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-gray-700">
                                                <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm.75 15a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 7a2.25 2.25 0 00-2.25 2.25v.5a.75.75 0 01-1.5 0v-.5A3.75 3.75 0 0113.5 6.5a3.75 3.75 0 01.75 7.432v.068a.75.75 0 01-1.5 0v-.068A2.25 2.25 0 0012.75 7z" />
                                              </svg>
                                            </button>
                                            <label className="flex items-center gap-2">
                                              <input type="radio" name={`p_${key}`} checked={ans.resposta === 'sim'} onChange={() => setAnswers(prev => ({ ...prev, [key]: { ...(prev[key] || {}), resposta: 'sim' } }))} />
                                              <span className="text-sm">Sim</span>
                                            </label>
                                            <label className="flex items-center gap-2">
                                              <input type="radio" name={`p_${key}`} checked={ans.resposta === 'nao'} onChange={() => setAnswers(prev => ({ ...prev, [key]: { ...(prev[key] || {}), resposta: 'nao' } }))} />
                                              <span className="text-sm">Não</span>
                                            </label>
                                          </div>
                                        </div>

                                        {helpOpen[`${empresa.id}::${item.id}`] && (
                                          <div className="mt-2 p-2 bg-gray-50 border rounded text-sm text-gray-700">
                                            {item.exemplos_sim && (
                                              <div className="mb-2">
                                                <div className="font-medium text-xs">Exemplos (Sim):</div>
                                                <div className="text-xs mt-1">{item.exemplos_sim}</div>
                                              </div>
                                            )}
                                            {item.exemplos_nao && (
                                              <div>
                                                <div className="font-medium text-xs">Exemplos (Não):</div>
                                                <div className="text-xs mt-1">{item.exemplos_nao}</div>
                                              </div>
                                            )}
                                          </div>
                                        )}

                                        {ans.resposta === 'nao' && (
                                          <div className="mt-3 space-y-2">
                                            {item.pergunta_se_nao && <div className="text-sm font-medium">{item.pergunta_se_nao}</div>}
                                            {prazos.length > 0 && (
                                              <select value={ans.prazo || ''} onChange={e => setAnswers(prev => ({ ...prev, [key]: { ...(prev[key] || {}), prazo: e.target.value } }))} className="w-full px-3 py-2 border rounded">
                                                <option value="">-- Escolha um prazo para plano de ação --</option>
                                                {prazos.map(p => (
                                                  <option key={p} value={p}>{p}</option>
                                                ))}
                                              </select>
                                            )}
                                            <textarea placeholder="Descreva o plano de ação" value={ans.plano || ''} onChange={e => setAnswers(prev => ({ ...prev, [key]: { ...(prev[key] || {}), plano: e.target.value } }))} className="w-full px-3 py-2 border rounded" rows={3} />
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </Card>
                          ))}
                        </div>

                        <div className="flex justify-end">
                          <button type="submit" className="px-6 py-2 bg-primary-600 text-white rounded">Salvar respostas</button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              {Array.from(grouped.entries()).map(([pilar, itens]) => (
                <Card key={pilar} title={pilar} className="min-h-[200px]">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm text-gray-600">Perguntas: {itens.length}</div>
                    <button type="button" onClick={() => togglePilar(pilar)} className="text-xs px-2 py-1 border rounded text-gray-700">
                      {pilarOpen[pilar] ? 'Recolher' : 'Expandir'}
                    </button>
                  </div>
                  {pilarOpen[pilar] === true && (
                    <div className="space-y-4">
                      {itens.map(item => {
                        let prazos: string[] = []
                        try {
                          if (item.prazos_opcoes) prazos = typeof item.prazos_opcoes === 'string' ? JSON.parse(item.prazos_opcoes) : item.prazos_opcoes
                        } catch (e) {
                          prazos = []
                        }

                        const ans = answers[item.id] || {}
                        return (
                          <div key={item.id} className="border rounded p-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium text-gray-800 flex items-center gap-3">
                                  {item.pergunta_principal}
                                  {typeof item.pontos === 'number' && (
                                    <span className="ml-2 inline-block text-xs bg-primary-100 text-primary-800 px-2 py-0.5 rounded">{item.pontos} pts</span>
                                  )}
                                </div>
                                {item.explicacao && <div className="text-xs text-gray-500 mt-1">{item.explicacao}</div>}
                              </div>
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => toggleHelp(item.id)}
                                  title="Ajuda — exemplos Sim / Não"
                                  aria-expanded={!!helpOpen[item.id]}
                                  className="p-1 rounded border hover:bg-gray-100"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-gray-700">
                                    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm.75 15a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 7a2.25 2.25 0 00-2.25 2.25v.5a.75.75 0 01-1.5 0v-.5A3.75 3.75 0 0113.5 6.5a3.75 3.75 0 01.75 7.432v.068a.75.75 0 01-1.5 0v-.068A2.25 2.25 0 0012.75 7z" />
                                  </svg>
                                </button>
                                <label className="flex items-center gap-2">
                                  <input type="radio" name={`p_${item.id}`} checked={ans.resposta === 'sim'} onChange={() => onAnswer(item.id, 'sim')} />
                                  <span className="text-sm">Sim</span>
                                </label>
                                <label className="flex items-center gap-2">
                                  <input type="radio" name={`p_${item.id}`} checked={ans.resposta === 'nao'} onChange={() => onAnswer(item.id, 'nao')} />
                                  <span className="text-sm">Não</span>
                                </label>
                              </div>
                            </div>

                            {helpOpen[item.id] && (
                              <div className="mt-2 p-2 bg-gray-50 border rounded text-sm text-gray-700">
                                {item.exemplos_sim && (
                                  <div className="mb-2">
                                    <div className="font-medium text-xs">Exemplos (Sim):</div>
                                    <div className="text-xs mt-1">{item.exemplos_sim}</div>
                                  </div>
                                )}
                                {item.exemplos_nao && (
                                  <div>
                                    <div className="font-medium text-xs">Exemplos (Não):</div>
                                    <div className="text-xs mt-1">{item.exemplos_nao}</div>
                                  </div>
                                )}
                              </div>
                            )}

                            {ans.resposta === 'nao' && (
                              <div className="mt-3 space-y-2">
                                {item.pergunta_se_nao && <div className="text-sm font-medium">{item.pergunta_se_nao}</div>}
                                {prazos.length > 0 && (
                                  <select value={ans.prazo || ''} onChange={e => onPrazo(item.id, e.target.value)} className="w-full px-3 py-2 border rounded">
                                    <option value="">-- Escolha um prazo para plano de ação --</option>
                                    {prazos.map(p => (
                                      <option key={p} value={p}>{p}</option>
                                    ))}
                                  </select>
                                )}
                                <textarea placeholder="Descreva o plano de ação" value={ans.plano || ''} onChange={e => onPlano(item.id, e.target.value)} className="w-full px-3 py-2 border rounded" rows={3} />
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </Card>
              ))}

              <div className="flex justify-end">
                <button type="submit" className="px-6 py-2 bg-primary-600 text-white rounded">Salvar respostas</button>
              </div>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  )
}
