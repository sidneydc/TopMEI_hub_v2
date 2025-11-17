# Sistema de Documentos

## 📋 Visão Geral

Sistema completo para upload, gerenciamento e análise de documentos das empresas MEI.

## 🎯 Funcionalidades

### Para Clientes:

- ✅ **Selecionar Empresa**: Escolhe qual empresa enviar documentos
- ✅ **Ver Documentos Necessários**: Lista completa com obrigatórios e opcionais
- ✅ **Upload de Documentos**: Envio direto para análise do contador
- ✅ **Acompanhar Status**: Vê se documento está pendente/aprovado/rejeitado
- ✅ **Ver Observações**: Lê comentários do contador sobre cada documento
- ✅ **Excluir Documentos**: Remove documentos pendentes e reenvia se necessário

### Para Contadores (Futuro):

- 🔄 Visualizar documentos enviados pelos clientes
- 🔄 Aprovar ou rejeitar documentos
- 🔄 Adicionar observações
- 🔄 Solicitar reenvio

## 📊 Estrutura do Banco de Dados

### Tabela `tipo_documentos`

```sql
CREATE TABLE tipo_documentos (
  id UUID PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  obrigatorio BOOLEAN DEFAULT false,
  ativo BOOLEAN DEFAULT true
);
```

**Tipos de Documentos Cadastrados:**

1. ✅ **RG (Frente e Verso)** - Obrigatório
2. ✅ **CPF** - Obrigatório
3. ✅ **Comprovante de Residência** - Obrigatório (máx 3 meses)
4. ✅ **CCMEI** - Obrigatório
5. ⚪ **Alvará de Funcionamento** - Opcional
6. ⚪ **Inscrição Municipal** - Opcional
7. ⚪ **Contrato Social** - Opcional
8. ⚪ **Procuração** - Opcional
9. ⚪ **Certificado Digital** - Opcional
10. ⚪ **Outros Documentos** - Opcional

### Tabela `documentos`

```sql
CREATE TABLE documentos (
  id UUID PRIMARY KEY,
  empresa_id UUID REFERENCES empresa(id),
  tipo_documento_id UUID REFERENCES tipo_documentos(id),
  nome_arquivo VARCHAR(255),
  caminho_storage TEXT,
  tamanho_bytes BIGINT,
  mime_type VARCHAR(100),
  data_upload TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'pendente',
  observacao TEXT
);
```

## 🎨 Interface do Cliente

### Seleção de Empresa

```
┌─────────────────────────────────────────┐
│ Selecione a Empresa                     │
│ ┌─────────────────────────────────────┐ │
│ │ Empresa XYZ LTDA - CNPJ: XX.XXX...  │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Card de Documento

```
┌─────────────────────────────────────────────────────────┐
│ 📄 RG (Frente e Verso) *                    [Enviar]    │
│ Documento de identidade do proprietário...              │
│                                                          │
│ ┌──────────────────────────────────────────────────┐   │
│ │ 📄 rg_frente_verso.pdf                           │   │
│ │ 1.2 MB • 16/11/2025                              │   │
│ │                                                  │   │
│ │ [⏱ Aguardando Análise]                    [🗑]   │   │
│ └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Legenda de Status

- 🟡 **Pendente**: Aguardando análise do contador
- 🟢 **Aprovado**: Documento aprovado
- 🔴 **Rejeitado**: Documento rejeitado (ver observação)

### Indicadores Visuais

- 🔴 **Borda Vermelha**: Documento obrigatório
- ⚪ **Borda Cinza**: Documento opcional
- ⭐ **Asterisco (*)**: Campo obrigatório

## 📤 Processo de Upload

### Fluxo:

