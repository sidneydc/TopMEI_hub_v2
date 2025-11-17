-- =====================================================
-- TopMEI Hub - Políticas RLS (Row Level Security)
-- Sistema de Gestão de MEI
-- =====================================================
-- Este arquivo contém todas as políticas de segurança RLS
-- Execute após criar_tabelas.sql e criar_triggers.sql
-- =====================================================

-- =====================================================
-- HABILITAR RLS EM TODAS AS TABELAS
-- =====================================================

ALTER TABLE perfil ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresa ENABLE ROW LEVEL SECURITY;
ALTER TABLE cnaes_secundarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE inscricoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipo_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresas_planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresa_servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cobranca_plano ENABLE ROW LEVEL SECURITY;
ALTER TABLE cobranca_servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE nfse ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificados_digitais ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates_orcamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE orcamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditoria ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS: perfil
-- =====================================================

DROP POLICY IF EXISTS "Todos podem ver perfis" ON perfil;
CREATE POLICY "Todos podem ver perfis" ON perfil
  FOR SELECT TO authenticated
  USING (ativo = true);

-- =====================================================
-- POLÍTICAS: user_perfis
-- =====================================================

-- Usuários podem ver seus próprios perfis
DROP POLICY IF EXISTS "Users can view own perfis" ON user_perfis;
CREATE POLICY "Users can view own perfis" ON user_perfis
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Administradores podem ver TODOS os perfis de usuários
DROP POLICY IF EXISTS "Admins can view all user_perfis" ON user_perfis;
CREATE POLICY "Admins can view all user_perfis" ON user_perfis
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_perfis up
      INNER JOIN perfil p ON up.perfil_id = p.id
      WHERE up.user_id = auth.uid()
      AND p.role = 'administrador'
    )
  );

-- Administradores podem atualizar QUALQUER perfil de usuário
DROP POLICY IF EXISTS "Admins can update any user_perfis" ON user_perfis;
CREATE POLICY "Admins can update any user_perfis" ON user_perfis
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_perfis up
      INNER JOIN perfil p ON up.perfil_id = p.id
      WHERE up.user_id = auth.uid()
      AND p.role = 'administrador'
    )
  );

-- =====================================================
-- POLÍTICAS: empresa
-- =====================================================

-- Cliente vê apenas suas empresas
DROP POLICY IF EXISTS "Users can view own empresa" ON empresa;
CREATE POLICY "Users can view own empresa" ON empresa
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Cliente insere suas empresas
DROP POLICY IF EXISTS "Users can insert own empresa" ON empresa;
CREATE POLICY "Users can insert own empresa" ON empresa
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Cliente atualiza suas empresas
DROP POLICY IF EXISTS "Users can update own empresa" ON empresa;
CREATE POLICY "Users can update own empresa" ON empresa
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Contador vê todas as empresas
DROP POLICY IF EXISTS "Contador can view all empresas" ON empresa;
CREATE POLICY "Contador can view all empresas" ON empresa
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_perfis up
      JOIN perfil p ON p.id = up.perfil_id
      WHERE up.user_id = auth.uid()
      AND p.role IN ('contador', 'administrador')
      AND up.ativo = true
    )
  );

-- Contador atualiza empresas
DROP POLICY IF EXISTS "Contador can update empresas" ON empresa;
CREATE POLICY "Contador can update empresas" ON empresa
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_perfis up
      JOIN perfil p ON p.id = up.perfil_id
      WHERE up.user_id = auth.uid()
      AND p.role IN ('contador', 'administrador')
      AND up.ativo = true
    )
  );

-- Admin faz tudo em empresas
DROP POLICY IF EXISTS "Admin can do all on empresas" ON empresa;
CREATE POLICY "Admin can do all on empresas" ON empresa
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_perfis up
      JOIN perfil p ON p.id = up.perfil_id
      WHERE up.user_id = auth.uid()
      AND p.role = 'administrador'
      AND up.ativo = true
    )
  );

