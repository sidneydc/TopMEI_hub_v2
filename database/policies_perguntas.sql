-- Policies for public.perguntas
-- Enable Row Level Security and allow clients to read perguntas
-- while only administrators can create/update/delete them.

-- Be sure to run this as a DB owner / service_role in Supabase SQL Editor.

BEGIN;

-- Enable RLS
ALTER TABLE IF EXISTS public.perguntas ENABLE ROW LEVEL SECURITY;

-- Allow SELECT for cliente and administrador JWT roles
-- Uses jwt claim `role` set in the user's token. Falls back to admin check via perfil.
CREATE POLICY "perguntas_select_cliente_admin_anon"
  ON public.perguntas
  FOR SELECT
  USING (
    -- allow when JWT claim 'role' is cliente or administrador
    current_setting('jwt.claims.role', true) = 'cliente'
    OR current_setting('jwt.claims.role', true) = 'administrador'
    -- allow anonymous/anon access (when no auth.uid() present or role claim is 'anon')
    OR auth.uid() IS NULL
    OR current_setting('jwt.claims.role', true) = 'anon'
    -- or allow if user has administrador profile (extra safety)
    OR EXISTS (
      SELECT 1 FROM public.user_perfis up JOIN public.perfil p ON p.id = up.perfil_id
      WHERE up.user_id = auth.uid() AND p.role = 'administrador'
    )
  );

-- Allow admins to INSERT
CREATE POLICY "perguntas_insert_admin"
  ON public.perguntas
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_perfis up JOIN public.perfil p ON p.id = up.perfil_id
      WHERE up.user_id = auth.uid() AND p.role = 'administrador'
    )
  );

-- Allow admins to UPDATE
CREATE POLICY "perguntas_update_admin"
  ON public.perguntas
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_perfis up JOIN public.perfil p ON p.id = up.perfil_id
      WHERE up.user_id = auth.uid() AND p.role = 'administrador'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_perfis up JOIN public.perfil p ON p.id = up.perfil_id
      WHERE up.user_id = auth.uid() AND p.role = 'administrador'
    )
  );

-- Allow admins to DELETE
CREATE POLICY "perguntas_delete_admin"
  ON public.perguntas
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_perfis up JOIN public.perfil p ON p.id = up.perfil_id
      WHERE up.user_id = auth.uid() AND p.role = 'administrador'
    )
  );

COMMIT;

-- Notes:
-- - If your authentication system sets a different JWT claim for role
--   (for example `current_setting('jwt.claims.app_role', true)`), adjust the
--   SELECT policy accordingly.
-- - Run this as the DB owner / service role. After applying, test in the SQL
--   editor using `select current_setting('jwt.claims.role', true);` and
--   `select * from public.perguntas;` after setting `set_config('jwt.claims.sub', '<user_uuid>', true);`.
