-- Adicionar campo data_inativacao na tabela empresa
-- Execute este script no Supabase SQL Editor

ALTER TABLE empresa 
ADD COLUMN IF NOT EXISTS data_inativacao TIMESTAMP WITH TIME ZONE;

-- Comentário explicativo
COMMENT ON COLUMN empresa.data_inativacao IS 'Data em que a empresa foi inativada pelo usuário';