-- =====================================================
-- POLÍTICAS: cnaes_secundarios e inscricoes
-- =====================================================

-- CNAEs Secundários seguem as mesmas regras de empresa
DROP POLICY IF EXISTS "Users can manage own cnaes" ON cnaes_secundarios;
CREATE POLICY "Users can manage own cnaes" ON cnaes_secundarios
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM empresa 
      WHERE empresa.id = cnaes_secundarios.empresa_id 
      AND empresa.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM user_perfis up
      JOIN perfil p ON p.id = up.perfil_id
      WHERE up.user_id = auth.uid()
      AND p.role IN ('contador', 'administrador')
    )
  );

-- Inscrições seguem as mesmas regras de empresa
DROP POLICY IF EXISTS "Users can manage own inscricoes" ON inscricoes;
CREATE POLICY "Users can manage own inscricoes" ON inscricoes
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM empresa 
      WHERE empresa.id = inscricoes.empresa_id 
      AND empresa.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM user_perfis up
      JOIN perfil p ON p.id = up.perfil_id
      WHERE up.user_id = auth.uid()
      AND p.role IN ('contador', 'administrador')
    )
  );

-- =====================================================
-- POLÍTICAS: tipo_documentos
-- =====================================================

DROP POLICY IF EXISTS "Todos podem ver tipos de documentos" ON tipo_documentos;
CREATE POLICY "Todos podem ver tipos de documentos" ON tipo_documentos
  FOR SELECT TO authenticated
  USING (ativo = true);

-- =====================================================
-- POLÍTICAS: documentos
-- =====================================================

-- Cliente vê documentos de suas empresas
DROP POLICY IF EXISTS "Clientes podem ver seus documentos" ON documentos;
CREATE POLICY "Clientes podem ver seus documentos" ON documentos
  FOR SELECT TO authenticated
  USING (
    empresa_id IN (
      SELECT id FROM empresa WHERE user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM user_perfis up
      JOIN perfil p ON p.id = up.perfil_id
      WHERE up.user_id = auth.uid()
      AND p.role IN ('contador', 'administrador')
    )
  );

-- Cliente insere documentos em suas empresas
DROP POLICY IF EXISTS "Clientes podem inserir documentos" ON documentos;
CREATE POLICY "Clientes podem inserir documentos" ON documentos
  FOR INSERT TO authenticated
  WITH CHECK (
    empresa_id IN (
      SELECT id FROM empresa 
      WHERE user_id = auth.uid()
      AND status_cadastro != 'inativo'
    )
  );

-- Cliente atualiza documentos pendentes
DROP POLICY IF EXISTS "Clientes podem atualizar seus documentos pendentes" ON documentos;
CREATE POLICY "Clientes podem atualizar seus documentos pendentes" ON documentos
  FOR UPDATE TO authenticated
  USING (
    empresa_id IN (SELECT id FROM empresa WHERE user_id = auth.uid())
    AND status = 'aguardando_aprovacao'
  )
  WITH CHECK (
    empresa_id IN (SELECT id FROM empresa WHERE user_id = auth.uid())
  );

-- Contador atualiza qualquer documento
DROP POLICY IF EXISTS "Contadores podem atualizar documentos" ON documentos;
CREATE POLICY "Contadores podem atualizar documentos" ON documentos
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_perfis up
      JOIN perfil p ON p.id = up.perfil_id
      WHERE up.user_id = auth.uid()
      AND p.role IN ('contador', 'administrador')
    )
  );

-- Cliente exclui documentos pendentes
DROP POLICY IF EXISTS "Clientes podem excluir seus documentos pendentes" ON documentos;
CREATE POLICY "Clientes podem excluir seus documentos pendentes" ON documentos
  FOR DELETE TO authenticated
  USING (
    empresa_id IN (SELECT id FROM empresa WHERE user_id = auth.uid())
    AND status = 'aguardando_aprovacao'
  );

