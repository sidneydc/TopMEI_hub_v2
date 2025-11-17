-- =====================================================
-- VERIFICAR POLÍTICAS E PERMISSÕES DA TABELA certificados_digitais
-- =====================================================

-- 1. Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'certificados_digitais';

-- 2. Listar todas as políticas existentes
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies 
WHERE tablename = 'certificados_digitais'
ORDER BY policyname;

-- 3. Verificar o usuário atual e seu role
SELECT 
    auth.uid() as current_user_id,
    get_user_role(auth.uid()) as current_user_role;

-- 4. Verificar perfil do usuário atual
SELECT 
    up.user_id,
    p.role,
    up.ativo
FROM user_perfis up
INNER JOIN perfil p ON up.perfil_id = p.id
WHERE up.user_id = auth.uid();

-- 5. Testar se o usuário consegue inserir (simulação)
EXPLAIN (ANALYZE, VERBOSE, BUFFERS, FORMAT JSON)
SELECT 
    auth.uid() as test_user_id,
    'teste' as empresa_id,
    auth.uid() IS NOT NULL AND auth.uid() = auth.uid() as would_pass_policy;
