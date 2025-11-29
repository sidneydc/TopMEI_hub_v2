# Database Setup - TopMEI

Este diretório contém os scripts SQL organizados para fácil replicação do banco de dados.

## 📁 Estrutura de Arquivos

```
database/
├── criar_tabelas.sql      # Criação de todas as tabelas, índices e comentários
├── criar_triggers.sql     # Funções e triggers (auditoria, auto-perfil)
├── criar_polices.sql      # Políticas RLS, funções auxiliares e storage
├── criar_exemplos.sql     # Dados iniciais (perfis, planos, templates, etc)
├── clean_all.sql          # Script para limpar todo o banco (desenvolvimento)
└── sql_old/              # Arquivos SQL antigos (backup)
```

## 🚀 Como Replicar o Banco de Dados

Execute os arquivos **nesta ordem** no SQL Editor do Supabase:

### 1. Criar Tabelas
```sql
-- Executa: criar_tabelas.sql
-- Cria: 18 tabelas + índices + comentários
-- Tempo: ~2 segundos
```

### 2. Criar Triggers
```sql
-- Executa: criar_triggers.sql
-- Cria: Função de auditoria + trigger de novo usuário + 27 triggers de auditoria
-- Tempo: ~1 segundo
```

### 3. Criar Políticas RLS
```sql
-- Executa: criar_polices.sql
-- Cria: Políticas RLS para todas as tabelas + Storage buckets + Função get_users_with_emails()
-- Inclui: Policies de administrador para gerenciar todos os usuários
-- Tempo: ~3 segundos
```

### 4. Inserir Dados de Exemplo
```sql
-- Executa: criar_exemplos.sql
-- Insere: Perfis, tipos de documentos, planos, serviços, templates
-- Tempo: ~1 segundo
```

## 🧹 Desenvolvimento - Limpar Banco

Para resetar o banco durante desenvolvimento:

```sql
-- Executa: clean_all.sql
-- Remove: TODOS os dados e estruturas (tabelas, triggers, functions, policies, storage)
-- ⚠️ CUIDADO: Operação irreversível!
```

## 📋 Detalhes dos Arquivos

### `criar_tabelas.sql` (400 linhas)
- **Perfis e Usuários**: `perfil`, `user_perfis`
- **Empresas**: `empresa`, `cnaes_secundarios`, `inscricoes`
- **Documentos**: `tipo_documentos`, `documentos`
- **Serviços**: `servicos`, `planos`, `empresas_planos`, `empresa_servicos`
- **Cobranças**: `cobranca_plano`, `cobranca_servicos`
- **Fiscais**: `nfse`
- **Orçamentos**: `templates_orcamento`, `orcamento`
- **Sistema**: `notificacao`, `auditoria`
- **Índices**: 11 índices para performance
- **Comentários**: Documentação inline de cada tabela

### `criar_triggers.sql` (300 linhas)
- **handle_new_user()**: Atribui perfil "cliente" automaticamente para novos usuários
- **registrar_auditoria()**: Registra INSERT, UPDATE, DELETE em tabela de auditoria
- **27 Triggers**: Auditoria para empresa, documentos, planos, serviços, cobranças, nfse, orcamento

### `criar_polices.sql` (700 linhas)
- **RLS habilitado** em todas as 18 tabelas
- **Políticas por perfil**:
  - Cliente: vê apenas suas próprias empresas e dados
  - Contador: vê todas as empresas e dados
  - Admin: acesso total ao sistema
- **Storage Buckets**:
  - `doc_cus`: Documentos privados (10MB, PDF/JPG/PNG)
  - `logos`: Logos públicas das empresas
- **Políticas de Storage**: Upload, visualização, atualização e exclusão

### `criar_exemplos.sql` (350 linhas)
- **3 Perfis**: cliente, contador, administrador
- **10 Tipos de documentos**: RG, CPF, CCMEI, comprovante, etc.
- **9 Planos**: 
  - Mensais: Básico (R$ 29,90), Profissional (R$ 49,90), Premium (R$ 79,90)
  - Semestrais: 10% desconto
  - Anuais: 20% desconto (2 meses grátis)
- **9 Serviços**: Abertura MEI, DASN, NFSe, consultoria, etc.
- **5 Templates**: moderno, classico, criativo, minimalista, corporativo

## 🔧 Requisitos

- **Supabase Project** configurado
- **PostgreSQL 15+** (padrão do Supabase)
- **Auth habilitado** (auth.users table)
- **Storage habilitado**

## ✅ Verificação Pós-Instalação

Execute estas queries para verificar se tudo foi criado corretamente:

```sql
-- Verificar tabelas criadas (deve retornar 18)
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';

-- Verificar triggers criados (deve retornar 28)
SELECT COUNT(*) FROM information_schema.triggers 
WHERE trigger_schema = 'public';

-- Verificar políticas RLS (deve retornar 50+)
SELECT COUNT(*) FROM pg_policies;

-- Verificar perfis inseridos (deve retornar 3)
SELECT role, descricao FROM perfil;

-- Verificar templates (deve retornar 5)
SELECT id, nome, ordem FROM templates_orcamento ORDER BY ordem;

-- Verificar planos (deve retornar 9)
SELECT COUNT(*) FROM planos;

-- Verificar storage buckets (deve retornar 2)
SELECT id, public FROM storage.buckets WHERE id IN ('doc_cus', 'logos');
```

## 🗂️ Pasta sql_old

Contém os arquivos SQL originais antes da reorganização. Mantidos para referência e backup:

- `schema.sql` - Schema original
- `POLICIES*.sql` - Políticas antigas separadas
- `TRIGGERS_AUDITORIA.sql` - Triggers originais
- `STORAGE_*.sql` - Configurações de storage
- `*_exemplo.sql` - Dados de exemplo originais
- Outros arquivos de fix e migrações

## 📝 Notas Importantes

1. **Ordem de execução é crítica**: Tabelas → Triggers → Policies → Exemplos
2. **Idempotência**: Os scripts usam `IF NOT EXISTS` e `ON CONFLICT` para serem executados múltiplas vezes
3. **RLS ativo**: Todas as tabelas têm RLS habilitado - usuários só veem seus próprios dados
4. **Auditoria automática**: Todas as operações são registradas na tabela `auditoria`
5. **Storage público**: Bucket `logos` é público para acesso externo via URL

## 🔄 Atualizações Futuras

Para adicionar novas features ao banco:

1. Crie um arquivo de migração: `migration_YYYY_MM_DD_descricao.sql`
2. Execute no Supabase após os 4 arquivos principais
3. Documente a migração neste README

## 🐛 Troubleshooting

**Erro: "relation already exists"**
- Normal se executar múltiplas vezes
- Scripts são idempotentes (podem ser re-executados)

**Erro: "permission denied"**
- Verifique se está usando o SQL Editor do Supabase
- Certifique-se de ter permissões de admin

**Políticas RLS não funcionam**
- Verifique se executou `criar_polices.sql` após `criar_tabelas.sql`
- Teste com `SELECT * FROM perfil` logado como cliente

**Storage não funciona**
- Verifique se os buckets foram criados: `SELECT * FROM storage.buckets`
- Teste upload na interface do Supabase Storage

## 📞 Suporte

Para problemas ou dúvidas sobre a estrutura do banco de dados, consulte:

- **ARCHITECTURE.md** - Arquitetura geral do sistema
- **SUPABASE_SETUP.md** - Setup detalhado do Supabase
- **AUDITORIA.md** - Documentação do sistema de auditoria

---

**Última atualização**: Janeiro 2025  
**Versão**: 2.0 (Estrutura reorganizada)
