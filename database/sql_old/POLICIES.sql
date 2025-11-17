-- POLICIES E TRIGGERS - TopMEI Hub
-- Execute este script no SQL Editor do Supabase APÓS executar o schema.sql

-- ============================================================================
-- TRIGGER: Atribuir automaticamente perfil de "cliente" para novos usuários
-- ============================================================================

-- Função que será executada quando um novo usuário se registrar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir relacionamento user_perfis com perfil de cliente
  INSERT INTO public.user_perfis (user_id, perfil_id, ativo)
  VALUES (
    NEW.id,
    (SELECT id FROM public.perfil WHERE role = 'cliente' LIMIT 1),
    true
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger que executa a função quando um novo usuário é criado
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- POLICIES ADICIONAIS
-- ============================================================================

-- Remover policies existentes para evitar conflitos
DROP POLICY IF EXISTS "Users can view own empresa" ON empresa;
DROP POLICY IF EXISTS "Users can insert own empresa" ON empresa;
DROP POLICY IF EXISTS "Users can update own empresa" ON empresa;
DROP POLICY IF EXISTS "Contador can view all empresas" ON empresa;
DROP POLICY IF EXISTS "Contador can update empresas" ON empresa;
DROP POLICY IF EXISTS "Admin can do all on empresas" ON empresa;
DROP POLICY IF EXISTS "Users can view own documents" ON documentos;
DROP POLICY IF EXISTS "Contador and Admin can view all documents" ON documentos;
DROP POLICY IF EXISTS "Contador and Admin can update documents" ON documentos;
DROP POLICY IF EXISTS "Users can insert documents for own empresas" ON documentos;
DROP POLICY IF EXISTS "Users can view own notifications" ON notificacao;
DROP POLICY IF EXISTS "Users can update own notifications" ON notificacao;
DROP POLICY IF EXISTS "Admin can insert notifications" ON notificacao;
DROP POLICY IF EXISTS "Users can view own perfis" ON user_perfis;
DROP POLICY IF EXISTS "Users can view own NFSe" ON NFSe;
DROP POLICY IF EXISTS "Contador and Admin can view all NFSe" ON NFSe;
DROP POLICY IF EXISTS "Contador can insert NFSe" ON NFSe;
DROP POLICY IF EXISTS "Users can view own cobranca_plano" ON cobranca_plano;
DROP POLICY IF EXISTS "Admin can view all cobranca_plano" ON cobranca_plano;
DROP POLICY IF EXISTS "Users can view own cobranca_servicos" ON cobranca_servicos;
DROP POLICY IF EXISTS "Admin can view all cobranca_servicos" ON cobranca_servicos;

-- ============================================================================
-- RECRIAR POLICIES
-- ============================================================================

-- Policy para Cliente ver apenas suas empresas
CREATE POLICY "Users can view own empresa" ON empresa
  FOR SELECT USING (auth.uid() = user_id);

-- Policy para Cliente inserir suas empresas
CREATE POLICY "Users can insert own empresa" ON empresa
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy para Cliente atualizar suas empresas
CREATE POLICY "Users can update own empresa" ON empresa
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy para Contador ver todas as empresas
CREATE POLICY "Contador can view all empresas" ON empresa
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_perfis up
      JOIN perfil p ON p.id = up.perfil_id
      WHERE up.user_id = auth.uid()
      AND p.role IN ('contador', 'administrador')
      AND up.ativo = true
    )
  );

-- Policy para Contador atualizar empresas
CREATE POLICY "Contador can update empresas" ON empresa
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_perfis up
      JOIN perfil p ON p.id = up.perfil_id
      WHERE up.user_id = auth.uid()
      AND p.role IN ('contador', 'administrador')
      AND up.ativo = true
    )
  );

-- Policy para Admin fazer tudo em empresas
CREATE POLICY "Admin can do all on empresas" ON empresa
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_perfis up
      JOIN perfil p ON p.id = up.perfil_id
      WHERE up.user_id = auth.uid()
      AND p.role = 'administrador'
      AND up.ativo = true
    )
  );

-- Policy para Contador e Admin verem todos os documentos
CREATE POLICY "Contador and Admin can view all documents" ON documentos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_perfis up
      JOIN perfil p ON p.id = up.perfil_id
      WHERE up.user_id = auth.uid()
      AND p.role IN ('contador', 'administrador')
      AND up.ativo = true
    )
  );

-- Policy para Contador e Admin atualizarem documentos
CREATE POLICY "Contador and Admin can update documents" ON documentos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_perfis up
      JOIN perfil p ON p.id = up.perfil_id
      WHERE up.user_id = auth.uid()
      AND p.role IN ('contador', 'administrador')
      AND up.ativo = true
    )
  );

-- Policy para Cliente inserir documentos nas suas empresas
CREATE POLICY "Users can insert documents for own empresas" ON documentos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM empresa 
      WHERE empresa.id = documentos.empresa_id 
      AND empresa.user_id = auth.uid()
    )
  );