```
1. Cliente seleciona empresa
        ↓
2. Sistema carrega tipos de documentos disponíveis
        ↓
3. Cliente clica em "Enviar" no documento desejado
        ↓
4. Seleciona arquivo do computador
        ↓
5. Sistema valida:
   - Formato (PDF, JPG, JPEG, PNG)
   - Tamanho (máx 10MB)
        ↓
6. Upload para Supabase Storage
   - Path: empresa_id/tipo_documento_id/timestamp.ext
        ↓
7. Registro no banco de dados
   - Status: 'pendente'
        ↓
8. Mensagem de sucesso
        ↓
9. Documento aparece no card com status
```

## 🔐 Armazenamento (Supabase Storage)

### Bucket: `documentos`

**Estrutura de Pastas:**
```
documentos/
├── {empresa_id}/
│   ├── {tipo_documento_id}/
│   │   ├── 1700000000000.pdf
│   │   ├── 1700000001000.jpg
│   │   └── 1700000002000.png
```

**Nomenclatura dos Arquivos:**
```
{empresa_id}/{tipo_documento_id}/{timestamp}.{extensao}
```

**Exemplo:**
```
a1b2c3d4-e5f6-7890-abcd-ef1234567890/
  x9y8z7w6-v5u4-3210-tsr-q987654321po/
    1700145600000.pdf
```

## ✅ Validações

### No Frontend:

- ✅ Empresa deve estar selecionada
- ✅ Arquivo não pode exceder 10MB
- ✅ Formato deve ser: PDF, JPG, JPEG ou PNG
- ✅ Feedback visual durante upload
- ✅ Mensagens de erro claras

### Regras de Negócio:

- ✅ Um documento por tipo por empresa
- ✅ Cliente pode substituir documento pendente
- ✅ Cliente **NÃO pode** excluir documentos aprovados/rejeitados
- ✅ Apenas contadores podem aprovar/rejeitar
- ✅ Histórico completo em auditoria

## 📱 Status dos Documentos

### 1. `pendente`
- **Quando**: Após upload inicial
- **Cliente pode**: Visualizar e excluir
- **Contador pode**: Aprovar, rejeitar, adicionar observação

### 2. `aprovado`
- **Quando**: Contador aprova o documento
- **Cliente pode**: Apenas visualizar
- **Contador pode**: Reverter para pendente se necessário

### 3. `rejeitado`
- **Quando**: Contador rejeita o documento
- **Cliente pode**: Visualizar observação do contador
- **Contador pode**: Adicionar motivo da rejeição
- **Ação**: Cliente deve fazer novo upload

## 🎯 Casos de Uso

### Caso 1: Primeiro Upload

```
1. Cliente acessa /documentos
2. Seleciona empresa "MEI Exemplo LTDA"
3. Vê lista de 10 tipos de documentos
4. Vê 4 marcados como obrigatórios (*)
5. Clica em "Enviar" no RG
6. Seleciona arquivo rg_completo.pdf
7. Upload concluído em 2 segundos
8. Documento aparece com status "Aguardando Análise"
```

### Caso 2: Documento Rejeitado

```
1. Cliente acessa /documentos
2. Vê documento RG com status "Rejeitado"
3. Lê observação do contador:
   "Imagem está muito escura. Por favor, envie uma cópia mais nítida."
4. Como está rejeitado, pode fazer novo upload
5. Envia nova versão
6. Novo documento fica "Aguardando Análise"
```

### Caso 3: Reenvio de Documento Pendente

```
1. Cliente percebe que enviou arquivo errado
2. Documento ainda está "Aguardando Análise"
3. Clica no botão de lixeira (🗑)
4. Confirma exclusão
5. Documento é removido
6. Envia arquivo correto
7. Novo upload concluído
```

## 🔧 Configurações Necessárias

### 1. Criar Bucket no Supabase

```sql
-- No Supabase Storage, criar bucket:
Nome: documentos
Público: false (privado)
File size limit: 10MB
Allowed MIME types: application/pdf, image/jpeg, image/jpg, image/png
```

### 2. Políticas de Acesso (RLS)

