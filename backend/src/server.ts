import 'dotenv/config';
import http from 'http';
import { app } from './app';
import { env } from './config/env';
import { logger } from './shared/utils/logger';
import { prisma } from './config/database';
import { redis } from './config/redis';
import { initSocketServer } from './websocket/socket.server';

const server = http.createServer(app);

// Initialize WebSocket
initSocketServer(server);

async function start() {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('Database connected');

    // Test Redis connection
    await redis.ping();
    logger.info('Redis connected');

    server.listen(env.PORT, () => {
      logger.info(`Server running on port ${env.PORT}`);
      logger.info(`Environment: ${env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down...');
  await prisma.$disconnect();
  redis.disconnect();
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received. Shutting down...');
  await prisma.$disconnect();
  redis.disconnect();
  server.close(() => {
    process.exit(0);
  });
});

start();