-- Contador exclui qualquer documento
DROP POLICY IF EXISTS "Contadores podem excluir documentos" ON documentos;
CREATE POLICY "Contadores podem excluir documentos" ON documentos
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_perfis up
      JOIN perfil p ON p.id = up.perfil_id
      WHERE up.user_id = auth.uid()
      AND p.role IN ('contador', 'administrador')
    )
  );

-- =====================================================
-- POLÍTICAS: servicos e planos
-- =====================================================

DROP POLICY IF EXISTS "Todos podem ver servicos" ON servicos;
CREATE POLICY "Todos podem ver servicos" ON servicos
  FOR SELECT TO authenticated
  USING (ativo = true);

DROP POLICY IF EXISTS "Todos podem ver planos" ON planos;
CREATE POLICY "Todos podem ver planos" ON planos
  FOR SELECT TO authenticated
  USING (ativo = true);

-- =====================================================
-- POLÍTICAS: empresas_planos
-- =====================================================

DROP POLICY IF EXISTS "Users can view own planos" ON empresas_planos;
CREATE POLICY "Users can view own planos" ON empresas_planos
  FOR SELECT TO authenticated
  USING (
    empresa_id IN (SELECT id FROM empresa WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM user_perfis up
      JOIN perfil p ON p.id = up.perfil_id
      WHERE up.user_id = auth.uid()
      AND p.role IN ('contador', 'administrador')
    )
  );

-- =====================================================
-- POLÍTICAS: empresa_servicos
-- =====================================================

DROP POLICY IF EXISTS "Users can view own servicos" ON empresa_servicos;
CREATE POLICY "Users can view own servicos" ON empresa_servicos
  FOR SELECT TO authenticated
  USING (
    empresa_id IN (SELECT id FROM empresa WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM user_perfis up
      JOIN perfil p ON p.id = up.perfil_id
      WHERE up.user_id = auth.uid()
      AND p.role IN ('contador', 'administrador')
    )
  );

-- =====================================================
-- POLÍTICAS: cobranca_plano
-- =====================================================

DROP POLICY IF EXISTS "Users can view own cobranca_plano" ON cobranca_plano;
CREATE POLICY "Users can view own cobranca_plano" ON cobranca_plano
  FOR SELECT TO authenticated
  USING (
    empresa_plano_id IN (
      SELECT ep.id FROM empresas_planos ep
      JOIN empresa e ON e.id = ep.empresa_id
      WHERE e.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM user_perfis up
      JOIN perfil p ON p.id = up.perfil_id
      WHERE up.user_id = auth.uid()
      AND p.role = 'administrador'
    )
  );

-- =====================================================
-- POLÍTICAS: cobranca_servicos
-- =====================================================

DROP POLICY IF EXISTS "Users can view own cobranca_servicos" ON cobranca_servicos;
CREATE POLICY "Users can view own cobranca_servicos" ON cobranca_servicos
  FOR SELECT TO authenticated
  USING (
    empresa_servico_id IN (
      SELECT es.id FROM empresa_servicos es
      JOIN empresa e ON e.id = es.empresa_id
      WHERE e.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM user_perfis up
      JOIN perfil p ON p.id = up.perfil_id
      WHERE up.user_id = auth.uid()
      AND p.role = 'administrador'
    )
  );

-- =====================================================
-- POLÍTICAS: nfse
-- =====================================================

-- Cliente vê suas NFSe
DROP POLICY IF EXISTS "Users can view own NFSe" ON nfse;
CREATE POLICY "Users can view own NFSe" ON nfse
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM empresa 
      WHERE empresa.id = nfse.empresa_id 
      AND empresa.user_id = auth.uid()
    )
  );

-- Contador vê todas NFSe
DROP POLICY IF EXISTS "Contador and Admin can view all NFSe" ON nfse;
CREATE POLICY "Contador and Admin can view all NFSe" ON nfse
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_perfis up
      JOIN perfil p ON p.id = up.perfil_id
      WHERE up.user_id = auth.uid()
      AND p.role IN ('contador', 'administrador')
      AND up.ativo = true
    )
  );

