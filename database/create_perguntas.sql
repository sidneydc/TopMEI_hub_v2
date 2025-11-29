-- Create table public.perguntas and seed an example row
-- Run as DB owner / service_role

BEGIN;

-- Ensure pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create table
CREATE TABLE IF NOT EXISTS public.perguntas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pilar varchar,
  pergunta_principal varchar,
  pontos int4,
  explicacao text,
  exemplos_sim text,
  exemplos_nao text,
  diferenciacoes text,
  pergunta_se_nao varchar,
  prazos_opcoes jsonb,
  ordem int4,
  created_at timestamptz DEFAULT now(),
  ativo boolean DEFAULT true
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_perguntas_pilar_ordem ON public.perguntas (pilar, ordem);

-- Seed example row (skip if exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.perguntas WHERE id = '6beb544c-1176-4cf6-9223-8d727a60e282') THEN
    INSERT INTO public.perguntas (id, pilar, pergunta_principal, pontos, explicacao, exemplos_sim, exemplos_nao, diferenciacoes, pergunta_se_nao, prazos_opcoes, ordem, ativo)
    VALUES (
      '6beb544c-1176-4cf6-9223-8d727a60e282',
      'Atendimento ao Cliente',
      'Acompanhamento pós-venda?',
      3,
      'Conversar com cliente após venda: chegou bem? Tá funcionando? Precisa de algo? Aumenta fidelização.',
      '✓ "Chegou tudo bem?" ✓ "Como está?" ✓ Oferece suporte',
      '✗ Vende e some ✗ Não liga mais ✗ Cliente abandonado',
      'NÃO é: assediar. É: acompanhar com CUIDADO',
      'Quer fazer acompanhamento?',
      '[]'::jsonb,
      15,
      true
    );
  END IF;
END$$;

COMMIT;

-- After running this, apply `database/policies_perguntas.sql` to enable RLS and policies.
