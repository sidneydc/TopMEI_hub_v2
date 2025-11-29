-- TopMEI - Criação de Tabelas
-- =====================================================
-- TABELAS DE AUTENTICAÇÃO E PERFIS
-- =====================================================

-- Tabela de Perfis de Usuário
CREATE TABLE IF NOT EXISTS perfil (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role VARCHAR(50) UNIQUE NOT NULL,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Relação User-Perfil
CREATE TABLE IF NOT EXISTS user_perfis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  perfil_id UUID REFERENCES perfil(id),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, perfil_id)
);

-- =====================================================
-- TABELAS DE EMPRESAS E CADASTROS
-- =====================================================

-- Tabela de Empresas
CREATE TABLE IF NOT EXISTS empresa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  cnpj VARCHAR(14),
  razao_social VARCHAR(255),
  nome_fantasia VARCHAR(255),
  nome_proprietario VARCHAR(255),
  cpf_proprietario VARCHAR(11),
  data_nascimento DATE,
  data_abertura DATE,
  optante_simei BOOLEAN DEFAULT false,
  data_opcao_simei DATE,
  cnae_principal VARCHAR(10),
  descricao_cnae_principal TEXT,
  status_cnpj VARCHAR(50),
  cep VARCHAR(8),
  rua VARCHAR(255),
  numero VARCHAR(20),
  complemento VARCHAR(100),
  bairro VARCHAR(100),
  cidade VARCHAR(100),
  estado VARCHAR(2),
  telefone_ddd VARCHAR(2),
  telefone_numero VARCHAR(15),
  email VARCHAR(255),
  observacoes TEXT,
  regime_tributario VARCHAR(50),
  status_cadastro VARCHAR(50) DEFAULT 'pendente',
  motivo_rejeicao TEXT,
  criado_por VARCHAR(255),
  aprovado_por VARCHAR(255),
  data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_aprovacao TIMESTAMP WITH TIME ZONE,
  data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_inativacao TIMESTAMP WITH TIME ZONE
);

-- Tabela de CNAEs Secundários
CREATE TABLE IF NOT EXISTS cnaes_secundarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresa(id) ON DELETE CASCADE,
  cnae_num VARCHAR(10),
  cnae_descricao TEXT,
  ativo BOOLEAN DEFAULT true
);

-- Tabela de Inscrições (Estadual/Municipal)
CREATE TABLE IF NOT EXISTS inscricoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresa(id) ON DELETE CASCADE,
  tipo VARCHAR(50),
  numero VARCHAR(50),
  estado VARCHAR(2),
  ativa BOOLEAN DEFAULT true
);

-- =====================================================
-- TABELAS DE DOCUMENTOS
-- =====================================================

-- Tabela de Tipos de Documentos
CREATE TABLE IF NOT EXISTS tipo_documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  obrigatorio BOOLEAN DEFAULT false,
  ativo BOOLEAN DEFAULT true
);

-- Tabela de Documentos
CREATE TABLE IF NOT EXISTS documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresa(id) ON DELETE CASCADE,
  tipo_documento_id UUID REFERENCES tipo_documentos(id),
  nome_arquivo VARCHAR(255),
  caminho_storage TEXT,
  tamanho_bytes BIGINT,
  mime_type VARCHAR(100),
  data_upload TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'pendente',
  observacao TEXT
);

-- =====================================================
-- TABELAS DE SERVIÇOS E PLANOS
-- =====================================================

-- Tabela de Serviços
CREATE TABLE IF NOT EXISTS servicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  valor DECIMAL(10,2),
  ativo BOOLEAN DEFAULT true,
  tipo VARCHAR(50),
  prazo_dias INTEGER
);

-- Tabela de Planos
CREATE TABLE IF NOT EXISTS planos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(100) NOT NULL,
  descrição TEXT,
  tipo VARCHAR(50),
  valor DECIMAL(10,2),
  recursos JSONB,
  recorrencia VARCHAR(50),
  ativo BOOLEAN DEFAULT true
);