-- Contador pode criar NFSe
DROP POLICY IF EXISTS "Contador can insert NFSe" ON nfse;
CREATE POLICY "Contador can insert NFSe" ON nfse
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_perfis up
      JOIN perfil p ON p.id = up.perfil_id
      WHERE up.user_id = auth.uid()
      AND p.role IN ('contador', 'administrador')
      AND up.ativo = true
    )
  );

-- =====================================================
-- POLÍTICAS: templates_orcamento
-- =====================================================

-- Todos podem ler templates ativos
DROP POLICY IF EXISTS "Public can read active templates" ON templates_orcamento;
CREATE POLICY "Public can read active templates" ON templates_orcamento
  FOR SELECT TO authenticated
  USING (ativo = true);

-- Apenas admin pode inserir templates
DROP POLICY IF EXISTS "Admin can insert templates" ON templates_orcamento;
CREATE POLICY "Admin can insert templates" ON templates_orcamento
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_perfis up
      JOIN perfil p ON p.id = up.perfil_id
      WHERE up.user_id = auth.uid()
      AND p.role = 'administrador'
    )
  );

-- Apenas admin pode atualizar templates
DROP POLICY IF EXISTS "Admin can update templates" ON templates_orcamento;
CREATE POLICY "Admin can update templates" ON templates_orcamento
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_perfis up
      JOIN perfil p ON p.id = up.perfil_id
      WHERE up.user_id = auth.uid()
      AND p.role = 'administrador'
    )
  );

-- Apenas admin pode excluir templates
DROP POLICY IF EXISTS "Admin can delete templates" ON templates_orcamento;
CREATE POLICY "Admin can delete templates" ON templates_orcamento
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_perfis up
      JOIN perfil p ON p.id = up.perfil_id
      WHERE up.user_id = auth.uid()
      AND p.role = 'administrador'
    )
  );

-- =====================================================
-- POLÍTICAS: orcamento
-- =====================================================

-- Cliente vê orçamentos de suas empresas
DROP POLICY IF EXISTS "Users can view own orcamentos" ON orcamento;
CREATE POLICY "Users can view own orcamentos" ON orcamento
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Cliente insere orçamentos
DROP POLICY IF EXISTS "Users can insert orcamentos" ON orcamento;
CREATE POLICY "Users can insert orcamentos" ON orcamento
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Cliente atualiza seus orçamentos
DROP POLICY IF EXISTS "Users can update own orcamentos" ON orcamento;
CREATE POLICY "Users can update own orcamentos" ON orcamento
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- POLÍTICAS: notificacao
-- =====================================================

-- Usuário vê suas notificações
DROP POLICY IF EXISTS "Usuarios podem ver suas notificacoes" ON notificacao;
CREATE POLICY "Usuarios podem ver suas notificacoes" ON notificacao
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Usuário atualiza suas notificações
DROP POLICY IF EXISTS "Usuarios podem atualizar suas notificacoes" ON notificacao;
CREATE POLICY "Usuarios podem atualizar suas notificacoes" ON notificacao
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Todos podem inserir notificações (para contadores criarem para clientes)
DROP POLICY IF EXISTS "Sistema pode inserir notificacoes" ON notificacao;
CREATE POLICY "Sistema pode inserir notificacoes" ON notificacao
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Usuário pode excluir suas notificações
DROP POLICY IF EXISTS "Usuarios podem excluir suas notificacoes" ON notificacao;
CREATE POLICY "Usuarios podem excluir suas notificacoes" ON notificacao
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- =====================================================
-- POLÍTICAS: auditoria
-- =====================================================

-- Apenas admin pode ver auditoria
DROP POLICY IF EXISTS "Admin can view auditoria" ON auditoria;
CREATE POLICY "Admin can view auditoria" ON auditoria
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_perfis up
      JOIN perfil p ON p.id = up.perfil_id
      WHERE up.user_id = auth.uid()
      AND p.role = 'administrador'
    )
  );

-- =====================================================
-- POLÍTICAS: certificados_digitais
-- =====================================================

