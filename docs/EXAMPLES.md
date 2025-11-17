# Exemplos de Uso - TopMEI Hub

## 📝 Autenticação

### Login
```typescript
import { useAuth } from '@/contexts/AuthContext'

function LoginComponent() {
  const { signIn } = useAuth()
  
  const handleLogin = async () => {
    const { error } = await signIn('email@example.com', 'senha123')
    if (!error) {
      // Sucesso - usuário será redirecionado
    }
  }
}
```

### Registro
```typescript
const { signUp } = useAuth()

const handleSignUp = async () => {
  const { error } = await signUp(
    'email@example.com',
    'senha123',
    { name: 'João Silva' }
  )
}
```

### Logout
```typescript
const { signOut } = useAuth()

const handleLogout = async () => {
  await signOut()
  // Usuário será redirecionado para login
}
```

### Verificar Permissões
```typescript
const { isAdmin, isContador, isCliente, userRole } = useAuth()

if (isAdmin) {
  // Mostrar funcionalidades de admin
}

// Ou verificar diretamente
if (userRole === 'administrador') {
  // Acesso administrativo
}
```

## 🏢 Gerenciamento de Empresas

### Buscar Empresa do Usuário
```typescript
import { useEmpresa } from '@/hooks/useEmpresa'

function MinhaEmpresa() {
  const { user } = useAuth()
  const { empresa, loading, error } = useEmpresa(user?.id)
  
  if (loading) return <div>Carregando...</div>
  if (error) return <div>Erro: {error}</div>
  
  return <div>{empresa?.razao_social}</div>
}
```

### Listar Todas as Empresas (Admin/Contador)
```typescript
import { useEmpresas } from '@/hooks/useEmpresa'

function ListaEmpresas() {
  const { empresas, loading } = useEmpresas()
  
  return (
    <ul>
      {empresas.map(empresa => (
        <li key={empresa.id}>{empresa.razao_social}</li>
      ))}
    </ul>
  )
}
```

### Criar Nova Empresa
```typescript
import { supabase } from '@/lib/supabase'

const criarEmpresa = async (dados) => {
  const { data, error } = await supabase
    .from('empresa')
    .insert({
      user_id: user.id,
      cnpj: dados.cnpj,
      razao_social: dados.razaoSocial,
      nome_fantasia: dados.nomeFantasia,
      // ... outros campos
    })
    .select()
    .single()
    
  return { data, error }
}
```

### Atualizar Empresa
```typescript
const atualizarEmpresa = async (id: string, dados) => {
  const { data, error } = await supabase
    .from('empresa')
    .update({
      telefone_numero: dados.telefone,
      email: dados.email,
      data_atualizacao: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()
    
  return { data, error }
}
```

## 📄 Gerenciamento de Documentos

### Listar Documentos da Empresa
```typescript
import { useDocumentos } from '@/hooks/useDocumentos'

function MeusDocumentos() {
  const { documentos, loading } = useDocumentos(empresaId)
  
  return (
    <div>
      {documentos.map(doc => (
        <div key={doc.id}>
          <p>{doc.nome_arquivo}</p>
          <Badge variant={doc.status === 'aprovado' ? 'success' : 'warning'}>
            {doc.status}
          </Badge>
        </div>
      ))}
    </div>
  )
}
```

### Upload de Documento
```typescript
const uploadDocumento = async (file: File, empresaId: string) => {
  // 1. Upload para Storage
  const fileName = `${empresaId}/${Date.now()}_${file.name}`
  const { data: uploadData, error: uploadError } = await supabase
    .storage
    .from('documentos')
    .upload(fileName, file)
    
  if (uploadError) throw uploadError
  
  // 2. Criar registro no banco
  const { data, error } = await supabase
    .from('documentos')
    .insert({
      empresa_id: empresaId,
      nome_arquivo: file.name,
      caminho_storage: uploadData.path,
      tamanho_bytes: file.size,
      mime_type: file.type,
      enviado_por: user.id,
      status: 'pendente'
    })
    .select()
    .single()
    
  return { data, error }
}
```

