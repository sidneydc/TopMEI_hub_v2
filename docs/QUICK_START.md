# Guia de Início Rápido - TopMEI

## 🚀 Começando em 5 minutos

### 1️⃣ Instalar Dependências

```bash
npm install
```

### 2️⃣ Configurar Supabase

1. Crie uma conta em https://supabase.com
2. Crie um novo projeto
3. Copie `.env.example` para `.env`
4. Adicione suas credenciais:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-aqui
```

### 3️⃣ Criar Banco de Dados

1. Acesse o **SQL Editor** no Supabase
2. Execute o script `database/schema.sql`
3. Verifique se as tabelas foram criadas

### 4️⃣ Iniciar Aplicação

```bash
npm run dev
```

Acesse: http://localhost:5173

### 5️⃣ Criar Primeira Conta

1. Clique em "Cadastre-se"
2. Preencha os dados
3. Verifique o email (pode demorar alguns minutos)
4. Faça login

### 6️⃣ Definir como Administrador

Execute no SQL Editor do Supabase (substitua o USER_ID):

```sql
INSERT INTO user_perfis (user_id, perfil_id, ativo)
VALUES (
  'SEU-USER-ID-AQUI',
  (SELECT id FROM perfil WHERE role = 'administrador'),
  true
);
```

Para encontrar seu USER_ID:
1. Vá em **Authentication** > **Users** no Supabase
2. Copie o ID do usuário criado

## 📱 Testando a Aplicação

### Login como Cliente
- Crie um usuário e atribua o perfil 'cliente'
- Você verá o dashboard do cliente com informações da empresa

### Login como Contador
- Atribua o perfil 'contador' a um usuário
- Você verá o dashboard com todas as empresas

### Login como Administrador
- Use o usuário que você definiu como admin
- Você terá acesso completo ao sistema

## 🎨 Estrutura de Pastas

```
src/
├── components/       # Componentes React
├── contexts/        # Contextos (Auth)
├── hooks/           # Custom hooks
├── lib/             # Configurações
├── pages/           # Páginas
└── types/           # Tipos TypeScript
```

## 🔧 Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview

# Lint
npm run lint
```

## 🐛 Problemas Comuns

### Erro ao fazer login
- Verifique as credenciais do Supabase
- Confirme que o email foi verificado
- Verifique o console do navegador

### Página em branco
- Verifique se o banco foi criado
- Verifique se o user_perfis está configurado
- Abra o console do navegador (F12)

### Erro de permissão
- Verifique se o perfil foi atribuído ao usuário
- Confirme que a tabela user_perfis tem registros
- Verifique as policies RLS no Supabase

## 📚 Próximos Passos

1. Explore os dashboards diferentes
2. Personalize as cores em `tailwind.config.js`
3. Adicione novos tipos de documentos
4. Configure os serviços e planos
5. Implemente as páginas pendentes

## 💡 Dicas

- Use o SQL Editor do Supabase para testar queries
- Ative o "Realtime" para notificações em tempo real
- Configure o Storage para upload de documentos
- Use a auditoria para rastrear ações importantes

## 📖 Documentação Adicional

- [Setup Completo do Supabase](docs/SUPABASE_SETUP.md)
- [README Principal](README.md)

## 🆘 Precisa de Ajuda?

- Verifique a documentação do Supabase
- Abra uma issue no GitHub
- Consulte o console do navegador (F12)
