-- =====================================================
-- CORREÇÃO DA TABELA DOCUMENTOS
-- =====================================================
-- Adiciona colunas faltantes na tabela documentos
-- =====================================================

-- Adicionar coluna data_upload se não existir
ALTER TABLE documentos 
ADD COLUMN IF NOT EXISTS data_upload TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Adicionar coluna observacao se não existir
ALTER TABLE documentos 
ADD COLUMN IF NOT EXISTS observacao TEXT;

-- Verificar estrutura da tabela documentos
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_name = 'documentos'
ORDER BY ordinal_position;
