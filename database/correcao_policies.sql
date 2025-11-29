-- CORREÇÃO DE POLÍTICAS RLS PARA BANCO NOVO
-- Execute este script no SQL Editor do Supabase para garantir que as políticas fiquem idênticas ao banco antigo

-- EMPRESA
DROP POLICY IF EXISTS "Users can view own empresa" ON empresa;
CREATE POLICY "Users can view own empresa" ON empresa
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own empresa" ON empresa;
CREATE POLICY "Users can insert own empresa" ON empresa
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own empresa" ON empresa;
CREATE POLICY "Users can update own empresa" ON empresa
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Contador can view all empresas" ON empresa;
CREATE POLICY "Contador can view all empresas" ON empresa
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_perfis up
      JOIN perfil p ON p.id = up.perfil_id
      WHERE up.user_id = auth.uid()
      AND p.role IN ('contador', 'administrador')
      AND up.ativo = true
    )
  );

DROP POLICY IF EXISTS "Contador can update empresas" ON empresa;
CREATE POLICY "Contador can update empresas" ON empresa
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_perfis up
      JOIN perfil p ON p.id = up.perfil_id
      WHERE up.user_id = auth.uid()
      AND p.role IN ('contador', 'administrador')
      AND up.ativo = true
    )
  );

DROP POLICY IF EXISTS "Admin can do all on empresas" ON empresa;
CREATE POLICY "Admin can do all on empresas" ON empresa
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_perfis up
      JOIN perfil p ON p.id = up.perfil_id
      WHERE up.user_id = auth.uid()
      AND p.role = 'administrador'
      AND up.ativo = true
    )
  );

-- Adicione outros blocos de políticas conforme necessário para outras tabelas
-- (documentos, notificacao, nfse, etc.)