-- Policy para Cliente ver documentos de suas empresas
CREATE POLICY "Users can view own documents" ON documentos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM empresa 
      WHERE empresa.id = documentos.empresa_id 
      AND empresa.user_id = auth.uid()
    )
  );

-- Policy para Notificações - usuário vê apenas suas notificações
CREATE POLICY "Users can view own notifications" ON notificacao
  FOR SELECT USING (auth.uid() = user_id);

-- Policy para Notificações - usuário pode atualizar suas notificações
CREATE POLICY "Users can update own notifications" ON notificacao
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy para User Perfis - usuário vê apenas seus perfis
CREATE POLICY "Users can view own perfis" ON user_perfis
  FOR SELECT USING (auth.uid() = user_id);

-- Policy para NFSe - Cliente vê apenas suas NFSe
CREATE POLICY "Users can view own NFSe" ON NFSe
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM empresa 
      WHERE empresa.id = NFSe.empresa_id 
      AND empresa.user_id = auth.uid()
    )
  );

-- Policy para NFSe - Contador e Admin veem todas
CREATE POLICY "Contador and Admin can view all NFSe" ON NFSe
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_perfis up
      JOIN perfil p ON p.id = up.perfil_id
      WHERE up.user_id = auth.uid()
      AND p.role IN ('contador', 'administrador')
      AND up.ativo = true
    )
  );

-- Policy para NFSe - Contador pode criar
CREATE POLICY "Contador can insert NFSe" ON NFSe
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_perfis up
      JOIN perfil p ON p.id = up.perfil_id
      WHERE up.user_id = auth.uid()
      AND p.role IN ('contador', 'administrador')
      AND up.ativo = true
    )
  );

-- Policy para Cobranças de Plano - usuário vê apenas suas cobranças
CREATE POLICY "Users can view own cobranca_plano" ON cobranca_plano
  FOR SELECT USING (auth.uid() = user_id);

-- Policy para Cobranças de Plano - Admin vê todas
CREATE POLICY "Admin can view all cobranca_plano" ON cobranca_plano
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_perfis up
      JOIN perfil p ON p.id = up.perfil_id
      WHERE up.user_id = auth.uid()
      AND p.role = 'administrador'
      AND up.ativo = true
    )
  );

-- Policy para Cobranças de Serviços - usuário vê apenas suas cobranças
CREATE POLICY "Users can view own cobranca_servicos" ON cobranca_servicos
  FOR SELECT USING (auth.uid() = user_id);

-- Policy para Cobranças de Serviços - Admin vê todas
CREATE POLICY "Admin can view all cobranca_servicos" ON cobranca_servicos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_perfis up
      JOIN perfil p ON p.id = up.perfil_id
      WHERE up.user_id = auth.uid()
      AND p.role = 'administrador'
      AND up.ativo = true
    )
  );

-- Policy para criar notificações (apenas sistema/admin)
CREATE POLICY "Admin can insert notifications" ON notificacao
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_perfis up
      JOIN perfil p ON p.id = up.perfil_id
      WHERE up.user_id = auth.uid()
      AND p.role = 'administrador'
      AND up.ativo = true
    )
  );

-- ============================================================================
-- FUNÇÕES AUXILIARES
-- ============================================================================

-- Função para verificar se usuário tem um perfil específico
CREATE OR REPLACE FUNCTION public.user_has_role(user_uuid UUID, role_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM user_perfis up
    JOIN perfil p ON p.id = up.perfil_id
    WHERE up.user_id = user_uuid
    AND p.role = role_name
    AND up.ativo = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter o perfil do usuário
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT p.role INTO user_role
  FROM user_perfis up
  JOIN perfil p ON p.id = up.perfil_id
  WHERE up.user_id = user_uuid
  AND up.ativo = true
  LIMIT 1;
  
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- HABILITAR REALTIME PARA NOTIFICAÇÕES
-- ============================================================================

-- Habilitar publicação de alterações na tabela notificacao
ALTER PUBLICATION supabase_realtime ADD TABLE notificacao;

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON FUNCTION public.handle_new_user() IS 'Atribui automaticamente o perfil de cliente para novos usuários registrados';
COMMENT ON FUNCTION public.user_has_role(UUID, TEXT) IS 'Verifica se um usuário possui um perfil específico';
COMMENT ON FUNCTION public.get_user_role(UUID) IS 'Retorna o perfil de um usuário';

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================

-- Para testar se o trigger está funcionando, você pode:
-- 1. Criar um novo usuário através da aplicação
-- 2. Executar esta query para verificar:

-- SELECT 
--   u.email,
--   p.role,
--   up.ativo
-- FROM auth.users u
-- LEFT JOIN user_perfis up ON up.user_id = u.id
-- LEFT JOIN perfil p ON p.id = up.perfil_id
-- ORDER BY u.created_at DESC
-- LIMIT 10;
