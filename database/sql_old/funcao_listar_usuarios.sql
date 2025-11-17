-- =====================================================
-- Função para listar usuários com emails (Admin)
-- =====================================================
-- Esta função permite que administradores vejam
-- a lista de usuários com seus emails

CREATE OR REPLACE FUNCTION get_users_with_emails()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER -- Executa com privilégios do criador da função
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id as user_id,
    au.email::TEXT,
    au.created_at
  FROM auth.users au
  ORDER BY au.created_at DESC;
END;
$$;

-- Dar permissão para usuários autenticados executarem a função
GRANT EXECUTE ON FUNCTION get_users_with_emails() TO authenticated;

-- =====================================================
-- COMO USAR:
-- =====================================================
-- No código TypeScript:
-- const { data, error } = await supabase.rpc('get_users_with_emails')
