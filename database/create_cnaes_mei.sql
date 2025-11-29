-- create_cnaes_mei.sql
-- Create a CNAEs table for MEI and RLS policies so only admins can modify it
-- Run this in Supabase SQL Editor (execute as a privileged user when running GRANTs)

-- 1) Create table
CREATE TABLE IF NOT EXISTS public.cnaes_mei (
  cnae_id varchar(7) PRIMARY KEY,
  ocupacao text NOT NULL,
  descricao text,
  iss boolean DEFAULT false,
  icms_ativo boolean DEFAULT false,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2) Enable Row Level Security
ALTER TABLE public.cnaes_mei ENABLE ROW LEVEL SECURITY;

-- 3) Policies
-- Allow any authenticated user to read active CNAEs
DROP POLICY IF EXISTS "Todos podem ver cnaes_mei" ON public.cnaes_mei;
CREATE POLICY "Todos podem ver cnaes_mei" ON public.cnaes_mei
  FOR SELECT
  TO authenticated
  USING (ativo = true);

-- Admin-only: INSERT
DROP POLICY IF EXISTS "Admins podem inserir cnaes_mei" ON public.cnaes_mei;
CREATE POLICY "Admins podem inserir cnaes_mei" ON public.cnaes_mei
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_perfis up
      JOIN public.perfil p ON up.perfil_id = p.id
      WHERE up.user_id = auth.uid()
        AND p.role = 'administrador'
        AND up.ativo = true
    )
  );

-- Admin-only: UPDATE
DROP POLICY IF EXISTS "Admins podem atualizar cnaes_mei" ON public.cnaes_mei;
CREATE POLICY "Admins podem atualizar cnaes_mei" ON public.cnaes_mei
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_perfis up
      JOIN public.perfil p ON up.perfil_id = p.id
      WHERE up.user_id = auth.uid()
        AND p.role = 'administrador'
        AND up.ativo = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_perfis up
      JOIN public.perfil p ON up.perfil_id = p.id
      WHERE up.user_id = auth.uid()
        AND p.role = 'administrador'
        AND up.ativo = true
    )
  );

-- Admin-only: DELETE
DROP POLICY IF EXISTS "Admins podem deletar cnaes_mei" ON public.cnaes_mei;
CREATE POLICY "Admins podem deletar cnaes_mei" ON public.cnaes_mei
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_perfis up
      JOIN public.perfil p ON up.perfil_id = p.id
      WHERE up.user_id = auth.uid()
        AND p.role = 'administrador'
        AND up.ativo = true
    )
  );

-- 4) Give the necessary table privileges to the client role(s)
-- Grant minimal privileges to allow the client to query and (for authenticated users)
-- attempt modifications (RLS will restrict modification to admins only).
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cnaes_mei TO authenticated;
GRANT SELECT ON public.cnaes_mei TO anon; -- optional: allow anonymous users to view

-- 5) Optional: index to speed lookups by description or occupation
CREATE INDEX IF NOT EXISTS idx_cnaes_mei_ocupacao ON public.cnaes_mei (ocupacao);

-- 6) Helper: update `updated_at` timestamp on change (optional trigger)
CREATE OR REPLACE FUNCTION public.cnaes_mei_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END$$;

DROP TRIGGER IF EXISTS trg_cnaes_mei_updated_at ON public.cnaes_mei;
CREATE TRIGGER trg_cnaes_mei_updated_at
  BEFORE UPDATE ON public.cnaes_mei
  FOR EACH ROW
  EXECUTE FUNCTION public.cnaes_mei_updated_at();

-- 7) Example inserts (uncomment and edit if you want seed data)
-- INSERT INTO public.cnaes_mei (cnae_id, ocupacao, descricao, iss, icms_ativo)
-- VALUES ('00000', 'Exemplo', 'Descrição exemplo', false, false);
