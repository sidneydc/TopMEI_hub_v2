import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { supabase } from '@/lib/supabase'
import { Table } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { Package, Edit, Plus, DollarSign, X } from 'lucide-react'

interface Plano {
  id: string
  nome: string
  descrição: string | null
  tipo: string | null
  valor: number | null
  ativo: boolean
  recursos: any | null
  recorrencia: string | null
}

export function PlanosPage() {
  const [planos, setPlanos] = useState<Plano[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPlano, setEditingPlano] = useState<Plano | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null)

  useEffect(() => {
    loadPlanos()
  }, [])

  async function loadPlanos() {
    try {
      setLoading(true)
      console.log('🔄 Carregando planos...')

      const { data, error } = await supabase
        .from('planos')
        .select('*')
        .order('tipo', { ascending: true })
        .order('valor', { ascending: true })

      if (error) {
        console.error('❌ Erro ao carregar planos:', error)
        throw error
      }

      console.log('✅ Planos carregados:', data?.length || 0)
      setPlanos(data || [])
    } catch (error: any) {
      console.error('❌ Erro:', error)
      setAlert({
        type: 'error',
        message: `Erro ao carregar planos: ${error.message}`
      })
    } finally {
      setLoading(false)
    }
  }

  function openCreateModal() {
    setEditingPlano({
      id: '',
      nome: '',
      descrição: '',
      tipo: 'mensal',
      valor: 0,
      ativo: true,
      recursos: null,
      recorrencia: null
    })
    setIsCreating(true)
    setShowModal(true)
  }

  function openEditModal(plano: Plano) {
    setEditingPlano({ ...plano })
    setIsCreating(false)
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditingPlano(null)
    setIsCreating(false)
  }

  async function handleSavePlano() {
    if (!editingPlano) return

    try {
      console.log('💾 Salvando plano:', editingPlano)

      if (isCreating) {
        // Criar novo plano
        const { error } = await supabase
          .from('planos')
          .insert({
            nome: editingPlano.nome,
            descrição: editingPlano.descrição,
            tipo: editingPlano.tipo,
            valor: editingPlano.valor,
            ativo: editingPlano.ativo,
            recursos: editingPlano.recursos,
            recorrencia: editingPlano.recorrencia
          } as never)

        if (error) throw error
        setAlert({ type: 'success', message: 'Plano criado com sucesso!' })
      } else {
        // Atualizar plano existente
        const { error } = await supabase
          .from('planos')
          .update({
            nome: editingPlano.nome,
            descrição: editingPlano.descrição,
            tipo: editingPlano.tipo,
            valor: editingPlano.valor,
            ativo: editingPlano.ativo,
            recursos: editingPlano.recursos,
            recorrencia: editingPlano.recorrencia
          } as never)
          .eq('id', editingPlano.id)

        if (error) throw error
        setAlert({ type: 'success', message: 'Plano atualizado com sucesso!' })
      }

      closeModal()
      loadPlanos()
    } catch (error: any) {
      console.error('❌ Erro ao salvar plano:', error)
      setAlert({
        type: 'error',
        message: `Erro ao salvar plano: ${error.message}`
      })
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Package className="w-8 h-8 text-primary-600" />
              Gerenciar Planos
            </h1>
            <p className="text-gray-600 mt-1">
              Crie, edite e gerencie os planos de assinatura
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Novo Plano
          </button>
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
            <p className="text-sm text-gray-600">Total de Planos</p>
            <p className="text-2xl font-bold text-gray-900">{planos.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Planos Ativos</p>
            <p className="text-2xl font-bold text-green-600">
              {planos.filter(p => p.ativo).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Planos Mensais</p>
            <p className="text-2xl font-bold text-blue-600">
              {planos.filter(p => p.tipo === 'mensal').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Planos Anuais</p>
            <p className="text-2xl font-bold text-purple-600">
              {planos.filter(p => p.tipo === 'anual').length}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow">
          <Table
            data={planos}
            columns={[
              {
                header: 'Nome',
                accessor: 'nome',
              },
              {
                header: 'Tipo',
                accessor: (row) => (
                  <Badge
                    variant={
                      row.tipo === 'anual' ? 'info' :
                      row.tipo === 'semestral' ? 'warning' :
                      'success'
                    }
                  >
                    {row.tipo ? row.tipo.charAt(0).toUpperCase() + row.tipo.slice(1) : 'N/A'}
                  </Badge>
                ),
              },
              {
                header: 'Valor',
                accessor: (row) => (
                  <span className="flex items-center gap-1 font-semibold text-gray-900">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    {row.valor ? `R$ ${row.valor.toFixed(2)}` : 'N/A'}
                  </span>
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
            emptyMessage="Nenhum plano encontrado"
          />
        </div>

        {/* Modal de Criação/Edição */}
        {showModal && editingPlano && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  {isCreating ? 'Criar Novo Plano' : 'Editar Plano'}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Nome */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Plano *
                  </label>
                  <input
                    type="text"
                    value={editingPlano.nome}
                    onChange={(e) => setEditingPlano({ ...editingPlano, nome: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Ex: Básico, Profissional, Premium"
                  />
                </div>

                {/* Tipo e Valor */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo *
                    </label>
                    <select
                      value={editingPlano.tipo || 'mensal'}
                      onChange={(e) => setEditingPlano({ ...editingPlano, tipo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="mensal">Mensal</option>
                      <option value="semestral">Semestral</option>
                      <option value="anual">Anual</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valor (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingPlano.valor || ''}
                      onChange={(e) => setEditingPlano({ ...editingPlano, valor: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    value={editingPlano.descrição || ''}
                    onChange={(e) => setEditingPlano({ ...editingPlano, descrição: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Descreva os benefícios do plano..."
                  />
                </div>

                {/* Recursos */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recursos (JSON)
                  </label>
                  <textarea
                    value={typeof editingPlano.recursos === 'string' ? editingPlano.recursos : JSON.stringify(editingPlano.recursos || [], null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value)
                        setEditingPlano({ ...editingPlano, recursos: parsed })
                      } catch {
                        setEditingPlano({ ...editingPlano, recursos: e.target.value })
                      }
                    }}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
                    placeholder='["Emissão de Notas", "Gestão de Documentos"]'
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Formato JSON array. Ex: ["Recurso 1", "Recurso 2"]
                  </p>
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
                        checked={editingPlano.ativo === true}
                        onChange={() => setEditingPlano({ ...editingPlano, ativo: true })}
                        className="w-4 h-4 text-primary-600"
                      />
                      <span className="text-sm text-gray-700">Ativo</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={editingPlano.ativo === false}
                        onChange={() => setEditingPlano({ ...editingPlano, ativo: false })}
                        className="w-4 h-4 text-primary-600"
                      />
                      <span className="text-sm text-gray-700">Inativo</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Botões */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSavePlano}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  {isCreating ? 'Criar Plano' : 'Salvar Alterações'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
