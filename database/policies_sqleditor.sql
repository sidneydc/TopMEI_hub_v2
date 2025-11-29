-- SQL Editor: Policies RLS
-- Execute este script no Supabase para recriar todas as policies conforme exportado

-- AUDITORIA
DROP POLICY IF EXISTS "Administradores veem toda auditoria" ON auditoria;
CREATE POLICY "Administradores veem toda auditoria" ON auditoria
  FOR SELECT TO authenticated
  USING (EXISTS ( SELECT 1 FROM user_perfis up JOIN perfil p ON (up.perfil_id = p.id) WHERE up.user_id = auth.uid() AND p.role = 'administrador' AND up.ativo = true));

DROP POLICY IF EXISTS "Clientes veem auditoria de suas empresas" ON auditoria;
CREATE POLICY "Clientes veem auditoria de suas empresas" ON auditoria
  FOR SELECT TO authenticated
  USING (empresa_id IN (SELECT empresa.id FROM empresa WHERE empresa.user_id = auth.uid()));

DROP POLICY IF EXISTS "Contadores veem auditoria de suas empresas" ON auditoria;
CREATE POLICY "Contadores veem auditoria de suas empresas" ON auditoria
  FOR SELECT TO authenticated
  USING ((EXISTS (SELECT 1 FROM user_perfis up JOIN perfil p ON (up.perfil_id = p.id) WHERE up.user_id = auth.uid() AND p.role = 'contador' AND up.ativo = true)) AND (empresa_id IN (SELECT empresa.id FROM empresa WHERE empresa.user_id = auth.uid())));

DROP POLICY IF EXISTS "Sistema insere auditoria" ON auditoria;
CREATE POLICY "Sistema insere auditoria" ON auditoria
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- CERTIFICADOS_DIGITAIS
DROP POLICY IF EXISTS "Admins can manage all certificates" ON certificados_digitais;
CREATE POLICY "Admins can manage all certificates" ON certificados_digitais
  FOR ALL TO public
  USING (EXISTS (SELECT 1 FROM user_perfis up JOIN perfil p ON (up.perfil_id = p.id) WHERE up.user_id = auth.uid() AND p.role = 'administrador' AND up.ativo = true))
  WITH CHECK (EXISTS (SELECT 1 FROM user_perfis up JOIN perfil p ON (up.perfil_id = p.id) WHERE up.user_id = auth.uid() AND p.role = 'administrador' AND up.ativo = true));

DROP POLICY IF EXISTS "Admins can view all certificates" ON certificados_digitais;
CREATE POLICY "Admins can view all certificates" ON certificados_digitais
  FOR SELECT TO public
  USING (EXISTS (SELECT 1 FROM user_perfis up JOIN perfil p ON (up.perfil_id = p.id) WHERE up.user_id = auth.uid() AND p.role = 'administrador' AND up.ativo = true));

DROP POLICY IF EXISTS "Contadores can view certificates" ON certificados_digitais;
CREATE POLICY "Contadores can view certificates" ON certificados_digitais
  FOR SELECT TO public
  USING (EXISTS (SELECT 1 FROM user_perfis up JOIN perfil p ON (up.perfil_id = p.id) WHERE up.user_id = auth.uid() AND p.role = 'contador' AND up.ativo = true));

DROP POLICY IF EXISTS "Users can delete their own certificates" ON certificados_digitais;
CREATE POLICY "Users can delete their own certificates" ON certificados_digitais
  FOR DELETE TO public
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own certificates" ON certificados_digitais;
CREATE POLICY "Users can insert their own certificates" ON certificados_digitais
  FOR INSERT TO public
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own certificates" ON certificados_digitais;
CREATE POLICY "Users can update their own certificates" ON certificados_digitais
  FOR UPDATE TO public
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view their own certificates" ON certificados_digitais;
CREATE POLICY "Users can view their own certificates" ON certificados_digitais
  FOR SELECT TO public
  USING (user_id = auth.uid());

