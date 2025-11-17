# Migração da Tabela NFSe

## Objetivo

Dividir a tabela `nfse` original em duas tabelas especializadas:
1. **certificados_digitais** - Para armazenar certificados digitais e senhas
2. **nfse** - Para armazenar apenas informações das notas fiscais

## Motivação

A tabela original misturava dois conceitos diferentes:
- **Certificados digitais**: São configurações permanentes da empresa (1 certificado por empresa)
- **Notas fiscais**: São documentos que podem ser emitidos em grande quantidade

Esta separação traz os seguintes benefícios:
- ✅ Melhor organização dos dados
- ✅ Evita duplicação de certificados em cada nota
- ✅ Facilita gerenciamento de certificados (renovação, validade)
- ✅ Permite múltiplas notas usando o mesmo certificado
- ✅ Estrutura mais clara e normalizada

## Estrutura das Novas Tabelas

### Tabela: certificados_digitais

```sql
CREATE TABLE certificados_digitais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  certificado_url TEXT NOT NULL,              -- URL do arquivo no storage
  certificado_senha TEXT NOT NULL,            -- Senha (deve ser criptografada)
  data_validade DATE,                         -- Validade do certificado
  ativo BOOLEAN DEFAULT true,                 -- Se está ativo
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(empresa_id)                          -- 1 certificado por empresa
);
```

**Características:**
- Uma empresa tem apenas UM certificado ativo por vez (constraint UNIQUE)
- Armazena URL do arquivo do certificado e senha
- Controle de validade e status ativo
- Relacionado com empresa e usuário

### Tabela: nfse

```sql
CREATE TABLE nfse (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- RPS (Recibo Provisório de Serviços)
  numero_rps VARCHAR(50),
  serie_rps VARCHAR(10),
  data_emissao DATE DEFAULT CURRENT_DATE,
  data_competencia DATE NOT NULL,
  
  -- Informações do Tomador (Cliente da NFSe)
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
  status VARCHAR(50) DEFAULT 'pendente',
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
```

**Características:**
- Focada APENAS nas informações da nota fiscal
- Campos completos do tomador (cliente)
- Valores detalhados (ISS, PIS, COFINS, etc.)
- Status da nota (pendente, processando, emitida, cancelada, erro)
- URLs para XML e PDF gerados
- Não armazena mais dados do certificado

## Como Executar a Migração

### Passo 1: Backup (Segurança)
O script já cria automaticamente um backup da tabela original:
```sql
CREATE TABLE nfse_backup AS SELECT * FROM nfse;
```

### Passo 2: Executar o Script de Migração
No Supabase SQL Editor, execute o arquivo:
```
database/dividir_tabela_nfse.sql
```

Este script irá:
1. ✅ Criar tabela `certificados_digitais`
2. ✅ Migrar certificados existentes da tabela antiga
3. ✅ Criar backup `nfse_backup`
4. ✅ Recriar tabela `nfse` com nova estrutura
5. ✅ Migrar notas fiscais existentes
6. ✅ Criar índices para performance
7. ✅ Adicionar triggers de updated_at
8. ✅ Configurar RLS (Row Level Security)

### Passo 3: Configurar Storage para Certificados
Execute o arquivo:
```
database/setup_storage_certificados.sql
```

Este script irá:
1. ✅ Criar bucket `certificados` (privado)
2. ✅ Configurar políticas de upload/download
3. ✅ Restringir acesso apenas aos donos dos certificados
4. ✅ Permitir administradores visualizarem todos

**Importante:** O bucket é PRIVADO e requer autenticação para acessar os arquivos.

### Passo 4: Verificar os Dados
Após executar, verifique se os dados foram migrados:
```sql
-- Ver total de registros
SELECT COUNT(*) as total_nfse FROM nfse;
SELECT COUNT(*) as total_certificados FROM certificados_digitais;
SELECT COUNT(*) as total_backup FROM nfse_backup;

-- Ver certificados migrados
SELECT 
  cd.id,
  e.razao_social,
  cd.data_validade,
  cd.ativo
FROM certificados_digitais cd
JOIN empresa e ON e.id = cd.empresa_id;

-- Ver notas fiscais migradas
SELECT 
  n.id,
  e.razao_social,
  n.tomador_nome,
  n.valor_servicos,
  n.status
FROM nfse n
JOIN empresa e ON e.id = n.empresa_id;
```

### Passo 4: Atualizar Código da Aplicação
Os types já foram atualizados em:
- ✅ `src/types/database.types.ts` - Novas interfaces TypeScript
- ✅ `database/criar_tabelas.sql` - Schema atualizado

