-- =====================================================
-- CORRIGIR POLÍTICAS RLS DA TABELA certificados_digitais
-- VERSÃO 2: Remove todas as políticas existentes primeiro
-- =====================================================

-- Passo 1: Remover TODAS as políticas existentes da tabela
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'certificados_digitais') 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON certificados_digitais', r.policyname);
    END LOOP;
END $$;

-- Passo 2: Garantir que RLS está habilitado
ALTER TABLE certificados_digitais ENABLE ROW LEVEL SECURITY;

-- Passo 3: Criar políticas para usuários (clientes)
CREATE POLICY "Users can view their own certificates"
  ON certificados_digitais FOR SELECT
  USING (user_id IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Users can insert their own certificates"
  ON certificados_digitais FOR INSERT
  WITH CHECK (user_id IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Users can update their own certificates"
  ON certificados_digitais FOR UPDATE
  USING (user_id IS NOT NULL AND user_id = auth.uid())
  WITH CHECK (user_id IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Users can delete their own certificates"
  ON certificados_digitais FOR DELETE
  USING (user_id IS NOT NULL AND user_id = auth.uid());

-- Passo 4: Criar políticas para administradores
CREATE POLICY "Admins can view all certificates"
  ON certificados_digitais FOR SELECT
  USING (get_user_role(auth.uid()) = 'administrador');

CREATE POLICY "Admins can manage all certificates"
  ON certificados_digitais FOR ALL
  USING (get_user_role(auth.uid()) = 'administrador')
  WITH CHECK (get_user_role(auth.uid()) = 'administrador');

-- Passo 5: Criar políticas para contadores
CREATE POLICY "Contadores can view certificates"
  ON certificados_digitais FOR SELECT
  USING (get_user_role(auth.uid()) = 'contador');

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Verificar políticas criadas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'certificados_digitais'
ORDER BY policyname;

-- Verificar se RLS está habilitado
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'certificados_digitais';
