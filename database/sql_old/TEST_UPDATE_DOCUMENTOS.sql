-- =====================================================
-- TESTE DE UPDATE NA TABELA DOCUMENTOS
-- =====================================================
-- Execute este script para verificar permissões
-- =====================================================

-- 1. Verificar políticas RLS ativas
SELECT 
    schemaname,
    tablename, 
    policyname, 
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'documentos'
ORDER BY cmd, policyname;

-- 2. Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'documentos';

-- 3. Testar INSERT básico (execute como usuário logado)
-- Substitua os UUIDs pelos seus valores reais
/*
INSERT INTO documentos (
    empresa_id,
    tipo_documento_id,
    nome_arquivo,
    caminho_storage,
    tamanho_bytes,
    mime_type,
    status
) VALUES (
    'SEU_EMPRESA_ID',
    'SEU_TIPO_DOC_ID',
    'teste.pdf',
    'empresa123/doc456.pdf',
    1024,
    'application/pdf',
    'aguardando_aprovacao'
) RETURNING *;
*/

-- 4. Verificar estrutura da tabela
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'documentos'
ORDER BY ordinal_position;