-- Tabela de Planos Contratados pela Empresa
CREATE TABLE IF NOT EXISTS empresas_planos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresa(id) ON DELETE CASCADE,
  plano_id UUID REFERENCES planos(id),
  valor DECIMAL(10,2),
  status VARCHAR(50) DEFAULT 'ativo',
  vigencia_inicio DATE,
  vigencia_fim DATE
);

-- Tabela de Serviços Contratados pela Empresa
CREATE TABLE IF NOT EXISTS empresa_servicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresa(id) ON DELETE CASCADE,
  servicos_id UUID REFERENCES servicos(id),
  data_contratacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valor DECIMAL(10,2),
  status VARCHAR(50) DEFAULT 'ativo',
  observacao TEXT,
  concluido BOOLEAN DEFAULT false,
  data_conclusao TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- TABELAS DE COBRANÇA
-- =====================================================

-- Tabela de Cobrança de Planos
CREATE TABLE IF NOT EXISTS cobranca_plano (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_plano_id UUID REFERENCES empresas_planos(id),
  valor DECIMAL(10,2),
  data_vencimento DATE,
  data_pagamento DATE,
  status VARCHAR(50) DEFAULT 'pendente',
  metodo_pagamento VARCHAR(50),
  observacao TEXT
);

-- Tabela de Cobrança de Serviços
CREATE TABLE IF NOT EXISTS cobranca_servicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_servico_id UUID REFERENCES empresa_servicos(id),
  valor DECIMAL(10,2),
  data_vencimento DATE,
  data_pagamento DATE,
  status VARCHAR(50) DEFAULT 'pendente',
  metodo_pagamento VARCHAR(50),
  observacao TEXT
);

-- =====================================================
-- TABELAS DE DOCUMENTOS FISCAIS
-- =====================================================

-- Tabela de Certificados Digitais
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
  UNIQUE(empresa_id)
);

