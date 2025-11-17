import { useAuth } from '@/contexts/AuthContext'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { StatCard } from '@/components/ui/Card'
import { Building2, FileText, Receipt, Users } from 'lucide-react'
import { useEmpresas } from '@/hooks/useEmpresa'
import { Table } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'

export function ContadorDashboard() {
  const { user } = useAuth()
  const { empresas, loading } = useEmpresas()

  const empresasAtivas = empresas.filter(e => e.status_cadastro === 'aprovado').length
  const empresasPendentes = empresas.filter(e => e.status_cadastro === 'pendente').length

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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard - Contador</h1>
          <p className="text-gray-600 mt-1">Gerencie suas empresas e serviços</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total de Empresas"
            value={empresas.length}
            icon={<Building2 className="w-6 h-6" />}
            color="blue"
          />
          <StatCard
            title="Empresas Ativas"
            value={empresasAtivas}
            icon={<Building2 className="w-6 h-6" />}
            color="green"
          />
          <StatCard
            title="Pendentes de Análise"
            value={empresasPendentes}
            icon={<FileText className="w-6 h-6" />}
            color="orange"
          />
          <StatCard
            title="NFSe Emitidas"
            value="0"
            icon={<Receipt className="w-6 h-6" />}
            color="blue"
          />
        </div>

        {/* Empresas Table */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Empresas Cadastradas</h2>
          <Table
            data={empresas.slice(0, 10)}
            columns={[
              {
                header: 'Razão Social',
                accessor: 'razao_social',
              },
              {
                header: 'CNPJ',
                accessor: 'cnpj',
              },
              {
                header: 'Cidade',
                accessor: 'cidade',
              },
              {
                header: 'Status',
                accessor: (row) => (
                  <Badge
                    variant={
                      row.status_cadastro === 'aprovado' ? 'success' :
                      row.status_cadastro === 'rejeitado' ? 'error' :
                      'warning'
                    }
                  >
                    {row.status_cadastro || 'Pendente'}
                  </Badge>
                ),
              },
              {
                header: 'Data Cadastro',
                accessor: (row) => 
                  row.data_cadastro 
                    ? new Date(row.data_cadastro).toLocaleDateString('pt-BR')
                    : '-'
              },
            ]}
            emptyMessage="Nenhuma empresa cadastrada"
          />
        </div>

        {/* Ações Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <FileText className="w-8 h-8 text-primary-600 mb-3" />
            <h3 className="font-semibold text-lg mb-2">Analisar Documentos</h3>
            <p className="text-gray-600 text-sm">Revisar documentos pendentes de aprovação</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <Receipt className="w-8 h-8 text-primary-600 mb-3" />
            <h3 className="font-semibold text-lg mb-2">Emitir NFSe</h3>
            <p className="text-gray-600 text-sm">Emitir notas fiscais de serviço</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <Building2 className="w-8 h-8 text-primary-600 mb-3" />
            <h3 className="font-semibold text-lg mb-2">Nova Empresa</h3>
            <p className="text-gray-600 text-sm">Cadastrar nova empresa no sistema</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
