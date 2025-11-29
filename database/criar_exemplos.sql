-- TopMEI - Dados de Exemplo
-- =====================================================
-- PERFIS DO SISTEMA
-- =====================================================

-- Inserir perfis padrão (executar apenas uma vez)
INSERT INTO perfil (role, ativo) VALUES
  ('cliente', true),
  ('contador', true),
  ('administrador', true);

-- =====================================================
-- TIPOS DE DOCUMENTOS
-- =====================================================

INSERT INTO tipo_documentos (nome, descricao, obrigatorio, ativo) VALUES
  ('RG (Frente e Verso)', 'Documento de identidade do proprietário (frente e verso)', true, true),
  ('CPF', 'Cadastro de Pessoa Física do proprietário', true, true),
  ('Comprovante de Residência', 'Conta de luz, água, telefone ou contrato de aluguel (máximo 3 meses)', true, true),
  ('CCMEI', 'Certificado da Condição de Microempreendedor Individual', true, true),
  ('Alvará de Funcionamento', 'Alvará emitido pela prefeitura', false, true),
  ('Inscrição Municipal', 'Documento de inscrição municipal (se aplicável)', false, true),
  ('Contrato Social', 'Contrato social da empresa (se houver)', false, true),
  ('Procuração', 'Procuração para representação (se aplicável)', false, true),
  ('Certificado Digital', 'Certificado digital e-CNPJ ou e-CPF', false, true),
  ('Outros Documentos', 'Outros documentos relevantes', false, true);

-- =====================================================
-- PLANOS DE ASSINATURA
-- =====================================================

-- Planos Mensais
INSERT INTO planos (recorrencia, nome, descrição, valor, ativo, recursos) VALUES
(
  'mensal', 
  'Básico', 
  'Ideal para quem está começando. Inclui emissão de notas fiscais e gestão básica de documentos.', 
  29.90, 
  true,
  '["Emissão de Notas Fiscais", "Gestão de Documentos", "Suporte por Email"]'::jsonb
),
(
  'mensal', 
  'Profissional', 
  'Para MEIs em crescimento. Inclui todos os recursos do Básico + suporte prioritário e relatórios avançados.', 
  49.90, 
  true,
  '["Todos recursos do Básico", "Relatórios Avançados", "Suporte Prioritário", "Backup Automático"]'::jsonb
),
(
  'mensal', 
  'Premium', 
  'Solução completa para MEIs consolidados. Todos os recursos + consultoria contábil mensal e assessoria fiscal.', 
  79.90, 
  true,
  '["Todos recursos do Profissional", "Consultoria Contábil Mensal", "Assessoria Fiscal", "Emissor de Orçamentos"]'::jsonb
);

-- Planos Semestrais (10% desconto)
INSERT INTO planos (recorrencia, nome, descrição, valor, ativo, recursos) VALUES
(
  'semestral', 
  'Básico Semestral', 
  'Plano Básico com pagamento semestral. Economize 10% pagando antecipado.', 
  161.46, 
  true,
  '["Emissão de Notas Fiscais", "Gestão de Documentos", "Suporte por Email", "Economia de 10%"]'::jsonb
),
(
  'semestral', 
  'Profissional Semestral', 
  'Plano Profissional com pagamento semestral. Economize 10% pagando antecipado.', 
  269.46, 
  true,
  '["Todos recursos do Básico", "Relatórios Avançados", "Suporte Prioritário", "Backup Automático", "Economia de 10%"]'::jsonb
),
(
  'semestral', 
  'Premium Semestral', 
  'Plano Premium com pagamento semestral. Economize 10% pagando antecipado.', 
  431.46, 
  true,
  '["Todos recursos do Profissional", "Consultoria Contábil Mensal", "Assessoria Fiscal", "Emissor de Orçamentos", "Economia de 10%"]'::jsonb
);

-- Planos Anuais (20% desconto)
INSERT INTO planos (recorrencia, nome, descrição, valor, ativo, recursos) VALUES
(
  'anual', 
  'Básico Anual', 
  'Plano Básico com pagamento anual. Economize 20% pagando antecipado (equivalente a 2 meses grátis).', 
  287.04, 
  true,
  '["Emissão de Notas Fiscais", "Gestão de Documentos", "Suporte por Email", "Economia de 20%"]'::jsonb
),
(
  'anual', 
  'Profissional Anual', 
  'Plano Profissional com pagamento anual. Economize 20% pagando antecipado (equivalente a 2 meses grátis).', 
  479.04, 
  true,
  '["Todos recursos do Básico", "Relatórios Avançados", "Suporte Prioritário", "Backup Automático", "Economia de 20%"]'::jsonb
),
(
  'anual', 
  'Premium Anual', 
  'Plano Premium com pagamento anual. Economize 20% pagando antecipado (equivalente a 2 meses grátis).', 
  767.04, 
  true,
  '["Todos recursos do Profissional", "Consultoria Contábil Mensal", "Assessoria Fiscal", "Emissor de Orçamentos", "Economia de 20%"]'::jsonb
);

-- =====================================================
-- SERVIÇOS ADICIONAIS
-- =====================================================

