-- =====================================================
-- POLÍTICAS RLS PARA NOTIFICAÇÕES
-- =====================================================

-- Criar a tabela notificacao
CREATE TABLE IF NOT EXISTS notificacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  titulo VARCHAR(255),
  mensagem TEXT,
  visualizado BOOLEAN DEFAULT false,
  dt_visualizacao TIMESTAMPTZ,
  lida BOOLEAN DEFAULT false,
  data_leitura TIMESTAMPTZ,
  link TEXT,
  tipo VARCHAR(50)
);

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_notificacao_user ON notificacao(user_id);
CREATE INDEX IF NOT EXISTS idx_notificacao_lida ON notificacao(lida);
CREATE INDEX IF NOT EXISTS idx_notificacao_visualizado ON notificacao(visualizado);

-- Habilitar RLS na tabela
ALTER TABLE notificacao ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes
DROP POLICY IF EXISTS "Usuarios podem ver suas notificacoes" ON notificacao;
DROP POLICY IF EXISTS "Usuarios podem atualizar suas notificacoes" ON notificacao;
DROP POLICY IF EXISTS "Sistema pode inserir notificacoes" ON notificacao;
DROP POLICY IF EXISTS "Usuarios podem excluir suas notificacoes" ON notificacao;

-- 1. SELECT: Usuários podem ver apenas suas próprias notificações
CREATE POLICY "Usuarios podem ver suas notificacoes"
ON notificacao
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 2. UPDATE: Usuários podem atualizar apenas suas próprias notificações (marcar como lida)
CREATE POLICY "Usuarios podem atualizar suas notificacoes"
ON notificacao
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 3. INSERT: Todos usuários autenticados podem criar notificações
-- (necessário para que contadores criem notificações para clientes)
CREATE POLICY "Sistema pode inserir notificacoes"
ON notificacao
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 4. DELETE: Usuários podem excluir suas próprias notificações
CREATE POLICY "Usuarios podem excluir suas notificacoes"
ON notificacao
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Verificar políticas criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'notificacao'
ORDER BY policyname;

-- Verificar estrutura da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'notificacao'
ORDER BY ordinal_position;