-- COBRANCA_PLANO
DROP POLICY IF EXISTS "Admin can view all cobranca_plano" ON cobranca_plano;
CREATE POLICY "Admin can view all cobranca_plano" ON cobranca_plano FOR SELECT TO public USING (EXISTS ( SELECT 1 FROM user_perfis up JOIN perfil p ON (p.id = up.perfil_id) WHERE up.user_id = auth.uid() AND p.role = 'administrador' AND up.ativo = true));
DROP POLICY IF EXISTS "Users can view own cobranca_plano" ON cobranca_plano;
CREATE POLICY "Users can view own cobranca_plano" ON cobranca_plano FOR SELECT TO public USING (auth.uid() = user_id);

-- COBRANCA_SERVICOS
DROP POLICY IF EXISTS "Admin can view all cobranca_servicos" ON cobranca_servicos;
CREATE POLICY "Admin can view all cobranca_servicos" ON cobranca_servicos FOR SELECT TO public USING (EXISTS ( SELECT 1 FROM user_perfis up JOIN perfil p ON (p.id = up.perfil_id) WHERE up.user_id = auth.uid() AND p.role = 'administrador' AND up.ativo = true));
DROP POLICY IF EXISTS "Users can view own cobranca_servicos" ON cobranca_servicos;
CREATE POLICY "Users can view own cobranca_servicos" ON cobranca_servicos FOR SELECT TO public USING (auth.uid() = user_id);

-- EMPRESA
DROP POLICY IF EXISTS "Admin can do all on empresas" ON empresa;
CREATE POLICY "Admin can do all on empresas" ON empresa FOR ALL TO public USING (EXISTS ( SELECT 1 FROM user_perfis up JOIN perfil p ON (p.id = up.perfil_id) WHERE up.user_id = auth.uid() AND p.role = 'administrador' AND up.ativo = true));
DROP POLICY IF EXISTS "Contador can update empresas" ON empresa;
CREATE POLICY "Contador can update empresas" ON empresa FOR UPDATE TO public USING (EXISTS ( SELECT 1 FROM user_perfis up JOIN perfil p ON (p.id = up.perfil_id) WHERE up.user_id = auth.uid() AND p.role IN ('contador','administrador') AND up.ativo = true));
DROP POLICY IF EXISTS "Contador can view all empresas" ON empresa;
CREATE POLICY "Contador can view all empresas" ON empresa FOR SELECT TO public USING (EXISTS ( SELECT 1 FROM user_perfis up JOIN perfil p ON (p.id = up.perfil_id) WHERE up.user_id = auth.uid() AND p.role IN ('contador','administrador') AND up.ativo = true));
DROP POLICY IF EXISTS "Users can insert own empresa" ON empresa;
CREATE POLICY "Users can insert own empresa" ON empresa FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own empresa" ON empresa;
CREATE POLICY "Users can update own empresa" ON empresa FOR UPDATE TO public USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can view own empresa" ON empresa;
CREATE POLICY "Users can view own empresa" ON empresa FOR SELECT TO public USING (auth.uid() = user_id);

-- NFSE
DROP POLICY IF EXISTS "Admins can view all nfse" ON nfse;
CREATE POLICY "Admins can view all nfse" ON nfse FOR SELECT TO public USING (get_user_role(auth.uid()) = 'administrador');
DROP POLICY IF EXISTS "Users can insert their own nfse" ON nfse;
CREATE POLICY "Users can insert their own nfse" ON nfse FOR INSERT TO public WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can update their own nfse" ON nfse;
CREATE POLICY "Users can update their own nfse" ON nfse FOR UPDATE TO public USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can view their own nfse" ON nfse;
CREATE POLICY "Users can view their own nfse" ON nfse FOR SELECT TO public USING (user_id = auth.uid());

-- NOTIFICACAO
DROP POLICY IF EXISTS "Sistema pode inserir notificacoes" ON notificacao;
CREATE POLICY "Sistema pode inserir notificacoes" ON notificacao FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Usuarios podem atualizar suas notificacoes" ON notificacao;
CREATE POLICY "Usuarios podem atualizar suas notificacoes" ON notificacao FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Usuarios podem excluir suas notificacoes" ON notificacao;
CREATE POLICY "Usuarios podem excluir suas notificacoes" ON notificacao FOR DELETE TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Usuarios podem ver suas notificacoes" ON notificacao;
CREATE POLICY "Usuarios podem ver suas notificacoes" ON notificacao FOR SELECT TO authenticated USING (user_id = auth.uid());

