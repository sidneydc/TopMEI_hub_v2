-- =====================================================
-- CONFIGURAR POLÍTICAS SIMPLES DO STORAGE certificados
-- Permite upload por usuário autenticado sem estrutura de pastas
-- =====================================================

-- 1. Permitir INSERT (upload) para usuários autenticados
DROP POLICY IF EXISTS "Authenticated users can upload certificates" ON storage.objects;
CREATE POLICY "Authenticated users can upload certificates"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'certificados');

-- 2. Permitir SELECT (leitura) para usuários autenticados
DROP POLICY IF EXISTS "Authenticated users can view certificates" ON storage.objects;
CREATE POLICY "Authenticated users can view certificates"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'certificados');

-- 3. Permitir UPDATE para usuários autenticados
DROP POLICY IF EXISTS "Authenticated users can update certificates" ON storage.objects;
CREATE POLICY "Authenticated users can update certificates"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'certificados')
WITH CHECK (bucket_id = 'certificados');

-- 4. Permitir DELETE para usuários autenticados
DROP POLICY IF EXISTS "Authenticated users can delete certificates" ON storage.objects;
CREATE POLICY "Authenticated users can delete certificates"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'certificados');

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Verificar se o bucket existe e está configurado
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets
WHERE id = 'certificados';
