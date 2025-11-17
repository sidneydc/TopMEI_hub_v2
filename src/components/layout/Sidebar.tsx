import { useAuth } from '@/contexts/AuthContext'
import { useNotificacoes } from '@/hooks/useNotificacoes'
import { 
  LayoutDashboard, 
  Building2, 
  FileText, 
  CreditCard, 
  Users, 
  Settings,
  Package,
  Receipt,
  Bell,
  LogOut,
  FileSpreadsheet,
  Briefcase
} from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

export function Sidebar() {
  const { userRole, signOut, user } = useAuth()
  const { unreadCount } = useNotificacoes(user?.id)
  const location = useLocation()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const clienteMenu = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Empresa', path: '/empresa', icon: Building2 },
    { name: 'Documentos', path: '/documentos', icon: FileText },
    { name: 'Contratar Serviços', path: '/contratar-servicos', icon: Package },
    { name: 'Emissor de Orçamento', path: '/emissor-orcamento', icon: FileSpreadsheet },
    { name: 'NFSe', path: '/nfse', icon: Receipt },
    { name: 'Notificações', path: '/notificacoes', icon: Bell },
  ]

  const contadorMenu = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Empresas', path: '/empresas', icon: Building2 },
    { name: 'Documentos', path: '/contador/documentos', icon: FileText },
    { name: 'Serviços a Executar', path: '/contador/servicos', icon: Briefcase },
    { name: 'NFSe', path: '/nfse', icon: Receipt },
    { name: 'Orçamentos', path: '/orcamentos', icon: FileText },
    { name: 'Notificações', path: '/notificacoes', icon: Bell },
  ]

  const adminMenu = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Usuários', path: '/usuarios', icon: Users },
    { name: 'Empresas', path: '/empresas', icon: Building2 },
    { name: 'Planos', path: '/planos', icon: Package },
    { name: 'Serviços', path: '/servicos', icon: Settings },
    { name: 'Cobranças', path: '/cobrancas', icon: CreditCard },
    { name: 'Documentos', path: '/documentos', icon: FileText },
    { name: 'Auditoria', path: '/auditoria', icon: FileText },
  ]

  const getMenuItems = () => {
    if (userRole === 'cliente') return clienteMenu
    if (userRole === 'contador') return contadorMenu
    if (userRole === 'administrador') return adminMenu
    return []
  }

  const menuItems = getMenuItems()

  return (
    <aside className="bg-secondary-900 text-white w-64 min-h-screen flex flex-col shadow-xl">
      <div className="p-4 border-b border-secondary-800 bg-secondary-800">
        <h1 className="text-xl font-bold text-primary-400">TopMEI Hub</h1>
        <p className="text-sm text-gray-300 mt-1">{user?.email}</p>
        
        {/* Botão Sair */}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 mt-3 px-3 py-1.5 w-full text-sm text-gray-300 hover:bg-secondary-700 hover:text-white rounded-lg transition-all border border-secondary-700"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair</span>
        </button>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                    isActive
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'text-gray-300 hover:bg-secondary-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="flex-1">{item.name}</span>
                  
                  {/* Badge de notificações não lidas */}
                  {item.path === '/notificacoes' && unreadCount > 0 && (
                    <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-danger rounded-full min-w-[20px] shadow-sm">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
