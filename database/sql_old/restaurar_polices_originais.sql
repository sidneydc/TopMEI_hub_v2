-- =====================================================
-- RESTAURAR Policies Originais de user_perfis
-- =====================================================
-- Este script restaura as policies ao estado original
-- que estava funcionando antes das modificações
-- =====================================================

-- Remover TODAS as policies de user_perfis
DROP POLICY IF EXISTS "Users can view own perfis" ON user_perfis;
DROP POLICY IF EXISTS "Users can insert own perfis" ON user_perfis;
DROP POLICY IF EXISTS "Users can update own perfis" ON user_perfis;
DROP POLICY IF EXISTS "Admins can view all user_perfis" ON user_perfis;
DROP POLICY IF EXISTS "Admins can update user_perfis" ON user_perfis;
DROP POLICY IF EXISTS "Admins can update any user_perfis" ON user_perfis;

-- Remover policies de perfil
DROP POLICY IF EXISTS "Todos podem ver perfis" ON perfil;
DROP POLICY IF EXISTS "Admins can view all perfis" ON perfil;
DROP POLICY IF EXISTS "Users can view perfis" ON perfil;

-- =====================================================
-- RECRIAR Policy Original de perfil
-- =====================================================

CREATE POLICY "Todos podem ver perfis" ON perfil
  FOR SELECT TO authenticated
  USING (ativo = true);

-- =====================================================
-- RECRIAR Policy Original de user_perfis
-- =====================================================

CREATE POLICY "Users can view own perfis" ON user_perfis
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- FIM - Sistema deve voltar a funcionar normalmente
-- =====================================================
