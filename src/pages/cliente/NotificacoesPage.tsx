import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Bell, 
  Check, 
  Trash2, 
  Eye,
  AlertCircle,
  CheckCircle,
  Info,
  ExternalLink
} from 'lucide-react'

interface Notificacao {
  id: string
  user_id: string
  created_at: string
  titulo: string
  mensagem: string
  visualizado: boolean
  dt_visualizacao: string | null
  lida: boolean
  data_leitura: string | null
  link: string | null
  tipo: string | null
}

export function NotificacoesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [filtro, setFiltro] = useState<'todas' | 'nao_lidas' | 'lidas'>('todas')

  useEffect(() => {
    if (user) {
      carregarNotificacoes()
    }
  }, [user])

  const carregarNotificacoes = async () => {
    try {
      setLoading(true)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('notificacao') as any)
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setNotificacoes(data || [])
    } catch (err: any) {
      console.error('Erro ao carregar notificações:', err)
      setError('Erro ao carregar notificações')
    } finally {
      setLoading(false)
    }
  }

  const marcarComoLida = async (id: string) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('notificacao') as any)
        .update({ 
          lida: true,
          data_leitura: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error
      carregarNotificacoes()
    } catch (err: any) {
      console.error('Erro ao marcar como lida:', err)
      setError('Erro ao marcar notificação como lida')
    }
  }

  const marcarTodasComoLidas = async () => {
    try {
      const naoLidas = notificacoes.filter(n => !n.lida)
      
      if (naoLidas.length === 0) {
        setError('Não há notificações não lidas')
        return
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('notificacao') as any)
        .update({ 
          lida: true,
          data_leitura: new Date().toISOString()
        })
        .eq('user_id', user?.id)
        .eq('lida', false)

      if (error) throw error
      
      setSuccess('✅ Todas as notificações foram marcadas como lidas')
      carregarNotificacoes()
    } catch (err: any) {
      console.error('Erro ao marcar todas como lidas:', err)
      setError('Erro ao marcar notificações como lidas')
    }
  }

  const excluirNotificacao = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta notificação?')) return

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('notificacao') as any)
        .delete()
        .eq('id', id)

      if (error) throw error
      
      setSuccess('✅ Notificação excluída')
      carregarNotificacoes()
    } catch (err: any) {
      console.error('Erro ao excluir notificação:', err)
      setError('Erro ao excluir notificação')
    }
  }

  const abrirLink = (notificacao: Notificacao) => {
    if (!notificacao.lida) {
      marcarComoLida(notificacao.id)
    }
    
    if (notificacao.link) {
      navigate(notificacao.link)
    }
  }

  const getTipoIcon = (tipo: string | null) => {
    switch (tipo) {
      case 'documento_aprovado':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'documento_rejeitado':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      default:
        return <Info className="w-5 h-5 text-info" />
    }
  }

  const getTipoColor = (tipo: string | null) => {
    switch (tipo) {
      case 'documento_aprovado':
        return 'border-l-4 border-green-500 bg-green-50'
      case 'documento_rejeitado':
        return 'border-l-4 border-red-500 bg-red-50'
      default:
        return 'border-l-4 border-info bg-info-light'
    }
  }

  const notificacoesFiltradas = notificacoes.filter(notif => {
    if (filtro === 'nao_lidas') return !notif.lida
    if (filtro === 'lidas') return notif.lida
    return true
  })

  const stats = {
    total: notificacoes.length,
    naoLidas: notificacoes.filter(n => !n.lida).length,
    lidas: notificacoes.filter(n => n.lida).length
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notificações</h1>
            <p className="text-gray-600 mt-1">Acompanhe suas notificações e atualizações</p>
          </div>

          {stats.naoLidas > 0 && (
            <button
              onClick={marcarTodasComoLidas}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Check className="w-4 h-4" />
              Marcar todas como lidas
            </button>
          )}
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="error" onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert variant="success" onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <Bell className="w-8 h-8 text-info" />
              </div>
            </div>
          </Card>
          
          <Card>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Não Lidas</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.naoLidas}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-orange-500" />
              </div>
            </div>
          </Card>
          
          <Card>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Lidas</p>
                  <p className="text-2xl font-bold text-green-600">{stats.lidas}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <div className="p-4">
            <div className="flex gap-2">
              <button
                onClick={() => setFiltro('todas')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filtro === 'todas'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todas ({stats.total})
              </button>
              <button
                onClick={() => setFiltro('nao_lidas')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filtro === 'nao_lidas'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Não Lidas ({stats.naoLidas})
              </button>
              <button
                onClick={() => setFiltro('lidas')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filtro === 'lidas'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Lidas ({stats.lidas})
              </button>
            </div>
          </div>
        </Card>

        {/* Lista de Notificações */}
        {loading ? (
          <Card>
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Carregando notificações...</p>
            </div>
          </Card>
        ) : notificacoesFiltradas.length === 0 ? (
          <Card>
            <div className="p-12 text-center">
              <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhuma notificação encontrada</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {notificacoesFiltradas.map((notif) => (
              <Card key={notif.id}>
                <div className={`p-5 ${getTipoColor(notif.tipo)} ${!notif.lida ? 'bg-opacity-50' : 'bg-opacity-20'}`}>
                  <div className="flex items-start gap-4">
                    {/* Ícone do tipo */}
                    <div className="flex-shrink-0 mt-1">
                      {getTipoIcon(notif.tipo)}
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className={`font-semibold ${!notif.lida ? 'text-gray-900' : 'text-gray-600'}`}>
                            {notif.titulo}
                            {!notif.lida && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800">
                                Nova
                              </span>
                            )}
                          </h3>
                          <p className={`mt-1 text-sm ${!notif.lida ? 'text-gray-700' : 'text-gray-500'}`}>
                            {notif.mensagem}
                          </p>
                          <p className="mt-2 text-xs text-gray-500">
                            {new Date(notif.created_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>

                        {/* Ações */}
                        <div className="flex items-center gap-2">
                          {notif.link && (
                            <button
                              onClick={() => abrirLink(notif)}
                              className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                              title="Ir para página"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          )}

                          {!notif.lida && (
                            <button
                              onClick={() => marcarComoLida(notif.id)}
                              className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                              title="Marcar como lida"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => excluirNotificacao(notif.id)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            title="Excluir notificação"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}


