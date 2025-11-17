-- =====================================================
-- Divisão da tabela NFSE
-- =====================================================
-- Este script divide a tabela nfse em duas:
-- 1. certificados_digitais - para armazenar certificados e senhas
-- 2. nfse - reformulada apenas para informações das notas fiscais
-- =====================================================

-- =====================================================
-- PASSO 1: Criar tabela de Certificados Digitais
-- =====================================================

CREATE TABLE IF NOT EXISTS certificados_digitais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  certificado_url TEXT NOT NULL,
  certificado_senha TEXT NOT NULL,
  data_validade DATE,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(empresa_id) -- Uma empresa tem apenas um certificado ativo por vez
);

COMMENT ON TABLE certificados_digitais IS 'Armazena certificados digitais e senhas das empresas para emissão de NFSe';
COMMENT ON COLUMN certificados_digitais.certificado_url IS 'URL do arquivo do certificado digital (storage)';
COMMENT ON COLUMN certificados_digitais.certificado_senha IS 'Senha do certificado digital (deve ser criptografada na aplicação)';
COMMENT ON COLUMN certificados_digitais.data_validade IS 'Data de validade do certificado digital';
COMMENT ON COLUMN certificados_digitais.ativo IS 'Se o certificado está ativo e pode ser usado';

-- =====================================================
-- PASSO 2: Migrar dados de certificados (se existirem)
-- =====================================================

INSERT INTO certificados_digitais (empresa_id, user_id, certificado_url, certificado_senha, ativo)
SELECT 
  empresa_id,
  user_id,
  certificado_url,
  certificado_senha,
  true
FROM nfse
WHERE certificado_url IS NOT NULL 
  AND certificado_senha IS NOT NULL
  AND empresa_id IS NOT NULL
  AND user_id IS NOT NULL
ON CONFLICT (empresa_id) DO NOTHING;

-- =====================================================
-- PASSO 3: Criar backup da tabela nfse antiga
-- =====================================================

CREATE TABLE IF NOT EXISTS nfse_backup AS 
SELECT * FROM nfse;

COMMENT ON TABLE nfse_backup IS 'Backup da tabela nfse antes da reestruturação';

-- =====================================================
-- PASSO 4: Recriar tabela nfse sem campos de certificado
-- =====================================================

DROP TABLE IF EXISTS nfse CASCADE;