-- Tabela de NFSe
CREATE TABLE IF NOT EXISTS nfse (
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

-- =====================================================
-- TABELAS DE ORÇAMENTOS
-- =====================================================

-- Tabela de Templates de Orçamento
CREATE TABLE IF NOT EXISTS templates_orcamento (
  id VARCHAR(50) PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  imagem_url TEXT,
  html_code TEXT,
  ativo BOOLEAN DEFAULT true,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Orçamentos
CREATE TABLE IF NOT EXISTS orcamento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresa(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  razao_social VARCHAR(255),
  nome_fantasia VARCHAR(255),
  cnpj VARCHAR(18),
  email VARCHAR(255),
  telefone_wpp VARCHAR(20),
  site TEXT,
  rua VARCHAR(255),
  numero VARCHAR(20),
  bairro VARCHAR(100),
  cidade VARCHAR(100),
  slogan TEXT,
  logo_url TEXT,
  introducao TEXT,
  observacoes_importantes TEXT,
  quem_somos TEXT,
  template VARCHAR(50) REFERENCES templates_orcamento(id) ON DELETE SET NULL,
  num_orc NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELAS DE NOTIFICAÇÕES
-- =====================================================

-- Tabela de Notificações
CREATE TABLE IF NOT EXISTS notificacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  titulo VARCHAR(255),
  mensagem TEXT,
  visualizado BOOLEAN DEFAULT false,
  dt_visualizacao TIMESTAMP WITH TIME ZONE,
  lida BOOLEAN DEFAULT false,
  data_leitura TIMESTAMP WITH TIME ZONE,
  link TEXT,
  tipo VARCHAR(50)
);

-- =====================================================
-- TABELAS DE AUDITORIA
-- =====================================================

-- Tabela de Auditoria
CREATE TABLE IF NOT EXISTS auditoria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  empresa_id UUID REFERENCES empresa(id) ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED,
  tabela VARCHAR(100),
  acao VARCHAR(50),
  registro_id UUID,
  dados_anteriores JSONB,
  dados_novos JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices de Empresa
CREATE INDEX IF NOT EXISTS idx_empresa_user_id ON empresa(user_id);
CREATE INDEX IF NOT EXISTS idx_empresa_cnpj ON empresa(cnpj);
CREATE INDEX IF NOT EXISTS idx_empresa_status ON empresa(status_cadastro);

-- Índices de Documentos
CREATE INDEX IF NOT EXISTS idx_documentos_empresa ON documentos(empresa_id);

-- Índices de Planos e Serviços
CREATE INDEX IF NOT EXISTS idx_empresas_planos_empresa ON empresas_planos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_empresa_servicos_empresa ON empresa_servicos(empresa_id);

-- Índices de Notificações
CREATE INDEX IF NOT EXISTS idx_notificacoes_user ON notificacao(user_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON notificacao(lida);
CREATE INDEX IF NOT EXISTS idx_notificacoes_visualizado ON notificacao(visualizado);

-- Índices de NFSe e Certificados
CREATE INDEX IF NOT EXISTS idx_nfse_empresa_id ON nfse(empresa_id);
CREATE INDEX IF NOT EXISTS idx_nfse_user_id ON nfse(user_id);
CREATE INDEX IF NOT EXISTS idx_nfse_status ON nfse(status);
CREATE INDEX IF NOT EXISTS idx_nfse_data_emissao ON nfse(data_emissao);
CREATE INDEX IF NOT EXISTS idx_nfse_data_competencia ON nfse(data_competencia);
CREATE INDEX IF NOT EXISTS idx_nfse_numero_nfse ON nfse(numero_nfse);
CREATE INDEX IF NOT EXISTS idx_certificados_empresa_id ON certificados_digitais(empresa_id);
CREATE INDEX IF NOT EXISTS idx_certificados_user_id ON certificados_digitais(user_id);
CREATE INDEX IF NOT EXISTS idx_certificados_ativo ON certificados_digitais(ativo);

-- Índices de Templates
CREATE INDEX IF NOT EXISTS idx_templates_ordem ON templates_orcamento(ordem, ativo);

-- Índices de Auditoria
CREATE INDEX IF NOT EXISTS idx_auditoria_empresa ON auditoria(empresa_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_user ON auditoria(user_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_created ON auditoria(created_at);

-- =====================================================
-- COMENTÁRIOS NAS TABELAS
-- =====================================================

COMMENT ON TABLE empresa IS 'Tabela principal de cadastro de empresas MEI';
COMMENT ON TABLE perfil IS 'Perfis de acesso ao sistema';
COMMENT ON TABLE user_perfis IS 'Relação entre usuários e perfis';
COMMENT ON TABLE documentos IS 'Documentos anexados às empresas';
COMMENT ON TABLE servicos IS 'Catálogo de serviços oferecidos';
COMMENT ON TABLE planos IS 'Planos de assinatura disponíveis';
COMMENT ON TABLE empresas_planos IS 'Planos contratados pelas empresas';
COMMENT ON TABLE empresa_servicos IS 'Serviços contratados pelas empresas';
COMMENT ON TABLE notificacao IS 'Sistema de notificações para usuários';
COMMENT ON TABLE auditoria IS 'Log de auditoria de todas as operações';
COMMENT ON TABLE templates_orcamento IS 'Templates HTML para geração de orçamentos em PDF';
COMMENT ON TABLE certificados_digitais IS 'Certificados digitais e senhas das empresas para emissão de NFSe';
COMMENT ON TABLE nfse IS 'Notas Fiscais de Serviço Eletrônicas (NFSe)';
COMMENT ON COLUMN empresa.data_inativacao IS 'Data em que a empresa foi inativada pelo usuário';
COMMENT ON COLUMN certificados_digitais.certificado_url IS 'URL do arquivo do certificado digital (storage)';
COMMENT ON COLUMN certificados_digitais.certificado_senha IS 'Senha do certificado digital (deve ser criptografada)';
COMMENT ON COLUMN nfse.numero_rps IS 'Número do Recibo Provisório de Serviços';
COMMENT ON COLUMN nfse.data_competencia IS 'Data de competência do serviço prestado';
COMMENT ON COLUMN nfse.status IS 'Status: pendente, processando, emitida, cancelada, erro';
