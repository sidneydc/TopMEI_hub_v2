# Sistema de Auditoria Automática

## 📋 Visão Geral

O sistema de auditoria registra **automaticamente** todas as operações de INSERT, UPDATE e DELETE em todas as tabelas críticas do TopMEI.

## 🎯 Funcionalidades

### ✅ Registros Automáticos
- **INSERT**: Registra quando um novo registro é criado
- **UPDATE**: Registra alterações em registros existentes
- **DELETE**: Registra quando um registro é excluído

### ✅ Informações Capturadas
- `user_id`: Quem fez a operação
- `empresa_id`: Empresa relacionada (se aplicável)
- `tabela`: Nome da tabela afetada
- `acao`: INSERT, UPDATE ou DELETE
- `registro_id`: ID do registro afetado
- `dados_anteriores`: Estado ANTES da alteração (JSON)
- `dados_novos`: Estado DEPOIS da alteração (JSON)
- `created_at`: Quando ocorreu

## 📊 Tabelas Monitoradas

O sistema de auditoria monitora as seguintes tabelas:

1. ✅ `empresa` - Cadastro de empresas
2. ✅ `empresas_planos` - Planos contratados
3. ✅ `documentos` - Upload de documentos
4. ✅ `servicos` - Cadastro de serviços
5. ✅ `planos` - Gestão de planos
6. ✅ `empresa_servicos` - Serviços contratados
7. ✅ `cobranca_plano` - Cobranças de planos
8. ✅ `cobranca_servicos` - Cobranças de serviços
9. ✅ `nfse` - Notas fiscais eletrônicas
10. ✅ `orcamento` - Orçamentos
11. ✅ `cnaes_secundarios` - CNAEs secundários
12. ✅ `inscricoes` - Inscrições estaduais/municipais

## 🔧 Instalação

### 1. Execute o Script SQL

No Supabase SQL Editor, execute na seguinte ordem:

```bash
1. schema.sql          # Criar tabelas
2. POLICIES.sql        # Criar políticas RLS
3. TRIGGERS_AUDITORIA.sql  # Criar sistema de auditoria ⭐
```

### 2. Verifique a Instalação

Execute esta query para verificar se os triggers foram criados:

```sql
SELECT 
  trigger_name,
  event_object_table,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_name LIKE 'trigger_auditoria%'
ORDER BY event_object_table, event_manipulation;
```

Você deve ver **3 triggers por tabela** (INSERT, UPDATE, DELETE).

## 📖 Como Usar

### Consultar Auditoria de uma Empresa

```sql
-- Ver todas as ações de uma empresa específica
SELECT 
  created_at,
  acao,
  tabela,
  dados_anteriores,
  dados_novos
FROM auditoria
WHERE empresa_id = 'uuid-da-empresa'
ORDER BY created_at DESC;
```

### Ver Últimas Ações

```sql
-- Usar a view criada automaticamente
SELECT * FROM v_auditoria_empresa
LIMIT 20;
```

### Ver Ações do Dia

```sql
SELECT * FROM v_auditoria_hoje;
```

### Resumo por Tabela

```sql
SELECT * FROM v_auditoria_resumo;
```

### Comparar Estados (Antes e Depois)

```sql
-- Ver o que foi alterado em um UPDATE
SELECT 
  tabela,
  registro_id,
  dados_anteriores ->> 'status_cadastro' as status_anterior,
  dados_novos ->> 'status_cadastro' as status_novo,
  created_at
FROM auditoria
WHERE acao = 'UPDATE'
  AND tabela = 'empresa'
  AND registro_id = 'uuid-do-registro'
ORDER BY created_at DESC;
```

## 🔐 Permissões (RLS)

### Administradores
- ✅ Veem **toda** a auditoria do sistema
- ✅ Podem filtrar por qualquer empresa ou usuário

### Contadores
- ✅ Veem auditoria das empresas que gerenciam
- ❌ Não veem auditoria de outras empresas

### Clientes
- ✅ Veem apenas auditoria de suas próprias empresas
- ❌ Não veem auditoria de outros clientes

## 📈 Views Disponíveis

### 1. `v_auditoria_empresa`
Lista detalhada de todas as ações com informações da empresa e usuário:
- Razão social da empresa
- Email do usuário
- Dados antes e depois
- Ordenado por data (mais recente primeiro)

### 2. `v_auditoria_resumo`
Resumo estatístico por tabela e ação:
- Quantidade total de cada tipo de ação
- Data da última ação

### 3. `v_auditoria_hoje`
Todas as ações do dia atual:
- Útil para monitoramento em tempo real
- Mostra empresa e usuário