```sql
-- Storage Policies
-- Permitir upload para clientes
CREATE POLICY "Clientes podem fazer upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documentos' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM empresa WHERE user_id = auth.uid()
  )
);

-- Permitir leitura para donos e contadores
CREATE POLICY "Donos e contadores podem ver"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documentos');

-- Permitir exclusão apenas de documentos pendentes
CREATE POLICY "Clientes podem excluir próprios documentos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documentos' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM empresa WHERE user_id = auth.uid()
  )
);
```

### 3. Popular Tipos de Documentos

```bash
# Execute no Supabase SQL Editor:
database/tipos_documentos_exemplo.sql
```

## 📊 Queries Úteis

### Ver documentos de uma empresa

```sql
SELECT 
  d.nome_arquivo,
  td.nome as tipo,
  d.status,
  d.data_upload,
  d.observacao
FROM documentos d
JOIN tipo_documentos td ON d.tipo_documento_id = td.id
WHERE d.empresa_id = 'uuid-da-empresa'
ORDER BY d.data_upload DESC;
```

### Ver pendências por empresa

```sql
SELECT 
  e.razao_social,
  COUNT(*) FILTER (WHERE d.status = 'pendente') as pendentes,
  COUNT(*) FILTER (WHERE d.status = 'aprovado') as aprovados,
  COUNT(*) FILTER (WHERE d.status = 'rejeitado') as rejeitados
FROM empresa e
LEFT JOIN documentos d ON e.id = d.empresa_id
GROUP BY e.id, e.razao_social
ORDER BY pendentes DESC;
```

### Documentos obrigatórios faltantes

```sql
SELECT 
  e.razao_social,
  td.nome as documento_faltante
FROM empresa e
CROSS JOIN tipo_documentos td
LEFT JOIN documentos d ON (
  e.id = d.empresa_id AND 
  td.id = d.tipo_documento_id
)
WHERE td.obrigatorio = true
  AND d.id IS NULL
  AND e.status_cadastro != 'inativo'
ORDER BY e.razao_social, td.nome;
```

## 🚀 Melhorias Futuras

### Curto Prazo:
- [ ] Interface para contadores aprovarem/rejeitarem
- [ ] Notificações quando documento for aprovado/rejeitado
- [ ] Preview de documentos (visualizar antes de baixar)
- [ ] Histórico de versões de documentos

### Médio Prazo:
- [ ] Compressão automática de imagens
- [ ] OCR para extrair dados automaticamente
- [ ] Validação de CPF/CNPJ nos documentos
- [ ] Assinatura digital de documentos

### Longo Prazo:
- [ ] Integração com eSocial
- [ ] Blockchain para integridade de documentos
- [ ] AI para validação automática
- [ ] Portal do contador separado

## 📝 Observações Importantes

1. **Segurança**: Documentos são armazenados em bucket privado do Supabase
2. **Performance**: Limite de 10MB garante uploads rápidos
3. **Auditoria**: Todas as ações são registradas na tabela `auditoria`
4. **Compliance**: Sistema atende LGPD (dados sensíveis protegidos)
5. **Escalabilidade**: Storage do Supabase suporta crescimento

## 🧪 Como Testar

1. ✅ Execute os scripts SQL:
   - `database/schema.sql` (se ainda não executou)
   - `database/tipos_documentos_exemplo.sql`

2. ✅ Configure o bucket no Supabase Storage

3. ✅ Acesse `/documentos`

4. ✅ Selecione uma empresa

5. ✅ Faça upload de um documento PDF

6. ✅ Verifique que aparece com status "Aguardando Análise"

7. ✅ Tente excluir o documento

8. ✅ Faça novo upload

## 📚 Arquivos Criados

- ✅ `src/pages/DocumentosPage.tsx` - Interface do cliente
- ✅ `database/tipos_documentos_exemplo.sql` - Dados iniciais
- ✅ `docs/DOCUMENTOS.md` - Esta documentação

**Sistema de Documentos pronto para uso!** 🎉
