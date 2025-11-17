import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { supabase } from '@/lib/supabase'
import { 
  Users, 
  Building2, 
  Package, 
  FileText, 
  TrendingUp, 
  Activity,
  UserCheck,
  UserX,
  Receipt,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'

interface DashboardStats {
  usuarios: {
    total: number
    porPerfil: {
      cliente: number
      contador: number
      administrador: number
    }
    porStatus: {
      ativos: number
      inativos: number
    }
  }
  empresas: {
    total: number
    aprovadas: number
    pendentes: number
    rejeitadas: number
  }
  planos: {
    total: number
    ativos: number
    inativos: number
    contratacoes: number
  }
  servicos: {
    total: number
    ativos: number
    inativos: number
    contratacoes: number
  }
  orcamentos: {
    total: number
    configurados: number
  }
  documentos: {
    total: number
    aprovados: number
    pendentes: number
    rejeitados: number
  }
}

export function AdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardStats()
  }, [])

  async function loadDashboardStats() {
    try {
      setLoading(true)

      // 1. Estatísticas de Usuários
      const { data: userPerfis, error: upError } = await supabase
        .from('user_perfis')
        .select('*')

      console.log('📊 Dados brutos de user_perfis:', userPerfis)
      console.log('❌ Erro (se houver):', upError)

      if (upError) {
        console.error('Erro ao buscar user_perfis:', upError)
      }

      // Buscar perfis separadamente
      const { data: perfis } = await supabase
        .from('perfil')
        .select('*')

      console.log('🎭 Perfis disponíveis:', perfis)

      const perfisMap = new Map(perfis?.map((p: any) => [p.id, p.role]) || [])
      console.log('🗺️ Map de perfis:', Array.from(perfisMap.entries()))

      const uniqueUsers = new Map()
      userPerfis?.forEach((up: any) => {
        const perfilRole = perfisMap.get(up.perfil_id) || 'cliente'
        console.log(`👤 Processando user ${up.user_id}: perfil=${perfilRole}, ativo=${up.ativo}`)
        
        if (!uniqueUsers.has(up.user_id)) {
          uniqueUsers.set(up.user_id, {
            perfil: perfilRole,
            ativo: up.ativo
          })
        }
      })

      console.log('👥 Total de usuários únicos encontrados:', uniqueUsers.size)
      console.log('📋 Detalhes dos usuários:', Array.from(uniqueUsers.entries()))

      const usuarios = {
        total: uniqueUsers.size,
        porPerfil: {
          cliente: 0,
          contador: 0,
          administrador: 0
        },
        porStatus: {
          ativos: 0,
          inativos: 0
        }
      }

      uniqueUsers.forEach((userData: any) => {
        if (userData.perfil === 'cliente') usuarios.porPerfil.cliente++
        if (userData.perfil === 'contador') usuarios.porPerfil.contador++
        if (userData.perfil === 'administrador') usuarios.porPerfil.administrador++
        
        if (userData.ativo) usuarios.porStatus.ativos++
        else usuarios.porStatus.inativos++
      })

      console.log('📊 Estatísticas finais:', usuarios)

      // 2. Estatísticas de Empresas
      const { data: empresasData } = await supabase
        .from('empresa')
        .select('status_cadastro')

      const empresas = {
        total: empresasData?.length || 0,
        aprovadas: empresasData?.filter((e: any) => e.status_cadastro === 'aprovado').length || 0,
        pendentes: empresasData?.filter((e: any) => e.status_cadastro === 'pendente').length || 0,
        rejeitadas: empresasData?.filter((e: any) => e.status_cadastro === 'rejeitado').length || 0
      }

      // 3. Estatísticas de Planos
      const { data: planosData } = await supabase.from('planos').select('*')
      const { data: empresaPlanosData } = await supabase
        .from('empresas_planos')
        .select('*')
        .eq('status', 'ativo')

      const planos = {
        total: planosData?.length || 0,
        ativos: planosData?.filter((p: any) => p.ativo).length || 0,
        inativos: planosData?.filter((p: any) => !p.ativo).length || 0,
        contratacoes: empresaPlanosData?.length || 0
      }

      // 4. Estatísticas de Serviços
      const { data: servicosData } = await supabase.from('servicos').select('*')
      const { data: empresaServicosData } = await supabase
        .from('empresa_servicos')
        .select('*')
        .eq('status', 'ativo')

      const servicos = {
        total: servicosData?.length || 0,
        ativos: servicosData?.filter((s: any) => s.ativo).length || 0,
        inativos: servicosData?.filter((s: any) => !s.ativo).length || 0,
        contratacoes: empresaServicosData?.length || 0
      }

      // 5. Estatísticas de Orçamentos
      const { data: orcamentosData } = await supabase.from('orcamento').select('*')
      const orcamentosConfigurados = orcamentosData?.filter((o: any) => 
        o.razao_social && o.cnpj && o.template
      ).length || 0

      const orcamentos = {
        total: orcamentosData?.length || 0,
        configurados: orcamentosConfigurados
      }

      // 6. Estatísticas de Documentos
      const { data: documentosData } = await supabase
        .from('documentos')
        .select('status')

      const documentos = {
        total: documentosData?.length || 0,
        aprovados: documentosData?.filter((d: any) => d.status === 'aprovado').length || 0,
        pendentes: documentosData?.filter((d: any) => d.status === 'pendente').length || 0,
        rejeitados: documentosData?.filter((d: any) => d.status === 'rejeitado').length || 0
      }

      setStats({
        usuarios,
        empresas,
        planos,
        servicos,
        orcamentos,
        documentos
      })
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !stats) {
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
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard - Administrador</h1>
          <p className="text-gray-600 mt-1">Visão geral completa do sistema</p>
        </div>

        {/* Usuários Stats */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-600" />
            Usuários
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              title="Total de Usuários"
              value={stats.usuarios.total}
              icon={<Users className="w-6 h-6" />}
              color="blue"
            />
            <StatCard
              title="Clientes"
              value={stats.usuarios.porPerfil.cliente}
              icon={<Users className="w-6 h-6" />}
              color="green"
              subtitle={`${Math.round((stats.usuarios.porPerfil.cliente / stats.usuarios.total) * 100)}%`}
            />
            <StatCard
              title="Contadores"
              value={stats.usuarios.porPerfil.contador}
              icon={<UserCheck className="w-6 h-6" />}
              color="purple"
              subtitle={`${Math.round((stats.usuarios.porPerfil.contador / stats.usuarios.total) * 100)}%`}
            />
            <StatCard
              title="Administradores"
              value={stats.usuarios.porPerfil.administrador}
              icon={<Activity className="w-6 h-6" />}
              color="orange"
              subtitle={`${Math.round((stats.usuarios.porPerfil.administrador / stats.usuarios.total) * 100)}%`}
            />
            <StatCard
              title="Usuários Ativos"
              value={stats.usuarios.porStatus.ativos}
              icon={<UserCheck className="w-6 h-6" />}
              color="green"
              subtitle={`${stats.usuarios.porStatus.inativos} inativos`}
            />
          </div>
        </div>

        {/* Empresas Stats */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary-600" />
            Empresas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total de Empresas"
              value={stats.empresas.total}
              icon={<Building2 className="w-6 h-6" />}
              color="blue"
            />
            <StatCard
              title="Aprovadas"
              value={stats.empresas.aprovadas}
              icon={<CheckCircle className="w-6 h-6" />}
              color="green"
              subtitle={`${Math.round((stats.empresas.aprovadas / stats.empresas.total) * 100)}%`}
            />
            <StatCard
              title="Pendentes"
              value={stats.empresas.pendentes}
              icon={<Clock className="w-6 h-6" />}
              color="orange"
              subtitle="Aguardando análise"
            />
            <StatCard
              title="Rejeitadas"
              value={stats.empresas.rejeitadas}
              icon={<XCircle className="w-6 h-6" />}
              color="red"
              subtitle="Necessitam correção"
            />
          </div>
        </div>

        {/* Planos e Serviços */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Planos */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary-600" />
              Planos
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <StatCard
                title="Total de Planos"
                value={stats.planos.total}
                icon={<Package className="w-6 h-6" />}
                color="purple"
              />
              <StatCard
                title="Planos Ativos"
                value={stats.planos.ativos}
                icon={<CheckCircle className="w-6 h-6" />}
                color="green"
                subtitle={`${stats.planos.inativos} inativos`}
              />
              <StatCard
                title="Contratações"
                value={stats.planos.contratacoes}
                icon={<TrendingUp className="w-6 h-6" />}
                color="blue"
                subtitle="Planos ativos"
                className="col-span-2"
              />
            </div>
          </div>

          {/* Serviços */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-600" />
              Serviços
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <StatCard
                title="Total de Serviços"
                value={stats.servicos.total}
                icon={<FileText className="w-6 h-6" />}
                color="blue"
              />
              <StatCard
                title="Serviços Ativos"
                value={stats.servicos.ativos}
                icon={<CheckCircle className="w-6 h-6" />}
                color="green"
                subtitle={`${stats.servicos.inativos} inativos`}
              />
              <StatCard
                title="Contratações"
                value={stats.servicos.contratacoes}
                icon={<TrendingUp className="w-6 h-6" />}
                color="purple"
                subtitle="Serviços ativos"
                className="col-span-2"
              />
            </div>
          </div>
        </div>

        {/* Orçamentos e Documentos */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary-600" />
            Sistema
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Emissores Criados"
              value={stats.orcamentos.total}
              icon={<Receipt className="w-6 h-6" />}
              color="blue"
            />
            <StatCard
              title="Emissores Configurados"
              value={stats.orcamentos.configurados}
              icon={<CheckCircle className="w-6 h-6" />}
              color="green"
              subtitle={`${Math.round((stats.orcamentos.configurados / (stats.orcamentos.total || 1)) * 100)}% configurados`}
            />
            <StatCard
              title="Total de Documentos"
              value={stats.documentos.total}
              icon={<FileText className="w-6 h-6" />}
              color="purple"
            />
            <StatCard
              title="Docs Aprovados"
              value={stats.documentos.aprovados}
              icon={<CheckCircle className="w-6 h-6" />}
              color="green"
              subtitle={`${stats.documentos.pendentes} pendentes`}
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Ações Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickActionCard
              title="Gerenciar Usuários"
              description="Alterar perfis e status"
              icon={<Users className="w-8 h-8" />}
              color="blue"
              href="/usuarios"
            />
            <QuickActionCard
              title="Gerenciar Planos"
              description="Criar e editar planos"
              icon={<Package className="w-8 h-8" />}
              color="purple"
              href="/planos"
            />
            <QuickActionCard
              title="Gerenciar Serviços"
              description="Criar e editar serviços"
              icon={<FileText className="w-8 h-8" />}
              color="green"
              href="/servicos"
            />
            <QuickActionCard
              title="Aprovar Documentos"
              description={`${stats.documentos.pendentes} pendentes`}
              icon={<CheckCircle className="w-8 h-8" />}
              color="orange"
              href="/contador/documentos"
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

// Componente StatCard
interface StatCardProps {
  title: string
  value: number | string
  icon: React.ReactNode
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red'
  subtitle?: string
  className?: string
}

function StatCard({ title, value, icon, color, subtitle, className = '' }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    red: 'bg-red-100 text-red-600'
  }

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

// Componente QuickActionCard
interface QuickActionCardProps {
  title: string
  description: string
  icon: React.ReactNode
  color: 'blue' | 'green' | 'purple' | 'orange'
  href: string
}

function QuickActionCard({ title, description, icon, color, href }: QuickActionCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-600',
    green: 'bg-green-50 border-green-200 hover:bg-green-100 text-green-600',
    purple: 'bg-purple-50 border-purple-200 hover:bg-purple-100 text-purple-600',
    orange: 'bg-orange-50 border-orange-200 hover:bg-orange-100 text-orange-600'
  }

  return (
    <a
      href={href}
      className={`block p-6 rounded-lg border-2 transition-all duration-200 ${colorClasses[color]}`}
    >
      <div className="flex flex-col items-center text-center gap-3">
        {icon}
        <div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
      </div>
    </a>
  )
}