-- Usuários podem ver seus próprios certificados
DROP POLICY IF EXISTS "Users can view their own certificates" ON certificados_digitais;
CREATE POLICY "Users can view their own certificates"
  ON certificados_digitais FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Usuários podem inserir seus próprios certificados
DROP POLICY IF EXISTS "Users can insert their own certificates" ON certificados_digitais;
CREATE POLICY "Users can insert their own certificates"
  ON certificados_digitais FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Usuários podem atualizar seus próprios certificados
DROP POLICY IF EXISTS "Users can update their own certificates" ON certificados_digitais;
CREATE POLICY "Users can update their own certificates"
  ON certificados_digitais FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Usuários podem deletar seus próprios certificados
DROP POLICY IF EXISTS "Users can delete their own certificates" ON certificados_digitais;
CREATE POLICY "Users can delete their own certificates"
  ON certificados_digitais FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Administradores podem ver todos os certificados
DROP POLICY IF EXISTS "Admins can view all certificates" ON certificados_digitais;
CREATE POLICY "Admins can view all certificates"
  ON certificados_digitais FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_perfis up
      INNER JOIN perfil p ON up.perfil_id = p.id
      WHERE up.user_id = auth.uid()
      AND p.role = 'administrador'
      AND up.ativo = true
    )
  );

-- Administradores podem gerenciar todos os certificados
DROP POLICY IF EXISTS "Admins can manage all certificates" ON certificados_digitais;
CREATE POLICY "Admins can manage all certificates"
  ON certificados_digitais FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_perfis up
      INNER JOIN perfil p ON up.perfil_id = p.id
      WHERE up.user_id = auth.uid()
      AND p.role = 'administrador'
      AND up.ativo = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_perfis up
      INNER JOIN perfil p ON up.perfil_id = p.id
      WHERE up.user_id = auth.uid()
      AND p.role = 'administrador'
      AND up.ativo = true
    )
  );

-- Contadores podem ver certificados
DROP POLICY IF EXISTS "Contadores can view certificates" ON certificados_digitais;
CREATE POLICY "Contadores can view certificates"
  ON certificados_digitais FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_perfis up
      INNER JOIN perfil p ON up.perfil_id = p.id
      WHERE up.user_id = auth.uid()
      AND p.role = 'contador'
      AND up.ativo = true
    )
  );

-- =====================================================
-- STORAGE: Bucket certificados (Certificados Digitais)
-- =====================================================

-- Criar bucket certificados
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'certificados',
  'certificados',
  true,
  5242880,
  ARRAY['application/x-pkcs12', 'application/pkcs12']
)
ON CONFLICT (id) DO NOTHING;

-- Usuários autenticados podem fazer upload de certificados
DROP POLICY IF EXISTS "Authenticated users can upload certificates" ON storage.objects;
CREATE POLICY "Authenticated users can upload certificates"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'certificados');

-- Usuários autenticados podem ver certificados
DROP POLICY IF EXISTS "Authenticated users can view certificates" ON storage.objects;
CREATE POLICY "Authenticated users can view certificates"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'certificados');

-- Usuários autenticados podem atualizar certificados
DROP POLICY IF EXISTS "Authenticated users can update certificates" ON storage.objects;
CREATE POLICY "Authenticated users can update certificates"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'certificados')
  WITH CHECK (bucket_id = 'certificados');

-- Usuários autenticados podem deletar certificados
DROP POLICY IF EXISTS "Authenticated users can delete certificates" ON storage.objects;
CREATE POLICY "Authenticated users can delete certificates"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'certificados');

-- =====================================================
-- STORAGE: Bucket doc_cus (Documentos dos Clientes)
-- =====================================================

-- Criar bucket doc_cus
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'doc_cus',
  'doc_cus',
  false,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- Cliente faz upload em pastas de suas empresas
DROP POLICY IF EXISTS "Clientes podem fazer upload em suas empresas" ON storage.objects;
CREATE POLICY "Clientes podem fazer upload em suas empresas" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'doc_cus' 
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM empresa 
      WHERE user_id = auth.uid()
      AND status_cadastro != 'inativo'
    )
  );

