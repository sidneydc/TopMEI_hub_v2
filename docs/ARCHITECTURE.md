# Arquitetura do Sistema TopMEI Hub

## Visão Geral

O TopMEI Hub é uma aplicação web completa para gestão de Microempreendedores Individuais (MEIs), desenvolvida com arquitetura moderna e escalável.

## Stack Tecnológica

### Frontend
- **React 18** - Biblioteca UI
- **TypeScript** - Type safety
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Styling
- **React Router** - Roteamento
- **Lucide React** - Ícones

### Backend/Database
- **Supabase** - Backend as a Service
  - PostgreSQL Database
  - Authentication
  - Storage
  - Real-time subscriptions
  - Row Level Security (RLS)

## Arquitetura de Componentes

```
┌─────────────────────────────────────────────────┐
│                   Browser                       │
│  ┌───────────────────────────────────────────┐ │
│  │          React Application                │ │
│  │  ┌─────────────────────────────────────┐ │ │
│  │  │      Authentication Context         │ │ │
│  │  │  - User management                  │ │ │
│  │  │  - Role verification                │ │ │
│  │  └─────────────────────────────────────┘ │ │
│  │                                           │ │
│  │  ┌─────────────────────────────────────┐ │ │
│  │  │      Protected Routes               │ │ │
│  │  │  - Role-based access control        │ │ │
│  │  └─────────────────────────────────────┘ │ │
│  │                                           │ │
│  │  ┌──────────┬──────────┬──────────────┐ │ │
│  │  │ Cliente  │ Contador │ Administrador│ │ │
│  │  │Dashboard │Dashboard │  Dashboard   │ │ │
│  │  └──────────┴──────────┴──────────────┘ │ │
│  └───────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
                       │
                       │ REST API / Realtime
                       ▼
┌─────────────────────────────────────────────────┐
│              Supabase Backend                   │
│  ┌───────────────────────────────────────────┐ │
│  │         Authentication Service            │ │
│  │  - JWT token management                   │ │
│  │  - Email verification                     │ │
│  │  - Password reset                         │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │         PostgreSQL Database               │ │
│  │  - 17 Tables                              │ │
│  │  - Relationships & Constraints            │ │
│  │  - Row Level Security (RLS)               │ │
│  │  - Indexes for performance                │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │         Storage Service                   │ │
│  │  - Document uploads                       │ │
│  │  - Access policies                        │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │         Realtime Service                  │ │
│  │  - Notifications                          │ │
│  │  - Live updates                           │ │
│  └───────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

## Modelo de Dados

### Entidades Principais

1. **Users** (Supabase Auth)
   - Gerenciamento de autenticação
   - Email, senha, metadata

2. **Perfil**
   - cliente, contador, administrador
   - Controle de acesso

3. **Empresa**
   - Dados do MEI
   - CNPJ, endereço, contatos
   - Status de cadastro

4. **Documentos**
   - Upload de arquivos
   - Status de aprovação
   - Vínculo com empresa

5. **Serviços & Planos**
   - Produtos oferecidos
   - Precificação
   - Contratações

6. **Cobranças**
   - Gestão financeira
   - Status de pagamento
   - Histórico

7. **NFSe**
   - Notas fiscais eletrônicas
   - Dados de emissão

8. **Notificações**
   - Alertas em tempo real
   - Status de leitura

9. **Auditoria**
   - Log de ações
   - Rastreabilidade

## Fluxo de Autenticação

```
1. User acessa /login
2. Insere credenciais
3. Supabase Auth valida
4. JWT token gerado
5. AuthContext armazena sessão
6. Busca perfil do usuário
7. Redireciona para dashboard apropriado
```

## Fluxo de Autorização

```
1. User tenta acessar rota protegida
2. ProtectedRoute verifica autenticação
3. Verifica role do usuário
4. Compara com allowedRoles da rota
5. Permite acesso ou redireciona
```

## Segurança

### Row Level Security (RLS)

Todas as tabelas sensíveis têm RLS habilitado:

```sql
-- Exemplo: Usuario só vê suas próprias empresas
CREATE POLICY "Users can view own empresa" 
ON empresa FOR SELECT 
USING (auth.uid() = user_id);
```

### Roles e Permissões

| Role          | Permissões                                    |
|---------------|-----------------------------------------------|
| Cliente       | Ver/editar própria empresa e documentos      |
| Contador      | Ver/editar todas empresas, emitir NFSe       |
| Administrador | Acesso completo, gerenciar usuários e sistema|

## Escalabilidade

### Frontend
- Lazy loading de rotas
- Code splitting
- Componentes reutilizáveis
- Custom hooks para lógica compartilhada

### Backend
- Supabase auto-scaling
- Connection pooling
- Índices otimizados
- Queries eficientes

## Performance

### Otimizações Implementadas
1. **Índices de banco de dados** nas colunas mais consultadas
2. **React.memo** em componentes pesados
3. **Debounce** em buscas
4. **Paginação** em listas grandes
5. **Lazy loading** de imagens e documentos

## Monitoramento

### Logs Disponíveis
1. **Supabase Dashboard**
   - Database logs
   - API logs
   - Auth logs

2. **Browser Console**
   - Erros de runtime
   - Network requests
   - State changes

## Deploy

### Desenvolvimento
```bash
npm run dev
```

### Produção
```bash
npm run build
npm run preview
```

### Hospedagem Sugerida
- **Frontend**: Vercel, Netlify, Cloudflare Pages
- **Backend**: Supabase (já hospedado)

## Extensibilidade

### Adicionar Novo Tipo de Usuário
1. Adicionar role na tabela `perfil`
2. Criar novo dashboard em `pages/dashboards/`
3. Adicionar rota em `App.tsx`
4. Configurar permissões RLS

### Adicionar Nova Tabela
1. Criar migration SQL
2. Adicionar tipo em `database.types.ts`
3. Criar hook customizado
4. Implementar componentes de UI

### Adicionar Nova Feature
1. Criar componentes necessários
2. Adicionar serviços/hooks
3. Criar rotas protegidas
4. Atualizar navegação (Sidebar)

## Manutenção

### Backup
- Usar ferramentas do Supabase
- Exportar dados regularmente
- Versionamento do schema SQL

### Atualizações
- Manter dependências atualizadas
- Testar em ambiente de staging
- Monitorar breaking changes

## Próximas Melhorias

1. ✅ Autenticação e autorização
2. ✅ Dashboards por tipo de usuário
3. ⏳ Upload de documentos
4. ⏳ Sistema de pagamentos
5. ⏳ Relatórios e gráficos
6. ⏳ Exportação de dados
7. ⏳ Notificações por email
8. ⏳ Chat de suporte
9. ⏳ Testes automatizados
10. ⏳ CI/CD pipeline

## Contato e Suporte

Para dúvidas sobre a arquitetura ou implementação, consulte:
- Documentação do Supabase
- React documentation
- TypeScript handbook