-- PERFIL
DROP POLICY IF EXISTS "Todos podem ver perfis" ON perfil;
CREATE POLICY "Todos podem ver perfis" ON perfil FOR SELECT TO authenticated USING (ativo = true);

-- PLANOS
DROP POLICY IF EXISTS "Admin can delete planos" ON planos;
CREATE POLICY "Admin can delete planos" ON planos FOR DELETE TO authenticated USING (get_user_role(auth.uid()) = 'administrador');
DROP POLICY IF EXISTS "Admin can insert planos" ON planos;
CREATE POLICY "Admin can insert planos" ON planos FOR INSERT TO authenticated WITH CHECK (get_user_role(auth.uid()) = 'administrador');
DROP POLICY IF EXISTS "Admin can update planos" ON planos;
CREATE POLICY "Admin can update planos" ON planos FOR UPDATE TO authenticated USING (get_user_role(auth.uid()) = 'administrador');
DROP POLICY IF EXISTS "Admin can view all planos" ON planos;
CREATE POLICY "Admin can view all planos" ON planos FOR SELECT TO authenticated USING (get_user_role(auth.uid()) = 'administrador');
DROP POLICY IF EXISTS "Anyone can view active planos" ON planos;
CREATE POLICY "Anyone can view active planos" ON planos FOR SELECT TO authenticated USING (ativo = true);

-- SERVICOS
DROP POLICY IF EXISTS "Admin can delete servicos" ON servicos;
CREATE POLICY "Admin can delete servicos" ON servicos FOR DELETE TO authenticated USING (get_user_role(auth.uid()) = 'administrador');
DROP POLICY IF EXISTS "Admin can insert servicos" ON servicos;
CREATE POLICY "Admin can insert servicos" ON servicos FOR INSERT TO authenticated WITH CHECK (get_user_role(auth.uid()) = 'administrador');
DROP POLICY IF EXISTS "Admin can update servicos" ON servicos;
CREATE POLICY "Admin can update servicos" ON servicos FOR UPDATE TO authenticated USING (get_user_role(auth.uid()) = 'administrador');
DROP POLICY IF EXISTS "Admin can view all servicos" ON servicos;
CREATE POLICY "Admin can view all servicos" ON servicos FOR SELECT TO authenticated USING (get_user_role(auth.uid()) = 'administrador');
DROP POLICY IF EXISTS "Anyone can view active servicos" ON servicos;
CREATE POLICY "Anyone can view active servicos" ON servicos FOR SELECT TO authenticated USING (ativo = true);

-- TIPO_DOCUMENTOS
DROP POLICY IF EXISTS "Todos podem ver tipos de documentos" ON tipo_documentos;
CREATE POLICY "Todos podem ver tipos de documentos" ON tipo_documentos FOR SELECT TO authenticated USING (ativo = true);

-- USER_PERFIS
DROP POLICY IF EXISTS "Admins can update any user_perfis" ON user_perfis;
CREATE POLICY "Admins can update any user_perfis" ON user_perfis FOR UPDATE TO authenticated USING (get_user_role(auth.uid()) = 'administrador');
DROP POLICY IF EXISTS "Admins can view all user_perfis" ON user_perfis;
CREATE POLICY "Admins can view all user_perfis" ON user_perfis FOR SELECT TO authenticated USING (get_user_role(auth.uid()) = 'administrador');
DROP POLICY IF EXISTS "Users can view own perfis" ON user_perfis;
CREATE POLICY "Users can view own perfis" ON user_perfis FOR SELECT TO authenticated USING (auth.uid() = user_perfis.user_id);

