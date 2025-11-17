# Configuração da API de Consulta CNPJ

## Visão Geral

A aplicação TopMEI Hub utiliza a API pública **Open CNPJA** para consultar dados cadastrais de empresas na Receita Federal através do CNPJ.

## API Utilizada: Open CNPJA

**URL:** https://open.cnpja.com

✅ **Totalmente GRATUITA**  
✅ **Não requer autenticação**  
✅ **Sem limite de requisições**  
✅ **Dados atualizados da Receita Federal**

### Exemplo de Uso

```bash
curl --request GET --url 'https://open.cnpja.com/office/07526557011659'
```

### Como Funciona

A aplicação já está **100% configurada** e pronta para uso! Não é necessário:
- ❌ Criar conta
- ❌ Obter API Key
- ❌ Configurar autenticação
- ❌ Pagar mensalidade

### Endpoint

```
GET https://open.cnpja.com/office/{CNPJ}
```

**Parâmetros:**
- `{CNPJ}`: CNPJ com 14 dígitos (apenas números)

### Estrutura da Resposta JSON

A API retorna um JSON completo com todos os dados cadastrais:

```json
{
  "taxId": "00000000000000",
  "alias": "Nome Fantasia",
  "founded": "2023-01-01",
  "company": {
    "name": "RAZÃO SOCIAL LTDA",
    "nature": { "text": "Sociedade Empresária Limitada" }
  },
  "address": {
    "street": "Rua Exemplo",
    "number": "123",
    "district": "Centro",
    "city": "São Paulo",
    "state": "SP",
    "zip": "01000000"
  },
  "mainActivity": {
    "id": 1234567,
    "text": "Descrição da atividade principal"
  },
  "sideActivities": [
    { "id": 7654321, "text": "Atividade secundária" }
  ],
  "phones": [
    { "area": "11", "number": "912345678" }
  ],
  "emails": [
    { "address": "contato@empresa.com.br" }
  ],
  "registrations": [
    {
      "number": "123456789",
      "state": "SP",
      "type": { "text": "IE Normal" }
    }
  ]
}
```

## Código Implementado

A consulta está no arquivo `src/pages/EmpresaPage.tsx`:

```typescript
const consultarCNPJ = async () => {
  const cnpjLimpo = limparCNPJ(cnpjConsulta)
  
  if (cnpjLimpo.length !== 14) {
    setErrorConsulta('CNPJ deve conter 14 dígitos')
    return
  }

  setLoadingConsulta(true)
  setErrorConsulta('')
  setDadosReceita(null)

  try {
    // API pública CNPJA - não requer autenticação
    const response = await fetch(`https://open.cnpja.com/office/${cnpjLimpo}`)

    if (!response.ok) {
      throw new Error('CNPJ não encontrado ou erro na consulta')
    }

    const data: ReceitaData = await response.json()
    setDadosReceita(data)
    setShowCadastroForm(true)
  } catch (error) {
    setErrorConsulta('Erro ao consultar CNPJ. Verifique o número e tente novamente.')
    console.error('Erro na consulta:', error)
  } finally {
    setLoadingConsulta(false)
  }
}
```

## Alternativas de APIs (caso necessário)

### 1. ReceitaWS (Alternativa)

**Gratuita** - Limite de requisições

```typescript
const response = await fetch(`https://receitaws.com.br/v1/cnpj/${cnpjLimpo}`)
```

⚠️ **Atenção**: A ReceitaWS tem estrutura de resposta diferente. Será necessário adaptar o código.

### 2. BrasilAPI (Alternativa)

**Gratuita** - Sem autenticação

```typescript
const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`)
```

⚠️ **Atenção**: Também possui estrutura diferente.

## Funcionalidades Implementadas

### 1. Campo de CNPJ com Máscara
- Aceita apenas números
- Remove automaticamente espaços e caracteres especiais
- Formata visualmente: `00.000.000/0000-00`

### 2. Botão "Consulta Cadastral"
- Valida CNPJ (14 dígitos)
- Exibe loading durante consulta
- Mostra erro se CNPJ inválido

### 3. Preenchimento Automático
- **Campos bloqueados** (vindos da API):
  - CNPJ, Razão Social, Data de Abertura
  - Endereço completo
  - CNAE Principal
  - Natureza Jurídica
  
- **Campos editáveis** (quando vazios):
  - Nome Fantasia (se não vier da API)
  - Complemento (se não vier da API)
  - Telefone (se não vier da API)
  - Email (se não vier da API)

### 4. Cards de Dados Agrupados

#### Card: Dados da Empresa
- CNPJ, Razão Social, Nome Fantasia
- Data de Abertura, Natureza Jurídica, CNAE

#### Card: Endereço
- Logradouro, Número, Complemento
- Bairro, Cidade, UF, CEP

#### Card: Contato
- Telefone, Email

#### Card: CNAEs Secundários
- Lista de todas as atividades secundárias

#### Card: Inscrições Estaduais
- Número, UF, Tipo de inscrição

## Salvamento no Banco

Ao clicar em "Salvar Empresa", os dados são gravados em 3 tabelas:

1. **`empresa`**: Dados principais
2. **`inscricoes`**: Inscrições estaduais (se houver)
3. **`cnaes_secundarios`**: CNAEs secundários (se houver)

## Tratamento de Erros

- CNPJ com menos de 14 dígitos
- CNPJ não encontrado na Receita
- Erro de conexão com API
- Erro ao salvar no banco

## Próximos Passos

- [ ] Adicionar validação de dígitos verificadores do CNPJ
- [ ] Implementar cache de consultas
- [ ] Adicionar histórico de consultas
- [ ] Permitir edição de dados após cadastro
