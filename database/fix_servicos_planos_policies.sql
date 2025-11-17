-- =====================================================
-- FIX: Policies para tabelas servicos e planos
-- =====================================================
-- Problema: RLS habilitado mas sem policies = acesso negado
-- Solução: Criar policies para admin e usuários autenticados
-- =====================================================

-- =====================================================
-- POLÍTICAS: servicos
-- =====================================================

-- Todos podem ver serviços ativos
DROP POLICY IF EXISTS "Anyone can view active servicos" ON servicos;
CREATE POLICY "Anyone can view active servicos" ON servicos
  FOR SELECT TO authenticated
  USING (ativo = true);

-- Admin pode ver todos os serviços
DROP POLICY IF EXISTS "Admin can view all servicos" ON servicos;
CREATE POLICY "Admin can view all servicos" ON servicos
  FOR SELECT TO authenticated
  USING (
    get_user_role(auth.uid()) = 'administrador'
  );

-- Admin pode inserir serviços
DROP POLICY IF EXISTS "Admin can insert servicos" ON servicos;
CREATE POLICY "Admin can insert servicos" ON servicos
  FOR INSERT TO authenticated
  WITH CHECK (
    get_user_role(auth.uid()) = 'administrador'
  );

-- Admin pode atualizar serviços
DROP POLICY IF EXISTS "Admin can update servicos" ON servicos;
CREATE POLICY "Admin can update servicos" ON servicos
  FOR UPDATE TO authenticated
  USING (
    get_user_role(auth.uid()) = 'administrador'
  );

-- Admin pode deletar serviços
DROP POLICY IF EXISTS "Admin can delete servicos" ON servicos;
CREATE POLICY "Admin can delete servicos" ON servicos
  FOR DELETE TO authenticated
  USING (
    get_user_role(auth.uid()) = 'administrador'
  );

-- =====================================================
-- POLÍTICAS: planos
-- =====================================================

-- Todos podem ver planos ativos
DROP POLICY IF EXISTS "Anyone can view active planos" ON planos;
CREATE POLICY "Anyone can view active planos" ON planos
  FOR SELECT TO authenticated
  USING (ativo = true);

-- Admin pode ver todos os planos
DROP POLICY IF EXISTS "Admin can view all planos" ON planos;
CREATE POLICY "Admin can view all planos" ON planos
  FOR SELECT TO authenticated
  USING (
    get_user_role(auth.uid()) = 'administrador'
  );

-- Admin pode inserir planos
DROP POLICY IF EXISTS "Admin can insert planos" ON planos;
CREATE POLICY "Admin can insert planos" ON planos
  FOR INSERT TO authenticated
  WITH CHECK (
    get_user_role(auth.uid()) = 'administrador'
  );

-- Admin pode atualizar planos
DROP POLICY IF EXISTS "Admin can update planos" ON planos;
CREATE POLICY "Admin can update planos" ON planos
  FOR UPDATE TO authenticated
  USING (
    get_user_role(auth.uid()) = 'administrador'
  );

-- Admin pode deletar planos
DROP POLICY IF EXISTS "Admin can delete planos" ON planos;
CREATE POLICY "Admin can delete planos" ON planos
  FOR DELETE TO authenticated
  USING (
    get_user_role(auth.uid()) = 'administrador'
  );

-- =====================================================
-- IMPORTANTE: 
-- - Usa get_user_role() para evitar recursão
-- - Duas policies de SELECT: uma para ativos (todos) e outra para admin (todos)
-- - Admin tem acesso completo (INSERT, UPDATE, DELETE)
-- =====================================================
