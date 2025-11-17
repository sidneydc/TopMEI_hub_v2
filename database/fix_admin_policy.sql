-- =====================================================
-- FIX: Policy de Admin SEM recursão
-- =====================================================
-- Problema: Policy que lê user_perfis causa recursão
-- Solução: Usar função auxiliar com SECURITY DEFINER
-- =====================================================

-- 1. Dropar função existente (se houver)
DROP FUNCTION IF EXISTS get_user_role(UUID);

-- 2. Criar função que retorna o role do usuário (bypass RLS)
CREATE OR REPLACE FUNCTION get_user_role(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT p.role INTO v_role
  FROM user_perfis up
  INNER JOIN perfil p ON up.perfil_id = p.id
  WHERE up.user_id = p_user_id
  AND up.ativo = true
  LIMIT 1;
  
  RETURN v_role;
END;
$$;

-- 3. Remover policies problemáticas
DROP POLICY IF EXISTS "Admins can view all user_perfis" ON user_perfis;
DROP POLICY IF EXISTS "Admins can update any user_perfis" ON user_perfis;

-- 4. Criar policy usando a função (SEM recursão)
CREATE POLICY "Admins can view all user_perfis" ON user_perfis
  FOR SELECT TO authenticated
  USING (
    -- Se for admin, pode ver todos
    get_user_role(auth.uid()) = 'administrador'
  );

CREATE POLICY "Admins can update any user_perfis" ON user_perfis
  FOR UPDATE TO authenticated
  USING (
    -- Se for admin, pode atualizar todos
    get_user_role(auth.uid()) = 'administrador'
  );

-- 5. Dar permissão para usar a função
GRANT EXECUTE ON FUNCTION get_user_role(UUID) TO authenticated;

-- =====================================================
-- IMPORTANTE: A função usa SECURITY DEFINER
-- Isso significa que ela executa com privilégios do owner
-- e BYPASSA as RLS policies, evitando a recursão!
-- =====================================================
