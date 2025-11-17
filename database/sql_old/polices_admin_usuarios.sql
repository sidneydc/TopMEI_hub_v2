-- =====================================================
-- REMOVER Policies Antigas (vamos recriar todas)
-- =====================================================

-- Remover policies antigas de user_perfis
DROP POLICY IF EXISTS "Users can view own perfis" ON user_perfis;
DROP POLICY IF EXISTS "Users can insert own perfis" ON user_perfis;
DROP POLICY IF EXISTS "Users can update own perfis" ON user_perfis;
DROP POLICY IF EXISTS "Admins can view all user_perfis" ON user_perfis;
DROP POLICY IF EXISTS "Admins can update user_perfis" ON user_perfis;

-- =====================================================
-- Políticas para USUÁRIOS COMUNS
-- =====================================================

-- Usuários podem ver seus próprios perfis
CREATE POLICY "Users can view own perfis" ON user_perfis
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Usuários podem inserir seus próprios perfis
CREATE POLICY "Users can insert own perfis" ON user_perfis
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar seus próprios perfis
CREATE POLICY "Users can update own perfis" ON user_perfis
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- Políticas ADICIONAIS para ADMINISTRADORES
-- =====================================================

-- Administradores podem ver TODOS os perfis de usuários
CREATE POLICY "Admins can view all user_perfis" ON user_perfis
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_perfis up
      INNER JOIN perfil p ON up.perfil_id = p.id
      WHERE up.user_id = auth.uid()
      AND p.role = 'administrador'
    )
  );

-- Administradores podem atualizar QUALQUER perfil de usuário
CREATE POLICY "Admins can update any user_perfis" ON user_perfis
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_perfis up
      INNER JOIN perfil p ON up.perfil_id = p.id
      WHERE up.user_id = auth.uid()
      AND p.role = 'administrador'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_perfis up
      INNER JOIN perfil p ON up.perfil_id = p.id
      WHERE up.user_id = auth.uid()
      AND p.role = 'administrador'
    )
  );

-- =====================================================
-- Políticas para tabela PERFIL
-- =====================================================

DROP POLICY IF EXISTS "Admins can view all perfis" ON perfil;
DROP POLICY IF EXISTS "Users can view perfis" ON perfil;

-- Todos usuários autenticados podem ver os perfis disponíveis
CREATE POLICY "Users can view perfis" ON perfil
  FOR SELECT TO authenticated
  USING (true);

-- =====================================================
-- COMO USAR:
-- =====================================================
-- Execute este script no Supabase SQL Editor
-- Isso permite que administradores vejam e editem todos os usuários