INSERT INTO servicos (nome, descricao, valor, ativo) VALUES
(
  'Abertura de MEI',
  'Serviço completo de abertura de MEI com toda documentação',
  150.00,
  true
),
(
  'Alteração Cadastral',
  'Alteração de dados cadastrais do MEI (endereço, atividade, etc)',
  80.00,
  true
),
(
  'Declaração Anual (DASN-SIMEI)',
  'Elaboração e envio da Declaração Anual do Simples Nacional',
  120.00,
  true
),
(
  'Emissão de NFSe Avulsa',
  'Emissão de nota fiscal de serviço avulsa',
  25.00,
  true
),
(
  'Regularização de Pendências',
  'Regularização de pendências fiscais e tributárias',
  200.00,
  true
),
(
  'Consultoria Fiscal',
  'Consultoria fiscal personalizada (1 hora)',
  150.00,
  true
),
(
  'Encerramento de MEI',
  'Processo completo de encerramento de MEI',
  180.00,
  true
),
(
  'Certificado Digital e-CPF A1',
  'Emissão de certificado digital e-CPF tipo A1 (1 ano)',
  120.00,
  true
),
(
  'Parcelamento de Débitos',
  'Negociação e parcelamento de débitos com Receita Federal',
  100.00,
  true
);

-- =====================================================
-- TEMPLATES DE ORÇAMENTO
-- =====================================================

-- Inserir templates (se já existirem, serão ignorados)
INSERT INTO templates_orcamento (id, nome, descricao, imagem_url, html_code, ativo, ordem) VALUES
(
  'moderno',
  'Moderno',
  'Design clean e minimalista com foco em legibilidade',
  'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=300&h=200&fit=crop',
  '<!-- Template HTML será desenvolvido futuramente -->',
  true,
  1
),
(
  'classico',
  'Clássico',
  'Layout tradicional e profissional para negócios formais',
  'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300&h=200&fit=crop',
  '<!-- Template HTML será desenvolvido futuramente -->',
  true,
  2
),
(
  'criativo',
  'Criativo',
  'Design moderno com elementos visuais diferenciados',
  'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=300&h=200&fit=crop',
  '<!-- Template HTML será desenvolvido futuramente -->',
  true,
  3
),
(
  'minimalista',
  'Minimalista',
  'Máxima simplicidade e objetividade',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=200&fit=crop',
  '<!-- Template HTML será desenvolvido futuramente -->',
  true,
  4
),
(
  'corporativo',
  'Corporativo',
  'Visual sóbrio e elegante para empresas estabelecidas',
  'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=300&h=200&fit=crop',
  '<!-- Template HTML será desenvolvido futuramente -->',
  true,
  5
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- ATUALIZAR ORÇAMENTOS EXISTENTES
-- =====================================================

-- Definir template padrão para orçamentos que ainda não têm
UPDATE orcamento 
SET template = 'moderno' 
WHERE template IS NULL;

-- =====================================================
-- VERIFICAÇÕES E CONSULTAS ÚTEIS
-- =====================================================

-- Verificar perfis criados
SELECT role, ativo FROM perfil ORDER BY role;

-- Verificar tipos de documentos
SELECT nome, obrigatorio, ativo FROM tipo_documentos ORDER BY obrigatorio DESC, nome;

-- Verificar planos criados
SELECT 
  recorrencia,
  nome,
  CONCAT('R$ ', CAST(valor AS VARCHAR)) as valor_formatado,
  ativo
FROM planos
ORDER BY 
  CASE 
    WHEN recorrencia = 'mensal' THEN 1
    WHEN recorrencia = 'semestral' THEN 2
    WHEN recorrencia = 'anual' THEN 3
    ELSE 4
  END,
  valor;

-- Verificar serviços criados
SELECT nome, CONCAT('R$ ', CAST(valor AS VARCHAR)) as valor_formatado, ativo 
FROM servicos 
ORDER BY nome;

-- Verificar templates de orçamento
SELECT id, nome, ordem, ativo FROM templates_orcamento ORDER BY ordem;

-- =====================================================
-- COMENTÁRIOS FINAIS
-- =====================================================

COMMENT ON TABLE planos IS 'Contém planos mensais, semestrais e anuais com descontos progressivos';
COMMENT ON TABLE servicos IS 'Catálogo de serviços adicionais oferecidos aos clientes';
COMMENT ON TABLE templates_orcamento IS 'Templates HTML para geração de orçamentos personalizados em PDF';

-- =====================================================
-- INFORMAÇÕES DE ECONOMIA
-- =====================================================

/*
PLANOS MENSAIS (base de cálculo):
- Básico: R$ 29,90/mês = R$ 358,80/ano
- Profissional: R$ 49,90/mês = R$ 598,80/ano
- Premium: R$ 79,90/mês = R$ 958,80/ano

PLANOS SEMESTRAIS (10% desconto):
- Básico: R$ 161,46/semestre = R$ 26,91/mês (economia de R$ 17,94/semestre)
- Profissional: R$ 269,46/semestre = R$ 44,91/mês (economia de R$ 29,94/semestre)
- Premium: R$ 431,46/semestre = R$ 71,91/mês (economia de R$ 47,94/semestre)

PLANOS ANUAIS (20% desconto = 2 meses grátis):
- Básico: R$ 287,04/ano = R$ 23,92/mês (economia de R$ 71,76/ano)
- Profissional: R$ 479,04/ano = R$ 39,92/mês (economia de R$ 119,76/ano)
- Premium: R$ 767,04/ano = R$ 63,92/mês (economia de R$ 191,76/ano)
*/