## Uso nas Páginas

### Para Gerenciar Certificados Digitais
```typescript
// Buscar certificado da empresa
const { data: certificado } = await supabase
  .from('certificados_digitais')
  .select('*')
  .eq('empresa_id', empresaId)
  .eq('ativo', true)
  .single();

// Upload de novo certificado
const { data, error } = await supabase
  .from('certificados_digitais')
  .insert({
    empresa_id: empresaId,
    user_id: userId,
    certificado_url: urlDoArquivo,
    certificado_senha: senhaCriptografada,
    data_validade: '2025-12-31',
    ativo: true
  });
```

### Para Emitir NFSe
```typescript
// Criar nova nota fiscal
const { data, error } = await supabase
  .from('nfse')
  .insert({
    empresa_id: empresaId,
    user_id: userId,
    data_competencia: '2024-11-16',
    tomador_cpf_cnpj: '12345678901',
    tomador_nome: 'Cliente Exemplo',
    tomador_email: 'cliente@exemplo.com',
    descricao_servicos: 'Consultoria em TI',
    valor_servicos: 1500.00,
    status: 'pendente'
  });

// Buscar notas da empresa
const { data: notas } = await supabase
  .from('nfse')
  .select('*, empresa(*)')
  .eq('empresa_id', empresaId)
  .order('created_at', { ascending: false });
```

## RLS (Row Level Security)

As políticas garantem que:
- ✅ Usuários veem apenas seus próprios certificados e notas
- ✅ Administradores veem todos os registros
- ✅ Proteção contra acesso não autorizado

```sql
-- Exemplo de política para nfse
CREATE POLICY "Users can view their own nfse"
  ON nfse FOR SELECT
  USING (user_id = auth.uid());
```

## Rollback (Se Necessário)

Se precisar voltar atrás:
```sql
-- Restaurar tabela original do backup
DROP TABLE IF EXISTS nfse CASCADE;
DROP TABLE IF EXISTS certificados_digitais CASCADE;

ALTER TABLE nfse_backup RENAME TO nfse;
```

## Próximos Passos

1. ✅ Executar `dividir_tabela_nfse.sql` no Supabase
2. ✅ Executar `setup_storage_certificados.sql` no Supabase
3. ✅ Verificar migração dos dados
4. ✅ Testar upload de certificado na página NFSe
5. ✅ Testar solicitação de emissão de NFSe
6. 🔄 Implementar integração com prefeituras (API)
7. 🔄 Adicionar criptografia para senhas dos certificados
8. 🔄 Criar área administrativa para processar solicitações

## Página de Emissão de NFSe

A página `/nfse` foi criada na área do cliente com os seguintes recursos:

### Características:
- ✅ **Cards colapsáveis** por empresa cadastrada
- ✅ **Seção de Certificado Digital**: Upload de arquivo .pfx/.p12 e senha
- ✅ **Seção de Emissão**: Formulário completo para criar solicitação
- ✅ **Disclaimer provisório**: Informa que será processado por analista em 3 dias úteis
- ✅ **Termos de uso**: Checkbox obrigatório antes de solicitar
- ✅ **Histórico**: Lista de NFSes solicitadas por empresa
- ✅ **Status badges**: Visual claro do status de cada solicitação

### Fluxo de Uso:
1. Cliente acessa `/nfse`
2. Expande o card da empresa
3. Configura certificado digital (upload + senha)
4. Preenche formulário de emissão
5. Aceita os termos de uso
6. Clica em "Solicitar Emissão"
7. Solicitação fica com status "pendente"
8. Analista processa manualmente
9. Status muda para "emitida" ou "erro"
10. PDF disponível para download

## Observações Importantes

⚠️ **SEGURANÇA**: A senha do certificado deve ser criptografada ANTES de salvar no banco. Não armazene senhas em texto plano!

⚠️ **VALIDAÇÃO**: O certificado tem data de validade. Implemente validação para avisar quando estiver próximo do vencimento.

⚠️ **UNIQUE CONSTRAINT**: Uma empresa só pode ter UM certificado ativo. Para renovar, desative o antigo e crie um novo.

## Suporte

Se tiver problemas na migração, verifique:
1. Se a função `get_user_role()` existe (necessária para RLS)
2. Se as tabelas `empresa` e `auth.users` existem
3. Se tem permissões para criar tabelas e policies
4. Os logs de erro no Supabase SQL Editor
