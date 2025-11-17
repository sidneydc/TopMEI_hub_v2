# Regras de Cadastro de Empresa

## Múltiplas Empresas por Usuário

✅ **NOVO**: O usuário pode cadastrar **múltiplas empresas** no sistema.
✅ **NOVO**: O usuário pode **inativar** qualquer empresa cadastrada por ele a qualquer momento.
❌ **IMPORTANTE**: O usuário **NÃO pode excluir** empresas, apenas inativar.

## Status de Cadastro

O sistema trabalha com 4 status principais para o cadastro de empresas:

### 1. `aguardando_aprovacao` (Status Inicial)
- **Quando ocorre**: Após o cliente submeter o cadastro da empresa
- **Comportamento**:
  - Empresa fica visível no dashboard do cliente com badge "Aguardando Aprovação"
  - Cliente **NÃO pode** fazer alterações nos dados
  - Cliente **NÃO pode** cadastrar nova empresa com o mesmo CNPJ
  - Exibe alerta informativo explicando que o cadastro está em análise

### 2. `aprovado`
- **Quando ocorre**: Após análise e aprovação pelo administrador
- **Comportamento**:
  - Empresa fica visível no dashboard com badge "Aprovado" (verde)
  - Cliente **NÃO pode** fazer alterações nos dados
  - Cliente **NÃO pode** cadastrar nova empresa com o mesmo CNPJ
  - Cliente pode utilizar todos os serviços da plataforma
  - Exibe alerta de sucesso

### 3. `rejeitado`
- **Quando ocorre**: Após análise e rejeição pelo administrador
- **Comportamento**:
  - Empresa fica visível no dashboard com badge "Rejeitado" (vermelho)
  - Cliente **PODE** realizar um novo cadastro com o mesmo CNPJ
  - Exibe alerta explicando que o cadastro foi rejeitado
  - Permite correção e reenvio dos dados

### 4. `inativo` ⭐ NOVO
- **Quando ocorre**: Quando o cliente inativa a empresa
- **Comportamento**:
  - Empresa **NÃO aparece** mais na listagem do cliente
  - Dados permanecem no banco de dados (não são excluídos)
  - Plano da empresa é automaticamente inativado
  - Data de inativação é registrada
  - Pode ser reativado pelo administrador se necessário

## Validações no Cadastro

Antes de permitir o cadastro, o sistema valida:

1. ✅ **Aceite dos Termos**: Obrigatório marcar checkbox de Termos de Uso
2. ✅ **Nome do Proprietário**: Campo obrigatório
3. ✅ **CPF do Proprietário**: Deve ter exatamente 11 dígitos
4. ✅ **Data de Nascimento**: Campo obrigatório
5. ✅ **Seleção de Plano**: Cliente deve escolher um dos planos disponíveis
6. ✅ **CNPJ Único por Usuário**: Verifica se o mesmo usuário já cadastrou este CNPJ
   - Um CNPJ pode estar cadastrado por múltiplos usuários diferentes
   - Um usuário NÃO pode cadastrar o mesmo CNPJ duas vezes (exceto se status = rejeitado)
   - Se status for `aguardando_aprovacao`: Bloqueia com mensagem "aguardando aprovação"
   - Se status for `aprovado`: Bloqueia com mensagem "já cadastrado e aprovado"
   - Se status for `rejeitado`: **Permite** novo cadastro

## Fluxo de Cadastro

```
1. Cliente preenche CNPJ → API busca dados da Receita Federal
                          ↓
2. Formulário é preenchido automaticamente
                          ↓
3. Cliente preenche campos do proprietário (nome, CPF, data nascimento)
                          ↓
4. Cliente seleciona um plano
                          ↓
5. Cliente marca checkbox "Aceito os Termos de Uso"
                          ↓
6. Sistema valida CNPJ duplicado (verifica status)
                          ↓
7. Botão "Cadastrar Empresa" fica habilitado
                          ↓
8. Cliente clica em "Cadastrar Empresa"
                          ↓
9. Sistema salva com status = 'aguardando_aprovacao'
                          ↓
10. Exibe mensagem de sucesso e recarrega página
                          ↓
11. Dashboard mostra empresa com status "Aguardando Aprovação"
```

## Interface Principal

### Página "Minhas Empresas"