-- TEMPLATES_ORCAMENTO
DROP POLICY IF EXISTS "Apenas admins podem atualizar templates" ON templates_orcamento;
CREATE POLICY "Apenas admins podem atualizar templates" ON templates_orcamento FOR UPDATE TO authenticated USING (EXISTS ( SELECT 1 FROM user_perfis WHERE user_perfis.user_id = auth.uid() AND user_perfis.perfil_id IN ( SELECT perfil.id FROM perfil WHERE perfil.role = 'administrador')));
DROP POLICY IF EXISTS "Apenas admins podem deletar templates" ON templates_orcamento;
CREATE POLICY "Apenas admins podem deletar templates" ON templates_orcamento FOR DELETE TO authenticated USING (EXISTS ( SELECT 1 FROM user_perfis WHERE user_perfis.user_id = auth.uid() AND user_perfis.perfil_id IN ( SELECT perfil.id FROM perfil WHERE perfil.role = 'administrador')));
DROP POLICY IF EXISTS "Apenas admins podem inserir templates" ON templates_orcamento;
CREATE POLICY "Apenas admins podem inserir templates" ON templates_orcamento FOR INSERT TO authenticated WITH CHECK (EXISTS ( SELECT 1 FROM user_perfis WHERE user_perfis.user_id = auth.uid() AND user_perfis.perfil_id IN ( SELECT perfil.id FROM perfil WHERE perfil.role = 'administrador')));
DROP POLICY IF EXISTS "Templates são públicos" ON templates_orcamento;
CREATE POLICY "Templates são públicos" ON templates_orcamento FOR SELECT TO public USING (ativo = true);

-- DOCUMENTOS
DROP POLICY IF EXISTS "Clientes podem atualizar seus documentos pendentes" ON documentos;
CREATE POLICY "Clientes podem atualizar seus documentos pendentes" ON documentos FOR UPDATE TO authenticated USING ((empresa_id IN ( SELECT empresa.id FROM empresa WHERE empresa.user_id = auth.uid())) AND (status = 'aguardando_aprovacao')) WITH CHECK (empresa_id IN ( SELECT empresa.id FROM empresa WHERE empresa.user_id = auth.uid()));
DROP POLICY IF EXISTS "Clientes podem excluir seus documentos pendentes" ON documentos;
CREATE POLICY "Clientes podem excluir seus documentos pendentes" ON documentos FOR DELETE TO authenticated USING ((empresa_id IN ( SELECT empresa.id FROM empresa WHERE empresa.user_id = auth.uid())) AND (status = 'aguardando_aprovacao'));
DROP POLICY IF EXISTS "Clientes podem inserir documentos" ON documentos;
CREATE POLICY "Clientes podem inserir documentos" ON documentos FOR INSERT TO authenticated WITH CHECK (empresa_id IN ( SELECT empresa.id FROM empresa WHERE empresa.user_id = auth.uid() AND empresa.status_cadastro <> 'inativo'));
DROP POLICY IF EXISTS "Clientes podem ver seus documentos" ON documentos;
CREATE POLICY "Clientes podem ver seus documentos" ON documentos FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT empresa.id FROM empresa WHERE empresa.user_id = auth.uid())) OR (EXISTS ( SELECT 1 FROM user_perfis up JOIN perfil p ON (p.id = up.perfil_id) WHERE up.user_id = auth.uid() AND p.role IN ('contador','administrador'))));
DROP POLICY IF EXISTS "Contador and Admin can update documents" ON documentos;
CREATE POLICY "Contador and Admin can update documents" ON documentos FOR UPDATE TO public USING (EXISTS ( SELECT 1 FROM user_perfis up JOIN perfil p ON (p.id = up.perfil_id) WHERE up.user_id = auth.uid() AND p.role IN ('contador','administrador') AND up.ativo = true));
DROP POLICY IF EXISTS "Contador and Admin can view all documents" ON documentos;
CREATE POLICY "Contador and Admin can view all documents" ON documentos FOR SELECT TO public USING (EXISTS ( SELECT 1 FROM user_perfis up JOIN perfil p ON (p.id = up.perfil_id) WHERE up.user_id = auth.uid() AND p.role IN ('contador','administrador') AND up.ativo = true));
DROP POLICY IF EXISTS "Contadores podem atualizar documentos" ON documentos;
CREATE POLICY "Contadores podem atualizar documentos" ON documentos FOR UPDATE TO authenticated USING (EXISTS ( SELECT 1 FROM user_perfis up JOIN perfil p ON (p.id = up.perfil_id) WHERE up.user_id = auth.uid() AND p.role IN ('contador','administrador')) ) WITH CHECK (EXISTS ( SELECT 1 FROM user_perfis up JOIN perfil p ON (p.id = up.perfil_id) WHERE up.user_id = auth.uid() AND p.role IN ('contador','administrador')) );
DROP POLICY IF EXISTS "Users can insert documents for own empresas" ON documentos;
CREATE POLICY "Users can insert documents for own empresas" ON documentos FOR INSERT TO public WITH CHECK (EXISTS ( SELECT 1 FROM empresa WHERE empresa.id = documentos.empresa_id AND empresa.user_id = auth.uid()));
DROP POLICY IF EXISTS "Users can view own documents" ON documentos;
CREATE POLICY "Users can view own documents" ON documentos FOR SELECT TO public USING (EXISTS ( SELECT 1 FROM empresa WHERE empresa.id = documentos.empresa_id AND empresa.user_id = auth.uid()));

