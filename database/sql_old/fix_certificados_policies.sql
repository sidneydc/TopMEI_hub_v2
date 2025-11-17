-- =====================================================
-- CORRIGIR POLÍTICAS RLS DA TABELA certificados_digitais
-- =====================================================

-- Habilitar RLS na tabela
ALTER TABLE certificados_digitais ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Users can view their own certificates" ON certificados_digitais;
DROP POLICY IF EXISTS "Users can insert their own certificates" ON certificados_digitais;
DROP POLICY IF EXISTS "Users can update their own certificates" ON certificados_digitais;
DROP POLICY IF EXISTS "Users can delete their own certificates" ON certificados_digitais;
DROP POLICY IF EXISTS "Admins can view all certificates" ON certificados_digitais;
DROP POLICY IF EXISTS "Admins can manage all certificates" ON certificados_digitais;
DROP POLICY IF EXISTS "Contadores can view certificates" ON certificados_digitais;

-- Criar políticas para usuários (clientes)
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

-- Criar políticas para administradores
CREATE POLICY "Admins can view all certificates"
  ON certificados_digitais FOR SELECT
  USING (get_user_role(auth.uid()) = 'administrador');

CREATE POLICY "Admins can manage all certificates"
  ON certificados_digitais FOR ALL
  USING (get_user_role(auth.uid()) = 'administrador')
  WITH CHECK (get_user_role(auth.uid()) = 'administrador');

-- Criar políticas para contadores
CREATE POLICY "Contadores can view certificates"
  ON certificados_digitais FOR SELECT
  USING (get_user_role(auth.uid()) = 'contador');

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Para verificar se as políticas foram criadas:
-- SELECT * FROM pg_policies WHERE tablename = 'certificados_digitais';

-- Para verificar se o RLS está habilitado:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'certificados_digitais';
