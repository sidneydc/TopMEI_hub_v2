# 🚀 TopMEI - Sistema de Gestão para MEI

<div align="center">

Sistema completo de gestão para Microempreendedores Individuais (MEIs) desenvolvido com tecnologias modernas.

**React** • **TypeScript** • **Tailwind CSS** • **Supabase**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[Documentação](docs/) • [Guia Rápido](docs/QUICK_START.md) • [Arquitetura](docs/ARCHITECTURE.md)

</div>

---

## 🚀 Características

- **Autenticação completa** com Supabase Auth
- **3 tipos de usuários** com dashboards personalizados:
  - **Cliente**: Visualiza e gerencia sua empresa, documentos, serviços e cobranças
  - **Contador**: Gerencia múltiplas empresas, documentos, NFSe e orçamentos
  - **Administrador**: Controle completo do sistema, usuários, planos e auditoria
- **Interface moderna** com Tailwind CSS
- **Componentes reutilizáveis** para fácil manutenção
- **Proteção de rotas** baseada em perfil de usuário
- **Sistema de notificações em tempo real**

## � Screenshots

### Dashboard do Cliente
- Visualização de status da empresa
- Documentos e cobranças
- Serviços contratados

### Dashboard do Contador
- Gerenciamento de múltiplas empresas
- Emissão de NFSe
- Análise de documentos

### Dashboard do Administrador
- Controle completo do sistema
- Gestão de usuários e planos
- Auditoria e relatórios

## �📋 Pré-requisitos

