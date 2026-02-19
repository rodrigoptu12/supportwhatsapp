/* eslint-disable @typescript-eslint/no-explicit-any */
import { jest } from '@jest/globals';
import { Router } from 'express';

const fn = () => jest.fn<(...args: any[]) => any>();

// Create a test router that throws errors for testing error handler
const testRouter = Router();
testRouter.get('/throw-app-error', (_req, _res, next) => {
  const { AppError } = require('@/shared/utils/errors');
  next(new AppError('Test app error', 422));
});
testRouter.get('/throw-generic-error', (_req, _res, next) => {
  next(new Error('Generic error'));
});

jest.mock('@/modules/auth/auth.routes', () => ({ authRoutes: Router() }));
jest.mock('@/modules/conversations/conversations.routes', () => ({ conversationsRoutes: Router() }));
jest.mock('@/modules/messages/messages.routes', () => ({ messagesRoutes: Router() }));
jest.mock('@/modules/users/users.routes', () => ({ usersRoutes: Router() }));
jest.mock('@/modules/whatsapp/whatsapp.routes', () => ({ whatsappRoutes: Router() }));
jest.mock('@/modules/departments/departments.routes', () => ({ departmentsRoutes: Router() }));
jest.mock('@/modules/bot-config/bot-config.routes', () => ({ botConfigRoutes: Router() }));
jest.mock('@/config/env', () => ({
  env: {
    FRONTEND_URL: 'http://localhost:5173',
    RATE_LIMIT_WINDOW_MS: 60000,
    RATE_LIMIT_MAX_REQUESTS: 100,
  },
}));
jest.mock('@/shared/utils/logger', () => ({
  logger: { info: fn(), error: fn(), warn: fn(), debug: fn() },
}));

let app: any;

// Helper to manually invoke express
const invokeApp = (method: string, path: string): Promise<{ status: number; body: any }> => {
  return new Promise((resolve) => {
    const mockReq: any = {
      method: method.toUpperCase(),
      url: path,
      path,
      originalUrl: path,
      baseUrl: '',
      headers: { host: 'localhost' },
      body: {},
      query: {},
      params: {},
      ip: '127.0.0.1',
      get: (h: string) => mockReq.headers[h.toLowerCase()],
      header: (h: string) => mockReq.headers[h.toLowerCase()],
      connection: { remoteAddress: '127.0.0.1' },
      socket: { remoteAddress: '127.0.0.1' },
      route: undefined,
      res: undefined as any,
    };

    const mockRes: any = {
      statusCode: 200,
      _headers: {} as Record<string, any>,
      headersSent: false,
      locals: {},
      status(code: number) { this.statusCode = code; return this; },
      json(data: any) { this.headersSent = true; resolve({ status: this.statusCode, body: data }); return this; },
      send(data: any) { this.headersSent = true; resolve({ status: this.statusCode, body: data }); return this; },
      set(field: string | Record<string, string>, val?: string) {
        if (typeof field === 'object') { Object.assign(this._headers, field); }
        else if (val !== undefined) { this._headers[field.toLowerCase()] = val; }
        return this;
      },
      setHeader(name: string, value: any) { this._headers[name.toLowerCase()] = value; return this; },
      getHeader(name: string) { return this._headers[name.toLowerCase()]; },
      get(name: string) { return this._headers[name.toLowerCase()]; },
      removeHeader() { return this; },
      end() { if (!this.headersSent) { this.headersSent = true; resolve({ status: this.statusCode, body: undefined }); } },
      write() { return true; },
      on() { return this; },
      once() { return this; },
      emit() { return this; },
    };

    mockReq.res = mockRes;

    (app as any).handle(mockReq, mockRes, () => {
      if (!mockRes.headersSent) {
        resolve({ status: mockRes.statusCode, body: undefined });
      }
    });
  });
};

describe('App', () => {
  beforeAll(() => {
    app = require('@/app').app;
    // Mount test routes BEFORE the 404 handler by using a trick:
    // We insert our test router at a specific path
    // Actually, we need to mount before the catch-all. Let's use the app._router
    // The simplest approach: use app.use to add routes (they'll be added after existing ones)
    // But 404 is already registered. So we need to insert before the 404 handler.
    // Express stores handlers in app._router.stack
    const stack = app._router.stack;
    // Remove the last 2 handlers (404 and error handler)
    const errorHandler = stack.pop();
    const notFoundHandler = stack.pop();
    // Add test router
    app.use('/test', testRouter);
    // Re-add the 404 and error handlers
    stack.push(notFoundHandler);
    stack.push(errorHandler);
  });

  it('exports express app', () => {
    expect(app).toBeDefined();
  });

  it('responds to health check', async () => {
    const response = await invokeApp('GET', '/health');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
  });

  it('returns 404 for unknown routes', async () => {
    const response = await invokeApp('GET', '/unknown/route');
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Route not found');
  });

  it('handles AppError in global error handler', async () => {
    const response = await invokeApp('GET', '/test/throw-app-error');
    expect(response.status).toBe(422);
    expect(response.body).toEqual({
      error: 'Test app error',
      statusCode: 422,
    });
  });

  it('handles generic error in global error handler', async () => {
    const response = await invokeApp('GET', '/test/throw-generic-error');
    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: 'Internal server error',
      statusCode: 500,
    });
  });
});
