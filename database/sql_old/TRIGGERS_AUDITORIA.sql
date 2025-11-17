-- Sistema de Auditoria Automática
-- Execute este script após executar schema.sql e POLICIES.sql

-- =====================================================
-- FUNÇÃO GENÉRICA DE AUDITORIA
-- =====================================================

CREATE OR REPLACE FUNCTION registrar_auditoria()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_empresa_id UUID;
  v_acao VARCHAR(50);
  v_dados_anteriores JSONB;
  v_dados_novos JSONB;
BEGIN
  -- Determinar ação
  IF (TG_OP = 'INSERT') THEN
    v_acao := 'INSERT';
    v_dados_anteriores := NULL;
    v_dados_novos := row_to_json(NEW)::JSONB;
    
  ELSIF (TG_OP = 'UPDATE') THEN
    v_acao := 'UPDATE';
    v_dados_anteriores := row_to_json(OLD)::JSONB;
    v_dados_novos := row_to_json(NEW)::JSONB;
    
  ELSIF (TG_OP = 'DELETE') THEN
    v_acao := 'DELETE';
    v_dados_anteriores := row_to_json(OLD)::JSONB;
    v_dados_novos := NULL;
  END IF;

  -- Obter user_id do contexto de autenticação
  v_user_id := auth.uid();

  -- Tentar obter empresa_id do registro (se a tabela tiver esse campo)
  BEGIN
    IF (TG_OP = 'DELETE') THEN
      v_empresa_id := (OLD.empresa_id)::UUID;
    ELSE
      v_empresa_id := (NEW.empresa_id)::UUID;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      v_empresa_id := NULL;
  END;

  -- Se a tabela for 'empresa', usar o próprio id como empresa_id
  IF (TG_TABLE_NAME = 'empresa') THEN
    IF (TG_OP = 'DELETE') THEN
      v_empresa_id := OLD.id;
    ELSE
      v_empresa_id := NEW.id;
    END IF;
  END IF;

  -- Inserir registro de auditoria
  INSERT INTO auditoria (
    user_id,
    empresa_id,
    tabela,
    acao,
    registro_id,
    dados_anteriores,
    dados_novos
  ) VALUES (
    v_user_id,
    v_empresa_id,
    TG_TABLE_NAME,
    v_acao,
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.id
      ELSE NEW.id
    END,
    v_dados_anteriores,
    v_dados_novos
  );

  -- Retornar o registro apropriado
  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS PARA TABELA: empresa
-- =====================================================

DROP TRIGGER IF EXISTS trigger_auditoria_empresa_insert ON empresa;
CREATE TRIGGER trigger_auditoria_empresa_insert
  AFTER INSERT ON empresa
  FOR EACH ROW
  EXECUTE FUNCTION registrar_auditoria();

DROP TRIGGER IF EXISTS trigger_auditoria_empresa_update ON empresa;
CREATE TRIGGER trigger_auditoria_empresa_update
  AFTER UPDATE ON empresa
  FOR EACH ROW
  EXECUTE FUNCTION registrar_auditoria();

DROP TRIGGER IF EXISTS trigger_auditoria_empresa_delete ON empresa;
CREATE TRIGGER trigger_auditoria_empresa_delete
  AFTER DELETE ON empresa
  FOR EACH ROW
  EXECUTE FUNCTION registrar_auditoria();

-- =====================================================
-- TRIGGERS PARA TABELA: empresas_planos
-- =====================================================

DROP TRIGGER IF EXISTS trigger_auditoria_empresas_planos_insert ON empresas_planos;
CREATE TRIGGER trigger_auditoria_empresas_planos_insert
  AFTER INSERT ON empresas_planos
  FOR EACH ROW
  EXECUTE FUNCTION registrar_auditoria();

DROP TRIGGER IF EXISTS trigger_auditoria_empresas_planos_update ON empresas_planos;
CREATE TRIGGER trigger_auditoria_empresas_planos_update
  AFTER UPDATE ON empresas_planos
  FOR EACH ROW
  EXECUTE FUNCTION registrar_auditoria();

DROP TRIGGER IF EXISTS trigger_auditoria_empresas_planos_delete ON empresas_planos;
CREATE TRIGGER trigger_auditoria_empresas_planos_delete
  AFTER DELETE ON empresas_planos
  FOR EACH ROW
  EXECUTE FUNCTION registrar_auditoria();

-- =====================================================
-- TRIGGERS PARA TABELA: documentos
-- =====================================================

DROP TRIGGER IF EXISTS trigger_auditoria_documentos_insert ON documentos;
CREATE TRIGGER trigger_auditoria_documentos_insert
  AFTER INSERT ON documentos
  FOR EACH ROW
  EXECUTE FUNCTION registrar_auditoria();

