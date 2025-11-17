-- =====================================================
-- CONFIGURAÇÃO DO STORAGE PARA DOCUMENTOS DOS CLIENTES
-- =====================================================
-- Bucket: doc_cus (Documentos dos Clientes)
-- Estrutura: {empresa_id}/{documento_id}.{extensao}
-- Tipos permitidos: PDF, JPG, JPEG, PNG
-- Tamanho máximo: 10MB
-- =====================================================

-- =====================================================
-- 1. CRIAR O BUCKET doc_cus
-- =====================================================

-- Criar o bucket no storage
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'doc_cus',
  'doc_cus',
  false,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 2. POLÍTICAS RLS PARA O BUCKET doc_cus
-- =====================================================

-- Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "Clientes podem fazer upload em suas empresas" ON storage.objects;
DROP POLICY IF EXISTS "Ver documentos das próprias empresas" ON storage.objects;
DROP POLICY IF EXISTS "Clientes podem excluir documentos pendentes" ON storage.objects;
DROP POLICY IF EXISTS "Contador e Admin podem excluir documentos" ON storage.objects;
DROP POLICY IF EXISTS "Clientes podem atualizar documentos pendentes" ON storage.objects;

-- Política 1: Permitir que clientes façam upload apenas nas pastas de suas empresas
CREATE POLICY "Clientes podem fazer upload em suas empresas"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'doc_cus' 
  AND (storage.foldername(name))[1] IN (
    SELECT id::text 
    FROM empresa 
    WHERE user_id = auth.uid()
    AND status_cadastro != 'inativo'
  )
);

-- Política 2: Permitir que usuários vejam documentos de suas empresas
CREATE POLICY "Ver documentos das próprias empresas"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'doc_cus'
  AND (
    -- Cliente pode ver documentos de suas empresas
    (storage.foldername(name))[1] IN (
      SELECT id::text 
      FROM empresa 
      WHERE user_id = auth.uid()
    )
    OR
    -- Contador pode ver documentos de empresas que ele atende
    EXISTS (
      SELECT 1 
      FROM user_perfis up
      JOIN perfil p ON p.id = up.perfil_id
      WHERE up.user_id = auth.uid()
      AND p.role = 'contador'
    )
    OR
    -- Administrador pode ver todos os documentos
    EXISTS (
      SELECT 1 
      FROM user_perfis up
      JOIN perfil p ON p.id = up.perfil_id
      WHERE up.user_id = auth.uid()
      AND p.role = 'administrador'
    )
  )
);

-- Política 3: Permitir que clientes excluam documentos aguardando aprovação
CREATE POLICY "Clientes podem excluir documentos pendentes"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'doc_cus'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text 
    FROM empresa 
    WHERE user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 
    FROM documentos d
    WHERE d.caminho_storage = name
    AND d.status = 'aguardando_aprovacao'
  )
);

-- Política 4: Permitir que contadores e administradores excluam qualquer documento
CREATE POLICY "Contador e Admin podem excluir documentos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'doc_cus'
  AND (
    EXISTS (
      SELECT 1 
      FROM user_perfis up
      JOIN perfil p ON p.id = up.perfil_id
      WHERE up.user_id = auth.uid()
      AND p.role IN ('contador', 'administrador')
    )
  )
);

-- Política 5: Permitir atualização de documentos (se necessário no futuro)
CREATE POLICY "Clientes podem atualizar documentos pendentes"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'doc_cus'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text 
    FROM empresa 
    WHERE user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 
    FROM documentos d
    WHERE d.caminho_storage = name
    AND d.status = 'aguardando_aprovacao'
  )
);

-- =====================================================
-- 3. INSTRUÇÕES DE USO
-- =====================================================

-- PASSO 1: Executar este script SQL no SQL Editor do Supabase
-- Isso criará o bucket doc_cus e as políticas RLS

-- PASSO 2: Verificar se o bucket foi criado
-- SELECT * FROM storage.buckets WHERE name = 'doc_cus';

-- PASSO 3: Verificar as políticas criadas
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%doc_cus%';

-- =====================================================
-- 4. ESTRUTURA DE PASTAS NO BUCKET
-- =====================================================

-- Estrutura automática criada pela aplicação:
-- doc_cus/
-- ├── {empresa_id_1}/
-- │   ├── {documento_id_1}.pdf
-- │   ├── {documento_id_2}.jpg
-- │   └── {documento_id_3}.png
-- ├── {empresa_id_2}/
-- │   ├── {documento_id_4}.pdf
-- │   └── {documento_id_5}.pdf
-- └── {empresa_id_3}/
--     └── {documento_id_6}.jpg

-- Exemplo de caminho completo:
-- doc_cus/550e8400-e29b-41d4-a716-446655440000/123e4567-e89b-12d3-a456-426614174000.pdf
--         └─────────── empresa_id ───────────┘ └────────────── documento_id ──────────────┘

-- =====================================================
-- 5. TESTES RECOMENDADOS
-- =====================================================

-- Teste 1: Verificar se o bucket foi criado
-- SELECT id, name, public, file_size_limit, allowed_mime_types FROM storage.buckets WHERE name = 'doc_cus';

-- Teste 2: Verificar políticas aplicadas
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd
-- FROM pg_policies 
-- WHERE tablename = 'objects' 
-- AND (policyname LIKE '%doc_cus%' OR policyname LIKE '%Clientes%' OR policyname LIKE '%contador%');

-- Teste 3: Testar upload pela aplicação
-- 1. Login como cliente
-- 2. Acesse /documentos
-- 3. Selecione uma empresa
-- 4. Faça upload de um PDF
-- 5. Verifique no Storage se o arquivo foi criado em: doc_cus/{empresa_id}/{documento_id}.pdf

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
