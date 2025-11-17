-- =====================================================
-- ADD: Colunas tipo e prazo_dias na tabela servicos
-- =====================================================
-- Problema: Tabela servicos no Supabase não tem as colunas tipo e prazo_dias
-- Solução: Adicionar as colunas faltantes
-- =====================================================

-- Adicionar coluna tipo (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='servicos' AND column_name='tipo'
  ) THEN
    ALTER TABLE servicos ADD COLUMN tipo VARCHAR(50);
    RAISE NOTICE 'Coluna tipo adicionada com sucesso';
  ELSE
    RAISE NOTICE 'Coluna tipo já existe';
  END IF;
END $$;

-- Adicionar coluna prazo_dias (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='servicos' AND column_name='prazo_dias'
  ) THEN
    ALTER TABLE servicos ADD COLUMN prazo_dias INTEGER;
    RAISE NOTICE 'Coluna prazo_dias adicionada com sucesso';
  ELSE
    RAISE NOTICE 'Coluna prazo_dias já existe';
  END IF;
END $$;

-- Atualizar valores existentes (opcional)
-- UPDATE servicos SET tipo = 'cadastral' WHERE tipo IS NULL;
-- UPDATE servicos SET prazo_dias = 7 WHERE prazo_dias IS NULL;

-- =====================================================
-- Execute este script no Supabase SQL Editor
-- =====================================================