CREATE TABLE nfse (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  numero_rps VARCHAR(50),
  serie_rps VARCHAR(10),
  data_emissao DATE DEFAULT CURRENT_DATE,
  data_competencia DATE NOT NULL,
  
  -- Informações do Tomador (Cliente)
  tomador_cpf_cnpj VARCHAR(14) NOT NULL,
  tomador_nome TEXT NOT NULL,
  tomador_email VARCHAR(255),
  tomador_telefone VARCHAR(20),
  tomador_endereco TEXT,
  tomador_numero VARCHAR(10),
  tomador_complemento VARCHAR(100),
  tomador_bairro VARCHAR(100),
  tomador_cidade VARCHAR(100),
  tomador_uf VARCHAR(2),
  tomador_cep VARCHAR(8),
  
  -- Informações do Serviço
  descricao_servicos TEXT NOT NULL,
  valor_servicos NUMERIC(10,2) NOT NULL,
  aliquota_iss NUMERIC(5,2),
  valor_iss NUMERIC(10,2),
  valor_deducoes NUMERIC(10,2) DEFAULT 0,
  valor_pis NUMERIC(10,2) DEFAULT 0,
  valor_cofins NUMERIC(10,2) DEFAULT 0,
  valor_inss NUMERIC(10,2) DEFAULT 0,
  valor_ir NUMERIC(10,2) DEFAULT 0,
  valor_csll NUMERIC(10,2) DEFAULT 0,
  valor_outras_retencoes NUMERIC(10,2) DEFAULT 0,
  valor_liquido NUMERIC(10,2),
  item_lista_servico VARCHAR(10),
  codigo_tributacao_municipio VARCHAR(20),
  
  -- Status e Controle
  status VARCHAR(50) DEFAULT 'pendente' CHECK (status IN ('pendente', 'processando', 'emitida', 'cancelada', 'erro')),
  numero_nfse VARCHAR(50),
  codigo_verificacao VARCHAR(100),
  data_emissao_nfse TIMESTAMP WITH TIME ZONE,
  
  -- Arquivos
  xml_url TEXT,
  pdf_url TEXT,
  
  -- Observações
  observacoes TEXT,
  erro_mensagem TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE nfse IS 'Notas Fiscais de Serviço Eletrônicas (NFSe)';
COMMENT ON COLUMN nfse.numero_rps IS 'Número do Recibo Provisório de Serviços';
COMMENT ON COLUMN nfse.serie_rps IS 'Série do RPS';
COMMENT ON COLUMN nfse.data_competencia IS 'Data de competência do serviço prestado';
COMMENT ON COLUMN nfse.status IS 'Status da NFSe: pendente, processando, emitida, cancelada, erro';
COMMENT ON COLUMN nfse.numero_nfse IS 'Número da NFSe após emissão pela prefeitura';
COMMENT ON COLUMN nfse.codigo_verificacao IS 'Código de verificação da NFSe';

-- =====================================================
-- PASSO 5: Migrar dados das notas fiscais
-- =====================================================

INSERT INTO nfse (
  id,
  empresa_id,
  user_id,
  data_competencia,
  tomador_cpf_cnpj,
  tomador_nome,
  descricao_servicos,
  valor_servicos,
  status,
  pdf_url,
  created_at,
  updated_at
)
SELECT 
  id,
  empresa_id,
  user_id,
  COALESCE(data_competencia, CURRENT_DATE),
  COALESCE(tomador_cpf_cnpj, ''),
  COALESCE(tomador_nome, ''),
  COALESCE(descricao_servicos, ''),
  COALESCE(valor_servicos, 0),
  COALESCE(status, 'pendente'),
  pdf_url,
  created_at,
  updated_at
FROM nfse_backup
WHERE empresa_id IS NOT NULL 
  AND user_id IS NOT NULL;

-- =====================================================
-- PASSO 6: Criar índices para performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_nfse_empresa_id ON nfse(empresa_id);
CREATE INDEX IF NOT EXISTS idx_nfse_user_id ON nfse(user_id);
CREATE INDEX IF NOT EXISTS idx_nfse_status ON nfse(status);
CREATE INDEX IF NOT EXISTS idx_nfse_data_emissao ON nfse(data_emissao);
CREATE INDEX IF NOT EXISTS idx_nfse_data_competencia ON nfse(data_competencia);
CREATE INDEX IF NOT EXISTS idx_nfse_numero_nfse ON nfse(numero_nfse);

CREATE INDEX IF NOT EXISTS idx_certificados_empresa_id ON certificados_digitais(empresa_id);
CREATE INDEX IF NOT EXISTS idx_certificados_user_id ON certificados_digitais(user_id);
CREATE INDEX IF NOT EXISTS idx_certificados_ativo ON certificados_digitais(ativo);

-- =====================================================
-- PASSO 7: Criar trigger para updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_nfse_updated_at ON nfse;
CREATE TRIGGER update_nfse_updated_at
  BEFORE UPDATE ON nfse
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_certificados_updated_at ON certificados_digitais;
CREATE TRIGGER update_certificados_updated_at
  BEFORE UPDATE ON certificados_digitais
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PASSO 8: Adicionar RLS (Row Level Security)
-- =====================================================

ALTER TABLE nfse ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificados_digitais ENABLE ROW LEVEL SECURITY;

-- Policies para nfse
DROP POLICY IF EXISTS "Users can view their own nfse" ON nfse;
CREATE POLICY "Users can view their own nfse"
  ON nfse FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own nfse" ON nfse;
CREATE POLICY "Users can insert their own nfse"
  ON nfse FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own nfse" ON nfse;
CREATE POLICY "Users can update their own nfse"
  ON nfse FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all nfse" ON nfse;
CREATE POLICY "Admins can view all nfse"
  ON nfse FOR SELECT
  USING (get_user_role(auth.uid()) = 'administrador');

-- Policies para certificados_digitais
DROP POLICY IF EXISTS "Users can view their own certificates" ON certificados_digitais;
CREATE POLICY "Users can view their own certificates"
  ON certificados_digitais FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own certificates" ON certificados_digitais;
CREATE POLICY "Users can insert their own certificates"
  ON certificados_digitais FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own certificates" ON certificados_digitais;
CREATE POLICY "Users can update their own certificates"
  ON certificados_digitais FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all certificates" ON certificados_digitais;
CREATE POLICY "Admins can view all certificates"
  ON certificados_digitais FOR SELECT
  USING (get_user_role(auth.uid()) = 'administrador');

-- =====================================================
-- FIM DA MIGRAÇÃO
-- =====================================================

-- Para verificar os dados migrados:
-- SELECT COUNT(*) as total_nfse FROM nfse;
-- SELECT COUNT(*) as total_certificados FROM certificados_digitais;
-- SELECT COUNT(*) as total_backup FROM nfse_backup;
