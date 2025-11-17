# Mapeamento Completo: API → Banco de Dados

## ✅ Implementação Completa

### 📋 Tabelas Populadas

#### 1. **Tabela: `empresa`** (Registro Principal)

| Campo BD | Origem | Status | Observação |
|----------|--------|--------|------------|
| `user_id` | Sistema | ✅ Auto | ID do usuário logado |
| `cnpj` | API: `taxId` | ✅ API | Removido formatação |
| `razao_social` | API: `company.name` | ✅ API | Campo bloqueado |
| `nome_fantasia` | API: `alias` | ✅ API | Bloqueado se vier da API |
| `nome_proprietario` | **MANUAL** | ✅ Form | Campo obrigatório |
| `cpf_proprietario` | **MANUAL** | ✅ Form | Campo obrigatório (11 dígitos) |
| `data_nascimento` | **MANUAL** | ✅ Form | Campo obrigatório |
| `data_abertura` | API: `founded` | ✅ API | Campo bloqueado |
| `optante_simei` | API: `company.simei.optant` | ✅ API | Boolean |
| `data_opcao_simei` | API: `founded` (se optante) | ✅ API | Data da opção pelo SIMEI |
| `cnae_principal` | API: `mainActivity.id` | ✅ API | Código numérico |
| `descricao_cnae_principal` | API: `mainActivity.text` | ✅ API | Descrição completa |
| `status_cnpj` | Sistema | ✅ Auto | Definido como 'ativo' |
| `cep` | API: `address.zip` | ✅ API | Removido formatação |
| `rua` | API: `address.street` | ✅ API | Campo bloqueado |
| `numero` | API: `address.number` | ✅ API | Campo bloqueado |
| `complemento` | API: `address.details` | ✅ API | Editável se vazio |
| `bairro` | API: `address.district` | ✅ API | Campo bloqueado |
| `cidade` | API: `address.city` | ✅ API | Campo bloqueado |
| `estado` | API: `address.state` | ✅ API | UF (2 letras) |
| `telefone_ddd` | API: `phones[0].area` | ✅ API | Editável se vazio |
| `telefone_numero` | API: `phones[0].number` | ✅ API | Editável se vazio |
| `email` | API: `emails[0].address` | ✅ API | Editável se vazio |
| `observacoes` | - | ❌ | Não implementado |
| `regime_tributario` | - | ❌ | Não disponível na API |
| `status_cadastro` | Sistema | ✅ Auto | Fixo: 'aprovado' |

#### 2. **Tabela: `cnaes_secundarios`** (Múltiplos registros)

| Campo BD | Origem | Status |
|----------|--------|--------|
| `empresa_id` | Sistema | ✅ Auto |
| `cnae_num` | API: `sideActivities[].id` | ✅ API |
| `cnae_descricao` | API: `sideActivities[].text` | ✅ API |
| `ativo` | Sistema | ✅ Auto (true) |

**Quantidade:** 1 registro para cada CNAE secundário

#### 3. **Tabela: `inscricoes`** (Múltiplos registros)

| Campo BD | Origem | Status |
|----------|--------|--------|
| `empresa_id` | Sistema | ✅ Auto |
| `tipo` | API: `registrations[].type.text` | ✅ API |
| `numero` | API: `registrations[].number` | ✅ API |
| `estado` | API: `registrations[].state` | ✅ API |
| `cidade` | - | ❌ | Não disponível na API |
| `ativa` | API: `registrations[].enabled` | ✅ API |

**Quantidade:** 1 registro para cada inscrição estadual

---

## 🎨 Interface do Usuário

### Cards Implementados:

1. **Card: Dados da Empresa** (fundo cinza)
   - CNPJ, Razão Social (bloqueados)
   - Nome Fantasia, Data de Abertura (bloqueados)

2. **Card: Dados do Proprietário** (fundo azul, destaque)
   - ⚠️ Alert informativo
   - Nome Completo (obrigatório)
   - CPF (obrigatório, máscara)
   - Data de Nascimento (obrigatório)

3. **Card: Informações Adicionais** (fundo cinza)
   - Natureza Jurídica (bloqueado)
   - Optante SIMEI (bloqueado)
   - CNAE Principal (bloqueado)

4. **Card: Endereço** (fundo cinza)
   - Todos os campos bloqueados
   - Complemento editável se vazio

5. **Card: Contato** (fundo cinza)
   - Telefone e Email editáveis se vazios

6. **Card: CNAEs Secundários** (condicional)
   - Lista de atividades secundárias
   - Formato: código + descrição

7. **Card: Inscrições Estaduais** (condicional)
   - Lista de IEs por estado
   - Número, UF, Tipo

8. **Card: Resumo do Cadastro** (gradiente verde/azul)
   - ✓ Empresa (1 registro)
   - Nº CNAEs secundários
   - Nº Inscrições estaduais
   - Alertas se não houver dados

---

## 🔒 Validações Implementadas

### Antes de Consultar:
- CNPJ com 14 dígitos

### Antes de Salvar:
- Nome do proprietário não vazio
- CPF com 11 dígitos
- Data de nascimento preenchida

---

## 🔄 Fluxo de Salvamento

```
1. Validar campos obrigatórios
2. Inserir registro na tabela "empresa" → retorna empresa_id
3. Se houver CNAEs secundários:
   - Inserir N registros em "cnaes_secundarios"
4. Se houver Inscrições Estaduais:
   - Inserir N registros em "inscricoes"
5. Recarregar página (window.location.reload())
```

---

## 📊 Exemplo de Dados Salvos

### Empresa: AMBEV S.A. (CNPJ: 07.526.557/0116-59)

**Tabela empresa:**
- 1 registro completo

**Tabela cnaes_secundarios:**
- 1 registro: "1122401 - Fabricação de refrigerantes"

**Tabela inscricoes:**
- 4 registros:
  - IE 054591406 (AM)
  - IE 240519525 (RR) - Substituto Tributário
  - IE 159195853 (PA) - Substituto Tributário
  - IE 0108826400193 (AC) - Substituto Tributário

**Total:** 6 registros em 3 tabelas

---

## ⚠️ Campos Não Disponíveis na API

Estes campos existem no BD mas não são preenchidos automaticamente:

### Tabela `empresa`:
- `data_opcao_simei`
- `status_cnpj`
- `observacoes`
- `regime_tributario`
- `motivo_rejeicao`
- `criado_por`
- `aprovado_por`
- `data_aprovacao`
- `natureza_juridica` (existe no JSON mas não foi mapeada)

### Tabela `inscricoes`:
- `cidade`

---

## 🎯 Próximos Passos Sugeridos

1. ✅ Adicionar campo `natureza_juridica` no salvamento
2. ⚠️ Considerar adicionar campos editáveis opcionais:
   - Regime Tributário (dropdown)
   - Observações (textarea)
3. 🔄 Implementar edição de empresa cadastrada
4. 📄 Exibir CNAEs e Inscrições na view de empresa existente
5. 🗑️ Permitir exclusão de CNAEs/Inscrições
