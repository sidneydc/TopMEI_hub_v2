-- =====================================================
-- POLÍTICAS RLS PARA DOCUMENTOS E TIPOS DE DOCUMENTOS
-- =====================================================

-- Habilitar RLS nas tabelas
ALTER TABLE tipo_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS PARA tipo_documentos
-- =====================================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Todos podem ver tipos de documentos" ON tipo_documentos;

-- Permitir que todos os usuários autenticados vejam os tipos de documentos
CREATE POLICY "Todos podem ver tipos de documentos"
ON tipo_documentos
FOR SELECT
TO authenticated
USING (ativo = true);

-- =====================================================
-- POLÍTICAS PARA documentos
-- =====================================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Clientes podem ver seus documentos" ON documentos;
DROP POLICY IF EXISTS "Contadores podem ver todos documentos" ON documentos;
DROP POLICY IF EXISTS "Clientes podem inserir documentos" ON documentos;
DROP POLICY IF EXISTS "Clientes podem atualizar seus documentos pendentes" ON documentos;
DROP POLICY IF EXISTS "Clientes podem excluir seus documentos pendentes" ON documentos;
DROP POLICY IF EXISTS "Contadores podem atualizar documentos" ON documentos;

-- 1. SELECT: Clientes veem documentos de suas empresas
CREATE POLICY "Clientes podem ver seus documentos"
ON documentos
FOR SELECT
TO authenticated
USING (
  empresa_id IN (
    SELECT id 
    FROM empresa 
    WHERE user_id = auth.uid()
  )
  OR
  -- Contadores e administradores veem todos
  EXISTS (
    SELECT 1 
    FROM user_perfis up
    JOIN perfil p ON p.id = up.perfil_id
    WHERE up.user_id = auth.uid()
    AND p.role IN ('contador', 'administrador')
  )
);

-- 2. INSERT: Clientes podem inserir documentos em suas empresas
CREATE POLICY "Clientes podem inserir documentos"
ON documentos
FOR INSERT
TO authenticated
WITH CHECK (
  empresa_id IN (
    SELECT id 
    FROM empresa 
    WHERE user_id = auth.uid()
    AND status_cadastro != 'inativo'
  )
);

-- 3. UPDATE: Clientes podem atualizar apenas documentos pendentes
CREATE POLICY "Clientes podem atualizar seus documentos pendentes"
ON documentos
FOR UPDATE
TO authenticated
USING (
  empresa_id IN (
    SELECT id 
    FROM empresa 
    WHERE user_id = auth.uid()
  )
  AND status = 'aguardando_aprovacao'
)
WITH CHECK (
  empresa_id IN (
    SELECT id 
    FROM empresa 
    WHERE user_id = auth.uid()
  )
);

-- 4. UPDATE: Contadores e administradores podem atualizar qualquer documento
CREATE POLICY "Contadores podem atualizar documentos"
ON documentos
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM user_perfis up
    JOIN perfil p ON p.id = up.perfil_id
    WHERE up.user_id = auth.uid()
    AND p.role IN ('contador', 'administrador')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM user_perfis up
    JOIN perfil p ON p.id = up.perfil_id
    WHERE up.user_id = auth.uid()
    AND p.role IN ('contador', 'administrador')
  )
);

-- 5. DELETE: Clientes podem excluir apenas documentos aguardando aprovação
CREATE POLICY "Clientes podem excluir seus documentos pendentes"
ON documentos
FOR DELETE
TO authenticated
USING (
  empresa_id IN (
    SELECT id 
    FROM empresa 
    WHERE user_id = auth.uid()
  )
  AND status = 'aguardando_aprovacao'
);

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Verificar políticas criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename IN ('tipo_documentos', 'documentos')
ORDER BY tablename, policyname;
