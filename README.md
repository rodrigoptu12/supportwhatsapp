# SupportWhatsApp — Plataforma de Atendimento ao Cliente via WhatsApp

> Sistema completo de suporte ao cliente multiagente com integração ao WhatsApp Business API, bot automatizado com IA, painel em tempo real e gerenciamento de filas de atendimento.

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql&logoColor=white)](https://postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://docker.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Sumário

- [Visão Geral](#visão-geral)
- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Arquitetura](#arquitetura)
- [Pré-requisitos](#pré-requisitos)
- [Instalação e Configuração](#instalação-e-configuração)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Como Usar](#como-usar)
- [API Reference](#api-reference)
- [WebSocket Events](#websocket-events)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Banco de Dados](#banco-de-dados)
- [Testes](#testes)
- [Deploy em Produção](#deploy-em-produção)
- [Contribuindo](#contribuindo)

---

## Visão Geral

O **SupportWhatsApp** é uma plataforma open-source de **central de atendimento (helpdesk) via WhatsApp** construída com Node.js, React e PostgreSQL. Permite que empresas recebam, gerenciem e respondam mensagens do WhatsApp Business de forma organizada — com bot automatizado, triagem inteligente, transferência entre atendentes e painel administrativo em tempo real.

### Para quem é este projeto?

- Empresas que precisam de um **sistema de atendimento WhatsApp** com múltiplos atendentes
- Startups que buscam uma alternativa open-source ao Zendesk, Freshdesk ou Intercom com suporte WhatsApp
- Equipes que querem integrar **chatbot com IA** (OpenAI GPT) ao atendimento via WhatsApp
- Desenvolvedores que querem aprender a integrar a **Meta WhatsApp Business API** em uma aplicação real

### Casos de Uso

- Central de atendimento (SAC) via WhatsApp
- Suporte técnico multiagente no WhatsApp
- Chatbot de triagem e autoatendimento
- Sistema de tickets via WhatsApp
- Atendimento de e-commerce via WhatsApp
- Help desk com bot e escalada humana

---

## Funcionalidades

### Mensageria & WhatsApp
- Recebimento de mensagens via **Meta WhatsApp Business API** (webhook oficial)
- Suporte a mensagens de texto, imagens, áudios e documentos
- Envio de mensagens em nome da empresa para o cliente
- Rastreamento de status de mensagens (entregue, lido)
- Armazenamento completo do histórico de conversas

### Bot Automatizado
- **Menu interativo** configurável sem código
- Fluxos de atendimento automatizados por departamento
- Integração com **OpenAI (GPT-4/3.5)** para respostas com inteligência artificial
- Escalada automática para atendente humano
- Retomada de contexto após transferência

### Gerenciamento de Conversas
- Fila unificada de conversas abertas
- Filtros por status (aberta, aguardando, fechada), departamento e atendente
- Transferência de conversa entre atendentes com histórico
- Encerramento e reabertura de conversas
- Busca por cliente ou conteúdo de mensagem

### Atendimento em Tempo Real
- **WebSocket (Socket.io)** para atualizações instantâneas
- Indicador de digitação do atendente
- Notificação de nova mensagem em tempo real
- Status de presença dos atendentes (online/offline)
- Dashboard ao vivo sem necessidade de atualizar a página

### Painel Administrativo
- Cadastro e gerenciamento de atendentes
- Criação de departamentos (Suporte, Vendas, Financeiro, etc.)
- Configuração do bot via interface web
- Métricas de atendimento (TMA, volume, satisfação)
- Logs de transferências e atividades

### Segurança & Autenticação
- Autenticação JWT com refresh tokens
- Controle de acesso por perfis: **Admin**, **Atendente**, **Supervisor**
- Rate limiting por IP (proteção contra flood)
- Senhas com bcrypt (12 rounds)
- CORS configurável, headers de segurança (Helmet.js)

---

## Tecnologias

### Backend
| Tecnologia | Versão | Uso |
|---|---|---|
| Node.js | 20+ | Runtime |
| TypeScript | 5.7 | Tipagem estática |
| Express | 4.21 | Framework HTTP |
| Prisma ORM | 5.22 | Acesso ao banco de dados |
| PostgreSQL | 15 | Banco de dados principal |
| Redis | 7 | Cache e sessões |
| Socket.io | 4.8 | WebSocket em tempo real |
| JWT | 9.0 | Autenticação |
| Zod | 3.24 | Validação de schemas |
| Winston | 3.17 | Logging estruturado |
| Bull | 4.16 | Filas de jobs assíncronos |

### Frontend
| Tecnologia | Versão | Uso |
|---|---|---|
| React | 18.3 | Framework UI |
| TypeScript | 5.7 | Tipagem estática |
| Vite | 6.0 | Build tool |
| Zustand | 5.0 | Gerenciamento de estado |
| TanStack Query | 5.62 | Data fetching e cache |
| Socket.io Client | 4.8 | WebSocket |
| Tailwind CSS | 3.4 | Estilização |
| Shadcn/ui | — | Componentes UI |
| React Hook Form | 7.54 | Formulários |
| Zod | 3.24 | Validação de formulários |
| React Router | 6.28 | Roteamento |
| Axios | 1.7 | Cliente HTTP |

### Infraestrutura
| Tecnologia | Uso |
|---|---|
| Docker + Docker Compose | Containerização completa |
| Nginx | Reverse proxy, SSL termination |
| PostgreSQL 15 Alpine | Banco de dados em container |
| Redis 7 Alpine | Cache em container |

### Integrações Externas
| Serviço | Finalidade |
|---|---|
| Meta WhatsApp Business API | Envio e recebimento de mensagens |
| OpenAI API | Respostas com IA (GPT-4/3.5) |
| Sentry (opcional) | Monitoramento de erros em produção |

---

## Arquitetura

```
                    ┌─────────────────────────────────────────┐
                    │            Internet / Clientes           │
                    └───────────────────┬─────────────────────┘
                                        │
                    ┌───────────────────▼─────────────────────┐
                    │            Nginx (Reverse Proxy)         │
                    │         Portas 80 (HTTP) / 443 (HTTPS)  │
                    └──────┬──────────────┬────────────────────┘
                           │              │
               ┌───────────▼──┐    ┌──────▼──────────┐
               │  Frontend    │    │    Backend API   │
               │  React/Vite  │    │  Node.js/Express │
               │  Porta 5173  │    │    Porta 3000    │
               └──────────────┘    └──────┬─────┬─────┘
                                          │     │
                              ┌───────────▼┐   ┌▼──────────────┐
                              │ PostgreSQL │   │    Redis       │
                              │  Porta 5432│   │  Porta 6379   │
                              └────────────┘   └───────────────┘

                    ┌──────────────────────────────────────────┐
                    │          Integrações Externas            │
                    │  Meta WhatsApp Business API / OpenAI     │
                    └──────────────────────────────────────────┘
```

### Fluxo de uma Mensagem WhatsApp

```
Cliente WhatsApp
      │
      ▼ (webhook POST)
Meta Business API
      │
      ▼
Backend — whatsapp.webhook.ts
      │
      ├─ Bot ativo?
      │       ├─ SIM → bot.service.ts → responde menu/IA
      │       └─ NÃO → salva mensagem no banco
      │
      ▼
conversations.service.ts — atualiza conversa
      │
      ▼
socket.server.ts — emite evento WebSocket
      │
      ▼
Frontend — ChatWindow.tsx — exibe mensagem em tempo real
```

---

## Pré-requisitos

- **Node.js** 20+ e npm 10+
- **Docker** 24+ e Docker Compose 2.20+
- **Conta Meta Business** com WhatsApp Business API configurada
- **Número de telefone** aprovado no WhatsApp Business
- **OpenAI API Key** (opcional, para respostas com IA)

---

## Instalação e Configuração

### Opção 1 — Docker Compose (Recomendado)

A forma mais rápida de rodar o projeto completo:

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/supportwhatsapp.git
cd supportwhatsapp

# 2. Configure as variáveis de ambiente
cp backend/.env.example backend/.env
# Edite o arquivo backend/.env com suas credenciais

# 3. Suba todos os serviços
docker-compose up -d

# 4. Verifique se está tudo rodando
docker-compose ps

# 5. Execute as migrations do banco
docker-compose exec backend npx prisma migrate deploy

# 6. (Opcional) Popule dados de exemplo
docker-compose exec backend npx prisma db seed
```

Acesse a aplicação:
- **Frontend (Dashboard):** http://localhost:5173
- **Backend API:** http://localhost:3000
- **Health Check:** http://localhost:3000/health

### Opção 2 — Instalação Manual (Desenvolvimento)

**1. Clone e instale dependências:**

```bash
git clone https://github.com/seu-usuario/supportwhatsapp.git
cd supportwhatsapp
```

**2. Configure e inicie o backend:**

```bash
cd backend
npm install
cp .env.example .env
# Edite o .env com suas credenciais

# Rode PostgreSQL e Redis com Docker
docker run -d --name postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:15-alpine
docker run -d --name redis -p 6379:6379 redis:7-alpine

# Execute as migrations
npx prisma migrate dev

# (Opcional) Popule dados de exemplo
npx prisma db seed

# Inicie o servidor
npm run dev
```

**3. Configure e inicie o frontend:**

```bash
cd ../frontend
npm install
npm run dev
```

**4. Configure o webhook do WhatsApp:**

O backend precisa ser acessível pela internet para receber webhooks da Meta. Em desenvolvimento, use [ngrok](https://ngrok.com):

```bash
ngrok http 3000
# Copie a URL HTTPS gerada e configure no Meta Business Manager
# Webhook URL: https://SEU-NGROK.ngrok.io/api/v1/webhooks/whatsapp
# Verify Token: o valor de WEBHOOK_VERIFY_TOKEN no seu .env
```

---

## Variáveis de Ambiente

Crie o arquivo `backend/.env` com base no exemplo abaixo:

```env
# ─── Servidor ────────────────────────────────────────────
NODE_ENV=development          # development | production
PORT=3000                     # Porta do servidor HTTP

# ─── Banco de Dados (PostgreSQL) ─────────────────────────
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/supportwhatsapp

# ─── Cache (Redis) ───────────────────────────────────────
REDIS_URL=redis://localhost:6379

# ─── Autenticação JWT ────────────────────────────────────
JWT_SECRET=sua-chave-secreta-com-pelo-menos-32-caracteres
JWT_REFRESH_SECRET=outra-chave-secreta-diferente
JWT_EXPIRES_IN=15m            # Tempo de expiração do access token
JWT_REFRESH_EXPIRES_IN=7d     # Tempo de expiração do refresh token

# ─── WhatsApp Business API (Meta) ────────────────────────
WHATSAPP_PHONE_NUMBER_ID=123456789     # ID do número no Meta Business
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxx...   # Token de acesso permanente
WEBHOOK_VERIFY_TOKEN=token-aleatorio   # Token para verificar o webhook

# ─── OpenAI (Opcional) ───────────────────────────────────
OPENAI_API_KEY=sk-xxxxxxxxxx           # API Key da OpenAI para respostas IA

# ─── URLs ────────────────────────────────────────────────
FRONTEND_URL=http://localhost:5173     # URL do frontend (CORS)
BACKEND_URL=http://localhost:3000      # URL do backend

# ─── Segurança ───────────────────────────────────────────
RATE_LIMIT_WINDOW_MS=60000            # Janela do rate limit (ms)
RATE_LIMIT_MAX_REQUESTS=100           # Requisições máximas por janela
BCRYPT_ROUNDS=12                      # Rounds do bcrypt para senhas
```

---

## Como Usar

### Primeiro Acesso

Após instalar, acesse http://localhost:5173 e faça login com as credenciais padrão (criadas pelo seed):

| Campo | Valor |
|---|---|
| E-mail | admin@suporte.com |
| Senha | Admin@123 |

> **Importante:** Altere a senha do admin imediatamente após o primeiro login.

### Perfis de Usuário

| Perfil | Permissões |
|---|---|
| **Admin** | Acesso total — gerencia usuários, departamentos, bot e configurações |
| **Supervisor** | Visualiza métricas, transfere conversas, acessa todos os atendimentos |
| **Atendente** | Responde conversas atribuídas, transfere para outros departamentos |

### Fluxo de Atendimento Típico

1. Cliente envia mensagem para o número WhatsApp da empresa
2. O bot exibe o menu principal e coleta a intenção do cliente
3. O bot encaminha para o departamento correto
4. Atendente disponível recebe notificação em tempo real
5. Atendente assume a conversa e responde pelo painel
6. Ao resolver, atendente encerra a conversa

---

## API Reference

Todas as rotas (exceto `/health` e `/api/v1/auth/login`) exigem autenticação via header:

```
Authorization: Bearer <access_token>
```

### Autenticação

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/v1/auth/login` | Login com e-mail e senha |
| `POST` | `/api/v1/auth/logout` | Encerrar sessão |
| `POST` | `/api/v1/auth/refresh-token` | Renovar access token |
| `GET` | `/api/v1/auth/me` | Dados do usuário autenticado |

**Exemplo de login:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@suporte.com", "password": "Admin@123"}'
```

### Conversas

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/v1/conversations` | Listar conversas (filtros por status, departamento) |
| `GET` | `/api/v1/conversations/:id` | Detalhes de uma conversa |
| `POST` | `/api/v1/conversations/:id/takeover` | Atendente assume conversa do bot |
| `POST` | `/api/v1/conversations/:id/transfer` | Transferir para outro atendente/dept |
| `POST` | `/api/v1/conversations/:id/close` | Encerrar conversa |
| `GET` | `/api/v1/conversations/:id/history` | Histórico de mensagens |
| `GET` | `/api/v1/conversations/stats` | Estatísticas gerais |

### Mensagens

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/v1/messages` | Listar mensagens de uma conversa |
| `POST` | `/api/v1/messages` | Enviar mensagem para o cliente |
| `PATCH` | `/api/v1/messages/:id/read` | Marcar mensagem como lida |

### Usuários

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/v1/users` | Listar atendentes |
| `GET` | `/api/v1/users/:id` | Dados de um atendente |
| `PATCH` | `/api/v1/users/:id` | Atualizar perfil |
| `DELETE` | `/api/v1/users/:id` | Desativar atendente |
| `GET` | `/api/v1/users/online` | Atendentes online no momento |

### Departamentos

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/v1/departments` | Listar departamentos |
| `POST` | `/api/v1/departments` | Criar departamento |
| `PATCH` | `/api/v1/departments/:id` | Atualizar departamento |
| `DELETE` | `/api/v1/departments/:id` | Remover departamento |

### Bot & Configurações

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/v1/bot/config` | Listar configurações do bot |
| `PUT` | `/api/v1/bot/config/:key` | Atualizar configuração do bot |
| `GET` | `/api/v1/bot/flows` | Listar fluxos disponíveis |

### Webhook WhatsApp

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/v1/webhooks/whatsapp` | Verificação do webhook pela Meta |
| `POST` | `/api/v1/webhooks/whatsapp` | Recebimento de mensagens da Meta |

### Health Check

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/health` | Status do servidor (sem autenticação) |

---

## WebSocket Events

O frontend conecta ao WebSocket em `ws://localhost:3000` (Socket.io).

### Eventos que o cliente emite

| Evento | Payload | Descrição |
|---|---|---|
| `subscribe:conversation` | `{ conversationId }` | Entra na sala de uma conversa |
| `unsubscribe:conversation` | `{ conversationId }` | Sai da sala de uma conversa |
| `typing` | `{ conversationId, isTyping }` | Indica que atendente está digitando |

### Eventos que o servidor emite

| Evento | Payload | Descrição |
|---|---|---|
| `new_message` | `Message` | Nova mensagem recebida/enviada |
| `conversation_update` | `Conversation` | Status da conversa alterado |
| `user_typing` | `{ conversationId, userId }` | Atendente digitando |
| `online_status` | `{ userId, online }` | Mudança de status de atendente |
| `conversation_assigned` | `{ conversationId, userId }` | Conversa atribuída a atendente |
| `conversation_transferred` | `{ conversationId, fromUserId, toUserId }` | Conversa transferida |

---

## Estrutura do Projeto

```
supportwhatsapp/
├── backend/                      # API Node.js/Express
│   ├── src/
│   │   ├── config/               # Configurações (DB, Redis, env)
│   │   ├── modules/              # Módulos da aplicação
│   │   │   ├── auth/             # Autenticação e autorização
│   │   │   ├── bot/              # Lógica do chatbot
│   │   │   ├── bot-config/       # API de configuração do bot
│   │   │   ├── conversations/    # Gerenciamento de conversas
│   │   │   ├── departments/      # Gerenciamento de departamentos
│   │   │   ├── messages/         # Gerenciamento de mensagens
│   │   │   ├── users/            # Gerenciamento de usuários
│   │   │   └── whatsapp/         # Integração WhatsApp Business API
│   │   ├── shared/               # Utilitários compartilhados
│   │   │   ├── database/         # Migrations SQL
│   │   │   ├── types/            # Tipos TypeScript globais
│   │   │   └── utils/            # Logger, erros, validações
│   │   ├── websocket/            # Servidor Socket.io
│   │   ├── app.ts                # Configuração do Express
│   │   └── server.ts             # Entry point do servidor
│   ├── prisma/
│   │   ├── schema.prisma         # Schema do banco de dados
│   │   ├── migrations/           # Histórico de migrations
│   │   └── seed.ts               # Dados de exemplo
│   ├── tests/                    # Testes unitários (Jest)
│   ├── Dockerfile
│   └── package.json
│
├── frontend/                     # Dashboard React
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/            # Painéis administrativos
│   │   │   ├── auth/             # Componentes de autenticação
│   │   │   ├── chat/             # Interface de chat
│   │   │   ├── common/           # Componentes reutilizáveis
│   │   │   └── layouts/          # Layouts de página
│   │   ├── hooks/                # Custom React Hooks
│   │   ├── pages/                # Páginas da aplicação
│   │   ├── services/             # Clientes HTTP e WebSocket
│   │   ├── store/                # Zustand stores (estado global)
│   │   ├── types/                # Tipos TypeScript
│   │   └── utils/                # Utilitários do frontend
│   ├── Dockerfile
│   └── package.json
│
├── e2e/                          # Testes E2E (Playwright)
│   ├── tests/                    # Especificações de testes
│   ├── fixtures/                 # Dados e helpers de teste
│   └── playwright.config.ts
│
├── nginx/                        # Configuração Nginx
│   ├── nginx.conf
│   └── Dockerfile
│
├── docker-compose.yaml           # Compose de produção
├── docker-compose.override.yml   # Overrides de desenvolvimento
└── DOCUMENTACAO_TECNICA_COMPLETA.md
```

---

## Banco de Dados

O schema é gerenciado pelo **Prisma ORM**. Principais tabelas:

| Tabela | Descrição |
|---|---|
| `users` | Atendentes, supervisores e admins do sistema |
| `customers` | Clientes que enviam mensagens (identificados pelo telefone) |
| `departments` | Departamentos de atendimento (Suporte, Vendas, etc.) |
| `conversations` | Sessões de conversa entre cliente e empresa |
| `messages` | Mensagens individuais de cada conversa |
| `conversation_transfers` | Histórico de transferências entre atendentes |
| `bot_configurations` | Configurações do chatbot (chave-valor) |
| `user_departments` | Associação atendentes ↔ departamentos (N:N) |

### Comandos Prisma úteis

```bash
# Gerar cliente Prisma após alterar o schema
npx prisma generate

# Criar e aplicar nova migration
npx prisma migrate dev --name nome-da-migration

# Aplicar migrations em produção
npx prisma migrate deploy

# Abrir Prisma Studio (interface visual do banco)
npx prisma studio

# Popular banco com dados de exemplo
npx prisma db seed
```

---

## Testes

O projeto inclui três camadas de testes:

### Testes Unitários — Backend (Jest)

```bash
cd backend
npm test                  # Roda todos os testes
npm run test:watch        # Modo watch (re-executa ao salvar)
npm run test:coverage     # Gera relatório de cobertura
```

### Testes Unitários — Frontend (Vitest)

```bash
cd frontend
npm test                  # Roda todos os testes
npm run test:watch        # Modo watch
```

### Testes E2E (Playwright)

```bash
cd e2e
npm test                  # Roda testes headless
npm run test:headed       # Roda com o browser visível
npm run test:ui           # Interface gráfica do Playwright
npm run report            # Abre relatório HTML dos testes
```

---

## Deploy em Produção

### Com Docker Compose

```bash
# Configure as variáveis de ambiente para produção
cp backend/.env.example backend/.env
# Edite com as credenciais de produção

# Build e inicialização
docker-compose -f docker-compose.yaml up -d --build

# Execute as migrations
docker-compose exec backend npx prisma migrate deploy

# Verifique os logs
docker-compose logs -f
```

### Configuração SSL (Nginx)

Para habilitar HTTPS, adicione os certificados SSL em `nginx/ssl/`:

```
nginx/ssl/
├── cert.pem
└── key.pem
```

O `nginx.conf` já está preparado para SSL com redirecionamento automático de HTTP → HTTPS.

### Providers Cloud Recomendados

| Provider | Serviço Sugerido |
|---|---|
| **AWS** | EC2 t3.medium + RDS PostgreSQL + ElastiCache Redis |
| **DigitalOcean** | Droplet 2GB + Managed Database + Redis |
| **Google Cloud** | Cloud Run + Cloud SQL + Memorystore |
| **Azure** | App Service + Azure Database + Azure Cache |

### Checklist de Produção

- [ ] Variáveis de ambiente configuradas (sem valores padrão)
- [ ] `NODE_ENV=production` definido
- [ ] SSL/TLS configurado no Nginx
- [ ] Webhook WhatsApp apontando para o domínio de produção
- [ ] Backups automáticos do PostgreSQL configurados
- [ ] Monitoramento de erros (Sentry) configurado
- [ ] Rate limiting ajustado conforme volume esperado
- [ ] Senha do admin padrão alterada

---

## Contribuindo

Contribuições são bem-vindas! Siga os passos:

1. Faça um fork do repositório
2. Crie uma branch para sua feature: `git checkout -b feat/minha-feature`
3. Faça commit das alterações: `git commit -m 'feat: adiciona minha feature'`
4. Faça push para a branch: `git push origin feat/minha-feature`
5. Abra um Pull Request

### Convenções de Commit

O projeto segue o padrão [Conventional Commits](https://www.conventionalcommits.org):

```
feat:     Nova funcionalidade
fix:      Correção de bug
docs:     Atualização de documentação
refactor: Refatoração de código
test:     Adição ou modificação de testes
chore:    Tarefas de manutenção
```

---

## Roadmap

- [ ] Dashboard de métricas com gráficos em tempo real
- [ ] Suporte completo a mídia (imagens, áudios, documentos, vídeos)
- [ ] Integração com OpenAI para respostas automáticas com IA
- [ ] Busca avançada no histórico de conversas
- [ ] Exportação de relatórios em CSV/PDF
- [ ] Pipeline CI/CD com GitHub Actions
- [ ] Monitoramento com Prometheus + Grafana
- [ ] Suporte a múltiplos números WhatsApp
- [ ] App mobile para atendentes (React Native)
- [ ] Integração com CRMs (Salesforce, HubSpot)

---

## Licença

Este projeto está licenciado sob a [MIT License](LICENSE).

---

## Palavras-chave

`whatsapp business api` · `sistema de atendimento whatsapp` · `helpdesk whatsapp` · `chatbot whatsapp` · `suporte ao cliente whatsapp` · `multiagente whatsapp` · `sac whatsapp` · `whatsapp crm` · `central de atendimento whatsapp` · `bot whatsapp nodejs` · `whatsapp api nodejs` · `react whatsapp dashboard` · `socket.io whatsapp` · `atendimento multicanal` · `whatsapp support system` · `open source helpdesk` · `whatsapp customer support` · `meta business api` · `whatsapp chatbot openai` · `typescript whatsapp` · `prisma postgresql whatsapp` · `docker whatsapp api` · `fila de atendimento whatsapp` · `transferência de atendimento whatsapp` · `bot automático whatsapp`
