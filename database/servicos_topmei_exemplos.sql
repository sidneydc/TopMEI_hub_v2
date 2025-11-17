-- =====================================================
-- EXEMPLOS: Serviços avulsos da TOPMEI
-- =====================================================
-- Baseado nos serviços oferecidos em https://topmei.com.br
-- Valores sugeridos baseados no mercado de contabilidade para MEI
-- =====================================================

-- Limpar serviços existentes (opcional)
-- DELETE FROM servicos;

-- Inserir serviços avulsos
INSERT INTO servicos (nome, descricao, valor, ativo) VALUES
(
  'Abertura de MEI',
  'Serviço completo de abertura de MEI com toda documentação necessária. Incluindo consulta de viabilidade, elaboração do Contrato Social e registro nos órgãos competentes (Junta Comercial e Receita Federal).',
  150.00,
  true
),
(
  'Alteração de Dados do MEI',
  'Alteração de dados cadastrais do MEI como endereço, atividade principal/secundária, nome fantasia, etc. Realizamos todas as alterações nos órgãos competentes.',
  80.00,
  true
),
(
  'Declaração Anual do MEI (DASN-SIMEI)',
  'Declaração Anual do Simples Nacional para MEI. Obrigatória até o último dia de maio de cada ano. Evite multas e mantenha sua regularidade fiscal.',
  120.00,
  true
),
(
  'Baixa do MEI',
  'Encerramento completo das atividades do MEI. Realizamos todo o processo de baixa junto aos órgãos competentes, garantindo que não haja pendências futuras.',
  100.00,
  true
),
(
  'Desenquadramento do MEI',
  'Processo de desenquadramento do MEI para Microempresa (ME) ou Empresa de Pequeno Porte (EPP). Ideal para quem ultrapassou o faturamento permitido ou deseja incluir sócios.',
  180.00,
  true
),
(
  'Parcelamento de Débitos do MEI',
  'Regularização de débitos do MEI através de parcelamento junto à Receita Federal. Análise da situação fiscal e elaboração do parcelamento mais adequado.',
  150.00,
  true
),
(
  'Emissão de Guia DAS Avulsa',
  'Emissão de guia DAS (Documento de Arrecadação do Simples Nacional) para pagamento mensal do MEI. Serviço avulso para quem não possui plano mensal.',
  25.00,
  true
),
(
  'Certidão Negativa de Débitos (CND)',
  'Emissão de Certidão Negativa de Débitos Federal, Estadual ou Municipal. Documento necessário para participar de licitações e comprovar regularidade fiscal.',
  60.00,
  true
),
(
  'Regularização Fiscal do MEI',
  'Análise completa da situação fiscal do MEI e regularização de pendências. Inclui verificação de DAS em atraso, declarações não enviadas e outros problemas fiscais.',
  200.00,
  true
),
(
  'Consultoria Inicial para Abertura de MEI',
  'Consultoria completa para quem está começando. Orientação sobre atividades permitidas, faturamento, obrigações fiscais e documentação necessária.',
  80.00,
  true
),
(
  'Alvará de Funcionamento',
  'Auxílio na obtenção do Alvará de Funcionamento junto à Prefeitura. Análise de viabilidade do endereço e elaboração de toda documentação necessária.',
  120.00,
  true
),
(
  'Inscrição Municipal (CCM)',
  'Registro da empresa na Prefeitura para obtenção da Inscrição Municipal (Cadastro de Contribuinte Mobiliário). Necessário para prestadores de serviços.',
  90.00,
  true
);

-- Verificar serviços inseridos
SELECT 
  nome,
  valor,
  ativo,
  CASE 
    WHEN valor <= 50 THEN 'Baixo'
    WHEN valor <= 100 THEN 'Médio'
    ELSE 'Alto'
  END as faixa_preco
FROM servicos 
ORDER BY valor;

-- =====================================================
-- OBSERVAÇÕES:
-- - Valores são sugestões baseadas no mercado
-- - Ajuste conforme a realidade da sua região
-- - Serviços cadastrais: abertura, alteração, baixa
-- - Serviços fiscais: declarações, regularizações
-- - Serviços de consultoria: orientações e análises
-- =====================================================