## 💡 Exemplos Práticos

### Exemplo 1: Rastrear Mudança de Status

Quando um administrador aprova uma empresa:

```sql
-- A auditoria registra automaticamente:
{
  "user_id": "uuid-do-admin",
  "empresa_id": "uuid-da-empresa",
  "tabela": "empresa",
  "acao": "UPDATE",
  "dados_anteriores": {
    "status_cadastro": "aguardando_aprovacao",
    ...
  },
  "dados_novos": {
    "status_cadastro": "aprovado",
    "aprovado_por": "admin@email.com",
    "data_aprovacao": "2024-01-15T10:30:00Z",
    ...
  }
}
```

### Exemplo 2: Rastrear Exclusão de Empresa

Quando um cliente exclui uma empresa:

```sql
-- A auditoria registra:
{
  "user_id": "uuid-do-cliente",
  "empresa_id": "uuid-da-empresa",
  "tabela": "empresa",
  "acao": "DELETE",
  "dados_anteriores": {
    "razao_social": "Empresa Exemplo LTDA",
    "cnpj": "12345678000100",
    ...
  },
  "dados_novos": null
}
```

### Exemplo 3: Rastrear Cadastro de Empresa

Quando um cliente cadastra uma nova empresa:

```sql
-- A auditoria registra:
{
  "user_id": "uuid-do-cliente",
  "empresa_id": "uuid-da-nova-empresa",
  "tabela": "empresa",
  "acao": "INSERT",
  "dados_anteriores": null,
  "dados_novos": {
    "razao_social": "Nova Empresa MEI",
    "cnpj": "98765432000100",
    "status_cadastro": "aguardando_aprovacao",
    ...
  }
}
```

## 🔍 Queries Úteis para Administradores

### Atividade por Usuário

```sql
SELECT 
  u.email,
  COUNT(*) as total_acoes,
  COUNT(CASE WHEN a.acao = 'INSERT' THEN 1 END) as inserts,
  COUNT(CASE WHEN a.acao = 'UPDATE' THEN 1 END) as updates,
  COUNT(CASE WHEN a.acao = 'DELETE' THEN 1 END) as deletes
FROM auditoria a
JOIN auth.users u ON a.user_id = u.id
GROUP BY u.email
ORDER BY total_acoes DESC;
```

### Atividade por Período

```sql
SELECT 
  DATE(created_at) as dia,
  COUNT(*) as total_acoes,
  COUNT(DISTINCT user_id) as usuarios_ativos,
  COUNT(DISTINCT empresa_id) as empresas_afetadas
FROM auditoria
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY dia DESC;
```

### Empresas Mais Modificadas

```sql
SELECT 
  e.razao_social,
  e.cnpj,
  COUNT(*) as total_modificacoes
FROM auditoria a
JOIN empresa e ON a.empresa_id = e.id
WHERE a.acao IN ('UPDATE', 'DELETE')
GROUP BY e.id, e.razao_social, e.cnpj
ORDER BY total_modificacoes DESC
LIMIT 10;
```

## 🛠️ Manutenção

### Limpeza de Registros Antigos

Execute periodicamente para manter a performance:

```sql
-- Manter apenas últimos 12 meses
DELETE FROM auditoria
WHERE created_at < CURRENT_DATE - INTERVAL '12 months';
```

### Estatísticas da Tabela

```sql
SELECT 
  COUNT(*) as total_registros,
  MIN(created_at) as primeiro_registro,
  MAX(created_at) as ultimo_registro,
  pg_size_pretty(pg_total_relation_size('auditoria')) as tamanho_tabela
FROM auditoria;
```

## 🚀 Funcionalidades Futuras

Possíveis melhorias:

- [ ] Capturar IP e User-Agent (campos já existem)
- [ ] Dashboard visual de auditoria
- [ ] Alertas automáticos para ações críticas
- [ ] Exportação de relatórios de auditoria
- [ ] Restauração de dados a partir do histórico
- [ ] Diff visual entre estados anterior e novo

## ⚠️ Observações Importantes

1. **Performance**: Os triggers são executados AFTER (após) a operação, não bloqueiam
2. **Espaço**: A tabela de auditoria cresce continuamente - planejar limpezas
3. **JSONB**: Dados completos em JSON permitem análise detalhada
4. **RLS**: Políticas garantem que cada perfil vê apenas o que deve
5. **Segurança**: Função usa SECURITY DEFINER para garantir execução

## 📞 Suporte

Para dúvidas sobre o sistema de auditoria:
- Consulte este documento
- Execute as queries de exemplo
- Verifique os comentários no código SQL