DROP TRIGGER IF EXISTS trigger_auditoria_documentos_update ON documentos;
CREATE TRIGGER trigger_auditoria_documentos_update
  AFTER UPDATE ON documentos
  FOR EACH ROW
  EXECUTE FUNCTION registrar_auditoria();

DROP TRIGGER IF EXISTS trigger_auditoria_documentos_delete ON documentos;
CREATE TRIGGER trigger_auditoria_documentos_delete
  AFTER DELETE ON documentos
  FOR EACH ROW
  EXECUTE FUNCTION registrar_auditoria();

-- =====================================================
-- TRIGGERS PARA TABELA: servicos
-- =====================================================

DROP TRIGGER IF EXISTS trigger_auditoria_servicos_insert ON servicos;
CREATE TRIGGER trigger_auditoria_servicos_insert
  AFTER INSERT ON servicos
  FOR EACH ROW
  EXECUTE FUNCTION registrar_auditoria();

DROP TRIGGER IF EXISTS trigger_auditoria_servicos_update ON servicos;
CREATE TRIGGER trigger_auditoria_servicos_update
  AFTER UPDATE ON servicos
  FOR EACH ROW
  EXECUTE FUNCTION registrar_auditoria();

DROP TRIGGER IF EXISTS trigger_auditoria_servicos_delete ON servicos;
CREATE TRIGGER trigger_auditoria_servicos_delete
  AFTER DELETE ON servicos
  FOR EACH ROW
  EXECUTE FUNCTION registrar_auditoria();

-- =====================================================
-- TRIGGERS PARA TABELA: planos
-- =====================================================

DROP TRIGGER IF EXISTS trigger_auditoria_planos_insert ON planos;
CREATE TRIGGER trigger_auditoria_planos_insert
  AFTER INSERT ON planos
  FOR EACH ROW
  EXECUTE FUNCTION registrar_auditoria();

DROP TRIGGER IF EXISTS trigger_auditoria_planos_update ON planos;
CREATE TRIGGER trigger_auditoria_planos_update
  AFTER UPDATE ON planos
  FOR EACH ROW
  EXECUTE FUNCTION registrar_auditoria();

DROP TRIGGER IF EXISTS trigger_auditoria_planos_delete ON planos;
CREATE TRIGGER trigger_auditoria_planos_delete
  AFTER DELETE ON planos
  FOR EACH ROW
  EXECUTE FUNCTION registrar_auditoria();

-- =====================================================
-- TRIGGERS PARA TABELA: empresa_servicos
-- =====================================================

DROP TRIGGER IF EXISTS trigger_auditoria_empresa_servicos_insert ON empresa_servicos;
CREATE TRIGGER trigger_auditoria_empresa_servicos_insert
  AFTER INSERT ON empresa_servicos
  FOR EACH ROW
  EXECUTE FUNCTION registrar_auditoria();

DROP TRIGGER IF EXISTS trigger_auditoria_empresa_servicos_update ON empresa_servicos;
CREATE TRIGGER trigger_auditoria_empresa_servicos_update
  AFTER UPDATE ON empresa_servicos
  FOR EACH ROW
  EXECUTE FUNCTION registrar_auditoria();

DROP TRIGGER IF EXISTS trigger_auditoria_empresa_servicos_delete ON empresa_servicos;
CREATE TRIGGER trigger_auditoria_empresa_servicos_delete
  AFTER DELETE ON empresa_servicos
  FOR EACH ROW
  EXECUTE FUNCTION registrar_auditoria();

-- =====================================================
-- TRIGGERS PARA TABELA: cobranca_plano
-- =====================================================

DROP TRIGGER IF EXISTS trigger_auditoria_cobranca_plano_insert ON cobranca_plano;
CREATE TRIGGER trigger_auditoria_cobranca_plano_insert
  AFTER INSERT ON cobranca_plano
  FOR EACH ROW
  EXECUTE FUNCTION registrar_auditoria();

DROP TRIGGER IF EXISTS trigger_auditoria_cobranca_plano_update ON cobranca_plano;
CREATE TRIGGER trigger_auditoria_cobranca_plano_update
  AFTER UPDATE ON cobranca_plano
  FOR EACH ROW
  EXECUTE FUNCTION registrar_auditoria();

DROP TRIGGER IF EXISTS trigger_auditoria_cobranca_plano_delete ON cobranca_plano;
CREATE TRIGGER trigger_auditoria_cobranca_plano_delete
  AFTER DELETE ON cobranca_plano
  FOR EACH ROW
  EXECUTE FUNCTION registrar_auditoria();

-- =====================================================
-- TRIGGERS PARA TABELA: cobranca_servicos
-- =====================================================

