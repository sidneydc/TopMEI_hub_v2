-- =====================================================
-- CORRIGIR POLÍTICAS RLS - VERSÃO 3 (Simplificada)
-- Remove verificação IS NOT NULL que pode estar causando problemas
-- =====================================================

-- Passo 1: Desabilitar RLS temporariamente para limpeza
ALTER TABLE certificados_digitais DISABLE ROW LEVEL SECURITY;

-- Passo 2: Remover TODAS as políticas
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'certificados_digitais') 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON certificados_digitais', r.policyname);
    END LOOP;
END $$;

-- Passo 3: Reabilitar RLS
ALTER TABLE certificados_digitais ENABLE ROW LEVEL SECURITY;

-- Passo 4: Criar políticas SIMPLIFICADAS para usuários
CREATE POLICY "Users can view their own certificates"
  ON certificados_digitais FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own certificates"
  ON certificados_digitais FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own certificates"
  ON certificados_digitais FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own certificates"
  ON certificados_digitais FOR DELETE
  USING (user_id = auth.uid());

-- Passo 5: Criar política de SELECT para administradores
CREATE POLICY "Admins can view all certificates"
  ON certificados_digitais FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_perfis up
      INNER JOIN perfil p ON up.perfil_id = p.id
      WHERE up.user_id = auth.uid()
      AND p.role = 'administrador'
      AND up.ativo = true
    )
  );

-- Passo 6: Criar política de modificação para administradores
CREATE POLICY "Admins can manage all certificates"
  ON certificados_digitais FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_perfis up
      INNER JOIN perfil p ON up.perfil_id = p.id
      WHERE up.user_id = auth.uid()
      AND p.role = 'administrador'
      AND up.ativo = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_perfis up
      INNER JOIN perfil p ON up.perfil_id = p.id
      WHERE up.user_id = auth.uid()
      AND p.role = 'administrador'
      AND up.ativo = true
    )
  );

-- Passo 7: Criar política para contadores
CREATE POLICY "Contadores can view certificates"
  ON certificados_digitais FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_perfis up
      INNER JOIN perfil p ON up.perfil_id = p.id
      WHERE up.user_id = auth.uid()
      AND p.role = 'contador'
      AND up.ativo = true
    )
  );

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se RLS está habilitado
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'certificados_digitais';

-- Listar políticas criadas
SELECT 
    policyname,
    cmd as operation
FROM pg_policies 
WHERE tablename = 'certificados_digitais'
ORDER BY policyname;
