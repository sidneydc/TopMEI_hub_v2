-- Adicionar coluna html_code na tabela templates_orcamento (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'templates_orcamento' 
    AND column_name = 'html_code'
  ) THEN
    ALTER TABLE templates_orcamento
    ADD COLUMN html_code TEXT;
    
    RAISE NOTICE 'Coluna html_code adicionada com sucesso!';
  ELSE
    RAISE NOTICE 'Coluna html_code já existe.';
  END IF;
END $$;