DROP TRIGGER IF EXISTS trigger_auditoria_cobranca_servicos_insert ON cobranca_servicos;
CREATE TRIGGER trigger_auditoria_cobranca_servicos_insert
  AFTER INSERT ON cobranca_servicos
  FOR EACH ROW
  EXECUTE FUNCTION registrar_auditoria();

DROP TRIGGER IF EXISTS trigger_auditoria_cobranca_servicos_update ON cobranca_servicos;
CREATE TRIGGER trigger_auditoria_cobranca_servicos_update
  AFTER UPDATE ON cobranca_servicos
  FOR EACH ROW
  EXECUTE FUNCTION registrar_auditoria();

DROP TRIGGER IF EXISTS trigger_auditoria_cobranca_servicos_delete ON cobranca_servicos;
CREATE TRIGGER trigger_auditoria_cobranca_servicos_delete
  AFTER DELETE ON cobranca_servicos
  FOR EACH ROW
  EXECUTE FUNCTION registrar_auditoria();

-- =====================================================
-- TRIGGERS PARA TABELA: NFSe
-- =====================================================

DROP TRIGGER IF EXISTS trigger_auditoria_nfse_insert ON nfse;
CREATE TRIGGER trigger_auditoria_nfse_insert
  AFTER INSERT ON nfse
  FOR EACH ROW
  EXECUTE FUNCTION registrar_auditoria();

DROP TRIGGER IF EXISTS trigger_auditoria_nfse_update ON nfse;
CREATE TRIGGER trigger_auditoria_nfse_update
  AFTER UPDATE ON nfse
  FOR EACH ROW
  EXECUTE FUNCTION registrar_auditoria();

DROP TRIGGER IF EXISTS trigger_auditoria_nfse_delete ON nfse;
CREATE TRIGGER trigger_auditoria_nfse_delete
  AFTER DELETE ON nfse
  FOR EACH ROW
  EXECUTE FUNCTION registrar_auditoria();

-- =====================================================
-- TRIGGERS PARA TABELA: orcamento
-- =====================================================

DROP TRIGGER IF EXISTS trigger_auditoria_orcamento_insert ON orcamento;
CREATE TRIGGER trigger_auditoria_orcamento_insert
  AFTER INSERT ON orcamento
  FOR EACH ROW
  EXECUTE FUNCTION registrar_auditoria();

DROP TRIGGER IF EXISTS trigger_auditoria_orcamento_update ON orcamento;
CREATE TRIGGER trigger_auditoria_orcamento_update
  AFTER UPDATE ON orcamento
  FOR EACH ROW
  EXECUTE FUNCTION registrar_auditoria();

DROP TRIGGER IF EXISTS trigger_auditoria_orcamento_delete ON orcamento;
CREATE TRIGGER trigger_auditoria_orcamento_delete
  AFTER DELETE ON orcamento
  FOR EACH ROW
  EXECUTE FUNCTION registrar_auditoria();

-- =====================================================
-- TRIGGERS PARA TABELA: cnaes_secundarios
-- =====================================================

DROP TRIGGER IF EXISTS trigger_auditoria_cnaes_secundarios_insert ON cnaes_secundarios;
CREATE TRIGGER trigger_auditoria_cnaes_secundarios_insert
  AFTER INSERT ON cnaes_secundarios
  FOR EACH ROW
  EXECUTE FUNCTION registrar_auditoria();

DROP TRIGGER IF EXISTS trigger_auditoria_cnaes_secundarios_update ON cnaes_secundarios;
CREATE TRIGGER trigger_auditoria_cnaes_secundarios_update
  AFTER UPDATE ON cnaes_secundarios
  FOR EACH ROW
  EXECUTE FUNCTION registrar_auditoria();

DROP TRIGGER IF EXISTS trigger_auditoria_cnaes_secundarios_delete ON cnaes_secundarios;
CREATE TRIGGER trigger_auditoria_cnaes_secundarios_delete
  AFTER DELETE ON cnaes_secundarios
  FOR EACH ROW
  EXECUTE FUNCTION registrar_auditoria();

-- =====================================================
-- TRIGGERS PARA TABELA: inscricoes
-- =====================================================

DROP TRIGGER IF EXISTS trigger_auditoria_inscricoes_insert ON inscricoes;
CREATE TRIGGER trigger_auditoria_inscricoes_insert
  AFTER INSERT ON inscricoes
  FOR EACH ROW
  EXECUTE FUNCTION registrar_auditoria();

DROP TRIGGER IF EXISTS trigger_auditoria_inscricoes_update ON inscricoes;
CREATE TRIGGER trigger_auditoria_inscricoes_update
  AFTER UPDATE ON inscricoes
  FOR EACH ROW
  EXECUTE FUNCTION registrar_auditoria();

