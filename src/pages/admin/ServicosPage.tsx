import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { supabase } from '@/lib/supabase'
import { Table } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { Wrench, Edit, Plus, DollarSign, X, Clock } from 'lucide-react'

interface Servico {
  id: string
  nome: string
  descricao: string | null
  valor: number | null
  ativo: boolean
  tipo?: string | null
  prazo_dias?: number | null
}

export function ServicosPage() {
  const [servicos, setServicos] = useState<Servico[]>([])
  const [loading, setLoading] = useState(true)
  const [editingServico, setEditingServico] = useState<Servico | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null)

  useEffect(() => {
    loadServicos()
  }, [])

  async function loadServicos() {
    try {
      setLoading(true)
      console.log('🔄 Carregando serviços...')

      const { data, error } = await supabase
        .from('servicos')
        .select('*')
        .order('nome', { ascending: true })

      if (error) {
        console.error('❌ Erro ao carregar serviços:', error)
        throw error
      }

      console.log('✅ Serviços carregados:', data?.length || 0)
      setServicos(data || [])
    } catch (error: any) {
      console.error('❌ Erro:', error)
      setAlert({
        type: 'error',
        message: `Erro ao carregar serviços: ${error.message}`
      })
    } finally {
      setLoading(false)
    }
  }

  function openCreateModal() {
    setEditingServico({
      id: '',
      nome: '',
      descricao: '',
      valor: 0,
      ativo: true,
      tipo: undefined,
      prazo_dias: undefined
    })
    setIsCreating(true)
    setShowModal(true)
  }

  function openEditModal(servico: Servico) {
    setEditingServico({ ...servico })
    setIsCreating(false)
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditingServico(null)
    setIsCreating(false)
  }

  async function handleSaveServico() {
    if (!editingServico) return

    try {
      console.log('💾 Salvando serviço:', editingServico)

      if (isCreating) {
        // Criar novo serviço
        const { error } = await supabase
          .from('servicos')
          .insert({
            nome: editingServico.nome,
            descricao: editingServico.descricao,
            valor: editingServico.valor,
            ativo: editingServico.ativo
          } as never)

        if (error) throw error
        setAlert({ type: 'success', message: 'Serviço criado com sucesso!' })
      } else {
        // Atualizar serviço existente
        const { error } = await supabase
          .from('servicos')
          .update({
            nome: editingServico.nome,
            descricao: editingServico.descricao,
            valor: editingServico.valor,
            ativo: editingServico.ativo
          } as never)
          .eq('id', editingServico.id)

        if (error) throw error
        setAlert({ type: 'success', message: 'Serviço atualizado com sucesso!' })
      }

      closeModal()
      loadServicos()
    } catch (error: any) {
      console.error('❌ Erro ao salvar serviço:', error)
      setAlert({
        type: 'error',
        message: `Erro ao salvar serviço: ${error.message}`
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
              <Wrench className="w-8 h-8 text-primary-600" />
              Gerenciar Serviços
            </h1>
            <p className="text-gray-600 mt-1">
              Crie, edite e gerencie os serviços avulsos oferecidos
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Novo Serviço
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Total de Serviços</p>
            <p className="text-2xl font-bold text-gray-900">{servicos.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Serviços Ativos</p>
            <p className="text-2xl font-bold text-green-600">
              {servicos.filter(s => s.ativo).length}
            </p>
          </div>
          {/* Temporariamente comentado até adicionar coluna tipo no BD
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Cadastrais</p>
            <p className="text-2xl font-bold text-blue-600">
              {servicos.filter(s => s.tipo === 'cadastral').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Fiscais</p>
            <p className="text-2xl font-bold text-purple-600">
              {servicos.filter(s => s.tipo === 'fiscal').length}
            </p>
          </div>
          */}
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow">
          <Table
            data={servicos}
            columns={[
              {
                header: 'Nome',
                accessor: 'nome',
              },
              /* Temporariamente comentado até adicionar coluna tipo no BD
              {
                header: 'Tipo',
                accessor: (row) => (
                  <Badge
                    variant={
                      row.tipo === 'fiscal' ? 'info' :
                      row.tipo === 'consultoria' ? 'warning' :
                      'success'
                    }
                  >
                    {row.tipo ? row.tipo.charAt(0).toUpperCase() + row.tipo.slice(1) : 'N/A'}
                  </Badge>
                ),
              },
              */
              {
                header: 'Valor',
                accessor: (row) => (
                  <span className="flex items-center gap-1 font-semibold text-gray-900">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    {row.valor ? `R$ ${row.valor.toFixed(2)}` : 'N/A'}
                  </span>
                ),
              },
              /* Temporariamente comentado até adicionar coluna prazo_dias no BD
              {
                header: 'Prazo',
                accessor: (row) => (
                  <span className="flex items-center gap-1 text-gray-700">
                    <Clock className="w-4 h-4 text-blue-600" />
                    {row.prazo_dias ? `${row.prazo_dias} dias` : 'N/A'}
                  </span>
                ),
              },
              */
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
            emptyMessage="Nenhum serviço encontrado"
          />
        </div>

        {/* Modal de Criação/Edição */}
        {showModal && editingServico && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  {isCreating ? 'Criar Novo Serviço' : 'Editar Serviço'}
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
                    Nome do Serviço *
                  </label>
                  <input
                    type="text"
                    value={editingServico.nome}
                    onChange={(e) => setEditingServico({ ...editingServico, nome: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Ex: Abertura de MEI, Declaração Anual"
                  />
                </div>

                {/* Tipo, Valor e Prazo */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Tipo - Comentado temporariamente até adicionar coluna no BD
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo *
                    </label>
                    <select
                      value={editingServico.tipo || 'cadastral'}
                      onChange={(e) => setEditingServico({ ...editingServico, tipo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="cadastral">Cadastral</option>
                      <option value="fiscal">Fiscal</option>
                      <option value="consultoria">Consultoria</option>
                    </select>
                  </div>
                  */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valor (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingServico.valor || ''}
                      onChange={(e) => setEditingServico({ ...editingServico, valor: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                  {/* Prazo - Comentado temporariamente até adicionar coluna no BD
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prazo (dias)
                    </label>
                    <input
                      type="number"
                      value={editingServico.prazo_dias || ''}
                      onChange={(e) => setEditingServico({ ...editingServico, prazo_dias: parseInt(e.target.value) || null })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="7"
                    />
                  </div>
                  */}
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    value={editingServico.descricao || ''}
                    onChange={(e) => setEditingServico({ ...editingServico, descricao: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Descreva o serviço oferecido..."
                  />
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
                        checked={editingServico.ativo === true}
                        onChange={() => setEditingServico({ ...editingServico, ativo: true })}
                        className="w-4 h-4 text-primary-600"
                      />
                      <span className="text-sm text-gray-700">Ativo</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={editingServico.ativo === false}
                        onChange={() => setEditingServico({ ...editingServico, ativo: false })}
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
                  onClick={handleSaveServico}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  {isCreating ? 'Criar Serviço' : 'Salvar Alterações'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