- **Botão "Cadastrar Nova Empresa"**: Sempre visível no topo da página
- **Lista de Empresas**: Exibe todas as empresas cadastradas pelo usuário em cards
- **Card de Empresa**: Mostra:
  - Razão Social e CNPJ
  - Badge de status (Aguardando Aprovação / Aprovado / Rejeitado)
  - Nome Fantasia, Data de Abertura, Cidade/Estado
  - Botão de exclusão (ícone de lixeira)
- **Mensagem vazia**: Quando não há empresas cadastradas

### Inativação de Empresa ⭐ ATUALIZADO

1. Usuário clica no botão de inativar (ícone X laranja) no card da empresa
2. Sistema exibe confirmação:
   ```
   Tem certeza que deseja inativar a empresa CNPJ XX.XXX.XXX/XXXX-XX?
   
   Você poderá reativar esta empresa posteriormente se necessário.
   ```
3. Se confirmar:
   - Atualiza `status_cadastro` da empresa para `'inativo'`
   - Registra `data_inativacao` com timestamp atual
   - Atualiza status do plano para `'inativo'` em `empresas_planos`
   - **NÃO exclui** nenhum dado do banco
4. Empresa desaparece da listagem do cliente
5. Mensagem de sucesso: "✅ Empresa inativada com sucesso!"

**Importante**: 
- Dados permanecem no banco de dados para auditoria
- Administrador pode reativar a empresa se necessário
- Histórico completo é preservado

## Interface do Botão "Cadastrar Empresa"

- **Desabilitado** (cinza) quando:
  - Termos não foram aceitos
  - Está processando (mostra "Cadastrando...")

- **Habilitado** (verde) quando:
  - Todos os campos obrigatórios preenchidos
  - Plano selecionado
  - Termos aceitos

## Mensagens de Erro

| Situação | Mensagem |
|----------|----------|
| Termos não aceitos | "Você deve aceitar os Termos de Uso para continuar" |
| Nome vazio | "Nome do proprietário é obrigatório" |
| CPF inválido | "CPF do proprietário deve conter 11 dígitos" |
| Data nascimento vazia | "Data de nascimento é obrigatória" |
| Plano não selecionado | "Selecione um plano para continuar" |
| CNPJ aguardando (mesmo usuário) | "Este CNPJ já possui um cadastro aguardando aprovação. Aguarde a análise." |
| CNPJ aprovado (mesmo usuário) | "Este CNPJ já está cadastrado e aprovado no sistema." |

## Permissões de Edição

| Status | Pode Editar? | Pode Cadastrar Novo? | Pode Excluir? |
|--------|-------------|---------------------|---------------|
| `aguardando_aprovacao` | ❌ Não | ❌ Não (mesmo CNPJ) | ✅ Sim |
| `aprovado` | ❌ Não | ❌ Não (mesmo CNPJ) | ✅ Sim |
| `rejeitado` | ❌ Não* | ✅ Sim (mesmo CNPJ) | ✅ Sim |

*No status rejeitado, o cliente deve fazer um novo cadastro, não editar o antigo.

## Alterações no Dashboard

### Antes (Versão Antiga)
- Exibia apenas UMA empresa por usuário
- Botões "Abrir MEI" e "Cadastrar MEI" quando sem empresa
- Tela de detalhes quando tinha empresa
- Não permitia exclusão

### Agora (Versão Nova)  
- Exibe TODAS as empresas do usuário em lista
- Botão "Cadastrar Nova Empresa" sempre visível
- Cards compactos com informações principais
- Botão de exclusão em cada card
- Permite múltiplos cadastros

## Alertas no Dashboard

Os alertas de status foram removidos da visualização individual. 
Agora o status é exibido apenas como badge no card de cada empresa:

## Observações Importantes

1. **Após cadastro bem-sucedido**: Sistema exibe alert nativo do navegador com mensagem de sucesso e recarrega a página automaticamente

2. **Tabelas afetadas no cadastro**:
   - `empresa` (dados principais com status_cadastro)
   - `empresas_planos` (vincula empresa ao plano escolhido)
   - `cnaes_secundarios` (atividades secundárias da empresa)
   - `inscricoes` (inscrições estaduais/municipais)

3. **Campos do proprietário** (não vêm da API):
   - `nome_proprietario`
   - `cpf_proprietario` (apenas números, sem formatação)
   - `data_nascimento`

4. **Reset de formulário**: Botão "Cancelar" limpa todos os campos incluindo o estado do checkbox de termos
