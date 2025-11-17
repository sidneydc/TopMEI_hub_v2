-- =====================================================
-- TopMEI Hub - Triggers e Funções
-- Sistema de Gestão de MEI
-- =====================================================
-- Este arquivo contém todos os triggers e funções do sistema
-- Execute após criar_tabelas.sql
-- =====================================================

-- =====================================================
-- FUNÇÃO: Atribuir perfil automático para novos usuários
-- =====================================================

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

-- Trigger para atribuir perfil automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- FUNÇÃO: Sistema de Auditoria Automática
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
-- TRIGGERS DE AUDITORIA: empresa
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
-- TRIGGERS DE AUDITORIA: documentos
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
-- TRIGGERS DE AUDITORIA: empresas_planos
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
-- TRIGGERS DE AUDITORIA: empresa_servicos
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
-- TRIGGERS DE AUDITORIA: cobranca_plano
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
-- TRIGGERS DE AUDITORIA: cobranca_servicos
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
-- TRIGGERS DE AUDITORIA: nfse
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
-- TRIGGERS DE AUDITORIA: orcamento
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
-- VERIFICAÇÃO
-- =====================================================

COMMENT ON FUNCTION handle_new_user() IS 'Atribui automaticamente o perfil de cliente para novos usuários';
COMMENT ON FUNCTION registrar_auditoria() IS 'Registra todas as operações em tabelas auditadas na tabela auditoria';
