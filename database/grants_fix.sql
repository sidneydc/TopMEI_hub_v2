-- grants_fix.sql
-- Use this in Supabase SQL Editor (or with a DB-owner/service_role connection)
-- Purpose: replicate privileges present in the old DB for the affected tables
-- IMPORTANT: Run these statements as a privileged user (service_role / DB owner).

-- Verify current grants for the tables first (copy/paste to check):
-- SELECT grantee, privilege_type
-- FROM information_schema.role_table_grants
-- WHERE table_schema = 'public' AND table_name IN ('user_perfis','perfil')
-- ORDER BY grantee;

----------------------------------------
-- Minimal: grant full privileges (as in the old DB) on specific tables
----------------------------------------
GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.user_perfis TO anon, authenticated, service_role;

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.perfil TO anon, authenticated, service_role;

----------------------------------------
-- Optional: if you have several tables missing privileges and want to
-- mirror the old DB across the whole schema, uncomment and run the block
-- below. This grants the same set of privileges on all existing tables
-- in schema `public` to the three roles. Use with caution in production.
----------------------------------------
-- DO $$
-- DECLARE r RECORD;
-- BEGIN
--   FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
--     EXECUTE format('GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.%I TO anon, authenticated, service_role;', r.tablename);
--   END LOOP;
-- END$$;

----------------------------------------
-- Quick verification queries (run after applying grants):
----------------------------------------
-- SELECT grantee, privilege_type
-- FROM information_schema.role_table_grants
-- WHERE table_schema = 'public' AND table_name IN ('user_perfis','perfil')
-- ORDER BY grantee;

-- Example: simulate the app user and test the SELECT used by AuthContext
-- SELECT set_config('jwt.claims.sub', '<USER_UUID>', true);
-- SELECT up.*, p.id AS perfil_id, p.role, p.ativo
-- FROM public.user_perfis up
-- LEFT JOIN public.perfil p ON up.perfil_id = p.id
-- WHERE up.user_id = auth.uid() AND up.ativo = true;

----------------------------------------
-- Rollback (revoke) example
-- REVOKE INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
--   ON public.user_perfis FROM anon, authenticated, service_role;