DROP TRIGGER IF EXISTS trigger_auditoria_inscricoes_delete ON inscricoes;
CREATE TRIGGER trigger_auditoria_inscricoes_delete
  AFTER DELETE ON inscricoes
  FOR EACH ROW
  EXECUTE FUNCTION registrar_auditoria();

-- =====================================================
-- VIEWS ÚTEIS PARA CONSULTA DE AUDITORIA
-- =====================================================

-- View: Últimas ações por empresa
CREATE OR REPLACE VIEW v_auditoria_empresa AS
SELECT 
  a.id,
  a.created_at,
  a.acao,
  a.tabela,
  e.razao_social,
  e.cnpj,
  u.email as usuario_email,
  a.dados_anteriores,
  a.dados_novos
FROM auditoria a
LEFT JOIN empresa e ON a.empresa_id = e.id
LEFT JOIN auth.users u ON a.user_id = u.id
ORDER BY a.created_at DESC;

-- View: Resumo de ações por tabela
CREATE OR REPLACE VIEW v_auditoria_resumo AS
SELECT 
  tabela,
  acao,
  COUNT(*) as total,
  MAX(created_at) as ultima_acao
FROM auditoria
GROUP BY tabela, acao
ORDER BY tabela, acao;

-- View: Ações do dia
CREATE OR REPLACE VIEW v_auditoria_hoje AS
SELECT 
  a.created_at,
  a.acao,
  a.tabela,
  e.razao_social as empresa,
  u.email as usuario
FROM auditoria a
LEFT JOIN empresa e ON a.empresa_id = e.id
LEFT JOIN auth.users u ON a.user_id = u.id
WHERE a.created_at::DATE = CURRENT_DATE
ORDER BY a.created_at DESC;

-- =====================================================
-- POLÍTICAS RLS PARA AUDITORIA
-- =====================================================

-- Habilitar RLS
ALTER TABLE auditoria ENABLE ROW LEVEL SECURITY;

-- Administradores podem ver tudo
DROP POLICY IF EXISTS "Administradores veem toda auditoria" ON auditoria;
CREATE POLICY "Administradores veem toda auditoria"
ON auditoria FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_perfis up
    JOIN perfil p ON up.perfil_id = p.id
    WHERE up.user_id = auth.uid()
    AND p.role = 'administrador'
    AND up.ativo = true
  )
);

-- Contadores veem auditoria das empresas que gerenciam
DROP POLICY IF EXISTS "Contadores veem auditoria de suas empresas" ON auditoria;
CREATE POLICY "Contadores veem auditoria de suas empresas"
ON auditoria FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_perfis up
    JOIN perfil p ON up.perfil_id = p.id
    WHERE up.user_id = auth.uid()
    AND p.role = 'contador'
    AND up.ativo = true
  )
  AND (
    empresa_id IN (
      SELECT id FROM empresa WHERE user_id = auth.uid()
    )
  )
);

-- Clientes veem apenas auditoria de suas próprias empresas
DROP POLICY IF EXISTS "Clientes veem auditoria de suas empresas" ON auditoria;
CREATE POLICY "Clientes veem auditoria de suas empresas"
ON auditoria FOR SELECT
TO authenticated
USING (
  empresa_id IN (
    SELECT id FROM empresa WHERE user_id = auth.uid()
  )
);

-- Sistema pode inserir registros de auditoria
DROP POLICY IF EXISTS "Sistema insere auditoria" ON auditoria;
CREATE POLICY "Sistema insere auditoria"
ON auditoria FOR INSERT
TO authenticated
WITH CHECK (true);

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON FUNCTION registrar_auditoria() IS 'Função trigger que registra automaticamente INSERT, UPDATE e DELETE em todas as tabelas críticas';
COMMENT ON TABLE auditoria IS 'Registro automático de todas as operações (INSERT/UPDATE/DELETE) nas tabelas do sistema';
COMMENT ON COLUMN auditoria.dados_anteriores IS 'Estado completo do registro ANTES da alteração (NULL para INSERT)';
COMMENT ON COLUMN auditoria.dados_novos IS 'Estado completo do registro DEPOIS da alteração (NULL para DELETE)';
COMMENT ON COLUMN auditoria.acao IS 'Tipo de operação: INSERT, UPDATE ou DELETE';

-- =====================================================
-- CONSULTAS ÚTEIS
-- =====================================================

-- Verificar se os triggers foram criados
SELECT 
  trigger_name,
  event_object_table,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_name LIKE 'trigger_auditoria%'
ORDER BY event_object_table, event_manipulation;

-- Total de registros de auditoria
SELECT COUNT(*) as total_registros FROM auditoria;

-- Últimas 10 ações
SELECT * FROM v_auditoria_empresa LIMIT 10;
