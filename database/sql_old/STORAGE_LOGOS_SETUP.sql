-- Criar bucket para logos das empresas
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas RLS para o bucket logos
-- 1. Permitir que usuários autenticados façam upload de logos
CREATE POLICY "Usuários podem fazer upload de logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'logos');

-- 2. Permitir que usuários autenticados atualizem suas logos
CREATE POLICY "Usuários podem atualizar suas logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'logos');

-- 3. Permitir que usuários autenticados deletem suas logos
CREATE POLICY "Usuários podem deletar suas logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'logos');

-- 4. Permitir leitura pública (acesso público às logos)
CREATE POLICY "Logos são públicas"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'logos');
