# 🏗️ SISTEMA DE ATENDIMENTO WHATSAPP - DOCUMENTAÇÃO TÉCNICA COMPLETA

## 📋 ÍNDICE
1. [Visão Geral do Sistema](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Stack Tecnológica](#stack-tecnológica)
4. [Requisitos e Especificações](#requisitos)
5. [Estrutura do Banco de Dados](#banco-de-dados)
6. [Backend - API REST](#backend)
7. [Frontend - Dashboard](#frontend)
8. [Sistema de Autenticação](#autenticação)
9. [Integração WhatsApp](#whatsapp)
10. [WebSocket para Tempo Real](#websocket)
11. [Infraestrutura e Deploy](#infraestrutura)
12. [Estrutura de Pastas](#estrutura-pastas)
13. [Fluxos de Dados](#fluxos)
14. [Segurança](#segurança)
15. [Performance e Escalabilidade](#performance)
16. [Custos Estimados](#custos)
17. [Roadmap de Implementação](#roadmap)

---

## 1. 📊 VISÃO GERAL DO SISTEMA {#visão-geral}

### Objetivo
Sistema de atendimento multicanal via WhatsApp com bot automatizado e transferência para atendentes humanos.

### Capacidade
- **10 atendentes simultâneos**
- **100+ conversas simultâneas**
- **1000+ mensagens por minuto**

### Componentes Principais
```
┌─────────────────────────────────────────────────────┐
│                   SISTEMA COMPLETO                   │
├─────────────────────────────────────────────────────┤
│                                                      │
│  WhatsApp API ──→ Backend (Node.js) ──→ Frontend    │
│       ↓              ↓           ↓          ↓       │
│   Webhooks      PostgreSQL   Redis    React SPA     │
│                      ↓           ↓                   │
│                  OpenAI API   WebSocket              │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## 2. 🏛️ ARQUITETURA {#arquitetura}

### Arquitetura de Alto Nível

```
                    ┌─────────────────┐
                    │   WhatsApp      │
                    │   Business API  │
                    └────────┬────────┘
                             │ Webhooks
                             ↓
                    ┌─────────────────┐
                    │   Load Balancer │
                    │    (Nginx)      │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              ↓                             ↓
     ┌─────────────────┐         ┌─────────────────┐
     │  Backend API    │←────────│  WebSocket      │
     │  (Node.js)      │         │  Server         │
     └────────┬────────┘         └─────────────────┘
              │                           ↑
              ├───────┬──────────────────┘
              ↓       ↓                   ↓
     ┌────────────┐  ┌──────────┐  ┌──────────┐
     │ PostgreSQL │  │  Redis   │  │  OpenAI  │
     │  Database  │  │  Cache   │  │   API    │
     └────────────┘  └──────────┘  └──────────┘
              ↑
              │ Queries
              │
     ┌────────────────┐
     │   Frontend     │
     │   (React)      │
     │  Dashboard     │
     └────────────────┘
```

### Fluxo de Mensagens

```
1. Cliente envia msg → WhatsApp API → Webhook → Backend
2. Backend processa → Salva no DB → Publica no Redis
3. WebSocket notifica → Frontend atualiza em tempo real
4. Se bot: OpenAI → Responde automaticamente
5. Se humano: Atendente responde → Backend → WhatsApp API
```

---

## 3. 🛠️ STACK TECNOLÓGICA {#stack-tecnológica}

### Backend
```yaml
Linguagem: Node.js 20+ (TypeScript)
Framework: Express.js ou Fastify
ORM: Prisma ou TypeORM
Validação: Zod ou Joi
Autenticação: JWT + bcrypt
Rate Limiting: express-rate-limit
Logging: Winston ou Pino
Testes: Jest + Supertest
```

### Frontend
```yaml
Framework: React 18+ (TypeScript)
Build Tool: Vite
UI Components: shadcn/ui + Tailwind CSS
State Management: Zustand ou Redux Toolkit
HTTP Client: Axios + React Query
WebSocket: Socket.io-client
Routing: React Router v6
Forms: React Hook Form + Zod
Testes: Vitest + React Testing Library
```

### Banco de Dados
```yaml
Principal: PostgreSQL 15+
Cache: Redis 7+
Message Queue: Bull (Redis-based)
Backup: AWS S3 ou equivalente
```

### Infraestrutura
```yaml
Hosting: AWS, Google Cloud, ou DigitalOcean
Containers: Docker + Docker Compose
Reverse Proxy: Nginx
SSL: Let's Encrypt (Certbot)
CI/CD: GitHub Actions ou GitLab CI
Monitoring: Sentry + Prometheus + Grafana
```

### Integrações
```yaml
WhatsApp: Meta Business API (oficial)
IA: OpenAI GPT-4 ou GPT-3.5-turbo
Email: SendGrid ou AWS SES
Analytics: Google Analytics ou Mixpanel
```

---

## 4. 📝 REQUISITOS E ESPECIFICAÇÕES {#requisitos}

### Requisitos Funcionais

#### RF01 - Recepção de Mensagens
- Sistema deve receber mensagens via WhatsApp Business API
- Suporte para texto, imagens, áudios, documentos
- Confirmação de recebimento em < 200ms

#### RF02 - Bot Automático
- Responder automaticamente com menus estruturados
- Integração com IA para respostas inteligentes
- Configuração de flows sem código

#### RF03 - Transferência para Humano
- Atendente pode assumir conversa a qualquer momento
- Bot para de responder quando em modo humano
- Notificação visual de transferência

#### RF04 - Dashboard de Atendimento
- Lista de conversas em tempo real
- Chat interface com histórico completo
- Indicadores visuais de status
- Busca e filtros

#### RF05 - Autenticação e Autorização
- Login seguro com JWT
- Roles: Admin, Atendente, Supervisor
- Sessões com timeout automático
- Two-factor authentication (opcional)

#### RF06 - Métricas e Relatórios
- Tempo médio de atendimento
- Taxa de resolução
- Volume de mensagens
- Performance dos atendentes
- Exportação de relatórios

### Requisitos Não-Funcionais

#### RNF01 - Performance
- API responde em < 200ms (p95)
- Dashboard carrega em < 2s
- WebSocket latência < 100ms
- Suporta 10 atendentes simultâneos
- Suporta 100 conversas ativas

#### RNF02 - Disponibilidade
- Uptime de 99.5%
- Backup automático diário
- Recovery point objective (RPO): 1 hora
- Recovery time objective (RTO): 4 horas

#### RNF03 - Segurança
- Comunicação HTTPS obrigatória
- Senhas hasheadas com bcrypt (salt rounds: 12)
- Rate limiting: 100 req/min por IP
- Proteção contra SQL Injection
- Proteção contra XSS e CSRF
- Headers de segurança (Helmet.js)

#### RNF04 - Escalabilidade
- Arquitetura stateless
- Horizontal scaling ready
- Cache distribuído (Redis)
- Message queue para processamento assíncrono

---

## 5. 🗄️ ESTRUTURA DO BANCO DE DADOS {#banco-de-dados}

### Schema PostgreSQL

```sql
-- =====================================================
-- TABELA: users
-- Armazena usuários do sistema (atendentes)
-- =====================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'attendant', -- 'admin', 'attendant', 'supervisor'
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABELA: customers
-- Armazena clientes (usuários do WhatsApp)
-- =====================================================
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  metadata JSONB DEFAULT '{}', -- Dados customizados
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABELA: conversations
-- Armazena conversas/sessões de atendimento
-- =====================================================
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  assigned_user_id UUID REFERENCES users(id), -- NULL = bot
  status VARCHAR(50) NOT NULL DEFAULT 'open', -- 'open', 'closed', 'waiting'
  channel VARCHAR(50) DEFAULT 'whatsapp',
  current_menu_level VARCHAR(100) DEFAULT 'main',
  is_bot_active BOOLEAN DEFAULT true,
  needs_human_attention BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP,
  last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABELA: messages
-- Armazena todas as mensagens
-- =====================================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id),
  sender_type VARCHAR(50) NOT NULL, -- 'customer', 'bot', 'attendant', 'system'
  sender_user_id UUID REFERENCES users(id), -- NULL se não for atendente
  content TEXT NOT NULL,
  message_type VARCHAR(50) DEFAULT 'text', -- 'text', 'image', 'audio', 'document'
  media_url TEXT,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  whatsapp_message_id VARCHAR(255),
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABELA: conversation_transfers
-- Histórico de transferências bot → humano
-- =====================================================
CREATE TABLE conversation_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id),
  from_user_id UUID REFERENCES users(id), -- NULL = do bot
  to_user_id UUID REFERENCES users(id),   -- NULL = para bot
  reason TEXT,
  transferred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABELA: bot_configurations
-- Configurações do bot (menus, respostas)
-- =====================================================
CREATE TABLE bot_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(255) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABELA: metrics
-- Métricas de atendimento (agregadas)
-- =====================================================
CREATE TABLE metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type VARCHAR(100) NOT NULL, -- 'response_time', 'resolution_rate', etc
  metric_value DECIMAL(10,2) NOT NULL,
  dimensions JSONB DEFAULT '{}', -- user_id, date, etc
  measured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================
CREATE INDEX idx_conversations_customer ON conversations(customer_id);
CREATE INDEX idx_conversations_user ON conversations(assigned_user_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sent_at ON messages(sent_at DESC);
CREATE INDEX idx_messages_whatsapp_id ON messages(whatsapp_message_id);

CREATE INDEX idx_customers_phone ON customers(phone_number);

CREATE INDEX idx_transfers_conversation ON conversation_transfers(conversation_id);

CREATE INDEX idx_metrics_type_date ON metrics(metric_type, measured_at DESC);

-- =====================================================
-- TRIGGERS PARA AUTO-UPDATE
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Redis Schema

```javascript
// Cache de sessões ativas (TTL: 5 minutos)
sessions:{phone_number} = {
  conversationId: "uuid",
  customerId: "uuid",
  menuLevel: "main",
  isBotActive: true,
  lastActivity: timestamp
}

// Fila de mensagens para processar
queue:messages = [message_id_1, message_id_2, ...]

// Cache de configurações do bot (TTL: 1 hora)
cache:bot_config:{key} = {...}

// Contador de rate limiting (TTL: 1 minuto)
rate_limit:{ip_address} = count

// WebSocket: mapeamento user → socket_id
socket:user:{user_id} = socket_id

// Online status dos atendentes
online:attendants = Set[user_id_1, user_id_2, ...]
```

---

## 6. 🔧 BACKEND - API REST {#backend}

### Estrutura de Pastas

```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts
│   │   ├── redis.ts
│   │   ├── whatsapp.ts
│   │   └── env.ts
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.middleware.ts
│   │   │   └── auth.types.ts
│   │   ├── conversations/
│   │   │   ├── conversations.controller.ts
│   │   │   ├── conversations.service.ts
│   │   │   ├── conversations.routes.ts
│   │   │   └── conversations.types.ts
│   │   ├── messages/
│   │   │   ├── messages.controller.ts
│   │   │   ├── messages.service.ts
│   │   │   ├── messages.routes.ts
│   │   │   └── messages.types.ts
│   │   ├── whatsapp/
│   │   │   ├── whatsapp.controller.ts
│   │   │   ├── whatsapp.service.ts
│   │   │   ├── whatsapp.webhook.ts
│   │   │   └── whatsapp.routes.ts
│   │   ├── bot/
│   │   │   ├── bot.service.ts
│   │   │   ├── bot.flows.ts
│   │   │   └── bot.ai.ts
│   │   └── users/
│   │       ├── users.controller.ts
│   │       ├── users.service.ts
│   │       └── users.routes.ts
│   ├── shared/
│   │   ├── database/
│   │   │   ├── prisma.client.ts
│   │   │   └── migrations/
│   │   ├── utils/
│   │   │   ├── logger.ts
│   │   │   ├── errors.ts
│   │   │   └── validation.ts
│   │   └── types/
│   │       └── index.ts
│   ├── websocket/
│   │   ├── socket.server.ts
│   │   ├── socket.handlers.ts
│   │   └── socket.events.ts
│   ├── app.ts
│   └── server.ts
├── tests/
├── prisma/
│   └── schema.prisma
├── .env.example
├── package.json
├── tsconfig.json
└── docker-compose.yml
```

### Endpoints Principais

```typescript
// =====================================================
// AUTH ENDPOINTS
// =====================================================
POST   /api/v1/auth/login
POST   /api/v1/auth/register
POST   /api/v1/auth/logout
POST   /api/v1/auth/refresh-token
GET    /api/v1/auth/me

// =====================================================
// CONVERSATIONS ENDPOINTS
// =====================================================
GET    /api/v1/conversations              // Listar conversas
GET    /api/v1/conversations/:id          // Detalhes da conversa
POST   /api/v1/conversations/:id/takeover // Assumir atendimento
POST   /api/v1/conversations/:id/transfer // Transferir para outro
POST   /api/v1/conversations/:id/close    // Encerrar conversa
GET    /api/v1/conversations/stats        // Estatísticas

// =====================================================
// MESSAGES ENDPOINTS
// =====================================================
GET    /api/v1/messages?conversation_id=  // Listar mensagens
POST   /api/v1/messages                   // Enviar mensagem
PATCH  /api/v1/messages/:id/read          // Marcar como lida

// =====================================================
// WHATSAPP WEBHOOK
// =====================================================
GET    /api/v1/webhooks/whatsapp          // Verificação
POST   /api/v1/webhooks/whatsapp          // Receber mensagens

// =====================================================
// USERS ENDPOINTS
// =====================================================
GET    /api/v1/users                      // Listar atendentes
GET    /api/v1/users/:id                  // Detalhes do usuário
PATCH  /api/v1/users/:id                  // Atualizar perfil
GET    /api/v1/users/online               // Atendentes online

// =====================================================
// BOT CONFIG ENDPOINTS
// =====================================================
GET    /api/v1/bot/config                 // Configurações
PUT    /api/v1/bot/config/:key            // Atualizar config
GET    /api/v1/bot/flows                  // Fluxos do bot

// =====================================================
// METRICS ENDPOINTS
// =====================================================
GET    /api/v1/metrics/overview           // Visão geral
GET    /api/v1/metrics/attendance         // Métricas de atendimento
GET    /api/v1/metrics/export             // Exportar relatório
```

### Exemplo de Código - Auth Service

```typescript
// src/modules/auth/auth.service.ts
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '@/shared/database/prisma.client';
import { AppError } from '@/shared/utils/errors';

interface LoginDTO {
  email: string;
  password: string;
}

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export class AuthService {
  async login(data: LoginDTO) {
    // Buscar usuário
    const user = await prisma.users.findUnique({
      where: { email: data.email }
    });

    if (!user || !user.is_active) {
      throw new AppError('Credenciais inválidas', 401);
    }

    // Verificar senha
    const passwordMatch = await bcrypt.compare(
      data.password,
      user.password_hash
    );

    if (!passwordMatch) {
      throw new AppError('Credenciais inválidas', 401);
    }

    // Gerar tokens
    const accessToken = this.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    const refreshToken = this.generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    // Atualizar último login
    await prisma.users.update({
      where: { id: user.id },
      data: { last_login_at: new Date() }
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        avatar_url: user.avatar_url
      },
      accessToken,
      refreshToken
    };
  }

  private generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: '15m' // 15 minutos
    });
  }

  private generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
      expiresIn: '7d' // 7 dias
    });
  }

  async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET!
      ) as TokenPayload;

      // Verificar se usuário ainda existe e está ativo
      const user = await prisma.users.findUnique({
        where: { id: decoded.userId }
      });

      if (!user || !user.is_active) {
        throw new AppError('Token inválido', 401);
      }

      // Gerar novo access token
      const newAccessToken = this.generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role
      });

      return { accessToken: newAccessToken };
    } catch (error) {
      throw new AppError('Token inválido ou expirado', 401);
    }
  }
}
```

### Exemplo de Código - WhatsApp Webhook

```typescript
// src/modules/whatsapp/whatsapp.webhook.ts
import { Request, Response } from 'express';
import { whatsappService } from './whatsapp.service';
import { botService } from '@/modules/bot/bot.service';
import { conversationsService } from '@/modules/conversations/conversations.service';
import { messagesService } from '@/modules/messages/messages.service';
import { socketServer } from '@/websocket/socket.server';
import { logger } from '@/shared/utils/logger';

export class WhatsAppWebhook {
  // Verificação do webhook (GET)
  verify(req: Request, res: Response) {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
      logger.info('Webhook verificado com sucesso');
      return res.status(200).send(challenge);
    }

    return res.status(403).send('Forbidden');
  }

  // Receber mensagens (POST)
  async receive(req: Request, res: Response) {
    try {
      const { entry } = req.body;

      // Responder imediatamente (webhook precisa ser rápido)
      res.status(200).send('EVENT_RECEIVED');

      // Processar mensagens de forma assíncrona
      for (const item of entry) {
        const changes = item.changes;

        for (const change of changes) {
          if (change.field === 'messages') {
            await this.processMessage(change.value);
          }
        }
      }
    } catch (error) {
      logger.error('Erro no webhook WhatsApp:', error);
      res.status(500).send('Internal Server Error');
    }
  }

  private async processMessage(data: any) {
    const messages = data.messages;
    if (!messages || messages.length === 0) return;

    const message = messages[0];
    const phoneNumber = message.from;
    const messageText = message.text?.body || '';
    const messageId = message.id;

    logger.info(`Mensagem recebida de ${phoneNumber}: ${messageText}`);

    try {
      // 1. Buscar ou criar cliente
      const customer = await this.getOrCreateCustomer(
        phoneNumber,
        data.contacts?.[0]?.profile?.name
      );

      // 2. Buscar ou criar conversa
      const conversation = await conversationsService.getOrCreate(customer.id);

      // 3. Salvar mensagem
      const savedMessage = await messagesService.create({
        conversation_id: conversation.id,
        sender_type: 'customer',
        content: messageText,
        whatsapp_message_id: messageId
      });

      // 4. Notificar via WebSocket
      socketServer.emitNewMessage(conversation.id, savedMessage);

      // 5. Processar resposta
      if (conversation.is_bot_active) {
        // Bot responde
        const botResponse = await botService.processMessage(
          conversation,
          messageText
        );

        if (botResponse) {
          // Enviar via WhatsApp
          await whatsappService.sendMessage(phoneNumber, botResponse.message);

          // Salvar no DB
          const botMessage = await messagesService.create({
            conversation_id: conversation.id,
            sender_type: 'bot',
            content: botResponse.message
          });

          // Notificar via WebSocket
          socketServer.emitNewMessage(conversation.id, botMessage);
        }
      } else {
        // Modo atendente humano - apenas notificar
        logger.info(`Conversa ${conversation.id} em modo atendente humano`);
      }
    } catch (error) {
      logger.error('Erro ao processar mensagem:', error);
    }
  }

  private async getOrCreateCustomer(phoneNumber: string, name?: string) {
    // Implementação...
  }
}
```

---

## 7. 🎨 FRONTEND - DASHBOARD {#frontend}

### Estrutura de Pastas

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/               # Componentes shadcn/ui
│   │   ├── layouts/
│   │   │   ├── DashboardLayout.tsx
│   │   │   └── AuthLayout.tsx
│   │   ├── chat/
│   │   │   ├── ConversationList.tsx
│   │   │   ├── ChatWindow.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   └── MessageInput.tsx
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   └── common/
│   │       ├── Header.tsx
│   │       ├── Sidebar.tsx
│   │       └── LoadingSpinner.tsx
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Conversations.tsx
│   │   ├── Metrics.tsx
│   │   └── Settings.tsx
│   ├── services/
│   │   ├── api.ts
│   │   ├── auth.service.ts
│   │   ├── conversations.service.ts
│   │   ├── messages.service.ts
│   │   └── socket.service.ts
│   ├── store/
│   │   ├── authStore.ts
│   │   ├── conversationsStore.ts
│   │   └── messagesStore.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useConversations.ts
│   │   ├── useMessages.ts
│   │   └── useWebSocket.ts
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   ├── formatters.ts
│   │   └── validators.ts
│   ├── App.tsx
│   └── main.tsx
├── public/
├── .env.example
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

### Exemplo de Componente - Chat Window

```typescript
// src/components/chat/ChatWindow.tsx
import React, { useEffect, useRef } from 'react';
import { useMessages } from '@/hooks/useMessages';
import { useWebSocket } from '@/hooks/useWebSocket';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface ChatWindowProps {
  conversationId: string;
  onTakeover: () => void;
  onEnd: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversationId,
  onTakeover,
  onEnd
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, loading, sendMessage } = useMessages(conversationId);
  const { subscribe } = useWebSocket();

  useEffect(() => {
    // Inscrever-se para novos eventos da conversa
    const unsubscribe = subscribe(`conversation:${conversationId}`, (data) => {
      if (data.type === 'new_message') {
        // Hook já atualiza automaticamente via React Query
      }
    });

    return () => unsubscribe();
  }, [conversationId, subscribe]);

  useEffect(() => {
    // Auto-scroll para a última mensagem
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    await sendMessage(text);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h2 className="text-lg font-semibold">
            {conversation.customer_name}
          </h2>
          <p className="text-sm text-gray-500">
            {conversation.is_bot_active ? '🤖 Bot' : '👤 Atendente'}
          </p>
        </div>
        <div className="flex gap-2">
          {conversation.is_bot_active ? (
            <Button onClick={onTakeover}>
              Assumir Atendimento
            </Button>
          ) : (
            <Button onClick={onEnd} variant="destructive">
              Finalizar
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <MessageInput
          onSend={handleSendMessage}
          disabled={conversation.is_bot_active}
          placeholder={
            conversation.is_bot_active
              ? 'Assuma o atendimento para enviar mensagens'
              : 'Digite sua mensagem...'
          }
        />
      </div>
    </div>
  );
};
```

### Exemplo de Hook - WebSocket

```typescript
// src/hooks/useWebSocket.ts
import { useEffect, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';

let socket: Socket | null = null;

export const useWebSocket = () => {
  const { token } = useAuthStore();

  useEffect(() => {
    if (!token) return;

    // Conectar ao WebSocket
    socket = io(import.meta.env.VITE_WS_URL, {
      auth: { token }
    });

    socket.on('connect', () => {
      console.log('✅ WebSocket conectado');
    });

    socket.on('disconnect', () => {
      console.log('❌ WebSocket desconectado');
    });

    socket.on('error', (error) => {
      console.error('Erro no WebSocket:', error);
    });

    return () => {
      socket?.disconnect();
      socket = null;
    };
  }, [token]);

  const subscribe = useCallback((event: string, callback: (data: any) => void) => {
    if (!socket) return () => {};

    socket.on(event, callback);

    return () => {
      socket?.off(event, callback);
    };
  }, []);

  const emit = useCallback((event: string, data: any) => {
    socket?.emit(event, data);
  }, []);

  return { subscribe, emit };
};
```

---

## 8. 🔐 SISTEMA DE AUTENTICAÇÃO {#autenticação}

### Fluxo de Autenticação

```
1. LOGIN
   Frontend → POST /api/v1/auth/login
   Backend → Valida credenciais
   Backend → Gera JWT (access + refresh)
   Frontend → Armazena tokens

2. REQUISIÇÕES AUTENTICADAS
   Frontend → Adiciona header: Authorization: Bearer {token}
   Backend → Middleware valida token
   Backend → Extrai user_id e role
   Backend → Processa requisição

3. TOKEN EXPIRADO
   Frontend → Detecta 401
   Frontend → POST /api/v1/auth/refresh-token
   Backend → Valida refresh token
   Backend → Gera novo access token
   Frontend → Retenta requisição original

4. LOGOUT
   Frontend → POST /api/v1/auth/logout
   Backend → Invalida tokens (blacklist)
   Frontend → Remove tokens locais
```

### Middleware de Autenticação

```typescript
// src/modules/auth/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '@/shared/utils/errors';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Extrair token do header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Token não fornecido', 401);
    }

    const token = authHeader.substring(7); // Remove "Bearer "

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      email: string;
      role: string;
    };

    // Adicionar dados do usuário na requisição
    req.user = decoded;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError('Token inválido', 401);
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError('Token expirado', 401);
    }
    throw error;
  }
};

// Middleware de autorização por role
export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('Não autenticado', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError('Sem permissão', 403);
    }

    next();
  };
};
```

### Frontend - Auth Store (Zustand)

```typescript
// src/store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  avatar_url?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const response = await fetch('/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
          throw new Error('Falha no login');
        }

        const data = await response.json();

        set({
          user: data.user,
          token: data.accessToken,
          refreshToken: data.refreshToken,
          isAuthenticated: true
        });
      },

      logout: () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false
        });
      },

      setUser: (user) => set({ user }),

      setTokens: (accessToken, refreshToken) =>
        set({ token: accessToken, refreshToken })
    }),
    {
      name: 'auth-storage'
    }
  )
);
```

---

## 9. 💬 INTEGRAÇÃO WHATSAPP {#whatsapp}

### Configuração da Meta Business API

1. **Criar App no Meta Developers**
   - Acesse: https://developers.facebook.com
   - Crie um app Business
   - Adicione o produto WhatsApp

2. **Configurar Webhook**
   ```
   Callback URL: https://seu-dominio.com/api/v1/webhooks/whatsapp
   Verify Token: {gere um token aleatório}
   Inscreva-se em: messages
   ```

3. **Obter Credenciais**
   - Phone Number ID
   - WhatsApp Business Account ID
   - Access Token (permanente)

### Service de Envio

```typescript
// src/modules/whatsapp/whatsapp.service.ts
import axios from 'axios';
import { logger } from '@/shared/utils/logger';

export class WhatsAppService {
  private readonly apiUrl = 'https://graph.facebook.com/v18.0';
  private readonly phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
  private readonly accessToken = process.env.WHATSAPP_ACCESS_TOKEN!;

  async sendMessage(to: string, message: string) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: to,
          type: 'text',
          text: { body: message }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info(`Mensagem enviada para ${to}`);
      return response.data;
    } catch (error) {
      logger.error('Erro ao enviar mensagem WhatsApp:', error);
      throw error;
    }
  }

  async sendTemplate(to: string, templateName: string, components: any[]) {
    // Enviar template aprovado
  }

  async sendMedia(to: string, mediaUrl: string, mediaType: 'image' | 'audio' | 'document') {
    // Enviar mídia
  }

  async markAsRead(messageId: string) {
    // Marcar mensagem como lida
  }
}
```

---

## 10. 🔌 WEBSOCKET PARA TEMPO REAL {#websocket}

### Servidor WebSocket

```typescript
// src/websocket/socket.server.ts
import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { logger } from '@/shared/utils/logger';
import { redis } from '@/config/redis';

export class SocketServer {
  private io: SocketIOServer;

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL,
        credentials: true
      }
    });

    this.setupMiddleware();
    this.setupHandlers();
  }

  private setupMiddleware() {
    // Autenticação via JWT
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Token não fornecido'));
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
          userId: string;
        };

        socket.data.userId = decoded.userId;
        next();
      } catch (error) {
        next(new Error('Token inválido'));
      }
    });
  }

  private setupHandlers() {
    this.io.on('connection', async (socket) => {
      const userId = socket.data.userId;
      logger.info(`👤 Usuário ${userId} conectado ao WebSocket`);

      // Salvar mapeamento user → socket no Redis
      await redis.set(`socket:user:${userId}`, socket.id);
      await redis.sadd('online:attendants', userId);

      // Juntar-se a sala do usuário
      socket.join(`user:${userId}`);

      // Handler: inscrever-se em conversa
      socket.on('subscribe:conversation', (conversationId: string) => {
        socket.join(`conversation:${conversationId}`);
        logger.info(`Usuário ${userId} inscrito na conversa ${conversationId}`);
      });

      // Handler: desinscrever-se de conversa
      socket.on('unsubscribe:conversation', (conversationId: string) => {
        socket.leave(`conversation:${conversationId}`);
      });

      // Handler: atendente está digitando
      socket.on('typing', (conversationId: string) => {
        socket.to(`conversation:${conversationId}`).emit('user_typing', {
          userId,
          conversationId
        });
      });

      // Desconexão
      socket.on('disconnect', async () => {
        logger.info(`👋 Usuário ${userId} desconectado`);
        await redis.del(`socket:user:${userId}`);
        await redis.srem('online:attendants', userId);
      });
    });
  }

  // Emitir nova mensagem para todos na conversa
  emitNewMessage(conversationId: string, message: any) {
    this.io.to(`conversation:${conversationId}`).emit('new_message', message);
  }

  // Emitir atualização de conversa
  emitConversationUpdate(conversationId: string, data: any) {
    this.io.to(`conversation:${conversationId}`).emit('conversation_update', data);
  }

  // Notificar usuário específico
  async notifyUser(userId: string, event: string, data: any) {
    const socketId = await redis.get(`socket:user:${userId}`);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
    }
  }

  // Broadcast para todos atendentes online
  async broadcastToAttendants(event: string, data: any) {
    const attendants = await redis.smembers('online:attendants');
    for (const userId of attendants) {
      await this.notifyUser(userId, event, data);
    }
  }
}
```

---

## 11. 🚀 INFRAESTRUTURA E DEPLOY {#infraestrutura}

### Docker Compose - Desenvolvimento

```yaml
# docker-compose.yml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: whatsapp-postgres
    environment:
      POSTGRES_DB: whatsapp_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres123
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: whatsapp-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: whatsapp-backend
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://postgres:postgres123@postgres:5432/whatsapp_db
      REDIS_URL: redis://redis:6379
      JWT_SECRET: your-super-secret-key-change-in-production
      JWT_REFRESH_SECRET: your-refresh-secret-key
      WHATSAPP_PHONE_NUMBER_ID: your-phone-number-id
      WHATSAPP_ACCESS_TOKEN: your-access-token
      OPENAI_API_KEY: your-openai-key
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./backend:/app
      - /app/node_modules
    command: npm run dev

  # Frontend Dashboard
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: whatsapp-frontend
    environment:
      VITE_API_URL: http://localhost:3000/api/v1
      VITE_WS_URL: http://localhost:3000
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    command: npm run dev

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: whatsapp-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - backend
      - frontend

volumes:
  postgres_data:
  redis_data:
```

### Nginx Configuration

```nginx
# nginx/nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:3000;
    }

    upstream frontend {
        server frontend:5173;
    }

    server {
        listen 80;
        server_name seu-dominio.com;

        # Redirect to HTTPS
        return 301 https://$host$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name seu-dominio.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;

        # API Backend
        location /api/ {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # WebSocket
        location /socket.io/ {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
```

### Deploy em Produção (AWS)

```yaml
# Arquitetura AWS Recomendada:
# - EC2: t3.medium (2 vCPU, 4GB RAM) - $30/mês
# - RDS PostgreSQL: db.t3.micro - $15/mês
# - ElastiCache Redis: cache.t3.micro - $12/mês
# - Application Load Balancer - $20/mês
# - Route 53 + Certificate Manager - $1/mês
# Total estimado: ~$80/mês

# Ou DigitalOcean (mais simples):
# - Droplet: 2 vCPU, 4GB RAM - $24/mês
# - Managed PostgreSQL: 1GB - $15/mês
# - Managed Redis: 1GB - $15/mês
# Total estimado: ~$55/mês
```

---

## 12. 🗂️ ESTRUTURA COMPLETA DE PASTAS {#estrutura-pastas}

```
whatsapp-system/
├── backend/
│   ├── src/
│   ├── tests/
│   ├── prisma/
│   ├── Dockerfile
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   ├── public/
│   ├── Dockerfile
│   ├── .env.example
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── nginx/
│   ├── nginx.conf
│   └── ssl/
├── docs/
│   ├── API.md
│   ├── ARCHITECTURE.md
│   └── DEPLOY.md
├── scripts/
│   ├── setup.sh
│   ├── deploy.sh
│   └── backup.sh
├── docker-compose.yml
├── docker-compose.prod.yml
├── .gitignore
└── README.md
```

---

## 13. 🔄 FLUXOS DE DADOS {#fluxos}

### Fluxo 1: Cliente Envia Mensagem

```
1. Cliente → WhatsApp → Meta API
2. Meta API → Webhook → Backend (/api/v1/webhooks/whatsapp)
3. Backend:
   a. Valida webhook
   b. Extrai dados da mensagem
   c. Busca ou cria customer no PostgreSQL
   d. Busca ou cria conversation no PostgreSQL
   e. Salva message no PostgreSQL
   f. Publica evento no Redis
   g. Emite via WebSocket para frontend
4. Backend (se bot ativo):
   a. Processa com botService
   b. Consulta OpenAI (se necessário)
   c. Gera resposta
   d. Envia via WhatsApp API
   e. Salva resposta no PostgreSQL
   f. Emite via WebSocket
5. Frontend: Atualiza UI em tempo real
```

### Fluxo 2: Atendente Assume Conversa

```
1. Frontend → Click "Assumir" → POST /api/v1/conversations/:id/takeover
2. Backend:
   a. Valida autenticação
   b. Atualiza conversation (is_bot_active = false, assigned_user_id = user.id)
   c. Cria registro em conversation_transfers
   d. Salva mensagem de sistema
   e. Publica evento no Redis
   f. Emite via WebSocket
3. Frontend: Atualiza status da conversa
4. Backend → WhatsApp API: Envia mensagem notificando cliente
```

### Fluxo 3: Atendente Envia Mensagem

```
1. Frontend → Input → POST /api/v1/messages
2. Backend:
   a. Valida autenticação e permissões
   b. Verifica se conversa está em modo humano
   c. Salva message no PostgreSQL
   d. Envia via WhatsApp API
   e. Publica evento no Redis
   f. Emite via WebSocket
3. WhatsApp API → Cliente recebe mensagem
4. Frontend: Atualiza chat com mensagem enviada
```

---

## 14. 🔒 SEGURANÇA {#segurança}

### Checklist de Segurança

```markdown
✅ AUTENTICAÇÃO
- [x] JWT com expiração curta (15min)
- [x] Refresh tokens seguros (7 dias)
- [x] Senhas hasheadas com bcrypt (12 rounds)
- [x] Rate limiting no login (5 tentativas / 15min)
- [x] Logout com invalidação de tokens

✅ AUTORIZAÇÃO
- [x] RBAC (Role-Based Access Control)
- [x] Verificação de permissões em cada endpoint
- [x] Isolamento de dados por atendente

✅ API
- [x] HTTPS obrigatório
- [x] CORS configurado corretamente
- [x] Rate limiting global (100 req/min)
- [x] Validação de inputs (Zod)
- [x] Sanitização de dados
- [x] Headers de segurança (Helmet.js)

✅ BANCO DE DADOS
- [x] Prepared statements (proteção SQL Injection)
- [x] Backups automáticos diários
- [x] Criptografia em repouso
- [x] Conexões SSL

✅ WEBSOCKET
- [x] Autenticação via JWT
- [x] Validação de eventos
- [x] Rate limiting de mensagens

✅ INFRAESTRUTURA
- [x] Firewall configurado
- [x] Portas desnecessárias fechadas
- [x] SSL/TLS atualizado
- [x] Logs de auditoria
- [x] Monitoramento de intrusão

✅ COMPLIANCE
- [x] LGPD: Consentimento e privacidade
- [x] Logs de acesso a dados pessoais
- [x] Política de retenção de dados
- [x] Direito ao esquecimento
```

### Variáveis de Ambiente Seguras

```bash
# .env.example
NODE_ENV=production

# Database
DATABASE_URL=postgresql://user:pass@host:5432/db
DATABASE_POOL_SIZE=20

# Redis
REDIS_URL=redis://host:6379
REDIS_PASSWORD=strong-redis-password

# JWT
JWT_SECRET=super-secret-key-min-32-chars
JWT_REFRESH_SECRET=another-super-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# WhatsApp
WHATSAPP_PHONE_NUMBER_ID=123456789
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxxx
WEBHOOK_VERIFY_TOKEN=random-token-here

# OpenAI
OPENAI_API_KEY=sk-xxxxxxxxxxxxx

# URLs
FRONTEND_URL=https://app.seudominio.com
BACKEND_URL=https://api.seudominio.com

# Security
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
BCRYPT_ROUNDS=12

# Monitoring
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

---

## 15. ⚡ PERFORMANCE E ESCALABILIDADE {#performance}

### Otimizações de Performance

#### Backend
```typescript
// 1. Database Query Optimization
// Usar índices corretos
// Evitar N+1 queries
// Usar select específico
const conversations = await prisma.conversations.findMany({
  where: { status: 'open' },
  select: {
    id: true,
    customer: {
      select: { name: true, phone_number: true }
    },
    last_message_at: true
  },
  orderBy: { last_message_at: 'desc' },
  take: 50
});

// 2. Cache Strategy
// Cache de configurações (1 hora)
const config = await redis.get(`cache:bot_config:${key}`);
if (!config) {
  const dbConfig = await prisma.bot_configurations.findUnique({
    where: { key }
  });
  await redis.setex(`cache:bot_config:${key}`, 3600, JSON.stringify(dbConfig));
}

// 3. Message Queue
// Processar mensagens assincronamente
import Bull from 'bull';

const messageQueue = new Bull('messages', {
  redis: { host: 'localhost', port: 6379 }
});

messageQueue.process(async (job) => {
  const { messageId } = job.data;
  await processMessage(messageId);
});

// 4. Connection Pooling
// PostgreSQL pool
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});
```

#### Frontend
```typescript
// 1. React Query - Cache e Background Updates
const { data: conversations } = useQuery({
  queryKey: ['conversations'],
  queryFn: fetchConversations,
  refetchInterval: 30000, // 30 segundos
  staleTime: 10000 // 10 segundos
});

// 2. Virtual Scrolling - Lista de mensagens
import { useVirtualizer } from '@tanstack/react-virtual';

const virtualizer = useVirtualizer({
  count: messages.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 60
});

// 3. Code Splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Metrics = lazy(() => import('./pages/Metrics'));

// 4. Memoização
const MessageList = memo(({ messages }) => {
  return messages.map(msg => <Message key={msg.id} {...msg} />);
});
```

### Escalabilidade Horizontal

```yaml
# docker-compose.scale.yml
# Escalar backend para 3 instâncias:
# docker-compose up --scale backend=3

version: '3.8'

services:
  backend:
    build: ./backend
    environment:
      - NODE_ENV=production
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    depends_on:
      - backend
    volumes:
      - ./nginx/load-balancer.conf:/etc/nginx/nginx.conf
```

### Load Balancer Config

```nginx
# nginx/load-balancer.conf
upstream backend_servers {
    least_conn; # Distribui para servidor com menos conexões
    server backend_1:3000 max_fails=3 fail_timeout=30s;
    server backend_2:3000 max_fails=3 fail_timeout=30s;
    server backend_3:3000 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;

    location / {
        proxy_pass http://backend_servers;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 16. 💰 CUSTOS ESTIMADOS {#custos}

### Custos Mensais (10 atendentes)

#### Infraestrutura Cloud

**Opção 1: AWS (Profissional)**
```
EC2 t3.medium (Backend)          $30.00
RDS PostgreSQL db.t3.micro       $15.00
ElastiCache Redis t3.micro       $12.00
Application Load Balancer        $20.00
S3 (backups)                     $ 5.00
CloudWatch (logs)                $ 3.00
Route 53 + ACM                   $ 1.00
Data Transfer (50GB)             $10.00
─────────────────────────────────
TOTAL AWS                        $96.00/mês
```

**Opção 2: DigitalOcean (Custo-Benefício)**
```
Droplet 2 vCPU, 4GB RAM          $24.00
Managed PostgreSQL 1GB           $15.00
Managed Redis 1GB                $15.00
Load Balancer                    $12.00
Backups                          $ 5.00
Bandwidth (1TB incluído)         $ 0.00
─────────────────────────────────
TOTAL DigitalOcean               $71.00/mês
```

**Opção 3: VPS Simples (Startup)**
```
VPS 4 vCPU, 8GB RAM              $40.00
Backups                          $ 5.00
Domain + SSL                     $ 2.00
─────────────────────────────────
TOTAL VPS                        $47.00/mês
```

#### APIs e Serviços

```
WhatsApp Business API (Meta)     GRÁTIS (primeiros 1000/mês)
                                 $0.005 - $0.05 por msg adicional

OpenAI API
  - GPT-4 Turbo                  $0.01 / 1K tokens (input)
  - GPT-4 Turbo                  $0.03 / 1K tokens (output)
  - Estimativa: 50k conversas    ~$150.00/mês
  
  OU
  
  - GPT-3.5 Turbo                $0.0005 / 1K tokens (input)
  - GPT-3.5 Turbo                $0.0015 / 1K tokens (output)
  - Estimativa: 50k conversas    ~$15.00/mês

Sentry (Monitoring)              $26.00/mês (plano Team)
SendGrid (Email)                 GRÁTIS (até 100/dia)
─────────────────────────────────
TOTAL APIs                       $15 - $176/mês
```

### Custo Total Mensal

```
┌────────────────────────────────────────────────┐
│              RESUMO DE CUSTOS                   │
├────────────────────────────────────────────────┤
│                                                 │
│  Infraestrutura (DigitalOcean)    $71.00       │
│  OpenAI API (GPT-3.5)             $15.00       │
│  WhatsApp API                     $ 0.00*      │
│  Monitoring                       $26.00       │
│                                                 │
├────────────────────────────────────────────────┤
│  TOTAL MENSAL                    $112.00       │
└────────────────────────────────────────────────┘

* Grátis até 1000 conversas/mês
```

### Custos de Desenvolvimento

```
Desenvolvedor Full Stack (3 meses)
  - Backend + Frontend + Integrações
  - 3 meses × $5.000 = $15.000

OU

Time (2 meses)
  - 1 Backend Developer  = $6.000
  - 1 Frontend Developer = $6.000
  - 1 DevOps            = $4.000
  ──────────────────────────────
  TOTAL                 = $16.000

OU

Freelancers (2-3 meses)
  - Backend (Node.js)    = $4.000
  - Frontend (React)     = $3.000
  - DevOps/Deploy       = $1.500
  - Design/UX           = $1.000
  ──────────────────────────────
  TOTAL                 = $9.500
```

---

## 17. 🗺️ ROADMAP DE IMPLEMENTAÇÃO {#roadmap}

### Fase 1: Setup e Infraestrutura (Semana 1)

```markdown
✅ DIA 1-2: Ambiente de Desenvolvimento
- [ ] Criar repositório Git
- [ ] Configurar Docker Compose
- [ ] Setup PostgreSQL + Redis
- [ ] Criar estrutura de pastas
- [ ] Configurar TypeScript

✅ DIA 3-4: Database
- [ ] Desenhar schema
- [ ] Criar migrations (Prisma)
- [ ] Popular dados de teste
- [ ] Criar índices

✅ DIA 5-7: Backend Base
- [ ] Setup Express/Fastify
- [ ] Configurar middleware (CORS, Helmet, etc)
- [ ] Implementar logger
- [ ] Health check endpoint
```

### Fase 2: Autenticação (Semana 2)

```markdown
✅ DIA 8-10: Auth Backend
- [ ] Sistema de JWT
- [ ] Endpoints de auth
- [ ] Middleware de autenticação
- [ ] Testes unitários

✅ DIA 11-14: Auth Frontend
- [ ] Setup React + Vite
- [ ] Tela de login
- [ ] Auth context/store
- [ ] Protected routes
- [ ] Interceptor HTTP
```

### Fase 3: WhatsApp + Bot (Semana 3-4)

```markdown
✅ DIA 15-18: Integração WhatsApp
- [ ] Configurar Meta Business API
- [ ] Webhook handler
- [ ] Service de envio de mensagens
- [ ] Testar recebimento/envio

✅ DIA 19-22: Bot Inteligente
- [ ] Sistema de menus
- [ ] Integração OpenAI
- [ ] Flows configuráveis
- [ ] Testes

✅ DIA 23-28: Gerenciamento de Conversas
- [ ] CRUD de conversations
- [ ] CRUD de messages
- [ ] Lógica de transferência bot→humano
- [ ] Endpoints REST
```

### Fase 4: Dashboard Frontend (Semana 5-6)

```markdown
✅ DIA 29-33: UI Base
- [ ] Layout do dashboard
- [ ] Componentes UI (shadcn)
- [ ] Lista de conversas
- [ ] Sidebar + Header

✅ DIA 34-38: Chat Interface
- [ ] Chat window
- [ ] Message bubbles
- [ ] Input de mensagem
- [ ] Upload de mídia

✅ DIA 39-42: Features Avançadas
- [ ] Busca e filtros
- [ ] Notificações
- [ ] Status online/offline
- [ ] Perfil do atendente
```

### Fase 5: WebSocket (Semana 7)

```markdown
✅ DIA 43-45: Backend WebSocket
- [ ] Setup Socket.io
- [ ] Sistema de rooms
- [ ] Eventos (new_message, typing, etc)
- [ ] Autenticação WS

✅ DIA 46-49: Frontend WebSocket
- [ ] Conexão WebSocket
- [ ] Handlers de eventos
- [ ] Atualização em tempo real
- [ ] Reconnection logic
```

### Fase 6: Métricas e Admin (Semana 8)

```markdown
✅ DIA 50-53: Sistema de Métricas
- [ ] Coleta de métricas
- [ ] Aggregação de dados
- [ ] Endpoints de relatórios
- [ ] Exportação (CSV/PDF)

✅ DIA 54-56: Painel Admin
- [ ] Dashboard de métricas
- [ ] Gerenciamento de usuários
- [ ] Configurações do bot
- [ ] Logs e auditoria
```

### Fase 7: Testes e Qualidade (Semana 9)

```markdown
✅ DIA 57-60: Testes
- [ ] Testes unitários (80% coverage)
- [ ] Testes de integração
- [ ] Testes E2E (Cypress/Playwright)
- [ ] Load testing (k6)

✅ DIA 61-63: Code Quality
- [ ] Linting (ESLint)
- [ ] Formatação (Prettier)
- [ ] Code review
- [ ] Refactoring
```

### Fase 8: Deploy e Produção (Semana 10)

```markdown
✅ DIA 64-66: Infraestrutura
- [ ] Configurar servidor
- [ ] Setup Nginx
- [ ] SSL/HTTPS
- [ ] Backup automático

✅ DIA 67-68: CI/CD
- [ ] GitHub Actions
- [ ] Deploy automático
- [ ] Rollback strategy

✅ DIA 69-70: Monitoramento
- [ ] Setup Sentry
- [ ] Logs centralizados
- [ ] Alertas
- [ ] Documentação final
```

### Cronograma Visual

```
Mês 1: Setup + Auth + WhatsApp + Bot
│████████████████████████████│ 100%
│ Sem 1-4                     │

Mês 2: Dashboard + WebSocket + Métricas
│████████████████████████████│ 100%
│ Sem 5-8                     │

Mês 3: Testes + Deploy + Refinamento
│███████████████░░░░░░░░░░░░│ 70%
│ Sem 9-10                    │

TOTAL: 10 semanas (2.5 meses)
```

---

## 📚 RECURSOS ADICIONAIS

### Documentação Oficial

- **Node.js**: https://nodejs.org/docs
- **Express**: https://expressjs.com
- **Prisma**: https://prisma.io/docs
- **React**: https://react.dev
- **Socket.io**: https://socket.io/docs
- **WhatsApp Business API**: https://developers.facebook.com/docs/whatsapp
- **OpenAI**: https://platform.openai.com/docs

### Bibliotecas Úteis

```json
{
  "backend": {
    "express": "Framework web",
    "prisma": "ORM",
    "zod": "Validação",
    "bcrypt": "Hash de senhas",
    "jsonwebtoken": "JWT",
    "socket.io": "WebSocket",
    "axios": "HTTP client",
    "winston": "Logging",
    "helmet": "Security headers",
    "express-rate-limit": "Rate limiting",
    "bull": "Job queue"
  },
  "frontend": {
    "react": "UI framework",
    "react-router-dom": "Routing",
    "zustand": "State management",
    "react-query": "Data fetching",
    "axios": "HTTP client",
    "socket.io-client": "WebSocket",
    "react-hook-form": "Forms",
    "tailwindcss": "CSS",
    "shadcn/ui": "Components",
    "lucide-react": "Icons"
  }
}
```

---

## ✅ CONCLUSÃO

Este documento fornece um **blueprint completo** para construir um sistema profissional de atendimento WhatsApp com:

✅ **Arquitetura escalável** (10+ atendentes)
✅ **Stack moderna** (Node.js + React + PostgreSQL)
✅ **Autenticação segura** (JWT)
✅ **Tempo real** (WebSocket)
✅ **IA integrada** (OpenAI)
✅ **Deploy pronto** (Docker + Nginx)
✅ **Custos claros** (~$112/mês)
✅ **Timeline realista** (2.5 meses)

### Próximos Passos

1. **Revisar** este documento
2. **Definir** prioridades (MVP vs Full)
3. **Escolher** stack (confirmação)
4. **Montar** time ou contratar
5. **Iniciar** desenvolvimento!

Bom desenvolvimento! 🚀
Prioridade Alta

  1. Bot Config API — GET/PUT /api/v1/bot/config, GET /api/v1/bot/flows — configurar mensagens do bot pelo painel sem
  mexer no código
  2. Métricas/Dashboard — GET /api/v1/metrics/overview, /metrics/attendance, /metrics/export — a página Metrics no
  frontend é placeholder, sem dados reais
  3. Suporte a mídia — o sistema só trata mensagens de texto. A doc prevê imagens, áudio, documentos e vídeo via
  WhatsApp
  4. Status online/offline dos atendentes visível no frontend (Redis já rastreia, mas o frontend não exibe)

  Prioridade Média

  5. Integração OpenAI/IA — bot.ai.ts existe como stub mas não está conectado ao fluxo do bot com departamentos
  6. Busca e filtros avançados na lista de conversas (por nome do cliente, data, texto)
  7. Edição de perfil do usuário no frontend (trocar nome, avatar, senha)
  8. Exportação de relatórios — CSV/PDF das métricas e atendimentos
  9. Fila de mensagens (Bull/BullMQ) — dependência existe no package.json mas não é usada para processamento assíncrono

  Prioridade Baixa

  10. Testes — Jest configurado mas nenhum teste escrito (unitários, integração, e2e)
  11. CI/CD — sem GitHub Actions ou pipeline de deploy automatizado
  12. Monitoramento — sem Sentry (erros), Prometheus/Grafana (métricas de infra)
  13. Rate limiting granular — existe básico mas a doc prevê limites por endpoint
  14. Auditoria/logs — logging existe mas sem trail de auditoria estruturado