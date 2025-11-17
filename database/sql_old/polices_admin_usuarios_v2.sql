-- =====================================================
-- Adicionar Policy para Administradores verem TODOS os usuários
-- =====================================================
-- Esta policy ADICIONA permissão para admins sem remover
-- a permissão dos usuários comuns verem seus próprios dados
-- =====================================================

-- Adicionar policy para administradores verem todos os user_perfis
DROP POLICY IF EXISTS "Admins can view all user_perfis" ON user_perfis;
CREATE POLICY "Admins can view all user_perfis" ON user_perfis
  FOR SELECT TO authenticated
  USING (
    -- Verifica se o usuário atual é administrador (sem checar ativo para evitar recursão)
    EXISTS (
      SELECT 1 FROM user_perfis up
      INNER JOIN perfil p ON up.perfil_id = p.id
      WHERE up.user_id = auth.uid()
      AND p.role = 'administrador'
    )
  );

-- Adicionar policy para administradores atualizarem qualquer user_perfis
DROP POLICY IF EXISTS "Admins can update any user_perfis" ON user_perfis;
CREATE POLICY "Admins can update any user_perfis" ON user_perfis
  FOR UPDATE TO authenticated
  USING (
    -- Verifica se o usuário atual é administrador (sem checar ativo para evitar recursão)
    EXISTS (
      SELECT 1 FROM user_perfis up
      INNER JOIN perfil p ON up.perfil_id = p.id
      WHERE up.user_id = auth.uid()
      AND p.role = 'administrador'
    )
  );

-- =====================================================
-- IMPORTANTE: As policies originais continuam ativas:
-- - "Users can view own perfis" (usuários veem seus dados)
-- - "Todos podem ver perfis" (todos veem tabela perfil)
-- 
-- Agora administradores podem ver TODOS os user_perfis
-- =====================================================
