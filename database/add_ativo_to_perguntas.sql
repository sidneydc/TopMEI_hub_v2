-- Add `ativo` column to public.perguntas if missing and set default true
-- Run as DB owner / service_role

BEGIN;

ALTER TABLE IF EXISTS public.perguntas
  ADD COLUMN IF NOT EXISTS ativo boolean DEFAULT true;

-- Ensure existing rows have ativo = true
UPDATE public.perguntas SET ativo = true WHERE ativo IS NULL;

COMMIT;

-- After running this, reload the frontend page that queries perguntas.
