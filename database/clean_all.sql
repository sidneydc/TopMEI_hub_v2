-- TopMEI - Limpeza Completa do Banco de Dados
-- =====================================================
-- AJUSTAR CONSTRAINT DE AUDITORIA (FIX DEFINITIVO)
-- =====================================================

-- Modificar a FK de auditoria.empresa_id para ON DELETE SET NULL
-- Isso permite que registros de auditoria sejam mantidos mesmo após deletar empresas
DO $$
BEGIN
  -- Verificar e dropar constraint existente
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'auditoria_empresa_id_fkey' 
    AND table_name = 'auditoria'
  ) THEN
    ALTER TABLE auditoria DROP CONSTRAINT auditoria_empresa_id_fkey;
    RAISE NOTICE 'Constraint antiga removida';
  END IF;
  
  -- Tornar coluna nullable (se não for)
  ALTER TABLE auditoria ALTER COLUMN empresa_id DROP NOT NULL;
  
  -- Criar nova constraint com ON DELETE SET NULL e DEFERRABLE
  ALTER TABLE auditoria 
    ADD CONSTRAINT auditoria_empresa_id_fkey 
    FOREIGN KEY (empresa_id) 
    REFERENCES empresa(id) 
    ON DELETE SET NULL
    DEFERRABLE INITIALLY DEFERRED;
    
  RAISE NOTICE 'Constraint atualizada: empresa_id agora usa ON DELETE SET NULL DEFERRABLE';
END $$;

-- =====================================================
-- LIMPAR DADOS (na ordem correta de dependências)
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Iniciando limpeza de dados...';
  
  -- Garantir que constraints deferráveis sejam adiadas
  SET CONSTRAINTS ALL DEFERRED;
  
  -- 1. Limpar notificações
  DELETE FROM notificacao;
  RAISE NOTICE 'Notificações limpas';

  -- 2. Limpar orçamentos
  DELETE FROM orcamento;
  RAISE NOTICE 'Orçamentos limpos';

  -- 3. Limpar NFSe
  DELETE FROM nfse;
  RAISE NOTICE 'NFSe limpas';

  -- 4. Limpar cobranças de planos
  DELETE FROM cobranca_plano;
  RAISE NOTICE 'Cobranças de planos limpas';

  -- 5. Limpar cobranças de serviços
  DELETE FROM cobranca_servicos;
  RAISE NOTICE 'Cobranças de serviços limpas';

  -- 6. Limpar relação empresa-serviços
  DELETE FROM empresa_servicos;
  RAISE NOTICE 'Serviços de empresas limpos';

  -- 7. Limpar relação empresa-planos
  DELETE FROM empresas_planos;
  RAISE NOTICE 'Planos de empresas limpos';

  -- 8. Limpar documentos
  DELETE FROM documentos;
  RAISE NOTICE 'Documentos limpos';

  -- 9. Limpar CNAEs secundários
  DELETE FROM cnaes_secundarios;
  RAISE NOTICE 'CNAEs secundários limpos';

  -- 10. Limpar inscrições
  DELETE FROM inscricoes;
  RAISE NOTICE 'Inscrições limpas';

  -- 11. Limpar empresas (PRINCIPAL)
  -- Com DEFERRABLE, o trigger de auditoria vai funcionar e a FK será verificada no final
  DELETE FROM empresa;
  RAISE NOTICE 'Empresas limpas';

  -- 12. Limpar auditoria (opcional - se quiser manter histórico, comente esta linha)
  DELETE FROM auditoria;
  RAISE NOTICE 'Auditoria limpa';
  
END $$;

-- =====================================================
-- LIMPAR STORAGE (se necessário)
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'ATENÇÃO: Arquivos no Storage (logos e documentos) NÃO foram deletados automaticamente.';
  RAISE NOTICE 'Para limpar o Storage, acesse o Supabase Dashboard > Storage e delete manualmente os arquivos.';
END $$;

-- =====================================================
-- RESETAR SEQUÊNCIAS (se houver)
-- =====================================================

-- Não há sequências AUTO_INCREMENT neste projeto (todos usam UUID)
-- Mas se adicionar no futuro, resetar aqui

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

DO $$
DECLARE
  empresas_count INTEGER;
  documentos_count INTEGER;
  orcamentos_count INTEGER;
  auditoria_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO empresas_count FROM empresa;
  SELECT COUNT(*) INTO documentos_count FROM documentos;
  SELECT COUNT(*) INTO orcamentos_count FROM orcamento;
  SELECT COUNT(*) INTO auditoria_count FROM auditoria;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'LIMPEZA CONCLUÍDA COM SUCESSO!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Empresas restantes: %', empresas_count;
  RAISE NOTICE 'Documentos restantes: %', documentos_count;
  RAISE NOTICE 'Orçamentos restantes: %', orcamentos_count;
  RAISE NOTICE 'Registros de auditoria restantes: %', auditoria_count;
  RAISE NOTICE '========================================';
  
  IF empresas_count = 0 AND documentos_count = 0 THEN
    RAISE NOTICE 'Banco de dados limpo com sucesso!';
  ELSE
    RAISE WARNING 'Alguns registros não foram removidos. Verifique dependências.';
  END IF;
END $$;

-- =====================================================
-- OBSERVAÇÕES IMPORTANTES
-- =====================================================

/*
ATENÇÃO:
1. Este script DELETA TODOS OS DADOS de empresas e relacionados

2. SOLUÇÃO IMPLEMENTADA:
   - A constraint de auditoria.empresa_id foi alterada para ON DELETE SET NULL
   - Isso permite que os triggers de auditoria funcionem normalmente
   - Quando uma empresa é deletada, o empresa_id na auditoria fica NULL
   - Mantém histórico de auditoria mesmo após deletar empresas

3. NÃO deleta:
   - Usuários (auth.users)
   - Perfis (perfil table)
   - User_perfis (relação usuário-perfil)
   - Planos disponíveis
   - Serviços disponíveis
   - Tipos de documentos
   - Templates de orçamento

4. Para limpar Storage:
   - Acesse Supabase Dashboard
   - Vá em Storage > Buckets
   - Delete manualmente os arquivos em:
     * doc_cus (documentos)
     * logos (logos das empresas)

5. Para limpar TUDO (incluindo usuários):
   - Execute adicionalmente:
     DELETE FROM auth.users WHERE email LIKE '%@%';
   - Ou use o Supabase Dashboard > Authentication

6. MANTER HISTÓRICO DE AUDITORIA:
   - Se quiser preservar registros de auditoria, comente a linha:
     DELETE FROM auditoria;
   - Os registros ficarão com empresa_id = NULL após deletar empresas

COMO USAR:
1. Abra o SQL Editor do Supabase
2. Cole este script completo
3. Execute (clique em "Run")
4. Verifique os logs no output
5. Se necessário, limpe o Storage manualmente

PRIMEIRA VEZ EXECUTANDO?
- O script vai ajustar automaticamente a constraint de auditoria
- Em execuções futuras, esse ajuste será pulado (já estará correto)
*/
