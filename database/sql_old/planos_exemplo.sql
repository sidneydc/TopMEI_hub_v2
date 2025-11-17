-- Inserir Planos de Exemplo no Sistema TopMEI Hub
-- Execute este script após executar o schema.sql

-- Limpar planos existentes (opcional)
-- DELETE FROM planos;

-- Planos Mensais
INSERT INTO planos (tipo, nome, descrição, valor, ativo) VALUES
('mensal', 'Básico', 'Ideal para quem está começando. Inclui emissão de notas fiscais e gestão básica de documentos.', 29.90, true),
('mensal', 'Profissional', 'Para MEIs em crescimento. Inclui todos os recursos do Básico + suporte prioritário e relatórios avançados.', 49.90, true),
('mensal', 'Premium', 'Solução completa para MEIs consolidados. Todos os recursos + consultoria contábil mensal e assessoria fiscal.', 79.90, true);

-- Planos Semestrais (com desconto)
INSERT INTO planos (tipo, nome, descrição, valor, ativo) VALUES
('semestral', 'Básico Semestral', 'Plano Básico com pagamento semestral. Economize 10% pagando antecipado.', 161.46, true),
('semestral', 'Profissional Semestral', 'Plano Profissional com pagamento semestral. Economize 10% pagando antecipado.', 269.46, true),
('semestral', 'Premium Semestral', 'Plano Premium com pagamento semestral. Economize 10% pagando antecipado.', 431.46, true);

-- Planos Anuais (com maior desconto)
INSERT INTO planos (tipo, nome, descrição, valor, ativo) VALUES
('anual', 'Básico Anual', 'Plano Básico com pagamento anual. Economize 20% pagando antecipado (equivalente a 2 meses grátis).', 287.04, true),
('anual', 'Profissional Anual', 'Plano Profissional com pagamento anual. Economize 20% pagando antecipado (equivalente a 2 meses grátis).', 479.04, true),
('anual', 'Premium Anual', 'Plano Premium com pagamento anual. Economize 20% pagando antecipado (equivalente a 2 meses grátis).', 767.04, true);

-- Verificar planos inseridos
SELECT 
  tipo,
  nome,
  CONCAT('R$ ', CAST(valor AS VARCHAR)) as valor_formatado,
  descrição,
  ativo
FROM planos
ORDER BY 
  CASE 
    WHEN tipo = 'mensal' THEN 1
    WHEN tipo = 'semestral' THEN 2
    WHEN tipo = 'anual' THEN 3
    ELSE 4
  END,
  valor;

-- Informações sobre economia nos planos
/*
PLANOS MENSAIS (base):
- Básico: R$ 29,90/mês = R$ 358,80/ano
- Profissional: R$ 49,90/mês = R$ 598,80/ano
- Premium: R$ 79,90/mês = R$ 958,80/ano

PLANOS SEMESTRAIS (10% desconto):
- Básico: R$ 161,46/semestre = R$ 26,91/mês (economia de R$ 3,00/mês)
- Profissional: R$ 269,46/semestre = R$ 44,91/mês (economia de R$ 5,00/mês)
- Premium: R$ 431,46/semestre = R$ 71,91/mês (economia de R$ 8,00/mês)

PLANOS ANUAIS (20% desconto):
- Básico: R$ 287,04/ano = R$ 23,92/mês (economia de R$ 71,76/ano)
- Profissional: R$ 479,04/ano = R$ 39,92/mês (economia de R$ 119,76/ano)
- Premium: R$ 767,04/ano = R$ 63,92/mês (economia de R$ 191,76/ano)
*/