- **Node.js** 18+ e npm/yarn/pnpm
- Conta no **Supabase** (gratuita) - [Criar conta](https://supabase.com)
- Editor de código (recomendado: VS Code)

## 🔧 Instalação

### 🚀 Guia Rápido (5 minutos)

Veja o [Guia de Início Rápido](docs/QUICK_START.md) para começar imediatamente.

### 📦 Instalação Completa

### 1. Instale as dependências

```bash
# Usando npm
npm install

# Ou usando yarn
yarn install

# Ou usando pnpm
pnpm install
```

### 2. Configure o Supabase

1. Crie um novo projeto no Supabase
2. Copie o arquivo `.env.example` para `.env`
3. Adicione suas credenciais do Supabase no arquivo `.env`:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

### 3. Execute o script SQL no Supabase

Acesse o **SQL Editor** no painel do Supabase e execute o arquivo `database/schema.sql` para criar todas as tabelas necessárias.

📚 Para instruções detalhadas sobre configuração do Supabase, veja: [SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md)

### 4. Configure os perfis de usuário

Após executar o script SQL, insira os perfis padrão:

```sql
INSERT INTO perfil (id, role, ativo, created_at) VALUES
  (gen_random_uuid(), 'cliente', true, now()),
  (gen_random_uuid(), 'contador', true, now()),
  (gen_random_uuid(), 'administrador', true, now());
```

### 5. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`

## 🎯 Como Usar

### Primeiro Acesso

1. **Crie sua conta**: Acesse `/signup` e preencha os dados
2. **Verifique o email**: Clique no link de confirmação
3. **Defina seu perfil**: Um administrador deve atribuir seu perfil
4. **Faça login**: Acesse `/login` com suas credenciais

### Tipos de Usuário

#### 👤 Cliente
- Visualizar e editar dados da empresa
- Enviar documentos
- Contratar serviços
- Visualizar cobranças
- Solicitar emissão de NFSe

#### 👨‍💼 Contador
- Gerenciar múltiplas empresas
- Aprovar/rejeitar documentos
- Emitir NFSe
- Criar orçamentos
- Gerenciar serviços

#### 👑 Administrador
- Controle total do sistema
- Gerenciar usuários e perfis
- Configurar planos e serviços
- Visualizar auditoria
- Análise de métricas

## 🛠️ Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build de produção
npm run preview

# Executar linter
npm run lint
```

## 📁 Estrutura do Projeto

```
src/
├── components/
│   ├── auth/              # Componentes de autenticação
│   ├── layout/            # Layout e navegação
│   └── ui/                # Componentes reutilizáveis (Card, Table, etc)
├── contexts/              # Contextos React (Auth)
├── hooks/                 # Custom hooks
├── lib/                   # Configurações (Supabase)
├── pages/                 # Páginas da aplicação
│   └── dashboards/        # Dashboards por tipo de usuário
├── types/                 # Tipos TypeScript
├── App.tsx               # Componente principal e rotas
├── main.tsx              # Entry point
└── index.css             # Estilos globais
```

## 🗄️ Estrutura do Banco de Dados

O sistema utiliza as seguintes tabelas principais:

- **users** (auth.users do Supabase) - Usuários do sistema
- **perfil** - Tipos de perfil (cliente, contador, administrador)
- **user_perfis** - Relacionamento usuário-perfil
- **empresa** - Dados das empresas MEI
- **documentos** - Documentos enviados pelas empresas
- **tipo_documentos** - Tipos de documentos obrigatórios
- **servicos** - Serviços oferecidos
- **planos** - Planos de assinatura
- **empresas_planos** - Planos contratados pelas empresas
- **cobranca_plano** - Cobranças de planos
- **cobranca_servicos** - Cobranças de serviços
- **NFSe** - Notas fiscais de serviço eletrônicas
- **notificacao** - Notificações do sistema
- **auditoria** - Log de ações no sistema

## 🎨 Personalizando a Interface

As cores do tema podem ser alteradas no arquivo `tailwind.config.js`:

```javascript
colors: {
  primary: {
    50: '#f0f9ff',
    // ... outras cores
  },
}
```

## 🔒 Segurança

- Implementar Row Level Security (RLS) no Supabase para cada tabela
- Configurar policies para garantir que usuários só acessem seus próprios dados
- Validar permissões no backend (Supabase Functions ou Edge Functions)

## �️ Roadmap

### ✅ Fase 1 - Concluída
- [x] Autenticação e autorização
- [x] Sistema de perfis (Cliente, Contador, Admin)
- [x] Dashboards personalizados
- [x] Estrutura do banco de dados
- [x] Componentes UI reutilizáveis

### 🚧 Fase 2 - Em Desenvolvimento
- [ ] Upload e gerenciamento de documentos
- [ ] Sistema completo de NFSe
- [ ] Gestão de cobranças
- [ ] Relatórios e exportação

### 📅 Fase 3 - Planejada
- [ ] Integração com gateway de pagamento
- [ ] Notificações por email e SMS
- [ ] Dashboard com gráficos avançados
- [ ] Sistema de chat/suporte
- [ ] App mobile (React Native)

### 🔮 Fase 4 - Futuro
- [ ] IA para análise de documentos
- [ ] Integração com Receita Federal
- [ ] Marketplace de serviços
- [ ] API pública para integrações

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 🤝 Como Contribuir

Contribuições são sempre bem-vindas! Para contribuir:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Diretrizes de Contribuição
- Siga os padrões de código existentes
- Adicione testes quando aplicável
- Atualize a documentação
- Mantenha commits pequenos e focados

## 📚 Documentação

- [Guia de Início Rápido](docs/QUICK_START.md) - Comece em 5 minutos
- [Configuração do Supabase](docs/SUPABASE_SETUP.md) - Setup detalhado
- [Arquitetura do Sistema](docs/ARCHITECTURE.md) - Visão técnica

## � Reportar Bugs

Encontrou um bug? Abra uma [issue](../../issues) com:
- Descrição clara do problema
- Passos para reproduzir
- Comportamento esperado vs atual
- Screenshots (se aplicável)
- Ambiente (navegador, OS, etc)

## 💬 Comunidade

- 💡 [Discussões](../../discussions) - Ideias e perguntas
- 🐛 [Issues](../../issues) - Bugs e melhorias
- 📧 Email: suporte@topmeihub.com

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 👏 Agradecimentos

- [React](https://react.dev/) - Framework UI
- [Supabase](https://supabase.com/) - Backend as a Service
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS
- [Lucide](https://lucide.dev/) - Ícones
- Comunidade open source

## 📊 Status do Projeto

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

<div align="center">

Desenvolvido com ❤️ para facilitar a gestão de MEIs

**[⬆ Voltar ao topo](#-topmei-hub---sistema-de-gestão-para-mei)**

</div>