### Aprovar/Rejeitar Documento
```typescript
const analisarDocumento = async (
  documentoId: string, 
  status: 'aprovado' | 'rejeitado',
  motivo?: string
) => {
  const { data, error } = await supabase
    .from('documentos')
    .update({
      status,
      motivo_rejeicao: motivo,
      analisado_por: user.id,
      updated_at: new Date().toISOString()
    })
    .eq('id', documentoId)
    .select()
    .single()
    
  return { data, error }
}
```

## 🔔 Notificações

### Buscar Notificações
```typescript
import { useNotificacoes } from '@/hooks/useNotificacoes'

function Notificacoes() {
  const { user } = useAuth()
  const { notificacoes, unreadCount, markAsRead } = useNotificacoes(user?.id)
  
  return (
    <div>
      <h2>Notificações ({unreadCount})</h2>
      {notificacoes.map(notif => (
        <div 
          key={notif.id}
          onClick={() => markAsRead(notif.id)}
          className={!notif.visualizado ? 'font-bold' : ''}
        >
          <h3>{notif.titulo}</h3>
          <p>{notif.mensagem}</p>
        </div>
      ))}
    </div>
  )
}
```

### Criar Notificação
```typescript
const criarNotificacao = async (userId: string, dados) => {
  const { data, error } = await supabase
    .from('notificacao')
    .insert({
      user_id: userId,
      titulo: dados.titulo,
      mensagem: dados.mensagem,
      visualizado: false
    })
    .select()
    .single()
    
  return { data, error }
}
```

## 💰 Cobranças

### Listar Cobranças de Planos
```typescript
const buscarCobrancas = async (userId: string) => {
  const { data, error } = await supabase
    .from('cobranca_plano')
    .select(`
      *,
      empresa_plano:empresa_plano_id (
        empresa:empresa_id (
          razao_social
        ),
        plano:plano_id (
          nome
        )
      )
    `)
    .eq('user_id', userId)
    .order('vencimento', { ascending: false })
    
  return { data, error }
}
```

### Registrar Pagamento
```typescript
const registrarPagamento = async (cobrancaId: string, transacaoId: string) => {
  const { data, error } = await supabase
    .from('cobranca_plano')
    .update({
      status: 'pago',
      data_pagamento: new Date().toISOString(),
      transacao_id: transacaoId
    })
    .eq('id', cobrancaId)
    .select()
    .single()
    
  return { data, error }
}
```

## 📊 Serviços e Planos

### Listar Planos Disponíveis
```typescript
const buscarPlanos = async () => {
  const { data, error } = await supabase
    .from('planos')
    .select('*')
    .eq('ativo', true)
    .order('valor', { ascending: true })
    
  return { data, error }
}
```

### Contratar Serviço
```typescript
const contratarServico = async (empresaId: string, servicoId: string) => {
  const { data, error } = await supabase
    .from('empresa_servicos')
    .insert({
      empresa_id: empresaId,
      servicos_id: servicoId,
      status: 'ativo',
      data_contratacao: new Date().toISOString()
    })
    .select()
    .single()
    
  return { data, error }
}
```

## 🧾 NFSe

### Emitir NFSe
```typescript
const emitirNFSe = async (dados) => {
  const { data, error } = await supabase
    .from('NFSe')
    .insert({
      empresa_id: dados.empresaId,
      user_id: user.id,
      data_competencia: dados.competencia,
      tomador_cpf_cnpj: dados.tomadorCpfCnpj,
      tomador_nome: dados.tomadorNome,
      descricao_servicos: dados.descricao,
      valor_servicos: dados.valor,
      status: 'pendente'
    })
    .select()
    .single()
    
  return { data, error }
}
```

