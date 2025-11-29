-- Idempotent fix for `public.perguntas`
-- 1) ensures column `ativo` exists and sets truthy values for existing rows
-- 2) enables row-level security on the table
-- 3) drops any existing policies with the target names and recreates them
-- NOTE: Run this as a DB owner / service_role (Supabase SQL Editor) — changes require elevated privileges.

-- 1) Add `ativo` column if missing and ensure no NULLs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'perguntas' AND column_name = 'ativo'
  ) THEN
    ALTER TABLE public.perguntas ADD COLUMN ativo boolean DEFAULT true;
    UPDATE public.perguntas SET ativo = true WHERE ativo IS NULL;
  ELSE
    -- column exists: ensure existing NULLs are set true
    UPDATE public.perguntas SET ativo = true WHERE ativo IS NULL;
  END IF;
END
$$;

-- 2) Enable RLS on the table (idempotent)
ALTER TABLE public.perguntas ENABLE ROW LEVEL SECURITY;

-- 3) Recreate policies (drop if present then create)
DROP POLICY IF EXISTS perguntas_select ON public.perguntas;
DROP POLICY IF EXISTS perguntas_insert ON public.perguntas;
DROP POLICY IF EXISTS perguntas_update ON public.perguntas;
DROP POLICY IF EXISTS perguntas_delete ON public.perguntas;

-- SELECT policy: allow reads only for active perguntas
CREATE POLICY perguntas_select ON public.perguntas
  FOR SELECT
  USING (ativo IS TRUE);

-- Helper expression: admin-check via user_perfis -> perfil.slug = 'admin'
-- INSERT policy: only users with the admin perfil may insert
CREATE POLICY perguntas_insert ON public.perguntas
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_perfis up
      JOIN public.perfil p ON p.id = up.perfil_id
      WHERE up.user_id = auth.uid() AND p.slug = 'admin'
    )
  );

-- UPDATE policy: only admins can update (USING controls row visibility, WITH CHECK controls new values)
CREATE POLICY perguntas_update ON public.perguntas
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_perfis up
      JOIN public.perfil p ON p.id = up.perfil_id
      WHERE up.user_id = auth.uid() AND p.slug = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_perfis up
      JOIN public.perfil p ON p.id = up.perfil_id
      WHERE up.user_id = auth.uid() AND p.slug = 'admin'
    )
  );

-- DELETE policy: only admins
CREATE POLICY perguntas_delete ON public.perguntas
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_perfis up
      JOIN public.perfil p ON p.id = up.perfil_id
      WHERE up.user_id = auth.uid() AND p.slug = 'admin'
    )
  );

-- Optional: grant explicit SELECT to anon/authenticated roles if you rely on DB-level grants
-- GRANT SELECT ON public.perguntas TO anon, authenticated;

-- Verification queries (run after executing this script):
-- SELECT count(*) FROM public.perguntas;
-- SELECT count(*) FROM public.perguntas WHERE ativo IS TRUE;
-- SELECT relrowsecurity FROM pg_class WHERE oid = 'public.perguntas'::regclass;
