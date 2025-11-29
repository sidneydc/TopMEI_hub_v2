# Guia de Configuração do Supabase para TopMEI

## 1. Criar Projeto no Supabase

1. Acesse https://supabase.com e faça login
2. Clique em "New Project"
3. Preencha os dados:
   - Nome do projeto: `topmei-hub`
   - Database Password: (anote essa senha)
   - Region: escolha a mais próxima
4. Aguarde a criação do projeto (2-3 minutos)

## 2. Obter Credenciais

1. No painel do projeto, vá em **Settings** > **API**
2. Copie:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`
3. Cole essas informações no arquivo `.env` do projeto

## 3. Executar Script SQL

1. No painel do Supabase, vá em **SQL Editor**
2. Clique em "+ New query"
3. Copie todo o conteúdo do arquivo `database/schema.sql`
4. Cole no editor SQL
5. Clique em **Run** (ou Ctrl+Enter)
6. Verifique se todas as tabelas foram criadas em **Database** > **Tables**

## 4. Configurar Autenticação

1. Vá em **Authentication** > **Settings**
2. Configure:
   - **Site URL**: `http://localhost:5173` (desenvolvimento)
   - **Redirect URLs**: adicione `http://localhost:5173/**`

### Configurar Email

1. Em **Authentication** > **Email Templates**, personalize os templates de:
   - Confirmation email
   - Reset password email
   - Magic link email

2. Para produção, configure um provedor SMTP em **Project Settings** > **Auth** > **SMTP Settings**

## 5. Configurar Storage (para upload de documentos)

1. Vá em **Storage**
2. Crie um bucket chamado `documentos`
3. Configure as políticas de acesso:

```sql
-- Permitir upload para usuários autenticados
CREATE POLICY "Users can upload own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documentos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Permitir visualização apenas dos próprios documentos
CREATE POLICY "Users can view own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documentos' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## 6. Criar Primeiro Usuário Administrador

Após criar sua conta no sistema, execute este SQL para torná-la administrador:

```sql
-- Substitua 'seu-user-id' pelo ID do usuário criado
-- Você pode encontrar o ID em Authentication > Users

-- Obter o ID do perfil de administrador
SELECT id FROM perfil WHERE role = 'administrador';

-- Inserir o relacionamento (substitua os UUIDs)
INSERT INTO user_perfis (user_id, perfil_id, ativo)
VALUES (
  'seu-user-id-aqui',
  (SELECT id FROM perfil WHERE role = 'administrador'),
  true
);
```

## 7. Configurar Realtime (Notificações em tempo real)

1. Vá em **Database** > **Replication**
2. Habilite a replicação para a tabela `notificacao`
3. Isso permitirá que notificações apareçam em tempo real

## 8. Segurança Adicional

### Configurar Row Level Security (RLS)

Já está habilitado nas principais tabelas pelo script SQL. Para adicionar mais policies:

```sql
-- Exemplo: Contador pode ver todas as empresas
CREATE POLICY "Contador can view all empresas" ON empresa
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_perfis up
      JOIN perfil p ON p.id = up.perfil_id
      WHERE up.user_id = auth.uid()
      AND p.role = 'contador'
      AND up.ativo = true
    )
  );

-- Admin pode ver tudo
CREATE POLICY "Admin can view all empresas" ON empresa
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_perfis up
      JOIN perfil p ON p.id = up.perfil_id
      WHERE up.user_id = auth.uid()
      AND p.role = 'administrador'
      AND up.ativo = true
    )
  );
```

### Limitar Taxa de Requisições

1. Vá em **Project Settings** > **API**
2. Configure rate limiting conforme necessário

## 9. Backup Automático

1. Vá em **Project Settings** > **Database**
2. Configure backups automáticos (disponível nos planos pagos)
3. Para desenvolvimento, você pode exportar manualmente via SQL:

```sql
-- Exportar dados importantes
COPY (SELECT * FROM empresa) TO '/tmp/empresas.csv' CSV HEADER;
```

## 10. Monitoramento

1. Vá em **Database** > **Logs** para ver logs SQL
2. Use **API** > **Logs** para ver requisições da API
3. Configure alertas em **Project Settings** > **Alerts**

## 11. Variáveis de Ambiente para Produção

Quando for para produção, atualize:

```env
VITE_SUPABASE_URL=sua_url_de_producao
VITE_SUPABASE_ANON_KEY=sua_chave_de_producao
```

E configure as redirect URLs no Supabase:
- Site URL: `https://seudominio.com`
- Redirect URLs: `https://seudominio.com/**`

## Troubleshooting

### Erro de autenticação
- Verifique se as credenciais no `.env` estão corretas
- Confirme que o email foi verificado
- Verifique as redirect URLs

### Erro de permissão (RLS)
- Verifique as policies RLS no banco
- Confirme que o user_perfis está configurado corretamente
- Use o SQL Editor para testar queries manualmente

### Erro ao carregar dados
- Verifique os logs em Database > Logs
- Confirme que as tabelas foram criadas corretamente
- Teste a conexão com o Supabase client

## Recursos Úteis

- [Documentação do Supabase](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Guide](https://supabase.com/docs/guides/storage)
- [Auth Guide](https://supabase.com/docs/guides/auth)