-- Cliente vê documentos de suas empresas
DROP POLICY IF EXISTS "Ver documentos das próprias empresas" ON storage.objects;
CREATE POLICY "Ver documentos das próprias empresas" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'doc_cus'
    AND (
      (storage.foldername(name))[1] IN (
        SELECT id::text FROM empresa WHERE user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM user_perfis up
        JOIN perfil p ON p.id = up.perfil_id
        WHERE up.user_id = auth.uid()
        AND p.role IN ('contador', 'administrador')
      )
    )
  );

-- Cliente exclui documentos pendentes
DROP POLICY IF EXISTS "Clientes podem excluir documentos pendentes" ON storage.objects;
CREATE POLICY "Clientes podem excluir documentos pendentes" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'doc_cus'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM empresa WHERE user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM documentos d
      WHERE d.caminho_storage = name
      AND d.status = 'aguardando_aprovacao'
    )
  );

-- Contador exclui qualquer documento
DROP POLICY IF EXISTS "Contador e Admin podem excluir documentos" ON storage.objects;
CREATE POLICY "Contador e Admin podem excluir documentos" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'doc_cus'
    AND EXISTS (
      SELECT 1 FROM user_perfis up
      JOIN perfil p ON p.id = up.perfil_id
      WHERE up.user_id = auth.uid()
      AND p.role IN ('contador', 'administrador')
    )
  );

-- Cliente atualiza documentos pendentes
DROP POLICY IF EXISTS "Clientes podem atualizar documentos pendentes" ON storage.objects;
CREATE POLICY "Clientes podem atualizar documentos pendentes" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'doc_cus'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM empresa WHERE user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM documentos d
      WHERE d.caminho_storage = name
      AND d.status = 'aguardando_aprovacao'
    )
  );

-- =====================================================
-- STORAGE: Bucket logos (Logos das Empresas)
-- =====================================================

-- Criar bucket logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users podem fazer upload
DROP POLICY IF EXISTS "Authenticated users can upload logos" ON storage.objects;
CREATE POLICY "Authenticated users can upload logos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'logos');

-- Authenticated users podem atualizar logos
DROP POLICY IF EXISTS "Authenticated users can update logos" ON storage.objects;
CREATE POLICY "Authenticated users can update logos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'logos');

-- Authenticated users podem deletar logos
DROP POLICY IF EXISTS "Authenticated users can delete logos" ON storage.objects;
CREATE POLICY "Authenticated users can delete logos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'logos');

-- Public podem ver logos
DROP POLICY IF EXISTS "Public can view logos" ON storage.objects;
CREATE POLICY "Public can view logos" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'logos');

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

COMMENT ON TABLE empresa IS 'Políticas RLS: cliente vê suas empresas, contador vê todas';
COMMENT ON TABLE documentos IS 'Políticas RLS: cliente vê seus docs, contador vê todos';
COMMENT ON TABLE notificacao IS 'Políticas RLS: usuário vê apenas suas notificações';
COMMENT ON TABLE templates_orcamento IS 'Políticas RLS: todos leem, apenas admin edita';
COMMENT ON TABLE orcamento IS 'Políticas RLS: usuário gerencia orçamentos de suas empresas';

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Função para listar usuários com emails (SECURITY DEFINER)
-- Permite que administradores vejam emails dos usuários
-- mesmo que não tenham acesso direto à tabela auth.users
CREATE OR REPLACE FUNCTION get_users_with_emails()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER -- Executa com privilégios do owner (bypass RLS)
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id as user_id,
    au.email::TEXT,
    au.created_at
  FROM auth.users au
  ORDER BY au.created_at DESC;
END;
$$;

-- Permitir que usuários autenticados executem a função
GRANT EXECUTE ON FUNCTION get_users_with_emails() TO authenticated;

-- =====================================================
-- FIM DAS POLÍTICAS RLS E FUNÇÕES
-- =====================================================