### Buscar NFSes Emitidas
```typescript
const buscarNFSes = async (empresaId: string) => {
  const { data, error } = await supabase
    .from('NFSe')
    .select('*')
    .eq('empresa_id', empresaId)
    .order('created_at', { ascending: false })
    
  return { data, error }
}
```

## 🔍 Auditoria

### Registrar Ação (Admin)
```typescript
const registrarAuditoria = async (acao: string, dados: any) => {
  const { data, error } = await supabase
    .from('auditoria')
    .insert({
      user_id: user.id,
      empresa_id: dados.empresaId,
      tabela: dados.tabela,
      acao: acao,
      registro_id: dados.registroId,
      dados_anteriores: dados.anterior,
      dados_novos: dados.novo,
      ip_address: await getUserIp(),
      user_agent: navigator.userAgent
    })
    .select()
    .single()
    
  return { data, error }
}
```

### Buscar Logs de Auditoria
```typescript
const buscarAuditoria = async (filtros) => {
  let query = supabase
    .from('auditoria')
    .select(`
      *,
      user:user_id (email),
      empresa:empresa_id (razao_social)
    `)
    
  if (filtros.empresaId) {
    query = query.eq('empresa_id', filtros.empresaId)
  }
  
  if (filtros.acao) {
    query = query.eq('acao', filtros.acao)
  }
  
  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(100)
    
  return { data, error }
}
```

## 🎨 Componentes UI

### Usando Card
```typescript
import { Card, StatCard } from '@/components/ui/Card'

<Card title="Título" subtitle="Subtítulo">
  <p>Conteúdo do card</p>
</Card>

<StatCard
  title="Total de Empresas"
  value={150}
  icon={<Building2 className="w-6 h-6" />}
  color="blue"
  trend={{ value: '+12%', isPositive: true }}
/>
```

### Usando Table
```typescript
import { Table } from '@/components/ui/Table'

<Table
  data={empresas}
  columns={[
    { header: 'Nome', accessor: 'razao_social' },
    { header: 'CNPJ', accessor: 'cnpj' },
    { 
      header: 'Status', 
      accessor: (row) => <Badge>{row.status}</Badge>
    }
  ]}
  emptyMessage="Nenhuma empresa encontrada"
/>
```

### Usando Alert
```typescript
import { Alert } from '@/components/ui/Alert'

<Alert type="success" title="Sucesso!">
  Operação realizada com sucesso
</Alert>

<Alert type="error">
  Ocorreu um erro ao processar
</Alert>
```

### Usando Badge
```typescript
import { Badge } from '@/components/ui/Badge'

<Badge variant="success">Aprovado</Badge>
<Badge variant="warning">Pendente</Badge>
<Badge variant="error">Rejeitado</Badge>
```

## 🔒 Rotas Protegidas

### Proteger por Autenticação
```typescript
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

### Proteger por Role
```typescript
<Route
  path="/admin"
  element={
    <ProtectedRoute allowedRoles={['administrador']}>
      <AdminPanel />
    </ProtectedRoute>
  }
/>

<Route
  path="/contador"
  element={
    <ProtectedRoute allowedRoles={['contador', 'administrador']}>
      <ContadorPanel />
    </ProtectedRoute>
  }
/>
```

## 📱 Real-time

### Subscrever a Mudanças
```typescript
useEffect(() => {
  const subscription = supabase
    .channel('empresas')
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'empresa' 
      }, 
      (payload) => {
        console.log('Mudança detectada:', payload)
        // Atualizar estado local
      }
    )
    .subscribe()
    
  return () => {
    subscription.unsubscribe()
  }
}, [])
```

## 🧪 Testes

### Exemplo de Teste de Componente
```typescript
import { render, screen } from '@testing-library/react'
import { ClienteDashboard } from '@/pages/dashboards/ClienteDashboard'

test('renders client dashboard', () => {
  render(<ClienteDashboard />)
  expect(screen.getByText('Dashboard')).toBeInTheDocument()
})
```

## 📚 Recursos Adicionais

- [Documentação do Supabase](https://supabase.com/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
