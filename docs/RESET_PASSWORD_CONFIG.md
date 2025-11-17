# Configuração de Redirecionamento - Reset Password

## ⚠️ IMPORTANTE: Configuração Necessária no Supabase

Para que o reset de senha funcione corretamente, você precisa adicionar a URL de redirecionamento no painel do Supabase.

## 📝 Passo a Passo

### 1. Acesse o Painel do Supabase

Acesse: https://bzutuknimnlpyxllmici.supabase.co/project/bzutuknimnlpyxllmici/auth/url-configuration

### 2. Adicione as URLs de Redirecionamento

Na seção **"Redirect URLs"**, adicione as seguintes URLs:

```
http://localhost:5173/reset-password
http://localhost:5174/reset-password
```

### 3. Salve as Configurações

Clique em **"Save"** no canto inferior direito.

## ✅ Teste o Fluxo Completo

### 1. Solicitar Reset de Senha

1. Acesse: http://localhost:5173/forgot-password
2. Digite seu email
3. Clique em "Enviar Link de Recuperação"

### 2. Verificar Email

1. Abra seu email
2. Clique no link recebido (formato: `...verify?token=...&type=recovery&redirect_to=...`)

### 3. Redefinir Senha

1. Você será redirecionado para `/reset-password`
2. Digite sua nova senha (mínimo 6 caracteres)
3. Confirme a senha
4. Clique em "Redefinir Senha"

### 4. Login com Nova Senha

1. Após redefinir, você será redirecionado para `/login`
2. Faça login com sua nova senha

## 🔧 Funcionalidades da Página

### ✅ Validações
- Senha mínima de 6 caracteres
- Senha máxima de 72 caracteres
- Confirmação de senha deve ser igual
- Indicadores visuais de requisitos

### ✅ Segurança
- Verificação de token válido
- Mensagem de erro se token expirado
- Link para solicitar novo token
- Botão de mostrar/ocultar senha

### ✅ UX
- Loading states
- Mensagens de sucesso/erro claras
- Redirecionamento automático após sucesso
- Design responsivo e acessível

## 🐛 Solução de Problemas

### Erro: "Link de recuperação inválido ou expirado"

**Causa**: O token do email expirou (válido por 1 hora)

**Solução**:
1. Clique em "Solicitar novo link"
2. Ou acesse `/forgot-password` novamente
3. Digite seu email e solicite um novo link

### Erro: "Redirect URL not allowed"

**Causa**: A URL de redirecionamento não está configurada no Supabase

**Solução**:
1. Acesse o painel do Supabase
2. Vá em Authentication > URL Configuration
3. Adicione `http://localhost:5173/reset-password`
4. Salve as configurações

### Email não chega

**Verificar**:
1. Pasta de spam
2. Email correto cadastrado
3. Configuração SMTP do Supabase (Production)
4. Limite de emails do plano gratuito

## 📧 Formato do Email de Recuperação

O Supabase envia automaticamente um email com:

**Assunto**: "Reset Password for [seu-app]"

**Conteúdo**:
- Link para redefinir senha
- Validade do link (1 hora)
- Instruções de segurança

## 🎨 Interface

A página `/reset-password` possui:

- ✅ **Header**: Ícone de cadeado e título
- ✅ **Formulário**: Campos de nova senha e confirmação
- ✅ **Validação Visual**: Checklist de requisitos
- ✅ **Mensagens**: Sucesso (verde) e erro (vermelho)
- ✅ **Botão de Ação**: "Redefinir Senha" com loading state
- ✅ **Link de Retorno**: "Voltar para o login"

## 🔐 Segurança

### Token de Recuperação
- **Validade**: 1 hora após solicitação
- **Uso único**: Após usar, o token é invalidado
- **Criptografia**: Token criptografado no URL

### Nova Senha
- **Hash**: Senha é criptografada antes de salvar
- **Não armazenada**: Nunca armazenamos senha em texto plano
- **Validação**: Requisitos de complexidade aplicados

## 📊 Fluxo Completo

```
[Usuário esqueceu senha]
        ↓
[/forgot-password] → Digite email
        ↓
[Supabase envia email]
        ↓
[Usuário clica no link do email]
        ↓
[/reset-password] → Digite nova senha
        ↓
[Senha atualizada no Supabase]
        ↓
[Redirecionamento automático para /login]
        ↓
[Login com nova senha] ✅
```

## 🚀 Melhorias Futuras (Opcional)

- [ ] Força da senha (fraca/média/forte)
- [ ] Requisitos mais complexos (números, símbolos)
- [ ] Histórico de senhas (evitar reutilização)
- [ ] 2FA após reset de senha
- [ ] Notificação por email após mudança de senha
- [ ] Log de auditoria para mudanças de senha
- [ ] Rate limiting para prevenir ataques
- [ ] CAPTCHA na página de forgot password

## 📱 Responsividade

A página é totalmente responsiva:
- ✅ Desktop: Formulário centralizado com max-width
- ✅ Tablet: Ajusta espaçamento
- ✅ Mobile: Layout otimizado para telas pequenas

## ♿ Acessibilidade

- ✅ Labels associados a inputs
- ✅ Mensagens de erro descritivas
- ✅ Contraste adequado de cores
- ✅ Navegação por teclado
- ✅ Estados de foco visíveis
- ✅ Ícones com significado semântico

## 📝 Notas Importantes

1. **Ambiente de Desenvolvimento**: Use localhost:5173 ou localhost:5174
2. **Ambiente de Produção**: Adicione sua URL de produção nas Redirect URLs
3. **Email Templates**: Personalize no painel do Supabase > Authentication > Email Templates
4. **Rate Limits**: Supabase tem limite de emails por hora (verifique seu plano)

## ✅ Checklist de Implementação

- [x] Criar página ResetPassword.tsx
- [x] Adicionar rota /reset-password no App.tsx
- [x] Configurar redirectTo no ForgotPassword.tsx
- [ ] Adicionar URL no Supabase (VOCÊ PRECISA FAZER!)
- [ ] Testar fluxo completo
- [ ] Verificar emails de teste
- [ ] Testar token expirado
- [ ] Testar validações de senha
