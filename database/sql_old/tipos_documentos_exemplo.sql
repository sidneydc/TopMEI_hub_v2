-- Inserir tipos de documentos para MEI
-- Execute este script no Supabase SQL Editor

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
  ('Outros Documentos', 'Outros documentos relevantes', false, true)
ON CONFLICT DO NOTHING;