-- STORAGE/OBJECTS
DROP POLICY IF EXISTS "Admins can view all certificates" ON storage.objects;
CREATE POLICY "Admins can view all certificates" ON storage.objects FOR SELECT TO authenticated USING ((bucket_id = 'certificados') AND (get_user_role(auth.uid()) = 'administrador'));
DROP POLICY IF EXISTS "Authenticated users can delete certificates" ON storage.objects;
CREATE POLICY "Authenticated users can delete certificates" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'certificados');
DROP POLICY IF EXISTS "Authenticated users can update certificates" ON storage.objects;
CREATE POLICY "Authenticated users can update certificates" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'certificados') WITH CHECK (bucket_id = 'certificados');
DROP POLICY IF EXISTS "Authenticated users can upload certificates" ON storage.objects;
CREATE POLICY "Authenticated users can upload certificates" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'certificados');
DROP POLICY IF EXISTS "Authenticated users can view certificates" ON storage.objects;
CREATE POLICY "Authenticated users can view certificates" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'certificados');
DROP POLICY IF EXISTS "Clientes podem atualizar documentos pendentes" ON storage.objects;
CREATE POLICY "Clientes podem atualizar documentos pendentes" ON storage.objects FOR UPDATE TO authenticated USING ((bucket_id = 'doc_cus') AND ((storage.foldername(name))[1] IN (SELECT id::text FROM empresa)) AND (EXISTS (SELECT 1 FROM documentos d WHERE d.caminho_storage = storage.objects.name AND d.status = 'aguardando_aprovacao')));
DROP POLICY IF EXISTS "Clientes podem excluir documentos pendentes" ON storage.objects;
CREATE POLICY "Clientes podem excluir documentos pendentes" ON storage.objects FOR DELETE TO authenticated USING ((bucket_id = 'doc_cus') AND ((storage.foldername(name))[1] IN (SELECT id::text FROM empresa)) AND (EXISTS (SELECT 1 FROM documentos d WHERE d.caminho_storage = storage.objects.name AND d.status = 'aguardando_aprovacao')));
DROP POLICY IF EXISTS "Clientes podem fazer upload em suas empresas" ON storage.objects;
CREATE POLICY "Clientes podem fazer upload em suas empresas" ON storage.objects FOR INSERT TO authenticated WITH CHECK ((bucket_id = 'doc_cus') AND ((storage.foldername(name))[1] IN (SELECT id::text FROM empresa WHERE status_cadastro <> 'inativo')));
DROP POLICY IF EXISTS "Ver documentos das próprias empresas" ON storage.objects;
CREATE POLICY "Ver documentos das próprias empresas" ON storage.objects FOR SELECT TO authenticated USING ((bucket_id = 'doc_cus') AND (((storage.foldername(name))[1] IN (SELECT id::text FROM empresa)) OR (EXISTS (SELECT 1 FROM user_perfis up JOIN perfil p ON (p.id = up.perfil_id) WHERE p.role = 'contador')) OR (EXISTS (SELECT 1 FROM user_perfis up JOIN perfil p ON (p.id = up.perfil_id) WHERE p.role = 'administrador'))));
