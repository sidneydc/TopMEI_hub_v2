-- =====================================================
-- CONFIGURAR POLÍTICAS DO STORAGE BUCKET certificados
-- =====================================================

-- 1. Criar políticas de upload para usuários autenticados
CREATE POLICY "Users can upload their own certificates"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'certificados' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 2. Criar política de leitura para usuários autenticados
CREATE POLICY "Users can view their own certificates"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'certificados'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 3. Criar política de atualização para usuários autenticados
CREATE POLICY "Users can update their own certificates"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'certificados'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'certificados'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. Criar política de exclusão para usuários autenticados
CREATE POLICY "Users can delete their own certificates"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'certificados'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 5. Criar políticas para administradores (acesso total)
CREATE POLICY "Admins can manage all certificate files"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'certificados'
  AND EXISTS (
    SELECT 1 FROM user_perfis up
    INNER JOIN perfil p ON up.perfil_id = p.id
    WHERE up.user_id = auth.uid()
    AND p.role = 'administrador'
    AND up.ativo = true
  )
)
WITH CHECK (
  bucket_id = 'certificados'
  AND EXISTS (
    SELECT 1 FROM user_perfis up
    INNER JOIN perfil p ON up.perfil_id = p.id
    WHERE up.user_id = auth.uid()
    AND p.role = 'administrador'
    AND up.ativo = true
  )
);

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Listar políticas do storage
SELECT 
    policyname,
    operation as cmd
FROM storage.policies
WHERE bucket_id = 'certificados'
ORDER BY policyname;
