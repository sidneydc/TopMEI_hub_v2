# TopMEI - Database Scripts  v2.0

Sistema de gerenciamento de banco de dados para o TopMEI v2.

## 📋 Ordem de Execução dos Scripts

Execute os scripts SQL na seguinte ordem para configurar o banco de dados completamente:

### 1. **criar_tabelas.sql** (OBRIGATÓRIO)
Cria todas as tabelas do sistema incluindo:
- Perfis e usuários (perfil, user_perfis)
- Empresas e relacionados (empresa, cnaes_secundarios, inscricoes)
- Documentos (tipo_documentos, documentos)
- Serviços e planos (servicos, planos, empresas_planos, empresa_servicos)
- Cobranças (cobranca_plano, cobranca_servicos)
- NFSe e certificados digitais (nfse, certificados_digitais)
- Orçamentos (templates_orcamento, orcamento)
- Notificações e auditoria (notificacao, auditoria)

### 2. **criar_triggers.sql** (OBRIGATÓRIO)
Cria triggers de auditoria automática para:
- Registro de inserções, atualizações e exclusões
- Atualização automática de timestamps (updated_at)
- Rastreamento de alterações em tabelas críticas

### 3. **criar_polices.sql** (OBRIGATÓRIO)
Configura todas as políticas RLS (Row Level Security):
- Habilita RLS em todas as tabelas
- Define políticas para clientes, contadores e administradores
- Configura permissões do storage (certificados, documentos, logos)
- Cria funções auxiliares (get_users_with_emails, get_user_role)
- **NOVO**: Políticas para certificados_digitais e storage certificados

### 4. **criar_exemplos.sql** (OPCIONAL - Desenvolvimento)
Insere dados de exemplo para testes:
- 3 perfis (cliente, contador, administrador)
- Usuários de teste
- Empresas exemplo
- Tipos de documentos
- Serviços e planos
- Templates de orçamento

## 🗂️ Scripts Adicionais

### **add_tipo_prazo_to_servicos.sql**
Adiciona colunas `tipo` e `prazo_dias` à tabela servicos.

### **dividir_tabela_nfse.sql**
Migração para separar certificados_digitais da tabela nfse.
- Cria tabela certificados_digitais
- Move dados existentes
- Atualiza relacionamentos
- Cria políticas RLS específicas

### **servicos_topmei_exemplos.sql**
Insere serviços específicos oferecidos pela TopMEI:
- Abertura de MEI
- Declaração Anual (DASN-SIMEI)
- Alteração cadastral
- Emissão de NFSe
- Etc.

### **setup_storage_certificados.sql**
Configuração completa do bucket de certificados digitais com estrutura de pastas por usuário.

## 🧹 Scripts de Limpeza

### **clean_all.sql**
Remove TODOS os dados e estruturas do banco (USE COM CUIDADO!)
- Desabilita RLS
- Limpa storage buckets
- Remove todas as tabelas
- Remove schemas

## 📁 Pasta sql_old/

Contém scripts antigos, versões anteriores e arquivos de correção que já foram integrados aos scripts principais:
- Versões antigas de políticas (fix_certificados_policies_v*.sql, fix_storage_*.sql)
- Scripts de correção históricos
- Schemas legados
- Testes e experimentações

**Não execute os scripts desta pasta** - eles são mantidos apenas para referência histórica.

## 🔒 Segurança (RLS)

O sistema implementa Row Level Security em três níveis:

### Cliente
- Vê apenas suas próprias empresas, documentos e notificações
- Pode criar/editar suas empresas e fazer upload de documentos
- Pode fazer upload e gerenciar seus certificados digitais
- Pode visualizar seus orçamentos e cobranças

### Contador  
- Vê todas as empresas e documentos
- Pode aprovar/rejeitar documentos e cadastros
- Pode criar orçamentos e gerenciar serviços
- Pode visualizar certificados digitais (somente leitura)

### Administrador
- Acesso total a todas as tabelas
- Pode gerenciar usuários, perfis e configurações
- Pode executar operações em nome de outros usuários
- Acesso total aos certificados digitais

## 📦 Storage Buckets

### certificados (5MB, público)
- Arquivos .pfx/.p12 de certificados digitais
- MIME types: application/x-pkcs12, application/pkcs12
- Políticas: usuários autenticados podem upload/view/update/delete
- Estrutura: `certificados/{empresa_id}-{timestamp}.pfx`

### doc_cus (10MB, privado)  
- Documentos dos clientes (PDF, JPG, PNG)
- MIME types: application/pdf, image/jpeg, image/jpg, image/png
- Políticas: clientes acessam suas pastas, contadores veem tudo
- Estrutura: `doc_cus/{empresa_id}/{tipo_doc}/{arquivo}`

### logos (2MB, público)
- Logos das empresas
- MIME types: image/jpeg, image/jpg, image/png, image/webp
- Políticas: upload autenticado, visualização pública
- Estrutura: `logos/{empresa_id}/{arquivo}`

## 🔧 Manutenção

### Verificar Políticas RLS
```sql
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Verificar Triggers
```sql
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table;
```

### Verificar Storage Buckets
```sql
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
ORDER BY name;
```

### Verificar Políticas de Storage
```sql
SELECT bucket_id, name, definition
FROM storage.policies
ORDER BY bucket_id, name;
```

## 📝 Notas Importantes

1. **Backup antes de executar**: Sempre faça backup antes de rodar scripts de migração ou limpeza
2. **Ordem importa**: Siga a ordem de execução especificada
3. **Ambiente de produção**: Teste em desenvolvimento antes de aplicar em produção
4. **Dados de exemplo**: Não execute criar_exemplos.sql em produção
5. **Storage buckets**: São criados automaticamente pelo criar_polices.sql

## 🐛 Troubleshooting

### Erro: "relation already exists"
- O script já foi executado anteriormente
- Use DROP TABLE IF EXISTS ou limpe com clean_all.sql

### Erro: "policy already exists"  
- Use DROP POLICY IF EXISTS antes de CREATE POLICY
- Os scripts principais já incluem esta verificação

### Erro: "new row violates row-level security policy" (tabela)
- Verifique se criar_polices.sql foi executado
- Confirme que o usuário está autenticado (auth.uid() não é null)
- Verifique se o perfil do usuário está ativo na tabela user_perfis

### Erro: "new row violates row-level security policy" (storage)
- Verifique se as políticas de storage foram criadas (criar_polices.sql)
- Confirme que o bucket existe na tabela storage.buckets
- Verifique se o usuário tem role 'authenticated'

### Upload de certificado falhando
- Execute as políticas de storage do criar_polices.sql
- Verifique se o bucket 'certificados' existe e é público
- Confirme os MIME types permitidos (application/x-pkcs12)

## 🆕 Changelog v2.0

### Adicionado
- Políticas RLS completas para certificados_digitais
- Storage bucket 'certificados' com políticas
- Documentação expandida sobre storage buckets
- Scripts de correção movidos para sql_old/

### Modificado
- criar_polices.sql agora inclui certificados_digitais e storage certificados
- README expandido com troubleshooting e manutenção
- Estrutura sql_old/ reorganizada

### Corrigido
- Políticas RLS de upload de certificados
- Permissões de storage para usuários autenticados

---

**Última atualização**: 17/11/2025  
**Versão**: 2.0  
**Autor**: TopMEI Development Team
