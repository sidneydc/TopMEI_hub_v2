-- Criar tabela de templates para orçamentos
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

-- Criar índice para ordenação
CREATE INDEX IF NOT EXISTS idx_templates_ordem ON templates_orcamento(ordem, ativo);

-- Inserir templates padrão
INSERT INTO templates_orcamento (id, nome, descricao, imagem_url, ordem) VALUES
('moderno', 'Moderno', 'Design limpo e minimalista com cores vibrantes. Ideal para empresas de tecnologia e startups.', 'https://via.placeholder.com/300x400/4F46E5/ffffff?text=Moderno', 1),
('classico', 'Clássico', 'Layout tradicional e elegante. Perfeito para escritórios e empresas estabelecidas.', 'https://via.placeholder.com/300x400/1F2937/ffffff?text=Cl%C3%A1ssico', 2),
('criativo', 'Criativo', 'Visual ousado com elementos gráficos marcantes. Ótimo para agências e profissionais criativos.', 'https://via.placeholder.com/300x400/EC4899/ffffff?text=Criativo', 3),
('minimalista', 'Minimalista', 'Foco total no conteúdo com design simplificado. Indicado para consultores e profissionais liberais.', 'https://via.placeholder.com/300x400/10B981/ffffff?text=Minimalista', 4),
('corporativo', 'Corporativo', 'Profissional e formal com estrutura organizada. Ideal para empresas B2B e serviços corporativos.', 'https://via.placeholder.com/300x400/3B82F6/ffffff?text=Corporativo', 5)
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  descricao = EXCLUDED.descricao,
  imagem_url = EXCLUDED.imagem_url,
  ordem = EXCLUDED.ordem;

-- Políticas RLS para templates
ALTER TABLE templates_orcamento ENABLE ROW LEVEL SECURITY;

-- Permitir leitura pública dos templates
CREATE POLICY "Templates são públicos"
ON templates_orcamento FOR SELECT
TO public
USING (ativo = true);

-- Apenas administradores podem modificar templates
CREATE POLICY "Apenas admins podem inserir templates"
ON templates_orcamento FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_perfis
    WHERE user_perfis.user_id = auth.uid()
    AND user_perfis.perfil_id IN (
      SELECT id FROM perfil WHERE nome = 'administrador'
    )
  )
);

CREATE POLICY "Apenas admins podem atualizar templates"
ON templates_orcamento FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_perfis
    WHERE user_perfis.user_id = auth.uid()
    AND user_perfis.perfil_id IN (
      SELECT id FROM perfil WHERE nome = 'administrador'
    )
  )
);

CREATE POLICY "Apenas admins podem deletar templates"
ON templates_orcamento FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_perfis
    WHERE user_perfis.user_id = auth.uid()
    AND user_perfis.perfil_id IN (
      SELECT id FROM perfil WHERE nome = 'administrador'
    )
  )
);

-- Adicionar foreign key na tabela orcamento (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_orcamento_template'
    AND table_name = 'orcamento'
  ) THEN
    ALTER TABLE orcamento
    ADD CONSTRAINT fk_orcamento_template
    FOREIGN KEY (template)
    REFERENCES templates_orcamento(id)
    ON DELETE SET NULL;
  END IF;
END $$;

-- Definir template padrão como 'moderno' para registros existentes
UPDATE orcamento SET template = 'moderno' WHERE template IS NULL;
