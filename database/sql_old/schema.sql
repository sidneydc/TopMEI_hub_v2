-- TopMEI - Database Schema
-- Sistema de Gestão de MEI

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
  descricao TEXT,
  tipo VARCHAR(50),
  valor DECIMAL(10,2),
  ativo BOOLEAN DEFAULT true,
  caracteristicas TEXT
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

-- Tabela de NFSe
CREATE TABLE IF NOT EXISTS nfse (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresa(id) ON DELETE CASCADE,
  numero VARCHAR(50),
  serie VARCHAR(10),
  data_emissao DATE,
  valor_servico DECIMAL(10,2),
  base_calculo DECIMAL(10,2),
  aliquota DECIMAL(5,2),
  valor_iss DECIMAL(10,2),
  descricao_servico TEXT,
  tomador_cnpj_cpf VARCHAR(14),
  tomador_nome VARCHAR(255),
  status VARCHAR(50) DEFAULT 'emitida',
  xml_path TEXT,
  pdf_path TEXT,
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
  template VARCHAR(50),
  num_orc NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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

-- Tabela de Notificações
CREATE TABLE IF NOT EXISTS notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo VARCHAR(255),
  mensagem TEXT,
  tipo VARCHAR(50),
  lida BOOLEAN DEFAULT false,
  data_leitura TIMESTAMP WITH TIME ZONE,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Auditoria
CREATE TABLE IF NOT EXISTS auditoria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  empresa_id UUID REFERENCES empresa(id),
  tabela VARCHAR(100),
  acao VARCHAR(50),
  registro_id UUID,
  dados_anteriores JSONB,
  dados_novos JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_empresa_user_id ON empresa(user_id);
CREATE INDEX IF NOT EXISTS idx_empresa_cnpj ON empresa(cnpj);
CREATE INDEX IF NOT EXISTS idx_empresa_status ON empresa(status_cadastro);
CREATE INDEX IF NOT EXISTS idx_documentos_empresa ON documentos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_empresas_planos_empresa ON empresas_planos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_empresa_servicos_empresa ON empresa_servicos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_user ON notificacoes(user_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON notificacoes(lida);
CREATE INDEX IF NOT EXISTS idx_auditoria_empresa ON auditoria(empresa_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_user ON auditoria(user_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_created ON auditoria(created_at);

-- Inserir perfis padrão
INSERT INTO perfil (role, descricao, ativo) VALUES
  ('cliente', 'Cliente - Proprietário de MEI', true),
  ('contador', 'Contador - Gerencia múltiplos clientes', true),
  ('administrador', 'Administrador do sistema', true)
ON CONFLICT (role) DO NOTHING;

-- Comentários nas tabelas
COMMENT ON TABLE empresa IS 'Tabela principal de cadastro de empresas MEI';
COMMENT ON TABLE perfil IS 'Perfis de acesso ao sistema';
COMMENT ON TABLE user_perfis IS 'Relação entre usuários e perfis';
COMMENT ON TABLE documentos IS 'Documentos anexados às empresas';
COMMENT ON TABLE servicos IS 'Catálogo de serviços oferecidos';
COMMENT ON TABLE planos IS 'Planos de assinatura disponíveis';
COMMENT ON TABLE empresas_planos IS 'Planos contratados pelas empresas';
COMMENT ON TABLE empresa_servicos IS 'Serviços contratados pelas empresas';
COMMENT ON TABLE notificacoes IS 'Sistema de notificações para usuários';
COMMENT ON TABLE auditoria IS 'Log de auditoria de todas as operações';
COMMENT ON COLUMN empresa.data_inativacao IS 'Data em que a empresa foi inativada pelo usuário';
