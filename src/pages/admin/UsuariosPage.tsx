import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { supabase } from '@/lib/supabase'
import { Table } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { Users, Edit, CheckCircle, XCircle, AlertCircle, Search } from 'lucide-react'

interface Usuario {
  id: string
  email: string
  perfil: string
  perfil_id: string
  ativo: boolean
  user_perfil_id: string
}

export function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [filteredUsuarios, setFilteredUsuarios] = useState<Usuario[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState<Usuario | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null)

  useEffect(() => {
    loadUsuarios()
  }, [])

  async function loadUsuarios() {
    try {
      setLoading(true)
      console.log('🔄 Iniciando carregamento de usuários...')

      // 1. Buscar TODOS os user_perfis com informações do perfil
      const { data: userPerfis, error: userPerfisError } = await supabase
        .from('user_perfis')
        .select(`
          id,
          user_id,
          ativo,
          perfil:perfil_id (
            id,
            role
          )
        `)

      if (userPerfisError) {
        console.error('❌ Erro ao buscar user_perfis:', userPerfisError)
        throw userPerfisError
      }

      console.log('📋 User_perfis encontrados:', userPerfis)
      console.log('📊 Total de registros user_perfis:', userPerfis?.length || 0)

      if (!userPerfis || userPerfis.length === 0) {
        setAlert({ 
          type: 'info', 
          message: 'Nenhum usuário encontrado no sistema.' 
        })
        setUsuarios([])
        setFilteredUsuarios([])
        return
      }

      // 2. Tentar buscar emails via função RPC
      let emailMap = new Map<string, string>()
      
      try {
        const { data: authUsers, error: rpcError } = await supabase
          .rpc('get_users_with_emails') as { data: any[] | null, error: any }

        if (rpcError) {
          console.warn('⚠️ Função RPC não disponível:', rpcError.message)
        } else if (authUsers && Array.isArray(authUsers)) {
          console.log('📧 Emails encontrados via RPC:', authUsers.length)
          emailMap = new Map(
            authUsers.map((u: any) => [u.user_id, u.email])
          )
        }
      } catch (rpcError) {
        console.warn('⚠️ Erro ao buscar emails via RPC:', rpcError)
      }

      // 3. Processar usuários (um por user_id)
      const uniqueUsers = new Map()
      
      userPerfis.forEach((up: any) => {
        const userId = up.user_id
        
        // Só adiciona se não existir ainda (pega o primeiro perfil encontrado)
        if (!uniqueUsers.has(userId)) {
          const email = emailMap.get(userId) || `user-${userId.substring(0, 8)}...`
          
          const usuario = {
            id: userId,
            email: email,
            perfil: up.perfil?.role || 'cliente',
            perfil_id: up.perfil?.id || '',
            ativo: up.ativo ?? true,
            user_perfil_id: up.id
          }
          
          uniqueUsers.set(userId, usuario)
          console.log(`👤 Usuário adicionado: ${email} (${up.perfil?.role})`)
        }
      })

      const usuariosList = Array.from(uniqueUsers.values())
      console.log('✅ Total de usuários únicos processados:', usuariosList.length)
      console.log('� Lista completa:', usuariosList)
      
      setUsuarios(usuariosList)
      setFilteredUsuarios(usuariosList)
      
      // Mostrar alerta se não conseguiu buscar emails
      if (emailMap.size === 0) {
        setAlert({ 
          type: 'info', 
          message: 'Emails não disponíveis. Execute: criar_polices.sql no Supabase para criar a função get_users_with_emails()' 
        })
      }
    } catch (error: any) {
      console.error('❌ Erro ao carregar usuários:', error)
      setAlert({ 
        type: 'error', 
        message: `Erro ao carregar usuários: ${error.message}` 
      })
    } finally {
      setLoading(false)
    }
  }

  // Filtrar usuários quando o termo de busca mudar
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsuarios(usuarios)
    } else {
      const term = searchTerm.toLowerCase()
      const filtered = usuarios.filter(user => 
        user.email.toLowerCase().includes(term) ||
        user.perfil.toLowerCase().includes(term) ||
        user.id.toLowerCase().includes(term)
      )
      setFilteredUsuarios(filtered)
    }
  }, [searchTerm, usuarios])

  async function handleSaveUser() {
    if (!editingUser) return

    try {
      console.log('💾 Salvando usuário:', editingUser)

      // 1. Buscar o perfil_id correto
      const { data: perfil, error: perfilError } = await supabase
        .from('perfil')
        .select('id')
        .eq('role', editingUser.perfil)
        .single() as { data: { id: string } | null, error: any }

      if (perfilError || !perfil) {
        console.error('❌ Perfil não encontrado:', perfilError)
        setAlert({ type: 'error', message: 'Perfil não encontrado' })
        return
      }

      console.log('✅ Perfil encontrado:', perfil)

      // 2. Atualizar user_perfis      
      const { error } = await supabase
        .from('user_perfis')
        .update({
          perfil_id: perfil.id,
          ativo: editingUser.ativo
        } as never)
        .eq('user_id', editingUser.id)

      if (error) {
        console.error('❌ Erro ao atualizar:', error)
        throw error
      }

      console.log('✅ Usuário atualizado com sucesso!')

      setAlert({ type: 'success', message: 'Usuário atualizado com sucesso!' })
      setShowModal(false)
      setEditingUser(null)
      loadUsuarios()
    } catch (error) {
      console.error('❌ Erro ao salvar usuário:', error)
      setAlert({ type: 'error', message: 'Erro ao salvar usuário' })
    }
  }

  function openEditModal(usuario: Usuario) {
    setEditingUser({ ...usuario })
    setShowModal(true)
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Users className="w-8 h-8 text-primary-600" />
              Gerenciar Usuários
            </h1>
            <p className="text-gray-600 mt-1">
              Altere perfis e ative/inative usuários do sistema
            </p>
          </div>
          <div className="text-sm text-gray-500">
            Total: <span className="font-semibold text-gray-900">{filteredUsuarios.length}</span> usuário(s)
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por email, perfil ou ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Alert */}
        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Total de Usuários</p>
            <p className="text-2xl font-bold text-gray-900">{usuarios.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Clientes</p>
            <p className="text-2xl font-bold text-green-600">
              {usuarios.filter(u => u.perfil === 'cliente').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Contadores</p>
            <p className="text-2xl font-bold text-purple-600">
              {usuarios.filter(u => u.perfil === 'contador').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Ativos</p>
            <p className="text-2xl font-bold text-blue-600">
              {usuarios.filter(u => u.ativo).length}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow">
          <Table
            data={filteredUsuarios}
            columns={[
              {
                header: 'Email',
                accessor: 'email',
              },
              {
                header: 'Perfil',
                accessor: (row) => (
                  <Badge
                    variant={
                      row.perfil === 'administrador' ? 'error' :
                      row.perfil === 'contador' ? 'info' :
                      'success'
                    }
                  >
                    {row.perfil.charAt(0).toUpperCase() + row.perfil.slice(1)}
                  </Badge>
                ),
              },
              {
                header: 'Status',
                accessor: (row) => (
                  <Badge variant={row.ativo ? 'success' : 'error'}>
                    {row.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                ),
              },
              {
                header: 'Ações',
                accessor: (row) => (
                  <button
                    onClick={() => openEditModal(row)}
                    className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </button>
                ),
              },
            ]}
            emptyMessage="Nenhum usuário encontrado"
          />
        </div>

        {/* Modal de Edição */}
        {showModal && editingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Editar Usuário
              </h2>

              <div className="space-y-4">
                {/* Email (read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editingUser.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                  />
                </div>

                {/* Perfil */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Perfil *
                  </label>
                  <select
                    value={editingUser.perfil}
                    onChange={(e) => setEditingUser({ ...editingUser, perfil: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="cliente">Cliente</option>
                    <option value="contador">Contador</option>
                    <option value="administrador">Administrador</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={editingUser.ativo}
                        onChange={() => setEditingUser({ ...editingUser, ativo: true })}
                        className="text-primary-600 focus:ring-primary-500"
                      />
                      <span className="flex items-center gap-1 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Ativo
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={!editingUser.ativo}
                        onChange={() => setEditingUser({ ...editingUser, ativo: false })}
                        className="text-primary-600 focus:ring-primary-500"
                      />
                      <span className="flex items-center gap-1 text-sm">
                        <XCircle className="w-4 h-4 text-red-600" />
                        Inativo
                      </span>
                    </label>
                  </div>
                </div>

                {/* Warning */}
                {!editingUser.ativo && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 flex gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-yellow-800">
                      Usuários inativos não poderão acessar o sistema.
                    </p>
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowModal(false)
                    setEditingUser(null)
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveUser}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
