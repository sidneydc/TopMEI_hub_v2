-- =====================================================
-- Configuração do Storage para Certificados Digitais
-- =====================================================
-- Este script cria o bucket para armazenar certificados digitais (.pfx/.p12)
-- e configura as políticas de acesso
-- =====================================================

-- =====================================================
-- PASSO 1: Criar bucket de storage
-- =====================================================
-- Execute este comando no SQL Editor do Supabase

INSERT INTO storage.buckets (id, name, public)
VALUES ('certificados', 'certificados', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- PASSO 2: Configurar políticas de acesso
-- =====================================================

-- Política: Usuários podem fazer upload dos próprios certificados
CREATE POLICY "Users can upload their own certificates"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'certificados' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política: Usuários podem visualizar seus próprios certificados
CREATE POLICY "Users can view their own certificates"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'certificados' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política: Usuários podem atualizar seus próprios certificados
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

-- Política: Usuários podem deletar seus próprios certificados
CREATE POLICY "Users can delete their own certificates"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'certificados' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política: Administradores podem ver todos os certificados
CREATE POLICY "Admins can view all certificates"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'certificados'
  AND get_user_role(auth.uid()) = 'administrador'
);

-- =====================================================
-- OBSERVAÇÕES IMPORTANTES
-- =====================================================

/*
ESTRUTURA DOS ARQUIVOS:
- Os certificados serão salvos em: certificados/{empresa_id}-{timestamp}.pfx
- Cada empresa pode ter apenas 1 certificado ativo (constraint na tabela)
- O bucket é PÚBLICO para acesso por outras aplicações

PERMISSÕES:
- Usuários autenticados: CRUD nos próprios certificados
- Administradores: Leitura de todos os certificados
- Usuários não autenticados: Leitura pública (para outras aplicações)
- Outras aplicações: Podem acessar via URL pública

SEGURANÇA:
- O bucket é público para permitir acesso externo
- As senhas dos certificados são armazenadas na tabela certificados_digitais
- As senhas DEVEM ser criptografadas na aplicação antes de salvar
- Os certificados (.pfx/.p12) já são arquivos criptografados por natureza
- URLs públicas podem ser compartilhadas com aplicações de emissão de NFSe

ACESSO EXTERNO:
- URL pública: https://{supabase-url}/storage/v1/object/public/certificados/{arquivo}
- Aplicações externas podem baixar diretamente usando a URL
- Não é necessário autenticação para download (bucket público)

TAMANHO DOS ARQUIVOS:
- Certificados digitais geralmente têm poucos KB
- Configure um limite de upload se necessário no dashboard do Supabase

PARA TESTAR:
1. Acesse a página de NFSe como cliente
2. Expanda uma empresa
3. Expanda a seção "Certificado Digital"
4. Faça upload de um arquivo .pfx ou .p12
5. Informe a senha
6. Clique em "Salvar Certificado"
7. Verifique no Storage do Supabase se o arquivo foi salvo

TROUBLESHOOTING:
- Se der erro 403: Verifique as políticas de storage
- Se não aparecer o bucket: Execute o INSERT INTO storage.buckets
- Se der erro de permissão: Verifique se o usuário está autenticado
- Se der erro na função: Verifique se get_user_role() existe
*/
